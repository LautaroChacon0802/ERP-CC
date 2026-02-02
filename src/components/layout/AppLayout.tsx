import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import LoginScreen from '../LoginScreen';

type ModuleId = 'dashboard' | 'pricing' | 'gastro' | 'stock' | 'admin';

interface AppLayoutProps {
  children: (props: {
    activeModule: ModuleId;
    setActiveModule: (module: ModuleId) => void;
    sidebarCollapsed: boolean;
  }) => React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Show login if not authenticated
  if (!isAuthenticated || !user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        user={user}
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        onLogout={logout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <main 
        className={`
          min-h-screen transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'ml-16' : 'ml-64'}
        `}
      >
        {children({ activeModule, setActiveModule, sidebarCollapsed })}
      </main>
    </div>
  );
};

export default AppLayout;
