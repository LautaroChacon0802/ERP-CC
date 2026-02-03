import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import { Loader2 } from 'lucide-react';

const DashboardLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  // Protección de Ruta: Si no está logueado, al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Fijo */}
      <Sidebar />

      {/* Área de Contenido Principal */}
      <main className="flex-1 ml-64 overflow-auto h-full relative">
        <div className="p-8 max-w-7xl mx-auto min-h-full">
            <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;