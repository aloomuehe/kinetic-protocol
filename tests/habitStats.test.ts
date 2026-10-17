import { describe, it, expect } from 'vitest';
import {
  isHabitScheduledOnDate,
  isEntrySatisfied,
  computeHabitStats
} from '../src/features/habits/habitCalculations';
import type { Habit, HabitEntry } from '../src/store/types';

describe('Habit Calculations & Streak Logic', () => {
  const dailyHabit: Habit = {
    id: 'hab-test-daily',
    title: 'Daily Coding',
    description: 'Write code every day',
    category: 'Code',
    trackingType: 'duration',
    targetValue: 60,
    minViableValue: 30,
    unit: 'min',
    schedule: { type: 'daily', weekdays: [0, 1, 2, 3, 4, 5, 6], weeklyTarget: 7 },
    startDate: '2026-10-01',
    archivedAt: null
  };

  const weekdayHabit: Habit = {
    id: 'hab-test-wd',
    title: 'Work Sprint',
    description: 'Monday to Friday focus',
    category: 'Deep Work',
    trackingType: 'binary',
    targetValue: 1,
    minViableValue: 1,
    unit: 'session',
    schedule: { type: 'weekdays', weekdays: [0, 1, 2, 3, 4], weeklyTarget: 5 }, // Mon-Fri
    startDate: '2026-10-01',
    archivedAt: null
  };

  it('determines if habit is scheduled on a given date correctly', () => {
    // 2026-10-17 is Saturday (Mon=0..Sat=5)
    expect(isHabitScheduledOnDate(dailyHabit, '2026-10-17')).toBe(true);
    expect(isHabitScheduledOnDate(weekdayHabit, '2026-10-17')).toBe(false);
    // 2026-10-16 is Friday (wd=4)
    expect(isHabitScheduledOnDate(weekdayHabit, '2026-10-16')).toBe(true);
  });

  it('evaluates entry satisfaction for full completion and MVD', () => {
    expect(isEntrySatisfied(dailyHabit, null)).toBe(false);
    expect(isEntrySatisfied(dailyHabit, { id: '1', habitId: 'h1', date: '2026-10-17', value: 60, status: 'completed' })).toBe(true);
    expect(isEntrySatisfied(dailyHabit, { id: '2', habitId: 'h1', date: '2026-10-17', value: 30, status: 'mvd' })).toBe(true);
    expect(isEntrySatisfied(dailyHabit, { id: '3', habitId: 'h1', date: '2026-10-17', value: 10, status: 'partial' })).toBe(false);
  });

  it('computes current streak and longest streak across consecutive days', () => {
    const todayISO = '2026-10-17';
    const entriesMap: Record<string, Record<string, HabitEntry>> = {
      [dailyHabit.id]: {
        '2026-10-15': { id: 'e1', habitId: dailyHabit.id, date: '2026-10-15', value: 60, status: 'completed' },
        '2026-10-16': { id: 'e2', habitId: dailyHabit.id, date: '2026-10-16', value: 60, status: 'completed' },
        '2026-10-17': { id: 'e3', habitId: dailyHabit.id, date: '2026-10-17', value: 60, status: 'completed' }
      }
    };

    const stats = computeHabitStats(dailyHabit, entriesMap, todayISO);
    expect(stats.currentStreak).toBe(3);
    expect(stats.longestStreak).toBe(3);
    expect(stats.todayDone).toBe(true);
  });

  it('does not break streaks on unscheduled rest days for weekday habits', () => {
    const todayISO = '2026-10-19'; // Monday (Oct 19)
    // Completed Thursday (Oct 15) and Friday (Oct 16). Sat (17) & Sun (18) are rest days!
    const entriesMap: Record<string, Record<string, HabitEntry>> = {
      [weekdayHabit.id]: {
        '2026-10-15': { id: 'e1', habitId: weekdayHabit.id, date: '2026-10-15', value: 1, status: 'completed' },
        '2026-10-16': { id: 'e2', habitId: weekdayHabit.id, date: '2026-10-16', value: 1, status: 'completed' },
        '2026-10-19': { id: 'e3', habitId: weekdayHabit.id, date: '2026-10-19', value: 1, status: 'completed' }
      }
    };

    const stats = computeHabitStats(weekdayHabit, entriesMap, todayISO);
    expect(stats.currentStreak).toBe(3); // 3 scheduled days satisfied with weekend rest preserved
  });
});
