import "dotenv/config";
import { isMailConfigured } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { runReminderTick } from "@/lib/worker";

/** Локальный воркер: тот же тик, что и cron-роут, раз в минуту. */

const TICK_MS = 60_000;

async function tick() {
  try {
    const report = await runReminderTick();
    if (Object.values(report).some((value) => value > 0)) {
      console.log(new Date().toISOString(), report);
    }
  } catch (error) {
    console.error(error);
  }
}

async function main() {
  if (!isMailConfigured()) {
    console.error(
      "Почта не настроена. Задайте SMTP_HOST, SMTP_PORT, MAIL_FROM или MAIL_TRANSPORT=console.",
    );
    process.exit(1);
  }

  console.log("Воркер напоминаний запущен, тик раз в минуту.");
  await tick();
  const timer = setInterval(() => void tick(), TICK_MS);

  const stop = async () => {
    clearInterval(timer);
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => void stop());
  process.on("SIGTERM", () => void stop());
}

void main();
