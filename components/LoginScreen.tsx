
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CastorLogo from './CastorLogo';
import { Lock, User as UserIcon, Loader2 } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, pass);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 border-castor-red">
        <div className="flex justify-center mb-6">
            <div className="h-16 w-auto">
                <CastorLogo className="h-full w-auto" />
            </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Acceso ERP</h2>
        <p className="text-center text-gray-500 text-sm mb-8">Sistema de Gestión Integral</p>

        {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Corporativo</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-castor-red focus:border-castor-red"
                    placeholder="usuario@cerrocastor.com"
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="password"
                    required
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-castor-red focus:border-castor-red"
                    placeholder="••••••••"
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-castor-red hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Ingresar'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Cerro Castor. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
