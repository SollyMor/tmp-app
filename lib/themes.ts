export const TASK_THEMES = [
  { id: "study", label: "учеба", color: "#3D5A45" },
  { id: "friends", label: "друзья", color: "#4A5568" },
  { id: "important", label: "важное", color: "#5B3A6E" },
  { id: "work", label: "работа", color: "#6B4F3A" },
  { id: "health", label: "здоровье", color: "#2F6B5E" },
  { id: "home", label: "дом", color: "#6B5A3E" },
  { id: "hobby", label: "хобби", color: "#6B3A52" },
] as const;

export type ThemeId = (typeof TASK_THEMES)[number]["id"];

export function getTheme(themeId: string) {
  return TASK_THEMES.find((theme) => theme.id === themeId) ?? TASK_THEMES[0];
}

export const PRIORITY_COLORS: Record<1 | 2 | 3 | 4, string> = {
  1: "#4CAF50",
  2: "#C47A3A",
  3: "#C62828",
  4: "#F8F6E7",
};

export const TASK_STATUS_COLORS = {
  TODO: "#4A5568",
  IN_PROGRESS: "#3D5A45",
  DONE: "#2F6B5E",
} as const;

export const WEEKDAY_LABELS = [
  "ПОНЕДЕЛЬНИК",
  "ВТОРНИК",
  "СРЕДА",
  "ЧЕТВЕРГ",
  "ПЯТНИЦА",
  "СУББОТА",
  "ВОСКРЕСЕНЬЕ",
] as const;

export const WEEKDAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;
