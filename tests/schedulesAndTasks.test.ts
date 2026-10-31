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

  it('filters task completion rate to tasks relevant to the selected week', () => {
    const weekDates = getWeekDatesISO('2026-10-17', true); // Oct 12 - 18
    const tasks: Task[] = [
      { id: 't1', title: 'Task this week', dueDate: '2026-10-15', status: 'completed', priority: 'high', category: 'Code' },
      { id: 't2', title: 'Task next month', dueDate: '2026-11-20', status: 'todo', priority: 'low', category: 'Code' },
      { id: 't3', title: 'Task last month', dueDate: '2026-09-01', status: 'todo', priority: 'low', category: 'Code' }
    ];

    const metrics = computeWeeklyMetrics(weekDates, [], tasks, [], [], {}, []);
    // Only t1 is due in this week; t2 and t3 should not drag down this week's completion rate
    expect(metrics.totalTasksCount).toBe(1);
    expect(metrics.completedTasksCount).toBe(1);
    expect(metrics.taskCompletionPct).toBe(100);
  });

  describe('Weekly Task Completion Scenarios', () => {
    const weekDates = getWeekDatesISO('2026-10-17', true); // Oct 12 - 18, 2026

    it('Scenario 1: No tasks due in the selected week yields zero relevant tasks (no backlog substitution)', () => {
      const tasks: Task[] = [];
      const metrics = computeWeeklyMetrics(weekDates, [], tasks, [], [], {}, []);
      expect(metrics.totalTasksCount).toBe(0);
      expect(metrics.completedTasksCount).toBe(0);
      expect(metrics.taskCompletionPct).toBe(0);
    });

    it('Scenario 2: Only future tasks outside the selected week do not affect current week metrics', () => {
      const tasks: Task[] = [
        { id: 'f1', title: 'Future task 1', dueDate: '2026-10-25', status: 'completed', priority: 'medium', category: 'Code' },
        { id: 'f2', title: 'Future task 2', dueDate: '2026-11-01', status: 'todo', priority: 'low', category: 'Math' }
      ];
      const metrics = computeWeeklyMetrics(weekDates, [], tasks, [], [], {}, []);
      expect(metrics.totalTasksCount).toBe(0);
      expect(metrics.completedTasksCount).toBe(0);
      expect(metrics.taskCompletionPct).toBe(0);
    });

    it('Scenario 3: Only past tasks outside the selected week do not affect current week metrics', () => {
      const tasks: Task[] = [
        { id: 'p1', title: 'Past task 1', dueDate: '2026-09-15', status: 'todo', priority: 'high', category: 'Code' },
        { id: 'p2', title: 'Past task 2', dueDate: '2026-10-01', status: 'todo', priority: 'low', category: 'Quant' }
      ];
      const metrics = computeWeeklyMetrics(weekDates, [], tasks, [], [], {}, []);
      expect(metrics.totalTasksCount).toBe(0);
      expect(metrics.completedTasksCount).toBe(0);
      expect(metrics.taskCompletionPct).toBe(0);
    });

    it('Scenario 4: A mix of current-week and unrelated tasks accurately isolates current-week completion', () => {
      const tasks: Task[] = [
        { id: 'cw1', title: 'In-week Done', dueDate: '2026-10-14', status: 'completed', priority: 'high', category: 'Code' },
        { id: 'cw2', title: 'In-week Todo', dueDate: '2026-10-16', status: 'todo', priority: 'medium', category: 'Math' },
        { id: 'past', title: 'Past Todo', dueDate: '2026-10-05', status: 'todo', priority: 'low', category: 'General' },
        { id: 'future', title: 'Future Done', dueDate: '2026-10-22', status: 'completed', priority: 'low', category: 'Fitness' }
      ];
      const metrics = computeWeeklyMetrics(weekDates, [], tasks, [], [], {}, []);
      expect(metrics.totalTasksCount).toBe(2);
      expect(metrics.completedTasksCount).toBe(1);
      expect(metrics.taskCompletionPct).toBe(50);
    });

    it('Scenario 5: Floating tasks without due dates are treated as general backlog and do not penalize weekly rate', () => {
      const tasks: Task[] = [
        { id: 'cw1', title: 'In-week Done', dueDate: '2026-10-15', status: 'completed', priority: 'high', category: 'Code' },
        { id: 'fl1', title: 'Floating Backlog 1', dueDate: '', status: 'todo', priority: 'low', category: 'General' },
        { id: 'fl2', title: 'Floating Backlog 2', dueDate: '', status: 'todo', priority: 'low', category: 'General' }
      ];
      const metrics = computeWeeklyMetrics(weekDates, [], tasks, [], [], {}, []);
      expect(metrics.totalTasksCount).toBe(1);
      expect(metrics.completedTasksCount).toBe(1);
      expect(metrics.taskCompletionPct).toBe(100);
    });
  });

  describe('Recurring Schedule Aggregation', () => {
    const weekDates = getWeekDatesISO('2026-10-17', true); // Oct 12 - 18, 2026

    it('prevents a recurring schedule block from multiplying its execution actual minutes across all week days', () => {
      const recurringSchedule: ScheduleBlock = {
        id: 'sch-rec-1',
        title: 'Daily Morning Deep Work',
        date: '2026-10-15', // Thursday in the week
        startTime: '08:00',
        endTime: '09:00',
        plannedMinutes: 60,
        actualMinutes: 60,
        category: 'Code',
        recurrence: 'daily',
        completed: true
      };

      const metrics = computeWeeklyMetrics(weekDates, [recurringSchedule], [], [], [], {}, []);
      // Planned time exists for each of the 7 days (7 * 60 = 420)
      expect(metrics.totalPlannedMins).toBe(420);
      // Actual time should be verified ONLY on anchor date (Oct 15), NOT multiplied 7x to 420!
      expect(metrics.totalActualMins).toBe(60);
    });
  });
});
