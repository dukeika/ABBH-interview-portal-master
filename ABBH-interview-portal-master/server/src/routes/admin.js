import express from "express";
import prisma from "../db/prisma.js";
import { requireHR } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/admin/applications/:id/assign-video
 * body: { questionIds?: string[], durationMins?: number }
 * Creates Interview{ type: VIDEO } and stores assignedQuestionIds (optional).
 */
router.post("/applications/:id/assign-video", requireHR, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { questionIds = [], durationMins = 15 } = req.body;

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });
    if (!app) return res.status(404).json({ error: "Application not found" });

    // Validate questionIds belong to app.jobId and are VIDEO-stage
    let validatedIds = [];
    if (Array.isArray(questionIds) && questionIds.length) {
      const qs = await prisma.question.findMany({
        where: { id: { in: questionIds }, jobId: app.jobId, forStage: "VIDEO" },
        select: { id: true },
      });
      const found = new Set(qs.map((q) => q.id));
      validatedIds = questionIds.filter((id) => found.has(id));
      if (validatedIds.length !== questionIds.length) {
        return res.status(400).json({
          error: "One or more questionIds are invalid for this job/stage",
        });
      }
    }

    // POST /api/admin/applications/:id/assign-written
    router.post(
      "/applications/:id/assign-written",
      requireHR,
      async (req, res) => {
        try {
          const applicationId = req.params.id;
          const { questionIds = [], durationMins = 30 } = req.body;

          const app = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { job: true },
          });
          if (!app)
            return res.status(404).json({ error: "Application not found" });

          // Validate questionIds belong to the job and forStage = WRITTEN
          let validatedIds = [];
          if (Array.isArray(questionIds) && questionIds.length) {
            const qs = await prisma.question.findMany({
              where: {
                id: { in: questionIds },
                jobId: app.jobId,
                forStage: "WRITTEN",
              },
              select: { id: true },
            });
            const found = new Set(qs.map((q) => q.id));
            validatedIds = questionIds.filter((id) => found.has(id));
            if (validatedIds.length !== questionIds.length) {
              return res.status(400).json({
                error: "One or more questionIds are invalid for this job/stage",
              });
            }
          }

          const created = await prisma.interview.create({
            data: {
              applicationId: app.id,
              jobId: app.jobId,
              type: "WRITTEN",
              assignedAt: new Date(),
              durationMins: durationMins || 30,
              assignedQuestionIds: validatedIds.length ? validatedIds : null,
            },
            select: { id: true, type: true },
          });

          // Move stage to WRITTEN
          await prisma.application.update({
            where: { id: applicationId },
            data: { stage: "WRITTEN" },
          });

          return res.json(created);
        } catch (e) {
          console.error(e);
          return res
            .status(500)
            .json({ error: "Failed to assign written interview" });
        }
      }
    );

    // POST /api/admin/applications/:id/assign-written
    router.post(
      "/applications/:id/assign-written",
      requireHR,
      async (req, res) => {
        try {
          const applicationId = req.params.id;
          const { questionIds = [], durationMins = 30 } = req.body;

          const app = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { job: true },
          });
          if (!app)
            return res.status(404).json({ error: "Application not found" });

          // Validate questionIds belong to the job and forStage = WRITTEN
          let validatedIds = [];
          if (Array.isArray(questionIds) && questionIds.length) {
            const qs = await prisma.question.findMany({
              where: {
                id: { in: questionIds },
                jobId: app.jobId,
                forStage: "WRITTEN",
              },
              select: { id: true },
            });
            const found = new Set(qs.map((q) => q.id));
            validatedIds = questionIds.filter((id) => found.has(id));
            if (validatedIds.length !== questionIds.length) {
              return res.status(400).json({
                error: "One or more questionIds are invalid for this job/stage",
              });
            }
          }

          const created = await prisma.interview.create({
            data: {
              applicationId: app.id,
              jobId: app.jobId,
              type: "WRITTEN",
              assignedAt: new Date(),
              durationMins: durationMins || 30,
              assignedQuestionIds: validatedIds.length ? validatedIds : null,
            },
            select: { id: true, type: true },
          });

          // Move stage to WRITTEN
          await prisma.application.update({
            where: { id: applicationId },
            data: { stage: "WRITTEN" },
          });

          return res.json(created);
        } catch (e) {
          console.error(e);
          return res
            .status(500)
            .json({ error: "Failed to assign written interview" });
        }
      }
    );

    const created = await prisma.interview.create({
      data: {
        applicationId: app.id,
        jobId: app.jobId,
        type: "VIDEO",
        assignedAt: new Date(),
        durationMins: durationMins || 15,
        assignedQuestionIds: validatedIds.length ? validatedIds : null,
      },
      select: { id: true, type: true, applicationId: true },
    });

    return res.json(created);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to assign video interview" });
  }
});

/**
 * PATCH /api/admin/applications/:id/stage
 * body: { stage, finalCallUrl?, finalCallAt?, overallScore? }
 */
router.patch("/applications/:id/stage", requireHR, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { stage, finalCallUrl, finalCallAt, overallScore } = req.body;

    if (!stage) return res.status(400).json({ error: "stage is required" });

    const data = { stage };
    if (finalCallUrl !== undefined) data.finalCallUrl = finalCallUrl || null;
    if (finalCallAt !== undefined)
      data.finalCallAt = finalCallAt ? new Date(finalCallAt) : null;
    if (overallScore !== undefined) data.overallScore = overallScore;

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data,
      select: {
        id: true,
        stage: true,
        finalCallUrl: true,
        finalCallAt: true,
        overallScore: true,
      },
    });

    return res.json(updated);
  } catch (e) {
    console.error(e);
    if (e.code === "P2025")
      return res.status(404).json({ error: "Application not found" });
    return res.status(500).json({ error: "Failed to update stage" });
  }
});

export default router;
