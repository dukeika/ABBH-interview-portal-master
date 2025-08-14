import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type StatusApp = {
  id: string;
  stage:
    | "APPLIED"
    | "SCREENING"
    | "WRITTEN"
    | "VIDEO"
    | "FINAL_CALL"
    | "OFFER"
    | "REJECTED";
  status: string;
  job?: { id: string; title: string } | null;
  finalCallUrl?: string | null;
  finalCallAt?: string | null;
  videoAssignedCount?: number;
  videoResponseCount?: number;
  hasVideoStarted?: boolean;
  hasVideoCompleted?: boolean;
  hasWrittenSubmitted?: boolean; // ✅ new
};

export default function ApplicationStatus() {
  const navigate = useNavigate();
  const [app, setApp] = useState<StatusApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get<{ application: StatusApp | null }>(
          "/application-status",
          {
            params: { latest: true },
          }
        );
        setApp(data.application);
        setErr(null);
      } catch (e: any) {
        setErr(
          e?.response?.data?.error || e?.message || "Failed to load status."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Box p={2}>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Application Status
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      {!loading && !app && <Alert severity="info">No application found.</Alert>}

      {app && (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1} sx={{ mb: 2 }}>
              <Typography>
                <b>Job:</b> {app.job?.title || "—"}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight={700}>Stage:</Typography>
                <Chip size="small" label={app.stage} />
              </Stack>
            </Stack>

            {/* WRITTEN */}
            {app.stage === "WRITTEN" &&
              (app.hasWrittenSubmitted ? (
                <Button variant="contained" disabled>
                  Written Submitted
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => navigate(`/written/${app.id}`)}
                >
                  Start Written Test
                </Button>
              ))}

            {/* VIDEO */}
            {app.stage === "VIDEO" && (
              <>
                {!app.hasVideoStarted && (
                  <Button
                    variant="contained"
                    onClick={() => navigate(`/video-setup/${app.id}`)}
                  >
                    Start Video Interview
                  </Button>
                )}
                {app.hasVideoStarted && !app.hasVideoCompleted && (
                  <Button
                    variant="contained"
                    onClick={() => navigate(`/video-interview/${app.id}`)}
                  >
                    Continue Video Interview
                  </Button>
                )}
                {app.hasVideoCompleted && (
                  <Button variant="contained" disabled>
                    Video Submitted
                  </Button>
                )}
              </>
            )}

            {/* FINAL CALL */}
            {app.stage === "FINAL_CALL" && (
              <Stack spacing={1}>
                <Typography>
                  You’ve been invited to a final video call. Details are below:
                </Typography>

                {/* Show as plain text with link, not a button */}
                {app.finalCallUrl ? (
                  <Typography>
                    Final call link:{" "}
                    <a href={app.finalCallUrl} target="_blank" rel="noreferrer">
                      {app.finalCallUrl}
                    </a>
                  </Typography>
                ) : (
                  <Alert severity="info">
                    HR will share the call link and details here.
                  </Alert>
                )}

                {app.finalCallAt && (
                  <Typography variant="body2" color="text.secondary">
                    Scheduled for {new Date(app.finalCallAt).toLocaleString()}
                  </Typography>
                )}
              </Stack>
            )}

            {app.stage === "OFFER" && (
              <Alert severity="success">
                Congratulations! You’ve reached the offer stage.
              </Alert>
            )}

            {app.stage === "REJECTED" && (
              <Alert severity="warning">
                Thank you for your time. You were not selected.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
