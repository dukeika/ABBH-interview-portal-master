import { Router } from "express";
import { prisma } from "../db/prisma.js";

const r = Router();

r.get("/", async (req, res) => {
  const { jobId, stage, status, q } = req.query;
  const apps = await prisma.application.findMany({
    where: {
      jobId: jobId || undefined,
      stage: stage || undefined,
      status: status || undefined,
      OR: q
        ? [
            { candidateName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    },
    include: { job: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(apps);
});

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

r.post("/", async (req, res) => {
  const { jobId, candidateName, email, phone, resumeUrl } = req.body;
  if (!jobId || !candidateName || !email) {
    return res
      .status(400)
      .json({ error: "jobId, candidateName, and email are required" });
  }
  const created = await prisma.application.create({
    data: { jobId, candidateName, email, phone, resumeUrl },
  });
  res.status(201).json(created);
});

r.patch("/:id", async (req, res) => {
  const { stage, status, overallScore } = req.body;
  try {
    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: { stage, status, overallScore },
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: "Application not found" });
  }
});

r.delete("/:id", async (req, res) => {
  try {
    await prisma.application.delete({ where: { id: req.params.id } });
  } catch {
    return res.status(404).json({ error: "Application not found" });
  }
  res.json({ ok: true });
});

export default r;
