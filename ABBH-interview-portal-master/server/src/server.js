import express from "express";
import cors from "cors";
import appsRoutes from "./routes/applications.routes.js";
import jobsRoutes from "./routes/jobs.routes.js";
import applicationStatusRoutes from "./routes/application-status.routes.js";
import authRoutes from "./routes/auth.routes.js";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

// health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// core routes
app.use("/api/jobs", jobsRoutes);
app.use("/api/applications", appsRoutes);
app.use("/api/application-status", applicationStatusRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
