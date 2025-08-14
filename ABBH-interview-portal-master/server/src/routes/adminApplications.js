// server/src/routes/adminApplications.js
import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../utils/auth.js";

export const adminApplicationsRouter = Router();

/** GET detail (now includes resumeUrl + coverLetter) */
adminApplicationsRouter.get(
  "/:id",
  requireAuth(["HR"]),
  async (req, res, next) => {
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
        },
      });
      if (!app) return res.status(404).json({ error: "Application not found" });
      // inject resumeUrl + coverLetter explicitly (they're already on app, just ensuring shape)
      res.json({
        ...app,
        resumeUrl: app.resumeUrl || null,
        coverLetter: app.coverLetter || "",
      });
    } catch (err) {
      next(err);
    }
  }
);

/** Assign WRITTEN */
adminApplicationsRouter.post(
  "/:id/assign-written",
  requireAuth(["HR"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const app = await prisma.application.findUnique({
        where: { id },
        select: { id: true, jobId: true },
      });
      if (!app) return res.status(404).json({ error: "Application not found" });

      const writtenQs = await prisma.question.findMany({
        where: { jobId: app.jobId, forStage: "WRITTEN" },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: { id: true },
      });
      const qIds = writtenQs.map((q) => q.id);

      const existing = await prisma.interview.findFirst({
        where: { applicationId: id, jobId: app.jobId, type: "WRITTEN" },
        select: { id: true },
      });

      if (existing) {
        await prisma.interview.update({
          where: { id: existing.id },
          data: { assignedQuestionIds: qIds, durationMins: 30 },
        });
      } else {
        await prisma.interview.create({
          data: {
            applicationId: id,
            jobId: app.jobId,
            type: "WRITTEN",
            durationMins: 30,
            assignedQuestionIds: qIds,
          },
        });
      }

      const updated = await prisma.application.update({
        where: { id },
        data: { stage: "WRITTEN" },
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

/** Assign VIDEO */
adminApplicationsRouter.post(
  "/:id/assign-video",
  requireAuth(["HR"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const app = await prisma.application.findUnique({
        where: { id },
        select: { id: true, jobId: true },
      });
      if (!app) return res.status(404).json({ error: "Application not found" });

      const videoQs = await prisma.question.findMany({
        where: { jobId: app.jobId, forStage: "VIDEO" },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: { id: true },
      });
      const qIds = videoQs.map((q) => q.id);

      const existing = await prisma.interview.findFirst({
        where: { applicationId: id, jobId: app.jobId, type: "VIDEO" },
        select: { id: true },
      });

      if (existing) {
        await prisma.interview.update({
          where: { id: existing.id },
          data: { assignedQuestionIds: qIds, durationMins: 10 },
        });
      } else {
        await prisma.interview.create({
          data: {
            applicationId: id,
            jobId: app.jobId,
            type: "VIDEO",
            durationMins: 10,
            assignedQuestionIds: qIds,
          },
        });
      }

      const updated = await prisma.application.update({
        where: { id },
        data: { stage: "VIDEO" },
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

/** Accept / Reject */
adminApplicationsRouter.post(
  "/:id/accept",
  requireAuth(["HR"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated = await prisma.application.update({
        where: { id },
        data: { stage: "OFFER", status: "ACCEPTED" },
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);
adminApplicationsRouter.post(
  "/:id/reject",
  requireAuth(["HR"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated = await prisma.application.update({
        where: { id },
        data: { stage: "REJECTED", status: "REJECTED" },
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

/** NEW: HR – review written questions & answers */
adminApplicationsRouter.get(
  "/:id/written",
  requireAuth(["HR"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const app = await prisma.application.findUnique({
        where: { id },
        select: { id: true, jobId: true },
      });
      if (!app) return res.status(404).json({ error: "Application not found" });

      // the WRITTEN interview, if it exists
      const interview = await prisma.interview.findFirst({
        where: { applicationId: id, jobId: app.jobId, type: "WRITTEN" },
        select: { id: true, assignedQuestionIds: true, submittedAt: true },
      });

      // answers mapped by questionId
      const answers = interview
        ? await prisma.answer.findMany({
            where: { interviewId: interview.id },
            select: { questionId: true, answer: true },
          })
        : [];

      const answerMap = new Map(
        answers.map((a) => [a.questionId, a.answer || ""])
      );

      // questions to show (assigned order if available; otherwise by job)
      let questions = [];
      if (interview?.assignedQuestionIds?.length) {
        questions = await prisma.question.findMany({
          where: { id: { in: interview.assignedQuestionIds } },
          select: { id: true, prompt: true, order: true },
        });
        const pos = new Map(
          interview.assignedQuestionIds.map((qid, i) => [qid, i])
        );
        questions.sort(
          (a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9)
        );
      } else {
        questions = await prisma.question.findMany({
          where: { jobId: app.jobId, forStage: "WRITTEN" },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          select: { id: true, prompt: true, order: true },
        });
      }

      res.json({
        submittedAt: interview?.submittedAt || null,
        items: questions.map((q) => ({
          question: { id: q.id, prompt: q.prompt, order: q.order ?? 0 },
          answer: answerMap.get(q.id) ?? "",
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);
