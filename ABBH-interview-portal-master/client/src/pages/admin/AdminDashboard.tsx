// client/src/pages/admin/AdminDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Divider,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

type Job = {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  department?: string | null;
  location?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type Application = {
  id: string;
  candidateName: string;
  email: string;
  phone?: string | null;
  stage: "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFER" | "REJECTED";
  status: "ACTIVE" | "WITHDRAWN";
  overallScore?: number | null;
  createdAt: string;
  job: Job;
};

const STAGES: Application["stage"][] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];

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

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string>("");
  const [jobId, setJobId] = useState<string>("");

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const [jobsData, appsData] = await Promise.all([
        api<Job[]>("/api/jobs"),
        api<any>("/api/applications"), // may be array OR {items,total,take,skip}
      ]);

      setJobs(jobsData);
      setApps(Array.isArray(appsData) ? appsData : appsData.items ?? []);
    } catch (e: any) {
      setError(e?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return apps.filter((a) => {
      const matchesQ =
        !needle ||
        a.candidateName.toLowerCase().includes(needle) ||
        a.email.toLowerCase().includes(needle) ||
        (a.job?.title || "").toLowerCase().includes(needle);

      const matchesStage = !stage || a.stage === stage;
      const matchesJob = !jobId || a.job?.id === jobId;
      return matchesQ && matchesStage && matchesJob;
    });
  }, [apps, q, stage, jobId]);

  const stats = useMemo(() => {
    const totalJobs = jobs.length;
    const publishedJobs = jobs.filter((j) => j.status === "PUBLISHED").length;
    const totalApps = apps.length;

    const byStage = STAGES.reduce<Record<string, number>>((acc, s) => {
      acc[s] = apps.filter((a) => a.stage === s).length;
      return acc;
    }, {});

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const last7 = apps.filter(
      (a) => new Date(a.createdAt).getTime() >= weekAgo
    ).length;

    const recent = [...filtered]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 12);

    return { totalJobs, publishedJobs, totalApps, byStage, last7, recent };
  }, [jobs, apps, filtered]);

  return (
    <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack spacing={0.5}>
          <Typography variant="h5" fontWeight={800}>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of jobs, applications, and pipeline health
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchAll}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            onClick={() => {
              try {
                navigate("/admin/applications");
              } catch {
                /* ignore if route not present */
              }
            }}
          >
            View All Applications
          </Button>
        </Stack>
      </Stack>

      {/* Summary cards */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        <SummaryCard
          icon={<PeopleOutlineIcon />}
          title="Total Applications"
          value={stats.totalApps}
          subtitle={`Last 7 days: ${stats.last7}`}
        />
        <SummaryCard
          icon={<WorkOutlineIcon />}
          title="Jobs (Published)"
          value={`${stats.publishedJobs}/${stats.totalJobs}`}
          subtitle="Published / Total"
        />
        <SummaryCard
          icon={<AssessmentIcon />}
          title="Pipeline: Screening"
          value={stats.byStage["SCREENING"] ?? 0}
          subtitle="In screening stage"
        />
        <SummaryCard
          icon={<PendingActionsIcon />}
          title="Pipeline: Interviews"
          value={stats.byStage["INTERVIEW"] ?? 0}
          subtitle="Scheduled / in progress"
        />
      </Box>

      {/* Filters */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 3,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <TextField
          size="small"
          label="Search (name, email, job)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ minWidth: 240 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="stage-label">Stage</InputLabel>
          <Select
            labelId="stage-label"
            label="Stage"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {STAGES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="job-label">Job</InputLabel>
          <Select
            labelId="job-label"
            label="Job"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {jobs.map((j) => (
              <MenuItem key={j.id} value={j.id}>
                {j.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Applications list */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1.6fr 1.4fr 1fr 0.8fr",
            bgcolor: "background.default",
          }}
        >
          <HeaderCell>Candidate</HeaderCell>
          <HeaderCell>Job</HeaderCell>
          <HeaderCell>Email</HeaderCell>
          <HeaderCell>Stage</HeaderCell>
          <HeaderCell>Date</HeaderCell>
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
            No applications match your filters.
          </Box>
        ) : (
          filtered.map((a) => (
            <Box
              key={a.id}
              onClick={() => navigate(`/admin/applications/${a.id}`)}
              sx={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1.6fr 1.4fr 1fr 0.8fr",
                alignItems: "center",
                borderTop: 1,
                borderColor: "divider",
                p: 1.5,
                cursor: "pointer",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Cell primary={a.candidateName} secondary={a.phone || "—"} />
              <Cell primary={a.job?.title ?? "—"} secondary={a.job?.location} />
              <Cell primary={a.email} />
              <Box>
                <Chip
                  size="small"
                  label={a.stage}
                  color={stageColor[a.stage]}
                />
              </Box>
              <Cell
                primary={new Date(a.createdAt).toLocaleDateString()}
                secondary={new Date(a.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
            </Box>
          ))
        )}

        <Divider />
        <Box
          sx={{
            p: 1.5,
            display: "flex",
            justifyContent: "flex-end",
            bgcolor: "background.paper",
          }}
        >
          <Button
            size="small"
            onClick={() => {
              try {
                navigate("/admin/applications");
              } catch {}
            }}
          >
            View All
          </Button>
        </Box>
      </Paper>
    </Stack>
  );
}

/* ---------------- Small UI helpers ---------------- */

function SummaryCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  subtitle?: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          p: 1.2,
          borderRadius: 2,
          bgcolor: "action.hover",
          display: "inline-flex",
        }}
      >
        {icon}
      </Box>
      <Stack spacing={0.25}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5" fontWeight={800}>
          {value}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        p: 1.25,
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
      <Box sx={{ fontWeight: 600, wordBreak: "break-word" }}>{primary}</Box>
      {secondary ? (
        <Box sx={{ fontSize: 12, color: "text.secondary" }}>{secondary}</Box>
      ) : null}
    </Box>
  );
}
