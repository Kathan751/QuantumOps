import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('ADMIN' | 'ASSET_MANAGER' | 'DEPARTMENT_HEAD' | 'EMPLOYEE')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0b0f19]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-gray-400 text-sm animate-pulse">Loading secure session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0b0f19] px-4 text-center">
        <div className="glass max-w-md rounded-2xl p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-950/50 border border-red-500/30 text-red-400 text-3xl">
            ⚠️
          </div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight mb-2">Access Denied</h1>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Your current role <span className="font-semibold text-purple-400">{user.role}</span> does not have permissions to access this area.
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full rounded-xl bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-500 active:bg-purple-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
