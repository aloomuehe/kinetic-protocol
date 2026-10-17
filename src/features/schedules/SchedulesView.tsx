import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ScheduleBlock } from '../../store/types';

interface SchedulesViewProps {
  selectedDateISO: string;
  todaySchedules: ScheduleBlock[];
  onOpenModal: (type: 'schedule', record: null) => void;
  onToggleScheduleCompletion: (scheduleId: string) => void;
  onDeleteWithUndo: (collectionKey: 'schedules', id: string, label: string) => void;
}

export function SchedulesView({
  selectedDateISO,
  todaySchedules,
  onOpenModal,
  onToggleScheduleCompletion,
  onDeleteWithUndo
}: SchedulesViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Schedules & Time Blocking</h1>
          <p className="text-xs text-slate-400">Planned vs. Actual duration tracking for {selectedDateISO}</p>
        </div>
        <button
          type="button"
          onClick={() => onOpenModal('schedule', null)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" /> New Time Block
        </button>
      </div>

      <div className="space-y-3">
        {todaySchedules.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-[#10131c] p-4"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-indigo-500/15 px-3 py-2 text-center font-mono text-xs font-bold text-indigo-300">
                {s.startTime} – {s.endTime}
              </div>
              <div>
                <div className="text-sm font-bold text-white">{s.title}</div>
                <div className="text-xs text-slate-400">
                  {s.category} · Planned: {s.plannedMinutes}m · Actual: {s.actualMinutes}m · Recurrence: {s.recurrence}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleScheduleCompletion(s.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                  s.completed ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-slate-200'
                }`}
              >
                {s.completed ? 'Done' : 'Complete'}
              </button>
              <button
                type="button"
                onClick={() => onDeleteWithUndo('schedules', s.id, 'Time block')}
                className="rounded-lg border border-white/10 p-2 text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
