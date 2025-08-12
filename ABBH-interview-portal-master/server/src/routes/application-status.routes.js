import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";

const r = Router();

/**
 * GET /api/application-status
 *  - Requires Bearer token for role=CANDIDATE
 *  - Query:
 *     - latest=true  → return only the most recent application
 *     - jobId=...    → filter to a specific job (optional)
 *
 * Returns:
 *   - latest=true → single object or null
 *   - default     → array of applications (desc by createdAt)
 */
r.get("/", async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (payload?.role !== "CANDIDATE") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { latest, jobId } = req.query;

  const where = {
    candidateId: payload.sub,
    jobId: jobId || undefined,
  };

  try {
    const apps = await prisma.application.findMany({
      where,
      include: {
        job: true,
        interviews: { include: { answers: { include: { question: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (latest === "true") {
      return res.json(apps[0] || null);
    }
    res.json(apps);
  } catch (e) {
    console.error("application-status error:", e);
    res.status(500).json({ error: "Failed to fetch application status" });
  }
});

export default r;
