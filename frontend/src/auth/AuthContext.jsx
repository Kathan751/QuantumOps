import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('assetflow_token'));
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    authApi.me().then(setUser).catch(() => {
      localStorage.removeItem('assetflow_token');
      setToken(null);
      setUser(null);
    }).finally(() => setLoading(false));
  }, [token]);

  async function login(credentials) {
    const result = await authApi.login(credentials);
    localStorage.setItem('assetflow_token', result.token);
    setToken(result.token);
    setUser(result.user);
  }

  async function signup(payload) {
    const result = await authApi.signup(payload);
    localStorage.setItem('assetflow_token', result.token);
    setToken(result.token);
    setUser(result.user);
  }

  function logout() {
    localStorage.removeItem('assetflow_token');
    setToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({ user, token, loading, login, signup, logout }), [user, token, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
