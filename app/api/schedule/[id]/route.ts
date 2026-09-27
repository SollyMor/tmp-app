import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.scheduleItem.findFirst({
    where: { id, userId: session.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  await prisma.scheduleItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
