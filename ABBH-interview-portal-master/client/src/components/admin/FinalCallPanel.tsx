import React, { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { api } from "../../lib/api";

type Props = { applicationId: string };

export default function FinalCallPanel({ applicationId }: Props) {
  const [url, setUrl] = useState("");
  const [at, setAt] = useState(""); // yyyy-MM-ddTHH:mm
  const [msg, setMsg] = useState("");

  async function schedule() {
    setMsg("");
    try {
      await api.patch(`/api/admin/applications/${applicationId}/stage`, {
        stage: "FINAL_CALL",
        finalCallUrl: url,
        finalCallAt: at ? new Date(at).toISOString() : null,
      });
      setMsg("Final call scheduled and stage set to FINAL_CALL.");
    } catch (e: any) {
      setMsg(e?.response?.data?.error || "Failed to schedule final call");
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700}>
          Final Video Chat
        </Typography>
        <Stack spacing={2} mt={2}>
          <TextField
            label="Meeting Link (Zoom/Teams/Meet)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <TextField
            label="Scheduled Time"
            type="datetime-local"
            value={at}
            onChange={(e) => setAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Stack direction="row" gap={1}>
            <Button variant="contained" onClick={schedule}>
              Set FINAL_CALL
            </Button>
            {msg && <Typography variant="body2">{msg}</Typography>}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
