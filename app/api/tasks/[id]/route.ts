import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDateKey } from "@/lib/tasks";
import { TASK_THEMES } from "@/lib/themes";

type Params = { params: Promise<{ id: string }> };

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

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.task.findFirst({
    where: { id, userId: session.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const data: {
      title?: string;
      description?: string;
      time?: string;
      startDate?: string;
      endDate?: string;
      priority?: number;
      themeId?: string;
      completed?: boolean;
    } = {};

    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) {
        return NextResponse.json({ error: "Введите задание" }, { status: 400 });
      }
      data.title = title;
    }

    if (body.description !== undefined) {
      data.description = String(body.description).trim();
    }

    if (body.time !== undefined) {
      data.time = String(body.time).trim();
    }

    if (body.priority !== undefined) {
      const priority = Number(body.priority);
      if (![1, 2, 3].includes(priority)) {
        return NextResponse.json(
          { error: "Важность должна быть от 1 до 3" },
          { status: 400 },
        );
      }
      data.priority = priority;
    }

    if (body.themeId !== undefined) {
      const themeId = String(body.themeId).trim();
      if (!TASK_THEMES.some((theme) => theme.id === themeId)) {
        return NextResponse.json({ error: "Неизвестная тема" }, { status: 400 });
      }
      data.themeId = themeId;
    }

    if (body.completed !== undefined) {
      data.completed = Boolean(body.completed);
    }

    if (body.startDate !== undefined || body.endDate !== undefined) {
      const range = normalizeRange(
        body.startDate ?? existing.startDate,
        body.endDate ?? existing.endDate,
      );
      if ("error" in range) {
        return NextResponse.json({ error: range.error }, { status: 400 });
      }
      data.startDate = range.startDate;
      data.endDate = range.endDate;
    }

    const task = await prisma.task.update({
      where: { id },
      data,
    });

    return NextResponse.json({ task });
  } catch {
    return NextResponse.json(
      { error: "Не удалось обновить задачу" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.task.findFirst({
    where: { id, userId: session.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
