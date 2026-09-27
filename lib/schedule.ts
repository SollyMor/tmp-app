/** Convert "9:00" / "09:00" / "9.00" to minutes from midnight */
export function parseTimeToMinutes(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** "9:00 - 10:35" → sort key from start time */
export function parseScheduleTime(time: string): number | null {
  const parts = time.split(/\s*[-–—]\s*/);
  if (parts.length < 1) return null;
  return parseTimeToMinutes(parts[0]);
}

export function normalizeTimeDisplay(time: string): string {
  return time
    .split(/\s*[-–—]\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" - ");
}

export function parseTimeRange(time: string): {
  start: number;
  end: number;
} | null {
  const parts = time.split(/\s*[-–—]\s*/).map((part) => part.trim());
  if (parts.length < 1) return null;
  const start = parseTimeToMinutes(parts[0]);
  if (start === null) return null;
  const end =
    parts.length > 1 ? parseTimeToMinutes(parts[1]) : start + 60;
  if (end === null || end <= start) return { start, end: start + 60 };
  return { start, end };
}

/** Hours shown on the timeline ruler: 1:00 .. 23:00 */
export const TIMELINE_START_HOUR = 1;
export const TIMELINE_END_HOUR = 23;
export const TIMELINE_DEFAULT_HOUR = 8;
export const HOUR_HEIGHT_PX = 56;

export function minutesToTop(minutes: number) {
  return ((minutes - TIMELINE_START_HOUR * 60) / 60) * HOUR_HEIGHT_PX;
}

export function durationToHeight(start: number, end: number) {
  return Math.max(((end - start) / 60) * HOUR_HEIGHT_PX, 28);
}

