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

  // --- REFACTOR: LISTENER-FIRST STATE MANAGEMENT ---
  useEffect(() => {
    let mounted = true;

    // Esta función centraliza la lógica de actualización de estado basada en la sesión
    const handleAuthStateChange = async (session: any) => {
      try {
        if (session?.user) {
          // Caso: Sesión activa (Login o Inicialización exitosa)
          const role = await fetchUserRole(session.user.id);
          
          if (mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata.full_name || 'Usuario',
              role: role
            });
            setIsAuthenticated(true);
          }
        } else {
          // Caso: Sin sesión (Logout o Inicialización sin usuario)
          if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error("Error processing auth state change:", error);
        if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
        }
      } finally {
        // CRÍTICO: Siempre desbloquear la UI al terminar el procesamiento del listener
        if (mounted) setLoading(false);
      }
    };

    // Suscripción única a todos los eventos de Auth (INITIAL_SESSION, SIGNED_IN, SIGNED_OUT)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthStateChange(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // --- ACTIONS ---

  const login = async (email: string, pass: string) => {
    // 1. Feedback visual inmediato
    setLoading(true);
    
    try {
        // 2. Invocar API
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
        });
        
        if (error) throw error;
        
        // 3. IMPORTANTE: NO manipulamos user ni loading(false) aquí.
        // El listener 'onAuthStateChange' detectará el evento SIGNED_IN y actualizará la UI.
        // Esto previene race conditions.
    } catch (error) {
        // Solo apagamos el loading manualmente si la llamada a la API falla (el listener no se enterará)
        setLoading(false);
        throw error;
    }
  };

  const logout = useCallback(async () => {
    setLoading(true);
    // Invocamos signOut. El listener detectará el evento SIGNED_OUT y limpiará el estado.
    await supabase.auth.signOut().catch(console.error);
    localStorage.removeItem('castor_user'); // Limpieza auxiliar
  }, []);

  // --- CONTROL DE INACTIVIDAD ---
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