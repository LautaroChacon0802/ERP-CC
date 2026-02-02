import React from 'react';
import { 
  LayoutDashboard, 
  DollarSign, 
  Package, 
  Users, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Utensils
} from 'lucide-react';
import CastorLogo from '../CastorLogo';
import { User } from '../../types';

type ModuleId = 'dashboard' | 'pricing' | 'gastro' | 'stock' | 'admin';

interface NavItem {
  id: ModuleId;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  adminOnly?: boolean;
  pricingOnly?: boolean;
  badge?: string;
}

interface SidebarProps {
  user: User;
  activeModule: ModuleId;
  onModuleChange: (module: ModuleId) => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Inicio',
    icon: <LayoutDashboard size={20} />,
  },
  {
    id: 'pricing',
    label: 'Tarifarios',
    icon: <DollarSign size={20} />,
    pricingOnly: true,
  },
  {
    id: 'gastro',
    label: 'Presupuestos',
    icon: <Utensils size={20} />,
    disabled: true,
    badge: 'Pronto',
  },
  {
    id: 'stock',
    label: 'Stock',
    icon: <Package size={20} />,
  },
  {
    id: 'admin',
    label: 'Usuarios',
    icon: <Users size={20} />,
    adminOnly: true,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeModule,
  onModuleChange,
  onLogout,
  collapsed,
  onToggleCollapse,
}) => {
  const isAdmin = user.role === 'admin';
  const isPricingManager = user.role === 'pricing_manager';

  const filteredItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.pricingOnly && !isAdmin && !isPricingManager) return false;
    return true;
  });

  return (
    <aside 
      className={`
        fixed left-0 top-0 h-screen bg-primary z-30
        flex flex-col transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-center border-b border-primary-500 px-4">
        {collapsed ? (
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-primary font-black text-sm">CC</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg">
              <CastorLogo className="h-8 w-auto" />
            </div>
            <div className="text-white">
              <p className="font-bold text-sm leading-tight">CERRO CASTOR</p>
              <p className="text-primary-200 text-xs">ERP Integral</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {filteredItems.map((item) => {
            const isActive = activeModule === item.id;
            const isDisabled = item.disabled;

            return (
              <li key={item.id}>
                <button
                  onClick={() => !isDisabled && onModuleChange(item.id)}
                  disabled={isDisabled}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-150 relative group
                    ${isActive 
                      ? 'bg-white/15 text-white' 
                      : isDisabled 
                        ? 'text-primary-300 cursor-not-allowed' 
                        : 'text-primary-200 hover:bg-white/10 hover:text-white'}
                  `}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-white' : ''}`}>
                    {item.icon}
                  </span>
                  
                  {!collapsed && (
                    <>
                      <span className="font-medium text-sm flex-1 text-left">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] font-bold uppercase bg-primary-400 text-white px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}

                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                  )}

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-foreground text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                      {item.label}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t border-primary-500 p-2">
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <p className="text-white text-sm font-semibold truncate">{user.name}</p>
            <p className="text-primary-200 text-xs uppercase tracking-wide">
              {user.role.replace('_', ' ')}
            </p>
          </div>
        )}

        <button
          onClick={onLogout}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
            text-primary-200 hover:bg-red-500/20 hover:text-white transition-colors
          `}
          title={collapsed ? 'Cerrar Sesion' : undefined}
        >
          <LogOut size={20} />
          {!collapsed && <span className="font-medium text-sm">Cerrar Sesion</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-border rounded-full shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
};

export default Sidebar;
