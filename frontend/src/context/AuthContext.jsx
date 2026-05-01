import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('sf_token');
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch (err) {
      console.warn("Failed to fetch user, token might be invalid/expired");
      localStorage.removeItem('sf_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username, password) => {
    const data = await api.login(username, password);
    localStorage.setItem('sf_token', data.access_token);
    await checkAuth();
  };

  const register = async (userData) => {
    await api.register(userData);
    await login(userData.username, userData.password);
  };

  const logout = () => {
    localStorage.removeItem('sf_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
