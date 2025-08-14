// server/src/routes/videos.js
import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../utils/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, "../../uploads");
const videosRoot = path.join(uploadsRoot, "videos");
fs.mkdirSync(videosRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(videosRoot, req.params.applicationId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ts = Date.now();
    cb(null, `${req.params.questionId}-${ts}.webm`);
  },
});
const fileFilter = (_req, file, cb) => {
  const ok =
    file.mimetype === "video/webm" ||
    file.mimetype === "application/octet-stream" ||
    file.originalname?.toLowerCase().endsWith(".webm");
  cb(ok ? null : new Error("Unsupported file type. Only .webm allowed."), ok);
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 1024 },
});

export const videosRouter = Router();

/** Upload one video response */
videosRouter.post(
  "/:applicationId/:questionId",
  requireAuth(["CANDIDATE", "HR"]),
  upload.single("video"),
  async (req, res, next) => {
    try {
      const { applicationId, questionId } = req.params;
      const { durationMs, startedAt, endedAt, mimeType } = req.body;

      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { id: true, candidateId: true },
      });
      if (!app) return res.status(404).json({ error: "Application not found" });
      if (req.user.role === "CANDIDATE" && req.user.id !== app.candidateId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (!req.file) return res.status(400).json({ error: "Missing file" });
      const stat = fs.statSync(req.file.path);
      if (!stat.size) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Empty file uploaded" });
      }

      // Normalize the stored path (relative to server root)
      const relPath = path
        .relative(path.resolve(__dirname, "../../"), req.file.path)
        .replace(/\\/g, "/");

      const payload = {
        applicationId,
        questionId,
        filePath: relPath,
        mimeType: mimeType || req.file.mimetype || "video/webm",
        durationMs: Number.isFinite(Number(durationMs))
          ? Number(durationMs)
          : 0,
        startedAt: startedAt ? new Date(startedAt) : null,
        endedAt: endedAt ? new Date(endedAt) : null,
      };

      // unique on (applicationId, questionId)
      const record = await prisma.videoResponse.upsert({
        where: { applicationId_questionId: { applicationId, questionId } },
        create: payload,
        update: payload,
        select: {
          id: true,
          applicationId: true,
          questionId: true,
          filePath: true,
          mimeType: true,
          durationMs: true,
          startedAt: true,
          endedAt: true,
          createdAt: true,
        },
      });

      res.json({
        ...record,
        url: `/${record.filePath}`,
      });
    } catch (e) {
      next(e);
    }
  }
);

/** HR: list all videos for an application */
videosRouter.get(
  "/by-application/:applicationId",
  requireAuth(["HR"]),
  async (req, res, next) => {
    try {
      const rows = await prisma.videoResponse.findMany({
        where: { applicationId: req.params.applicationId },
        orderBy: [{ createdAt: "asc" }],
        select: {
          id: true,
          filePath: true,
          mimeType: true,
          durationMs: true,
          startedAt: true,
          endedAt: true,
          createdAt: true,
          question: { select: { id: true, prompt: true, order: true } },
        },
      });
      const items = rows.map((r) => ({
        id: r.id,
        url: r.filePath.startsWith("uploads/") ? `/${r.filePath}` : r.filePath,
        mimeType: r.mimeType,
        durationMs: r.durationMs,
        startedAt: r.startedAt,
        endedAt: r.endedAt,
        createdAt: r.createdAt,
        question: r.question || null,
      }));
      res.json({ items });
    } catch (e) {
      next(e);
    }
  }
);
