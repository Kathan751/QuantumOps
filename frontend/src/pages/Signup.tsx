import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';

interface Department {
  id: number;
  name: string;
}

export const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const { signup, error, clearError, isAuthenticated, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }

    const loadDepartments = async () => {
      try {
        const response = await apiClient.get<Department[]>('/departments');
        setDepartments(response.data);
      } catch (err) {
        setDepartments([
          { id: 1, name: 'IT Department' },
          { id: 2, name: 'Human Resources' },
          { id: 3, name: 'Operations' }
        ]);
      }
    };
    loadDepartments();

    return () => {
      clearError();
    };
  }, [isAuthenticated, navigate, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || !email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    try {
      await signup({
        name,
        email,
        password,
        departmentId: departmentId === '' ? null : Number(departmentId)
      });
      navigate('/');
    } catch (err: any) {
      // Handled by store
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0f19] px-4">
      <div className="glass w-full max-w-md rounded-2xl p-8 shadow-2xl transition duration-500 hover:border-purple-500/20">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 font-bold text-white text-xl shadow-lg shadow-purple-600/30">
            AF
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Create Account</h2>
          <p className="mt-2 text-sm text-gray-400">Join AssetFlow as an employee</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(formError || error) && (
            <div className="rounded-lg bg-red-950/40 border border-red-500/20 p-3 text-sm text-red-400">
              {formError || error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 outline-none transition focus:border-purple-500 focus:bg-gray-900"
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 outline-none transition focus:border-purple-500 focus:bg-gray-900"
              placeholder="e.g. john@assetflow.local"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 outline-none transition focus:border-purple-500 focus:bg-gray-900"
              placeholder="Min. 6 characters"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value === '' ? '' : Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-100 outline-none transition focus:border-purple-500 focus:bg-gray-900"
            >
              <option value="">No Department / Not Assigned</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id} className="bg-gray-950">
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-500 active:bg-purple-700 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-purple-400 hover:text-purple-300 transition">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
