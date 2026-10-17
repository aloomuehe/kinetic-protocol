/**
 * Date and time helpers designed to prevent timezone-offset shifts by operating
 * on local ISO string dates (YYYY-MM-DD).
 */

export function toLocalISO(date: Date | string = new Date()): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    const year = fallback.getFullYear();
    const month = String(fallback.getMonth() + 1).padStart(2, '0');
    const day = String(fallback.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalISO(isoStr?: string): Date {
  if (!isoStr || typeof isoStr !== 'string') return new Date();
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

export function addDaysISO(isoStr: string, days: number): string {
  const dt = parseLocalISO(isoStr);
  dt.setDate(dt.getDate() + days);
  return toLocalISO(dt);
}

export function getWeekdayMon0(isoStr: string): number {
  const jsDay = parseLocalISO(isoStr).getDay(); // 0 = Sun ... 6 = Sat
  return (jsDay + 6) % 7; // 0 = Mon ... 6 = Sun
}

export function getWeekDatesISO(anchorISO: string, weekStartsOnMonday: boolean = true): string[] {
  const dt = parseLocalISO(anchorISO);
  const jsDay = dt.getDay();
  const offset = weekStartsOnMonday ? (jsDay + 6) % 7 : jsDay;
  const start = new Date(dt);
  start.setDate(dt.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const cur = new Date(start);
    cur.setDate(start.getDate() + i);
    return toLocalISO(cur);
  });
}

export function formatReadableDate(isoStr: string): string {
  const dt = parseLocalISO(isoStr);
  return dt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
