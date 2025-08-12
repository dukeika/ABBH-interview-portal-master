import multer from "multer";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const MAX_VIDEO_MB = parseInt(process.env.MAX_VIDEO_MB || "200", 10);
const MAX_BYTES = MAX_VIDEO_MB * 1024 * 1024;
const ALLOWED = new Set(["video/webm", "video/mp4"]);

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function extFor(mime) {
  if (mime === "video/webm") return ".webm";
  if (mime === "video/mp4") return ".mp4";
  return "";
}

export function makeVideoUploader() {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const interviewId = req.params.id;
      const dest = path.resolve(UPLOAD_DIR, "videos", interviewId);
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ts = Date.now();
      const qid = (req.body?.questionId || "noq").toString();
      const ext =
        extFor(file.mimetype) || path.extname(file.originalname) || ".webm";
      cb(null, `${ts}-${qid}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: MAX_BYTES },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED.has(file.mimetype)) {
        return cb(new Error("Unsupported video format. Use webm or mp4."));
      }
      cb(null, true);
    },
  });
}
