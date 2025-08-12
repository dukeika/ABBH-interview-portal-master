import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

type Q = { id: string; text: string };
type Info = {
  interview: { id: string; type: "WRITTEN"; durationMins: number };
  job: { title: string | null };
  questions: Q[];
  answers: { questionId: string; answer: string }[];
};

export default function WrittenTest() {
  const { interviewId = "" } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<Info | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Info>(`/interviews/${interviewId}`);
        setInfo(data);
        const map: Record<string, string> = {};
        (data.answers || []).forEach((a) => {
          map[a.questionId] = a.answer || "";
        });
        setAnswers(map);
      } catch (e: any) {
        setErr(e?.response?.data?.error || "Failed to load test");
      } finally {
        setLoading(false);
      }
    })();
  }, [interviewId]);

  async function submit() {
    try {
      const payload = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));
      await api.post(`/interviews/${interviewId}/answers/batch`, {
        answers: payload,
      });
      await api.post(`/interviews/${interviewId}/submit`);
      nav("/status");
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Submit failed");
    }
  }

  if (loading)
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  if (err)
    return (
      <Box p={3}>
        <Alert severity="error">{err}</Alert>
      </Box>
    );

  return (
    <Box p={2} maxWidth={900} mx="auto">
      <Typography variant="h5" fontWeight={800} gutterBottom>
        {info?.job?.title || "Written Test"}
      </Typography>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            {(info?.questions || []).map((q, idx) => (
              <Box key={q.id}>
                <Typography fontWeight={700} mb={1}>
                  {idx + 1}. {q.text}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  value={answers[q.id] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                />
              </Box>
            ))}
            <Stack direction="row" justifyContent="flex-end" gap={1}>
              <Button variant="outlined" onClick={() => nav("/status")}>
                Cancel
              </Button>
              <Button variant="contained" onClick={submit}>
                Submit
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
