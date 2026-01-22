import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthState } from '../types';
import { supabase } from '../lib/supabase';

// Límite de inactividad: 30 minutos (en milisegundos)
const INACTIVITY_LIMIT = 30 * 60 * 1000;

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // --- FUNCIÓN LOGOUT REDEFINIDA ---
  // Usamos useCallback para que la función sea estable y no cause re-renders innecesarios
  const logout = useCallback(async () => {
    try {
        // 1. Cerrar sesión en el backend (Supabase)
        await supabase.auth.signOut();
    } catch (error) {
        console.error("Error al cerrar sesión en Supabase:", error);
    } finally {
        // 2. Limpiar almacenamiento local (token de persistencia propio)
        localStorage.removeItem('castor_user');
        
        // 3. Limpiar estado de React
        setUser(null);

        // 4. LIMPIEZA PROFUNDA (Hard Redirect)
        // Esto fuerza al navegador a recargar la página desde cero.
        // Evita que queden datos en memoria y asegura que los inputs de login aparezcan vacíos.
        window.location.href = '/';
    }
  }, []);

  // --- EFECTO DE CONTROL DE INACTIVIDAD ---
  useEffect(() => {
    // Si no hay usuario logueado, no necesitamos timer
    if (!user) return;

    let timeoutId: NodeJS.Timeout;

    // Función que reinicia el contador de 30 minutos
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        console.log("Sesión expirada por inactividad (30 min).");
        logout(); // Ejecuta el logout automático
        alert("Tu sesión ha expirado por seguridad debido a inactividad.");
      }, INACTIVITY_LIMIT);
    };

    // Eventos que consideramos "actividad" del usuario
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    // Escuchar eventos en todo el documento
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Iniciar el timer apenas se monta el componente
    resetTimer();

    // Limpieza: Remover listeners cuando el usuario se desloguea o el componente se desmonta
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [user, logout]); // Se reactiva cada vez que el usuario cambia (login)

  // --- FUNCIÓN LOGIN (Sin cambios mayores, solo persistencia) ---
  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
        });

        if (authError) throw new Error(authError.message);

        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) throw new Error('No se pudo cargar el perfil del usuario.');

        const userData: User = {
            email: profileData.email,
            name: profileData.full_name,
            permissions: profileData.permissions
        };

        setUser(userData);
        localStorage.setItem('castor_user', JSON.stringify(userData));
        
    } catch (err: any) {
        throw new Error(err.message || 'Error al iniciar sesión');
    } finally {
        setLoading(false);
    }
  };

  // Cargar usuario si existe en localStorage al iniciar la app
  useEffect(() => {
    const stored = localStorage.getItem('castor_user');
    if (stored) {
        try {
            setUser(JSON.parse(stored));
        } catch (e) {
            localStorage.removeItem('castor_user');
        }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
        user, 
        isAuthenticated: !!user, 
        login, 
        logout, 
        loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};