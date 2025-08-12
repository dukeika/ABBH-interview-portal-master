import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";

const r = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const sign = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

// POST /login  { email, password }
r.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  // HR via env (optional)
  const HR_EMAIL = process.env.HR_EMAIL || "hr@example.com";
  const HR_PASSWORD_HASH = process.env.HR_PASSWORD_HASH || ""; // bcrypt hash, optional

  if (email.toLowerCase() === HR_EMAIL.toLowerCase()) {
    if (!HR_PASSWORD_HASH)
      return res
        .status(401)
        .json({ error: "HR not configured. Set HR_PASSWORD_HASH." });

    const ok = await bcrypt.compare(password, HR_PASSWORD_HASH);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = sign({ sub: "HR", role: "HR", email: HR_EMAIL });
    return res.json({
      token,
      user: { id: "HR", role: "HR", email: HR_EMAIL, name: "HR" },
    });
  }

  // Candidate
  const cand = await prisma.candidate.findUnique({ where: { email } });
  if (!cand) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, cand.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = sign({ sub: cand.id, role: "CANDIDATE", email: cand.email });
  res.json({
    token,
    user: {
      id: cand.id,
      role: "CANDIDATE",
      email: cand.email,
      name:
        cand.name ||
        `${cand.firstName ?? ""} ${cand.lastName ?? ""}`.trim() ||
        "Candidate",
    },
  });
});

// POST /register  { firstName?, lastName?, name?, email, password }
r.post("/register", async (req, res) => {
  const { email, password, firstName, lastName, name } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  const exists = await prisma.candidate.findUnique({ where: { email } });
  if (exists)
    return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const cand = await prisma.candidate.create({
    data: {
      email,
      passwordHash,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      name:
        name ??
        (firstName || lastName
          ? `${firstName ?? ""} ${lastName ?? ""}`.trim()
          : null),
    },
  });

  const token = sign({ sub: cand.id, role: "CANDIDATE", email: cand.email });
  res.status(201).json({
    token,
    user: {
      id: cand.id,
      role: "CANDIDATE",
      email: cand.email,
      name:
        cand.name ||
        `${cand.firstName ?? ""} ${cand.lastName ?? ""}`.trim() ||
        "Candidate",
    },
  });
});

export default r;
