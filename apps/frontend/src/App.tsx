import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import { Layout } from './components/Layout';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ServiceList } from './pages/services/ServiceList';
import { ServiceCreate } from './pages/services/ServiceCreate';
import { ServiceDetail } from './pages/services/ServiceDetail';
import { PosPage } from './pages/pos/PosPage';
import { InventoryList } from './pages/inventory/InventoryList';
import { CustomerList } from './pages/customers/CustomerList';
import { FinancePage } from './pages/finance/FinancePage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { MenuPage } from './pages/MenuPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'OWNER' | 'KASIR' }> = ({
  children,
  requiredRole,
}) => {
  const { user, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRole(requiredRole) && !hasRole('OWNER')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <NetworkProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="services" element={<ServiceList />} />
              <Route path="services/new" element={<ServiceCreate />} />
              <Route path="services/:id" element={<ServiceDetail />} />
              <Route path="pos" element={<PosPage />} />
              <Route path="inventory" element={<InventoryList />} />
              <Route path="customers" element={<CustomerList />} />
              <Route
                path="finance"
                element={
                  <ProtectedRoute requiredRole="KASIR">
                    <FinancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <ProtectedRoute requiredRole="KASIR">
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute requiredRole="OWNER">
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="menu" element={<MenuPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </NetworkProvider>
  );
};

export default App;
