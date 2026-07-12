import { create } from 'zustand';
import apiClient from '../api/client';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'ASSET_MANAGER' | 'DEPARTMENT_HEAD' | 'EMPLOYEE';
  departmentId: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  department?: {
    id: number;
    name: string;
  } | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  signup: (payload: { name: string; email: string; password: string; departmentId?: number | null }) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: true,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<{ token: string; user: User }>('/auth/login', credentials);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      set({ token, user, isAuthenticated: true, loading: false });
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to login';
      set({ error: errMsg, loading: false, isAuthenticated: false });
      throw new Error(errMsg);
    }
  },

  signup: async (payload) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<{ token: string; user: User }>('/auth/signup', payload);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      set({ token, user, isAuthenticated: true, loading: false });
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to sign up';
      set({ error: errMsg, loading: false, isAuthenticated: false });
      throw new Error(errMsg);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false, loading: false, error: null });
  },

  fetchCurrentUser: async () => {
    const token = get().token;
    if (!token) {
      set({ loading: false, isAuthenticated: false });
      return;
    }
    set({ loading: true });
    try {
      const response = await apiClient.get<{ user: User }>('/auth/me');
      set({ user: response.data.user, isAuthenticated: true, loading: false });
    } catch (err: any) {
      localStorage.removeItem('token');
      set({ token: null, user: null, isAuthenticated: false, loading: false });
    }
  },

  clearError: () => set({ error: null })
}));
