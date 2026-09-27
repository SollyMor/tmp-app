import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeTimeDisplay, parseScheduleTime } from "@/lib/schedule";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  const items = await prisma.scheduleItem.findMany({
    where: { userId: session.userId },
    orderBy: [{ weekday: "asc" }, { sortKey: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const timeRaw = String(body.time ?? "").trim();
    const title = String(body.title ?? "").trim();
    const room = String(body.room ?? "").trim();
    const color = String(body.color ?? "").trim();
    const weekday = Number(body.weekday ?? 0);

    if (!timeRaw || !title || !room || !color) {
      return NextResponse.json(
        { error: "Заполните время, предмет, кабинет и цвет" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      return NextResponse.json(
        { error: "Выберите день недели" },
        { status: 400 },
      );
    }

    const sortKey = parseScheduleTime(timeRaw);
    if (sortKey === null) {
      return NextResponse.json(
        { error: "Время в формате 9:00 - 10:35" },
        { status: 400 },
      );
    }

    const item = await prisma.scheduleItem.create({
      data: {
        time: normalizeTimeDisplay(timeRaw),
        sortKey,
        title,
        room,
        color,
        weekday,
        userId: session.userId,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Не удалось сохранить предмет" },
      { status: 500 },
    );
  }
}
