// server/src/lib/auth.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export function signToken(payload, expiresIn = "7d") {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set in environment");
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Optional middleware if you want to protect routes later
export function requireAuth(role) {
  return (req, res, next) => {
    try {
      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      if (!token) return res.status(401).json({ error: "Missing token" });
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (role && payload.role !== role)
        return res.status(403).json({ error: "Forbidden" });
      req.user = payload;
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };
}
