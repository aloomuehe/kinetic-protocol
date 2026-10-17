import React from 'react';
import { Edit3, Trash2, Check, Flame } from 'lucide-react';
import type { Habit, HabitStats, KineticStore } from '../../../store/types';
import { CATEGORIES } from '../../../store/constants';
import { isEntrySatisfied } from '../habitCalculations';

interface HabitRowProps {
  habit: Habit;
  store: KineticStore;
  selectedDateISO: string;
  todayISO: string;
  weekDatesISO: string[];
  stats: HabitStats;
  streakPulseKey?: number;
  checkRipples: Record<string, number>;
  onSelectDate: (dateISO: string) => void;
  onOpenEditModal: (habit: Habit) => void;
  onDeleteWithUndo: (collectionKey: 'habits', id: string, label: string) => void;
  onToggleHabitOnDate: (habit: Habit, dateISO: string, mode?: 'toggle' | 'mvd' | 'full') => void;
  onUpdateHabitQuantitativeValue: (habit: Habit, dateISO: string, rawValue: any) => void;
  onTriggerCheckRipple: (rippleKey: string) => void;
}

export function HabitRow({
  habit: h,
  store,
  selectedDateISO,
  todayISO,
  weekDatesISO,
  stats,
  streakPulseKey,
  checkRipples,
  onOpenEditModal,
  onDeleteWithUndo,
  onToggleHabitOnDate,
  onUpdateHabitQuantitativeValue,
  onTriggerCheckRipple
}: HabitRowProps) {
  const cat = CATEGORIES[h.category] || CATEGORIES.General;
  const CatIcon = cat.icon || Flame;
  const currentEntry = store.habitEntries?.[h.id]?.[selectedDateISO];
  const currentVal = Number(currentEntry?.value || 0);
  const targetVal = Math.max(1, Number(h.targetValue) || 1);
  const mvdVal = Math.max(1, Number(h.minViableValue) || 1);
  const progressPct = Math.min(100, Math.round((currentVal / targetVal) * 100));
  const stepAmount = h.trackingType === 'duration' ? 15 : h.trackingType === 'numeric' ? 5 : 1;

  return (
    <tr className="group transition-colors duration-150 hover:bg-white/[0.015]">
      <td className="py-4 pr-4 align-middle">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border ${cat.bg} ${cat.border} ${cat.text}`}
            >
              <CatIcon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm truncate">{h.title}</span>
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${cat.bg} ${cat.text}`}>
                  {h.category}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-slate-400">
                Target: <strong className="text-slate-200">{targetVal} {h.unit}</strong> · MVD:{' '}
                <span className="text-amber-300/90">{mvdVal} {h.unit}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onOpenEditModal(h)}
              title="Edit Habit"
              className="kp-btn rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-white"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDeleteWithUndo('habits', h.id, 'Habit')}
              title="Delete Habit"
              className="kp-btn rounded-lg p-1 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Custom Animated Stepper & Progress Bar */}
        {h.trackingType !== 'binary' && (
          <div className="mt-2.5 max-w-xs space-y-1.5 rounded-xl border border-white/[0.07] bg-[#141824] p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1 rounded-lg bg-[#0d1018] p-0.5 border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    onTriggerCheckRipple(`hab-${h.id}-${selectedDateISO}`);
                    onUpdateHabitQuantitativeValue(
                      h,
                      selectedDateISO,
                      Math.max(0, currentVal - stepAmount)
                    );
                  }}
                  className="kp-btn flex h-6 w-6 items-center justify-center rounded-md text-xs font-extrabold text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  −
                </button>
                <input
                  type="number"
                  min="0"
                  value={currentVal || ''}
                  placeholder="0"
                  onChange={(e) =>
                    onUpdateHabitQuantitativeValue(h, selectedDateISO, e.target.value)
                  }
                  className="w-12 bg-transparent text-center font-mono text-xs font-bold text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    onTriggerCheckRipple(`hab-${h.id}-${selectedDateISO}`);
                    onUpdateHabitQuantitativeValue(
                      h,
                      selectedDateISO,
                      currentVal + stepAmount
                    );
                  }}
                  className="kp-btn flex h-6 w-6 items-center justify-center rounded-md text-xs font-extrabold text-indigo-300 hover:bg-indigo-500/20 hover:text-white"
                >
                  +
                </button>
              </div>

              <span className="text-[11px] font-mono text-slate-400">
                / {targetVal} {h.unit}
              </span>

              <div className="flex items-center gap-1 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    onTriggerCheckRipple(`hab-${h.id}-${selectedDateISO}`);
                    onUpdateHabitQuantitativeValue(h, selectedDateISO, mvdVal);
                  }}
                  className={`kp-btn rounded-md px-1.5 py-0.5 text-[10px] font-bold transition ${
                    currentVal >= mvdVal && currentVal < targetVal
                      ? 'bg-amber-400 text-slate-950'
                      : 'border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                  }`}
                >
                  MVD
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onTriggerCheckRipple(`hab-${h.id}-${selectedDateISO}`);
                    onUpdateHabitQuantitativeValue(h, selectedDateISO, targetVal);
                  }}
                  className={`kp-btn rounded-md px-1.5 py-0.5 text-[10px] font-bold transition ${
                    currentVal >= targetVal
                      ? 'bg-emerald-500 text-slate-950'
                      : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                  }`}
                >
                  Full
                </button>
              </div>
            </div>

            {/* Smooth Progress Bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  currentVal >= targetVal
                    ? 'bg-emerald-400'
                    : currentVal >= mvdVal
                    ? 'bg-amber-400'
                    : 'bg-indigo-400'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </td>

      {/* 7-Day Check Cells with Ripple Effect */}
      {weekDatesISO.map((dISO) => {
        const entry = store.habitEntries?.[h.id]?.[dISO];
        const done = isEntrySatisfied(h, entry);
        const isMvd = entry?.status === 'mvd';
        const rKey = `hab-${h.id}-${dISO}`;
        const rippleStamp = checkRipples[rKey];

        return (
          <td key={dISO} className="py-4 px-1 text-center align-middle">
            <button
              type="button"
              onClick={() => onToggleHabitOnDate(h, dISO, 'toggle')}
              title={
                done
                  ? `${dISO}: ${entry?.value || h.targetValue} ${h.unit} (${
                      isMvd ? 'MVD' : 'Completed'
                    })`
                  : `Click to check in for ${dISO}`
              }
              className={`kp-btn relative overflow-visible mx-auto flex h-9 w-9 items-center justify-center rounded-xl font-bold transition-all duration-200 ${
                done
                  ? isMvd
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/25 ring-2 ring-amber-300/30'
                    : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/30'
                  : dISO === todayISO
                  ? 'border border-indigo-500/35 bg-indigo-500/[0.06] text-slate-400 hover:border-indigo-400 hover:bg-indigo-500/15'
                  : 'border border-white/10 bg-white/[0.03] text-slate-500 hover:border-indigo-400/60 hover:bg-white/[0.07]'
              }`}
            >
              {rippleStamp && <span key={rippleStamp} className="kp-ripple-ring" />}
              <span className="relative overflow-hidden flex h-full w-full items-center justify-center rounded-xl">
                {rippleStamp && <span key={`w-${rippleStamp}`} className="kp-ripple-wave" />}
                {done ? <Check className="h-4 w-4 stroke-[2.6] kp-check-pop" /> : null}
              </span>
            </button>
          </td>
        );
      })}

      {/* Real-Time Animated Streak Column */}
      <td className="py-4 pl-3 text-right align-middle">
        <div
          key={streakPulseKey || 'static'}
          className={`inline-flex items-center justify-end gap-1 rounded-xl border px-2.5 py-1 ${
            stats.currentStreak > 0
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              : 'border-white/[0.06] bg-white/[0.03] text-slate-400'
          } ${streakPulseKey ? 'kp-streak-fire' : ''}`}
        >
          <Flame
            className={`h-3.5 w-3.5 ${
              stats.currentStreak > 0 ? 'text-amber-400' : 'text-slate-500'
            }`}
          />
          <span className="text-sm font-extrabold">{stats.currentStreak}d</span>
        </div>
        <div className="mt-1 text-[10px] text-slate-400">
          Best: <strong className="text-slate-200">{stats.longestStreak}d</strong> ·{' '}
          {stats.completionRate}%
        </div>
      </td>
    </tr>
  );
}
