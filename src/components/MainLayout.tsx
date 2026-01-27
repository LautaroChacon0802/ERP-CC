import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PricingModule from '../modules/pricing/PricingModule';
import UserManagement from '../modules/admin/UserManagement';
import InventoryModule from '../modules/inventory/InventoryModule';
import LoginScreen from './LoginScreen';
import CastorLogo from './CastorLogo';
import { DollarSign, Utensils, Box, Users, LogOut } from 'lucide-react';

type Module = 'PRICING' | 'GASTRO' | 'STOCK' | 'ADMIN' | null;

const MainLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [currentModule, setCurrentModule] = useState<Module>(null);

  if (!isAuthenticated || !user) {
    return <LoginScreen />;
  }

  if (currentModule === 'PRICING') {
    return <PricingModule onBack={() => setCurrentModule(null)} />;
  }
  
  if (currentModule === 'ADMIN') {
    return <UserManagement onBack={() => setCurrentModule(null)} />;
  }

  if (currentModule === 'STOCK') {
    // FIX: Pasar prop onBack para permitir salir del módulo
    return <InventoryModule onBack={() => setCurrentModule(null)} />; 
  }

  const isAdmin = user.role === 'admin';
  const isPricingManager = user.role === 'pricing_manager';
  
  const canAccessPricing = isAdmin || isPricingManager;
  const canAccessAdmin = isAdmin;
  const canAccessStock = true; 

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-auto">
                            <CastorLogo className="h-full w-auto" />
                        </div>
                        <span className="font-bold text-gray-700 text-lg tracking-tight">ERP Gestión Integral</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500 uppercase font-bold">{user.role.replace('_', ' ')}</p>
                        </div>
                        <button 
                            onClick={logout}
                            className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Cerrar Sesión"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Módulos Disponibles</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div 
                    onClick={() => canAccessPricing && setCurrentModule('PRICING')}
                    className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center transition-all ${canAccessPricing ? 'hover:shadow-md hover:border-blue-300 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                >
                    <div className="bg-blue-100 p-4 rounded-full mb-4">
                        <DollarSign className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Tarifarios</h3>
                    <p className="text-sm text-gray-500 mt-2">Gestión de escenarios, coeficientes y generación de matrices.</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center opacity-60 cursor-not-allowed relative overflow-hidden">
                    <div className="absolute top-3 right-3 bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded">PRÓXIMAMENTE</div>
                    <div className="bg-orange-100 p-4 rounded-full mb-4">
                        <Utensils className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Presupuestos</h3>
                    <p className="text-sm text-gray-500 mt-2">Control de menús, costos y puntos de venta.</p>
                </div>

                <div 
                    onClick={() => canAccessStock && setCurrentModule('STOCK')}
                    className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center transition-all ${canAccessStock ? 'hover:shadow-md hover:border-green-300 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                >
                    <div className="bg-green-100 p-4 rounded-full mb-4">
                        <Box className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Stock</h3>
                    <p className="text-sm text-gray-500 mt-2">Inventario de insumos, blancos y amenities.</p>
                </div>

                {canAccessAdmin && (
                    <div 
                        onClick={() => setCurrentModule('ADMIN')}
                        className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-lg hover:bg-slate-700 transition-all"
                    >
                        <div className="bg-slate-600 p-4 rounded-full mb-4">
                            <Users className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Usuarios</h3>
                        <p className="text-sm text-slate-300 mt-2">Gestión de accesos, roles y contraseñas del sistema.</p>
                    </div>
                )}
            </div>
        </main>
    </div>
  );
};

export default MainLayout;