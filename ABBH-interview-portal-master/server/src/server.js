import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import applicationsRoutes from "./routes/applications.js";
import adminRoutes from "./routes/admin.js";
import interviewRoutes from "./routes/interviews.js";
import applicationStatusRoutes from "./routes/applicationStatus.js";
import jobsRoutes from "./routes/jobs.js";
import authRoutes from "./routes/auth.js";

// You already have /api/auth/* and /api/jobs/* and /api/applications/*

const app = express();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

// Log every incoming request (temporary debug)
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(cors({ origin: CLIENT_ORIGIN, credentials: false }));
app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" })); // JSON bodies (uploads are multipart)
app.use("/uploads", express.static(path.resolve(UPLOAD_DIR)));

// Health
app.get("/api/health", (_req, res) => res.json("ok"));

// New routes
app.use("/api/admin", adminRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/auth", authRoutes);

app.use("/api/application-status", applicationStatusRoutes);
app.use("/api/applications", applicationsRoutes);

// TEMP: sanity check that /api/jobs path works at all
app.get("/api/jobs/_test", (_req, res) => res.json({ ok: true }));

app.use("/api/jobs", jobsRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
