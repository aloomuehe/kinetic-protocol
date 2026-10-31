import { describe, it, expect } from 'vitest';
import {
  toLocalISO,
  parseLocalISO,
  addDaysISO,
  getWeekdayMon0,
  getWeekDatesISO,
  formatReadableDate
} from '../src/utils/dates';

describe('Date Utilities (Local ISO)', () => {
  it('converts Date objects to YYYY-MM-DD local format without timezone skew', () => {
    const d = new Date(2026, 9, 17); // October 17, 2026
    expect(toLocalISO(d)).toBe('2026-10-17');
  });

  it('correctly parses local ISO strings into noon Date objects', () => {
    const dt = parseLocalISO('2026-10-17');
    expect(dt.getFullYear()).toBe(2026);
    expect(dt.getMonth()).toBe(9); // 0-indexed: October
    expect(dt.getDate()).toBe(17);
    expect(dt.getHours()).toBe(12);
  });

  it('adds and subtracts days correctly across month boundaries', () => {
    expect(addDaysISO('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDaysISO('2026-11-01', -1)).toBe('2026-10-31');
    expect(addDaysISO('2026-02-28', 1)).toBe('2026-03-01');
  });

  it('calculates 0-indexed Monday weekdays correctly (Mon=0, Sun=6)', () => {
    // 2026-10-12 is Monday, 2026-10-17 is Saturday, 2026-10-18 is Sunday
    expect(getWeekdayMon0('2026-10-12')).toBe(0);
    expect(getWeekdayMon0('2026-10-17')).toBe(5);
    expect(getWeekdayMon0('2026-10-18')).toBe(6);
  });

  it('generates 7-day week ISO sequences aligned to Monday', () => {
    const week = getWeekDatesISO('2026-10-17', true); // Saturday in week of Oct 12-18
    expect(week).toHaveLength(7);
    expect(week[0]).toBe('2026-10-12'); // Monday
    expect(week[5]).toBe('2026-10-17'); // Saturday
    expect(week[6]).toBe('2026-10-18'); // Sunday
  });

  it('formats dates in human-readable US format', () => {
    const formatted = formatReadableDate('2026-10-17');
    expect(formatted).toContain('Oct 17, 2026');
  });

  it('safely preserves date-only ISO strings without UTC midnight shifts', () => {
    expect(toLocalISO('2026-10-17')).toBe('2026-10-17');
    expect(toLocalISO(' 2026-10-31 ')).toBe('2026-10-31');
  });

  describe('Date Validation Matrix', () => {
    const today = toLocalISO(new Date());

    it('validates ordinary valid dates', () => {
      expect(toLocalISO('2026-10-17')).toBe('2026-10-17');
      expect(toLocalISO('2025-01-01')).toBe('2025-01-01');
    });

    it('validates leap date in a leap year', () => {
      expect(toLocalISO('2024-02-29')).toBe('2024-02-29');
    });

    it('rejects invalid leap date in a non-leap year and falls back safely', () => {
      expect(toLocalISO('2023-02-29')).toBe(today);
    });

    it('rejects invalid day, month, and year values', () => {
      expect(toLocalISO('2026-04-31')).toBe(today); // April has 30 days
      expect(toLocalISO('2026-13-10')).toBe(today); // Invalid month 13
      expect(toLocalISO('2026-00-10')).toBe(today); // Invalid month 00
      expect(toLocalISO('2026-05-32')).toBe(today); // Invalid day 32
      expect(toLocalISO('0999-01-01')).toBe(today); // Year < 1000
    });

    it('handles whitespace around valid date-only strings', () => {
      expect(toLocalISO('   2026-10-31   ')).toBe('2026-10-31');
    });

    it('handles ISO timestamp strings with local date conversion', () => {
      const parsed = toLocalISO('2026-10-17T12:00:00Z');
      expect(parsed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('handles malformed and non-date strings gracefully', () => {
      expect(toLocalISO('not-a-date')).toBe(today);
      expect(toLocalISO('')).toBe(today);
      expect(toLocalISO('abcd-ef-gh')).toBe(today);
    });
  });
});
