import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { AdminLayout } from './components/AdminLayout';
import { Departments } from './pages/admin/Departments';
import { Categories } from './pages/admin/Categories';
import { Employees } from './pages/admin/Employees';
import { AssetDirectory } from './pages/AssetDirectory';
import { AssetDetail } from './pages/AssetDetail';
import apiClient from './api/client';
import { ReturnForm } from './components/ReturnForm';

const queryClient = new QueryClient();

interface MyAllocation {
  id: number;
  allocatedDate: string;
  expectedReturnDate: string | null;
  status: string;
  asset: {
    id: number;
    assetTag: string;
    name: string;
    category: { name: string };
  };
}

function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [allocations, setAllocations] = useState<MyAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [returningAllocation, setReturningAllocation] = useState<MyAllocation | null>(null);

  const fetchMyAllocations = async () => {
    try {
      const response = await apiClient.get<MyAllocation[]>('/allocations/my');
      setAllocations(response.data.filter((a) => a.status === 'ACTIVE'));
    } catch (err) {
      console.error('Failed to load my allocations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAllocations();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col font-sans">
      {/* Navbar */}
      <header className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-white shadow-md shadow-purple-600/30">
            AF
          </div>
          <span className="text-xl font-bold tracking-tight text-white">AssetFlow</span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            to="/assets"
            className="text-xs font-semibold text-gray-400 hover:text-gray-200 transition"
          >
            Asset Directory
          </Link>
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin/departments"
              className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-purple-500 cursor-pointer"
            >
              Admin Controls
            </Link>
          )}
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 flex flex-col items-center">
        {/* Core Setup Pane */}
        <div className="glass max-w-4xl w-full rounded-2xl p-8 shadow-2xl space-y-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white m-0">Core Engine Dashboard</h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
            Welcome to the AssetFlow Core Engine. Phase A4 (Allocation Engine) is now active.
          </p>

          <div className="border-t border-gray-800/80 pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-left mb-3">Active Session Metadata</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              <div className="bg-gray-900/45 rounded-xl border border-gray-800/50 p-4">
                <span className="text-xs text-gray-500 block uppercase tracking-wider">Email</span>
                <span className="text-sm text-gray-200 font-medium truncate block">{user?.email}</span>
              </div>
              <div className="bg-gray-900/45 rounded-xl border border-gray-800/50 p-4">
                <span className="text-xs text-gray-500 block uppercase tracking-wider">Department ID</span>
                <span className="text-sm text-gray-200 font-medium">{user?.departmentId || 'None'}</span>
              </div>
              <div className="bg-gray-900/45 rounded-xl border border-gray-800/50 p-4">
                <span className="text-xs text-gray-500 block uppercase tracking-wider">Role</span>
                <span className="text-sm text-purple-400 font-semibold">{user?.role}</span>
              </div>
              <div className="bg-gray-900/45 rounded-xl border border-gray-800/50 p-4">
                <span className="text-xs text-gray-500 block uppercase tracking-wider">Status</span>
                <span className="text-sm text-green-400 font-semibold">{user?.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* My Checked-Out Assets Widget */}
        <div className="glass max-w-4xl w-full rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-xl font-bold text-white text-left m-0">My Checked-Out Assets</h2>
          {loading ? (
            <div className="flex h-24 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-800/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800/80 bg-gray-950/20 text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Tag</th>
                    <th className="px-4 py-3">Asset Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Checked Out Date</th>
                    <th className="px-4 py-3">Expected Return</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-800/40">
                  {allocations.map((alloc) => (
                    <tr key={alloc.id} className="hover:bg-gray-900/10">
                      <td className="px-4 py-3 font-semibold text-purple-400">
                        <Link to={`/assets/${alloc.asset.id}`} className="hover:underline">
                          {alloc.asset.assetTag}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-200">{alloc.asset.name}</td>
                      <td className="px-4 py-3 text-gray-400">{alloc.asset.category.name}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(alloc.allocatedDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {alloc.expectedReturnDate ? new Date(alloc.expectedReturnDate).toLocaleDateString() : 'Indefinite'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setReturningAllocation(alloc)}
                          className="rounded-lg bg-amber-600/20 border border-amber-500/25 px-2.5 py-1 text-xs font-semibold text-amber-400 hover:bg-amber-600 hover:text-white transition cursor-pointer"
                        >
                          Return
                        </button>
                      </td>
                    </tr>
                  ))}
                  {allocations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        You do not currently have any active checkouts.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Return Quick Dialog */}
      {returningAllocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 p-4 backdrop-blur-sm">
          <div className="glass max-w-lg w-full rounded-2xl p-6 shadow-2xl relative border border-gray-800">
            <ReturnForm
              allocationId={returningAllocation.id}
              assetName={returningAllocation.asset.name}
              onClose={() => setReturningAllocation(null)}
              onSuccess={() => {
                setReturningAllocation(null);
                fetchMyAllocations();
              }}
            />
          </div>
        </div>
      )}
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
      <Route
        path="/assets"
        element={
          <ProtectedRoute>
            <AssetDirectory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assets/:id"
        element={
          <ProtectedRoute>
            <AssetDetail />
          </ProtectedRoute>
        }
      />
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="departments" element={<Departments />} />
        <Route path="categories" element={<Categories />} />
        <Route path="employees" element={<Employees />} />
        <Route path="" element={<Navigate to="departments" replace />} />
      </Route>
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
