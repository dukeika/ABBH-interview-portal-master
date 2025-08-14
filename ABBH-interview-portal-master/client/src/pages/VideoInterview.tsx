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

type Phase = "idle" | "prep" | "recording" | "uploading" | "done";

const camKey = (appId: string) => `prefCamId:${appId}`;
const micKey = (appId: string) => `prefMicId:${appId}`;

export default function VideoInterview() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<VideoQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [prepLeft, setPrepLeft] = useState(PREP_SECONDS);
  const [recLeft, setRecLeft] = useState(RECORD_SECONDS);
  const [uploadPct, setUploadPct] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTsRef = useRef<number>(0);
  const recTimerRef = useRef<number | null>(null);

  const q = questions[idx];

  useEffect(() => {
    if (!applicationId) return;
    (async () => {
      try {
        const list = await fetchVideoQuestions(applicationId);
        setQuestions(list);
      } catch (e: any) {
        setErr(
          e?.response?.data?.error || e?.message || "Failed to load questions."
        );
      }
    })();
  }, [applicationId]);

  useEffect(() => {
    (async () => {
      try {
        await startPreview();
      } catch (e: any) {
        setErr(e?.message || "Unable to access camera/microphone.");
      }
    })();
    return () => {
      stopRecordingTimer();
      stopTracks();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startPreview() {
    if (!applicationId) return;
    const savedCam = localStorage.getItem(camKey(applicationId));
    const savedMic = localStorage.getItem(micKey(applicationId));
    const constraints: MediaStreamConstraints = {
      video: savedCam ? { deviceId: { exact: savedCam } } : true,
      audio: savedMic
        ? {
            deviceId: { exact: savedMic },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        : {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
    };
    const s = await navigator.mediaDevices.getUserMedia(constraints);
    streamRef.current = s;
    if (videoRef.current) {
      videoRef.current.srcObject = s;
      videoRef.current.muted = true; // prevent echo
      await videoRef.current.play().catch(() => {});
    }
  }

  function stopTracks() {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      try {
        mediaRef.current.stop();
      } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function stopRecordingTimer() {
    if (recTimerRef.current) {
      window.clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
  }

  async function startPrep() {
    setErr(null);
    setUploadPct(0);
    setPhase("prep");
    setPrepLeft(PREP_SECONDS);
    let left = PREP_SECONDS;
    const int = window.setInterval(() => {
      left -= 1;
      setPrepLeft(left);
      if (left <= 0) {
        window.clearInterval(int);
        startRecording().catch((e) => setErr(String(e)));
      }
    }, 1000);
  }

  async function startRecording() {
    if (!streamRef.current) throw new Error("No media stream.");
    setPhase("recording");
    setRecLeft(RECORD_SECONDS);
    startTsRef.current = Date.now();
    chunksRef.current = [];

    const options: MediaRecorderOptions = {};
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
      options.mimeType = "video/webm;codecs=vp9,opus";
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
      options.mimeType = "video/webm;codecs=vp8,opus";
    } else {
      options.mimeType = "video/webm";
    }

    const rec = new MediaRecorder(streamRef.current, options);
    mediaRef.current = rec;

    rec.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        chunksRef.current.push(ev.data);
      }
    };
    rec.onstop = async () => {
      stopRecordingTimer();
      try {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        chunksRef.current = [];
        if (!blob.size) {
          setErr("We recorded an empty file. Please try again.");
          setPhase("idle");
          return;
        }
        await upload(blob);
      } catch (e: any) {
        setErr(e?.message || "Upload failed.");
        setPhase("idle");
      }
    };

    rec.start();

    // countdown
    let left = RECORD_SECONDS;
    recTimerRef.current = window.setInterval(() => {
      left -= 1;
      setRecLeft(left);
      if (left <= 0) {
        stopRecording(); // auto-stop
      }
    }, 1000);
  }

  function stopRecording() {
    try {
      if (mediaRef.current && mediaRef.current.state !== "inactive") {
        mediaRef.current.stop();
      }
    } catch {}
  }

  async function upload(blob: Blob) {
    if (!applicationId || !q) return;
    setPhase("uploading");
    const startedAt = new Date(startTsRef.current).toISOString();
    const endedAt = new Date().toISOString();
    const durationMs = Date.now() - startTsRef.current;

    await uploadVideoAnswer({
      applicationId,
      questionId: q.id,
      blob,
      durationMs,
      startedAt,
      endedAt,
      mimeType: blob.type || "video/webm",
      onProgress: (p) => setUploadPct(p),
    });

    // Cleanup devices between questions (turn off when not in use)
    if (videoRef.current) videoRef.current.pause();
    stopTracks();

    // Next or finish
    if (idx < questions.length - 1) {
      await startPreview(); // reacquire for next Q
      setIdx((i) => i + 1);
      setPhase("idle");
    } else {
      setPhase("done");
      navigate(`/video-submitted/${applicationId}`, { replace: true });
    }
  }

  const header = useMemo(() => {
    if (!q) return "Video Interview";
    return `Question ${idx + 1} of ${questions.length}`;
  }, [q, idx, questions.length]);

  return (
    <Box p={2}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={800}>
          {header}
        </Typography>

        {err && <Alert severity="error">{err}</Alert>}

        {!q && <Alert severity="info">No video questions assigned.</Alert>}

        {q && (
          <Card variant="outlined">
            <CardHeader
              title={<Typography fontWeight={700}>{q.prompt}</Typography>}
              subheader={
                <Stack direction="row" spacing={1} alignItems="center">
                  {phase === "prep" && (
                    <Chip color="warning" label={`Get ready: ${prepLeft}s`} />
                  )}
                  {phase === "recording" && (
                    <Chip color="error" label={`Recording: ${recLeft}s`} />
                  )}
                  {phase === "uploading" && (
                    <Chip color="info" label="Uploading…" />
                  )}
                </Stack>
              }
            />
            <CardContent>
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 720,
                  aspectRatio: "16/9",
                  bgcolor: "black",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Box>

              {phase === "uploading" && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Uploading your answer… {uploadPct}%
                  </Typography>
                  <LinearProgress variant="determinate" value={uploadPct} />
                </Box>
              )}

              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  disabled={phase !== "idle"}
                  onClick={startPrep}
                >
                  {idx === 0 ? "Start" : "Next"}
                </Button>
                <Button
                  variant="outlined"
                  disabled={phase === "recording" || phase === "uploading"}
                  onClick={() => navigate("/status")}
                >
                  Cancel
                </Button>
                {/* ✅ Early stop */}
                <Button
                  variant="text"
                  disabled={phase !== "recording"}
                  onClick={stopRecording}
                >
                  Stop Now
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
