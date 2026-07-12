import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ProtectedRoute } from './ProtectedRoute';

export const AdminLayout: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const tabs = [
    { path: '/admin/departments', label: 'Departments' },
    { path: '/admin/categories', label: 'Asset Categories' },
    { path: '/admin/employees', label: 'Employee Directory' }
  ];

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex">
        {/* Admin Sidebar */}
        <aside className="w-64 border-r border-gray-800/80 bg-gray-950/40 flex flex-col">
          <div className="p-6 border-b border-gray-800/80">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-white shadow-md shadow-purple-600/30">
                AF
              </div>
              <span className="text-lg font-bold tracking-tight text-white">Admin Control</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">AssetFlow Config Centre</p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {tabs.map((tab) => {
              const isActive = location.pathname.startsWith(tab.path);
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                      : 'text-gray-400 hover:bg-gray-900/50 hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-800/80">
            <Link
              to="/"
              className="flex items-center justify-center w-full px-4 py-2.5 rounded-xl border border-gray-800 bg-gray-900/40 text-xs font-semibold text-gray-400 transition hover:bg-gray-900 hover:text-gray-200"
            >
              ← Return to Dashboard
            </Link>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-900/10">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};
