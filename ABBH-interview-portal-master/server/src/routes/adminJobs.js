import express from "express";
import prisma from "../db/prisma.js";
import { requireHR } from "../middleware/auth.js";

const router = express.Router();

// Jobs
router.post("/jobs", requireHR, async (req, res) => {
  try {
    const {
      title,
      description,
      status = "PUBLISHED",
      location,
      department,
    } = req.body || {};
    if (!title || !description)
      return res.status(400).json({ error: "title and description required" });
    const job = await prisma.job.create({
      data: { title, description, status, location, department },
    });
    res.json(job);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create job" });
  }
});

router.delete("/jobs/:id", requireHR, async (req, res) => {
  try {
    await prisma.job.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete job" });
  }
});

// Questions per stage
router.get("/jobs/:jobId/questions", requireHR, async (req, res) => {
  try {
    const { forStage } = req.query;
    const questions = await prisma.question.findMany({
      where: {
        jobId: req.params.jobId,
        ...(forStage ? { forStage: String(forStage) } : {}),
      },
      orderBy: { createdAt: "asc" },
    });
    res.json(questions);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

router.post("/jobs/:jobId/questions", requireHR, async (req, res) => {
  try {
    const { text, type = "OPEN", forStage } = req.body || {};
    if (!text || !forStage)
      return res.status(400).json({ error: "text and forStage required" });
    const q = await prisma.question.create({
      data: { jobId: req.params.jobId, text, type, forStage },
    });
    res.json(q);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create question" });
  }
});

router.delete("/jobs/:jobId/questions/:qid", requireHR, async (req, res) => {
  try {
    await prisma.question.delete({ where: { id: req.params.qid } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete question" });
  }
});

export default router;
