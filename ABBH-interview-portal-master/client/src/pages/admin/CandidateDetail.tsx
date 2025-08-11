import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Link as MLink,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import api from "../../api/client";

type Answer = {
  id: number;
  answerText: string;
  question: { text: string; order: number };
};
type Video = {
  id: number;
  videoPath: string;
  question: { text: string; order: number };
};
type App = {
  id: number;
  stage: string;
  stageStatus: string;
  coverLetter: string;
  resumePath: string;
  finalInterviewLink?: string | null;
  candidate: { email: string; fullName?: string | null; phone?: string | null }; // ← add
  jobRole: { title: string };
  answers: Answer[];
  videos: Video[];
  events: Array<{
    action: string;
    stage: string;
    createdAt: string;
    note?: string | null;
  }>;
};

export default function CandidateDetail() {
  const { id } = useParams();
  const [app, setApp] = useState<App | null>(null);
  const [note, setNote] = useState("");
  const [finalLink, setFinalLink] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/admin/applications/${id}`);
      setApp(data);
      setFinalLink(data?.finalInterviewLink || "");
    })();
  }, [id]);

  const decide = async (decision: "APPROVE" | "REJECT") => {
    await api.post(`/admin/applications/${id}/decision`, { decision, note });
    const { data } = await api.get(`/admin/applications/${id}`);
    setApp(data);
  };
  const advance = async () => {
    await api.post(`/admin/applications/${id}/advance`);
    const { data } = await api.get(`/admin/applications/${id}`);
    setApp(data);
  };
  const saveLink = async () => {
    await api.post(`/admin/applications/${id}/final-link`, { link: finalLink });
    const { data } = await api.get(`/admin/applications/${id}`);
    setApp(data);
  };
  const revert = async () => {
    await api.post(`/admin/applications/${id}/revert`);
    const { data } = await api.get(`/admin/applications/${id}`);
    setApp(data);
  };

  if (!app) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>
            {app.candidate.fullName || app.candidate.email}
          </Typography>
          <Typography>
            Contact: <b>{app.candidate.email}</b>
            {app.candidate.phone ? `  •  ${app.candidate.phone}` : ""}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip label={`Stage: ${app.stage}`} color="primary" />
            <Chip label={`Status: ${app.stageStatus}`} />
          </Stack>

          <Divider />
          <Typography variant="h6" fontWeight={700}>
            Documents
          </Typography>
          <MLink href={app.resumePath} target="_blank">
            Download Resume
          </MLink>
          <Typography fontWeight={700}>Cover Letter</Typography>
          <Typography whiteSpace="pre-wrap">{app.coverLetter}</Typography>

          <Divider />
          <Typography variant="h6" fontWeight={700}>
            Written Answers
          </Typography>
          <Stack spacing={2}>
            {app.answers
              .sort((a, b) => a.question.order - b.question.order)
              .map((a) => (
                <Stack key={a.id}>
                  <Typography fontWeight={700}>
                    {a.question.order}. {a.question.text}
                  </Typography>
                  <Typography whiteSpace="pre-wrap">{a.answerText}</Typography>
                </Stack>
              ))}
          </Stack>

          <Divider />
          <Typography variant="h6" fontWeight={700}>
            Video Answers
          </Typography>
          <Stack spacing={2}>
            {app.videos
              .sort((a, b) => a.question.order - b.question.order)
              .map((v) => (
                <Stack key={v.id}>
                  <Typography fontWeight={700}>
                    {v.question.order}. {v.question.text}
                  </Typography>
                  <video
                    src={v.videoPath}
                    controls
                    style={{ width: "100%", borderRadius: 12 }}
                  />
                </Stack>
              ))}
          </Stack>

          <Divider />
          <Typography variant="h6" fontWeight={700}>
            Decisions
          </Typography>
          <TextField
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={() => decide("REJECT")}>
              Reject
            </Button>
            <Button variant="contained" onClick={() => decide("APPROVE")}>
              Approve
            </Button>
            <Button variant="contained" color="secondary" onClick={advance}>
              Move to Next Stage
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={revert}
              disabled={app.stage === "APPLIED"}
            >
              Move to Previous Stage
            </Button>
          </Stack>

          {app.stage === "FINAL" && (
            <>
              <Divider />
              <Typography variant="h6" fontWeight={700}>
                Final Interview Link
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="Meeting URL"
                  value={finalLink}
                  onChange={(e) => setFinalLink(e.target.value)}
                />
                <Button variant="contained" onClick={saveLink}>
                  Save
                </Button>
              </Stack>
            </>
          )}

          <Divider />
          <Typography variant="h6" fontWeight={700}>
            Activity
          </Typography>
          <Stack spacing={1}>
            {app.events.map((ev) => (
              <Typography key={`${ev.createdAt}-${ev.action}`}>
                [{new Date(ev.createdAt).toLocaleString()}] <b>{ev.stage}</b> –{" "}
                {ev.action} {ev.note ? `– ${ev.note}` : ""}
              </Typography>
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
