import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CastorLogo from '../CastorLogo';
import { 
  LayoutDashboard, 
  DollarSign, 
  Box, 
  Users, 
  LogOut, 
  Utensils 
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard, exact: true },
    { to: '/pricing', label: 'Tarifarios', icon: DollarSign },
    { to: '/inventory', label: 'Stock e Inventario', icon: Box },
    // { to: '/gastro', label: 'Presupuestos', icon: Utensils }, // Futuro
  ];

  // Solo mostrar Admin a roles permitidos
  if (user?.role === 'admin') {
    navItems.push({ to: '/admin', label: 'Usuarios', icon: Users });
  }

  return (
    <aside className="w-64 h-screen bg-slate-900 text-white flex flex-col shadow-xl fixed left-0 top-0 z-50">
      {/* Header Logo */}
      <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
        <div className="h-8 w-auto opacity-90 invert brightness-0 grayscale filter">
           {/* Usamos el logo existente, forzándolo a blanco con CSS filter */}
           <CastorLogo className="h-full w-auto text-white" />
        </div>
        <span className="ml-3 font-bold text-lg tracking-tight text-slate-200">ERP Gestión</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Módulos
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`
            }
          >
            <item.icon size={18} className="mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || 'Usuario'}
            </p>
            <p className="text-xs text-slate-500 truncate capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-full transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;