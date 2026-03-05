import React, { createContext, useContext, useEffect, useState } from "react";
import { storage } from "@/lib/storage";

const STORAGE_KEY = "gh_token";

interface User {
  id: number;
  login: string;
  avatar_url?: string;
}

interface AuthContextValue {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await storage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { token: string; user: User };
          setToken(parsed.token);
          setUser(parsed.user);
        }
      } catch {
        // SecureStore may not be available in simulator
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (t: string, u: User) => {
    try {
      await storage.setItem(STORAGE_KEY, JSON.stringify({ token: t, user: u }));
      setToken(t);
      setUser(u);
    } catch (e) {
      setToken(t);
      setUser(u);
    }
  };

  const logout = async () => {
    try {
      await storage.deleteItem(STORAGE_KEY);
    } catch {}
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
