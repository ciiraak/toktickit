import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthUser, loginApi, logoutApi, getCurrentUserApi, changePasswordApi } from "../api";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUserApi();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const loggedUser = await loginApi(email, password);
    setUser(loggedUser);
    return loggedUser;
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await changePasswordApi(currentPassword, newPassword);
    if (user) {
      setUser({ ...user, requiresPasswordChange: false });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      loading: false,
      login: async () => ({ id: 0, name: "", email: "", role: "REQUESTER" as const, requiresPasswordChange: false }),
      logout: async () => {},
      changePassword: async () => {},
      refreshUser: async () => {},
    };
  }
  return context;
}
