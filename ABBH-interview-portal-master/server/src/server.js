import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import applicationsRoutes from "./routes/applications.js";
import adminRoutes from "./routes/admin.js";
import interviewRoutes from "./routes/interviews.js";
import applicationStatusRoutes from "./routes/applicationStatus.js";
import jobsRoutes from "./routes/jobs.js";
import authRoutes from "./routes/auth.js";
import applyRoutes from "./routes/apply.js";
import adminJobsRoutes from "./routes/adminJobs.js";
import { videosRouter } from "./routes/videos.js";
import { questionsRouter } from "./routes/questions.js";
import { adminApplicationsRouter } from "./routes/adminApplications.js";

const app = express();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({ origin: CLIENT_ORIGIN, credentials: false }));
app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));

// static files (videos, resumes, etc) must be served from /uploads
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => res.json("ok"));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/apply", applyRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/jobs", adminJobsRoutes);
app.use("/api/admin/applications", adminApplicationsRouter);
app.use("/api/interviews", interviewRoutes);
app.use("/api/application-status", applicationStatusRoutes);
app.use("/api/videos", videosRouter);
app.use("/api/questions", questionsRouter);

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

// 404
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
