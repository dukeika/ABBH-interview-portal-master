import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Button,
  Chip,
  Divider,
  Alert,
  TextField,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { api, API_BASE } from "../../lib/api";

type AppDetail = {
  id: string;
  candidateName: string;
  email: string;
  phone?: string | null;
  resumeUrl?: string | null;
  coverLetter?: string | null;
  stage: string;
  status?: string | null;
  overallScore?: number | null;
  createdAt: string;
  job: { id: string; title: string | null };
  interviews: Array<{
    id: string;
    type: "WRITTEN" | "VIDEO";
    submittedAt?: string | null;
    answers?: Array<{
      id?: string;
      question: { text: string };
      answer: string;
    }>;
    videos?: Array<{
      id?: string;
      questionId?: string | null;
      filePath: string;
      attemptCount: number;
    }>;
  }>;
};

export default function ApplicationDetail() {
  const { id = "" } = useParams();
  const [data, setData] = useState<AppDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [finalUrl, setFinalUrl] = useState("");
  const [finalAt, setFinalAt] = useState("");

  async function load() {
    try {
      setErr(null);
      const { data } = await api.get<AppDetail>(`/applications/${id}`);
      setData(data);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Failed to load application");
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function move(stage: string) {
    try {
      await api.patch(`/admin/applications/${id}/stage`, { stage });
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Stage update failed");
    }
  }

  async function scheduleFinal() {
    try {
      await api.patch(`/admin/applications/${id}/stage`, {
        stage: "FINAL_CALL",
        finalCallUrl: finalUrl,
        finalCallAt: finalAt ? new Date(finalAt).toISOString() : null,
      });
      setFinalUrl("");
      setFinalAt("");
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Failed to schedule final call");
    }
  }

  async function assignWritten() {
    try {
      if (!data?.job?.id) return;
      const { data: qs } = await api.get(
        `/admin/jobs/${data.job.id}/questions`,
        { params: { forStage: "WRITTEN" } }
      );
      await api.post(`/admin/applications/${id}/assign-written`, {
        questionIds: qs.map((q: any) => q.id),
        durationMins: 30,
      });
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Assign written failed");
    }
  }

  async function assignVideo() {
    try {
      if (!data?.job?.id) return;
      const { data: qs } = await api.get(
        `/admin/jobs/${data.job.id}/questions`,
        { params: { forStage: "VIDEO" } }
      );
      await api.post(`/admin/applications/${id}/assign-video`, {
        questionIds: qs.map((q: any) => q.id),
        durationMins: 15,
      });
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Assign video failed");
    }
  }

  const resumeHref = useMemo(() => {
    const url = data?.resumeUrl;
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url; // already absolute
    return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
  }, [data?.resumeUrl]);

  if (!data)
    return (
      <Box p={3}>
        {err ? <Alert severity="error">{err}</Alert> : "Loading..."}
      </Box>
    );

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight={800}>
        Application Detail
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Typography fontWeight={700}>
            {data.candidateName} — {data.email}
          </Typography>
          <Typography variant="body2">Job: {data.job?.title}</Typography>

          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
            <Chip label={`Stage: ${data.stage}`} />
            {data.status ? <Chip label={`Status: ${data.status}`} /> : null}
            {data.overallScore != null ? (
              <Chip label={`Score: ${data.overallScore}`} />
            ) : null}
          </Stack>

          {/* Resume & Cover Letter */}
          <Divider sx={{ my: 1 }} />
          <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
            <Typography fontWeight={700}>Documents:</Typography>
            {resumeHref ? (
              <Button
                size="small"
                variant="outlined"
                component="a"
                href={resumeHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Resume
              </Button>
            ) : (
              <Chip label="No Resume" size="small" />
            )}
          </Stack>
          {data.coverLetter ? (
            <Box sx={{ mt: 1 }}>
              <Typography fontWeight={700} gutterBottom>
                Cover Letter
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, whiteSpace: "pre-wrap" }}>
                {data.coverLetter}
              </Paper>
            </Box>
          ) : null}

          {/* Actions */}
          <Divider sx={{ my: 1 }} />
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Button
              size="small"
              variant="outlined"
              onClick={() => move("REJECTED")}
            >
              Reject
            </Button>
            <Button size="small" variant="outlined" onClick={assignWritten}>
              Move to WRITTEN
            </Button>
            <Button size="small" variant="outlined" onClick={assignVideo}>
              Move to VIDEO
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => move("OFFER")}
            >
              Make Offer
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Interviews */}
      {data.interviews?.length ? (
        data.interviews.map((iv) => (
          <Paper key={iv.id} sx={{ p: 2 }}>
            <Typography fontWeight={700} mb={1}>
              {iv.type} Interview {iv.submittedAt ? "(Submitted)" : "(Pending)"}
            </Typography>

            {iv.answers?.length ? (
              <Stack spacing={1}>
                {iv.answers.map((a, idx) => (
                  <Box key={a.id || `${iv.id}-ans-${idx}`}>
                    <Typography fontWeight={600}>
                      {idx + 1}. {a.question?.text}
                    </Typography>
                    <Typography variant="body2" whiteSpace="pre-wrap">
                      {a.answer}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : null}

            {iv.videos?.length ? (
              <Stack spacing={1} mt={1}>
                {iv.videos.map((v, idx) => (
                  <Box key={v.id || `${iv.id}-vid-${idx}`}>
                    <Typography variant="body2">
                      Q: {v.questionId || "—"} • Attempts: {v.attemptCount}
                    </Typography>
                    <video
                      src={`${
                        /^https?:\/\//i.test(v.filePath)
                          ? v.filePath
                          : `${API_BASE}${
                              v.filePath.startsWith("/")
                                ? v.filePath
                                : `/${v.filePath}`
                            }`
                      }`}
                      controls
                      style={{ width: 420, maxWidth: "100%" }}
                    />
                  </Box>
                ))}
              </Stack>
            ) : null}
          </Paper>
        ))
      ) : (
        <Paper sx={{ p: 2 }}>
          <Typography color="text.secondary">No interviews yet.</Typography>
        </Paper>
      )}

      {/* Final call scheduling */}
      <Paper sx={{ p: 2 }}>
        <Typography fontWeight={700} mb={1}>
          Final Call
        </Typography>
        <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
          <TextField
            size="small"
            label="Meeting link (Zoom/Teams/Meet)"
            value={finalUrl}
            onChange={(e) => setFinalUrl(e.target.value)}
            sx={{ minWidth: 420 }}
          />
          <TextField
            size="small"
            type="datetime-local"
            label="Scheduled time"
            value={finalAt}
            onChange={(e) => setFinalAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button size="small" variant="contained" onClick={scheduleFinal}>
            Set FINAL_CALL
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
