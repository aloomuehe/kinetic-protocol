import { describe, it, expect } from 'vitest';
import { getSchedulesForDate, computeWeeklyMetrics } from '../src/store/selectors';
import type { ScheduleBlock, Task } from '../src/store/types';
import { getWeekDatesISO } from '../src/utils/dates';

describe('Schedules and Tasks Suite', () => {
  const sampleSchedules: ScheduleBlock[] = [
    {
      id: 'sch-daily',
      title: 'Daily Standup',
      date: '2026-10-14',
      startTime: '09:00',
      endTime: '09:30',
      plannedMinutes: 30,
      actualMinutes: 30,
      recurrence: 'daily',
      category: 'Deep Work',
      completed: true
    },
    {
      id: 'sch-weekdays',
      title: 'Sprint Planning',
      date: '2026-10-14',
      startTime: '14:00',
      endTime: '15:00',
      plannedMinutes: 60,
      actualMinutes: 0,
      recurrence: 'weekdays',
      category: 'General',
      completed: false
    },
    {
      id: 'sch-specific',
      title: 'Special Saturday Demo',
      date: '2026-10-17',
      startTime: '10:00',
      endTime: '11:00',
      plannedMinutes: 60,
      actualMinutes: 0,
      recurrence: 'none',
      category: 'General',
      completed: false
    }
  ];

  it('filters and sorts schedules for a weekday (e.g. Wednesday)', () => {
    // 2026-10-14 is a Wednesday
    const wednesday = '2026-10-14';
    const active = getSchedulesForDate(sampleSchedules, wednesday);

    // Daily and Weekdays should match; Specific Saturday should not
    expect(active.length).toBe(2);
    expect(active[0].id).toBe('sch-daily'); // 09:00 comes before 14:00
    expect(active[1].id).toBe('sch-weekdays');
  });

  it('filters and sorts schedules for a weekend (e.g. Saturday)', () => {
    // 2026-10-17 is Saturday
    const saturday = '2026-10-17';
    const active = getSchedulesForDate(sampleSchedules, saturday);

    // Daily matches, Weekdays does NOT match, Specific Saturday matches
    expect(active.length).toBe(2);
    expect(active[0].id).toBe('sch-daily'); // 09:00
    expect(active[1].id).toBe('sch-specific'); // 10:00
  });

  it('computes weekly focus metrics accurately', () => {
    const weekDates = getWeekDatesISO('2026-10-17', true);
    const tasks: Task[] = [
      {
        id: 't1',
        title: 'Task 1',
        dueDate: '2026-10-17',
        status: 'completed',
        priority: 'high',
        category: 'Deep Work'
      },
      {
        id: 't2',
        title: 'Task 2',
        dueDate: '2026-10-17',
        status: 'todo',
        priority: 'medium',
        category: 'General'
      }
    ];

    const metrics = computeWeeklyMetrics(weekDates, sampleSchedules, tasks, [], [], {}, []);
    expect(metrics).toBeDefined();
    expect(metrics.totalTasksCount).toBe(2);
    expect(metrics.completedTasksCount).toBe(1);
    expect(metrics.taskCompletionPct).toBe(50);
    expect(metrics.perDayFocusHours.length).toBe(7);
  });
});
