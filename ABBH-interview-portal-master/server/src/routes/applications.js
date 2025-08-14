import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../utils/auth.js";

const router = Router();

/**
 * GET /api/applications
 * Admin list (optional filters)
 */
router.get("/", requireAuth(["HR"]), async (req, res, next) => {
  try {
    const { q, stage, job } = req.query;

    const where = {};
    if (stage) where.stage = stage;
    if (job) where.jobId = job;
    if (q) {
      where.OR = [
        { email: { contains: String(q), mode: "insensitive" } },
        { candidateName: { contains: String(q), mode: "insensitive" } },
        { candidate: { name: { contains: String(q), mode: "insensitive" } } },
        { job: { title: { contains: String(q), mode: "insensitive" } } },
      ];
    }

    const items = await prisma.application.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        job: { select: { id: true, title: true } },
        candidate: { select: { id: true, email: true, name: true } },
      },
    });

    res.json(items);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/applications/:applicationId/video-questions
 * Candidate/HR – return assigned VIDEO questions (fallback to job VIDEO questions)
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
      if (req.user?.role === "CANDIDATE" && req.user?.id !== app.candidateId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const interview = await prisma.interview.findFirst({
        where: { applicationId, jobId: app.jobId, type: "VIDEO" },
        select: { assignedQuestionIds: true },
      });

      let questions = [];
      if (
        Array.isArray(interview?.assignedQuestionIds) &&
        interview.assignedQuestionIds.length
      ) {
        questions = await prisma.question.findMany({
          where: { id: { in: interview.assignedQuestionIds } },
        });
        // keep original order from assignedQuestionIds
        const orderMap = new Map(
          interview.assignedQuestionIds.map((id, i) => [id, i])
        );
        questions.sort(
          (a, b) => (orderMap.get(a.id) ?? 1e9) - (orderMap.get(b.id) ?? 1e9)
        );
      } else {
        questions = await prisma.question.findMany({
          where: { jobId: app.jobId, forStage: "VIDEO" },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        });
      }

      res.json(
        questions.map((q) => ({
          id: q.id,
          prompt: q.prompt || q.text,
          order: q.order ?? 0,
        }))
      );
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/applications/:applicationId/written-questions
 * Candidate/HR – return assigned WRITTEN questions (fallback to job WRITTEN questions)
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
      if (req.user?.role === "CANDIDATE" && req.user?.id !== app.candidateId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const interview = await prisma.interview.findFirst({
        where: { applicationId, jobId: app.jobId, type: "WRITTEN" },
        select: { assignedQuestionIds: true },
      });

      let questions = [];
      if (
        Array.isArray(interview?.assignedQuestionIds) &&
        interview.assignedQuestionIds.length
      ) {
        questions = await prisma.question.findMany({
          where: { id: { in: interview.assignedQuestionIds } },
        });
        const orderMap = new Map(
          interview.assignedQuestionIds.map((id, i) => [id, i])
        );
        questions.sort(
          (a, b) => (orderMap.get(a.id) ?? 1e9) - (orderMap.get(b.id) ?? 1e9)
        );
      } else {
        questions = await prisma.question.findMany({
          where: { jobId: app.jobId, forStage: "WRITTEN" },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        });
      }

      res.json(
        questions.map((q) => ({
          id: q.id,
          prompt: q.prompt || q.text,
          order: q.order ?? 0,
        }))
      );
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/applications/:id
 * HR or owner can view a specific application
 */
router.get("/:id", requireAuth(["CANDIDATE", "HR"]), async (req, res, next) => {
  try {
    const { id } = req.params;

    const app = await prisma.application.findUnique({
      where: { id },
      include: {
        job: { select: { id: true, title: true } },
        candidate: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
        interviews: true,
      },
    });
    if (!app) return res.status(404).json({ error: "Application not found" });

    if (req.user?.role === "CANDIDATE" && req.user?.id !== app.candidateId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json(app);
  } catch (err) {
    next(err);
  }
});

export default router;
