import React, { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Spinner from './components/Spinner';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';

// Public Pages
const HomePage = lazy(() => import('./pages/HomePage'));
const RaffleDetailPage = lazy(() => import('./pages/RaffleDetailPage'));
const PurchasePage = lazy(() => import('./pages/PurchasePage'));
const VerifierPage = lazy(() => import('./pages/VerifierPage'));
const PaymentAccountsPage = lazy(() => import('./pages/PaymentAccountsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));

// Admin Pages
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));
const AdminRafflesPage = lazy(() => import('./pages/admin/AdminRafflesPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminCustomersPage = lazy(() => import('./pages/admin/AdminCustomersPage'));
const AdminWinnersPage = lazy(() => import('./pages/admin/AdminWinnersPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AnalyticsProvider>
            <Router>
            <Suspense fallback={<div className="w-full h-screen flex items-center justify-center bg-background-primary"><Spinner /></div>}>
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="sorteo/:slug" element={<RaffleDetailPage />} />
                <Route path="comprar/:slug" element={<PurchasePage />} />
                <Route path="verificador" element={<VerifierPage />} />
                <Route path="cuentas-de-pago" element={<PaymentAccountsPage />} />
                <Route path="mis-cuentas" element={<AccountsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboardPage />} />
                <Route path="analytics" element={<AdminAnalyticsPage />} />
                <Route path="sorteos" element={<AdminRafflesPage />} />
                <Route path="apartados" element={<AdminOrdersPage />} />
                <Route path="clientes" element={<AdminCustomersPage />} />
                <Route path="ganadores" element={<AdminWinnersPage />} />
                <Route path="usuarios" element={<AdminUsersPage />} />
                <Route path="ajustes" element={<AdminSettingsPage />} />
              </Route>
              </Routes>
            </Suspense>
            </Router>
          </AnalyticsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
