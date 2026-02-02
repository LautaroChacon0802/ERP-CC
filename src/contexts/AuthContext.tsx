import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { AuthState, User, UserRole } from '../types';

const INACTIVITY_LIMIT = 30 * 60 * 1000;

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper para obtener el rol desde la DB de forma segura
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

  // --- INICIALIZACIÓN ROBUSTA (FIX LOGIN LOADING) ---
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Race condition safety: Timeout de 3s para liberar UI si Supabase cuelga
        const timeOutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 3000)
        );

        // 2. Intento de obtener sesión
        const sessionPromise = supabase.auth.getSession();

        const { data: { session }, error } = await Promise.race([
            sessionPromise,
            timeOutPromise
        ]) as any;

        if (error) throw error;

        if (mounted) {
          if (session) {
            const role = await fetchUserRole(session.user.id);
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata.full_name || 'Usuario',
              role: role
            });
            setIsAuthenticated(true);
          } else {
            // Si no hay sesión, limpieza explícita
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.warn("Auth init warning (Network or Timeout):", error);
        // En caso de error o timeout, asumimos logout para dejar al usuario entrar
        if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
        }
      } finally {
        // 3. LA CLAVE: Liberar la UI siempre
        if (mounted) {
            setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listener de cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session) {
        // Si hay sesión, intentamos cargar datos del usuario
        // Nota: Si ya tenemos el usuario cargado, esto podría optimizarse, 
        // pero por seguridad volvemos a verificar el rol
        const role = await fetchUserRole(session.user.id);
        if (mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata.full_name || 'Usuario',
              role: role
            });
            setIsAuthenticated(true);
            setLoading(false);
        }
      } else {
        if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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