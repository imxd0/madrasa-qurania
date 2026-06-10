import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const session = await api.session();
      if (session.isAuthenticated) {
        setIsAuthenticated(true);
        localStorage.setItem('madrasa_auth', 'true');
        return true;
      }
    } catch {}
    setIsAuthenticated(false);
    localStorage.removeItem('madrasa_auth');
    return false;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('madrasa_auth');
    if (saved === 'true') {
      checkSession().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [checkSession]);

  const login = async (password) => {
    const session = await api.login('admin', password);
    setIsAuthenticated(true);
    localStorage.setItem('madrasa_auth', 'true');
    return session;
  };

  const logout = async () => {
    await api.logout().catch(() => {});
    setIsAuthenticated(false);
    localStorage.removeItem('madrasa_auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
