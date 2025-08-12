import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api"; // <-- axios instance (adds Authorization)
import dayjs from "../lib/dayjs"; // TZ already configured in your helper
import { useAuth } from "../context/AuthContext";

type InterviewLite = {
  id: string;
  type: "VIDEO" | "WRITTEN";
  submittedAt?: string | null;
};
type JobLite = { id: string; title: string | null };

type ApplicationStatus = {
  id: string;
  stage:
    | "APPLIED"
    | "SCREENING"
    | "WRITTEN"
    | "VIDEO"
    | "FINAL_CALL"
    | "OFFER"
    | "REJECTED";
  status?: "ACTIVE" | "WITHDRAWN";
  finalCallUrl?: string | null;
  finalCallAt?: string | null;
  createdAt: string;
  job: JobLite;
  interviews?: InterviewLite[];
};

export default function ApplicationStatusPage() {
  const nav = useNavigate();
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<ApplicationStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchStatus() {
      try {
        setErr(null);
        setLoading(true);
        // Use root path; api helper prefixes /api and injects Authorization
        const res = await api.get<ApplicationStatus>("/application-status", {
          params: { latest: true },
        });
        if (!mounted) return;
        setApp(res.data);
      } catch (e: any) {
        const msg =
          e?.response?.data?.error || e?.message || "Failed to load status";
        if (!mounted) return;
        setErr(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    // If not logged in yet, bounce to login
    if (!token) {
      nav("/login");
      return;
    }
    fetchStatus();

    return () => {
      mounted = false;
    };
  }, [token, nav]);

  // Helper: first pending VIDEO interview
  const pendingVideo = app?.interviews?.find(
    (i) => i.type === "VIDEO" && !i.submittedAt
  );

  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={2} maxWidth={900} mx="auto">
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Application Status
      </Typography>

      {err ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      ) : null}

      {!app ? (
        <Alert severity="info">No application found yet.</Alert>
      ) : (
        <Card>
          <CardContent>
            <Stack spacing={1.25}>
              <Typography variant="subtitle1" fontWeight={700}>
                {app.job?.title || "Your Application"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Submitted: {dayjs(app.createdAt).format("LLL")}
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <StatusPill label={`Stage: ${app.stage}`} />
                {app.status ? (
                  <StatusPill label={`Status: ${app.status}`} />
                ) : null}
              </Stack>

              {/* VIDEO interview action */}
              {pendingVideo ? (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    A video interview has been assigned to you.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => nav(`/candidate/video/${pendingVideo.id}`)}
                  >
                    Start Video Interview
                  </Button>
                </Box>
              ) : null}

              {/* Final Call action */}
              {app.stage === "FINAL_CALL" && app.finalCallUrl ? (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Final Call scheduled:{" "}
                    {app.finalCallAt
                      ? dayjs(app.finalCallAt).format("LLL")
                      : "Time not set"}
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    href={app.finalCallUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join Final Call
                  </Button>
                </Box>
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <Box
      sx={{
        px: 1,
        py: 0.25,
        borderRadius: 2,
        bgcolor: "action.hover",
        fontSize: 12,
        fontWeight: 700,
        display: "inline-block",
      }}
    >
      {label}
    </Box>
  );
}
