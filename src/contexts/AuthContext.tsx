import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { supabase } from '../lib/supabase'; // Importamos el cliente de Supabase

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Verificar si hay sesión guardada al iniciar
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

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
        // 1. Autenticación oficial de Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
        });

        if (authError) throw new Error(authError.message);

        // 2. Buscar los permisos en la tabla 'profiles'
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) throw new Error('No se pudo cargar el perfil del usuario.');

        // 3. Adaptar los datos al formato de nuestra App
        const userData: User = {
            email: profileData.email,
            name: profileData.full_name, // Mapeamos full_name de la DB a name de la App
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

  const logout = async () => {
    await supabase.auth.signOut(); // Cerrar sesión en Supabase también
    setUser(null);
    localStorage.removeItem('castor_user');
  };

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