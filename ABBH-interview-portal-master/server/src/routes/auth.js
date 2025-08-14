// server/src/routes/auth.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db/prisma.js";
import { requireAuth, signToken } from "../utils/auth.js";

const router = Router();

/**
 * POST /api/auth/login
 * Body: { email, password }
 * - HR (from .env): HR_EMAIL + HR_PASSWORD
 * - Candidate (from DB): Candidate.email + passwordHash
 *
 * Returns: { token, user: { id, role: "HR"|"CANDIDATE", email, name? } }
 */
router.post("/login", async (req, res, next) => {
  try {
    const rawEmail = (req.body?.email ?? "").toString();
    const password = (req.body?.password ?? "").toString();

    const email = rawEmail.trim().toLowerCase();
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    // --- HR via environment ---
    const HR_EMAIL = (process.env.HR_EMAIL || "").trim().toLowerCase();
    const HR_PASSWORD = process.env.HR_PASSWORD ?? "";

    if (HR_EMAIL && email === HR_EMAIL) {
      // Plain-text compare with HR_PASSWORD
      const ok = HR_PASSWORD && password === HR_PASSWORD;
      if (!ok) {
        return res.status(401).json({ error: "Invalid email or password." });
      }
      const user = {
        id: "hr-static",
        role: "HR",
        email: HR_EMAIL,
        name: "Administrator",
      };
      const token = signToken(user);
      // Small diagnostic header to confirm HR path was used
      res.setHeader("X-Auth-Mode", "HR");
      return res.json({ token, user });
    }

    // --- Candidate from DB ---
    const candidate = await prisma.candidate.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true },
    });

    if (!candidate || !candidate.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const ok = await bcrypt.compare(password, candidate.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = {
      id: candidate.id,
      role: "CANDIDATE",
      email: candidate.email,
      name: candidate.name || null,
    };
    const token = signToken(user);
    res.setHeader("X-Auth-Mode", "CANDIDATE");
    return res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

/** GET /api/auth/me — who am I (requires token) */
router.get("/me", requireAuth(["HR", "CANDIDATE"]), (req, res) => {
  res.json({ user: req.user });
});

/** POST /api/auth/logout — stateless (client should clear token) */
router.post("/logout", (_req, res) => {
  res.json({ ok: true });
});

export default router;
