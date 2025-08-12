import React, { createContext, useContext, useState } from "react";
import { api, setToken as saveToken, clearToken, getToken } from "../lib/api";

type Role = "CANDIDATE" | "HR";
type User = { id: string; email: string; role: Role; name?: string | null };

type AuthCtx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    name?: string;
  }) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      // NOTE: no '/api' prefix here; the helper adds it
      const res = await api.post<{ token: string; user: User }>("/auth/login", {
        email,
        password,
      });
      saveToken(res.data.token);
      setTokenState(res.data.token);
      setUser(res.data.user);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Login failed");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function register(payload: {
    email: string;
    password: string;
    name?: string;
  }) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ token: string; user: User }>(
        "/auth/register",
        payload
      );
      saveToken(res.data.token);
      setTokenState(res.data.token);
      setUser(res.data.user);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Registration failed");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearToken();
    setTokenState(null);
    setUser(null);
  }

  return (
    <Ctx.Provider
      value={{ user, token, loading, error, login, register, logout }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
