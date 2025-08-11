// client/src/pages/candidate/CandidateDashboard.tsx
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import {
  Stack,
  Paper,
  Typography,
  Chip,
  Box,
  Alert,
  Button,
} from "@mui/material";

type App = {
  id: string;
  candidateName: string;
  email: string;
  stage: "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFER" | "REJECTED";
  status: "ACTIVE" | "WITHDRAWN";
  createdAt: string;
  job: { title: string; location?: string | null };
};

export default function CandidateDashboard() {
  const [apps, setApps] = useState<App[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("cand_token") || "";
        const res = await fetch(
          `${
            import.meta.env.VITE_API_BASE || "http://localhost:4000"
          }/candidate/me/apps`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to load applications");
        const data = await res.json();
        setApps(data);
      } catch (e: any) {
        setError(e?.message || "Could not load your applications.");
      }
    })();
  }, []);

  if (error)
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );

  return (
    <Stack sx={{ p: { xs: 2, md: 3 } }} spacing={2}>
      <Typography variant="h5" fontWeight={800}>
        My Applications
      </Typography>
      {apps.length === 0 ? (
        <Typography color="text.secondary">
          You have no applications yet.
        </Typography>
      ) : (
        apps.map((a) => (
          <Paper key={a.id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography fontWeight={700}>
              {a.job.title} {a.job.location ? `— ${a.job.location}` : ""}
            </Typography>
            <Box sx={{ mt: 1, display: "flex", gap: 1, alignItems: "center" }}>
              <Chip size="small" label={`Stage: ${a.stage}`} />
              <Chip size="small" label={`Status: ${a.status}`} />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                Applied: {new Date(a.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
            {/* If stage == INTERVIEW, show "Continue" button to next step */}
            {a.stage === "INTERVIEW" && (
              <Button sx={{ mt: 1.5 }} variant="contained" size="small">
                Continue interview
              </Button>
            )}
          </Paper>
        ))
      )}
    </Stack>
  );
}
