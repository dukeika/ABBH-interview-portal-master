import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function VideoSubmitted() {
  const navigate = useNavigate();
  return (
    <Box p={2}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={800}>
          Video Submitted
        </Typography>
        <Typography>
          Your video has been submitted. HR will review your responses and get
          back to you. You can check your status anytime from your dashboard.
        </Typography>
        <Button variant="contained" onClick={() => navigate("/status")}>
          Back to Status
        </Button>
      </Stack>
    </Box>
  );
}
