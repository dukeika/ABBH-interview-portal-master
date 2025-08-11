import React, { useState } from "react";
import { register as apiRegister, setToken } from "../services/api.js";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await apiRegister(form);
      setToken(res.token);
      // go straight to Apply page after register
      navigate("/apply");
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "32px auto", padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>Create your account</h2>
      <p style={{ color: "#666", marginTop: 0 }}>
        Use this account to apply and check your status.
      </p>

      {err && (
        <div
          style={{
            background: "#fee",
            color: "#b00",
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {err}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Full name
          <input
            name="fullName"
            value={form.fullName}
            onChange={onChange}
            required
            style={{ width: "100%", padding: 10, marginTop: 4 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 8 }}>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            required
            style={{ width: "100%", padding: 10, marginTop: 4 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 8 }}>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            required
            style={{ width: "100%", padding: 10, marginTop: 4 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 16 }}>
          Phone (optional)
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            style={{ width: "100%", padding: 10, marginTop: 4 }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "none",
            background: "#222",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
    </div>
  );
}
