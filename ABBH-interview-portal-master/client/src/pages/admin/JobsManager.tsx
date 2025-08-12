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
} from "@mui/material";
import { api } from "../../lib/api";

export default function JobsManager() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [department, setDepartment] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const { data } = await api.get("/jobs");
      setJobs(data);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Load failed");
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function addJob() {
    try {
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
      setErr(e?.response?.data?.error || "Create failed");
    }
  }

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight={800}>
        Roles / Jobs
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

      {jobs.map((j) => (
        <JobQuestions key={j.id} job={j} />
      ))}
    </Stack>
  );
}

function JobQuestions({ job }: { job: any }) {
  const [stage, setStage] = useState<"WRITTEN" | "VIDEO">("WRITTEN");
  const [list, setList] = useState<any[]>([]);
  const [text, setText] = useState("");

  async function load() {
    const { data } = await api.get(`/admin/jobs/${job.id}/questions`, {
      params: { forStage: stage },
    });
    setList(data);
  }
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [stage]);

  async function add() {
    await api.post(`/admin/jobs/${job.id}/questions`, {
      text,
      forStage: stage,
      type: "OPEN",
    });
    setText("");
    await load();
  }
  async function remove(id: string) {
    await api.delete(`/admin/jobs/${job.id}/questions/${id}`);
    await load();
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography fontWeight={700} mb={1}>
        {job.title}
      </Typography>
      <Stack direction="row" gap={1} alignItems="center" mb={1}>
        <FormControl size="small">
          <InputLabel id="stage">Stage</InputLabel>
          <Select
            labelId="stage"
            label="Stage"
            value={stage}
            onChange={(e) => setStage(e.target.value as any)}
          >
            <MenuItem value="WRITTEN">WRITTEN</MenuItem>
            <MenuItem value="VIDEO">VIDEO</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label={`New ${stage} question`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          sx={{ minWidth: 420 }}
        />
        <Button size="small" variant="contained" onClick={add}>
          Add
        </Button>
      </Stack>
      <Stack spacing={1}>
        {list.map((q) => (
          <Box
            key={q.id}
            sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}
          >
            <Typography variant="body2">{q.text}</Typography>
            <Button size="small" onClick={() => remove(q.id)}>
              Remove
            </Button>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
