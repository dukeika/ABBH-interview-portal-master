import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1) Ensure the demo job exists (include required fields like `description`)
  const job = await prisma.job.upsert({
    where: { id: "demo-job-1" },
    update: {
      title: "Software Engineer (Demo)",
      description: "Demo job used to exercise the video interview flow.",
    },
    create: {
      id: "demo-job-1",
      title: "Software Engineer (Demo)",
      description: "Demo job used to exercise the video interview flow.",
      // If your Job model has other REQUIRED fields, add safe defaults here, e.g.:
      // status: "PUBLISHED",           // if non-null enum
      // location: "Remote",            // if non-null string
      // department: "Engineering",     // if non-null string
    },
  });

  // 2) Ensure candidate exists
  const candidate = await prisma.candidate.upsert({
    where: { email: "candidate@example.com" },
    update: { name: "Candidate Demo" },
    create: {
      email: "candidate@example.com",
      name: "Candidate Demo",
      passwordHash: "seed", // required string in your schema
    },
  });

  // 3) Ensure an application for that candidate+job
  let app = await prisma.application.findFirst({
    where: { jobId: job.id, candidateId: candidate.id },
    select: { id: true },
  });
  if (!app) {
    app = await prisma.application.create({
      data: {
        jobId: job.id,
        candidateId: candidate.id,
        candidateName: candidate.name || "Candidate Demo",
        email: candidate.email,
        phone: "0800-000-0000",
        stage: "APPLIED",
        status: "ACTIVE",
      },
      select: { id: true },
    });
  }

  // 4) Ensure a few VIDEO questions on this job
  const texts = [
    "Describe a challenging bug you fixed recently and how you approached it.",
    "How would you design a REST API for a todo app? Walk through trade-offs.",
    "Tell us about a time you improved performance in production.",
  ];
  for (const text of texts) {
    const existing = await prisma.question.findFirst({
      where: { jobId: job.id, text },
    });
    if (!existing) {
      await prisma.question.create({
        data: { jobId: job.id, text, type: "OPEN", forStage: "VIDEO" },
      });
    }
  }
  const qList = await prisma.question.findMany({
    where: { jobId: job.id, forStage: "VIDEO" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  // 5) Create a VIDEO interview assigned to those questions
  const interview = await prisma.interview.create({
    data: {
      applicationId: app.id,
      jobId: job.id,
      type: "VIDEO",
      durationMins: 15,
      assignedAt: new Date(),
      assignedQuestionIds: qList.map((q) => q.id),
    },
    select: { id: true, type: true },
  });

  console.log("✅ Demo interview created:", interview);
  console.log(
    "➡️  Candidate can open /status or /candidate/video/" + interview.id
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
