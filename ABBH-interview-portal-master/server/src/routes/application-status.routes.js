import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";

const r = Router();

/**
 * GET /api/application-status
 * - Requires Bearer token (candidate)
 * - Optional query: latest=true  → returns only the most recent application
 * Response: array of applications (or single object if latest=true)
 */
r.get("/", async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Only candidates should hit this route
    if (payload.role !== "CANDIDATE") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const apps = await prisma.application.findMany({
      where: { candidateId: payload.sub },
      include: {
        job: true,
        interviews: { include: { answers: { include: { question: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (req.query.latest === "true") {
      return res.json(apps[0] || null);
    }
    res.json(apps);
  } catch (e) {
    console.error("application-status error:", e);
    res.status(401).json({ error: "Invalid token" });
  }
});

export default r;
