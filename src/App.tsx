import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import MainLayout from './components/MainLayout';
import PricingModule from './modules/pricing/PricingModule';
import UserManagement from './modules/admin/UserManagement';
import InventoryModule from './modules/inventory/InventoryModule'; // Nuevo import

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout />} />
            
            {/* Módulos existentes */}
            <Route path="/pricing" element={<PricingModule onBack={() => window.location.href = '/'} />} />
            <Route path="/admin/users" element={<UserManagement onBack={() => window.location.href = '/'} />} />
            
            {/* Nuevo Módulo de Inventario */}
            <Route path="/inventory" element={<InventoryModule />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;