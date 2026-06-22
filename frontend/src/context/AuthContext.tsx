import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  accessUnlocked: boolean;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessUnlocked, setAccessUnlocked] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('token');
      console.log("accessUnlocked on init:", accessUnlocked);
      if (storedToken) {
        try {
          const res = await authApi.getProfile();
          setUser({ ...res.data.user, hasPaid: res.data.hasPaid });
          console.log('User hasPaid:', res.data.user.accessUnlocked);
          setAccessUnlocked(res.data.user.accessUnlocked);
        } catch {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    setAccessUnlocked(newUser?.accessUnlocked);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setAccessUnlocked(false);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => {
      const updatedUser = prev ? { ...prev, ...updates } : null;
      if (updatedUser) {
        setAccessUnlocked(updatedUser?.accessUnlocked);
      } else {
        setAccessUnlocked(false);
      }
      return updatedUser;
    });
  };

  const refreshAuth = async () => {
    try {
      const res = await authApi.getProfile();
      setUser({ ...res.data.user, hasPaid: res.data.hasPaid });
      setAccessUnlocked(res.data.user.accessUnlocked);
    } catch {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setAccessUnlocked(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading, accessUnlocked, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
