import multer from "multer";
import fs from "fs";
import path from "path";
import { UPLOAD_ROOT } from "./paths.js";

const MAX_VIDEO_MB = parseInt(process.env.MAX_VIDEO_MB || "200", 10);
const MAX_DOC_MB = parseInt(process.env.MAX_DOC_MB || "20", 10);

const VIDEO_ALLOWED = new Set([
  "video/webm",
  "video/mp4",
  "video/quicktime",
  "video/x-matroska",
]);

const DOC_ALLOWED = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function extFor(mime, fallback = "") {
  if (mime === "video/webm") return ".webm";
  if (mime === "video/mp4") return ".mp4";
  if (mime === "video/quicktime") return ".mov";
  if (mime === "application/pdf") return ".pdf";
  if (mime.includes("word")) return ".docx";
  if (mime === "application/msword") return ".doc";
  if (mime === "text/plain") return ".txt";
  return fallback || ".bin";
}

export function makeVideoUploader() {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const interviewId = String(req.params.id);
      const dest = path.join(UPLOAD_ROOT, "videos", interviewId);
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ts = Date.now();
      const qid = (req.body?.questionId || "noq").toString();
      const ext = extFor(file.mimetype, path.extname(file.originalname));
      cb(null, `${ts}-${qid}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: MAX_VIDEO_MB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!VIDEO_ALLOWED.has(file.mimetype))
        return cb(new Error("Use WEBM/MP4/MOV"));
      cb(null, true);
    },
  });
}

export function makeDocUploader() {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dest = path.join(UPLOAD_ROOT, "resumes");
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (_req, file, cb) => {
      const ts = Date.now();
      const clean = file.originalname.replace(/\s+/g, "_");
      const ext = extFor(file.mimetype, path.extname(file.originalname));
      // Avoid double extension if original already has it
      const base = clean.endsWith(ext) ? clean.slice(0, -ext.length) : clean;
      cb(null, `${ts}-${base}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: MAX_DOC_MB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!DOC_ALLOWED.has(file.mimetype))
        return cb(new Error("Upload a PDF/DOC/DOCX/TXT"));
      cb(null, true);
    },
  });
}
