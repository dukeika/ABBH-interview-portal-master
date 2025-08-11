// server/src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import jobsRoutes from "./routes/jobs.routes.js";
import appsRoutes from "./routes/applications.routes.js";
import devRoutes from "./routes/dev.routes.js"; // dev-only helpers

// 1) Init app FIRST
const app = express();
const PORT = Number(process.env.PORT) || 4000;

// 2) Middlewares
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

// 3) Basic routes
app.get("/", (_req, res) => {
  res.status(200).json({
    name: "ABBH Interview API",
    status: "running",
    docs: "/api",
    health: "/api/health",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// 4) Feature routes
app.use("/auth", authRoutes); // e.g., POST /auth/login
app.use("/api/jobs", jobsRoutes); // e.g., GET /api/jobs
app.use("/api/applications", appsRoutes);

// 5) Dev utilities (only outside production)
if (process.env.NODE_ENV !== "production") {
  app.use("/api/dev", devRoutes); // e.g., POST /api/dev/gen-apps
}

// 6) 404
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "Not Found" });
});

// 7) Start
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
