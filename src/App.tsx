import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

// Layouts & Pages
import DashboardLayout from './components/layout/DashboardLayout';
import LoginScreen from './components/LoginScreen';
import DashboardHome from './modules/dashboard/DashboardHome';

// Modules
import PricingModule from './modules/pricing/PricingModule';
import InventoryModule from './modules/inventory/InventoryModule';
import UserManagement from './modules/admin/UserManagement';

// Wrapper para pasar navigate como onBack a los componentes legacy
const PricingWrapper = () => {
  const navigate = useNavigate();
  return <PricingModule onBack={() => navigate('/dashboard')} />;
};

const InventoryWrapper = () => {
  const navigate = useNavigate();
  return <InventoryModule onBack={() => navigate('/dashboard')} />;
};

const AdminWrapper = () => {
  const navigate = useNavigate();
  return <UserManagement onBack={() => navigate('/dashboard')} />;
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Ruta Pública: Login */}
            <Route path="/login" element={<LoginScreen />} />

            {/* Rutas Protegidas (Dashboard Layout) */}
            <Route path="/" element={<DashboardLayout />}>
              {/* Redirección automática de / a /dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* Home del Dashboard */}
              <Route path="dashboard" element={<DashboardHome />} />
              
              {/* Módulos */}
              <Route path="pricing/*" element={<PricingWrapper />} />
              <Route path="inventory/*" element={<InventoryWrapper />} />
              <Route path="admin" element={<AdminWrapper />} />
            </Route>

            {/* Catch-all: Redirigir cualquier ruta desconocida al home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;