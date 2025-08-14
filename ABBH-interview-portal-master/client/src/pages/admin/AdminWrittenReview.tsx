import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { fetchAdminWrittenReview, AdminWrittenItem } from "../../lib/api";

export default function AdminWrittenReview() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [items, setItems] = useState<AdminWrittenItem[]>([]);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!applicationId) throw new Error("Missing applicationId");
        setLoading(true);
        setErr(null);
        const d = await fetchAdminWrittenReview(applicationId);
        setItems(d.items || []);
        setSubmittedAt(d.submittedAt);
      } catch (e: any) {
        setErr(
          e?.response?.data?.error ||
            e?.message ||
            "Failed to load written answers."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [applicationId]);

  return (
    <Box p={2}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={800}>
          Written Responses
        </Typography>
        {submittedAt && (
          <Alert severity="success">
            Submitted at {new Date(submittedAt).toLocaleString()}
          </Alert>
        )}
        {loading && <LinearProgress />}
        {err && <Alert severity="error">{err}</Alert>}

        {!loading && items.length === 0 && (
          <Alert severity="info">
            No written responses have been submitted yet.
          </Alert>
        )}

        {items.map((it, idx) => (
          <Card key={it.question.id} variant="outlined">
            <CardHeader
              title={
                <Typography fontWeight={700}>
                  Q{it.question.order}. {it.question.prompt}
                </Typography>
              }
              subheader={`Question ${idx + 1}`}
            />
            <Divider />
            <CardContent>
              <Typography whiteSpace="pre-wrap">{it.answer || "—"}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
