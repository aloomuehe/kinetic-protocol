import React, { useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  X,
  Bell,
  Sun,
  Sparkles,
  Plus,
  AlertCircle,
  Clock,
  Flame
} from 'lucide-react';
import type { KineticStore, ActiveNavId, NotificationItem, Habit } from '../../store/types';

interface HeaderProps {
  store: KineticStore;
  globalSearch: string;
  mobileMenuOpen: boolean;
  notifOpen: boolean;
  notifFilter: 'all' | 'overdue' | 'upcoming' | 'reminders';
  themeTooltipOpen: boolean;
  todayISO: string;
  todaySchedules: any[];
  todayScheduledHabits: Habit[];
  onSetGlobalSearch: (val: string) => void;
  onToggleMobileMenu: () => void;
  onSetNotifOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  onSetNotifFilter: (filter: 'all' | 'overdue' | 'upcoming' | 'reminders') => void;
  onSetThemeTooltipOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  onOpenModal: (type: any, record?: any) => void;
  onSelectNav: (id: ActiveNavId) => void;
  onToggleTask: (taskId: string) => void;
  onToggleSchedule: (scheduleId: string) => void;
  onToggleHabit: (habit: Habit, dateISO: string, mode?: 'toggle' | 'mvd' | 'full') => void;
}

export function Header({
  store,
  globalSearch,
  mobileMenuOpen,
  notifOpen,
  notifFilter,
  themeTooltipOpen,
  todayISO,
  todaySchedules,
  todayScheduledHabits,
  onSetGlobalSearch,
  onToggleMobileMenu,
  onSetNotifOpen,
  onSetNotifFilter,
  onSetThemeTooltipOpen,
  onOpenModal,
  onSelectNav,
  onToggleTask,
  onToggleSchedule,
  onToggleHabit
}: HeaderProps) {
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notifOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        onSetNotifOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSetNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [notifOpen, onSetNotifOpen]);

  // Compute notifications
  const allTasks = store.tasks || [];
  const overdueItems: NotificationItem[] = allTasks
    .filter((t) => t.status !== 'completed' && t.dueDate < todayISO)
    .map((t) => ({
      id: `ov-${t.id}`,
      taskId: t.id,
      group: 'overdue',
      title: t.title,
      meta: `Overdue · Due ${t.dueDate}`,
      category: t.category,
      navTarget: 'tasks' as ActiveNavId
    }));

  const upcomingTaskItems: NotificationItem[] = allTasks
    .filter((t) => t.status !== 'completed' && t.dueDate >= todayISO)
    .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))
    .slice(0, 4)
    .map((t) => ({
      id: `up-task-${t.id}`,
      taskId: t.id,
      group: 'upcoming',
      title: t.title,
      meta:
        t.dueDate === todayISO
          ? `Due Today${t.startTime ? ` · ${t.startTime}` : ''}`
          : `Upcoming · ${t.dueDate}`,
      category: t.category,
      navTarget: 'tasks' as ActiveNavId
    }));

  const upcomingScheduleItems: NotificationItem[] = todaySchedules
    .filter((s) => !s.completed)
    .slice(0, 3)
    .map((s) => ({
      id: `up-sch-${s.id}`,
      scheduleId: s.id,
      group: 'upcoming',
      title: s.title,
      meta: `Today's Block · ${s.startTime} – ${s.endTime}`,
      category: s.category,
      navTarget: 'schedules' as ActiveNavId
    }));

  const unloggedHabits: NotificationItem[] = todayScheduledHabits
    .filter((h) => {
      const entry = store.habitEntries?.[h.id]?.[todayISO];
      return !(entry && (entry.status === 'completed' || entry.status === 'mvd' || (h.trackingType === 'binary' && entry.value >= 1)));
    })
    .map((h) => ({
      id: `rem-hab-${h.id}`,
      habit: h,
      group: 'reminders',
      title: h.title,
      meta: `Habit Reminder · Target: ${h.targetValue} ${h.unit}`,
      category: h.category,
      navTarget: 'habits' as ActiveNavId
    }));

  const goalReminders: NotificationItem[] = (store.goals || [])
    .filter((g) => g.pinned)
    .slice(0, 2)
    .map((g) => ({
      id: `rem-goal-${g.id}`,
      group: 'reminders',
      title: g.title,
      meta: `Goal Target · ${g.targetDate}`,
      category: g.category,
      navTarget: 'goals' as ActiveNavId
    }));

  const allNotifs = [
    ...overdueItems,
    ...upcomingTaskItems,
    ...upcomingScheduleItems,
    ...unloggedHabits,
    ...goalReminders
  ];

  const visibleNotifs =
    notifFilter === 'all'
      ? allNotifs
      : allNotifs.filter((item) => item.group === notifFilter);

  const totalNotifCount = allNotifs.length;
  const hasOverdue = overdueItems.length > 0;

  return (
    <header className="shrink-0 z-30 flex items-center justify-between gap-4 border-b border-white/[0.06] bg-[#07090e]/95 px-4 py-3.5 backdrop-blur-md sm:px-8">
      <div className="flex items-center gap-3 flex-1 max-w-md min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
          className="kp-btn rounded-xl border border-white/10 p-2 text-slate-300 hover:border-white/20 hover:bg-white/5 hover:text-white md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="group relative flex-1 min-w-0">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 transition-colors duration-150 group-focus-within:text-indigo-400" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => onSetGlobalSearch(e.target.value)}
            placeholder="Search tasks, habits, or notes..."
            className="w-full rounded-xl border border-white/[0.07] bg-[#111520] pl-10 pr-8 py-2 text-xs text-white placeholder-slate-500 transition-all duration-150 hover:border-white/15 focus:border-indigo-500 focus:bg-[#141926] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          {globalSearch && (
            <button
              type="button"
              onClick={() => onSetGlobalSearch('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Notification Center */}
        <div ref={notifDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => onSetNotifOpen((o) => !o)}
            aria-expanded={notifOpen}
            aria-label="Open notifications and reminders"
            className={`kp-btn relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
              notifOpen
                ? 'border-indigo-500/60 bg-indigo-500/15 text-white'
                : 'border-white/10 bg-[#111520] text-slate-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            <Bell className="h-4 w-4" />
            {totalNotifCount > 0 && (
              <span
                className={`
                  absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-extrabold text-white shadow
                  ${hasOverdue ? 'bg-rose-500' : 'bg-indigo-500'}
                `}
              >
                {totalNotifCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="kp-modal-enter absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-white/15 bg-[#0e121d]/95 p-3.5 shadow-2xl backdrop-blur-xl z-50">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                <div>
                  <div className="text-xs font-extrabold text-white">
                    Notifications & Protocol Feed
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {overdueItems.length} overdue · {upcomingTaskItems.length + upcomingScheduleItems.length} upcoming · {unloggedHabits.length} habit nudges
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSetNotifOpen(false)}
                  aria-label="Close notifications"
                  className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="mt-2.5 grid grid-cols-4 gap-1 rounded-xl bg-[#151a28] p-1">
                {[
                  { id: 'all' as const, label: `All (${allNotifs.length})` },
                  { id: 'overdue' as const, label: `Late (${overdueItems.length})` },
                  { id: 'upcoming' as const, label: `Next (${upcomingTaskItems.length + upcomingScheduleItems.length})` },
                  { id: 'reminders' as const, label: `Habits (${unloggedHabits.length + goalReminders.length})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onSetNotifFilter(tab.id)}
                    className={`rounded-lg py-1 text-[10px] font-bold transition ${
                      notifFilter === tab.id
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Notification Items List */}
              <div className="kinetic-scroll mt-2.5 max-h-72 overflow-y-auto space-y-2 pr-0.5">
                {visibleNotifs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 py-6 text-center text-xs text-slate-400">
                    All caught up in this category!
                  </div>
                ) : (
                  visibleNotifs.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-2.5 rounded-xl border border-white/[0.06] bg-[#141927] p-2.5 text-xs transition hover:border-indigo-500/35"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectNav(item.navTarget);
                          onSetNotifOpen(false);
                        }}
                        className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                      >
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                            item.group === 'overdue'
                              ? 'bg-rose-500/20 text-rose-400'
                              : item.group === 'upcoming'
                              ? 'bg-indigo-500/20 text-indigo-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {item.group === 'overdue' ? (
                            <AlertCircle className="h-3.5 w-3.5" />
                          ) : item.group === 'upcoming' ? (
                            <Clock className="h-3.5 w-3.5" />
                          ) : (
                            <Flame className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-bold text-white">{item.title}</div>
                          <div className="mt-0.5 truncate text-[11px] text-slate-400">
                            {item.meta}
                          </div>
                        </div>
                      </button>

                      {item.taskId && (
                        <button
                          type="button"
                          onClick={() => onToggleTask(item.taskId!)}
                          className="kp-btn shrink-0 rounded-lg bg-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950"
                        >
                          Done
                        </button>
                      )}
                      {item.scheduleId && (
                        <button
                          type="button"
                          onClick={() => onToggleSchedule(item.scheduleId!)}
                          className="kp-btn shrink-0 rounded-lg bg-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950"
                        >
                          Done
                        </button>
                      )}
                      {item.habit && (
                        <button
                          type="button"
                          onClick={() => onToggleHabit(item.habit!, todayISO, 'toggle')}
                          className="kp-btn shrink-0 rounded-lg bg-indigo-500/20 px-2 py-1 text-[10px] font-bold text-indigo-300 hover:bg-indigo-500 hover:text-white"
                        >
                          Log
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button with Hover Bubble */}
        <div
          className="group relative"
          onMouseEnter={() => onSetThemeTooltipOpen(true)}
          onMouseLeave={() => onSetThemeTooltipOpen(false)}
        >
          <button
            type="button"
            onClick={() => onSetThemeTooltipOpen((v: any) => !v)}
            onFocus={() => onSetThemeTooltipOpen(true)}
            onBlur={() => onSetThemeTooltipOpen(false)}
            aria-label="Theme toggle (under construction, coming soon)"
            className="kp-btn flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#111520] text-amber-300 hover:border-amber-400/40 hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Sun className="h-4 w-4 transition-transform duration-200 group-hover:rotate-45" />
          </button>

          <div
            role="tooltip"
            className={`pointer-events-none absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-2.5 w-52 rounded-xl border border-amber-400/30 bg-[#121726]/95 px-3 py-2 text-[11px] font-semibold text-amber-100 shadow-2xl backdrop-blur-md transition-all duration-150 z-50 ${
              themeTooltipOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
            }`}
          >
            <span
              aria-hidden="true"
              className="absolute -top-1.5 right-3 sm:left-1/2 sm:-translate-x-1/2 h-3 w-3 rotate-45 border-l border-t border-amber-400/30 bg-[#121726]"
            />
            <div className="relative flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span>Under construction — coming soon!</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenModal('schedule', null)}
          className="kp-btn hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 hover:shadow-indigo-500/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <Plus className="h-3.5 w-3.5" /> Add Plan
        </button>
        <button
          type="button"
          onClick={() => onSelectNav('settings')}
          title={`Operator Settings (${store.settings?.userName || 'Operator'})`}
          aria-label="Open Operator Settings"
          className="kp-btn flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 text-xs font-bold text-slate-950 ring-2 ring-transparent hover:ring-indigo-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {(store.settings?.userName || 'A').slice(0, 1).toUpperCase()}
        </button>
      </div>
    </header>
  );
}
