import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, setStoredToken, getStoredToken } from '../api/client';

export type Role = 'OWNER' | 'KASIR';

export interface User {
  id: string;
  username: string;
  name: string;
  roles: Role[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, passwordPlain: string) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const data = await apiFetch<User>('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
      setStoredToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (username: string, passwordPlain: string): Promise<User> => {
    const res = await apiFetch<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password: passwordPlain }),
    });

    if (res.token) {
      setStoredToken(res.token);
    }
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setUser(null);
      setStoredToken(null);
    }
  };

  const hasRole = (role: Role): boolean => {
    if (!user) return false;
    return user.roles.includes(role);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
