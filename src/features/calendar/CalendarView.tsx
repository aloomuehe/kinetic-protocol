import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { KineticStore, Habit, Task, ScheduleBlock } from '../../store/types';
import { formatReadableDate, addDaysISO, parseLocalISO } from '../../utils/dates';
import { isEntrySatisfied } from '../habits/habitCalculations';
import { getSchedulesForDate } from '../../store/selectors';

interface CalendarViewProps {
  store: KineticStore;
  calendarMode: 'month' | 'week' | 'day' | 'heatmap';
  calendarMonthCursor: string; // YYYY-MM
  selectedDateISO: string;
  todayISO: string;
  weekDatesISO: string[];
  todaySchedules: ScheduleBlock[];
  todayTasks: Task[];
  activeHabits: Habit[];
  todayScheduledHabits: Habit[];
  todayCompletedHabitsCount: number;
  reducedMotion: boolean;
  onSetCalendarMode: (mode: 'month' | 'week' | 'day' | 'heatmap') => void;
  onSetCalendarMonthCursor: (cursor: string) => void;
  onSelectDate: (dateISO: string) => void;
  onToggleHabitOnDate: (habit: Habit, dateISO: string, mode?: 'toggle' | 'mvd' | 'full') => void;
  onToggleScheduleCompletion: (scheduleId: string) => void;
  onToggleTaskStatus: (taskId: string) => void;
}

export function CalendarView({
  store,
  calendarMode,
  calendarMonthCursor,
  selectedDateISO,
  todayISO,
  weekDatesISO,
  todaySchedules,
  todayTasks,
  activeHabits,
  todayScheduledHabits,
  todayCompletedHabitsCount,
  reducedMotion,
  onSetCalendarMode,
  onSetCalendarMonthCursor,
  onSelectDate,
  onToggleHabitOnDate,
  onToggleScheduleCompletion,
  onToggleTaskStatus
}: CalendarViewProps) {
  const [yearNum, monthNum] = calendarMonthCursor.split('-').map(Number);
  const firstDayOfMonth = new Date(yearNum, monthNum - 1, 1);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7; // Mon=0

  const calendarCells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push(iso);
  }

  const changeMonth = (delta: number) => {
    const dt = new Date(yearNum, monthNum - 1 + delta, 1);
    onSetCalendarMonthCursor(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar & Activity Matrix</h1>
          <p className="text-xs text-slate-400">
            Real local-date records · No weekday collisions across weeks
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/[0.07] bg-[#0d1018] p-1">
          {(['month', 'week', 'day', 'heatmap'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onSetCalendarMode(m)}
              className={`kp-btn rounded-xl px-3 py-1.5 text-xs font-semibold capitalize ${
                calendarMode === m
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {calendarMode === 'month' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 lg:col-span-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">
                {firstDayOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectDate(todayISO);
                    onSetCalendarMonthCursor(todayISO.slice(0, 7));
                  }}
                  className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:bg-white/10"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-slate-400 mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div
              key={calendarMonthCursor}
              className={`grid grid-cols-7 gap-1.5 ${reducedMotion ? '' : 'kp-subview-transition'}`}
            >
              {calendarCells.map((iso, idx) => {
                if (!iso) return <div key={`empty-${idx}`} className="h-20 rounded-xl bg-white/[0.01]" />;
                const isToday = iso === todayISO;
                const isSel = iso === selectedDateISO;
                const dayTasks = (store.tasks || []).filter((t) => t.dueDate === iso);
                const dayHabitsDone = activeHabits.filter((h) =>
                  isEntrySatisfied(h, store.habitEntries?.[h.id]?.[iso])
                ).length;

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => onSelectDate(iso)}
                    className={`kp-btn flex h-20 flex-col justify-between rounded-xl border p-2 text-left ${
                      isSel
                        ? 'border-indigo-500 bg-indigo-500/15 shadow-sm shadow-indigo-500/15 ring-1 ring-indigo-400/40'
                        : isToday
                        ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-400/60'
                        : 'border-white/[0.05] bg-[#141824] hover:border-indigo-500/30 hover:bg-[#181d2c]'
                    }`}
                  >
                    <span
                      className={`text-xs font-bold ${
                        isSel ? 'text-indigo-300' : isToday ? 'text-emerald-300' : 'text-slate-300'
                      }`}
                    >
                      {Number(iso.slice(-2))}
                    </span>
                    <div className="space-y-0.5">
                      {dayHabitsDone > 0 && (
                        <div className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300 truncate">
                          {dayHabitsDone} habits
                        </div>
                      )}
                      {dayTasks.length > 0 && (
                        <div className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-300 truncate">
                          {dayTasks.length} tasks
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Inspector */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 lg:col-span-4 space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Selected Date Inspector
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">{formatReadableDate(selectedDateISO)}</h3>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400">
                Scheduled Time Blocks ({todaySchedules.length})
              </h4>
              <div className="mt-2 space-y-2">
                {todaySchedules.map((s) => (
                  <div key={s.id} className="rounded-xl border border-white/[0.06] bg-[#151926] p-2.5 text-xs">
                    <div className="flex justify-between font-bold text-white">
                      <span>{s.title}</span>
                      <span className="text-indigo-400">{s.startTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400">
                Habits ({todayCompletedHabitsCount}/{todayScheduledHabits.length})
              </h4>
              <div className="mt-2 space-y-1.5">
                {todayScheduledHabits.map((h) => {
                  const done = isEntrySatisfied(h, store.habitEntries?.[h.id]?.[selectedDateISO]);
                  return (
                    <div key={h.id} className="flex items-center justify-between rounded-lg bg-[#151926] px-3 py-2 text-xs">
                      <span className={done ? 'text-emerald-300 font-semibold' : 'text-slate-300'}>{h.title}</span>
                      <button
                        type="button"
                        onClick={() => onToggleHabitOnDate(h, selectedDateISO, 'toggle')}
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          done ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {done ? 'Done' : 'Log'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {calendarMode === 'week' && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#10131c] p-5">
          <h3 className="text-base font-bold text-white mb-4">
            Weekly Time Grid ({weekDatesISO[0]} to {weekDatesISO[6]})
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
            {weekDatesISO.map((dISO) => {
              const blocks = getSchedulesForDate(store.schedules || [], dISO);
              return (
                <div
                  key={dISO}
                  onClick={() => onSelectDate(dISO)}
                  className={`rounded-xl border p-3 cursor-pointer ${
                    dISO === selectedDateISO ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/[0.06] bg-[#151926]'
                  }`}
                >
                  <div className="text-xs font-bold text-white">
                    {parseLocalISO(dISO).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                  </div>
                  <div className="mt-2 space-y-2">
                    {blocks.map((b) => (
                      <div key={b.id} className="rounded-lg bg-white/[0.05] p-2 text-[11px]">
                        <div className="font-mono text-indigo-300">{b.startTime}</div>
                        <div className="font-semibold text-white truncate">{b.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {calendarMode === 'day' && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 space-y-4">
          <h3 className="text-base font-bold text-white">Daily Execution Sheet — {formatReadableDate(selectedDateISO)}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-400">Time Blocks</h4>
              {todaySchedules.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#151926] p-3">
                  <div>
                    <div className="text-xs font-mono text-indigo-400">{b.startTime} – {b.endTime}</div>
                    <div className="text-sm font-bold text-white">{b.title}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleScheduleCompletion(b.id)}
                    className={`rounded-lg px-3 py-1 text-xs font-bold ${
                      b.completed ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {b.completed ? 'Completed' : 'Mark Done'}
                  </button>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-400">Tasks Due</h4>
              {todayTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#151926] p-3">
                  <span className={t.status === 'completed' ? 'line-through text-slate-400 text-sm' : 'text-white text-sm font-semibold'}>
                    {t.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleTaskStatus(t.id)}
                    className="rounded-lg bg-indigo-500/20 px-2.5 py-1 text-xs font-bold text-indigo-300"
                  >
                    {t.status === 'completed' ? 'Undo' : 'Complete'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {calendarMode === 'heatmap' && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#10131c] p-5">
          <h3 className="text-base font-bold text-white mb-2">Annual 365-Day Activity Heatmap</h3>
          <p className="text-xs text-slate-400 mb-4">
            Derived directly from dated habit check-ins and completed tasks over the past 180 days.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 180 }, (_, idx) => {
              const iso = addDaysISO(todayISO, -(179 - idx));
              const habitsDone = activeHabits.filter((h) =>
                isEntrySatisfied(h, store.habitEntries?.[h.id]?.[iso])
              ).length;
              const tasksDone = (store.tasks || []).filter(
                (t) => t.dueDate === iso && t.status === 'completed'
              ).length;
              const score = habitsDone + tasksDone;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => onSelectDate(iso)}
                  title={`${iso}: ${habitsDone} habits, ${tasksDone} tasks`}
                  className={`h-4 w-4 rounded-sm transition ${
                    score === 0
                      ? 'bg-white/[0.06]'
                      : score === 1
                      ? 'bg-emerald-900'
                      : score <= 3
                      ? 'bg-emerald-600'
                      : 'bg-emerald-400'
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
