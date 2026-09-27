import { NextResponse } from "next/server";

export const ERROR_STATUS = {
  VALIDATION_ERROR: 400,
  PAYLOAD_TOO_LARGE: 413,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CSRF_ORIGIN: 403,
  NOT_FOUND: 404,
  EMAIL_EXISTS: 409,
  VERSION_CONFLICT: 409,
  JOIN_CODE_INVALID: 409,
  INVALID_ASSIGNEE: 422,
  SUBTASKS_PRESENT: 422,
  INTERNAL_ERROR: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export type FieldErrors = Record<string, string>;

const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "Проверьте заполненные поля",
  PAYLOAD_TOO_LARGE: "Слишком большой запрос",
  UNAUTHORIZED: "Нужен вход",
  FORBIDDEN: "Нет прав на это действие",
  CSRF_ORIGIN: "Запрос отклонён: чужой источник",
  NOT_FOUND: "Не найдено",
  EMAIL_EXISTS: "Такой email уже зарегистрирован",
  VERSION_CONFLICT: "Задачу уже изменили, обновите страницу",
  JOIN_CODE_INVALID: "Код приглашения не подходит",
  INVALID_ASSIGNEE: "Исполнитель не участник пространства",
  SUBTASKS_PRESENT: "Прогресс считается по подзадачам",
  INTERNAL_ERROR: "Что-то сломалось, попробуйте позже",
};

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(code: ErrorCode, message?: string, fields?: FieldErrors) {
  return NextResponse.json(
    {
      error: {
        code,
        message: message ?? DEFAULT_MESSAGES[code],
        fields: fields ?? {},
      },
    },
    { status: ERROR_STATUS[code] },
  );
}

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly fields: FieldErrors;

  constructor(code: ErrorCode, message?: string, fields?: FieldErrors) {
    super(message ?? DEFAULT_MESSAGES[code]);
    this.name = "ApiError";
    this.code = code;
    this.fields = fields ?? {};
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return fail(error.code, error.message, error.fields);
  }
  console.error(error);
  return fail("INTERNAL_ERROR");
}

const MAX_BODY_BYTES = 64 * 1024;

export async function readJson(
  request: Request,
): Promise<Record<string, unknown>> {
  const declared = request.headers.get("content-length");
  if (declared && Number(declared) > MAX_BODY_BYTES) {
    throw new ApiError("PAYLOAD_TOO_LARGE");
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    throw new ApiError("PAYLOAD_TOO_LARGE");
  }
  if (!raw.trim()) return {};

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new ApiError("VALIDATION_ERROR", "Ожидается JSON-объект");
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("VALIDATION_ERROR", "Некорректный JSON");
  }
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function assertSameOrigin(request: Request) {
  if (SAFE_METHODS.has(request.method)) return;

  const origin = request.headers.get("origin");
  if (!origin) return;

  const host = request.headers.get("host");
  try {
    if (new URL(origin).host !== host) {
      throw new ApiError("CSRF_ORIGIN");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("CSRF_ORIGIN");
  }
}
