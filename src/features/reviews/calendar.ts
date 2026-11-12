import { z } from "zod";

export function resolveJournalDate(value: unknown, today: string): string {
  const result = z.iso.date().safeParse(value);
  return result.success && result.data >= "0001-01-01" ? result.data : today;
}
function utcDate(value: string) {
  return new Date(value + "T12:00:00Z");
}
function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
export function monthRange(date: string): { start: string; end: string } {
  const end = utcDate(date);
  end.setUTCMonth(end.getUTCMonth() + 1, 0);
  return { start: date.slice(0, 7) + "-01", end: isoDate(end) };
}
export function monthDays(date: string): (string | null)[] {
  const { start, end } = monthRange(date);
  const first = utcDate(start).getUTCDay();
  const count = Number(end.slice(8));
  return Array.from({ length: Math.ceil((first + count) / 7) * 7 }, (_, i) => {
    const day = i - first + 1;
    return day > 0 && day <= count
      ? start.slice(0, 8) + String(day).padStart(2, "0")
      : null;
  });
}
export function shiftMonth(date: string, delta: number): string {
  const next = utcDate(date);
  const day = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + delta);
  if (next.getUTCFullYear() < 1 || next.getUTCFullYear() > 9999) return date;
  const last = Number(monthRange(isoDate(next)).end.slice(8));
  next.setUTCDate(Math.min(day, last));
  // Navigation cannot leave the four-digit Gregorian date range.
  return next.getUTCFullYear() < 1 || next.getUTCFullYear() > 9999
    ? date
    : isoDate(next);
}
export function journalHref(
  date: string,
  extra: Record<string, string> = {},
): string {
  return "/me/records?" + new URLSearchParams({ date, ...extra });
}
