import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { setAccessToken, setAuthFailureHandler, refreshSession } from '../api/axios.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((data) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  // Restore the session on page load using the refresh cookie.
  useEffect(() => {
    setAuthFailureHandler(() => setUser(null));
    refreshSession()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [applySession]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    applySession(data);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    applySession(data);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const value = { user, loading, login, register, logout, isAdmin: user?.role === 'admin' };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
