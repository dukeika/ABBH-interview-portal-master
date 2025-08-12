import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  TextField,
  Button,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type Job = {
  id: string;
  title: string;
  status?: "DRAFT" | "PUBLISHED" | "CLOSED";
  location?: string | null;
  department?: string | null;
};

export default function Apply() {
  const nav = useNavigate();

  // form state
  const [jobId, setJobId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState<File | null>(null);

  // jobs state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsErr, setJobsErr] = useState<string | null>(null);

  // submit state
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setJobsLoading(true);
        setJobsErr(null);
        const { data } = await api.get<Job[]>("/jobs");
        if (!mounted) return;
        // Prefer published jobs first (if status exists), but include all
        const sorted = [...data].sort((a, b) => {
          const aPub = a.status === "PUBLISHED" ? 0 : 1;
          const bPub = b.status === "PUBLISHED" ? 0 : 1;
          return aPub - bPub;
        });
        setJobs(sorted);
        // If only one job, preselect it
        if (sorted.length === 1) setJobId(sorted[0].id);
      } catch (e: any) {
        if (!mounted) return;
        setJobsErr(e?.response?.data?.error || "Failed to load roles");
      } finally {
        if (mounted) setJobsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!jobId) {
      setErr("Please select a role to apply for.");
      return;
    }
    if (!resume) {
      setErr("Please upload your resume (PDF/DOC).");
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("jobId", jobId);
      fd.append("name", name);
      fd.append("email", email);
      fd.append("phone", phone);
      fd.append("password", password);
      fd.append("coverLetter", coverLetter);
      fd.append("resume", resume, resume.name);

      await api.post("/apply", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg("Application submitted. You can now log in.");
      // small delay so user sees the success
      setTimeout(() => nav("/login"), 1200);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
      <Paper
        sx={{ p: 3, maxWidth: 700, width: "100%" }}
        component="form"
        onSubmit={submit}
      >
        <Typography variant="h5" fontWeight={800} mb={2}>
          Apply
        </Typography>

        {msg ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            {msg}
          </Alert>
        ) : null}
        {err ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {err}
          </Alert>
        ) : null}

        {/* Roles (Jobs) */}
        <Stack spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              label="Role"
              value={jobId}
              onChange={(e) => setJobId(e.target.value as string)}
              disabled={jobsLoading || !!jobsErr}
            >
              {jobsLoading ? (
                <MenuItem disabled>
                  <CircularProgress size={16} sx={{ mr: 1 }} /> Loading roles…
                </MenuItem>
              ) : jobsErr ? (
                <MenuItem disabled>Error loading roles</MenuItem>
              ) : jobs.length === 0 ? (
                <MenuItem disabled>No roles available</MenuItem>
              ) : (
                jobs.map((j) => (
                  <MenuItem key={j.id} value={j.id}>
                    {j.title}
                    {j.location ? ` — ${j.location}` : ""}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <TextField
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <TextField
            label="Password (for login)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <TextField
            label="Cover letter"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            multiline
            minRows={4}
          />

          <Button variant="outlined" component="label">
            {resume ? `Selected: ${resume.name}` : "Upload Resume (PDF/DOC)"}
            <input
              type="file"
              hidden
              accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={(e) => setResume(e.target.files?.[0] || null)}
            />
          </Button>

          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button
              type="button"
              variant="outlined"
              onClick={() => nav("/login")}
            >
              Already applied? Login
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || jobsLoading}
            >
              {submitting ? "Submitting…" : "Submit Application"}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
