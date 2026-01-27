import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { AuthState, User, UserRole } from '../types';

// Límite de inactividad: 30 minutos (en milisegundos)
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

  // --- HARD LOGOUT (BLINDADO) ---
  const logout = useCallback(async () => {
    // 1. Feedback visual inmediato
    setLoading(true);

    try {
        // 2. Intentar cerrar sesión en servidor (Supabase)
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Error al cerrar sesión en Supabase:", error);
    } catch (e) {
        console.error("Error de red al salir:", e);
    } finally {
        // 3. LIMPIEZA NUCLEAR (Se ejecuta SIEMPRE)
        localStorage.removeItem('castor_user'); // Limpieza de persistencia local si existiera
        setUser(null);
        setIsAuthenticated(false);
        
        // 4. Desbloquear UI (CRÍTICO: Evita que la app quede 'cargando' si hay error)
        setLoading(false);
        
        // 5. Redirección forzada para limpiar memoria
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

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(e => document.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(e => document.removeEventListener(e, resetTimer));
    };
  }, [user, logout]);

  // Check Session Inicial y Listener de Cambios
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
      // Manejo robusto de eventos de sesión
      if (session) {
        // Optimización: si el usuario ya está cargado, no hacer nada
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
        // Manejo explícito de SIGNED_OUT o expiración
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
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
    // El onAuthStateChange manejará la actualización del estado user
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