import path from "path";

/**
 * Absolute path to the uploads root, e.g.
 *  <project>/server/uploads  (when you run `npm run dev` from /server)
 * or
 *  <project>/uploads         (if you ever run from repo root)
 */
export const UPLOAD_ROOT = path.resolve(
  process.cwd(),
  process.env.UPLOAD_DIR || "uploads"
);
