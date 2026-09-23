import * as React from 'react';
import { apiClient } from './api-client.js';

export interface User {
  id: string;
  email: string;
  name: string;
  profileComplete: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function checkAuth() {
      try {
        const res = await apiClient<User>('/api/auth/me');
        if (res.success && res.data) {
          setUser(res.data);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = React.useCallback((userData: User) => {
    setUser(userData);
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await apiClient('/api/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
  }, []);

  const updateUser = React.useCallback((userData: User) => {
    setUser(userData);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
