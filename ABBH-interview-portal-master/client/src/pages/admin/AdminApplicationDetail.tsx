import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";

type AppDetail = {
  id: string;
  stage: string;
  status: string;
  resumeUrl: string | null;
  coverLetter: string | null;
  finalCallUrl: string | null;
  finalCallAt: string | null;
  job: { id: string; title: string } | null;
  candidate: { id: string; name?: string | null; email: string } | null;
};

export default function AdminApplicationDetail() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // final-call form
  const [fcUrl, setFcUrl] = useState("");
  const [fcAt, setFcAt] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<AppDetail>(
        `/admin/applications/${applicationId}`
      );
      setData(data);
      setErr(null);
      setFcUrl(data.finalCallUrl || "");
      setFcAt(data.finalCallAt ? data.finalCallAt.slice(0, 16) : "");
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

  const act = async (url: string, body?: any) => {
    try {
      setBusy(true);
      setErr(null);
      await api.post(url, body ?? {});
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Application Detail
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}
      {!loading && !data && <Alert severity="warning">Not found.</Alert>}

      {data && (
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              {data.candidate?.name || "Applicant"}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              {data.job?.title || "—"}
            </Typography>

            <Stack spacing={1} sx={{ mb: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight={700}>Email:</Typography>
                <Typography>{data.candidate?.email}</Typography>
              </Stack>

              {/* ✅ no Chip inside Typography */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight={700}>Stage:</Typography>
                <Chip size="small" label={data.stage} />
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight={700}>Status:</Typography>
                <Typography>{data.status}</Typography>
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
              >
                <Typography fontWeight={700}>Resume:</Typography>
                {data.resumeUrl ? (
                  <a
                    href={
                      data.resumeUrl.startsWith("/")
                        ? data.resumeUrl
                        : `/${data.resumeUrl}`
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open resume
                  </a>
                ) : (
                  <Typography>—</Typography>
                )}
              </Stack>

              <Box>
                <Typography fontWeight={700} component="div" sx={{ mb: 0.5 }}>
                  Cover Letter:
                </Typography>
                <Typography component="div" whiteSpace="pre-wrap">
                  {data.coverLetter || "—"}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Divider />

          {/* Action Row */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="outlined"
              disabled={busy}
              onClick={() =>
                act(`/admin/applications/${data.id}/assign-written`)
              }
            >
              Move to Written
            </Button>
            <Button
              variant="outlined"
              disabled={busy}
              onClick={() => act(`/admin/applications/${data.id}/assign-video`)}
            >
              Move to Video
            </Button>
            <Button
              variant="contained"
              color="success"
              disabled={busy}
              onClick={() => act(`/admin/applications/${data.id}/accept`)}
            >
              Accept Application
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={busy}
              onClick={() => act(`/admin/applications/${data.id}/reject`)}
            >
              Reject Application
            </Button>
            <Button
              variant="text"
              component={RouterLink}
              to={`/admin/applications/${data.id}/written`}
            >
              Review Written Answers
            </Button>
            <Button
              variant="text"
              component={RouterLink}
              to={`/admin/applications/${data.id}/videos`} // ✅ ensure /videos (plural)
            >
              Review Video Responses
            </Button>

            <Button
              variant="text"
              onClick={() => navigate("/admin/applications")}
            >
              Back to Admin
            </Button>
          </Stack>

          <Divider />

          {/* Final Call scheduling */}
          <Stack spacing={1}>
            <Typography variant="h6" fontWeight={700}>
              Final Call (Video Chat)
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <TextField
                size="small"
                label="Final Call URL"
                placeholder="https://meet.example.com/..."
                value={fcUrl}
                onChange={(e) => setFcUrl(e.target.value)}
                sx={{ minWidth: 360 }}
              />
              <TextField
                size="small"
                label="Final Call Time"
                type="datetime-local"
                value={fcAt}
                onChange={(e) => setFcAt(e.target.value)}
              />
              <Button
                variant="contained"
                disabled={busy || !fcUrl}
                onClick={() =>
                  act(`/admin/applications/${data.id}/schedule-final-call`, {
                    finalCallUrl: fcUrl,
                    finalCallAt: fcAt ? new Date(fcAt).toISOString() : null,
                  })
                }
              >
                Move to Final Call
              </Button>
              <Button
                variant="outlined"
                disabled={busy}
                onClick={() =>
                  act(`/admin/applications/${data.id}/clear-final-call`)
                }
              >
                Clear Final Call
              </Button>
            </Stack>
            {data.finalCallUrl && (
              <Typography variant="body2" color="text.secondary">
                Current:{" "}
                <a href={data.finalCallUrl} target="_blank" rel="noreferrer">
                  {data.finalCallUrl}
                </a>{" "}
                {data.finalCallAt
                  ? `at ${new Date(data.finalCallAt).toLocaleString()}`
                  : ""}
              </Typography>
            )}
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
