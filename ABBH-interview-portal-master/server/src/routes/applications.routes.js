import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { hashPassword } from "../lib/auth.js";

const r = Router();

/**
 * GET /api/applications
 * Optional query params:
 *  - q: search (candidateName/email/job.title)
 *  - jobId
 *  - stage (APPLIED|SCREENING|INTERVIEW|OFFER|REJECTED)
 *  - status (ACTIVE|WITHDRAWN)
 *  - take (default 100), skip (default 0)
 */
r.get("/", async (req, res) => {
  const { jobId, stage, status, q } = req.query;
  const take = Math.min(Number(req.query.take ?? 100), 200);
  const skip = Math.max(Number(req.query.skip ?? 0), 0);

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

  const [items, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: { job: true },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.application.count({ where }),
  ]);

  res.json({ items, total, take, skip });
});

/**
 * GET /api/applications/:id
 */
r.get("/:id", async (req, res) => {
  const app = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: {
      job: true,
      interviews: {
        include: { answers: { include: { question: true } } },
      },
    },
  });
  if (!app) return res.status(404).json({ error: "Application not found" });
  res.json(app);
});

/**
 * POST /api/applications
 * body: { jobId, candidateName, email, phone?, resumeUrl?, coverLetter? }
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
  if (!password || String(password).length < 6) {
    return res
      .status(400)
      .json({ error: "password (min 6 chars) is required" });
  }

  try {
    // find or create candidate account by email
    const existing = await prisma.candidate.findUnique({
      where: { email: email.toLowerCase() },
    });
    let candidateId = existing?.id;

    if (!existing) {
      const { hashPassword } = await import("../lib/auth.js");
      const passwordHash = await hashPassword(password);
      const created = await prisma.candidate.create({
        data: {
          name: candidateName,
          email: email.toLowerCase(),
          passwordHash,
        },
      });
      candidateId = created.id;
    }

    const createdApp = await prisma.application.create({
      data: {
        jobId,
        candidateId,
        candidateName,
        email: email.toLowerCase(),
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
 * body: { stage?, status?, overallScore?, coverLetter? }
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
    if (e?.code === "P2025") {
      return res.status(404).json({ error: "Application not found" });
    }
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
    if (e?.code === "P2025") {
      return res.status(404).json({ error: "Application not found" });
    }
    console.error("Delete application failed:", e);
    res.status(500).json({ error: "Failed to delete application" });
  }
});

export default r;
