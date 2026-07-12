import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute.jsx';
import AppShell from './layouts/AppShell.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import OrganizationSetup from './pages/OrganizationSetup.jsx';
import Assets from './pages/Assets.jsx';
import AssetDetail from './pages/AssetDetail.jsx';
import Allocations from './pages/Allocations.jsx';
import Bookings from './pages/Bookings.jsx';
import Maintenance from './pages/Maintenance.jsx';
import Audit from './pages/Audit.jsx';
import Reports from './pages/Reports.jsx';
import NotificationsLogs from './pages/NotificationsLogs.jsx';

export default function App() {
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
      <Route index element={<Dashboard />} />
      <Route path="/org" element={<ProtectedRoute roles={['ADMIN']}><OrganizationSetup /></ProtectedRoute>} />
      <Route path="/assets" element={<Assets />} />
      <Route path="/assets/:id" element={<AssetDetail />} />
      <Route path="/allocations" element={<Allocations />} />
      <Route path="/bookings" element={<Bookings />} />
      <Route path="/maintenance" element={<Maintenance />} />
      <Route path="/audits" element={<Audit />} />
      <Route path="/reports" element={<ProtectedRoute roles={['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD']}><Reports /></ProtectedRoute>} />
      <Route path="/notifications" element={<NotificationsLogs />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
