import React, { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import Spinner from './components/Spinner';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './hooks/useToast';
import ToastContainer from './components/ToastContainer';

// Public Pages
const HomePage = lazy(() => import('./pages/HomePage'));
const RaffleDetailPage = lazy(() => import('./pages/RaffleDetailPage'));
const PurchasePage = lazy(() => import('./pages/PurchasePage'));
const VerifierPage = lazy(() => import('./pages/VerifierPage'));
const PaymentAccountsPage = lazy(() => import('./pages/PaymentAccountsPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const ReceiptPage = lazy(() => import('./pages/ReceiptPage'));

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
        <ToastProvider>
          <AuthProvider>
            <AnalyticsProvider>
              <Router>
                <ToastContainer />
                <Suspense fallback={<div className="w-full h-screen flex items-center justify-center bg-background-primary"><Spinner /></div>}>
                  <Routes>
              {/* Public Routes - Receipt page sin layout para mejor impresión */}
              <Route path="comprobante/:folio" element={<ReceiptPage />} />
              
              {/* Public Routes con Layout */}
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="sorteo/:slug" element={<RaffleDetailPage />} />
                <Route path="comprar/:slug" element={<PurchasePage />} />
                <Route path="verificador" element={<VerifierPage />} />
                <Route path="cuentas-de-pago" element={<PaymentAccountsPage />} />
                <Route path="terminos" element={<TermsPage />} />
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
                {/* Rutas solo para admin/superadmin */}
                <Route path="analytics" element={
                  <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                    <AdminAnalyticsPage />
                  </RoleProtectedRoute>
                } />
                <Route path="sorteos" element={
                  <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                    <AdminRafflesPage />
                  </RoleProtectedRoute>
                } />
                {/* Rutas accesibles para todos los roles autenticados */}
                <Route path="apartados" element={<AdminOrdersPage />} />
                <Route path="clientes" element={<AdminCustomersPage />} />
                {/* Rutas solo para admin/superadmin */}
                <Route path="ganadores" element={
                  <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                    <AdminWinnersPage />
                  </RoleProtectedRoute>
                } />
                <Route path="usuarios" element={
                  <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                    <AdminUsersPage />
                  </RoleProtectedRoute>
                } />
                <Route path="ajustes" element={
                  <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                    <AdminSettingsPage />
                  </RoleProtectedRoute>
                } />
              </Route>
                  </Routes>
                </Suspense>
              </Router>
            </AnalyticsProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
