import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeTimeDisplay, parseScheduleTime } from "@/lib/schedule";
import { parseDateKey } from "@/lib/tasks";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const meetings = await prisma.dayMeeting.findMany({
    where: {
      userId: session.userId,
      ...(date ? { date } : {}),
    },
    orderBy: [{ date: "asc" }, { sortKey: "asc" }],
  });

  return NextResponse.json({ meetings });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const date = String(body.date ?? "").trim();
    const timeRaw = String(body.time ?? "").trim();
    const title = String(body.title ?? "").trim();
    const room = String(body.room ?? "").trim();
    const color = String(body.color ?? "").trim();

    if (!parseDateKey(date)) {
      return NextResponse.json({ error: "Некорректная дата" }, { status: 400 });
    }

    if (!timeRaw || !title || !room || !color) {
      return NextResponse.json(
        { error: "Заполните время, название, место и цвет" },
        { status: 400 },
      );
    }

    const sortKey = parseScheduleTime(timeRaw);
    if (sortKey === null) {
      return NextResponse.json(
        { error: "Время в формате 9:00-10:50" },
        { status: 400 },
      );
    }

    const meeting = await prisma.dayMeeting.create({
      data: {
        date,
        time: normalizeTimeDisplay(timeRaw),
        sortKey,
        title,
        room,
        color,
        userId: session.userId,
      },
    });

    return NextResponse.json({ meeting }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Не удалось сохранить встречу" },
      { status: 500 },
    );
  }
}
