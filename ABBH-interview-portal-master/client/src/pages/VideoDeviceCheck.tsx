import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

type MediaDev = { deviceId: string; label: string };

const camKey = (appId: string) => `prefCamId:${appId}`;
const micKey = (appId: string) => `prefMicId:${appId}`;

export default function VideoDeviceCheck() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cams, setCams] = useState<MediaDev[]>([]);
  const [mics, setMics] = useState<MediaDev[]>([]);
  const [camId, setCamId] = useState<string>("");
  const [micId, setMicId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // ask for permission once so labels are available
        await navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((s) => {
            s.getTracks().forEach((t) => t.stop());
          });
        const devs = await navigator.mediaDevices.enumerateDevices();
        const vid = devs
          .filter((d) => d.kind === "videoinput")
          .map((d) => ({ deviceId: d.deviceId, label: d.label || "Camera" }));
        const aud = devs
          .filter((d) => d.kind === "audioinput")
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || "Microphone",
          }));
        setCams(vid);
        setMics(aud);

        const savedCam = applicationId
          ? localStorage.getItem(camKey(applicationId))
          : null;
        const savedMic = applicationId
          ? localStorage.getItem(micKey(applicationId))
          : null;

        setCamId(
          savedCam && vid.find((v) => v.deviceId === savedCam)
            ? savedCam
            : vid[0]?.deviceId || ""
        );
        setMicId(
          savedMic && aud.find((a) => a.deviceId === savedMic)
            ? savedMic
            : aud[0]?.deviceId || ""
        );
        setErr(null);
      } catch (e: any) {
        setErr(e?.message || "Unable to enumerate devices.");
      } finally {
        setLoading(false);
      }
    })();

    return () => stopTracks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  function stopTracks() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function startTest() {
    try {
      setTesting(true);
      stopTracks();
      const s = await navigator.mediaDevices.getUserMedia({
        video: camId ? { deviceId: { exact: camId } } : true,
        audio: micId
          ? {
              deviceId: { exact: micId },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : true,
      });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.muted = true; // prevent echo
        await videoRef.current.play().catch(() => {});
      }
    } catch (e: any) {
      setErr(e?.message || "Device test failed.");
    } finally {
      setTesting(false);
    }
  }

  function saveAndContinue() {
    if (!applicationId) return;
    if (camId) localStorage.setItem(camKey(applicationId), camId);
    if (micId) localStorage.setItem(micKey(applicationId), micId);
    stopTracks();
    // go to actual interview
    navigate(`/video-interview/${applicationId}`, { replace: true });
  }

  return (
    <Box p={2}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={800}>
          Device Test
        </Typography>
        {loading && <LinearProgress />}
        {err && <Alert severity="error">{err}</Alert>}

        <Card variant="outlined">
          <CardHeader title="Select your camera and microphone" />
          <CardContent>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 260 }}>
                <InputLabel id="cam">Camera</InputLabel>
                <Select
                  labelId="cam"
                  label="Camera"
                  value={camId}
                  onChange={(e) => setCamId(e.target.value)}
                >
                  {cams.map((c) => (
                    <MenuItem key={c.deviceId} value={c.deviceId}>
                      {c.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 260 }}>
                <InputLabel id="mic">Microphone</InputLabel>
                <Select
                  labelId="mic"
                  label="Microphone"
                  value={micId}
                  onChange={(e) => setMicId(e.target.value)}
                >
                  {mics.map((m) => (
                    <MenuItem key={m.deviceId} value={m.deviceId}>
                      {m.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="outlined"
                  disabled={testing}
                  onClick={startTest}
                >
                  Test
                </Button>
                <Button variant="text" onClick={stopTracks}>
                  Turn Off Devices
                </Button>
              </Stack>
            </Stack>

            <Box
              sx={{
                mt: 2,
                width: "100%",
                maxWidth: 640,
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

            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={saveAndContinue}
                disabled={!camId || !micId}
              >
                Continue to Interview
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
