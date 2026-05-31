"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { UserResponse } from "@/lib/types";

const DEV_USER: UserResponse = {
  id: "dev-001",
  email: "dev@moonsbow.com",
  full_name: "Dev User",
  tenant_id: null,
  is_active: true,
  is_superuser: true,
};

const DEV_TOKEN = "dev-token-moonsbow-local-development";

interface AuthContextType {
  user: UserResponse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token === DEV_TOKEN) {
      setUser(DEV_USER);
      setIsLoading(false);
    } else if (token) {
      api.me()
        .then((data) => setUser(data))
        .catch(() => localStorage.removeItem("access_token"))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    if (email === "dev@moonsbow.com" && password === "dev123") {
      localStorage.setItem("access_token", DEV_TOKEN);
      setUser(DEV_USER);
      router.push("/");
      return;
    }

    const data = await api.login({ email, password });
    localStorage.setItem("access_token", data.access_token);
    const me = await api.me();
    setUser(me);
    router.push("/");
  };

  const register = async (email: string, password: string, full_name?: string) => {
    await api.register({ email, password, full_name });
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
