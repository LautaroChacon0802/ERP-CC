import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff, Mountain } from 'lucide-react';
import CastorLogo from './CastorLogo';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

const LoginScreen: React.FC = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesion');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white p-2 rounded-xl">
                <CastorLogo className="h-10 w-auto" />
              </div>
              <div>
                <p className="font-bold text-lg leading-tight">CERRO CASTOR</p>
                <p className="text-primary-200 text-xs uppercase tracking-widest">Ushuaia - Argentina</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <Mountain className="w-16 h-16 text-primary-200 mb-4" />
              <h1 className="text-4xl font-black leading-tight mb-3">
                Sistema de<br />Gestion Integral
              </h1>
              <p className="text-primary-200 text-lg max-w-md">
                Plataforma centralizada para la administracion de tarifas, inventario y operaciones del centro de ski.
              </p>
            </div>
            
            <div className="flex gap-8 pt-6 border-t border-primary-500">
              <div>
                <p className="text-3xl font-bold">650m</p>
                <p className="text-primary-200 text-sm">Desnivel esquiable</p>
              </div>
              <div>
                <p className="text-3xl font-bold">34</p>
                <p className="text-primary-200 text-sm">Pistas</p>
              </div>
              <div>
                <p className="text-3xl font-bold">12</p>
                <p className="text-primary-200 text-sm">Medios de elevacion</p>
              </div>
            </div>
          </div>
          
          <p className="text-primary-300 text-sm">
            El centro de ski mas austral del mundo
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="bg-primary p-2 rounded-xl">
              <CastorLogo className="h-10 w-auto" />
            </div>
            <div>
              <p className="font-bold text-lg text-foreground">CERRO CASTOR</p>
              <p className="text-muted-foreground text-xs uppercase tracking-widest">ERP Integral</p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-card rounded-card shadow-elevated border border-border overflow-hidden">
            <div className="p-8 pb-6 text-center border-b border-border">
              <h2 className="text-2xl font-bold text-foreground">Bienvenido</h2>
              <p className="text-muted-foreground text-sm mt-1">Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-start gap-3 animate-slide-up">
                  <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <Input
                  type="email"
                  label="Correo Electronico"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@cerrocastor.com"
                  icon={<Mail size={18} />}
                />

                <Input
                  type={showPassword ? 'text' : 'password'}
                  label="Contrasena"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contrasena"
                  icon={<Lock size={18} />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Ingresando...' : 'Iniciar Sesion'}
              </Button>
            </form>

            <div className="px-8 pb-6 text-center">
              <p className="text-xs text-muted-foreground">
                {new Date().getFullYear()} Cerro Castor. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
