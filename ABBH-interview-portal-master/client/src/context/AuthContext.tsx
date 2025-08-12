// client/src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

type Role = "CANDIDATE" | "HR";
type User = { id: string; email: string; role: Role; name?: string };

type AuthCtx = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    extra?: Partial<Pick<User, "name">>
  ) => Promise<void>;
  logout: () => void;
  isHR: boolean;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // attach/detach Authorization header on axios
  const applyAxiosAuth = (t: string | null) => {
    if (t) api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
    else delete api.defaults.headers.common["Authorization"];
  };

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u) as User);
      applyAxiosAuth(t);
    }
  }, []);

  const persistAuth = (t: string, u: User) => {
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
    // convenience keys for places that expect role-specific tokens
    if (u.role === "CANDIDATE") localStorage.setItem("cand_token", t);
    if (u.role === "HR") localStorage.setItem("hr_token", t);

    setToken(t);
    setUser(u);
    applyAxiosAuth(t);
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    // backend returns { token, user: { id, role, email, name? } }
    persistAuth(data.token, data.user as User);
  };

  // extra can include name (or later firstName/lastName if you expose them in UI)
  const register = async (
    email: string,
    password: string,
    extra?: Partial<Pick<User, "name">>
  ) => {
    const { data } = await api.post("/api/auth/register", {
      email,
      password,
      ...extra,
    });
    persistAuth(data.token, data.user as User);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("cand_token");
    localStorage.removeItem("hr_token");
    setUser(null);
    setToken(null);
    applyAxiosAuth(null);
  };

  const isHR = user?.role === "HR";

  return (
    <Ctx.Provider value={{ user, token, login, register, logout, isHR }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
