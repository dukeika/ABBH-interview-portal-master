const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const dbFile = path.join(root, "prisma", "dev.db");
const uploads = path.join(root, "uploads");

try {
  fs.rmSync(dbFile, { force: true });
} catch {}
try {
  fs.rmSync(uploads, { recursive: true, force: true });
} catch {}
fs.mkdirSync(path.join(uploads, "resumes"), { recursive: true });
fs.mkdirSync(path.join(uploads, "videos"), { recursive: true });

execSync("npx prisma migrate dev --name init", { stdio: "inherit" });
execSync("npm run db:seed", { stdio: "inherit" });

console.log("✅ Reset complete.");
