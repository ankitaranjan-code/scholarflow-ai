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
      console.warn("Failed to fetch user, token might be invalid/expired:", err.message);
      localStorage.removeItem('sf_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Add a safety timeout: if loading takes more than 95 seconds, stop loading
    // This prevents the app from showing the loading spinner forever
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn('[Auth] Safety timeout reached — stopping loading state');
        setLoading(false);
      }
    }, 95_000);

    checkAuth();

    return () => clearTimeout(safetyTimeout);
  }, [checkAuth]);

  const login = async (username, password) => {
    const data = await api.login(username, password);
    localStorage.setItem('sf_token', data.access_token);
    // Re-fetch user data with the new token
    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch (err) {
      // If /me fails after login, still consider the user logged in
      // with minimal data extracted from the token
      console.warn('[Auth] /me failed after login, using token data:', err.message);
      try {
        const payload = JSON.parse(atob(data.access_token.split('.')[1]));
        setUser({ id: payload.id, username: payload.sub });
      } catch {
        // Last resort: force a re-check
        await checkAuth();
      }
    }
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
