import { Router } from "express";
import { prisma } from "../db/prisma.js";

const r = Router();

// LIST (Admin)
r.get("/", async (_req, res) => {
  const apps = await prisma.application.findMany({
    include: { job: true, candidate: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(apps);
});

// DETAIL (Admin/Candidate)
r.get("/:id", async (req, res) => {
  const app = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: {
      job: true,
      candidate: true,
      interviews: {
        include: {
          answers: { include: { question: true } },
          videos: true,
        },
      },
    },
  });
  if (!app) return res.status(404).json({ error: "Not found" });
  res.json(app);
});

// UPDATE stage/status/final call (Admin)
r.patch("/:id", async (req, res) => {
  const { stage, status, finalCallUrl, finalCallAt, overallScore } =
    req.body || {};
  try {
    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: {
        stage,
        status,
        overallScore: overallScore ?? undefined,
        finalCallUrl: finalCallUrl ?? undefined,
        finalCallAt: finalCallAt ? new Date(finalCallAt) : undefined,
      },
    });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025")
      return res.status(404).json({ error: "Not found" });
    console.error(e);
    res.status(500).json({ error: "Update failed" });
  }
});

export default r;
