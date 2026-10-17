import React from 'react';
import { Plus, Flame } from 'lucide-react';
import type { Habit, HabitStats, KineticStore } from '../../store/types';
import { CATEGORIES } from '../../store/constants';
import { parseLocalISO } from '../../utils/dates';
import { CircularRing } from '../../components/ui/CircularRing';
import { HabitRow } from './components/HabitRow';
import { isEntrySatisfied } from './habitCalculations';

interface HabitsViewProps {
  store: KineticStore;
  activeHabits: Habit[];
  habitCategoryFilter: string;
  habitStatsById: Record<string, HabitStats>;
  streakPulseByHabit: Record<string, number>;
  checkRipples: Record<string, number>;
  selectedDateISO: string;
  todayISO: string;
  weekDatesISO: string[];
  reducedMotion: boolean;
  onSetHabitCategoryFilter: (cat: string) => void;
  onSelectDate: (dateISO: string) => void;
  onOpenModal: (type: 'habit', record?: any) => void;
  onDeleteWithUndo: (collectionKey: 'habits', id: string, label: string) => void;
  onToggleHabitOnDate: (habit: Habit, dateISO: string, mode?: 'toggle' | 'mvd' | 'full') => void;
  onUpdateHabitQuantitativeValue: (habit: Habit, dateISO: string, rawValue: any) => void;
  onTriggerCheckRipple: (rippleKey: string) => void;
}

export function HabitsView({
  store,
  activeHabits,
  habitCategoryFilter,
  habitStatsById,
  streakPulseByHabit,
  checkRipples,
  selectedDateISO,
  todayISO,
  weekDatesISO,
  reducedMotion,
  onSetHabitCategoryFilter,
  onSelectDate,
  onOpenModal,
  onDeleteWithUndo,
  onToggleHabitOnDate,
  onUpdateHabitQuantitativeValue,
  onTriggerCheckRipple
}: HabitsViewProps) {
  const filteredHabits = activeHabits.filter(
    (h) => habitCategoryFilter === 'All' || h.category === habitCategoryFilter
  );

  const bestActiveStreak = activeHabits.reduce(
    (maxS, h) => Math.max(maxS, habitStatsById[h.id]?.currentStreak || 0),
    0
  );
  const avgHabitRate =
    activeHabits.length > 0
      ? Math.round(
          activeHabits.reduce((acc, h) => acc + (habitStatsById[h.id]?.completionRate || 0), 0) /
            activeHabits.length
        )
      : 0;
  const todayDoneTotal = activeHabits.filter((h) =>
    isEntrySatisfied(h, store.habitEntries?.[h.id]?.[todayISO])
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Kinetic Habit Protocol</h1>
          <p className="text-xs text-slate-400">
            Real-time streak telemetry, tactile ripple check-ins & Minimum Viable Day (MVD) controls
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenModal('habit', null)}
          className="kp-btn inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" /> New Habit
        </button>
      </div>

      {/* Live Habit Telemetry Strip */}
      <div className="kp-stagger-1 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="kp-card kp-card-interactive flex items-center justify-between rounded-2xl border border-white/[0.07] bg-[#10131c] p-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Top Active Streak
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-amber-400">{bestActiveStreak} Days</span>
              <span className="text-xs text-slate-500">live chain</span>
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <Flame className="h-5 w-5" />
          </div>
        </div>

        <div className="kp-card kp-card-interactive flex items-center justify-between rounded-2xl border border-white/[0.07] bg-[#10131c] p-4">
          <div className="min-w-0 flex-1 pr-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Today&apos;s Check-Ins ({todayISO.slice(5)})
            </div>
            <div className="mt-1 text-2xl font-extrabold text-emerald-400">
              {todayDoneTotal}/{activeHabits.length}
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{
                  width: `${
                    activeHabits.length > 0
                      ? Math.round((todayDoneTotal / activeHabits.length) * 100)
                      : 0
                  }%`
                }}
              />
            </div>
          </div>
          <CircularRing
            percent={
              activeHabits.length > 0
                ? Math.round((todayDoneTotal / activeHabits.length) * 100)
                : 0
            }
            color="#34d399"
            size={48}
            strokeWidth={4}
            reducedMotion={reducedMotion}
          />
        </div>

        <div className="kp-card kp-card-interactive flex items-center justify-between rounded-2xl border border-white/[0.07] bg-[#10131c] p-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Protocol Consistency
            </div>
            <div className="mt-1 text-2xl font-extrabold text-indigo-400">{avgHabitRate}%</div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              Click any date header or cell below to log
            </div>
          </div>
          <CircularRing
            percent={avgHabitRate}
            color="#818cf8"
            size={48}
            strokeWidth={4}
            reducedMotion={reducedMotion}
          />
        </div>
      </div>

      {/* Category Filter Pills + Active Logging Date Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/[0.07] bg-[#0d1018] p-1">
          {['All', ...Object.keys(CATEGORIES)].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onSetHabitCategoryFilter(cat)}
              className={`kp-btn rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                habitCategoryFilter === cat
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Logging target date:</span>
          <span className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 font-mono font-bold text-indigo-300">
            {selectedDateISO === todayISO ? `${selectedDateISO} (Today)` : selectedDateISO}
          </span>
        </div>
      </div>

      {/* 7-Day Real Calendar Matrix */}
      <div className="kp-card overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 shadow-xl">
        {filteredHabits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-xs text-slate-400">
            No active habits in this category. Click <strong>+ New Habit</strong> above to create one.
          </div>
        ) : (
          <table className="w-full min-w-[740px] text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.07] text-[11px] font-bold uppercase text-slate-400">
                <th className="pb-3.5 pr-4">Habit & Quantitative Control</th>
                {weekDatesISO.map((dISO) => {
                  const isTodayCol = dISO === todayISO;
                  const isSelectedCol = dISO === selectedDateISO;
                  return (
                    <th key={dISO} className="pb-3.5 px-1 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectDate(dISO)}
                        title={`Select ${dISO} for quantitative logging`}
                        className={`kp-btn mx-auto flex flex-col items-center rounded-xl px-2.5 py-1.5 transition-all ${
                          isSelectedCol
                            ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40'
                            : isTodayCol
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                        }`}
                      >
                        <span className="text-[10px] font-extrabold tracking-wider">
                          {parseLocalISO(dISO).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="mt-0.5 text-[10px] font-mono opacity-80">
                          {dISO.slice(5)}
                        </span>
                      </button>
                    </th>
                  );
                })}
                <th className="pb-3.5 pl-3 text-right">Live Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filteredHabits.map((h) => (
                <HabitRow
                  key={h.id}
                  habit={h}
                  store={store}
                  selectedDateISO={selectedDateISO}
                  todayISO={todayISO}
                  weekDatesISO={weekDatesISO}
                  stats={
                    habitStatsById[h.id] || {
                      currentStreak: 0,
                      longestStreak: 0,
                      completionRate: 0,
                      scheduledDaysCount: 0,
                      completedScheduledCount: 0,
                      todayDone: false
                    }
                  }
                  streakPulseKey={streakPulseByHabit[h.id]}
                  checkRipples={checkRipples}
                  onSelectDate={onSelectDate}
                  onOpenEditModal={(habitToEdit) => onOpenModal('habit', habitToEdit)}
                  onDeleteWithUndo={onDeleteWithUndo}
                  onToggleHabitOnDate={onToggleHabitOnDate}
                  onUpdateHabitQuantitativeValue={onUpdateHabitQuantitativeValue}
                  onTriggerCheckRipple={onTriggerCheckRipple}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
