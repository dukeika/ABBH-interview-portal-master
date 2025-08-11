import { Router } from "express";
import jwt from "jsonwebtoken";

const r = Router();

// TEMP in-memory users — replace with Prisma later
const USERS = [
  {
    id: "u-hr-1",
    email: "hr@example.com",
    name: "HR Admin",
    role: "HR",
    password: "admin123",
  },
  // user typo safety:
  {
    id: "u-hr-2",
    email: "hr@examplle.com",
    name: "HR Admin (typo email)",
    role: "HR",
    password: "admin123",
  },
];

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

r.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "email and password are required" });

  const user = USERS.find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase()
  );
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken({
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
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
