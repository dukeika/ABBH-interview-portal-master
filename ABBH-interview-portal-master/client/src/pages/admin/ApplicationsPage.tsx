// client/src/pages/admin/ApplicationsPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Paper,
} from "@mui/material";
import { api } from "../../lib/api";
import RefreshIcon from "@mui/icons-material/Refresh";

type Job = {
  id: string;
  title: string;
};

type Application = {
  id: string;
  candidateName: string;
  email: string;
  phone?: string | null;
  stage: "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFER" | "REJECTED";
  status: "ACTIVE" | "WITHDRAWN";
  job: Job;
  createdAt: string;
};

const stageColor: Record<
  Application["stage"],
  "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info"
> = {
  APPLIED: "info",
  SCREENING: "secondary",
  INTERVIEW: "primary",
  OFFER: "success",
  REJECTED: "error",
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string>(""); // optional filter later
  const [error, setError] = useState<string | null>(null);

  const fetchApps = async () => {
    try {
      setLoading(true);
      setError(null);
      // You can add query params when you wire the filter UI: ?q=...&stage=...
      const data = await api<Application[]>("/api/applications");
      setApps(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return apps.filter((a) => {
      const matchesQ =
        !needle ||
        a.candidateName.toLowerCase().includes(needle) ||
        a.email.toLowerCase().includes(needle) ||
        a.job.title.toLowerCase().includes(needle);
      const matchesStage = !stage || a.stage === stage;
      return matchesQ && matchesStage;
    });
  }, [apps, q, stage]);

  return (
    <Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" fontWeight={700}>
          Applications
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Search name, email, job…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Tooltip title="Refresh">
            <IconButton onClick={fetchApps}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ overflow: "hidden", borderRadius: 3 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr",
            gap: 0,
            bgcolor: "background.default",
          }}
        >
          <HeaderCell>Candidate</HeaderCell>
          <HeaderCell>Job</HeaderCell>
          <HeaderCell>Email</HeaderCell>
          <HeaderCell>Stage</HeaderCell>
          <HeaderCell>Created</HeaderCell>
        </Box>

        {loading ? (
          <Box
            sx={{
              p: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, color: "error.main" }}>{error}</Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ p: 3, color: "text.secondary" }}>
            No applications found.
          </Box>
        ) : (
          filtered.map((a) => (
            <Box
              key={a.id}
              sx={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr",
                alignItems: "center",
                borderTop: 1,
                borderColor: "divider",
                p: 1.5,
              }}
            >
              <Cell primary={a.candidateName} secondary={a.phone || ""} />
              <Cell primary={a.job?.title ?? "—"} />
              <Cell primary={a.email} />
              <Box>
                <Chip
                  size="small"
                  label={a.stage}
                  color={stageColor[a.stage]}
                />
              </Box>
              <Cell primary={new Date(a.createdAt).toLocaleDateString()} />
            </Box>
          ))
        )}
      </Paper>
    </Stack>
  );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        p: 1.5,
        fontWeight: 700,
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      {children}
    </Box>
  );
}

function Cell({
  primary,
  secondary,
}: {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
      <Box sx={{ fontWeight: 600 }}>{primary}</Box>
      {secondary ? (
        <Box sx={{ fontSize: 12, color: "text.secondary" }}>{secondary}</Box>
      ) : null}
    </Box>
  );
}
