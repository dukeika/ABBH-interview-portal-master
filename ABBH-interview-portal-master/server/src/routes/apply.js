import express from "express";
import bcrypt from "bcryptjs";
import path from "path";
import prisma from "../db/prisma.js";
import { makeDocUploader } from "../config/uploads.js";
import { UPLOAD_ROOT } from "../config/paths.js";

const router = express.Router();
const upload = makeDocUploader();

/**
 * POST /api/apply
 * multipart/form-data: resume(file), fields: jobId, name, email, phone?, coverLetter?, password
 */
router.post("/", upload.single("resume"), async (req, res) => {
  try {
    const { jobId, name, email, phone, coverLetter, password } = req.body || {};
    if (!jobId || !email || !password || !req.file) {
      return res
        .status(400)
        .json({ error: "jobId, email, password and resume are required" });
    }

    // Build a web URL relative to the /uploads static mount, regardless of OS path separators
    const rel = path
      .relative(UPLOAD_ROOT, req.file.path)
      .split(path.sep) // win -> posix
      .join(path.posix.sep);
    const resumeUrl = `/uploads/${rel}`;

    const passwordHash = await bcrypt.hash(password, 10);

    const candidate = await prisma.candidate.upsert({
      where: { email },
      update: { name: name ?? null, passwordHash },
      create: { email, name: name ?? null, passwordHash },
      select: { id: true, email: true, name: true },
    });

    const app = await prisma.application.create({
      data: {
        jobId,
        candidateId: candidate.id,
        candidateName: name ?? candidate.name ?? email,
        email,
        phone: phone ?? null,
        resumeUrl, // <-- stored absolute web path under /uploads
        coverLetter: coverLetter ?? null,
        stage: "APPLIED",
        status: "ACTIVE",
      },
      select: { id: true, createdAt: true, stage: true },
    });

    return res.json({ ok: true, applicationId: app.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to submit application" });
  }
});

export default router;
