import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../utils/auth.js";

const router = Router();

/**
 * POST /api/interviews/:applicationId/written/submit
 * Body: { answers: [{ questionId: string, answer: string }] }
 * Candidate/HR (candidate must own the application)
 */
router.post(
  "/:applicationId/written/submit",
  requireAuth(["CANDIDATE", "HR"]),
  async (req, res, next) => {
    try {
      const { applicationId } = req.params;
      const { answers } = req.body;

      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { id: true, jobId: true, candidateId: true },
      });
      if (!app) return res.status(404).json({ error: "Application not found" });
      if (req.user?.role === "CANDIDATE" && req.user?.id !== app.candidateId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Find or create WRITTEN interview
      let interview = await prisma.interview.findFirst({
        where: { applicationId, jobId: app.jobId, type: "WRITTEN" },
      });
      if (!interview) {
        interview = await prisma.interview.create({
          data: {
            applicationId,
            jobId: app.jobId,
            type: "WRITTEN",
            durationMins: 30,
          },
        });
      }

      // Upsert answers
      if (Array.isArray(answers)) {
        for (const a of answers) {
          if (!a?.questionId) continue;
          const existing = await prisma.answer.findFirst({
            where: { interviewId: interview.id, questionId: a.questionId },
          });
          if (existing) {
            await prisma.answer.update({
              where: { id: existing.id },
              data: { answer: String(a.answer || "") },
            });
          } else {
            await prisma.answer.create({
              data: {
                interviewId: interview.id,
                questionId: a.questionId,
                answer: String(a.answer || ""),
              },
            });
          }
        }
      }

      await prisma.interview.update({
        where: { id: interview.id },
        data: { submittedAt: new Date() },
      });

      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
