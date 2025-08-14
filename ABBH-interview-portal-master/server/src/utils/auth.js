// server/src/utils/auth.js
import jwt from "jsonwebtoken";

/** Sign a JWT for { id, role, email, name? } */
export function signToken(payload) {
  const secret = process.env.JWT_SECRET || "dev-secret";
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

/** Require a valid JWT and (optionally) specific roles */
export function requireAuth(allowedRoles) {
  return (req, res, next) => {
    try {
      const hdr = req.headers.authorization || "";
      const m = hdr.match(/^Bearer\s+(.+)$/i);
      if (!m) return res.status(401).json({ error: "Unauthorized" });

      const token = m[1];
      const secret = process.env.JWT_SECRET || "dev-secret";
      const decoded = jwt.verify(token, secret);

      req.user = {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
        name: decoded.name || null,
      };

      if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        if (!allowedRoles.includes(req.user.role)) {
          return res.status(403).json({ error: "Forbidden" });
        }
      }

      next();
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  };
}
