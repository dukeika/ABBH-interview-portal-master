// server/scripts/backfill_video_interview.mjs
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Load server/.env reliably
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

async function backfillQuestions() {
  const jobs = await prisma.job.findMany({ select: { id: true } });
  for (const job of jobs) {
    const qs = await prisma.question.findMany({
      where: { jobId: job.id },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    let i = 1;
    for (const q of qs) {
      const prompt =
        q.prompt && q.prompt.trim().length > 0
          ? q.prompt
          : q.text && q.text.trim().length > 0
          ? q.text
          : "Please answer this question.";

      await prisma.question.update({
        where: { id: q.id },
        data: {
          prompt,
          order: q.order && q.order > 0 ? q.order : i,
        },
      });
      i++;
    }
  }
}

async function backfillVideoResponses() {
  // NOTE: mimeType is non-null with default, so don't filter by mimeType:null
  const vids = await prisma.videoResponse.findMany({
    where: {
      OR: [
        { applicationId: null },
        { applicationId: "" },
        { durationMs: 0 }, // keep this to normalize any zero durations
      ],
    },
    select: {
      id: true,
      applicationId: true,
      interviewId: true,
      mimeType: true,
      durationMs: true,
    },
  });

  const unresolved = [];

  for (const v of vids) {
    let appId = v.applicationId || null;

    // Try to derive from Interview if missing
    if (!appId && v.interviewId) {
      const interview = await prisma.interview.findUnique({
        where: { id: v.interviewId },
        select: { applicationId: true },
      });
      if (interview?.applicationId) appId = interview.applicationId;
    }

    if (!appId) {
      // Can't proceed to NOT NULL migration unless this is resolved.
      unresolved.push(v.id);
      // Still normalize duration/mimeType so we fix what we can
      await prisma.videoResponse.update({
        where: { id: v.id },
        data: {
          durationMs: v.durationMs && v.durationMs > 0 ? v.durationMs : 0,
        },
      });
      continue;
    }

    await prisma.videoResponse.update({
      where: { id: v.id },
      data: {
        applicationId: appId,
        durationMs: v.durationMs && v.durationMs > 0 ? v.durationMs : 0,
        // mimeType already has a default; keep existing value
      },
    });
  }

  if (unresolved.length) {
    console.log(
      `⚠️ Could not determine applicationId for ${
        unresolved.length
      } VideoResponse row(s). IDs:\n - ${unresolved.join("\n - ")}\n` +
        "Resolve these by setting applicationId to a valid Application.id or remove the rows before making applicationId required."
    );
  } else {
    console.log("All VideoResponse rows have an applicationId. ✅");
  }
}

async function main() {
  console.log("Backfilling Question.prompt/order …");
  await backfillQuestions();

  console.log("Backfilling VideoResponse.applicationId/durationMs …");
  await backfillVideoResponses();

  console.log("Backfill complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
