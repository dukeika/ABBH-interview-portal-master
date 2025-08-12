import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { api } from "../../lib/api";

type Props = { applicationId: string; jobId: string };

export default function AdminAssignVideoPanel({ applicationId, jobId }: Props) {
  const [questions, setQuestions] = useState<{ id: string; text: string }[]>(
    []
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [durationMins, setDurationMins] = useState<number>(15);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data } = await api.get(
        `/api/jobs/${jobId}/questions?forStage=VIDEO`
      ); // if you don't have this route, query all and filter client-side
      setQuestions(data || []);
    })();
  }, [jobId]);

  async function assign() {
    setMsg("");
    try {
      await api.post(`/api/admin/applications/${applicationId}/assign-video`, {
        questionIds: selected,
        durationMins,
      });
      setMsg("Video interview assigned.");
    } catch (e: any) {
      setMsg(e?.response?.data?.error || "Assign failed");
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700}>
          Assign Video Interview
        </Typography>
        <Stack spacing={2} mt={2}>
          <FormControl>
            <InputLabel id="qs">Questions (VIDEO)</InputLabel>
            <Select
              labelId="qs"
              multiple
              value={selected}
              input={<OutlinedInput label="Questions (VIDEO)" />}
              onChange={(e) => setSelected(e.target.value as string[])}
              renderValue={(sel) => (
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {(sel as string[]).map((id) => {
                    const q = questions.find((x) => x.id === id);
                    return (
                      <Chip key={id} label={q?.text?.slice(0, 24) || id} />
                    );
                  })}
                </Box>
              )}
            >
              {questions.map((q) => (
                <MenuItem key={q.id} value={q.id}>
                  {q.text}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            type="number"
            label="Duration (mins)"
            value={durationMins}
            onChange={(e) =>
              setDurationMins(parseInt(e.target.value || "15", 10))
            }
            inputProps={{ min: 5, max: 120 }}
          />

          <Stack direction="row" gap={1}>
            <Button variant="contained" onClick={assign}>
              Assign
            </Button>
            {msg && <Typography variant="body2">{msg}</Typography>}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
