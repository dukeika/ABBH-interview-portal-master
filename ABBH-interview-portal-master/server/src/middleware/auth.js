import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user; // { id, role, email }
    return next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(role) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ error: "Unauthenticated" });
    if (req.user.role !== role)
      return res.status(403).json({ error: "Forbidden" });
    return next();
  };
}

export const requireHR = [requireAuth, requireRole("HR")];
export const requireCandidate = [requireAuth, requireRole("CANDIDATE")];
