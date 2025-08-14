import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { listVideosByApplication, type VideoListItem } from "../../lib/api";
import DownloadIcon from "@mui/icons-material/Download";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

function msToClock(ms: number) {
  const sec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AdminVideoReview() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [items, setItems] = useState<VideoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!applicationId) throw new Error("Missing applicationId.");
        const list = await listVideosByApplication(applicationId);
        if (!mounted) return;

        // sort by question.order then createdAt
        const sorted = [...list].sort((a, b) => {
          const ao = a.question?.order ?? 9999;
          const bo = b.question?.order ?? 9999;
          if (ao !== bo) return ao - bo;
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });

        setItems(sorted);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message || "Failed to load videos.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [applicationId]);

  return (
    <Box p={2}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={800}>
          Video Responses
        </Typography>

        {loading && <LinearProgress />}

        {err && <Alert severity="error">{err}</Alert>}

        {!loading && items.length === 0 && (
          <Alert severity="info">
            No video responses have been uploaded yet.
          </Alert>
        )}

        {items.map((v) => (
          <Card key={v.id} variant="outlined">
            <CardHeader
              title={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {v.question?.prompt ?? "Untitled question"}
                  </Typography>
                  {typeof v.question?.order === "number" && (
                    <Chip size="small" label={`Q${v.question.order}`} />
                  )}
                </Stack>
              }
              action={
                <Tooltip title="Download video">
                  <IconButton component="a" href={v.url} download>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              }
              subheader={
                <Stack direction="row" spacing={2} alignItems="center">
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <AccessTimeIcon fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      {msToClock(v.durationMs)}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Recorded:{" "}
                    {v.startedAt ? new Date(v.startedAt).toLocaleString() : "—"}
                  </Typography>
                </Stack>
              }
            />
            <Divider />
            <CardContent>
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 860,
                  aspectRatio: "16/9",
                  bgcolor: "black",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <video
                  controls
                  preload="metadata"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                >
                  <source src={v.url} type={v.mimeType || "video/webm"} />
                  Your browser does not support HTML5 video.
                </video>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
