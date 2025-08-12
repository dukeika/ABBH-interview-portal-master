import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";
import { hashPassword, verifyPassword } from "../lib/auth.js";

const r = Router();

/**
 * GET /api/applications
 * Query (optional):
 *  - q: search in candidateName/email/job.title
 *  - jobId, stage, status
 *  - take (default 100, max 200), skip (default 0)
 * Returns: plain array (include job)
 */
r.get("/", async (req, res) => {
  const { q, jobId, stage, status } = req.query;
  const take = Math.min(parseInt(req.query.take ?? "100", 10) || 100, 200);
  const skip = Math.max(parseInt(req.query.skip ?? "0", 10) || 0, 0);

  const where = {
    jobId: jobId || undefined,
    stage: stage || undefined,
    status: status || undefined,
    OR: q
      ? [
          { candidateName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { job: { title: { contains: q, mode: "insensitive" } } },
        ]
      : undefined,
  };

  const apps = await prisma.application.findMany({
    where,
    include: { job: true },
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });

  res.json(apps);
});

/**
 * GET /api/applications/:id
 */
r.get("/:id", async (req, res) => {
  const app = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: {
      job: true,
      interviews: { include: { answers: { include: { question: true } } } },
    },
  });
  if (!app) return res.status(404).json({ error: "Application not found" });
  res.json(app);
});

/**
 * POST /api/applications
 * Body:
 *  - jobId, candidateName, email
 *  - phone?, resumeUrl?, coverLetter?
 *  - password? (required if NOT logged in as candidate)
 *
 * Behavior:
 *  - If Bearer token (role=CANDIDATE) → use that candidateId
 *  - Else create/reuse Candidate by email (hash password on create; verify on reuse)
 *  - Prevent duplicate (candidateId + jobId) applications
 */
r.post("/", async (req, res) => {
  const {
    jobId,
    candidateName,
    email,
    phone,
    resumeUrl,
    coverLetter,
    password,
  } = req.body || {};

  if (!jobId || !candidateName || !email) {
    return res
      .status(400)
      .json({ error: "jobId, candidateName, and email are required" });
  }

  const normalizedEmail = String(email).toLowerCase();

  // Try read candidate from JWT
  let candidateFromToken = null;
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload?.role === "CANDIDATE") {
        candidateFromToken = await prisma.candidate.findUnique({
          where: { id: payload.sub },
        });
      }
    }
  } catch {
    /* ignore token errors; treat as unauthenticated */
  }

  try {
    let candidateId;

    if (candidateFromToken) {
      candidateId = candidateFromToken.id;
      // optionally sync name/email if different
      if (candidateName && candidateFromToken.name !== candidateName) {
        await prisma.candidate.update({
          where: { id: candidateId },
          data: { name: candidateName },
        });
      }
    } else {
      if (!password || String(password).length < 6) {
        return res.status(400).json({
          error: "password (min 6 chars) is required when not logged in",
        });
      }

      const existing = await prisma.candidate.findUnique({
        where: { email: normalizedEmail },
      });
      if (existing) {
        const ok = await verifyPassword(password, existing.passwordHash);
        if (!ok)
          return res.status(401).json({
            error: "Account exists. Please log in or use the correct password.",
          });
        if (candidateName && existing.name !== candidateName) {
          await prisma.candidate.update({
            where: { id: existing.id },
            data: { name: candidateName },
          });
        }
        candidateId = existing.id;
      } else {
        const passwordHash = await hashPassword(password);
        const created = await prisma.candidate.create({
          data: { name: candidateName, email: normalizedEmail, passwordHash },
        });
        candidateId = created.id;
      }
    }

    // Prevent duplicate application to same job by same candidate
    const dup = await prisma.application.findFirst({
      where: { candidateId, jobId },
      select: { id: true },
    });
    if (dup)
      return res
        .status(409)
        .json({ error: "You already applied for this role." });

    const createdApp = await prisma.application.create({
      data: {
        jobId,
        candidateId,
        candidateName,
        email: normalizedEmail,
        phone,
        resumeUrl,
        coverLetter,
      },
      include: { job: true },
    });

    res.status(201).json(createdApp);
  } catch (e) {
    console.error("Create application failed:", e);
    res.status(500).json({ error: "Failed to create application" });
  }
});

/**
 * PATCH /api/applications/:id
 * Body: { stage?, status?, overallScore?, coverLetter? }
 */
r.patch("/:id", async (req, res) => {
  const { stage, status, overallScore, coverLetter } = req.body || {};
  try {
    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: { stage, status, overallScore, coverLetter },
    });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025")
      return res.status(404).json({ error: "Application not found" });
    console.error("Update application failed:", e);
    res.status(500).json({ error: "Failed to update application" });
  }
});

/**
 * DELETE /api/applications/:id
 */
r.delete("/:id", async (req, res) => {
  try {
    await prisma.application.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    if (e?.code === "P2025")
      return res.status(404).json({ error: "Application not found" });
    console.error("Delete application failed:", e);
    res.status(500).json({ error: "Failed to delete application" });
  }
});

export default r;
