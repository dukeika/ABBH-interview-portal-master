// scripts/backfill-jobid-smart.mjs
import dotenv from "dotenv";
dotenv.config({ path: "./server/.env" }); // Load env from server folder

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const DRY_RUN = !!process.env.DRY_RUN;

async function pickDefaultJob() {
  const job = await prisma.job.findFirst({ orderBy: { createdAt: "asc" } });
  if (!job)
    throw new Error(
      "No Job records found. Create at least one Job to use as a fallback."
    );
  return job;
}

async function backfillInterviews(defaultJobId) {
  const interviews = await prisma.interview.findMany({
    where: { OR: [{ jobId: null }, { jobId: "" }] },
    select: {
      id: true,
      jobId: true,
      application: { select: { id: true, jobId: true } },
    },
  });

  let fixed = 0;
  for (const iv of interviews) {
    const targetJobId = iv.application?.jobId || defaultJobId;

    if (DRY_RUN) {
      console.log(
        `[DRY] Interview ${iv.id}: ${iv.jobId ?? "null"} -> ${targetJobId}`
      );
    } else {
      await prisma.interview.update({
        where: { id: iv.id },
        data: { jobId: targetJobId },
      });
    }
    fixed++;
  }
  return fixed;
}

async function backfillQuestions(defaultJobId) {
  const questions = await prisma.question.findMany({
    where: { OR: [{ jobId: null }, { jobId: "" }] },
    select: { id: true, text: true },
  });

  let fixed = 0;
  for (const q of questions) {
    // 1) via Answer -> Interview -> Application
    const answer = await prisma.answer.findFirst({
      where: { questionId: q.id },
      select: {
        interview: { select: { application: { select: { jobId: true } } } },
      },
      orderBy: {
        /* arbitrary */
      },
    });
    let inferredJobId = answer?.interview?.application?.jobId || null;

    // 2) via VideoResponse -> Interview -> Application
    if (!inferredJobId) {
      const vr = await prisma.videoResponse.findFirst({
        where: { questionId: q.id },
        select: {
          interview: { select: { application: { select: { jobId: true } } } },
        },
      });
      inferredJobId = vr?.interview?.application?.jobId || null;
    }

    // 3) fallback to default
    const targetJobId = inferredJobId || defaultJobId;

    if (!inferredJobId) {
      console.warn(
        `⚠️  Question ${q.id} had no references; assigning default jobId=${defaultJobId}`
      );
    }

    if (DRY_RUN) {
      console.log(`[DRY] Question ${q.id}: null -> ${targetJobId}`);
    } else {
      await prisma.question.update({
        where: { id: q.id },
        data: { jobId: targetJobId },
      });
    }
    fixed++;
  }
  return fixed;
}

// Optional: fix interviews whose jobId mismatches application.jobId (consistency pass)
async function normalizeInterviewJobIds() {
  const items = await prisma.interview.findMany({
    where: {
      NOT: {
        application: { jobId: { equals: prisma.interview.fields.jobId } },
      },
    }, // not supported directly; do manual
    select: { id: true, jobId: true, application: { select: { jobId: true } } },
  });

  let changed = 0;
  for (const iv of items) {
    const appJobId = iv.application?.jobId || null;
    if (appJobId && iv.jobId !== appJobId) {
      if (DRY_RUN) {
        console.log(
          `[DRY] Normalize Interview ${iv.id}: ${
            iv.jobId ?? "null"
          } -> ${appJobId}`
        );
      } else {
        await prisma.interview.update({
          where: { id: iv.id },
          data: { jobId: appJobId },
        });
      }
      changed++;
    }
  }
  return changed;
}

async function main() {
  console.log("🔧 Backfill jobId starting...");
  const defaultJob = await pickDefaultJob();
  console.log(`Using default jobId: ${defaultJob.id} (${defaultJob.title})`);
  if (DRY_RUN)
    console.log("Running in DRY_RUN mode. No changes will be written.");

  const [ivFixed, qFixed] = await Promise.all([
    backfillInterviews(defaultJob.id),
    backfillQuestions(defaultJob.id),
  ]);

  const normalized = await normalizeInterviewJobIds();

  console.log(`✅ Interviews fixed: ${ivFixed}`);
  console.log(`✅ Questions fixed: ${qFixed}`);
  console.log(
    `✅ Interviews normalized (mismatch -> application.jobId): ${normalized}`
  );
  console.log("🎉 Backfill complete.");
}

main()
  .catch((e) => {
    console.error("❌ Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
