import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { AuthState, User, UserRole } from '../types';

// Límite de inactividad: 30 minutos
const INACTIVITY_LIMIT = 30 * 60 * 1000;

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper seguro para obtener el rol
  const fetchUserRole = async (uid: string): Promise<UserRole> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .maybeSingle();
      
      // Si hay error o no hay data, fallback a 'user'
      if (error || !data) return 'user';
      return (data.role as UserRole) || 'user';
    } catch {
      return 'user';
    }
  };

  const logout = useCallback(async () => {
    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error("Error logout:", error);
    } finally {
        localStorage.removeItem('castor_user');
        setUser(null);
        setIsAuthenticated(false);
        window.location.href = '/';
    }
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

    const events = ['mousedown', 'keydown', 'scroll', 'click'];
    events.forEach(e => document.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(e => document.removeEventListener(e, resetTimer));
    };
  }, [user, logout]);

  // Inicialización de Sesión
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata.full_name || 'Usuario',
          role: role
        });
        setIsAuthenticated(true);
      }
      setLoading(false);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Evitar refetch si ya tenemos el usuario cargado
        if (user?.id === session.user.id) return;
        
        const role = await fetchUserRole(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata.full_name || 'Usuario',
          role: role
        });
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, pass: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) {
        setLoading(false);
        throw error;
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};