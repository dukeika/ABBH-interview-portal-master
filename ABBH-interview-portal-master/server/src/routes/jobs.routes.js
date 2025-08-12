import { Router } from "express";
import { prisma } from "../db/prisma.js";

const r = Router();

r.get("/", async (_req, res) => {
  const jobs = await prisma.job.findMany({ orderBy: { createdAt: "desc" } });
  res.json(jobs);
});

export default r;
