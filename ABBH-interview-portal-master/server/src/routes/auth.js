import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
// Comma-separated admin emails → HR role on login
const HR_EMAILS = (process.env.HR_EMAILS || "hr@example.com")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function roleForEmail(email) {
  return HR_EMAILS.includes(email.toLowerCase()) ? "HR" : "CANDIDATE";
}

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "email and password are required" });

    const existing = await prisma.candidate.findUnique({ where: { email } });
    if (existing)
      return res.status(400).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const candidate = await prisma.candidate.create({
      data: { email, passwordHash, name: name ?? null },
      select: { id: true, email: true, name: true },
    });

    const role = roleForEmail(email);
    const token = jwt.sign({ id: candidate.id, email, role }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({
      token,
      user: { id: candidate.id, email, name: candidate.name, role },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "email and password are required" });

    const cand = await prisma.candidate.findUnique({ where: { email } });
    if (!cand) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, cand.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const role = roleForEmail(email);
    const token = jwt.sign({ id: cand.id, email, role }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({
      token,
      user: { id: cand.id, email: cand.email, name: cand.name, role },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
