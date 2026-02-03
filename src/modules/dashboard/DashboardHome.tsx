import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { DollarSign, Utensils, Box, Users } from 'lucide-react';

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const isPricingManager = user?.role === 'pricing_manager';
  
  const canAccessPricing = isAdmin || isPricingManager;
  const canAccessStock = true; // Abierto a todos los usuarios logueados
  const canAccessAdmin = isAdmin;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Bienvenido, {user?.name}</h1>
        <p className="text-gray-500 mt-1">Selecciona un módulo para comenzar a trabajar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* PRICING CARD */}
        <div 
            onClick={() => canAccessPricing && navigate('/pricing')}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center transition-all ${canAccessPricing ? 'hover:shadow-md hover:border-blue-300 cursor-pointer group' : 'opacity-50 cursor-not-allowed'}`}
        >
            <div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:bg-blue-600 transition-colors">
                <DollarSign className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Tarifarios</h3>
            <p className="text-sm text-gray-500 mt-2">Gestión de escenarios, coeficientes y generación de matrices.</p>
        </div>

        {/* STOCK CARD */}
        <div 
            onClick={() => canAccessStock && navigate('/inventory')}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center transition-all ${canAccessStock ? 'hover:shadow-md hover:border-green-300 cursor-pointer group' : 'opacity-60 cursor-not-allowed'}`}
        >
            <div className="bg-green-100 p-4 rounded-full mb-4 group-hover:bg-green-600 transition-colors">
                <Box className="h-8 w-8 text-green-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Stock e Inventario</h3>
            <p className="text-sm text-gray-500 mt-2">Inventario de insumos, blancos y amenities. Control de ubicaciones.</p>
        </div>

        {/* ADMIN CARD */}
        {canAccessAdmin && (
            <div 
                onClick={() => navigate('/admin')}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-md hover:border-slate-400 group transition-all"
            >
                <div className="bg-slate-100 p-4 rounded-full mb-4 group-hover:bg-slate-800 transition-colors">
                    <Users className="h-8 w-8 text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Usuarios</h3>
                <p className="text-sm text-gray-500 mt-2">Gestión de accesos, roles y contraseñas del sistema.</p>
            </div>
        )}

        {/* GASTRO CARD (Placeholder) */}
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-6 flex flex-col items-center text-center opacity-60 cursor-not-allowed relative">
            <div className="absolute top-3 right-3 bg-gray-200 text-gray-500 text-[10px] font-bold px-2 py-1 rounded">PRÓXIMAMENTE</div>
            <div className="bg-orange-50 p-4 rounded-full mb-4">
                <Utensils className="h-8 w-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-400">Presupuestos</h3>
            <p className="text-sm text-gray-400 mt-2">Control de menús y costos.</p>
        </div>

      </div>
    </div>
  );
};

export default DashboardHome;