import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient();

function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col">
      {/* Navbar */}
      <header className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-white shadow-md shadow-purple-600/30">
            AF
          </div>
          <span className="text-xl font-bold tracking-tight text-white">AssetFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-200">{user?.name}</p>
            <p className="text-xs text-purple-400 capitalize">{user?.role?.replace('_', ' ')?.toLowerCase()}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-purple-950/40 border border-purple-500/20 px-3 py-1.5 text-xs font-semibold text-purple-400 transition hover:bg-purple-900/40 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col items-center justify-center text-center">
        <div className="glass max-w-2xl w-full rounded-2xl p-8 shadow-2xl space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-white m-0">Core Engine Setup</h1>
          <p className="text-gray-400 text-base max-w-md mx-auto leading-relaxed">
            Welcome to the AssetFlow Core Engine. Phase A1 (Authentication & Server RBAC Foundation) is now fully active.
          </p>

          <div className="border-t border-gray-800/80 pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-left mb-3">Active Session Metadata</h3>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-gray-900/45 rounded-xl border border-gray-800/50 p-4">
                <span className="text-xs text-gray-500 block uppercase tracking-wider">Email Address</span>
                <span className="text-sm text-gray-200 font-medium">{user?.email}</span>
              </div>
              <div className="bg-gray-900/45 rounded-xl border border-gray-800/50 p-4">
                <span className="text-xs text-gray-500 block uppercase tracking-wider">Assigned Department ID</span>
                <span className="text-sm text-gray-200 font-medium">{user?.departmentId || 'None'}</span>
              </div>
              <div className="bg-gray-900/45 rounded-xl border border-gray-800/50 p-4">
                <span className="text-xs text-gray-500 block uppercase tracking-wider">Role Permissions</span>
                <span className="text-sm text-purple-400 font-semibold">{user?.role}</span>
              </div>
              <div className="bg-gray-900/45 rounded-xl border border-gray-800/50 p-4">
                <span className="text-xs text-gray-500 block uppercase tracking-wider">Account Status</span>
                <span className="text-sm text-green-400 font-semibold">{user?.status}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function AppRoutes() {
  const { fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
