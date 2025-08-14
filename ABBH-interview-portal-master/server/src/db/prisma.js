// server/src/db/prisma.js
import { PrismaClient } from "@prisma/client";

// Reuse the PrismaClient across hot reloads in dev (nodemon)
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // log: ["query", "info", "warn", "error"], // uncomment for debugging
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
