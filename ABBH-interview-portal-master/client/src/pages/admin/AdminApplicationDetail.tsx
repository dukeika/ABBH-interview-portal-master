import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { api, API_BASE } from "../../lib/api";

function makeAbsolute(url?: string | null) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const origin = API_BASE.replace(/\/api$/, "");
  return url.startsWith("/") ? `${origin}${url}` : `${origin}/${url}`;
}

export default function AdminApplicationDetail() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();

  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const resumeLink = useMemo(
    () => makeAbsolute(app?.resumeUrl),
    [app?.resumeUrl]
  );

  const load = async () => {
    if (!applicationId) return;
    try {
      setLoading(true);
      setErr(null);
      const { data } = await api.get(`/admin/applications/${applicationId}`);
      setApp(data);
    } catch (e: any) {
      setErr(
        e?.response?.data?.error || e?.message || "Failed to load application."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const post = async (path: string) => {
    if (!applicationId) return;
    try {
      setWorking(path);
      setErr(null);
      await api.post(`/admin/applications/${applicationId}/${path}`);
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || "Action failed.");
    } finally {
      setWorking(null);
    }
  };

  if (loading) {
    return (
      <Box p={2}>
        <CircularProgress size={18} />{" "}
        <Typography component="span">Loading…</Typography>
      </Box>
    );
  }

  if (err)
    return (
      <Box p={2}>
        <Alert severity="error">{err}</Alert>
      </Box>
    );
  if (!app) return null;

  return (
    <Box p={2}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={800}>
          Application Detail
        </Typography>

        <Card variant="outlined">
          <CardHeader
            title={
              app?.candidate?.name ||
              app?.candidateName ||
              app?.email ||
              "Candidate"
            }
            subheader={app?.job?.title || "Job"}
          />
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="body2">
                <b>Email:</b> {app?.candidate?.email || app?.email || "—"}
              </Typography>
              <Typography variant="body2">
                <b>Stage:</b> <Chip size="small" label={app?.stage} />
              </Typography>
              <Typography variant="body2">
                <b>Status:</b> {app?.status}
              </Typography>
              {resumeLink ? (
                <Typography variant="body2">
                  <b>Resume:</b>{" "}
                  <a href={resumeLink} target="_blank" rel="noreferrer">
                    Open resume
                  </a>
                </Typography>
              ) : (
                <Typography variant="body2">
                  <b>Resume:</b> —
                </Typography>
              )}
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                <b>Cover Letter:</b>{" "}
                {app?.coverLetter ? `\n${app.coverLetter}` : "—"}
              </Typography>

              <Divider sx={{ my: 1 }} />
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  variant="outlined"
                  onClick={() => post("assign-written")}
                  disabled={working !== null}
                >
                  Move to Written
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => post("assign-video")}
                  disabled={working !== null}
                >
                  Move to Video
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => post("accept")}
                  disabled={working !== null}
                >
                  Accept Application
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => post("reject")}
                  disabled={working !== null}
                >
                  Reject Application
                </Button>

                <Button
                  variant="text"
                  onClick={() =>
                    navigate(`/admin/applications/${applicationId}/written`)
                  }
                >
                  Review Written Answers
                </Button>
                <Button
                  variant="text"
                  onClick={() =>
                    navigate(`/admin/applications/${applicationId}/videos`)
                  }
                >
                  Review Video Responses
                </Button>

                <Button variant="text" component={RouterLink} to="/admin">
                  Back to Admin
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
