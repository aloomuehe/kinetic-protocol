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
});
