import type {
  ScheduleBlock,
  Task,
  Goal,
  Habit,
  HabitEntry,
  HabitStats
} from './types';
import { getWeekdayMon0, parseLocalISO } from '../utils/dates';
import { parseMinutes } from '../utils/formatting';
import { isHabitScheduledOnDate, isEntrySatisfied, computeHabitStats } from '../features/habits/habitCalculations';

export interface DayFocusMetric {
  dateISO: string;
  shortDay: string;
  dayNum: number;
  plannedMinutes: number;
  actualMinutes: number;
  actualHours: number;
  habitPct: number;
  doneHabits: number;
  totalHabits: number;
}

export interface WeeklyMetrics {
  totalPlannedMins: number;
  totalActualMins: number;
  perDayFocusHours: DayFocusMetric[];
  completedTasksCount: number;
  totalTasksCount: number;
  taskCompletionPct: number;
  avgGoalPct: number;
  totalGoalsCount: number;
  completedSchedulesCount: number;
  totalSchedulesCount: number;
  planCompletionPct: number;
}

export function getSchedulesForDate(
  schedules: ScheduleBlock[] = [],
  dateISO: string
): ScheduleBlock[] {
  const wd = getWeekdayMon0(dateISO);
  return schedules
    .filter((s) => {
      if (s.date === dateISO) return true;
      if (s.recurrence === 'daily') return true;
      if (s.recurrence === 'weekdays' && wd <= 4) return true;
      return false;
    })
    .sort((a, b) => parseMinutes(a.startTime) - parseMinutes(b.startTime));
}

export function computeHabitStatsById(
  habits: Habit[] = [],
  habitEntries: Record<string, Record<string, HabitEntry>> = {},
  todayISO: string
): Record<string, HabitStats> {
  const map: Record<string, HabitStats> = {};
  habits.forEach((h) => {
    map[h.id] = computeHabitStats(h, habitEntries, todayISO);
  });
  return map;
}

export function computeWeeklyMetrics(
  weekDatesISO: string[],
  schedules: ScheduleBlock[] = [],
  tasks: Task[] = [],
  goals: Goal[] = [],
  habits: Habit[] = [],
  habitEntries: Record<string, Record<string, HabitEntry>> = {},
  todaySchedules: ScheduleBlock[] = []
): WeeklyMetrics {
  const activeHabits = habits.filter((h) => !h.archivedAt);
  let totalPlannedMins = 0;
  let totalActualMins = 0;

  const perDayFocusHours: DayFocusMetric[] = weekDatesISO.map((dISO) => {
    const dayBlocks = getSchedulesForDate(schedules, dISO);
    const planned = dayBlocks.reduce((acc, b) => acc + (Number(b.plannedMinutes) || 0), 0);
    // In multi-day aggregation, exclude ambiguous recurring execution data when dISO !== b.date
    // to prevent scalar completion fields from multiplying across all matching days.
    const actual = dayBlocks.reduce((acc, b) => {
      const isVerified = !b.recurrence || b.recurrence === 'none' || b.date === dISO;
      if (!isVerified) return acc;
      return acc + (Number(b.actualMinutes) || (b.completed ? Number(b.plannedMinutes) || 0 : 0));
    }, 0);
    totalPlannedMins += planned;
    totalActualMins += actual;

    const dayHabits = activeHabits.filter((h) => isHabitScheduledOnDate(h, dISO));
    const doneHabits = dayHabits.filter((h) =>
      isEntrySatisfied(h, habitEntries[h.id]?.[dISO])
    ).length;
    const habitPct = dayHabits.length > 0 ? Math.round((doneHabits / dayHabits.length) * 100) : 0;

    return {
      dateISO: dISO,
      shortDay: parseLocalISO(dISO).toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: parseLocalISO(dISO).getDate(),
      plannedMinutes: planned,
      actualMinutes: actual,
      actualHours: Number((actual / 60).toFixed(1)),
      habitPct,
      doneHabits,
      totalHabits: dayHabits.length
    };
  });

  const weekStart = weekDatesISO[0];
  const weekEnd = weekDatesISO[weekDatesISO.length - 1];
  // A task is relevant to the selected week if and only if its dueDate falls within [weekStart, weekEnd].
  // Floating tasks without a dueDate belong to the general backlog and do not distort weekly scheduled completion.
  // Unrelated past and future tasks outside this week are strictly excluded.
  const relevantTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    return t.dueDate >= weekStart && t.dueDate <= weekEnd;
  });
  const completedTasksCount = relevantTasks.filter((t) => t.status === 'completed').length;
  const taskCompletionPct =
    relevantTasks.length > 0 ? Math.round((completedTasksCount / relevantTasks.length) * 100) : 0;

  const avgGoalPct =
    goals.length > 0
      ? Math.round(
          goals.reduce((acc, g) => {
            if (g.metricType === 'milestones' && Array.isArray(g.milestones) && g.milestones.length > 0) {
              const doneM = g.milestones.filter((m) => m.done).length;
              return acc + (doneM / g.milestones.length) * 100;
            }
            const target = Math.max(1, Number(g.targetValue) || 1);
            return acc + Math.min(100, ((Number(g.currentValue) || 0) / target) * 100);
          }, 0) / goals.length
        )
      : 0;

  const completedSchedulesCount = todaySchedules.filter((s) => s.completed).length;
  const planCompletionPct =
    todaySchedules.length > 0
      ? Math.round((completedSchedulesCount / todaySchedules.length) * 100)
      : 0;

  return {
    totalPlannedMins,
    totalActualMins,
    perDayFocusHours,
    completedTasksCount,
    totalTasksCount: relevantTasks.length,
    taskCompletionPct,
    avgGoalPct,
    totalGoalsCount: goals.length,
    completedSchedulesCount,
    totalSchedulesCount: todaySchedules.length,
    planCompletionPct
  };
}

export function computeProtocolConsistency(
  activeHabits: Habit[] = [],
  habitStatsById: Record<string, HabitStats> = {}
): number {
  if (activeHabits.length === 0) return 0;
  const total = activeHabits.reduce(
    (acc, h) => acc + (habitStatsById[h.id]?.completionRate || 0),
    0
  );
  return Math.round(total / activeHabits.length);
}
