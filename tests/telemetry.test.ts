import { describe, it, expect } from 'vitest';
import { computeTelemetryAnalytics } from '../src/features/statistics/analytics';
import { createStarterWorkspace } from '../src/store/starterData';
import type { KineticStore } from '../src/store/types';

describe('Telemetry & Analytics Suite', () => {
  const today = '2026-10-17';
  const starter = createStarterWorkspace(today);

  it('computes daily telemetry breakdown correctly (7 trailing days)', () => {
    const result = computeTelemetryAnalytics(starter, today, today, 'daily');
    expect(result).toBeDefined();
    expect(result.points.length).toBe(7);
    expect(result.points[6].isCurrent).toBe(true);
    expect(result.allocationRows.length).toBeGreaterThan(0);
  });

  it('computes weekly telemetry points correctly (6 trailing weeks)', () => {
    const result = computeTelemetryAnalytics(starter, today, today, 'weekly');
    expect(result.points.length).toBe(6);
    const currentWeekPoint = result.points.find((p) => p.isCurrent);
    expect(currentWeekPoint).toBeDefined();
  });

  it('computes monthly telemetry points correctly (6 trailing months)', () => {
    const result = computeTelemetryAnalytics(starter, today, today, 'monthly');
    expect(result.points.length).toBe(6);
    const currentMonthPoint = result.points.find((p) => p.isCurrent);
    expect(currentMonthPoint).toBeDefined();
  });

  it('derives category allocation breakdown with non-negative percentages', () => {
    const result = computeTelemetryAnalytics(starter, today, today, 'weekly');
    expect(Array.isArray(result.allocationRows)).toBe(true);
    let sumPct = 0;
    for (const cat of result.allocationRows) {
      expect(cat.pct).toBeGreaterThanOrEqual(0);
      expect(cat.pct).toBeLessThanOrEqual(100);
      sumPct += cat.pct;
    }
    if (result.allocationRows.length > 0) {
      expect(Math.round(sumPct)).toBe(100);
    }
  });

  it('aggregates strictly single selected day for daily focus allocation without 7-day accumulation', () => {
    const result = computeTelemetryAnalytics(starter, today, today, 'daily');
    // Daily allocation should be a single-day total (410 minutes = 6h 50m), far below 63h 20m (3800 mins)
    expect(result.totalAllocatedMins).toBeLessThan(1440); // must be < 24 hours
    expect(result.totalAllocatedMins).toBe(410);
  });

  it('synchronizes telemetry maxStreak with active habit current streaks', () => {
    const result = computeTelemetryAnalytics(starter, today, today, 'daily');
    // Top active streak in starter data is 6 (Math/Code), not the habit target of 7
    expect(result.maxStreak).toBe(6);
  });

  it('deduplicates task time when task is linked to schedule block on that day', () => {
    const dailyResult = computeTelemetryAnalytics(starter, today, today, 'daily');
    // task-1 is linked to sch-1. Both are Code category.
    // sch-1: 115m. hab-code: 25m. Total Code = 140m (not 140 + 25 = 165m).
    const codeRow = dailyResult.allocationRows.find((r) => r.category === 'Code');
    expect(codeRow?.minutes).toBe(140);
  });

  describe('Linked Task Deduplication & Focus Contribution Matrix', () => {
    const testDate = '2026-10-20';

    it('Scenario 1: Completed linked schedule + completed task deduplicates task time', () => {
      const mockStore: KineticStore = {
        ...starter,
        schedules: [
          {
            id: 'sch-c',
            title: 'Completed Block',
            date: testDate,
            startTime: '09:00',
            endTime: '10:00',
            plannedMinutes: 60,
            actualMinutes: 60,
            category: 'Code',
            completed: true,
            recurrence: 'none',
            linkedTaskId: 'task-c'
          }
        ],
        tasks: [
          {
            id: 'task-c',
            title: 'Linked Task',
            dueDate: testDate,
            status: 'completed',
            priority: 'high',
            category: 'Code'
          }
        ],
        habits: [],
        habitEntries: {}
      };

      const result = computeTelemetryAnalytics(mockStore, testDate, testDate, 'daily');
      // Schedule contributes 60m. Task is deduplicated (does not add 25m).
      expect(result.totalAllocatedMins).toBe(60);
      const codeRow = result.allocationRows.find((r) => r.category === 'Code');
      expect(codeRow?.minutes).toBe(60);
      expect(result.points[6].sessionsCount).toBe(1);
    });

    it('Scenario 2: Incomplete linked schedule + completed task preserves independent task focus', () => {
      const mockStore: KineticStore = {
        ...starter,
        schedules: [
          {
            id: 'sch-inc',
            title: 'Incomplete Block',
            date: testDate,
            startTime: '09:00',
            endTime: '10:00',
            plannedMinutes: 60,
            actualMinutes: 0,
            category: 'Code',
            completed: false,
            recurrence: 'none',
            linkedTaskId: 'task-inc'
          }
        ],
        tasks: [
          {
            id: 'task-inc',
            title: 'Independently Completed Task',
            dueDate: testDate,
            status: 'completed',
            priority: 'high',
            category: 'Code'
          }
        ],
        habits: [],
        habitEntries: {}
      };

      const result = computeTelemetryAnalytics(mockStore, testDate, testDate, 'daily');
      // Schedule contributed 0m, so it must not suppress the task. Task contributes 25m.
      expect(result.totalAllocatedMins).toBe(25);
      const codeRow = result.allocationRows.find((r) => r.category === 'Code');
      expect(codeRow?.minutes).toBe(25);
      expect(result.points[6].sessionsCount).toBe(1);
    });

    it('Scenario 3: Tracked linked schedule + completed task deduplicates task time', () => {
      const mockStore: KineticStore = {
        ...starter,
        schedules: [
          {
            id: 'sch-trk',
            title: 'Tracked Partial Block',
            date: testDate,
            startTime: '10:00',
            endTime: '11:00',
            plannedMinutes: 60,
            actualMinutes: 45,
            category: 'Math',
            completed: false,
            recurrence: 'none',
            linkedTaskId: 'task-trk'
          }
        ],
        tasks: [
          {
            id: 'task-trk',
            title: 'Task Tracked in Block',
            dueDate: testDate,
            status: 'completed',
            priority: 'high',
            category: 'Math'
          }
        ],
        habits: [],
        habitEntries: {}
      };

      const result = computeTelemetryAnalytics(mockStore, testDate, testDate, 'daily');
      // Schedule contributed 45m. Task is deduplicated.
      expect(result.totalAllocatedMins).toBe(45);
      const mathRow = result.allocationRows.find((r) => r.category === 'Math');
      expect(mathRow?.minutes).toBe(45);
      expect(result.points[6].sessionsCount).toBe(1);
    });

    it('Scenario 4: Completed standalone task without a schedule contributes focus correctly', () => {
      const mockStore: KineticStore = {
        ...starter,
        schedules: [],
        tasks: [
          {
            id: 'task-standalone',
            title: 'Standalone Task',
            dueDate: testDate,
            status: 'completed',
            priority: 'medium',
            category: 'Quant'
          }
        ],
        habits: [],
        habitEntries: {}
      };

      const result = computeTelemetryAnalytics(mockStore, testDate, testDate, 'daily');
      expect(result.totalAllocatedMins).toBe(25);
      const quantRow = result.allocationRows.find((r) => r.category === 'Quant');
      expect(quantRow?.minutes).toBe(25);
      expect(result.points[6].sessionsCount).toBe(1);
    });
  });

  describe('Recurring Schedules in Multi-Day Telemetry', () => {
    it('does not duplicate actual minutes of a recurring schedule block across multiple days in weekly view', () => {
      const selectedMonday = '2026-10-12';
      const mockStore: KineticStore = {
        ...starter,
        schedules: [
          {
            id: 'sch-daily-test',
            title: 'Daily Standup',
            date: '2026-10-12', // Monday
            startTime: '09:00',
            endTime: '10:00',
            plannedMinutes: 60,
            actualMinutes: 60,
            category: 'General',
            recurrence: 'daily',
            completed: true
          }
        ],
        tasks: [],
        habits: [],
        habitEntries: {}
      };

      const weeklyResult = computeTelemetryAnalytics(mockStore, selectedMonday, '2026-10-18', 'weekly');
      // Actual execution should ONLY count once (60 mins), not 7x (420 mins)
      expect(weeklyResult.totalAllocatedMins).toBe(60);
      const generalRow = weeklyResult.allocationRows.find((r) => r.category === 'General');
      expect(generalRow?.minutes).toBe(60);
    });
  });
});
