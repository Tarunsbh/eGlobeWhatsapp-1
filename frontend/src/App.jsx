import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SuperAdminProvider, useSuperAdmin } from './contexts/SuperAdminContext';

// Hotel panel
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ContactsPage from './pages/ContactsPage.jsx';
import TemplatesPage from './pages/TemplatesPage.jsx';
import CampaignsPage from './pages/CampaignsPage.jsx';
import InboxPage from './pages/InboxPage.jsx';
import AutomationPage from './pages/AutomationPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

// Super Admin panel
import SuperAdminLayout from './components/SuperAdminLayout.jsx';
import SuperAdminLoginPage from './pages/super-admin/SuperAdminLoginPage.jsx';
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard.jsx';
import HotelsManagementPage from './pages/super-admin/HotelsManagementPage.jsx';
import HotelDetailPage from './pages/super-admin/HotelDetailPage.jsx';
import SubscriptionsPage from './pages/super-admin/SubscriptionsPage.jsx';
import BillingPage from './pages/super-admin/BillingPage.jsx';
import AuditLogsPage from './pages/super-admin/AuditLogsPage.jsx';
import SystemMonitoringPage from './pages/super-admin/SystemMonitoringPage.jsx';
import PricingPage from './pages/super-admin/PricingPage.jsx';

// Hotel panel protected route
function HotelProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// Super admin protected route
function SAProtectedRoute({ children }) {
  const { admin } = useSuperAdmin();
  if (!admin) return <Navigate to="/super-admin/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* ── Hotel / Staff Panel ──────────────────────── */}
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <HotelProtectedRoute>
            <Layout />
          </HotelProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="automation" element={<AutomationPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* ── Super Admin Panel ────────────────────────── */}
      <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
      <Route
        path="/super-admin"
        element={
          <SAProtectedRoute>
            <SuperAdminLayout />
          </SAProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="hotels" element={<HotelsManagementPage />} />
        <Route path="hotels/:id" element={<HotelDetailPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="monitoring" element={<SystemMonitoringPage />} />
        <Route path="audit" element={<AuditLogsPage />} />
        <Route path="pricing" element={<PricingPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <SuperAdminProvider>
      <AppRoutes />
    </SuperAdminProvider>
  );
}
