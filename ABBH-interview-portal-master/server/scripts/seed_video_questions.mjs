import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  const jobs = await prisma.job.findMany({ select: { id: true, title: true } });
  if (!jobs.length) {
    console.log("No jobs found. Create a Job first, then re-run this seed.");
    return;
  }

  for (const job of jobs) {
    const count = await prisma.question.count({ where: { jobId: job.id } });
    if (count > 0) {
      console.log(
        `Job ${job.title} already has ${count} question(s). Skipping…`
      );
      continue;
    }
    console.log(`Seeding 3 questions for job: ${job.title}`);
    await prisma.question.createMany({
      data: [
        {
          jobId: job.id,
          prompt: "Introduce yourself and relevant experience.",
          order: 1,
          forStage: "VIDEO",
        },
        {
          jobId: job.id,
          prompt: "Describe a tough problem you solved, step by step.",
          order: 2,
          forStage: "VIDEO",
        },
        {
          jobId: job.id,
          prompt: "Why do you want this role and what value will you add?",
          order: 3,
          forStage: "VIDEO",
        },
      ],
    });
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
