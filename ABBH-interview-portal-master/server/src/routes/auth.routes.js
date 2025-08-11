import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";
import { verifyPassword } from "../lib/auth.js";

const r = Router();

// TEMP in-memory admin users
const ADMINS = [
  {
    id: "u-hr-1",
    email: "hr@example.com",
    name: "HR Admin",
    role: "HR",
    password: "admin123",
  },
  {
    id: "u-hr-2",
    email: "hr@examplle.com",
    name: "HR Admin (typo email)",
    role: "HR",
    password: "admin123",
  },
];

function sign(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

r.post("/login", async (req, res) => {
  const { email, password, type } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "email and password are required" });

  // 1) If explicitly admin
  if (type === "ADMIN") {
    const admin = ADMINS.find(
      (a) => a.email.toLowerCase() === String(email).toLowerCase()
    );
    if (!admin || admin.password !== password)
      return res.status(401).json({ error: "Invalid credentials" });
    const token = sign({
      sub: admin.id,
      role: "HR",
      email: admin.email,
      name: admin.name,
    });
    return res.json({
      token,
      user: { id: admin.id, email: admin.email, name: admin.name, role: "HR" },
    });
  }

  // 2) Try admin first (backward compatible)
  const admin = ADMINS.find(
    (a) => a.email.toLowerCase() === String(email).toLowerCase()
  );
  if (admin && admin.password === password) {
    const token = sign({
      sub: admin.id,
      role: "HR",
      email: admin.email,
      name: admin.name,
    });
    return res.json({
      token,
      user: { id: admin.id, email: admin.email, name: admin.name, role: "HR" },
    });
  }

  // 3) Fallback to candidate login
  const candidate = await prisma.candidate.findUnique({
    where: { email: String(email).toLowerCase() },
  });
  if (!candidate) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await verifyPassword(password, candidate.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = sign({
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

r.get("/me", (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ ok: true, user: payload });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default r;
