// server/src/routes/applicationStatus.js
import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../utils/auth.js";

const router = Router();

/**
 * GET /api/application-status?latest=true
 * Candidate-only: returns latest application + written/video flags
 */
router.get("/", requireAuth(["CANDIDATE"]), async (req, res, next) => {
  try {
    const latest = req.query.latest === "true";
    const app = await prisma.application.findFirst({
      where: { candidateId: req.user.id },
      orderBy: latest ? { createdAt: "desc" } : undefined,
      select: {
        id: true,
        stage: true,
        status: true,
        createdAt: true,
        jobId: true,
        job: { select: { id: true, title: true } },
        finalCallUrl: true,
        finalCallAt: true,
      },
    });

    if (!app) return res.json({ application: null });

    // For disabling/enabling buttons on Status page
    const [videoAssignedCount, videoResponseCount, writtenInterview] =
      await Promise.all([
        prisma.question.count({
          where: { jobId: app.jobId, forStage: "VIDEO" },
        }),
        prisma.videoResponse.count({ where: { applicationId: app.id } }),
        prisma.interview.findFirst({
          where: { applicationId: app.id, type: "WRITTEN" },
          select: { id: true, submittedAt: true },
        }),
      ]);

    const hasVideoStarted = videoResponseCount > 0;
    const hasVideoCompleted =
      videoAssignedCount > 0 && videoResponseCount >= videoAssignedCount;

    const hasWrittenSubmitted = !!writtenInterview?.submittedAt;

    res.json({
      application: {
        id: app.id,
        stage: app.stage,
        status: app.status,
        job: app.job,
        finalCallUrl: app.finalCallUrl,
        finalCallAt: app.finalCallAt,
        videoAssignedCount,
        videoResponseCount,
        hasVideoStarted,
        hasVideoCompleted,
        hasWrittenSubmitted, // ✅ for disabling written start
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
export const applicationStatusRouter = router;
