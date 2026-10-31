/**
 * Date and time helpers designed to prevent timezone-offset shifts by operating
 * on local ISO string dates (YYYY-MM-DD).
 */

export function toLocalISO(date: Date | string = new Date()): string {
  if (typeof date === 'string') {
    const trimmed = date.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      if (year >= 1000 && year <= 9999 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        // Validate calendar days in this month/year (leap year aware)
        const daysInMonth = new Date(year, month, 0).getDate();
        if (day <= daysInMonth) {
          return `${match[1]}-${match[2]}-${match[3]}`;
        }
      }
      // If regex matched but calendar date is invalid (e.g. 2023-02-29 or 2026-04-31),
      // do not return invalid date; fall through to fallback
      const fallback = new Date();
      const y = fallback.getFullYear();
      const m = String(fallback.getMonth() + 1).padStart(2, '0');
      const d = String(fallback.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
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
