import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  api,
  clearToken,
  getToken,
  login as apiLogin,
  LoginResponse,
  setToken,
} from "../lib/api";
import { useNavigate, useLocation } from "react-router-dom";

type Role = "HR" | "CANDIDATE";
type User = { id: string; role: Role; email: string; name?: string | null };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (!token) {
          setUser(null);
          return;
        }
        const { data } = await api.get<{ user: User }>("/auth/me");
        if (!mounted) return;
        setUser(data.user || null);
      } catch {
        setUser(null);
        clearToken();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res: LoginResponse = await apiLogin(email, password);
    setToken(res.token);
    setUser(res.user as User);
    if (res.user.role === "HR") {
      navigate("/admin/applications", { replace: true });
    } else {
      const from = (location.state as any)?.from as string | undefined;
      if (from && !from.startsWith("/admin")) navigate(from, { replace: true });
      else navigate("/status", { replace: true });
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    clearToken();
    setUser(null);
    navigate("/login", { replace: true });
  };

  const value = useMemo<AuthCtx>(
    () => ({ user, loading, login, logout }),
    [user, loading]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
