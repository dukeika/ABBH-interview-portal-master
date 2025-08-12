import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  Chip,
} from "@mui/material";
import type { AxiosProgressEvent } from "axios";
import { api } from "../../lib/api";
import dayjs from "../../lib/dayjs";

/* ---------- API types ---------- */
type Question = { id: string; text: string };
type InterviewInfo = {
  interview: {
    id: string;
    type: "VIDEO";
    assignedAt: string;
    submittedAt?: string | null;
    durationMins: number;
  };
  job: { id: string; title: string | null };
  questions: Question[];
};

/* ---------- Local UI state ---------- */
type QStatus =
  | "idle"
  | "recording"
  | "recorded"
  | "uploading"
  | "uploaded"
  | "error";
type QState = {
  id: string;
  text: string;
  status: QStatus;
  previewUrl?: string;
  blob?: Blob | null;
  progress?: number;
  attemptCount?: number; // server returns this after upload
};

export default function VideoInterview() {
  const { interviewId = "" } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<InterviewInfo | null>(null);
  const [qs, setQs] = useState<QState[]>([]);
  const [err, setErr] = useState<string>("");

  // Media refs
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const activeQidRef = useRef<string | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);

  const allUploaded = useMemo(
    () => qs.length > 0 && qs.every((q) => q.status === "uploaded"),
    [qs]
  );
  const isRecording = useMemo(
    () => qs.some((q) => q.status === "recording"),
    [qs]
  );

  /* ---------- Load interview ---------- */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await api.get<InterviewInfo>(
          `/interviews/${interviewId}`
        );
        if (!mounted) return;
        setInfo(data);
        setQs(
          (data.questions || []).map((q) => ({
            id: q.id,
            text: q.text,
            status: "idle",
            attemptCount: 0,
          }))
        );
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.response?.data?.error || "Failed to load interview.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      cleanupMedia();
      // revoke previews
      setQs((prev) => {
        prev.forEach((q) => q.previewUrl && URL.revokeObjectURL(q.previewUrl));
        return prev;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  /* ---------- Media helpers ---------- */
  function cleanupMedia() {
    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function ensureStream() {
    if (streamRef.current) return streamRef.current;
    // ask for cam + mic
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    streamRef.current = stream;
    if (liveVideoRef.current) {
      try {
        (liveVideoRef.current as any).srcObject = stream;
        await liveVideoRef.current.play().catch(() => {});
      } catch {}
    }
    return stream;
  }

  function pickMime(): MediaRecorderOptions {
    const list = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4", // some browsers might allow this
    ];
    for (const mt of list) {
      if ((window as any).MediaRecorder?.isTypeSupported?.(mt))
        return { mimeType: mt };
    }
    return {}; // let browser decide
  }

  async function startRecording(qid: string) {
    if (isRecording) return;
    const q = qs.find((x) => x.id === qid);
    if (q?.attemptCount !== undefined && q.attemptCount >= 3) {
      setErr("Max attempts reached (3) for this question.");
      return;
    }
    try {
      setErr("");
      await ensureStream();
      if (!streamRef.current) return;

      chunksRef.current = [];
      activeQidRef.current = qid;

      const opts = pickMime();
      const rec = new MediaRecorder(streamRef.current, opts);
      recorderRef.current = rec;

      rec.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        // Normalize MIME to a base container ("video/webm" or "video/mp4")
        const mimeBase = (rec.mimeType || "video/webm").split(";")[0];
        const blob = new Blob(chunksRef.current, { type: mimeBase });
        const url = URL.createObjectURL(blob);
        setQs((prev) =>
          prev.map((q) =>
            q.id === qid
              ? {
                  ...q,
                  status: "recorded",
                  previewUrl: url,
                  blob,
                  progress: undefined,
                }
              : q
          )
        );
      };

      setQs((prev) =>
        prev.map((q) => (q.id === qid ? { ...q, status: "recording" } : q))
      );
      rec.start();
    } catch (e: any) {
      setErr(e?.message || "Unable to access camera/microphone.");
    }
  }

  function stopRecording(qid: string) {
    if (
      recorderRef.current &&
      recorderRef.current.state === "recording" &&
      activeQidRef.current === qid
    ) {
      try {
        recorderRef.current.stop();
      } catch {}
    }
  }

  function retake(qid: string) {
    setQs((prev) =>
      prev.map((q) => {
        if (q.id !== qid) return q;
        if (q.previewUrl) URL.revokeObjectURL(q.previewUrl);
        return {
          ...q,
          status: "idle",
          previewUrl: undefined,
          blob: null,
          progress: undefined,
        };
      })
    );
  }

  async function upload(qid: string) {
    const q = qs.find((x) => x.id === qid);
    if (!q?.blob) return;

    if (q.attemptCount !== undefined && q.attemptCount >= 3) {
      setErr("Max attempts reached (3) for this question.");
      return;
    }

    try {
      setQs((prev) =>
        prev.map((x) =>
          x.id === qid ? { ...x, status: "uploading", progress: 0 } : x
        )
      );

      const mimeBase = (q.blob?.type || "video/webm").split(";")[0];
      const ext = mimeBase === "video/mp4" ? ".mp4" : ".webm";

      const fd = new FormData();
      fd.append("file", q.blob, `${qid}${ext}`);
      fd.append("questionId", qid);

      const { data } = await api.post<{
        filePath: string;
        attemptCount: number;
      }>(`/interviews/${interviewId}/video/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev: AxiosProgressEvent) => {
          const total = ev.total ?? 0;
          const loaded = ev.loaded ?? 0;
          const p = total > 0 ? Math.round((loaded / total) * 100) : undefined;
          setQs((prev) =>
            prev.map((x) => (x.id === qid ? { ...x, progress: p } : x))
          );
        },
      });

      setQs((prev) =>
        prev.map((x) =>
          x.id === qid
            ? {
                ...x,
                status: "uploaded",
                progress: 100,
                attemptCount: data.attemptCount,
              }
            : x
        )
      );
    } catch (e: any) {
      setQs((prev) =>
        prev.map((x) => (x.id === qid ? { ...x, status: "error" } : x))
      );
      setErr(e?.response?.data?.error || "Upload failed.");
    }
  }

  async function submitInterview() {
    try {
      await api.post(`/interviews/${interviewId}/submit`);
      cleanupMedia();
      navigate("/status");
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Failed to submit interview.");
    }
  }

  /* ---------- Render ---------- */
  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={2} maxWidth={1100} mx="auto">
      <Typography variant="h5" fontWeight={800} gutterBottom>
        {info?.job?.title || "Video Interview"}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Assigned: {info ? dayjs(info.interview.assignedAt).format("LLL") : ""} •
        Target: {info?.interview.durationMins} mins
      </Typography>

      {err ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      ) : null}

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        {/* Live camera */}
        <Card sx={{ flex: 1, p: 1 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Camera
            </Typography>
            <video
              ref={liveVideoRef}
              autoPlay
              muted
              playsInline
              style={{ width: "100%", borderRadius: 8, background: "#000" }}
            />
            <Typography variant="caption" color="text.secondary">
              Grant camera & microphone permissions to record.
            </Typography>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card sx={{ flex: 1.2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Questions
            </Typography>

            <List dense>
              {qs.map((q) => {
                const disabledByAttempts = (q.attemptCount ?? 0) >= 3;
                return (
                  <ListItem key={q.id} sx={{ alignItems: "stretch", mb: 1 }}>
                    <Box sx={{ width: "100%" }}>
                      <ListItemText
                        primary={
                          <Typography fontWeight={600}>{q.text}</Typography>
                        }
                        secondary={
                          <Stack spacing={1}>
                            {q.status === "uploading" && (
                              <LinearProgress
                                variant={
                                  q.progress ? "determinate" : "indeterminate"
                                }
                                value={q.progress}
                              />
                            )}

                            {q.previewUrl && (
                              <video
                                src={q.previewUrl}
                                controls
                                style={{
                                  width: "100%",
                                  borderRadius: 8,
                                  background: "#000",
                                }}
                              />
                            )}

                            <Stack
                              direction="row"
                              spacing={1}
                              flexWrap="wrap"
                              alignItems="center"
                            >
                              <Button
                                variant="contained"
                                onClick={() => startRecording(q.id)}
                                disabled={
                                  q.status === "recording" ||
                                  isRecording ||
                                  disabledByAttempts
                                }
                              >
                                Record
                              </Button>
                              <Button
                                variant="outlined"
                                onClick={() => stopRecording(q.id)}
                                disabled={q.status !== "recording"}
                              >
                                Stop
                              </Button>
                              <Button
                                variant="outlined"
                                color="warning"
                                onClick={() => retake(q.id)}
                                disabled={q.status === "recording"}
                              >
                                Retake
                              </Button>
                              <Button
                                variant="contained"
                                color="success"
                                onClick={() => upload(q.id)}
                                disabled={
                                  q.status !== "recorded" || disabledByAttempts
                                }
                              >
                                Upload
                              </Button>

                              <StatusChip status={q.status} />
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`Attempts: ${q.attemptCount ?? 0}/3`}
                                color={
                                  (q.attemptCount ?? 0) >= 3
                                    ? "error"
                                    : "default"
                                }
                              />
                            </Stack>
                          </Stack>
                        }
                        secondaryTypographyProps={{ component: "div" }} // fix <div> inside <p> warning
                      />
                    </Box>
                  </ListItem>
                );
              })}
            </List>

            <Stack direction="row" justifyContent="flex-end" mt={2} spacing={2}>
              <Button variant="outlined" onClick={() => navigate("/status")}>
                Back to Status
              </Button>
              <Button
                variant="contained"
                disabled={!allUploaded}
                onClick={submitInterview}
              >
                Submit Interview
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

/* ---------- Small UI bits ---------- */
function StatusChip({ status }: { status: QStatus }) {
  const map: Record<
    QStatus,
    {
      label: string;
      color: "default" | "success" | "warning" | "error" | "info";
    }
  > = {
    idle: { label: "Idle", color: "default" },
    recording: { label: "Recording…", color: "warning" },
    recorded: { label: "Recorded", color: "info" },
    uploading: { label: "Uploading…", color: "warning" },
    uploaded: { label: "Uploaded", color: "success" },
    error: { label: "Error", color: "error" },
  };
  const v = map[status];
  return (
    <Chip
      label={v.label}
      color={v.color}
      size="small"
      variant={v.color === "default" ? "outlined" : "filled"}
      sx={{ ml: 0.5 }}
    />
  );
}
