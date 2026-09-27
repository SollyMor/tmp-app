import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nick = String(body.nick ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!nick || !email || !password) {
      return NextResponse.json(
        { error: "Заполните ник, email и пароль" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Пароль должен быть не короче 6 символов" },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже есть" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { nick, email, passwordHash },
    });

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      nick: user.nick,
    });

    return NextResponse.json({
      ok: true,
      user: { id: user.id, nick: user.nick, email: user.email },
    });
  } catch {
    return NextResponse.json(
      { error: "Не удалось зарегистрироваться" },
      { status: 500 },
    );
  }
}
