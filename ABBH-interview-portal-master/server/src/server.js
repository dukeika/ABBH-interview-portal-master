// server/src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import applicationsRoutes from "./routes/applications.js";
import adminApplicationsRoutes from "./routes/adminApplications.js"; // ✅ default import
import jobsRoutes from "./routes/jobs.js";
import adminJobsRoutes from "./routes/adminJobs.js";
import interviewRoutes from "./routes/interviews.js";
import applicationStatusRoutes from "./routes/applicationStatus.js";
import { videosRouter } from "./routes/videos.js";

const app = express();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({ origin: CLIENT_ORIGIN, credentials: false }));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));

// serve uploads
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// healthcheck
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ✅ ROUTES (order does not shadow specific ones)
app.use("/api/auth", authRoutes);
app.use("/api/application-status", applicationStatusRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/admin", adminApplicationsRoutes); // ✅ includes assign-written / assign-video etc.
app.use("/api/jobs", jobsRoutes);
app.use("/api/admin/jobs", adminJobsRoutes);
app.use("/api/videos", videosRouter);

// 404
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

// error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
