import {
  PrismaClient,
  JobStatus,
  Stage,
  AppStatus,
  InterviewType,
} from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Wipe existing data (dev only)
  await prisma.interviewAnswer.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.application.deleteMany();
  await prisma.question.deleteMany();
  await prisma.job.deleteMany();

  console.log("🗑 Cleared existing records.");

  // ---------------- JOBS ----------------
  const jobs = await prisma.job.createMany({
    data: [
      {
        title: "Frontend Engineer",
        department: "Engineering",
        location: "Remote",
        description:
          "Build a modern interview platform UI with React, MUI, and modern tooling.",
        status: JobStatus.PUBLISHED,
      },
      {
        title: "Backend Engineer",
        department: "Engineering",
        location: "Lagos, NG",
        description:
          "Design reliable APIs and services using Node.js, Prisma, and PostgreSQL.",
        status: JobStatus.PUBLISHED,
      },
      {
        title: "Product Manager",
        department: "Product",
        location: "Hybrid - Abuja",
        description:
          "Drive product vision and delivery for the interview platform.",
        status: JobStatus.DRAFT,
      },
      {
        title: "QA Engineer",
        department: "Quality Assurance",
        location: "Remote",
        description:
          "Ensure product quality with automated and manual testing.",
        status: JobStatus.CLOSED,
      },
    ],
  });

  const jobList = await prisma.job.findMany();
  console.log(`📌 Created ${jobList.length} jobs.`);

  // ---------------- QUESTIONS ----------------
  await prisma.question.createMany({
    data: [
      {
        text: "Explain the event loop in JavaScript.",
        category: "JavaScript",
        difficulty: 3,
        weight: 2,
      },
      {
        text: "What is Prisma and how does it simplify database access?",
        category: "Backend",
        difficulty: 2,
        weight: 1,
      },
      {
        text: "Design an API for job applications.",
        category: "System Design",
        difficulty: 4,
        weight: 3,
      },
      {
        text: "How do you secure an Express API?",
        category: "Security",
        difficulty: 2,
        weight: 2,
      },
      {
        text: "Describe your approach to debugging a complex production issue.",
        category: "General",
        difficulty: 3,
        weight: 2,
      },
      {
        text: "What is the difference between unit tests and integration tests?",
        category: "Testing",
        difficulty: 1,
        weight: 1,
      },
    ],
  });

  const questions = await prisma.question.findMany();
  console.log(`❓ Created ${questions.length} questions.`);

  // ---------------- APPLICATIONS ----------------
  const applications = [];
  for (let i = 0; i < jobList.length; i++) {
    const job = jobList[i];

    const app1 = await prisma.application.create({
      data: {
        jobId: job.id,
        candidateName: `Candidate ${i + 1}A`,
        email: `candidate${i + 1}a@example.com`,
        phone: "+2348000000000",
        resumeUrl: "",
        stage: Stage.APPLIED,
        status: AppStatus.ACTIVE,
      },
    });

    const app2 = await prisma.application.create({
      data: {
        jobId: job.id,
        candidateName: `Candidate ${i + 1}B`,
        email: `candidate${i + 1}b@example.com`,
        phone: "+2348000000001",
        resumeUrl: "",
        stage: Stage.INTERVIEW,
        status: AppStatus.ACTIVE,
      },
    });

    applications.push(app1, app2);
  }
  console.log(`📄 Created ${applications.length} applications.`);

  // ---------------- INTERVIEWS & ANSWERS ----------------
  for (const app of applications.filter((a) => a.stage === Stage.INTERVIEW)) {
    const interview = await prisma.interview.create({
      data: {
        applicationId: app.id,
        type: InterviewType.WRITTEN,
        durationMins: 45,
        startAt: new Date(),
        endAt: new Date(Date.now() + 45 * 60000),
      },
    });

    // Pick 2 random questions for this interview
    const pickedQuestions = questions
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);

    for (const q of pickedQuestions) {
      await prisma.interviewAnswer.create({
        data: {
          interviewId: interview.id,
          questionId: q.id,
          answer: `Sample answer for question: ${q.text}`,
          score: Math.floor(Math.random() * 5) + 1, // score 1-5
          notes: "Auto-scored for seed data",
        },
      });
    }
  }
  console.log("📝 Created sample interviews with answers.");

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
