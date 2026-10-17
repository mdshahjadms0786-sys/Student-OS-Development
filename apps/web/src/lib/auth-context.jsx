import * as React from "react";
import { apiClient } from "./api-client.js";

const AuthContext = React.createContext(undefined);

function formatUser(userData) {
  if (!userData) return null;
  const isComplete = Boolean(
    userData.profileComplete ||
    (userData.profile &&
      (userData.profile.program || userData.profile.semester))
  );
  return {
    ...userData,
    profileComplete: isComplete,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function checkAuth() {
      try {
        const res = await apiClient("/api/auth/me");
        if (res.success && res.data) {
          setUser(formatUser(res.data));
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = React.useCallback((userData) => {
    setUser(formatUser(userData));
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await apiClient("/api/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
  }, []);

  const updateUser = React.useCallback((userData) => {
    setUser(formatUser(userData));
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
