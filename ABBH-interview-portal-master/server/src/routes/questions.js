// server/src/routes/questions.js
import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../utils/auth.js";

export const questionsRouter = Router();

/**
 * GET /api/applications/:applicationId/video-questions
 * Returns ordered questions for the application's job.
 * Auth: Candidate (owner) OR HR
 */
questionsRouter.get(
  "/:applicationId/video-questions",
  requireAuth(["CANDIDATE", "HR"]),
  async (req, res, next) => {
    try {
      const { applicationId } = req.params;
      const isDev = process.env.NODE_ENV !== "production";

      console.log(
        "[questions] request for applicationId:",
        applicationId,
        "role:",
        req.user?.role
      );

      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { id: true, jobId: true, candidateId: true },
      });

      if (!app) {
        console.warn("[questions] application not found:", applicationId);
        if (isDev) {
          // DEV FALLBACK so you can proceed without data fully seeded
          return res.json({
            questions: [
              {
                id: "q1",
                prompt: "Introduce yourself and summarize experience.",
                order: 1,
              },
              {
                id: "q2",
                prompt: "Describe a challenging problem you solved.",
                order: 2,
              },
              { id: "q3", prompt: "Why do you want this role?", order: 3 },
            ],
          });
        }
        return res.status(404).json({ error: "Application not found" });
      }

      // If Candidate, enforce ownership
      if (req.user?.role === "CANDIDATE" && req.user?.id !== app.candidateId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      let questions = await prisma.question.findMany({
        where: { jobId: app.jobId, forStage: "VIDEO" }, // if you tag video questions
        orderBy: { order: "asc" },
        select: { id: true, prompt: true, order: true },
      });

      if (!questions.length) {
        // fallback to any questions for that job
        questions = await prisma.question.findMany({
          where: { jobId: app.jobId },
          orderBy: { order: "asc" },
          select: { id: true, prompt: true, order: true },
        });
      }

      if (!questions.length && isDev) {
        // DEV fallback if job has no questions yet
        questions = [
          {
            id: "q1",
            prompt: "Introduce yourself and summarize experience.",
            order: 1,
          },
          {
            id: "q2",
            prompt: "Describe a challenging problem you solved.",
            order: 2,
          },
          { id: "q3", prompt: "Why do you want this role?", order: 3 },
        ];
      }

      res.json({ questions });
    } catch (err) {
      next(err);
    }
  }
);
