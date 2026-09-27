import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDateKey } from "@/lib/tasks";
import { TASK_THEMES } from "@/lib/themes";

function normalizeRange(startRaw: string, endRaw?: string) {
  const startDate = String(startRaw ?? "").trim();
  const endDate = String(endRaw ?? startRaw ?? "").trim() || startDate;

  if (!parseDateKey(startDate) || !parseDateKey(endDate)) {
    return { error: "Некорректная дата" as const };
  }

  if (endDate < startDate) {
    return { error: "Конец срока раньше начала" as const };
  }

  return { startDate, endDate };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: { userId: session.userId },
    orderBy: [{ startDate: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const time = String(body.time ?? "").trim();
    const priority = Number(body.priority);
    const themeId = String(body.themeId ?? "").trim();
    const range = normalizeRange(body.startDate, body.endDate);

    if (!title) {
      return NextResponse.json({ error: "Введите задание" }, { status: 400 });
    }

    if (![1, 2, 3].includes(priority)) {
      return NextResponse.json(
        { error: "Важность должна быть от 1 до 3" },
        { status: 400 },
      );
    }

    if (!TASK_THEMES.some((theme) => theme.id === themeId)) {
      return NextResponse.json({ error: "Неизвестная тема" }, { status: 400 });
    }

    if ("error" in range) {
      return NextResponse.json({ error: range.error }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        time,
        startDate: range.startDate,
        endDate: range.endDate,
        priority,
        themeId,
        userId: session.userId,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Не удалось создать задачу" },
      { status: 500 },
    );
  }
}
