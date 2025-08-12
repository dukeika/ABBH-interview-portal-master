import pkg from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding…");

  // Jobs
  const feJob = await prisma.job.upsert({
    where: { id: "job-fe" },
    update: {},
    create: {
      id: "job-fe",
      title: "Frontend Engineer",
      department: "Engineering",
      location: "Remote",
      description: "Build delightful web UI.",
      status: "PUBLISHED",
    },
  });

  const bhcJob = await prisma.job.upsert({
    where: { id: "job-bhc" },
    update: {},
    create: {
      id: "job-bhc",
      title: "Behavioral Health Counselor",
      department: "Clinical",
      location: "Lagos",
      description: "Provide holistic behavioral health support.",
      status: "PUBLISHED",
    },
  });

  // Questions
  const mkQ = (id, job, text, forStage) =>
    prisma.question.upsert({
      where: { id },
      update: {},
      create: {
        id,
        text,
        forStage,
        type: "OPEN",
        job: { connect: { id: job.id } },
      },
    });

  await mkQ("q-fe-1", feJob, "Explain the virtual DOM.", "WRITTEN");
  await mkQ(
    "q-fe-2",
    feJob,
    "How do you optimize React performance?",
    "WRITTEN"
  );
  await mkQ(
    "q-fe-v1",
    feJob,
    "Record a short intro and walk through a UI bug you fixed.",
    "VIDEO"
  );

  await mkQ(
    "q-bhc-1",
    bhcJob,
    "Describe a CBT intervention you’ve used.",
    "WRITTEN"
  );
  await mkQ(
    "q-bhc-2",
    bhcJob,
    "How do you ensure cultural competence?",
    "WRITTEN"
  );
  await mkQ(
    "q-bhc-v1",
    bhcJob,
    "Record a short intro describing your counseling style.",
    "VIDEO"
  );

  // Candidate (login-ready)
  const plain = "Passw0rd!";
  const passwordHash = await bcrypt.hash(plain, 10);

  const candidate = await prisma.candidate.upsert({
    where: { email: "candidate@example.com" },
    update: { name: "Sample Candidate" },
    create: {
      id: "cand-seed-1",
      email: "candidate@example.com",
      name: "Sample Candidate",
      firstName: "Sample",
      lastName: "Candidate",
      passwordHash, // bcrypt hash of Passw0rd!
    },
  });

  // Application
  await prisma.application.upsert({
    where: { id: "app-seed-fe-1" },
    update: {},
    create: {
      id: "app-seed-fe-1",
      stage: "SCREENING",
      status: "ACTIVE",
      candidateName: candidate.name,
      email: candidate.email,
      phone: "0800-000-0000",
      resumeUrl: "https://example.com/resume.pdf",
      coverLetter: "I love building accessible UIs.",
      job: { connect: { id: feJob.id } },
      candidate: { connect: { id: candidate.id } },
    },
  });

  console.log(
    "✅ Seeding done. Candidate login → candidate@example.com / Passw0rd!"
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
