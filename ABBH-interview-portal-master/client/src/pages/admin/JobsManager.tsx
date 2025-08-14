import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  TextField,
  Button,
  Typography,
  Divider,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  Chip,
} from "@mui/material";
import { api } from "../../lib/api";

type Job = {
  id: string;
  title: string;
  description: string;
  location?: string | null;
  department?: string | null;
  status: string;
  createdAt: string;
};

type Stage = "WRITTEN" | "VIDEO";

type QItem = {
  id: string;
  prompt: string;
  order: number;
  forStage: Stage;
  type: "OPEN";
  createdAt: string;
};

export default function JobsManager() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [department, setDepartment] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const { data } = await api.get<Job[]>("/admin/jobs");
      // Ensure array
      setJobs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addJob() {
    try {
      setErr(null);
      await api.post("/admin/jobs", {
        title,
        description,
        location,
        department,
        status: "PUBLISHED",
      });
      setTitle("");
      setDescription("");
      setLocation("");
      setDepartment("");
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Create job failed");
    }
  }

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight={800}>
        Jobs & Questions
      </Typography>
      {err ? <Alert severity="error">{err}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Typography fontWeight={700} mb={1}>
          Create Job
        </Typography>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <TextField
            size="small"
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            size="small"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ minWidth: 360 }}
          />
          <TextField
            size="small"
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <TextField
            size="small"
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
          <Button size="small" variant="contained" onClick={addJob}>
            Add
          </Button>
        </Stack>
      </Paper>

      <Divider />

      {loading && <Typography>Loading…</Typography>}
      {!loading && jobs.length === 0 && (
        <Alert severity="info">No jobs yet. Create one above.</Alert>
      )}

      {jobs.map((j) => (
        <JobQuestions key={j.id} job={j} />
      ))}
    </Stack>
  );
}

function JobQuestions({ job }: { job: Job }) {
  const [stage, setStage] = useState<Stage>("WRITTEN");
  const [list, setList] = useState<QItem[]>([]);
  const [prompt, setPrompt] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setErr(null);
      const { data } = await api.get<QItem[]>(
        `/admin/jobs/${job.id}/questions`,
        { params: { forStage: stage } }
      );
      const arr = Array.isArray(data) ? data : [];
      // sort by order then createdAt
      arr.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      setList(arr);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Failed to load questions");
    }
  }

  useEffect(() => {
    load(); // eslint-disable-next-line
  }, [stage]);

  async function add() {
    if (!prompt.trim()) return;
    try {
      setBusy(true);
      setErr(null);
      await api.post(`/admin/jobs/${job.id}/questions`, {
        prompt,
        forStage: stage,
        type: "OPEN",
      });
      setPrompt("");
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Add question failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      setBusy(true);
      setErr(null);
      await api.delete(`/admin/jobs/${job.id}/questions/${id}`);
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Remove failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography fontWeight={700}>{job.title}</Typography>
        <Chip size="small" label={job.status} />
      </Stack>

      <Stack direction="row" gap={1} alignItems="center" my={1} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id={`stage-${job.id}`}>Stage</InputLabel>
          <Select
            labelId={`stage-${job.id}`}
            label="Stage"
            value={stage}
            onChange={(e) => setStage(e.target.value as Stage)}
          >
            <MenuItem value="WRITTEN">WRITTEN</MenuItem>
            <MenuItem value="VIDEO">VIDEO</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          label={`New ${stage} question`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          sx={{ minWidth: 420 }}
        />
        <Button size="small" variant="contained" onClick={add} disabled={busy}>
          Add
        </Button>
      </Stack>

      {err && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {err}
        </Alert>
      )}

      <Stack spacing={1}>
        {list.map((q) => (
          <Box
            key={q.id}
            sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}
          >
            <Typography variant="body2">
              <b>Q{q.order}.</b> {q.prompt}
            </Typography>
            <Button
              size="small"
              color="error"
              onClick={() => remove(q.id)}
              disabled={busy}
            >
              Remove
            </Button>
          </Box>
        ))}
        {list.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No {stage.toLowerCase()} questions yet for this job.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
