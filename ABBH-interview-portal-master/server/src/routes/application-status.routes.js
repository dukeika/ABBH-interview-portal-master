import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";

const r = Router();

// Candidate view: latest or all
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

  if (payload?.role !== "CANDIDATE")
    return res.status(403).json({ error: "Forbidden" });

  const { latest } = req.query;
  const apps = await prisma.application.findMany({
    where: { candidateId: payload.sub },
    include: { job: true },
    orderBy: { createdAt: "desc" },
  });

  return res.json(latest === "true" ? apps[0] || null : apps);
});

// server/src/routes/application-status.routes.js
r.get("/", async (req, res) => {
  // ...verify token...
  const { latest } = req.query;
  const apps = await prisma.application.findMany({
    where: { candidateId: payload.sub },
    include: {
      job: true,
      interviews: {
        select: { id: true, type: true },
        orderBy: { assignedAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return res.json(latest === "true" ? apps[0] || null : apps);
});

export default r;
