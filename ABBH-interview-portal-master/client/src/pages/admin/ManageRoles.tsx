import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import api from "../../api/client";
import type { SelectChangeEvent } from "@mui/material/Select";

type Role = { id: number; title: string };
type QType = "WRITTEN" | "VIDEO";

export default function ManageRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [roleId, setRoleId] = useState<number | "">("");
  const [type, setType] = useState<QType>("WRITTEN");
  const [qText, setQText] = useState("");

  const load = async () => {
    const { data } = await api.get("/job-roles");
    setRoles(data);
  };
  useEffect(() => {
    load();
  }, []);

  const createRole = async () => {
    await api.post("/job-roles", { title, description: desc });
    setTitle("");
    setDesc("");
    load();
  };

  const addQ = async () => {
    if (!roleId) return;
    await api.post(`/job-roles/${roleId}/questions`, {
      type,
      text: qText,
      order: 0,
    });
    setQText("");
  };

  const onTypeChange = (e: SelectChangeEvent<"WRITTEN" | "VIDEO">) => {
    setType(e.target.value as "WRITTEN" | "VIDEO");
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          Create Role
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={1}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            label="Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <Button variant="contained" onClick={createRole}>
            Add Role
          </Button>
        </Stack>

        <Typography variant="h6" fontWeight={700} mt={3}>
          Add Question
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={1}>
          <TextField
            select
            label="Role"
            value={roleId}
            onChange={(e) => setRoleId(Number(e.target.value))}
            sx={{ minWidth: 220 }}
          >
            {roles.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.title}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Type"
            value={type}
            onChange={onTypeChange}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="WRITTEN">WRITTEN</MenuItem>
            <MenuItem value="VIDEO">VIDEO</MenuItem>
          </TextField>

          <TextField
            label="Question"
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={addQ}>
            Add
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
