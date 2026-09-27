import { ApiError, type FieldErrors } from "@/lib/api";

export class Fields {
  private readonly errors: FieldErrors = {};

  private reject(name: string, message: string) {
    if (!this.errors[name]) this.errors[name] = message;
  }

  get invalid() {
    return Object.keys(this.errors).length > 0;
  }

  throwIfInvalid() {
    if (this.invalid) {
      throw new ApiError("VALIDATION_ERROR", undefined, this.errors);
    }
  }

  text(value: unknown, name: string, options?: { max?: number; label?: string }) {
    const label = options?.label ?? "Поле";
    const max = options?.max ?? 200;

    if (typeof value !== "string") {
      this.reject(name, `${label} обязательно`);
      return "";
    }
    const trimmed = value.trim();
    if (!trimmed) {
      this.reject(name, `${label} обязательно`);
      return "";
    }
    if (trimmed.length > max) {
      this.reject(name, `${label}: не больше ${max} символов`);
      return trimmed.slice(0, max);
    }
    return trimmed;
  }

  optionalText(value: unknown, name: string, options?: { max?: number }) {
    const max = options?.max ?? 2000;
    if (value === undefined || value === null) return "";
    if (typeof value !== "string") {
      this.reject(name, "Ожидается текст");
      return "";
    }
    const trimmed = value.trim();
    if (trimmed.length > max) {
      this.reject(name, `Не больше ${max} символов`);
      return trimmed.slice(0, max);
    }
    return trimmed;
  }

  dateTime(value: unknown, name: string, label = "Дата") {
    if (typeof value !== "string" || !value.trim()) {
      this.reject(name, `${label} обязательна`);
      return new Date(0);
    }
    const parsed = new Date(value.trim());
    if (Number.isNaN(parsed.getTime())) {
      this.reject(name, `${label} указана неверно`);
      return new Date(0);
    }
    return parsed;
  }

  int(
    value: unknown,
    name: string,
    options: { min: number; max: number; label?: string },
  ) {
    const label = options.label ?? "Число";
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isInteger(parsed)) {
      this.reject(name, `${label}: нужно целое число`);
      return options.min;
    }
    if (parsed < options.min || parsed > options.max) {
      this.reject(name, `${label}: от ${options.min} до ${options.max}`);
      return options.min;
    }
    return parsed;
  }

  oneOf<T extends string>(
    value: unknown,
    name: string,
    allowed: readonly T[],
    fallback: T,
  ): T {
    if (typeof value === "string" && allowed.includes(value as T)) {
      return value as T;
    }
    this.reject(name, `Допустимые значения: ${allowed.join(", ")}`);
    return fallback;
  }

  id(value: unknown, name: string, label = "Идентификатор") {
    if (typeof value !== "string" || !value.trim()) {
      this.reject(name, `${label} обязателен`);
      return "";
    }
    return value.trim();
  }
}
