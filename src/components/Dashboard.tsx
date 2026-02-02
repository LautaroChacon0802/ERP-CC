import React from 'react';
import { 
  DollarSign, 
  Package, 
  Users, 
  Utensils,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Activity
} from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { User } from '../types';

type ModuleId = 'dashboard' | 'pricing' | 'gastro' | 'stock' | 'admin';

interface DashboardProps {
  user: User;
  onNavigate: (module: ModuleId) => void;
}

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  description,
  icon,
  iconBg,
  onClick,
  disabled,
  badge,
}) => (
  <Card
    variant={disabled ? 'default' : 'interactive'}
    onClick={onClick}
    disabled={disabled}
    className={`relative ${disabled ? 'opacity-60' : ''}`}
  >
    {badge && (
      <span className="absolute top-3 right-3 text-[10px] font-bold uppercase bg-muted text-muted-foreground px-2 py-1 rounded">
        {badge}
      </span>
    )}
    <CardContent className="flex flex-col items-center text-center py-8">
      <div className={`p-4 rounded-2xl mb-4 ${iconBg}`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      {!disabled && (
        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
          Acceder <ArrowRight size={16} />
        </div>
      )}
    </CardContent>
  </Card>
);

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const isAdmin = user.role === 'admin';
  const isPricingManager = user.role === 'pricing_manager';
  const canAccessPricing = isAdmin || isPricingManager;

  // Get current greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos dias';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {getGreeting()}, {user.name.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground">
          Bienvenido al sistema de gestion integral de Cerro Castor
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-primary-200 text-sm">Estado del Sistema</p>
              <p className="text-xl font-bold">Operativo</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 bg-success/10 rounded-xl text-success">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Temporada</p>
              <p className="text-xl font-bold text-foreground">2025</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 bg-warning/10 rounded-xl text-warning">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Alertas</p>
              <p className="text-xl font-bold text-foreground">Sin alertas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modules Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Modulos Disponibles</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {canAccessPricing && (
          <ModuleCard
            title="Tarifarios"
            description="Gestion de escenarios, coeficientes y generacion de matrices."
            icon={<DollarSign className="h-8 w-8 text-accent" />}
            iconBg="bg-accent/10"
            onClick={() => onNavigate('pricing')}
          />
        )}

        <ModuleCard
          title="Presupuestos"
          description="Control de menus, costos y puntos de venta."
          icon={<Utensils className="h-8 w-8 text-warning" />}
          iconBg="bg-warning/10"
          disabled
          badge="Proximamente"
        />

        <ModuleCard
          title="Stock"
          description="Inventario de insumos, blancos y amenities."
          icon={<Package className="h-8 w-8 text-success" />}
          iconBg="bg-success/10"
          onClick={() => onNavigate('stock')}
        />

        {isAdmin && (
          <ModuleCard
            title="Usuarios"
            description="Gestion de accesos, roles y contrasenas del sistema."
            icon={<Users className="h-8 w-8 text-primary" />}
            iconBg="bg-primary/10"
            onClick={() => onNavigate('admin')}
          />
        )}
      </div>

      {/* Footer info */}
      <div className="mt-12 pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground text-center">
          Cerro Castor ERP v2.0 | Sesion iniciada como <span className="font-medium text-foreground">{user.role.replace('_', ' ')}</span>
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
