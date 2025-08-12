import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { signToken, verifyPassword } from "../lib/auth.js";

const r = Router();

/**
 * POST /candidate/auth/login
 * body: { email, password }
 * returns: { token, user }
 */
r.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "email and password are required" });

  const candidate = await prisma.candidate.findUnique({
    where: { email: String(email).toLowerCase() },
  });
  if (!candidate) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await verifyPassword(password, candidate.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({
    sub: candidate.id,
    role: "CANDIDATE",
    email: candidate.email,
    name: candidate.name,
  });
  res.json({
    token,
    user: {
      id: candidate.id,
      role: "CANDIDATE",
      email: candidate.email,
      name: candidate.name,
    },
  });
});

/**
 * GET /candidate/me/apps
 * - Bearer token (candidate)
 * - Returns array of candidate's apps with job + interviews
 */
r.get("/me/apps", async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  let payload;
  try {
    payload = (await import("jsonwebtoken")).default.verify(
      token,
      process.env.JWT_SECRET
    );
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (payload?.role !== "CANDIDATE")
    return res.status(403).json({ error: "Forbidden" });

  try {
    const apps = await prisma.application.findMany({
      where: { candidateId: payload.sub },
      include: {
        job: true,
        interviews: { include: { answers: { include: { question: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(apps);
  } catch (e) {
    console.error("candidate/me/apps error:", e);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

export default r;
