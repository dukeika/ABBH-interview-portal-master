// server/src/routes/applicationStatus.js
import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../utils/auth.js";

const router = Router();

/**
 * GET /api/application-status?latest=true
 * Candidate: return their most recent ACTIVE application and stage
 * HR: returns null (not used by HR)
 */
router.get("/", requireAuth(["CANDIDATE", "HR"]), async (req, res, next) => {
  try {
    const latest = req.query.latest === "true" || req.query.latest === true;

    if (!latest)
      return res.json({ id: null, stage: null, jobId: null, jobTitle: null });

    // For candidates, return most recent active application
    if (req.user.role === "CANDIDATE") {
      const app = await prisma.application.findFirst({
        where: { candidateId: req.user.id, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        include: { job: { select: { id: true, title: true } } },
      });
      return res.json({
        id: app?.id || null,
        stage: app?.stage || null,
        jobId: app?.job?.id || null,
        jobTitle: app?.job?.title || null,
      });
    }

    // HR doesn't use this endpoint for routing
    return res.json({ id: null, stage: null, jobId: null, jobTitle: null });
  } catch (err) {
    next(err);
  }
});

export default router;
