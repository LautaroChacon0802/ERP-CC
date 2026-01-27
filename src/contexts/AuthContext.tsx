import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { AuthState, User, UserRole } from '../types';

const INACTIVITY_LIMIT = 30 * 60 * 1000;

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (uid: string): Promise<UserRole> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .maybeSingle();
      
      if (error || !data) return 'user';
      return data.role as UserRole;
    } catch {
      return 'user';
    }
  };

  // --- HARD LOGOUT (REFIX NUCLEAR) ---
  const logout = useCallback(async () => {
    setLoading(true);
    
    // 1. Llamar a signOut sin esperar (Fire and forget para no bloquear UI)
    supabase.auth.signOut().catch(err => console.error("Supabase signOut error:", err));

    // 2. Limpieza inmediata del estado local
    setUser(null);
    setIsAuthenticated(false);
    
    // 3. Limpieza de persistencia
    localStorage.removeItem('castor_user');
    // Intentar limpiar keys de supabase si existen (opcional, por seguridad)
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
        }
    });

    // 4. Desbloqueo y Redirección
    setLoading(false);
    window.location.href = '/';
  }, []);

  // Control de inactividad
  useEffect(() => {
    if (!user) return;
    let timeoutId: NodeJS.Timeout;
    
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
        alert("Sesión cerrada por inactividad.");
      }, INACTIVITY_LIMIT);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(e => document.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(e => document.removeEventListener(e, resetTimer));
    };
  }, [user, logout]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const role = await fetchUserRole(session.user.id);
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata.full_name || 'Usuario',
            role: role
          });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error inicializando auth:", error);
      } finally {
        setLoading(false);
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        if (user?.id === session.user.id) return;
        const role = await fetchUserRole(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata.full_name || 'Usuario',
          role: role
        });
        setIsAuthenticated(true);
        setLoading(false);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []); 

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
        });
        if (error) throw error;
    } catch (error) {
        throw error;
    } finally {
        // FIX: Asegurar desbloqueo de UI tras intento de login
        setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};