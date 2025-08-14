import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchVideoQuestions,
  uploadVideoAnswer,
  VideoQuestion,
} from "../lib/api";

const PREP_SECONDS = 15;
const RECORD_SECONDS = 120;

const nowISO = () => new Date().toISOString();

export default function VideoInterview() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [questions, setQuestions] = useState<VideoQuestion[]>([]);
  const [index, setIndex] = useState(0);

  const [prep, setPrep] = useState<number | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pct, setPct] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mrRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedRef = useRef<string>("");
  const endedRef = useRef<string>("");

  const q = useMemo(() => questions[index] || null, [questions, index]);

  // Load questions
  useEffect(() => {
    (async () => {
      try {
        if (!applicationId) throw new Error("Missing applicationId");
        setLoading(true);
        setErr(null);
        const qs = await fetchVideoQuestions(applicationId);
        setQuestions(qs);
      } catch (e: any) {
        setErr(
          e?.response?.data?.error || e?.message || "Failed to load questions."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [applicationId]);

  // Cleanup
  useEffect(() => {
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopAll = () => {
    try {
      mrRef.current?.stop();
    } catch {}
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setRecording(false);
    setPrep(null);
    setLeft(null);
  };

  const startPrep = async () => {
    if (!applicationId || !q) return;

    stopAll();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // mute to avoid echo from speakers
        await videoRef.current.play().catch(() => {});
      }

      setPrep(PREP_SECONDS);
      const t = setInterval(() => {
        setPrep((prev) => {
          if (prev === null) return prev;
          if (prev <= 1) {
            clearInterval(t);
            setPrep(0);
            void startRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      setErr(e?.message || "Cannot access camera/microphone.");
      stopAll();
    }
  };

  const startRecording = async () => {
    if (!streamRef.current || !q) return;

    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm;codecs=vp8,opus",
    });
    mrRef.current = mr;

    mr.ondataavailable = (evt) => {
      if (evt.data && evt.data.size > 0) chunksRef.current.push(evt.data);
    };

    mr.onstop = async () => {
      endedRef.current = nowISO();
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      if (!blob.size) {
        setErr("Recorded file was empty. Please try again.");
        stopAll();
        return;
      }
      await uploadBlob(blob);
    };

    startedRef.current = nowISO();
    mr.start(1000);
    setRecording(true);
    setLeft(RECORD_SECONDS);

    const t = setInterval(() => {
      setLeft((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(t);
          try {
            mr.stop();
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const uploadBlob = async (blob: Blob) => {
    if (!applicationId || !q) return;
    try {
      setUploading(true);
      setPct(0);

      const durationMs =
        startedRef.current && endedRef.current
          ? Math.max(
              0,
              new Date(endedRef.current).getTime() -
                new Date(startedRef.current).getTime()
            )
          : 0;

      await uploadVideoAnswer({
        applicationId,
        questionId: q.id,
        blob,
        durationMs,
        startedAt: startedRef.current || nowISO(),
        endedAt: endedRef.current || nowISO(),
        mimeType: "video/webm",
        onProgress: (n) => setPct(n),
      });

      stopAll();
      if (index + 1 < questions.length) {
        setIndex(index + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        navigate(`/video-submitted/${applicationId}`, { replace: true });
      }
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || "Upload failed.");
      stopAll();
    } finally {
      setUploading(false);
      setPct(0);
    }
  };

  const fmt = (n: number | null) => {
    if (n === null) return "--:--";
    const m = Math.floor(n / 60);
    const s = n % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <Box p={2}>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Video Interview
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      {!loading && (!questions || questions.length === 0) && (
        <Alert severity="info">
          No video questions have been assigned yet.
        </Alert>
      )}

      {!loading && q && (
        <Card variant="outlined">
          <CardHeader
            title={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight={700}>
                  Question {index + 1} of {questions.length}
                </Typography>
                <Chip size="small" label={`Order ${q.order}`} />
              </Stack>
            }
            subheader={q.prompt}
          />
          <CardContent>
            <Stack spacing={2}>
              <Box
                sx={{
                  width: "min(720px, 100%)",
                  aspectRatio: "16 / 9",
                  bgcolor: "black",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <video
                  ref={videoRef}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                  playsInline
                  muted
                />
              </Box>

              {prep !== null && prep > 0 && (
                <Alert severity="info">
                  Get ready… recording starts in <b>{prep}s</b>
                </Alert>
              )}
              {recording && (
                <Alert severity="success">
                  Recording… time left: <b>{fmt(left)}</b>
                </Alert>
              )}
              {uploading && (
                <>
                  <Alert severity="info">Uploading your answer…</Alert>
                  <LinearProgress variant="determinate" value={pct} />
                </>
              )}

              {!recording && !uploading && (
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    onClick={startPrep}
                    disabled={prep !== null}
                  >
                    {prep !== null ? `Starting… ${prep}s` : "Start Question"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      stopAll();
                      if (index > 0) setIndex(index - 1);
                    }}
                    disabled={index === 0}
                  >
                    Back
                  </Button>
                </Stack>
              )}

              {recording && !uploading && (
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={() => {
                      try {
                        mrRef.current?.stop();
                      } catch {}
                    }}
                  >
                    Finish Now
                  </Button>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
