import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthState, User, UserRole } from '../types';

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- HELPER ROBUSTO: fetchUserRole ---
  // Nunca lanza error. Si falla, devuelve 'user' por defecto.
  const fetchUserRole = async (uid: string): Promise<UserRole> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .maybeSingle(); // Usamos maybeSingle para no recibir error si no hay filas
      
      if (error) {
        console.warn("AuthContext: Error leyendo rol, asignando 'user'", error.message);
        return 'user';
      }
      
      if (!data) {
        console.warn("AuthContext: Perfil no encontrado, asignando 'user'");
        return 'user';
      }

      return data.role as UserRole;

    } catch (err) {
      console.error("AuthContext: Excepción crítica leyendo rol", err);
      return 'user'; // Fallback seguro
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Obtener Sesión Actual
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          // Intentamos obtener el rol, pero no bloqueamos si falla
          const role = await fetchUserRole(session.user.id);
          
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || 'Usuario',
            role: role 
          });
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error("Error inicializando auth:", e);
        // No seteamos user, queda como null (login screen)
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 2. Escuchar cambios en tiempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Optimización: evitar refetch si el ID no cambió
        if (user?.id === session.user.id) return;

        setLoading(true); // Breve loading mientras traemos el rol
        const role = await fetchUserRole(session.user.id);
        
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || 'Usuario',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencias vacías para mount único

  const login = async (email: string, pass: string) => {
    // Nota: setLoading(true) no es necesario aquí porque el onAuthStateChange lo manejará
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
    // Forzamos limpieza local por si acaso
    localStorage.clear();
    window.location.href = '/';
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