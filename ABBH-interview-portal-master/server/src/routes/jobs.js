// server/src/routes/jobs.js
import express from "express";
import prisma from "../db/prisma.js";

const router = express.Router();

/** GET /api/jobs */
router.get("/", async (_req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" }, // remove if you don't have createdAt
      select: {
        id: true,
        title: true,
        // Remove fields below if they don't exist in your schema
        // location: true,
        // department: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(jobs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load jobs" });
  }
});

export default router;
