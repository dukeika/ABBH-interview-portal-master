// server/src/routes/adminApplications.js
import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../utils/auth.js";

const router = Router();

async function loadApp(id) {
  return prisma.application.findUnique({
    where: { id },
    select: {
      id: true,
      stage: true,
      status: true,
      createdAt: true,
      resumeUrl: true,
      coverLetter: true,
      finalCallUrl: true,
      finalCallAt: true,
      job: { select: { id: true, title: true } },
      candidate: { select: { id: true, name: true, email: true } },
    },
  });
}

// List applications
router.get(
  "/applications",
  requireAuth(["HR", "ADMIN"]),
  async (_req, res, next) => {
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
    } catch (e) {
      next(e);
    }
  }
);

// One application
router.get(
  "/applications/:id",
  requireAuth(["HR", "ADMIN"]),
  async (req, res, next) => {
    try {
      const app = await loadApp(req.params.id);
      if (!app) return res.status(404).json({ error: "Application not found" });
      res.json(app);
    } catch (e) {
      next(e);
    }
  }
);

// Stage moves
router.post(
  "/applications/:id/assign-written",
  requireAuth(["HR", "ADMIN"]),
  async (req, res, next) => {
    try {
      await prisma.application.update({
        where: { id: req.params.id },
        data: { stage: "WRITTEN" },
      });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/applications/:id/assign-video",
  requireAuth(["HR", "ADMIN"]),
  async (req, res, next) => {
    try {
      await prisma.application.update({
        where: { id: req.params.id },
        data: { stage: "VIDEO" },
      });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);

// Final Call scheduling
router.post(
  "/applications/:id/schedule-final-call",
  requireAuth(["HR", "ADMIN"]),
  async (req, res, next) => {
    try {
      const { finalCallUrl, finalCallAt } = req.body || {};
      if (!finalCallUrl)
        return res.status(400).json({ error: "finalCallUrl is required" });
      const when = finalCallAt ? new Date(finalCallAt) : null;

      const app = await prisma.application.update({
        where: { id: req.params.id },
        data: { stage: "FINAL_CALL", finalCallUrl, finalCallAt: when },
        select: {
          id: true,
          stage: true,
          finalCallUrl: true,
          finalCallAt: true,
        },
      });
      res.json({ ok: true, application: app });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/applications/:id/clear-final-call",
  requireAuth(["HR", "ADMIN"]),
  async (req, res, next) => {
    try {
      const app = await prisma.application.update({
        where: { id: req.params.id },
        data: { finalCallUrl: null, finalCallAt: null },
        select: {
          id: true,
          stage: true,
          finalCallUrl: true,
          finalCallAt: true,
        },
      });
      res.json({ ok: true, application: app });
    } catch (e) {
      next(e);
    }
  }
);

// Final decisions
router.post(
  "/applications/:id/accept",
  requireAuth(["HR", "ADMIN"]),
  async (req, res, next) => {
    try {
      await prisma.application.update({
        where: { id: req.params.id },
        data: { stage: "OFFER" },
      });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/applications/:id/reject",
  requireAuth(["HR", "ADMIN"]),
  async (req, res, next) => {
    try {
      await prisma.application.update({
        where: { id: req.params.id },
        data: { stage: "REJECTED" },
      });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);

// Written answers review
router.get(
  "/applications/:applicationId/written",
  requireAuth(["HR", "ADMIN"]),
  async (req, res, next) => {
    try {
      const app = await prisma.application.findUnique({
        where: { id: req.params.applicationId },
        select: { id: true },
      });
      if (!app) return res.status(404).json({ error: "Application not found" });

      const interview = await prisma.interview.findFirst({
        where: { applicationId: app.id, type: "WRITTEN" },
        select: { id: true, submittedAt: true },
      });
      if (!interview) return res.json({ submittedAt: null, items: [] });

      const answers = await prisma.answer.findMany({
        where: { interviewId: interview.id },
        orderBy: { id: "asc" },
        select: {
          answer: true,
          question: { select: { id: true, prompt: true, order: true } },
        },
      });

      res.json({
        submittedAt: interview.submittedAt,
        items: answers.map((a) => ({
          question: a.question,
          answer: a.answer || "",
        })),
      });
    } catch (e) {
      next(e);
    }
  }
);

export const adminApplicationsRouter = router;
export default router;
