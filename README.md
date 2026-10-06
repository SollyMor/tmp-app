# KZR 

Next.js-приложение с авторизацией, расписанием и задачами (Prisma + PostgreSQL).

## Локальный запуск

1. Скопируй `.env.example` → `.env` и заполни `DATABASE_URL` (PostgreSQL) и `AUTH_SECRET`.
2. Установи зависимости и примени миграции:

```bash
npm install
npx prisma migrate deploy
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000).

## Деплой на Vercel

Пошаговая инструкция: [DEPLOY.md](./DEPLOY.md).

Кратко: нужна Postgres-база (Neon / Vercel Postgres), в Vercel задай `DATABASE_URL` и `AUTH_SECRET`, подключи GitHub-репозиторий и задеплой.
