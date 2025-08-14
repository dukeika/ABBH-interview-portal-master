import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { fetchLatestApplicationStatus, LatestStatus } from "../lib/api";

export default function ApplicationStatus() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [latest, setLatest] = useState<LatestStatus | null>(null);

  const [testing, setTesting] = useState(false);
  const [ready, setReady] = useState<boolean>(
    () => localStorage.getItem("videoReady") === "1"
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchLatestApplicationStatus();
        setLatest(data);
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 401) {
          // api interceptor will redirect to /login — we just show a friendly note
          setErr("Please log in to view your application status.");
        } else {
          setErr(
            e?.response?.data?.error || e?.message || "Failed to load status."
          );
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stopTest = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setTesting(false);
  };

  const startTest = async () => {
    try {
      stopTest();
      setTesting(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }
    } catch (e: any) {
      setErr(e?.message || "Unable to access camera/microphone.");
      setTesting(false);
    }
  };

  const markReady = () => {
    localStorage.setItem("videoReady", "1");
    setReady(true);
    stopTest();
  };

  useEffect(() => () => stopTest(), []);

  const goToStage = () => {
    if (!latest?.id) return;
    if (latest.stage === "WRITTEN") navigate(`/written/${latest.id}`);
    else if (latest.stage === "VIDEO")
      navigate(`/video-interview/${latest.id}`);
  };

  return (
    <Box p={2}>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Application Status
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      {!loading && latest && (
        <Stack spacing={2}>
          <Card variant="outlined">
            <CardHeader
              title={latest.jobTitle || "Your Application"}
              subheader={
                <Typography variant="body2">
                  Current Stage: <b>{latest.stage || "—"}</b>
                </Typography>
              }
            />
            <CardContent>
              {!latest.stage && (
                <Typography variant="body2">
                  You don’t have an active stage yet. Please check back later.
                </Typography>
              )}

              {latest.stage === "WRITTEN" && (
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" onClick={goToStage}>
                    Start Written Test
                  </Button>
                </Stack>
              )}

              {latest.stage === "VIDEO" && (
                <Stack spacing={2}>
                  <Card variant="outlined">
                    <CardHeader title="Test your camera & microphone" />
                    <CardContent>
                      <Stack spacing={1}>
                        <video
                          ref={videoRef}
                          style={{
                            width: 320,
                            height: 180,
                            background: "#000",
                            borderRadius: 8,
                          }}
                          playsInline
                          muted
                        />
                        <Stack direction="row" spacing={1}>
                          {!testing ? (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={startTest}
                            >
                              Start Test
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={stopTest}
                            >
                              Stop Test
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="contained"
                            onClick={markReady}
                            disabled={!testing}
                          >
                            I can see/hear myself
                          </Button>
                        </Stack>
                        {ready && (
                          <Alert severity="success">
                            Devices ready. You can start the interview.
                          </Alert>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>

                  <Button
                    variant="contained"
                    onClick={goToStage}
                    disabled={!ready}
                    title={!ready ? "Please test your devices first" : ""}
                  >
                    Start Video Interview
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
}
