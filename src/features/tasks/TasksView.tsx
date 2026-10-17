import React from 'react';
import { Plus, Check, Edit3, Trash2 } from 'lucide-react';
import type { Task } from '../../store/types';
import { CATEGORIES } from '../../store/constants';

interface TasksViewProps {
  tasks: Task[];
  taskFilter: 'all' | 'today' | 'upcoming' | 'completed' | 'overdue';
  taskCategoryFilter: string;
  globalSearch: string;
  todayISO: string;
  checkRipples: Record<string, number>;
  onSetTaskFilter: (filter: 'all' | 'today' | 'upcoming' | 'completed' | 'overdue') => void;
  onOpenModal: (type: 'task', record: any) => void;
  onToggleTaskStatus: (taskId: string) => void;
  onDeleteWithUndo: (collectionKey: 'tasks', id: string, label: string) => void;
}

export function TasksView({
  tasks,
  taskFilter,
  taskCategoryFilter,
  globalSearch,
  todayISO,
  checkRipples,
  onSetTaskFilter,
  onOpenModal,
  onToggleTaskStatus,
  onDeleteWithUndo
}: TasksViewProps) {
  const filtered = (tasks || []).filter((t) => {
    if (taskCategoryFilter !== 'All' && t.category !== taskCategoryFilter) return false;
    if (globalSearch && !t.title.toLowerCase().includes(globalSearch.toLowerCase())) return false;
    if (taskFilter === 'today') return t.dueDate === todayISO;
    if (taskFilter === 'upcoming') return t.dueDate > todayISO && t.status !== 'completed';
    if (taskFilter === 'completed') return t.status === 'completed';
    if (taskFilter === 'overdue') return t.dueDate < todayISO && t.status !== 'completed';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Task Manager</h1>
          <p className="text-xs text-slate-400">Connected to Overview Finality rings & Calendar</p>
        </div>
        <button
          type="button"
          onClick={() => onOpenModal('task', null)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" /> New Task
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'today', 'upcoming', 'completed', 'overdue'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onSetTaskFilter(f)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize ${
              taskFilter === f ? 'bg-indigo-600 text-white' : 'bg-[#10131c] text-slate-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {filtered.map((t) => {
          const cat = CATEGORIES[t.category] || CATEGORIES.General;
          const isDone = t.status === 'completed';
          return (
            <div
              key={t.id}
              className={`kp-card kp-card-interactive flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${
                isDone
                  ? 'border-emerald-500/20 bg-[#10131c]/80'
                  : 'border-white/[0.07] bg-[#10131c]'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  aria-label={isDone ? `Mark "${t.title}" incomplete` : `Mark "${t.title}" complete`}
                  onClick={() => onToggleTaskStatus(t.id)}
                  className={`kp-btn relative overflow-visible mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    isDone
                      ? 'border-emerald-500 bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                      : 'border-white/20 text-transparent hover:border-indigo-400'
                  }`}
                >
                  {checkRipples[`task-${t.id}`] && (
                    <span key={checkRipples[`task-${t.id}`]} className="kp-ripple-ring" />
                  )}
                  <span className="relative overflow-hidden flex h-full w-full items-center justify-center rounded-md">
                    {checkRipples[`task-${t.id}`] && (
                      <span key={`w-${checkRipples[`task-${t.id}`]}`} className="kp-ripple-wave" />
                    )}
                    <Check className={`h-3.5 w-3.5 ${isDone ? 'kp-check-pop' : ''}`} />
                  </span>
                </button>
                <div>
                  <div className={`text-sm font-bold ${t.status === 'completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                    {t.title}
                  </div>
                  {t.description && <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className={`rounded px-2 py-0.5 font-semibold ${cat.bg} ${cat.text}`}>{t.category}</span>
                    <span className="text-slate-400">Due: {t.dueDate}</span>
                    {t.startTime && <span className="text-indigo-400">{t.startTime} – {t.endTime}</span>}
                    <span className="uppercase text-amber-400 font-semibold">{t.priority}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenModal('task', t)}
                  className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteWithUndo('tasks', t.id, 'Task')}
                  className="rounded-lg border border-white/10 p-2 text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
