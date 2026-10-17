import React from 'react';
import type { KineticStore } from '../../store/types';

interface JournalViewProps {
  store: KineticStore;
  selectedDateISO: string;
  todayISO: string;
  onUpdateJournal: (updater: (prev: KineticStore) => KineticStore) => void;
  onSelectDate: (dateISO: string) => void;
}

export function JournalView({
  store,
  selectedDateISO,
  todayISO,
  onUpdateJournal,
  onSelectDate
}: JournalViewProps) {
  const entry = store.journals?.[selectedDateISO] || {
    wentWell: '',
    wasDifficult: '',
    lessonsLearned: '',
    improveTomorrow: ''
  };

  const updateField = (field: string, val: string) => {
    onUpdateJournal((prev) => ({
      ...prev,
      isStarterWorkspace: false,
      journals: {
        ...(prev.journals || {}),
        [selectedDateISO]: {
          ...(prev.journals?.[selectedDateISO] || {
            id: `jrn-${selectedDateISO}`,
            date: selectedDateISO,
            wentWell: '',
            wasDifficult: '',
            lessonsLearned: '',
            improveTomorrow: ''
          }),
          [field]: val,
          updatedAt: new Date().toISOString()
        }
      }
    }));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Review & Journal</h1>
          <p className="text-xs text-slate-400">
            Reflection log for {selectedDateISO === todayISO ? 'Today' : selectedDateISO}
          </p>
        </div>
        {selectedDateISO !== todayISO && (
          <button
            type="button"
            onClick={() => onSelectDate(todayISO)}
            className="kp-btn rounded-xl border border-white/10 bg-[#141824] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Jump to Today
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.07] bg-[#10131c] p-4 space-y-2">
          <label className="text-xs font-bold text-emerald-400">What went well today?</label>
          <textarea
            rows={4}
            value={entry.wentWell}
            onChange={(e) => updateField('wentWell', e.target.value)}
            placeholder="Key breakthroughs, focused sprints, completed proofs..."
            className="w-full rounded-xl border border-white/10 bg-[#151926] p-3 text-xs text-white placeholder-slate-600 transition focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#10131c] p-4 space-y-2">
          <label className="text-xs font-bold text-rose-400">What was difficult or distracting?</label>
          <textarea
            rows={4}
            value={entry.wasDifficult}
            onChange={(e) => updateField('wasDifficult', e.target.value)}
            placeholder="Context switches, energy dips, stuck implementations..."
            className="w-full rounded-xl border border-white/10 bg-[#151926] p-3 text-xs text-white placeholder-slate-600 transition focus:border-rose-500 focus:outline-none"
          />
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#10131c] p-4 space-y-2">
          <label className="text-xs font-bold text-indigo-400">Lessons learned & tactical insight</label>
          <textarea
            rows={4}
            value={entry.lessonsLearned}
            onChange={(e) => updateField('lessonsLearned', e.target.value)}
            placeholder="Architecture patterns discovered, heuristic improvements..."
            className="w-full rounded-xl border border-white/10 bg-[#151926] p-3 text-xs text-white placeholder-slate-600 transition focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#10131c] p-4 space-y-2">
          <label className="text-xs font-bold text-amber-400">How to improve execution tomorrow?</label>
          <textarea
            rows={4}
            value={entry.improveTomorrow}
            onChange={(e) => updateField('improveTomorrow', e.target.value)}
            placeholder="Schedule tighter deep-work blocks, phone off before 11am..."
            className="w-full rounded-xl border border-white/10 bg-[#151926] p-3 text-xs text-white placeholder-slate-600 transition focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
