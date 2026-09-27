export class ApiClientError extends Error {
  readonly code: string;
  readonly fields: Record<string, string>;

  constructor(code: string, message: string, fields: Record<string, string>) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.fields = fields;
  }
}

type ApiEnvelope<T> = {
  data?: T;
  error?: { code?: string; message?: string; fields?: Record<string, string> };
};

async function parse<T>(response: Response): Promise<T> {
  let envelope: ApiEnvelope<T> = {};
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiClientError("INTERNAL_ERROR", "Сервер ответил неожиданно", {});
  }

  if (!response.ok || envelope.error) {
    throw new ApiClientError(
      envelope.error?.code ?? "INTERNAL_ERROR",
      envelope.error?.message ?? "Что-то сломалось",
      envelope.error?.fields ?? {},
    );
  }

  if (envelope.data === undefined) {
    throw new ApiClientError("INTERNAL_ERROR", "Пустой ответ", {});
  }

  return envelope.data;
}

export async function apiGet<T>(url: string): Promise<T> {
  return parse<T>(await fetch(url, { credentials: "same-origin" }));
}

export async function apiSend<T>(
  url: string,
  method: "POST" | "PATCH",
  body: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return parse<T>(response);
}

export function errorMessage(error: unknown, fallback = "Что-то сломалось") {
  if (error instanceof ApiClientError) return error.message;
  return fallback;
}
