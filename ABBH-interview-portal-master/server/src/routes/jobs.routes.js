import { Router } from "express";
import { prisma } from "../db/prisma.js";

const r = Router();

r.get("/", async (req, res) => {
  const { status } = req.query;
  const jobs = await prisma.job.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
  res.json(jobs);
});

r.get("/:id", async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

r.post("/", async (req, res) => {
  const { title, department, location, description, status } = req.body;
  if (!title || !description)
    return res
      .status(400)
      .json({ error: "title and description are required" });
  const created = await prisma.job.create({
    data: { title, department, location, description, status },
  });
  res.status(201).json(created);
});

r.put("/:id", async (req, res) => {
  const { title, department, location, description, status } = req.body;
  try {
    const updated = await prisma.job.update({
      where: { id: req.params.id },
      data: { title, department, location, description, status },
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: "Job not found" });
  }
});

r.delete("/:id", async (req, res) => {
  try {
    await prisma.job.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Job not found" });
  }
});

export default r;
