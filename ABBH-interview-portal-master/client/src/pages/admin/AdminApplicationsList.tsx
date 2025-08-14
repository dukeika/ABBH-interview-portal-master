import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { api } from "../../lib/api";

type Row = {
  id: string;
  stage: string;
  status: string;
  createdAt: string;
  job: { id: string; title: string } | null;
  candidate: { id: string; name?: string | null; email: string } | null;
};

export default function AdminApplicationsList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const { data } = await api.get<Row[]>("/admin/applications");
      setRows(data);
      setErr(null);
    } catch (e: any) {
      setErr(
        e?.response?.data?.error || e?.message || "Failed to load applications."
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <Box p={2}>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Applications
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      <Stack spacing={1}>
        {rows.map((r) => (
          <Paper key={r.id} sx={{ p: 2 }}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
            >
              <Stack spacing={0.5}>
                <Typography fontWeight={700}>
                  {r.candidate?.name || r.candidate?.email || "Applicant"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {r.job?.title || "—"}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip size="small" label={r.stage} />
                  <Typography variant="body2" color="text.secondary">
                    {new Date(r.createdAt).toLocaleString()}
                  </Typography>
                </Stack>
              </Stack>

              {/* Actions */}
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  component={RouterLink}
                  to={`/admin/applications/${r.id}`}
                >
                  View
                </Button>
                <Button
                  size="small"
                  component={RouterLink}
                  to={`/admin/applications/${r.id}/written`}
                >
                  Review Written
                </Button>
                <Button
                  size="small"
                  component={RouterLink}
                  to={`/admin/applications/${r.id}/videos`}
                >
                  Review Videos
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
