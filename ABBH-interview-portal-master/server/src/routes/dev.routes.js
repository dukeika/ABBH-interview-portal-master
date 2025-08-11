// server/src/routes/dev.routes.js
import { Router } from "express";
import { prisma } from "../db/prisma.js";

const r = Router();

r.post("/gen-apps", async (_req, res) => {
  const jobs = await prisma.job.findMany({ take: 2 });
  if (jobs.length === 0)
    return res.status(400).json({ error: "Seed jobs first" });

  const stages = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"];
  const data = Array.from({ length: 20 }).map((_, i) => ({
    jobId: jobs[i % jobs.length].id,
    candidateName: `Demo Candidate ${i + 1}`,
    email: `demo${i + 1}@example.com`,
    phone: "+2348000000000",
    stage: stages[i % stages.length],
    status: "ACTIVE",
  }));
  await prisma.application.createMany({ data });
  res.json({ ok: true, count: data.length });
});

export default r;
