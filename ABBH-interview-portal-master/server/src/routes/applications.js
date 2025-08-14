// server/src/routes/applications.js
import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../utils/auth.js";

const router = Router();

/**
 * GET /api/applications
 * Admin list of applications with candidate + job summary
 */
router.get("/", requireAuth(["HR"]), async (_req, res, next) => {
  try {
    const apps = await prisma.application.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        stage: true,
        status: true,
        createdAt: true,
        job: { select: { id: true, title: true } },
        candidate: { select: { id: true, name: true, email: true } },
      },
    });
    res.json(apps);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/applications/:id
 * Admin: get one application
 */
router.get("/:id", requireAuth(["HR"]), async (req, res, next) => {
  try {
    const app = await prisma.application.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        stage: true,
        status: true,
        createdAt: true,
        resumeUrl: true,
        coverLetter: true,
        job: { select: { id: true, title: true } },
        candidate: { select: { id: true, name: true, email: true } },
      },
    });
    if (!app) return res.status(404).json({ error: "Application not found" });
    res.json(app);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/applications/:applicationId/written-questions
 * Candidate (owner) or HR: list written questions for the application's job
 */
router.get(
  "/:applicationId/written-questions",
  requireAuth(["CANDIDATE", "HR"]),
  async (req, res, next) => {
    try {
      const { applicationId } = req.params;
      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { id: true, jobId: true, candidateId: true },
      });
      if (!app) return res.status(404).json({ error: "Application not found" });
      if (req.user.role === "CANDIDATE" && req.user.id !== app.candidateId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const questions = await prisma.question.findMany({
        where: { jobId: app.jobId, forStage: "WRITTEN" },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: { id: true, prompt: true, order: true },
      });

      res.json(questions);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * (Optional) GET /api/applications/:applicationId/video-questions
 * Candidate (owner) or HR: list video questions for the application's job
 */
router.get(
  "/:applicationId/video-questions",
  requireAuth(["CANDIDATE", "HR"]),
  async (req, res, next) => {
    try {
      const { applicationId } = req.params;
      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { id: true, jobId: true, candidateId: true },
      });
      if (!app) return res.status(404).json({ error: "Application not found" });
      if (req.user.role === "CANDIDATE" && req.user.id !== app.candidateId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const questions = await prisma.question.findMany({
        where: { jobId: app.jobId, forStage: "VIDEO" },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: { id: true, prompt: true, order: true },
      });

      res.json(questions);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/applications/:applicationId/written-answers
 * Body: { answers: [{ questionId: string, answer: string }] }
 * Creates or updates a WRITTEN Interview and stores per-question answers.
 * Candidate (owner) or HR.
 */
router.post(
  "/:applicationId/written-answers",
  requireAuth(["CANDIDATE", "HR"]),
  async (req, res, next) => {
    try {
      const { applicationId } = req.params;
      const { answers } = req.body || {};
      if (!Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ error: "No answers provided." });
      }

      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { id: true, jobId: true, candidateId: true },
      });
      if (!app) return res.status(404).json({ error: "Application not found" });
      if (req.user.role === "CANDIDATE" && req.user.id !== app.candidateId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Ensure the questions belong to this job and are for WRITTEN
      const qids = answers.map((a) => a.questionId);
      const validQs = await prisma.question.findMany({
        where: { id: { in: qids }, jobId: app.jobId, forStage: "WRITTEN" },
        select: { id: true },
      });
      const validSet = new Set(validQs.map((q) => q.id));
      const filtered = answers.filter((a) => validSet.has(a.questionId));

      if (filtered.length === 0) {
        return res
          .status(400)
          .json({ error: "No valid answers for this application." });
      }

      // Find or create a WRITTEN interview for this application
      let interview = await prisma.interview.findFirst({
        where: { applicationId, jobId: app.jobId, type: "WRITTEN" },
        select: { id: true },
      });
      if (!interview) {
        interview = await prisma.interview.create({
          data: {
            applicationId,
            jobId: app.jobId,
            type: "WRITTEN",
            durationMins: 0,
          },
          select: { id: true },
        });
      }

      // Upsert each answer (find existing pair, update or create)
      for (const a of filtered) {
        const existing = await prisma.answer.findFirst({
          where: { interviewId: interview.id, questionId: a.questionId },
          select: { id: true },
        });
        if (existing) {
          await prisma.answer.update({
            where: { id: existing.id },
            data: { answer: a.answer ?? "" },
          });
        } else {
          await prisma.answer.create({
            data: {
              interviewId: interview.id,
              questionId: a.questionId,
              answer: a.answer ?? "",
            },
          });
        }
      }

      // Mark interview submittedAt for bookkeeping
      await prisma.interview.update({
        where: { id: interview.id },
        data: { submittedAt: new Date() },
      });

      res.json({ ok: true, interviewId: interview.id });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
