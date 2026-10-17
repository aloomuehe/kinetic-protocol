import React from 'react';
import { Plus, Check } from 'lucide-react';
import type { KineticStore } from '../../store/types';
import { CircularRing } from '../../components/ui/CircularRing';

interface GoalsViewProps {
  store: KineticStore;
  reducedMotion: boolean;
  checkRipples: Record<string, number>;
  onOpenModal: (type: 'goal', record: null) => void;
  onToggleGoalMilestone: (goalId: string, milestoneId: string) => void;
}

export function GoalsView({
  store,
  reducedMotion,
  checkRipples,
  onOpenModal,
  onToggleGoalMilestone
}: GoalsViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Goals & Milestones</h1>
          <p className="text-xs text-slate-400">Measurable long-term targets & Monthly Pinned showcase</p>
        </div>
        <button
          type="button"
          onClick={() => onOpenModal('goal', null)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" /> New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {(store.goals || []).map((g) => {
          const pct =
            g.metricType === 'milestones' && Array.isArray(g.milestones) && g.milestones.length > 0
              ? Math.round((g.milestones.filter((m) => m.done).length / g.milestones.length) * 100)
              : Math.min(
                  100,
                  Math.round(((Number(g.currentValue) || 0) / Math.max(1, Number(g.targetValue) || 1)) * 100)
                );

          return (
            <div key={g.id} className="rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase text-indigo-400">{g.category}</span>
                  <h3 className="text-lg font-bold text-white">{g.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{g.description}</p>
                </div>
                <CircularRing percent={pct} color="#38bdf8" reducedMotion={reducedMotion} />
              </div>

              {Array.isArray(g.milestones) && g.milestones.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                  <div className="text-xs font-bold text-slate-400">Milestones</div>
                  {g.milestones.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onToggleGoalMilestone(g.id, m.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg bg-[#151926] px-3 py-2 text-left text-xs hover:bg-white/5"
                    >
                      <span
                        className={`relative overflow-visible flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                          m.done
                            ? 'border-emerald-500 bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                            : 'border-white/20'
                        }`}
                      >
                        {checkRipples[`ms-${g.id}-${m.id}`] && (
                          <span key={checkRipples[`ms-${g.id}-${m.id}`]} className="kp-ripple-ring" />
                        )}
                        <span className="relative overflow-hidden flex h-full w-full items-center justify-center rounded">
                          {checkRipples[`ms-${g.id}-${m.id}`] && (
                            <span key={`w-${checkRipples[`ms-${g.id}-${m.id}`]}`} className="kp-ripple-wave" />
                          )}
                          {m.done && <Check className="h-3 w-3 kp-check-pop" />}
                        </span>
                      </span>
                      <span className={m.done ? 'line-through text-slate-500' : 'text-slate-200'}>
                        {m.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
