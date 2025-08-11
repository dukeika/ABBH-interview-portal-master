// client/src/pages/ApplyNow.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, API_BASE } from "../lib/api";

type Job = {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  location?: string | null;
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function ApplyNow() {
  const navigate = useNavigate();
  const { jobId: jobIdFromParams } = useParams<{ jobId: string }>();
  const [search] = useSearchParams();
  const jobIdFromQuery = search.get("jobId") || undefined;
  const initialJobId = jobIdFromParams || jobIdFromQuery;

  // form state
  const [jobId, setJobId] = useState(initialJobId || "");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // ui state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const mustChooseJob = useMemo(() => !initialJobId, [initialJobId]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (mustChooseJob) {
          const data = await api<Job[]>("/api/jobs?status=PUBLISHED");
          setJobs(data);
        }
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [mustChooseJob]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // validations
    if (!jobId) return setError("Please select a job.");
    if (!fullName.trim()) return setError("Full name is required.");
    if (!email.trim() || !isEmail(email))
      return setError("Enter a valid email.");
    if (!password || password.length < 6)
      return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setSubmitting(true);
    try {
      await api("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          jobId,
          candidateName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          resumeUrl: resumeUrl.trim(),
          coverLetter: coverLetter.trim(),
          password, // <- required by backend to create Candidate account
        }),
      });

      setSuccessOpen(true);

      // reset fields (keep job selection)
      setFullName("");
      setEmail("");
      setPhone("");
      setResumeUrl("");
      setCoverLetter("");
      setPassword("");
      setConfirm("");

      // Optional: route to candidate login so they can view status immediately
      // setTimeout(() => navigate("/candidate/login"), 1200);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          p: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack sx={{ p: { xs: 2, md: 4 }, alignItems: "center" }}>
      <Paper
        variant="outlined"
        sx={{
          width: "100%",
          maxWidth: 720,
          p: { xs: 2, md: 3 },
          borderRadius: 3,
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={800}>
            Apply for a Role
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your candidate account while applying so you can log in and
            track your status.
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <Box component="form" noValidate onSubmit={onSubmit}>
            <Stack spacing={2.2}>
              {/* Job picker (only if no jobId in URL) */}
              {mustChooseJob && (
                <FormControl size="medium" fullWidth>
                  <InputLabel id="job-label">Select Job</InputLabel>
                  <Select
                    labelId="job-label"
                    label="Select Job"
                    value={jobId}
                    onChange={(e) => setJobId(String(e.target.value))}
                  >
                    {jobs.length === 0 ? (
                      <MenuItem value="" disabled>
                        No published jobs
                      </MenuItem>
                    ) : (
                      jobs.map((j) => (
                        <MenuItem key={j.id} value={j.id}>
                          {j.title} {j.location ? `— ${j.location}` : ""}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              )}

              <TextField
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                fullWidth
              />

              <TextField
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />

              <TextField
                label="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                fullWidth
              />

              <TextField
                label="Resume URL (optional)"
                helperText="Paste a link to your resume (Google Drive, Dropbox, etc.)"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                fullWidth
              />

              {/* Cover Letter */}
              <TextField
                label="Cover Letter (optional)"
                placeholder="Write a brief note about why you're a good fit…"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                multiline
                minRows={5}
                fullWidth
              />

              {/* Passwords */}
              <TextField
                type="password"
                label="Create Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />
              <TextField
                type="password"
                label="Confirm Password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                fullWidth
              />

              <Stack
                direction="row"
                spacing={1.5}
                justifyContent="flex-end"
                alignItems="center"
              >
                <Button
                  variant="text"
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit Application"}
                </Button>
              </Stack>
            </Stack>
          </Box>

          <Typography variant="caption" color="text.secondary">
            API: <code>POST {API_BASE}/api/applications</code>
          </Typography>
        </Stack>
      </Paper>

      <Snackbar
        open={successOpen}
        autoHideDuration={2000}
        onClose={() => setSuccessOpen(false)}
        message="Application submitted! You can now log in to the Candidate Dashboard."
      />
    </Stack>
  );
}
