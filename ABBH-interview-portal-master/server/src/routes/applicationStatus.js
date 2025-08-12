import express from "express";
import prisma from "../db/prisma.js";
import { requireCandidate } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/application-status?latest=true
 * Auth: Candidate
 * Returns latest application plus interviews: [{ id, type }]
 */
router.get("/", requireCandidate, async (req, res) => {
  const { latest } = req.query;
  try {
    const apps = await prisma.application.findMany({
      where: { candidateId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: latest ? 1 : 10,
      include: {
        job: true,
        interviews: { select: { id: true, type: true } },
      },
    });

    if (latest && apps.length) return res.json(apps[0]);
    return res.json(apps);
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ error: "Failed to retrieve application status" });
  }
});

export default router;
