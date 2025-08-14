// server/src/routes/adminJobs.js
import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../utils/auth.js";

const router = Router();

/** List all jobs (admin) */
router.get("/", requireAuth(["HR"]), async (_req, res, next) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        department: true,
        location: true,
        description: true,
        status: true,
        createdAt: true,
      },
    });
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

/** Create a job (admin) */
router.post("/", requireAuth(["HR"]), async (req, res, next) => {
  try {
    const { title, description, location, department, status } = req.body;
    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "title and description are required" });
    }
    const job = await prisma.job.create({
      data: {
        title,
        description,
        location: location || null,
        department: department || null,
        status: status || "PUBLISHED",
      },
      select: { id: true },
    });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

/** List questions for a job, optionally filtered by stage */
router.get("/:jobId/questions", requireAuth(["HR"]), async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { forStage } = req.query; // WRITTEN | VIDEO | undefined

    const where = { jobId };
    if (forStage === "WRITTEN" || forStage === "VIDEO") {
      Object.assign(where, { forStage });
    }

    const questions = await prisma.question.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        prompt: true,
        order: true,
        forStage: true,
        type: true,
        createdAt: true,
      },
    });
    res.json(questions);
  } catch (err) {
    next(err);
  }
});

/** Create a question for a job */
router.post(
  "/:jobId/questions",
  requireAuth(["HR"]),
  async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const { prompt, text, forStage, type } = req.body;

      const p = (prompt || text || "").trim();
      if (!p)
        return res.status(400).json({ error: "prompt (or text) is required" });
      if (forStage !== "WRITTEN" && forStage !== "VIDEO") {
        return res
          .status(400)
          .json({ error: "forStage must be WRITTEN or VIDEO" });
      }

      // Compute next order within (jobId, forStage)
      const max = await prisma.question.findFirst({
        where: { jobId, forStage },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      const nextOrder = (max?.order ?? 0) + 1;

      const created = await prisma.question.create({
        data: {
          jobId,
          text: p, // keep text mirrored
          prompt: p, // used by UI
          order: nextOrder,
          forStage,
          type: type === "OPEN" ? "OPEN" : "OPEN",
        },
        select: {
          id: true,
          prompt: true,
          order: true,
          forStage: true,
          type: true,
          createdAt: true,
        },
      });

      res.json(created);
    } catch (err) {
      next(err);
    }
  }
);

/** Update a question (optional) */
router.patch(
  "/:jobId/questions/:id",
  requireAuth(["HR"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { prompt, text, order, forStage } = req.body;

      const data = {};
      if (prompt) data.prompt = prompt;
      if (text) data.text = text;
      if (typeof order === "number") data.order = order;
      if (forStage === "WRITTEN" || forStage === "VIDEO")
        data.forStage = forStage;

      const updated = await prisma.question.update({
        where: { id },
        data,
        select: {
          id: true,
          prompt: true,
          order: true,
          forStage: true,
          type: true,
          createdAt: true,
        },
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

/** Delete a question */
router.delete(
  "/:jobId/questions/:id",
  requireAuth(["HR"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      await prisma.question.delete({ where: { id } });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

/** Reorder questions by array of {id, order} */
router.post(
  "/:jobId/questions/reorder",
  requireAuth(["HR"]),
  async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      for (const it of items) {
        if (!it?.id || typeof it?.order !== "number") continue;
        await prisma.question.update({
          where: { id: it.id },
          data: { order: it.order },
        });
      }
      const updated = await prisma.question.findMany({
        where: { jobId },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          prompt: true,
          order: true,
          forStage: true,
          type: true,
          createdAt: true,
        },
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
