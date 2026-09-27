/** Local calendar day as YYYY-MM-DD */
export function toDateKey(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string) {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function formatDateShort(dateKey: string) {
  const date = parseDateKey(dateKey);
  if (!date) return dateKey;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

const MONTHS_GENITIVE_LOWER = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

export function formatDayMonth(dateKey: string) {
  const date = parseDateKey(dateKey);
  if (!date) return dateKey;
  return `${date.getDate()} ${MONTHS_GENITIVE_LOWER[date.getMonth()]}`;
}

export function formatTaskDeadline(startDate: string, endDate: string) {
  if (startDate === endDate) return formatDateShort(startDate);
  return `${formatDateShort(startDate)}-${formatDateShort(endDate)}`;
}

/** Сюжетные на день: срок = этот день */
export function isStoryTask(
  _startDate: string,
  endDate: string,
  dayKey: string = toDateKey(),
) {
  return endDate === dayKey;
}

/** Просрочка: не выполнена и срок уже прошёл относительно дня */
export function isOverdueTask(
  endDate: string,
  completed: boolean,
  dayKey: string = toDateKey(),
) {
  return !completed && endDate < dayKey;
}

export function addDays(dateKey: string, days: number) {
  const date = parseDateKey(dateKey);
  if (!date) return dateKey;
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Monday-first weekday index 0..6 */
export function getWeekdayIndex(dateKey: string) {
  const date = parseDateKey(dateKey);
  if (!date) return 0;
  return (date.getDay() + 6) % 7;
}

/** 7 date keys for the week containing anchor (Mon..Sun) */
export function getWeekDateKeys(anchor: Date = new Date()) {
  const start = new Date(anchor);
  const weekday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - weekday);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return toDateKey(date);
  });
}

export type TaskLike = {
  id: string;
  startDate: string;
  endDate: string;
  priority: number;
  completed: boolean;
};

/** Tasks for a day: overdue first (as p4), then due that day */
export function getTasksForDay<T extends TaskLike>(tasks: T[], dayKey: string) {
  const overdue = tasks.filter((task) =>
    isOverdueTask(task.endDate, task.completed, dayKey),
  );
  const due = tasks.filter((task) => isStoryTask(task.startDate, task.endDate, dayKey));
  return { overdue, due };
}

export function displayPriority(
  task: { priority: number; endDate: string; completed: boolean },
  dayKey: string,
) {
  return isOverdueTask(task.endDate, task.completed, dayKey) ? 4 : task.priority;
}

const MONTHS_UPPER = [
  "ЯНВАРЯ",
  "ФЕВРАЛЯ",
  "МАРТА",
  "АПРЕЛЯ",
  "МАЯ",
  "ИЮНЯ",
  "ИЮЛЯ",
  "АВГУСТА",
  "СЕНТЯБРЯ",
  "ОКТЯБРЯ",
  "НОЯБРЯ",
  "ДЕКАБРЯ",
];

export function formatDateTitle(dateKey: string) {
  const date = parseDateKey(dateKey);
  if (!date) return dateKey;
  return `${date.getDate()} ${MONTHS_UPPER[date.getMonth()]}`;
}

