import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import dayjs from "dayjs";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type Stage =
  | "APPLIED"
  | "SCREENING"
  | "WRITTEN"
  | "VIDEO"
  | "FINAL_CALL"
  | "OFFER"
  | "REJECTED";
type InterviewType = "WRITTEN" | "VIDEO";

type InterviewLite = {
  id: string;
  type: InterviewType;
};

type Application = {
  id: string;
  stage: Stage;
  status: string;
  candidateName?: string | null;
  email?: string | null;
  finalCallUrl?: string | null;
  finalCallAt?: string | null;
  createdAt?: string;
  job?: { id: string; title: string; location?: string | null } | null;
  // backend may or may not include this; we code defensively
  interviews?: InterviewLite[];
};

export default function ApplicationStatus() {
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();

  const token =
    localStorage.getItem("cand_token") ||
    localStorage.getItem("token") || // fallback if you store a generic token
    "";

  async function fetchStatus() {
    try {
      setErr(null);
      setLoading(true);
      const res = await fetch(
        `${API_BASE}/api/application-status?latest=true`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
      const data = (await res.json()) as Application | null;
      setApp(data);
    } catch (e: any) {
      setErr(e?.message || "Failed to load status");
      setApp(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      nav("/login");
      return;
    }
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stageColor = (stage?: Stage) => {
    switch (stage) {
      case "APPLIED":
        return "default";
      case "SCREENING":
        return "info";
      case "WRITTEN":
        return "primary";
      case "VIDEO":
        return "warning";
      case "FINAL_CALL":
        return "secondary";
      case "OFFER":
        return "success";
      case "REJECTED":
        return "error";
      default:
        return "default";
    }
  };

  const statusColor = (status?: string) => {
    if (!status) return "default" as const;
    const s = status.toUpperCase();
    if (s.includes("ACTIVE") || s.includes("PENDING")) return "default";
    if (s.includes("APPROVED") || s.includes("OFFER")) return "success";
    if (s.includes("REJECT")) return "error";
    return "default";
  };

  const writtenIv = useMemo(
    () => app?.interviews?.find((i) => i.type === "WRITTEN"),
    [app]
  );
  const videoIv = useMemo(
    () => app?.interviews?.find((i) => i.type === "VIDEO"),
    [app]
  );

  return (
    <Box sx={{ maxWidth: 980, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" fontWeight={800}>
          Application Status
        </Typography>
        <Button onClick={fetchStatus}>Refresh</Button>
      </Stack>

      {loading && (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      )}

      {!loading && err && <Alert severity="error">{err}</Alert>}

      {!loading && !err && !app && (
        <Alert severity="info">
          You don’t have any applications yet.{" "}
          <Link to="/apply-now">Apply now</Link>.
        </Alert>
      )}

      {!loading && !err && app && (
        <Card sx={{ borderRadius: 3, overflow: "hidden" }}>
          <CardHeader
            title={app.job?.title || "Application"}
            subheader={
              app.job?.location ? `Location: ${app.job.location}` : undefined
            }
          />
          <CardContent>
            <Stack
              direction="row"
              spacing={1}
              sx={{ mb: 2, flexWrap: "wrap", rowGap: 1 }}
            >
              <Chip
                label={`Stage: ${app.stage || "Unknown"}`}
                color={stageColor(app.stage)}
              />
              <Chip
                label={`Status: ${app.status || "N/A"}`}
                color={statusColor(app.status)}
              />
              {app.createdAt && (
                <Chip
                  variant="outlined"
                  label={`Applied: ${dayjs(app.createdAt).format(
                    "MMM D, YYYY"
                  )}`}
                />
              )}
            </Stack>

            {/* Next actions depending on stage */}
            <Stack spacing={2}>
              {app.stage === "SCREENING" && (
                <Alert severity="info">
                  Your application is under review. We’ll notify you when the
                  next step is ready.
                </Alert>
              )}

              {app.stage === "WRITTEN" && (
                <StagePanel
                  title="Written Interview"
                  description="Please answer the written questions assigned to you. You can submit once done."
                  action={
                    writtenIv ? (
                      <Button
                        variant="contained"
                        component={Link}
                        to={`/candidate/written/${writtenIv.id}`}
                      >
                        Start Written Interview
                      </Button>
                    ) : (
                      <Alert severity="warning">
                        Waiting for HR to assign your written interview.
                      </Alert>
                    )
                  }
                />
              )}

              {app.stage === "VIDEO" && (
                <StagePanel
                  title="Video Interview"
                  description="Record short responses to the video prompts. You can preview and retry before uploading."
                  action={
                    videoIv ? (
                      <Button
                        variant="contained"
                        component={Link}
                        to={`/candidate/video/${videoIv.id}`}
                      >
                        Start Video Interview
                      </Button>
                    ) : (
                      <Alert severity="warning">
                        Waiting for HR to assign your video interview.
                      </Alert>
                    )
                  }
                />
              )}

              {app.stage === "FINAL_CALL" && (
                <StagePanel
                  title="Final Call"
                  description="Join the scheduled live interview with our team."
                  action={
                    app.finalCallUrl ? (
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                      >
                        <Button
                          variant="contained"
                          href={app.finalCallUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Join Call
                        </Button>
                        {app.finalCallAt && (
                          <Chip
                            variant="outlined"
                            label={`Scheduled: ${dayjs(app.finalCallAt).format(
                              "ddd, MMM D · h:mm A"
                            )}`}
                          />
                        )}
                      </Stack>
                    ) : (
                      <Alert severity="info">
                        A recruiter will send your meeting link soon. Please
                        check back later.
                      </Alert>
                    )
                  }
                />
              )}

              {app.stage === "OFFER" && (
                <Alert severity="success">
                  Congratulations! You’ve been approved. Our team will reach out
                  with next steps.
                </Alert>
              )}

              {app.stage === "REJECTED" && (
                <Alert severity="error">
                  We appreciate your time and interest. Unfortunately, we won’t
                  be moving forward at this time.
                </Alert>
              )}
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" gutterBottom>
              Applicant
            </Typography>
            <Typography color="text.secondary">
              {app.candidateName || "—"} {app.email ? `• ${app.email}` : ""}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function StagePanel({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems="center"
          spacing={2}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={800}>
              {title}
            </Typography>
            <Typography color="text.secondary">{description}</Typography>
          </Box>
          <Box>{action}</Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
