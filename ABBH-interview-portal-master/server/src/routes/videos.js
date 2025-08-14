// server/src/routes/videos.js
import { Router } from "express";
import multer from "multer";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../utils/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsRoot = path.resolve(__dirname, "../../uploads");
const videosRoot = path.join(uploadsRoot, "videos");
fs.mkdirSync(videosRoot, { recursive: true });

// Use memory storage — we write the file ourselves to avoid 0 KB issues on some OSes
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const ok =
    file.mimetype === "video/webm" ||
    file.mimetype === "application/octet-stream" ||
    (file.originalname && file.originalname.toLowerCase().endsWith(".webm"));
  if (!ok)
    return cb(new Error("Unsupported file type. Only .webm allowed."), false);
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB
});

export const videosRouter = Router();

/**
 * POST /api/videos/:applicationId/:questionId
 * multipart: video (file), durationMs, startedAt, endedAt, mimeType
 */
videosRouter.post(
  "/:applicationId/:questionId",
  requireAuth(["CANDIDATE", "HR"]),
  upload.single("video"),
  async (req, res, next) => {
    try {
      const { applicationId, questionId } = req.params;
      const { durationMs, startedAt, endedAt, mimeType } = req.body;

      if (!req.file) return res.status(400).json({ error: "Missing file" });
      if (!applicationId || !questionId)
        return res
          .status(400)
          .json({ error: "Missing applicationId/questionId" });

      // Authorize candidate ownership
      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { id: true, candidateId: true },
      });
      if (!app) return res.status(404).json({ error: "Application not found" });
      if (req.user?.role === "CANDIDATE" && req.user?.id !== app.candidateId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Buffer must have bytes
      const bytes = req.file.buffer?.length ?? 0;
      if (!bytes)
        return res.status(400).json({
          error: "Uploaded file is empty. Please retry your recording.",
        });

      // Compute destination and write the file
      const dir = path.join(videosRoot, applicationId);
      await fsp.mkdir(dir, { recursive: true });
      const ts = Date.now();
      const filenameBase = `${questionId}-${ts}.webm`;
      const fullPath = path.join(dir, filenameBase);
      await fsp.writeFile(fullPath, req.file.buffer);

      // Store relative path like "uploads/videos/<appId>/<file>"
      const relPath = path
        .relative(path.resolve(__dirname, "../../"), fullPath)
        .replace(/\\/g, "/");
      const publicUrl = `/${relPath}`;

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

      const record = await prisma.videoResponse.upsert({
        where: { applicationId_questionId: { applicationId, questionId } },
        create: payload,
        update: {
          filePath: relPath,
          mimeType: payload.mimeType,
          durationMs: payload.durationMs,
          startedAt: payload.startedAt,
          endedAt: payload.endedAt,
        },
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

      return res.json({
        id: record.id,
        applicationId: record.applicationId,
        questionId: record.questionId,
        url: publicUrl,
        durationMs: record.durationMs,
        startedAt: record.startedAt,
        endedAt: record.endedAt,
        createdAt: record.createdAt,
      });
    } catch (err) {
      next(err);
    }
  }
);

/** HR list videos for an application */
videosRouter.get(
  "/by-application/:applicationId",
  requireAuth(["HR"]),
  async (req, res, next) => {
    try {
      const { applicationId } = req.params;
      const rows = await prisma.videoResponse.findMany({
        where: { applicationId },
        orderBy: { createdAt: "asc" },
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
        question: r.question
          ? {
              id: r.question.id,
              prompt: r.question.prompt,
              order: r.question.order,
            }
          : null,
      }));
      res.json({ items });
    } catch (err) {
      next(err);
    }
  }
);
