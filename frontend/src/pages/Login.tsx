import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { login, error, clearError, isAuthenticated, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
    return () => {
      clearError();
    };
  }, [isAuthenticated, navigate, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      // Handled by store
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0f19] px-4">
      <div className="glass w-full max-w-md rounded-2xl p-8 shadow-2xl transition duration-500 hover:border-purple-500/20">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 font-bold text-white text-xl shadow-lg shadow-purple-600/30">
            AF
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-400">Sign in to manage organisation assets</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {(formError || error) && (
            <div className="rounded-lg bg-red-950/40 border border-red-500/20 p-3 text-sm text-red-400">
              {formError || error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3 text-sm text-gray-100 placeholder-gray-600 outline-none transition focus:border-purple-500 focus:bg-gray-900"
              placeholder="e.g. admin@assetflow.local"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Password</label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3 text-sm text-gray-100 placeholder-gray-600 outline-none transition focus:border-purple-500 focus:bg-gray-900"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-500 active:bg-purple-700 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-purple-400 hover:text-purple-300 transition">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
