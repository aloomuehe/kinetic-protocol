import type { Habit, HabitEntry, HabitStats } from '../../store/types';
import { addDaysISO, getWeekdayMon0 } from '../../utils/dates';

export function isHabitScheduledOnDate(habit: Habit, dateISO: string): boolean {
  if (!habit) return false;
  if (habit.archivedAt && dateISO > habit.archivedAt.slice(0, 10)) return false;
  if (habit.startDate && dateISO < habit.startDate) return false;
  if (habit.endDate && dateISO > habit.endDate) return false;
  const schedule = habit.schedule || { type: 'daily', weekdays: [0, 1, 2, 3, 4, 5, 6], weeklyTarget: 7 };
  if (schedule.type === 'weekdays' && Array.isArray(schedule.weekdays)) {
    const wd = getWeekdayMon0(dateISO);
    return schedule.weekdays.includes(wd);
  }
  return true;
}

export function isEntrySatisfied(habit: Habit, entry?: HabitEntry | null): boolean {
  if (!entry || !habit) return false;
  if (entry.status === 'completed' || entry.status === 'mvd') return true;
  if (habit.trackingType === 'binary') return Boolean(entry.value >= 1);
  const minTarget = Number(habit.minViableValue) || Number(habit.targetValue) || 1;
  return Number(entry.value || 0) >= minTarget;
}

export function computeHabitStats(
  habit: Habit,
  habitEntriesMap: Record<string, Record<string, HabitEntry>>,
  todayISO: string
): HabitStats {
  const entriesForHabit = habitEntriesMap[habit.id] || {};
  const entryDates = Object.keys(entriesForHabit).sort();
  const earliestEntryISO = entryDates.length > 0 ? entryDates[0] : todayISO;
  const latestSatisfiedISO = entryDates.reduce((latest, dISO) => {
    if (isEntrySatisfied(habit, entriesForHabit[dISO]) && dISO > latest) {
      return dISO;
    }
    return latest;
  }, todayISO);

  const rawStartISO =
    habit.startDate && habit.startDate <= todayISO ? habit.startDate : addDaysISO(todayISO, -60);
  const startISO = earliestEntryISO < rawStartISO ? earliestEntryISO : rawStartISO;
  const endScanISO = latestSatisfiedISO > todayISO ? latestSatisfiedISO : todayISO;

  let currentStreak = 0;
  let cursor = endScanISO;
  for (let i = 0; i < 366; i++) {
    if (cursor < startISO) break;
    const entry = entriesForHabit[cursor];
    const satisfied = isEntrySatisfied(habit, entry);

    if (satisfied) {
      // Every satisfied day (scheduled or bonus/weekend check-in) increments the live streak immediately
      currentStreak += 1;
    } else if (cursor > todayISO) {
      // Unchecked future day in the current week matrix does not break the streak
    } else if (cursor === todayISO && currentStreak === 0) {
      // Today is still in progress if unchecked; preserve yesterday's active streak
    } else if (!isHabitScheduledOnDate(habit, cursor)) {
      // Unscheduled rest day does not break the streak
    } else {
      break;
    }
    cursor = addDaysISO(cursor, -1);
  }

  let longestStreak = 0;
  let running = 0;
  let scanCursor = startISO;
  let scheduledDaysCount = 0;
  let completedScheduledCount = 0;

  for (let i = 0; i < 400; i++) {
    if (scanCursor > endScanISO) break;
    const scheduled = isHabitScheduledOnDate(habit, scanCursor);
    const entry = entriesForHabit[scanCursor];
    const satisfied = isEntrySatisfied(habit, entry);
    if (scheduled && scanCursor <= todayISO) {
      scheduledDaysCount += 1;
      if (satisfied) {
        completedScheduledCount += 1;
        running += 1;
        if (running > longestStreak) longestStreak = running;
      } else if (scanCursor !== todayISO) {
        running = 0;
      }
    } else if (satisfied) {
      // Bonus or current-week completion also counts toward streak and completion credit
      completedScheduledCount += 1;
      scheduledDaysCount += 1;
      running += 1;
      if (running > longestStreak) longestStreak = running;
    }
    scanCursor = addDaysISO(scanCursor, 1);
  }

  if (currentStreak > longestStreak) longestStreak = currentStreak;
  const completionRate =
    scheduledDaysCount > 0
      ? Math.min(100, Math.round((completedScheduledCount / scheduledDaysCount) * 100))
      : 0;

  return {
    currentStreak,
    longestStreak,
    completionRate,
    scheduledDaysCount,
    completedScheduledCount,
    todayDone: isEntrySatisfied(habit, entriesForHabit[todayISO])
  };
}
