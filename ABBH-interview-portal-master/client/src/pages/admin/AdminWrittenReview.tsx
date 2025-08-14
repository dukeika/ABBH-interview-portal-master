// client/src/pages/admin/AdminWrittenReview.tsx
import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { fetchAdminWrittenReview } from "../../lib/api";

export default function AdminWrittenReview() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<{
    submittedAt: string | null;
    items: {
      question: { id: string; prompt: string; order: number };
      answer: string;
    }[];
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!applicationId) throw new Error("Missing applicationId");
        const d = await fetchAdminWrittenReview(applicationId);
        setData(d);
      } catch (e: any) {
        setErr(e?.response?.data?.error || e?.message || "Failed to load.");
      } finally {
        setLoading(false);
      }
    })();
  }, [applicationId]);

  return (
    <Box p={2}>
      <Typography variant="h5" fontWeight={800}>
        Written Answers
      </Typography>

      {loading && <LinearProgress sx={{ my: 2 }} />}
      {err && (
        <Alert severity="error" sx={{ my: 2 }}>
          {err}
        </Alert>
      )}

      {data && data.items.length === 0 && (
        <Alert severity="info">No written answers submitted yet.</Alert>
      )}

      <Stack spacing={2} sx={{ mt: 2 }}>
        {data?.items.map((it, i) => (
          <Card key={i} variant="outlined">
            <CardHeader
              title={`Q${it.question.order}`}
              subheader={it.question.prompt}
            />
            <CardContent>
              <Typography whiteSpace="pre-wrap">{it.answer || "—"}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
