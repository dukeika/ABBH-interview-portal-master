import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErr(null);
      setLoading(true);
      await login(email.trim(), password);
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={2} display="flex" justifyContent="center">
      <Card variant="outlined" sx={{ width: 420 }}>
        <CardHeader title="Sign in" />
        <CardContent>
          {err && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {err}
            </Alert>
          )}
          <form onSubmit={onSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
              <Typography variant="caption" color="text.secondary">
                HR can use the credentials from server/.env (HR_EMAIL /
                HR_PASSWORD).
              </Typography>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
