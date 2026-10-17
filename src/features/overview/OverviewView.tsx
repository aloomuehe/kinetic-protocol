import React from 'react';
import {
  Sparkles,
  Plus,
  Timer,
  Calendar as CalendarIcon,
  Flame,
  Zap,
  Pin,
  Check,
  Edit3
} from 'lucide-react';
import type { KineticStore, Habit, HabitStats, ScheduleBlock, Task, ActiveNavId } from '../../store/types';
import type { WeeklyMetrics } from '../../store/selectors';
import { CATEGORIES } from '../../store/constants';
import { formatReadableDate } from '../../utils/dates';
import { formatDurationMinutes } from '../../utils/formatting';
import { CircularRing } from '../../components/ui/CircularRing';
import { isEntrySatisfied } from '../habits/habitCalculations';

interface OverviewViewProps {
  store: KineticStore;
  weeklyMetrics: WeeklyMetrics;
  habitStatsById: Record<string, HabitStats>;
  todaySchedules: ScheduleBlock[];
  todayTasks: Task[];
  todayScheduledHabits: Habit[];
  todayCompletedHabitsCount: number;
  activeHabits: Habit[];
  selectedDateISO: string;
  todayISO: string;
  weekDatesISO: string[];
  reducedMotion: boolean;
  checkRipples: Record<string, number>;
  onSelectDate: (dISO: string) => void;
  onSelectNav: (id: ActiveNavId) => void;
  onOpenModal: (type: any, record?: any) => void;
  onToggleScheduleCompletion: (id: string) => void;
  onToggleHabitOnDate: (habit: Habit, dateISO: string, mode?: 'toggle' | 'mvd' | 'full') => void;
  onCleanWorkspace: () => void;
  onKeepWorkspace: () => void;
}

export function OverviewView({
  store,
  weeklyMetrics,
  habitStatsById,
  todaySchedules,
  todayTasks,
  todayScheduledHabits,
  todayCompletedHabitsCount,
  activeHabits,
  selectedDateISO,
  todayISO,
  weekDatesISO,
  reducedMotion,
  checkRipples,
  onSelectDate,
  onSelectNav,
  onOpenModal,
  onToggleScheduleCompletion,
  onToggleHabitOnDate,
  onCleanWorkspace,
  onKeepWorkspace
}: OverviewViewProps) {
  const totalWeekFocusHours = (weeklyMetrics.totalActualMins / 60).toFixed(1);
  const weeklyFocusGoalHours = 30;
  const focusGoalPct = Math.min(
    100,
    Math.round(((weeklyMetrics.totalActualMins / 60) / weeklyFocusGoalHours) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Workspace Initialization Banner if running on starter data */}
      {store.isStarterWorkspace && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-xs text-indigo-200">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>
              <strong>Guided Starter Workspace Active:</strong> Explore real dated schedules, habits, and analytics, or start with a clean slate anytime.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCleanWorkspace}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-medium text-white hover:bg-white/10 transition"
            >
              Start Fresh (Empty OS)
            </button>
            <button
              type="button"
              onClick={onKeepWorkspace}
              className="rounded-lg bg-indigo-500 px-3 py-1.5 font-semibold text-white hover:bg-indigo-400 transition"
            >
              Keep Workspace
            </button>
          </div>
        </div>
      )}

      {/* Greeting & Quick Actions Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Welcome back, {store.settings?.userName || 'Operator'} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {formatReadableDate(selectedDateISO)} · Unified productivity telemetry & execution timeline
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedDateISO !== todayISO && (
            <button
              type="button"
              onClick={() => onSelectDate(todayISO)}
              className="rounded-xl border border-white/10 bg-[#141824] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-indigo-500/40"
            >
              Jump to Today
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenModal('task', null)}
            className="kp-btn inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#141824] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-indigo-500/40 hover:bg-white/10"
          >
            <Plus className="h-3.5 w-3.5 text-indigo-400" />
            Add Task
          </button>
          <button
            type="button"
            onClick={() => onOpenModal('schedule', null)}
            className="kp-btn inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 hover:shadow-indigo-500/35"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Plan
          </button>
        </div>
      </div>

      {/* Top 4 Telemetry Cards */}
      <div className="kp-stagger-1 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Focus Time */}
        <div className="kp-card kp-card-interactive rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Focus time (Week)</span>
            <Timer className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {formatDurationMinutes(weeklyMetrics.totalActualMins)}
          </div>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-md bg-white/[0.06] p-0.5">
            <div
              className="h-full rounded-sm bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500"
              style={{ width: `${focusGoalPct}%` }}
            />
          </div>
          <p className="mt-2.5 text-[11px] text-slate-400">
            {focusGoalPct}% of {weeklyFocusGoalHours}h weekly deep-work target
          </p>
        </div>

        {/* Card 2: Daily Execution */}
        <div className="kp-card kp-card-interactive rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Weekly Execution</span>
            <CalendarIcon className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {todayCompletedHabitsCount}/{todayScheduledHabits.length}{' '}
            <span className="text-sm font-normal text-slate-400">habits today</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            {weeklyMetrics.perDayFocusHours.map((d) => {
              const isSel = d.dateISO === selectedDateISO;
              const hasActivity = d.doneHabits > 0 || d.actualMinutes > 0;
              return (
                <button
                  key={d.dateISO}
                  type="button"
                  onClick={() => onSelectDate(d.dateISO)}
                  title={`${d.dateISO}: ${d.doneHabits}/${d.totalHabits} habits`}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition ${
                    isSel
                      ? 'bg-indigo-500 text-white ring-2 ring-indigo-400/50'
                      : hasActivity
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/[0.05] text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {d.dayNum}
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 text-[11px] text-slate-400">
            Click any day pill to inspect its timeline
          </p>
        </div>

        {/* Card 3: Habit Consistency */}
        <div className="kp-card kp-card-interactive rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Protocol Consistency</span>
            <Flame className="h-4 w-4 text-emerald-400" />
          </div>
          {(() => {
            const avgConsistency =
              activeHabits.length > 0
                ? Math.round(
                    activeHabits.reduce(
                      (acc, h) => acc + (habitStatsById[h.id]?.completionRate || 0),
                      0
                    ) / activeHabits.length
                  )
                : 0;
            const litBars = Math.round((avgConsistency / 100) * 20);
            return (
              <>
                <div className="mt-2 text-2xl font-bold text-white">{avgConsistency}%</div>
                <div className="mt-3 flex items-center gap-1">
                  {Array.from({ length: 20 }, (_, i) => (
                    <span
                      key={i}
                      className={`h-4 flex-1 rounded-full transition-colors ${
                        i < litBars ? 'bg-emerald-400' : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-2.5 text-[11px] text-slate-400">
                  Across {activeHabits.length} active scheduled habits
                </p>
              </>
            );
          })()}
        </div>

        {/* Card 4: Protocol Matrix */}
        <div className="kp-card kp-card-interactive rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Active Tasks & Priorities</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {weeklyMetrics.completedTasksCount}/{weeklyMetrics.totalTasksCount}
          </div>
          <div className="mt-3 flex items-center gap-2">
            {Object.entries(CATEGORIES).slice(0, 5).map(([catKey, cfg]) => {
              const IconComp = cfg.icon;
              return (
                <span
                  key={catKey}
                  title={catKey}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}
                >
                  <IconComp className="h-3.5 w-3.5" />
                </span>
              );
            })}
          </div>
          <p className="mt-2.5 text-[11px] text-slate-400">
            {todayTasks.filter((t) => t.status !== 'completed').length} tasks remaining for{' '}
            {selectedDateISO === todayISO ? 'today' : selectedDateISO}
          </p>
        </div>
      </div>

      {/* Today's Horizontal Timeline */}
      <div className="kp-card kp-card-interactive rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-rose-400" />
            <h2 className="text-base font-bold text-white">
              Today&apos;s Timeline ({selectedDateISO === todayISO ? 'Today' : selectedDateISO})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onSelectNav('schedules')}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
          >
            Open Full Schedule →
          </button>
        </div>

        <div className="mt-4 hidden grid-cols-8 text-[11px] font-medium text-slate-500 sm:grid">
          <span>08:00</span>
          <span>10:00</span>
          <span>12:00</span>
          <span>14:00</span>
          <span>16:00</span>
          <span>18:00</span>
          <span>20:00</span>
          <span>22:00</span>
        </div>

        {todaySchedules.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-400">
            No time blocks scheduled for {selectedDateISO}. Click <strong>+ Add Plan</strong> above to create a time block.
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {todaySchedules.slice(0, 5).map((block) => {
              const cat = CATEGORIES[block.category] || CATEGORIES.General;
              return (
                <div
                  key={block.id}
                  onClick={() => onToggleScheduleCompletion(block.id)}
                  className={`group cursor-pointer rounded-2xl border p-4 transition-all ${
                    block.completed
                      ? 'border-white/[0.06] bg-white/[0.02] opacity-75'
                      : 'border-white/10 bg-[#151926] hover:border-indigo-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                      style={{
                        backgroundColor: block.completed ? 'rgba(255,255,255,0.08)' : cat.color,
                        color: block.completed ? '#94a3b8' : '#090b10'
                      }}
                    >
                      {block.startTime} – {block.endTime}
                    </span>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                        block.completed
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : 'border-white/20 text-transparent group-hover:border-indigo-400'
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                  </div>
                  <h3
                    className={`mt-3 text-sm font-bold ${
                      block.completed ? 'line-through text-slate-400' : 'text-white'
                    }`}
                  >
                    {block.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                    {block.notes || `${block.category} · ${block.plannedMinutes}m planned`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Middle Row: Activity Weekly Gantt Matrix + Finality Circular Progress */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Activity Weekly Gantt */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 shadow-xl lg:col-span-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-3.5 w-3.5 rounded bg-emerald-400" />
              <h2 className="text-base font-bold text-white">Activity</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
              Current Week ({weekDatesISO[0].slice(5)} – {weekDatesISO[6].slice(5)})
            </span>
          </div>

          <div className="mt-5 grid grid-cols-8 items-center text-center text-xs font-bold text-slate-400">
            <div className="text-left text-[11px] font-normal text-slate-500">Time</div>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelectDate(weekDatesISO[i])}
                className={`py-1 rounded-lg transition ${
                  weekDatesISO[i] === selectedDateISO
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-3 border-t border-white/[0.06] pt-4">
            {[
              { time: '08:00', title: 'Deep Work: Systems & Algorithms', startCol: 2, span: 3, cat: 'Math' },
              { time: '12:00', title: 'Quantitative Models & Linear Algebra', startCol: 1, span: 4, cat: 'Code' },
              { time: '16:00', title: 'Backtest Calibration & Execution', startCol: 2, span: 4, cat: 'Deep Work' },
              { time: '20:00', title: 'Calisthenics & Evening Protocol Review', startCol: 4, span: 3, cat: 'Quant' }
            ].map((row, idx) => {
              const catCfg = CATEGORIES[row.cat] || CATEGORIES.General;
              return (
                <div key={idx} className="grid grid-cols-8 items-center gap-1 py-1.5">
                  <span className="text-xs font-medium text-slate-500">{row.time}</span>
                  <div className="col-span-7 grid grid-cols-7 items-center">
                    <div
                      style={{
                        gridColumnStart: row.startCol,
                        gridColumnEnd: `span ${row.span}`,
                        backgroundColor: catCfg.pillBg,
                        color: catCfg.pillText
                      }}
                      className="truncate rounded-xl px-3.5 py-2.5 text-center text-xs font-bold shadow-sm transition hover:scale-[1.01]"
                    >
                      {row.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Finality Card */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 shadow-xl lg:col-span-4 flex flex-col justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-3.5 w-3.5 rounded bg-sky-400" />
            <h2 className="text-base font-bold text-white">Finality</h2>
          </div>

          <div className="my-auto space-y-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-md shadow-indigo-500/20">
                  <span className="text-[10px] font-medium opacity-85">Tasks</span>
                  <span className="text-xl font-extrabold">{weeklyMetrics.completedTasksCount}</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Completed</div>
                  <div className="text-xs text-slate-400">Of {weeklyMetrics.totalTasksCount} total</div>
                  <span className="mt-1 inline-block rounded bg-white/[0.07] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                    Saved
                  </span>
                </div>
              </div>
              <CircularRing
                percent={weeklyMetrics.taskCompletionPct}
                color="#818cf8"
                reducedMotion={reducedMotion}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20">
                  <span className="text-[10px] font-semibold opacity-80">Goals</span>
                  <span className="text-xl font-extrabold">{weeklyMetrics.totalGoalsCount}</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Reached</div>
                  <div className="text-xs text-slate-400">Active milestones</div>
                  <span className="mt-1 inline-block rounded bg-white/[0.07] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                    Saved
                  </span>
                </div>
              </div>
              <CircularRing
                percent={weeklyMetrics.avgGoalPct}
                color="#38bdf8"
                reducedMotion={reducedMotion}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20">
                  <span className="text-[10px] font-semibold opacity-80">Plans</span>
                  <span className="text-xl font-extrabold">{weeklyMetrics.completedSchedulesCount}</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Done</div>
                  <div className="text-xs text-slate-400">Time blocks today</div>
                  <span className="mt-1 inline-block rounded bg-white/[0.07] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                    Saved
                  </span>
                </div>
              </div>
              <CircularRing
                percent={weeklyMetrics.planCompletionPct}
                color="#fbbf24"
                reducedMotion={reducedMotion}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row 1: Weekly Activity Bar Chart + Interactive Habit Quick Check-in */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 shadow-xl lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white">📊 Weekly Activity Overview</h2>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white">{totalWeekFocusHours}h</span>
                <span className="text-xs text-slate-400">Total recorded focus time this week</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectNav('habits')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Habit Matrix →
            </button>
          </div>

          <div className="mt-6 grid grid-cols-7 items-end gap-3 h-44 pt-4 px-2 border-b border-white/[0.07]">
            {weeklyMetrics.perDayFocusHours.map((d, i) => {
              const barPct = Math.max(12, Math.min(100, Math.round((d.actualMinutes / 240) * 100)));
              const isEven = i % 2 === 0;
              return (
                <div
                  key={d.dateISO}
                  onClick={() => onSelectDate(d.dateISO)}
                  className="group flex flex-col items-center justify-end h-full cursor-pointer"
                >
                  <span className="mb-1.5 text-[10px] font-semibold text-slate-400 opacity-0 group-hover:opacity-100 transition">
                    {d.actualHours}h
                  </span>
                  <div
                    style={{ height: `${barPct}%` }}
                    className={`w-full max-w-[42px] rounded-t-xl transition-all duration-500 ${
                      d.dateISO === selectedDateISO
                        ? 'bg-indigo-400 shadow-lg shadow-indigo-500/30'
                        : isEven
                        ? 'bg-emerald-400/90 hover:bg-emerald-300'
                        : 'bg-amber-400/90 hover:bg-amber-300'
                    }`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2.5 grid grid-cols-7 text-center text-xs font-medium text-slate-400">
            {weeklyMetrics.perDayFocusHours.map((d) => (
              <span key={d.dateISO} className={d.dateISO === selectedDateISO ? 'font-bold text-white' : ''}>
                {d.shortDay}
              </span>
            ))}
          </div>
        </div>

        {/* Today's Habit Quick Check-in */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 shadow-xl lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">⚡ Daily Habit Execution</h2>
              <span className="text-xs font-semibold text-emerald-400">
                {todayCompletedHabitsCount}/{todayScheduledHabits.length} Done
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Direct check-in for {selectedDateISO === todayISO ? 'today' : selectedDateISO}
            </p>

            <div className="mt-4 space-y-2.5">
              {todayScheduledHabits.map((h) => {
                const entry = store.habitEntries?.[h.id]?.[selectedDateISO];
                const done = isEntrySatisfied(h, entry);
                const stats = habitStatsById[h.id] || { currentStreak: 0 };
                const cat = CATEGORIES[h.category] || CATEGORIES.General;

                return (
                  <div
                    key={h.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition ${
                      done
                        ? 'border-emerald-500/30 bg-emerald-500/[0.07]'
                        : 'border-white/[0.07] bg-[#151926]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cat.bg} ${cat.text}`}>
                          {h.category}
                        </span>
                        <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-0.5">
                          <Flame className="h-3 w-3" /> {stats.currentStreak}d
                        </span>
                      </div>
                      <div className="mt-1 truncate text-xs font-bold text-white">{h.title}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {h.minViableValue && h.minViableValue < h.targetValue && !done && (
                        <button
                          type="button"
                          onClick={() => onToggleHabitOnDate(h, selectedDateISO, 'mvd')}
                          title={`Log Minimum Viable Day (${h.minViableValue} ${h.unit})`}
                          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-500/20"
                        >
                          MVD
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onToggleHabitOnDate(h, selectedDateISO, 'toggle')}
                        className={`kp-btn relative overflow-visible flex h-8 w-8 items-center justify-center rounded-xl font-bold transition ${
                          done
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                            : 'border border-white/15 bg-white/5 text-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {checkRipples[`hab-${h.id}-${selectedDateISO}`] && (
                          <span
                            key={checkRipples[`hab-${h.id}-${selectedDateISO}`]}
                            className="kp-ripple-ring"
                          />
                        )}
                        <span className="relative overflow-hidden inset-0 flex h-full w-full items-center justify-center rounded-xl">
                          {checkRipples[`hab-${h.id}-${selectedDateISO}`] && (
                            <span
                              key={`w-${checkRipples[`hab-${h.id}-${selectedDateISO}`]}`}
                              className="kp-ripple-wave"
                            />
                          )}
                          <Check className={`h-4 w-4 ${done ? 'kp-check-pop' : ''}`} />
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row 2: Monthly pinned Goals Showcase */}
      <div className="kp-card kp-card-interactive rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-3.5 w-3.5 rounded bg-pink-400" />
            <h2 className="text-base font-bold text-white">Monthly pinned</h2>
          </div>
          <button
            type="button"
            onClick={() => onSelectNav('goals')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
          >
            Manage Goals →
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          {(store.goals || []).map((g) => {
            const cat = CATEGORIES[g.category] || CATEGORIES.General;
            return (
              <div
                key={g.id}
                className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#151925] transition hover:border-indigo-500/40"
              >
                <div
                  className={`relative h-32 w-full bg-gradient-to-br ${
                    g.bannerGradient || 'from-indigo-500/30 via-sky-500/20 to-slate-900'
                  } p-4 flex flex-col justify-between`}
                >
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenModal('goal', g)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span
                    className={`w-fit rounded-md px-2.5 py-0.5 text-[11px] font-bold ${cat.bg} ${cat.text} border ${cat.border}`}
                  >
                    {g.category} Goal
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-bold text-white">{g.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <div>
                      <div>
                        Topic: <strong className="text-slate-200">{g.topic || g.category}</strong>
                      </div>
                      <div className="mt-0.5">
                        Status: <strong className="text-emerald-400">{g.status || 'In progress'}</strong>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">{g.targetDate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
