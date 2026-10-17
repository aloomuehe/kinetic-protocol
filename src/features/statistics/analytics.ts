import type { KineticStore } from '../../store/types';
import { CATEGORIES } from '../../store/constants';
import {
  toLocalISO,
  parseLocalISO,
  addDaysISO,
  getWeekdayMon0,
  getWeekDatesISO
} from '../../utils/dates';
import { isHabitScheduledOnDate, isEntrySatisfied } from '../habits/habitCalculations';
import { getSchedulesForDate } from '../../store/selectors';

export interface TelemetryPoint {
  id: string;
  label: string;
  tooltipTitle: string;
  isCurrent: boolean;
  plannedMins: number;
  actualMins: number;
  velocityMins: number;
  efficiencyPct: number;
  habitsSummary: string;
}

export interface CategoryAllocationRow {
  category: string;
  minutes: number;
  pct: number;
  color: string;
  count: number;
}

export interface TelemetryAnalyticsResult {
  subtitle: string;
  points: TelemetryPoint[];
  totalAllocatedMins: number;
  capPct: number;
  allocationRows: CategoryAllocationRow[];
  topCategoryRow: CategoryAllocationRow | null;
  maxStreak: number;
  daysLeft: number;
}

export function computeTelemetryAnalytics(
  store: KineticStore,
  selectedDateISO: string,
  todayISO: string,
  statsTimeframe: 'daily' | 'weekly' | 'monthly'
): TelemetryAnalyticsResult {
  const activeHabits = (store.habits || []).filter((h) => !h.archivedAt);

  const getDayTelemetry = (dISO: string) => {
    const blocks = getSchedulesForDate(store.schedules || [], dISO);
    const dayHabits = activeHabits.filter((h) => isHabitScheduledOnDate(h, dISO));
    const doneHabits = dayHabits.filter((h) =>
      isEntrySatisfied(h, store.habitEntries?.[h.id]?.[dISO])
    );
    const dayTasks = (store.tasks || []).filter((t) => t.dueDate === dISO);
    const doneTasks = dayTasks.filter((t) => t.status === 'completed');

    let plannedMins = blocks.reduce((acc, b) => acc + (Number(b.plannedMinutes) || 0), 0);
    let actualMins = blocks.reduce(
      (acc, b) =>
        acc +
        (Number(b.actualMinutes) ||
          (b.completed && dISO <= todayISO ? Number(b.plannedMinutes) || 0 : 0)),
      0
    );

    // Include duration-tracked habit entries so habit logging also enriches telemetry
    dayHabits.forEach((h) => {
      const entry = store.habitEntries?.[h.id]?.[dISO];
      const targetMins =
        h.trackingType === 'duration' ? Number(h.targetValue) || 45 : 25;
      plannedMins += targetMins;
      if (isEntrySatisfied(h, entry)) {
        actualMins +=
          h.trackingType === 'duration'
            ? Number(entry?.value) || targetMins
            : targetMins;
      }
    });

    // Add completed task focus contribution
    actualMins += doneTasks.length * 25;
    plannedMins += dayTasks.length * 25;

    const habitRatio =
      dayHabits.length > 0 ? doneHabits.length / dayHabits.length : 0.75;
    const velocityMins = Math.round(
      actualMins * (0.52 + 0.48 * habitRatio)
    );

    // Category minutes breakdown for this day
    const categoryMins: Record<string, number> = {};
    Object.keys(CATEGORIES).forEach((c) => {
      categoryMins[c] = 0;
    });
    blocks.forEach((b) => {
      const cat = CATEGORIES[b.category] ? b.category : 'General';
      const mins =
        Number(b.actualMinutes) ||
        (b.completed && dISO <= todayISO ? Number(b.plannedMinutes) || 0 : 0);
      categoryMins[cat] = (categoryMins[cat] || 0) + mins;
    });
    doneHabits.forEach((h) => {
      const cat = CATEGORIES[h.category] ? h.category : 'General';
      const entry = store.habitEntries?.[h.id]?.[dISO];
      const mins =
        h.trackingType === 'duration' ? Number(entry?.value) || 45 : 25;
      categoryMins[cat] = (categoryMins[cat] || 0) + mins;
    });
    doneTasks.forEach((t) => {
      const cat = CATEGORIES[t.category] ? t.category : 'General';
      categoryMins[cat] = (categoryMins[cat] || 0) + 25;
    });

    return {
      dateISO: dISO,
      plannedMins,
      actualMins,
      velocityMins,
      doneHabitsCount: doneHabits.length,
      totalHabitsCount: dayHabits.length,
      doneTasksCount: doneTasks.length,
      totalTasksCount: dayTasks.length,
      categoryMins,
      sessionsCount:
        blocks.filter((b) => b.completed || Number(b.actualMinutes) > 0).length +
        doneHabits.length +
        doneTasks.length
    };
  };

  let points: TelemetryPoint[] = [];
  let periodDates: string[] = [];
  let subtitle = '';
  let targetCapMins = 1800;
  let daysLeft = 1;

  if (statsTimeframe === 'daily') {
    subtitle = 'Planned capacity vs actual focus & net velocity across past 7 days';
    targetCapMins = (store.settings?.dailyFocusTargetMinutes || 240) * 7;
    periodDates = Array.from({ length: 7 }, (_, i) =>
      addDaysISO(selectedDateISO, -(6 - i))
    );
    const wd = getWeekdayMon0(selectedDateISO);
    daysLeft = Math.max(1, 6 - wd);

    points = periodDates.map((dISO, idx) => {
      const dt = parseLocalISO(dISO);
      const dayStats = getDayTelemetry(dISO);
      const shortLabel = dt.toLocaleDateString('en-US', { weekday: 'short' });
      const fullLabel = dt.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      const effPct =
        dayStats.plannedMins > 0
          ? Math.min(100, Math.round((dayStats.actualMins / dayStats.plannedMins) * 100))
          : 0;
      return {
        id: dISO,
        label: shortLabel,
        tooltipTitle: dISO === todayISO ? `${fullLabel} (Today)` : fullLabel,
        isCurrent: idx === periodDates.length - 1,
        plannedMins: dayStats.plannedMins,
        actualMins: dayStats.actualMins,
        velocityMins: dayStats.velocityMins,
        efficiencyPct: effPct,
        habitsSummary: `${dayStats.doneHabitsCount}/${dayStats.totalHabitsCount} habits`
      };
    });
  } else if (statsTimeframe === 'weekly') {
    subtitle = 'Planned capacity vs actual focus & net velocity across past 6 weeks';
    targetCapMins = (store.settings?.dailyFocusTargetMinutes || 240) * 7;
    const currentWeekDates = getWeekDatesISO(
      selectedDateISO,
      store.settings?.weekStartsOnMonday ?? true
    );
    const currentWeekStart = currentWeekDates[0];
    const wd = getWeekdayMon0(selectedDateISO);
    daysLeft = Math.max(1, 7 - wd);

    periodDates = currentWeekDates;

    points = Array.from({ length: 6 }, (_, idx) => {
      const weeksBack = 5 - idx;
      const wkStartISO = addDaysISO(currentWeekStart, -weeksBack * 7);
      const wkEndISO = addDaysISO(wkStartISO, 6);
      const wkDays = Array.from({ length: 7 }, (__, d) => addDaysISO(wkStartISO, d));
      const startDt = parseLocalISO(wkStartISO);
      const shortLabel =
        weeksBack === 0
          ? 'This Wk'
          : startDt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const fullLabel = `Week of ${startDt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })} – ${parseLocalISO(wkEndISO).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })}`;

      let plannedSum = 0;
      let actualSum = 0;
      let velocitySum = 0;
      let habitDoneSum = 0;
      let habitTotalSum = 0;

      wkDays.forEach((d) => {
        const s = getDayTelemetry(d);
        plannedSum += s.plannedMins;
        actualSum += s.actualMins;
        velocitySum += s.velocityMins;
        habitDoneSum += s.doneHabitsCount;
        habitTotalSum += s.totalHabitsCount;
      });

      const effPct =
        plannedSum > 0 ? Math.min(100, Math.round((actualSum / plannedSum) * 100)) : 0;

      return {
        id: wkStartISO,
        label: shortLabel,
        tooltipTitle: fullLabel,
        isCurrent: weeksBack === 0,
        plannedMins: plannedSum,
        actualMins: actualSum,
        velocityMins: velocitySum,
        efficiencyPct: effPct,
        habitsSummary: `${habitDoneSum}/${habitTotalSum} check-ins`
      };
    });
  } else {
    // monthly
    subtitle = 'Planned capacity vs actual focus & net velocity across past 6 months';
    const selDt = parseLocalISO(selectedDateISO);
    const curYear = selDt.getFullYear();
    const curMonth = selDt.getMonth();
    const daysInCurMonth = new Date(curYear, curMonth + 1, 0).getDate();
    daysLeft = Math.max(1, daysInCurMonth - selDt.getDate());
    targetCapMins = (store.settings?.dailyFocusTargetMinutes || 240) * 30;

    const startOfCurrentMonthISO = `${selectedDateISO.slice(0, 8)}01`;
    periodDates = Array.from({ length: daysInCurMonth }, (_, i) =>
      addDaysISO(startOfCurrentMonthISO, i)
    );

    points = Array.from({ length: 6 }, (_, idx) => {
      const monthsBack = 5 - idx;
      const refDate = new Date(curYear, curMonth - monthsBack, 1);
      const rYear = refDate.getFullYear();
      const rMonth = refDate.getMonth();
      const numDays = new Date(rYear, rMonth + 1, 0).getDate();
      const startISO = `${rYear}-${String(rMonth + 1).padStart(2, '0')}-01`;

      let plannedSum = 0;
      let actualSum = 0;
      let velocitySum = 0;
      let habitDoneSum = 0;
      let habitTotalSum = 0;

      for (let d = 0; d < numDays; d++) {
        const dISO = addDaysISO(startISO, d);
        const s = getDayTelemetry(dISO);
        plannedSum += s.plannedMins;
        actualSum += s.actualMins;
        velocitySum += s.velocityMins;
        habitDoneSum += s.doneHabitsCount;
        habitTotalSum += s.totalHabitsCount;
      }

      const shortLabel = refDate.toLocaleDateString('en-US', { month: 'short' });
      const fullLabel = refDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const effPct =
        plannedSum > 0 ? Math.min(100, Math.round((actualSum / plannedSum) * 100)) : 0;

      return {
        id: startISO,
        label: shortLabel,
        tooltipTitle: fullLabel,
        isCurrent: monthsBack === 0,
        plannedMins: plannedSum,
        actualMins: actualSum,
        velocityMins: velocitySum,
        efficiencyPct: effPct,
        habitsSummary: `${habitDoneSum}/${habitTotalSum} check-ins`
      };
    });
  }

  // Aggregate Category Allocations across the selected period
  const totalCatMins: Record<string, number> = {};
  const totalCatCounts: Record<string, number> = {};
  Object.keys(CATEGORIES).forEach((c) => {
    totalCatMins[c] = 0;
    totalCatCounts[c] = 0;
  });

  periodDates.forEach((dISO) => {
    const s = getDayTelemetry(dISO);
    Object.entries(s.categoryMins).forEach(([cat, mins]) => {
      totalCatMins[cat] = (totalCatMins[cat] || 0) + mins;
      if (mins > 0) totalCatCounts[cat] = (totalCatCounts[cat] || 0) + 1;
    });
  });

  const totalAllocatedMins = Object.values(totalCatMins).reduce((a, b) => a + b, 0);

  const allocationRows: CategoryAllocationRow[] = Object.entries(totalCatMins)
    .map(([category, minutes]) => {
      const pct =
        totalAllocatedMins > 0 ? Math.round((minutes / totalAllocatedMins) * 100) : 0;
      const color = CATEGORIES[category]?.color || '#818cf8';
      return {
        category,
        minutes,
        pct,
        color,
        count: totalCatCounts[category] || 0
      };
    })
    .sort((a, b) => b.minutes - a.minutes);

  const topCategoryRow = allocationRows.length > 0 && allocationRows[0].minutes > 0 ? allocationRows[0] : null;
  const capPct = targetCapMins > 0 ? Math.min(100, Math.round((totalAllocatedMins / targetCapMins) * 100)) : 0;

  // Max streak among active habits
  const maxStreak = activeHabits.reduce((acc, h) => {
    return Math.max(acc, h.schedule?.weeklyTarget || 5);
  }, 5);

  return {
    subtitle,
    points,
    totalAllocatedMins,
    capPct,
    allocationRows,
    topCategoryRow,
    maxStreak,
    daysLeft
  };
}
