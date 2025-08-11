// at top: remove `type App = ...` and the useState for `app`
import React, { useEffect, useState } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/client";
import VideoRecorder from "../../components/video/VideoRecorder";

type Q = { id: number; text: string; order: number };

export default function VideoInterview() {
  const { id } = useParams();
  const nav = useNavigate();
  const [questions, setQuestions] = useState<Q[]>([]);
  const [i, setI] = useState(0);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const me = await api.get("/applications/me");
      if (me.data) {
        const qs = await api.get(
          `/job-roles/${me.data.jobRoleId}/questions?type=VIDEO`
        );
        setQuestions(qs.data);
      }
    })();
  }, [id]);

  const onRecorded = async (blob: Blob, durationSec: number) => {
    const q = questions[i];
    const form = new FormData();
    form.append("questionId", String(q.id));
    form.append("durationSec", String(durationSec));
    form.append("video", blob, `answer_q${q.id}.webm`);
    await api.post(`/applications/${id}/video/upload`, form);
    if (i < questions.length - 1) setI(i + 1);
    else {
      setMsg("All videos uploaded. Await HR review.");
      setTimeout(() => nav("/status"), 1200);
    }
  };

  if (!questions.length) return null;

  const q = questions[i];
  return (
    <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
      <Paper sx={{ p: 3, maxWidth: 900, width: "100%" }}>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={700}>
            Question {q.order}
          </Typography>
          <Typography>{q.text}</Typography>
          <VideoRecorder onRecorded={onRecorded} />
          <Stack direction="row" spacing={2}>
            <Button disabled={i === 0} onClick={() => setI(i - 1)}>
              Prev
            </Button>
            <Button disabled>
              {i + 1} / {questions.length}
            </Button>
            <Button
              disabled={i === questions.length - 1}
              onClick={() => setI(i + 1)}
            >
              Next
            </Button>
          </Stack>
          {msg && <Typography color="secondary">{msg}</Typography>}
        </Stack>
      </Paper>
    </Box>
  );
}
