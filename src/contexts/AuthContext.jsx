import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api.session()
      .then((session) => {
        if (!mounted) return;
        setIsAuthenticated(session.isAuthenticated);
        setIsAdmin(session.isAdmin);
        setRole(session.role);
      })
      .catch(() => {
        if (!mounted) return;
        setIsAuthenticated(false);
        setIsAdmin(false);
        setRole('');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (selectedRole, password = '') => {
    const session = await api.login(selectedRole, password);
    setIsAuthenticated(true);
    setIsAdmin(session.isAdmin);
    setRole(session.role);
    return session;
  };

  const logout = async () => {
    await api.logout().catch(() => {});
    setIsAuthenticated(false);
    setIsAdmin(false);
    setRole('');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, role, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
