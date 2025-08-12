import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "candidate@example.com";
  const password = "Candidate@123";
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.candidate.update({ where: { email }, data: { passwordHash } });
  console.log("Password reset for", email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
