import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Starting jobId backfill...");

  // Pick a default job to assign missing jobIds
  const defaultJob = await prisma.job.findFirst();
  if (!defaultJob) {
    throw new Error(
      "❌ No jobs found in the database. Please create at least one job first."
    );
  }

  // Backfill Interviews
  const interviewsToFix = await prisma.interview.findMany({
    where: { jobId: null },
  });

  for (const interview of interviewsToFix) {
    await prisma.interview.update({
      where: { id: interview.id },
      data: { jobId: defaultJob.id },
    });
    console.log(
      `✅ Interview ${interview.id} updated with jobId ${defaultJob.id}`
    );
  }

  // Backfill Questions
  const questionsToFix = await prisma.question.findMany({
    where: { jobId: null },
  });

  for (const question of questionsToFix) {
    await prisma.question.update({
      where: { id: question.id },
      data: { jobId: defaultJob.id },
    });
    console.log(
      `✅ Question ${question.id} updated with jobId ${defaultJob.id}`
    );
  }

  console.log("🎉 Backfill complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
