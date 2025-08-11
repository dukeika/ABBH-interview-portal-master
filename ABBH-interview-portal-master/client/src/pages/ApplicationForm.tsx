import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import api from "../../api/client";

type Role = { id: number; title: string };

export default function ApplicationForm() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [jobRoleId, setJobRoleId] = useState<number | "">("");
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await api.get<Role[]>("/job-roles");
      setRoles(data);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resume || !jobRoleId)
      return setMessage("Please select a role and upload a resume.");
    const form = new FormData();
    form.append("jobRoleId", String(jobRoleId));
    form.append("coverLetter", coverLetter);
    form.append("resume", resume);
    const { data } = await api.post("/applications", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setMessage(`Application submitted. Current stage: ${data.stage}`);
  };

  return (
    <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
      <Paper sx={{ p: 3, maxWidth: 720, width: "100%" }}>
        <Typography variant="h5" fontWeight={700} mb={2}>
          Submit Application
        </Typography>
        <Box component="form" onSubmit={submit}>
          <Stack spacing={2}>
            <TextField
              select
              label="Role"
              value={jobRoleId}
              onChange={(e) => setJobRoleId(Number(e.target.value))}
            >
              {roles.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.title}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              multiline
              minRows={6}
              label="Cover Letter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
            <Button variant="outlined" component="label">
              Upload Resume
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResume(e.target.files?.[0] || null)}
              />
            </Button>
            {resume && (
              <Typography variant="body2">Selected: {resume.name}</Typography>
            )}
            <Button type="submit" variant="contained">
              Submit
            </Button>
            {message && <Typography color="secondary">{message}</Typography>}
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
