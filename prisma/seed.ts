import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@taskflow.app";
  const password = "TaskFlow123";
  const nick = "Sonia";

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { nick, passwordHash },
    create: { email, nick, passwordHash },
  });

  console.log("Seed user ready:");
  console.log(`  email: ${email}`);
  console.log(`  password: ${password}`);
  console.log(`  nick: ${nick}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
