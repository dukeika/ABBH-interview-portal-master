// client/src/pages/WrittenTest.tsx
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
  const [qs, setQs] = useState<WrittenQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!applicationId) throw new Error("Missing applicationId");
        const list = await fetchWrittenQuestions(applicationId);
        setQs(list);
      } catch (e: any) {
        setErr(
          e?.response?.data?.error || e?.message || "Failed to load questions."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [applicationId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId) return;
    try {
      setSaving(true);
      const payload = qs.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || "",
      }));
      await submitWrittenAnswers(applicationId, payload);
      setOk(true);
      setErr(null);
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || "Submit failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h5" fontWeight={800}>
        Written Test
      </Typography>

      {loading && <LinearProgress sx={{ my: 2 }} />}
      {err && (
        <Alert severity="error" sx={{ my: 2 }}>
          {err}
        </Alert>
      )}
      {ok && (
        <Alert severity="success" sx={{ my: 2 }}>
          Your answers have been submitted. HR will review them.
        </Alert>
      )}

      {!loading && qs.length === 0 && (
        <Alert severity="info">No written questions assigned.</Alert>
      )}

      {qs.length > 0 && (
        <form onSubmit={onSubmit}>
          <Stack spacing={2} sx={{ maxWidth: 800, mt: 2 }}>
            {qs.map((q, i) => (
              <Card key={q.id} variant="outlined">
                <CardHeader
                  title={`Q${q.order ?? i + 1}`}
                  subheader={q.prompt}
                />
                <CardContent>
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    value={answers[q.id] || ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [q.id]: e.target.value,
                      }))
                    }
                  />
                </CardContent>
              </Card>
            ))}

            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? "Submitting…" : "Submit"}
              </Button>
              <Button variant="outlined" onClick={() => navigate("/status")}>
                Back to Status
              </Button>
            </Stack>
          </Stack>
        </form>
      )}
    </Box>
  );
}
