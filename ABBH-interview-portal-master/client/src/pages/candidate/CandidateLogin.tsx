// client/src/pages/candidate/CandidateLogin.tsx
import { useState } from "react";
import {
  Stack,
  Paper,
  TextField,
  Button,
  Alert,
  Typography,
} from "@mui/material";
import { api } from "../../lib/api";
import { useNavigate } from "react-router-dom";

export default function CandidateLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api<{ token: string; user: any }>(
        "/candidate/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }
      );
      localStorage.setItem("cand_token", res.token);
      navigate("/candidate/dashboard");
    } catch (e: any) {
      setError(e?.message || "Login failed");
    }
  }

  return (
    <Stack alignItems="center" sx={{ p: 3 }}>
      <Paper
        sx={{ p: 3, borderRadius: 3, width: "100%", maxWidth: 420 }}
        variant="outlined"
      >
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
          Candidate Login
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" variant="contained">
              Log In
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
