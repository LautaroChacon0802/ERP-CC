
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { BackendService } from '../api/backend';

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Persistence check (Simple local storage for now, mostly relevant for dev)
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
        const userData = await BackendService.login(email, pass);
        setUser(userData);
        localStorage.setItem('castor_user', JSON.stringify(userData));
    } finally {
        setLoading(false);
    }
  };

  const logout = () => {
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
