// client/src/components/SystemHealth.tsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function SystemHealth() {
  const [state, setState] = useState<"ok" | "loading" | "error">("loading");

  useEffect(() => {
    api<{ ok: boolean }>("/api/health")
      .then((d) => setState(d.ok ? "ok" : "error"))
      .catch(() => setState("error"));
  }, []);

  if (state === "loading") return <span>Checking system…</span>;
  if (state === "error") return <span>Health: ❌</span>;
  return <span>Health: ✅</span>;
}
