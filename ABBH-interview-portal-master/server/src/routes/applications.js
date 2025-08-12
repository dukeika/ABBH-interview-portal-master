import express from "express";
import prisma from "../db/prisma.js";
import { requireHR, requireAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/applications
 * HR-only list with optional filters:
 *   ?q=<search>   (candidateName/email/job.title contains)
 *   ?stage=<Stage>
 *   ?jobId=<jobId>
 */
router.get("/", requireHR, async (req, res) => {
  try {
    const { q, stage, jobId } = req.query;

    const where = {
      ...(stage ? { stage: String(stage) } : {}),
      ...(jobId ? { jobId: String(jobId) } : {}),
      ...(q
        ? {
            OR: [
              { candidateName: { contains: String(q), mode: "insensitive" } },
              { email: { contains: String(q), mode: "insensitive" } },
              { job: { title: { contains: String(q), mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const apps = await prisma.application.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        candidateName: true,
        email: true,
        phone: true,
        stage: true, // e.g., APPLIED | SCREENING | WRITTEN | VIDEO | FINAL_CALL | OFFER | REJECTED
        status: true, // ACTIVE | WITHDRAWN (if present in your schema)
        overallScore: true,
        createdAt: true,
        job: {
          select: {
            id: true,
            title: true,
            // include only fields that exist in your Job model:
            // location: true,
          },
        },
      },
    });

    res.json(apps);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load applications" });
  }
});

/**
 * GET /api/applications/:id
 * HR can view any; Candidates can only view their own.
 */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const app = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        interviews: { select: { id: true, type: true, submittedAt: true } },
      },
    });
    if (!app) return res.status(404).json({ error: "Application not found" });

    if (req.user.role !== "HR") {
      // Candidate: must own the application
      if (!app.candidateId || app.candidateId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }
    res.json(app);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load application" });
  }
});

export default router;
