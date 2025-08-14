import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchWrittenQuestions,
  submitWrittenAnswers,
  WrittenQuestion,
} from "../lib/api";

export default function WrittenTest() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [questions, setQuestions] = useState<WrittenQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!applicationId) throw new Error("Missing applicationId");
        setLoading(true);
        setErr(null);

        const qs = await fetchWrittenQuestions(applicationId);
        setQuestions(qs);

        const init: Record<string, string> = {};
        qs.forEach((q) => (init[q.id] = ""));
        setAnswers(init);
      } catch (e: any) {
        setErr(
          e?.response?.data?.error || e?.message || "Failed to load questions."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [applicationId]);

  const onChange = (qid: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: val }));
  };

  const handleSubmit = async () => {
    if (!applicationId) return;
    try {
      setSaving(true);
      setErr(null);
      const payload = questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || "",
      }));
      await submitWrittenAnswers(applicationId, payload);
      setSaved(true);
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || "Submit failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Written Test
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}
      {!loading && questions.length === 0 && !err && (
        <Alert severity="info">
          No written questions have been assigned yet.
        </Alert>
      )}
      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Your answers have been submitted! You can return to your status page.
        </Alert>
      )}

      <Stack spacing={2}>
        {questions.map((q, idx) => (
          <Card key={q.id} variant="outlined">
            <CardHeader
              title={
                <Typography fontWeight={700}>
                  Q{q.order}. {q.prompt}
                </Typography>
              }
              subheader={`Question ${idx + 1} of ${questions.length}`}
            />
            <CardContent>
              <TextField
                value={answers[q.id] ?? ""}
                onChange={(e) => onChange(q.id, e.target.value)}
                fullWidth
                multiline
                minRows={4}
                placeholder="Type your answer here…"
              />
            </CardContent>
          </Card>
        ))}
      </Stack>

      {questions.length > 0 && (
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            {saving ? "Submitting…" : "Submit"}
          </Button>
          <Button variant="text" onClick={() => navigate("/status")}>
            Back to Status
          </Button>
        </Stack>
      )}
    </Box>
  );
}
