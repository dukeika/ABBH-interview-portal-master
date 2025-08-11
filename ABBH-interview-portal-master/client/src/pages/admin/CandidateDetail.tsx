import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Chip,
  Divider,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  TextField,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";

type Job = { id: string; title: string; location?: string | null };
type Answer = {
  id: string;
  answer?: string | null;
  score?: number | null;
  notes?: string | null;
  question: { text: string };
};
type Interview = {
  id: string;
  type: "WRITTEN" | "VIDEO";
  durationMins: number;
  submittedAt?: string | null;
  answers: Answer[];
};
type Application = {
  id: string;
  candidateName: string;
  email: string;
  phone?: string | null;
  resumeUrl?: string | null;
  coverLetter?: string | null;
  stage: "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFER" | "REJECTED";
  status: "ACTIVE" | "WITHDRAWN";
  overallScore?: number | null;
  createdAt: string;
  job: Job;
  interviews: Interview[];
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

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stage, setStage] = useState<Application["stage"]>("APPLIED");
  const [status, setStatus] = useState<Application["status"]>("ACTIVE");

  // ---- Load application (NOTE the /api prefix) ----
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api<Application>(`/api/applications/${id}`);
        setApp(data);
        setStage(data.stage);
        setStatus(data.status);
      } catch (e: any) {
        setError(e?.message || "Failed to load application");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const interviews = useMemo(() => app?.interviews ?? [], [app]);

  async function save() {
    if (!id) return;
    try {
      setSaving(true);
      const updated = await api<Application>(`/api/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ stage, status }),
      });
      setApp(updated);
    } catch (e: any) {
      setError(e?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  function nextStage() {
    const idx = STAGES.indexOf(stage);
    if (idx >= 0 && idx < STAGES.length - 1) setStage(STAGES[idx + 1]);
  }

  // ---- UI states ----
  if (loading) {
    return (
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
    );
  }

  if (error) {
    return (
      <Stack sx={{ p: 3 }} spacing={2}>
        <Alert severity="error">{error}</Alert>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Stack>
    );
  }

  if (!app) {
    return (
      <Stack sx={{ p: 3 }} spacing={2}>
        <Alert severity="warning">Application not found.</Alert>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Stack>
    );
  }

  // ---- Main ----
  return (
    <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack spacing={0.5}>
          <Typography variant="h5" fontWeight={800}>
            {app.candidateName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {app.email} {app.phone ? `• ${app.phone}` : ""}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary">
            Job
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {app.job?.title ?? "—"}{" "}
            {app.job?.location ? `— ${app.job.location}` : ""}
          </Typography>

          <Divider />

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
          >
            <Chip
              size="small"
              label={`Stage: ${stage}`}
              color={stageColor[stage]}
            />
            <Chip size="small" label={`Status: ${status}`} />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="stage-label">Change Stage</InputLabel>
              <Select
                labelId="stage-label"
                label="Change Stage"
                value={stage}
                onChange={(e) => setStage(e.target.value as any)}
              >
                {STAGES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                <MenuItem value="WITHDRAWN">WITHDRAWN</MenuItem>
              </Select>
            </FormControl>
            <Button
              size="small"
              variant="text"
              onClick={nextStage}
              disabled={stage === "REJECTED" || stage === "OFFER"}
            >
              Move to Next Stage
            </Button>
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Resume
            </Typography>
            {app.resumeUrl ? (
              <a href={app.resumeUrl} target="_blank" rel="noreferrer">
                {app.resumeUrl}
              </a>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No resume provided
              </Typography>
            )}
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Cover Letter
            </Typography>
            {app.coverLetter ? (
              <TextField
                value={app.coverLetter}
                multiline
                minRows={5}
                fullWidth
                InputProps={{ readOnly: true }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No cover letter provided
              </Typography>
            )}
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
          Interviews
        </Typography>
        {interviews.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No interviews yet.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {interviews.map((iv) => (
              <Box
                key={iv.id}
                sx={{
                  p: 1.5,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography fontWeight={700}>
                    {iv.type} • {iv.durationMins} mins
                  </Typography>
                  <Chip
                    size="small"
                    label={iv.submittedAt ? "Submitted" : "Pending"}
                    color={iv.submittedAt ? "success" : "default"}
                  />
                </Stack>
                <Divider sx={{ my: 1 }} />
                {iv.answers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No answers.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {iv.answers.map((a) => (
                      <Box key={a.id}>
                        <Typography variant="body2" fontWeight={700}>
                          {a.question.text}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: "pre-wrap" }}
                        >
                          {a.answer || "—"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Score: {a.score ?? "—"}{" "}
                          {a.notes ? `• ${a.notes}` : ""}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
