import React, { useState, useEffect, useMemo, useRef } from 'react';
import type {
  KineticStore,
  ActiveNavId,
  ActiveModalType,
  ToastState,
  UndoBannerState,
  PdfPreviewState,
  Habit,
  NoteAttachment
} from '../store/types';
import { STORAGE_KEY_V2 } from '../store/constants';
import { toLocalISO, getWeekDatesISO } from '../utils/dates';
import { formatFileSize } from '../utils/formatting';
import { generateResetChallengeCode } from '../utils/security';
import { idbGetPdfBlob, idbSavePdfBlob } from '../services/indexedDB';
import { generateSamplePythonRoadmapPdfBlob } from '../services/samplePdf';
import { loadAndMigrateStore } from '../store/storageMigration';
import {
  getSchedulesForDate,
  computeHabitStatsById,
  computeWeeklyMetrics
} from '../store/selectors';
import { isEntrySatisfied } from '../features/habits/habitCalculations';
import { useReducedMotion } from '../hooks/useReducedMotion';

import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { MobileNav } from '../components/layout/MobileNav';
import { Toast } from '../components/ui/Toast';
import { UndoBanner } from '../components/ui/UndoBanner';
import { Modal } from '../components/ui/Modal';

import { OverviewView } from '../features/overview/OverviewView';
import { CalendarView } from '../features/calendar/CalendarView';
import { TasksView } from '../features/tasks/TasksView';
import { GoalsView } from '../features/goals/GoalsView';
import { SchedulesView } from '../features/schedules/SchedulesView';
import { HabitsView } from '../features/habits/HabitsView';
import { StatisticsView } from '../features/statistics/StatisticsView';
import { NotesView } from '../features/notes/NotesView';
import { JournalView } from '../features/journal/JournalView';
import { SettingsView } from '../features/settings/SettingsView';
import { BackupView } from '../features/backup/BackupView';

export default function App() {
  const todayISO = useMemo(() => toLocalISO(new Date()), []);
  const [store, setStore] = useState<KineticStore>(() => loadAndMigrateStore(todayISO));
  const [activeNav, setActiveNav] = useState<ActiveNavId>('overview');
  const [selectedDateISO, setSelectedDateISO] = useState<string>(todayISO);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [undoBanner, setUndoBanner] = useState<UndoBannerState | null>(null);

  // Sub-view states across modules
  const [calendarMode, setCalendarMode] = useState<'month' | 'week' | 'day' | 'heatmap'>('month');
  const [calendarMonthCursor, setCalendarMonthCursor] = useState<string>(() => todayISO.slice(0, 7));
  const [taskFilter, setTaskFilter] = useState<'all' | 'today' | 'upcoming' | 'completed' | 'overdue'>('all');
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>('All');
  const [habitCategoryFilter, setHabitCategoryFilter] = useState<string>('All');

  // Statistics timeframe & chart states
  const [statsTimeframe, setStatsTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [statsSeriesFilter, setStatsSeriesFilter] = useState<'all' | 'planned' | 'actual' | 'velocity'>('all');
  const [statsHoverIdx, setStatsHoverIdx] = useState<number | null>(null);
  const [hoveredAllocationCat, setHoveredAllocationCat] = useState<string | null>(null);

  // Header notifications & theme toggle
  const [notifOpen, setNotifOpen] = useState<boolean>(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'overdue' | 'upcoming' | 'reminders'>('all');
  const [themeTooltipOpen, setThemeTooltipOpen] = useState<boolean>(false);

  // Checklist ripple effect & streak pulse
  const [checkRipples, setCheckRipples] = useState<Record<string, number>>({});
  const [streakPulseByHabit, setStreakPulseByHabit] = useState<Record<string, number>>({});
  const prevStreaksRef = useRef<Record<string, number>>({});

  // Settings challenge
  const [resetPanelOpen, setResetPanelOpen] = useState<boolean>(false);
  const [resetChallengeCode, setResetChallengeCode] = useState<string>(() =>
    generateResetChallengeCode(12)
  );
  const [resetTypedCode, setResetTypedCode] = useState<string>('');

  // Modals state
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [isModalClosing, setIsModalClosing] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [pdfPreviewState, setPdfPreviewState] = useState<PdfPreviewState | null>(null);
  const [downloadingKeys, setDownloadingKeys] = useState<Record<string, boolean>>({});
  const [downloadedKeys, setDownloadedKeys] = useState<Record<string, boolean>>({});
  const [isToastClosing, setIsToastClosing] = useState<boolean>(false);
  const [isUndoClosing, setIsUndoClosing] = useState<boolean>(false);
  const [badgePulse, setBadgePulse] = useState<boolean>(false);

  const effectiveReducedMotion = useReducedMotion(store.settings?.reducedMotion);

  const mainScrollRef = useRef<HTMLElement>(null);
  const activePreviewUrlRef = useRef<string | null>(null);
  const downloadUrlsRef = useRef<Set<string>>(new Set());
  const modalCloseTimerRef = useRef<any>(null);
  const prevTaskBadgeRef = useRef<number | null>(null);

  // Clean up any active object URLs or timers on unmount
  useEffect(() => {
    return () => {
      if (modalCloseTimerRef.current) {
        clearTimeout(modalCloseTimerRef.current);
      }
      if (activePreviewUrlRef.current) {
        URL.revokeObjectURL(activePreviewUrlRef.current);
        activePreviewUrlRef.current = null;
      }
      downloadUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      downloadUrlsRef.current.clear();
    };
  }, []);

  // Reset main viewport scroll position on section switch
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [activeNav]);

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setIsToastClosing(false);
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    if (!toast) return;
    const exitDelay = effectiveReducedMotion ? 3000 : 2950;
    const removeDelay = effectiveReducedMotion ? 3010 : 3150;
    const tExit = setTimeout(() => {
      if (!effectiveReducedMotion) setIsToastClosing(true);
    }, exitDelay);
    const tRemove = setTimeout(() => {
      setToast(null);
      setIsToastClosing(false);
    }, removeDelay);
    return () => {
      clearTimeout(tExit);
      clearTimeout(tRemove);
    };
  }, [toast, effectiveReducedMotion]);

  // Persist store changes to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(store));
    } catch (e) {
      console.error('Failed to persist store:', e);
    }
  }, [store]);

  // Seed starter PDF blob into IndexedDB so the sample note attachment previews immediately
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const existing = await idbGetPdfBlob('starter_python_roadmap_pdf');
        if (!existing && mounted) {
          const sampleBlob = generateSamplePythonRoadmapPdfBlob();
          await idbSavePdfBlob('starter_python_roadmap_pdf', sampleBlob, 'application/pdf');
        }
      } catch {
        // Ignore if IndexedDB is restricted
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const triggerCheckRipple = (rippleKey: string) => {
    if (effectiveReducedMotion) return;
    const stamp = Date.now() + Math.random();
    setCheckRipples((prev) => ({ ...prev, [rippleKey]: stamp }));
  };

  const weekDatesISO = useMemo(
    () => getWeekDatesISO(selectedDateISO, store.settings?.weekStartsOnMonday ?? true),
    [selectedDateISO, store.settings?.weekStartsOnMonday]
  );

  const activeHabits = useMemo(
    () => (store.habits || []).filter((h) => !h.archivedAt),
    [store.habits]
  );

  const habitStatsById = useMemo(
    () => computeHabitStatsById(store.habits || [], store.habitEntries || {}, todayISO),
    [store.habits, store.habitEntries, todayISO]
  );

  // Pulse habit streak counter in real time whenever streak changes
  useEffect(() => {
    const prevMap = prevStreaksRef.current || {};
    const changedIds: string[] = [];
    Object.entries(habitStatsById).forEach(([hid, st]) => {
      if (prevMap[hid] !== undefined && prevMap[hid] !== st.currentStreak) {
        changedIds.push(hid);
      }
      prevMap[hid] = st.currentStreak;
    });
    prevStreaksRef.current = prevMap;

    if (changedIds.length > 0 && !effectiveReducedMotion) {
      const now = Date.now();
      setStreakPulseByHabit((prev) => {
        const next = { ...prev };
        changedIds.forEach((id) => {
          next[id] = now;
        });
        return next;
      });
    }
  }, [habitStatsById, effectiveReducedMotion]);

  const todaySchedules = useMemo(
    () => getSchedulesForDate(store.schedules || [], selectedDateISO),
    [store.schedules, selectedDateISO]
  );

  const todayTasks = useMemo(
    () => (store.tasks || []).filter((t) => t.dueDate === selectedDateISO),
    [store.tasks, selectedDateISO]
  );

  const todayScheduledHabits = useMemo(
    () => activeHabits.filter((h) => h.startDate <= selectedDateISO),
    [activeHabits, selectedDateISO]
  );

  const todayCompletedHabitsCount = useMemo(() => {
    return todayScheduledHabits.filter((h) => {
      const entry = store.habitEntries?.[h.id]?.[selectedDateISO];
      return isEntrySatisfied(h, entry);
    }).length;
  }, [todayScheduledHabits, store.habitEntries, selectedDateISO]);

  const weeklyMetrics = useMemo(
    () =>
      computeWeeklyMetrics(
        weekDatesISO,
        store.schedules || [],
        store.tasks || [],
        store.goals || [],
        store.habits || [],
        store.habitEntries || {},
        todaySchedules
      ),
    [weekDatesISO, store.schedules, store.tasks, store.goals, store.habits, store.habitEntries, todaySchedules]
  );

  const pendingTasksBadgeCount = useMemo(
    () => (store.tasks || []).filter((t) => t.status !== 'completed').length,
    [store.tasks]
  );

  useEffect(() => {
    if (prevTaskBadgeRef.current === null) {
      prevTaskBadgeRef.current = pendingTasksBadgeCount;
      return;
    }
    if (prevTaskBadgeRef.current !== pendingTasksBadgeCount) {
      prevTaskBadgeRef.current = pendingTasksBadgeCount;
      if (!effectiveReducedMotion) {
        setBadgePulse(true);
        const t = setTimeout(() => setBadgePulse(false), 240);
        return () => clearTimeout(t);
      }
    }
  }, [pendingTasksBadgeCount, effectiveReducedMotion]);

  // Actions
  const toggleHabitOnDate = (habit: Habit, dateISO: string, mode: 'toggle' | 'mvd' | 'full' = 'full') => {
    triggerCheckRipple(`hab-${habit.id}-${dateISO}`);
    setStore((prev) => {
      const existingForHabit = { ...(prev.habitEntries?.[habit.id] || {}) };
      const current = existingForHabit[dateISO];
      const satisfied = isEntrySatisfied(habit, current);

      if (satisfied && mode === 'toggle') {
        delete existingForHabit[dateISO];
      } else {
        const val =
          mode === 'mvd'
            ? Number(habit.minViableValue) || 1
            : Number(habit.targetValue) || 1;
        existingForHabit[dateISO] = {
          id: `he-${habit.id}-${dateISO}`,
          habitId: habit.id,
          date: dateISO,
          value: val,
          status: mode === 'mvd' ? 'mvd' : 'completed',
          note: current?.note || '',
          updatedAt: new Date().toISOString()
        };
      }

      return {
        ...prev,
        isStarterWorkspace: false,
        habitEntries: {
          ...(prev.habitEntries || {}),
          [habit.id]: existingForHabit
        }
      };
    });
  };

  const updateHabitQuantitativeValue = (habit: Habit, dateISO: string, rawValue: any) => {
    const val = Math.max(0, Number(rawValue) || 0);
    setStore((prev) => {
      const existingForHabit = { ...(prev.habitEntries?.[habit.id] || {}) };
      if (val <= 0) {
        delete existingForHabit[dateISO];
      } else {
        const target = Number(habit.targetValue) || 1;
        const mvd = Number(habit.minViableValue) || target;
        const status = val >= target ? 'completed' : val >= mvd ? 'mvd' : 'partial';
        existingForHabit[dateISO] = {
          id: `he-${habit.id}-${dateISO}`,
          habitId: habit.id,
          date: dateISO,
          value: val,
          status,
          note: existingForHabit[dateISO]?.note || '',
          updatedAt: new Date().toISOString()
        };
      }
      return {
        ...prev,
        isStarterWorkspace: false,
        habitEntries: {
          ...(prev.habitEntries || {}),
          [habit.id]: existingForHabit
        }
      };
    });
  };

  const toggleTaskStatus = (taskId: string) => {
    triggerCheckRipple(`task-${taskId}`);
    setStore((prev) => ({
      ...prev,
      isStarterWorkspace: false,
      tasks: (prev.tasks || []).map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: t.status === 'completed' ? 'todo' : 'completed',
              completedAt: t.status === 'completed' ? null : new Date().toISOString()
            }
          : t
      )
    }));
  };

  const toggleScheduleCompletion = (scheduleId: string) => {
    triggerCheckRipple(`sch-${scheduleId}`);
    setStore((prev) => ({
      ...prev,
      isStarterWorkspace: false,
      schedules: (prev.schedules || []).map((s) =>
        s.id === scheduleId
          ? {
              ...s,
              completed: !s.completed,
              actualMinutes: !s.completed ? s.plannedMinutes : 0
            }
          : s
      )
    }));
  };

  const toggleGoalMilestone = (goalId: string, milestoneId: string) => {
    triggerCheckRipple(`ms-${goalId}-${milestoneId}`);
    setStore((prev) => ({
      ...prev,
      isStarterWorkspace: false,
      goals: (prev.goals || []).map((g) => {
        if (g.id !== goalId) return g;
        const updatedMilestones = (g.milestones || []).map((m) =>
          m.id === milestoneId ? { ...m, done: !m.done } : m
        );
        const doneCount = updatedMilestones.filter((m) => m.done).length;
        return {
          ...g,
          milestones: updatedMilestones,
          currentValue: g.metricType === 'milestones' ? doneCount : g.currentValue
        };
      })
    }));
  };

  const dismissUndoBanner = () => {
    if (!undoBanner) return;
    if (effectiveReducedMotion) {
      setUndoBanner(null);
      setIsUndoClosing(false);
      return;
    }
    setIsUndoClosing(true);
    setTimeout(() => {
      setUndoBanner(null);
      setIsUndoClosing(false);
    }, 170);
  };

  const deleteWithUndo = (
    collectionKey: 'tasks' | 'habits' | 'schedules' | 'notes' | 'goals',
    itemId: string,
    label: string = 'Record'
  ) => {
    const targetItem = (store[collectionKey] || []).find((x: any) => x.id === itemId);
    if (!targetItem) return;
    setIsUndoClosing(false);
    setUndoBanner({
      collectionKey,
      item: targetItem,
      label
    });
    setStore((prev) => ({
      ...prev,
      [collectionKey]: ((prev[collectionKey] || []) as any[]).filter((x) => x.id !== itemId)
    }));
  };

  const handleRestoreUndo = () => {
    if (!undoBanner) return;
    const restoredLabel = undoBanner.label;
    setStore((prev) => ({
      ...prev,
      [undoBanner.collectionKey]: [undoBanner.item, ...((prev[undoBanner.collectionKey] || []) as any[])]
    }));
    if (effectiveReducedMotion) {
      setUndoBanner(null);
      setIsUndoClosing(false);
    } else {
      setIsUndoClosing(true);
      setTimeout(() => {
        setUndoBanner(null);
        setIsUndoClosing(false);
      }, 170);
    }
    showToast(`${restoredLabel} restored.`, 'success');
  };

  const openModal = (modalType: ActiveModalType, record: any = null) => {
    if (modalCloseTimerRef.current) {
      clearTimeout(modalCloseTimerRef.current);
      modalCloseTimerRef.current = null;
    }
    setIsModalClosing(false);
    setEditingRecord(record);
    setActiveModal(modalType);
  };

  const closeModal = () => {
    if (!activeModal || isModalClosing) return;
    const finalizeClose = () => {
      if (activePreviewUrlRef.current) {
        URL.revokeObjectURL(activePreviewUrlRef.current);
        activePreviewUrlRef.current = null;
      }
      setPdfPreviewState(null);
      setActiveModal(null);
      setEditingRecord(null);
      setIsModalClosing(false);
      modalCloseTimerRef.current = null;
    };

    if (effectiveReducedMotion) {
      finalizeClose();
      return;
    }

    setIsModalClosing(true);
    modalCloseTimerRef.current = setTimeout(finalizeClose, 200);
  };

  useEffect(() => {
    if (!activeModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeModal, isModalClosing, effectiveReducedMotion]);

  const openPdfPreview = async (attachment: NoteAttachment) => {
    const storageKey = attachment?.storageKey;
    if (!attachment || typeof storageKey !== 'string' || !storageKey.trim()) {
      showToast('Invalid PDF attachment metadata (missing storage key).', 'error');
      return;
    }
    try {
      const blob = await idbGetPdfBlob(storageKey);
      if (!blob || !(blob instanceof Blob) || blob.size === 0) {
        showToast('PDF binary not found in local IndexedDB.', 'error');
        return;
      }
      if (modalCloseTimerRef.current) {
        clearTimeout(modalCloseTimerRef.current);
        modalCloseTimerRef.current = null;
      }
      if (activePreviewUrlRef.current) {
        URL.revokeObjectURL(activePreviewUrlRef.current);
        activePreviewUrlRef.current = null;
      }
      const pdfBlob =
        blob.type === 'application/pdf'
          ? blob
          : new Blob([blob], { type: attachment.type || 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      activePreviewUrlRef.current = url;
      setIsModalClosing(false);
      setPdfPreviewState({
        storageKey,
        name: attachment.name || 'Document.pdf',
        size: attachment.size || pdfBlob.size,
        type: attachment.type || 'application/pdf',
        attachment,
        url
      });
      setActiveModal('pdfPreview');
    } catch (e: any) {
      showToast(e?.message || 'Could not open PDF preview.', 'error');
    }
  };

  const downloadPdfAttachment = async (attachment: NoteAttachment) => {
    const storageKey = attachment?.storageKey;
    if (!attachment || typeof storageKey !== 'string' || !storageKey.trim()) {
      showToast('Invalid PDF attachment metadata (missing storage key).', 'error');
      return;
    }
    if (downloadingKeys[storageKey]) return;

    setDownloadingKeys((prev) => ({ ...prev, [storageKey]: true }));
    try {
      const blob = await idbGetPdfBlob(storageKey);
      if (!blob || !(blob instanceof Blob) || blob.size === 0) {
        showToast('PDF binary not found in local IndexedDB.', 'error');
        return;
      }

      const rawName =
        typeof attachment.name === 'string' && attachment.name.trim()
          ? attachment.name.trim()
          : 'document.pdf';
      const safeFilename = /\.pdf$/i.test(rawName) ? rawName : `${rawName}.pdf`;

      const pdfBlob =
        blob.type === 'application/pdf'
          ? blob
          : new Blob([blob], { type: attachment.type || 'application/pdf' });

      const objectUrl = URL.createObjectURL(pdfBlob);
      downloadUrlsRef.current.add(objectUrl);

      const anchor = document.createElement('a');
      anchor.style.display = 'none';
      anchor.href = objectUrl;
      anchor.download = safeFilename;
      anchor.rel = 'noopener';
      document.body.appendChild(anchor);
      anchor.click();
      if (anchor.parentNode) {
        anchor.parentNode.removeChild(anchor);
      }

      setTimeout(() => {
        if (downloadUrlsRef.current.has(objectUrl)) {
          URL.revokeObjectURL(objectUrl);
          downloadUrlsRef.current.delete(objectUrl);
        }
      }, 1500);

      setDownloadedKeys((prev) => ({ ...prev, [storageKey]: true }));
      setTimeout(() => {
        setDownloadedKeys((prev) => {
          if (!prev[storageKey]) return prev;
          const next = { ...prev };
          delete next[storageKey];
          return next;
        });
      }, 1800);

      showToast(`Downloaded "${safeFilename}" (${formatFileSize(attachment.size || pdfBlob.size)}).`, 'success');
    } catch (e: any) {
      showToast(e?.message || 'Failed to download PDF from IndexedDB.', 'error');
    } finally {
      setDownloadingKeys((prev) => {
        const next = { ...prev };
        delete next[storageKey];
        return next;
      });
    }
  };

  return (
    <div
      className={`kp-app-shell flex h-screen h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#07090e] text-slate-100 selection:bg-indigo-500 selection:text-white ${
        effectiveReducedMotion ? 'kp-reduced-motion' : ''
      }`}
    >
      {/* Desktop Sidebar */}
      <Sidebar
        activeNav={activeNav}
        sidebarCollapsed={sidebarCollapsed}
        selectedDateISO={selectedDateISO}
        pendingTasksBadgeCount={pendingTasksBadgeCount}
        badgePulse={badgePulse}
        onSelectNav={setActiveNav}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      {/* Main Application Column */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0 h-full overflow-hidden">
        {/* Stationary Top Header */}
        <Header
          store={store}
          globalSearch={globalSearch}
          mobileMenuOpen={mobileMenuOpen}
          notifOpen={notifOpen}
          notifFilter={notifFilter}
          themeTooltipOpen={themeTooltipOpen}
          todayISO={todayISO}
          todaySchedules={todaySchedules}
          todayScheduledHabits={todayScheduledHabits}
          onSetGlobalSearch={setGlobalSearch}
          onToggleMobileMenu={() => setMobileMenuOpen((o) => !o)}
          onSetNotifOpen={setNotifOpen}
          onSetNotifFilter={setNotifFilter}
          onSetThemeTooltipOpen={setThemeTooltipOpen}
          onOpenModal={openModal}
          onSelectNav={setActiveNav}
          onToggleTask={toggleTaskStatus}
          onToggleSchedule={toggleScheduleCompletion}
          onToggleHabit={toggleHabitOnDate}
        />

        {/* Mobile Drawer Navigation */}
        <MobileNav
          mobileMenuOpen={mobileMenuOpen}
          activeNav={activeNav}
          pendingTasksBadgeCount={pendingTasksBadgeCount}
          onSelectNav={setActiveNav}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
        />

        {/* Undo Banner Notification */}
        <UndoBanner
          undoBanner={undoBanner}
          isClosing={isUndoClosing}
          reducedMotion={effectiveReducedMotion}
          onRestore={handleRestoreUndo}
          onDismiss={dismissUndoBanner}
        />

        {/* Toast Notification */}
        <Toast
          toast={toast}
          isClosing={isToastClosing}
          reducedMotion={effectiveReducedMotion}
        />

        {/* Active Module Scrollable Viewport */}
        <main
          ref={mainScrollRef}
          className="kinetic-scroll flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden overscroll-y-contain p-4 sm:p-8"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div key={activeNav} className={effectiveReducedMotion ? '' : 'kp-page-transition'}>
              {activeNav === 'overview' && (
                <OverviewView
                  store={store}
                  weeklyMetrics={weeklyMetrics}
                  habitStatsById={habitStatsById}
                  todaySchedules={todaySchedules}
                  todayTasks={todayTasks}
                  todayScheduledHabits={todayScheduledHabits}
                  todayCompletedHabitsCount={todayCompletedHabitsCount}
                  activeHabits={activeHabits}
                  selectedDateISO={selectedDateISO}
                  todayISO={todayISO}
                  weekDatesISO={weekDatesISO}
                  reducedMotion={effectiveReducedMotion}
                  checkRipples={checkRipples}
                  onSelectDate={setSelectedDateISO}
                  onSelectNav={setActiveNav}
                  onOpenModal={openModal}
                  onToggleScheduleCompletion={toggleScheduleCompletion}
                  onToggleHabitOnDate={toggleHabitOnDate}
                  onCleanWorkspace={() => {
                    setStore((prev) => ({
                      ...prev,
                      isStarterWorkspace: false,
                      habits: [],
                      habitEntries: {},
                      tasks: [],
                      goals: [],
                      schedules: [],
                      notes: [],
                      journals: {}
                    }));
                    showToast('Initialized clean, empty Kinetic OS workspace.', 'success');
                  }}
                  onKeepWorkspace={() =>
                    setStore((prev) => ({ ...prev, isStarterWorkspace: false }))
                  }
                />
              )}

              {activeNav === 'calendar' && (
                <CalendarView
                  store={store}
                  calendarMode={calendarMode}
                  calendarMonthCursor={calendarMonthCursor}
                  selectedDateISO={selectedDateISO}
                  todayISO={todayISO}
                  weekDatesISO={weekDatesISO}
                  todaySchedules={todaySchedules}
                  todayTasks={todayTasks}
                  activeHabits={activeHabits}
                  todayScheduledHabits={todayScheduledHabits}
                  todayCompletedHabitsCount={todayCompletedHabitsCount}
                  reducedMotion={effectiveReducedMotion}
                  onSetCalendarMode={setCalendarMode}
                  onSetCalendarMonthCursor={setCalendarMonthCursor}
                  onSelectDate={setSelectedDateISO}
                  onToggleHabitOnDate={toggleHabitOnDate}
                  onToggleScheduleCompletion={toggleScheduleCompletion}
                  onToggleTaskStatus={toggleTaskStatus}
                />
              )}

              {activeNav === 'tasks' && (
                <TasksView
                  tasks={store.tasks || []}
                  taskFilter={taskFilter}
                  taskCategoryFilter={taskCategoryFilter}
                  globalSearch={globalSearch}
                  todayISO={todayISO}
                  checkRipples={checkRipples}
                  onSetTaskFilter={setTaskFilter}
                  onOpenModal={openModal}
                  onToggleTaskStatus={toggleTaskStatus}
                  onDeleteWithUndo={deleteWithUndo}
                />
              )}

              {activeNav === 'goals' && (
                <GoalsView
                  store={store}
                  reducedMotion={effectiveReducedMotion}
                  checkRipples={checkRipples}
                  onOpenModal={openModal}
                  onToggleGoalMilestone={toggleGoalMilestone}
                />
              )}

              {activeNav === 'schedules' && (
                <SchedulesView
                  selectedDateISO={selectedDateISO}
                  todaySchedules={todaySchedules}
                  onOpenModal={openModal}
                  onToggleScheduleCompletion={toggleScheduleCompletion}
                  onDeleteWithUndo={deleteWithUndo}
                />
              )}

              {activeNav === 'habits' && (
                <HabitsView
                  store={store}
                  activeHabits={activeHabits}
                  habitCategoryFilter={habitCategoryFilter}
                  habitStatsById={habitStatsById}
                  streakPulseByHabit={streakPulseByHabit}
                  checkRipples={checkRipples}
                  selectedDateISO={selectedDateISO}
                  todayISO={todayISO}
                  weekDatesISO={weekDatesISO}
                  reducedMotion={effectiveReducedMotion}
                  onSetHabitCategoryFilter={setHabitCategoryFilter}
                  onSelectDate={setSelectedDateISO}
                  onOpenModal={openModal}
                  onDeleteWithUndo={deleteWithUndo}
                  onToggleHabitOnDate={toggleHabitOnDate}
                  onUpdateHabitQuantitativeValue={updateHabitQuantitativeValue}
                  onTriggerCheckRipple={triggerCheckRipple}
                />
              )}

              {activeNav === 'statistics' && (
                <StatisticsView
                  store={store}
                  selectedDateISO={selectedDateISO}
                  todayISO={todayISO}
                  statsTimeframe={statsTimeframe}
                  statsSeriesFilter={statsSeriesFilter}
                  statsHoverIdx={statsHoverIdx}
                  hoveredAllocationCat={hoveredAllocationCat}
                  weeklyMetrics={weeklyMetrics}
                  onSetStatsTimeframe={setStatsTimeframe}
                  onSetStatsSeriesFilter={setStatsSeriesFilter}
                  onSetStatsHoverIdx={setStatsHoverIdx}
                  onSetHoveredAllocationCat={setHoveredAllocationCat}
                  onNavigateToCalendarHeatmap={() => {
                    setCalendarMode('heatmap');
                    setActiveNav('calendar');
                  }}
                />
              )}

              {activeNav === 'notes' && (
                <NotesView
                  store={store}
                  downloadingKeys={downloadingKeys}
                  downloadedKeys={downloadedKeys}
                  onOpenModal={openModal}
                  onDeleteWithUndo={deleteWithUndo}
                  onOpenPdfPreview={openPdfPreview}
                  onDownloadPdf={downloadPdfAttachment}
                />
              )}

              {activeNav === 'journal' && (
                <JournalView
                  store={store}
                  selectedDateISO={selectedDateISO}
                  todayISO={todayISO}
                  onUpdateJournal={setStore}
                  onSelectDate={setSelectedDateISO}
                />
              )}

              {activeNav === 'settings' && (
                <SettingsView
                  store={store}
                  resetPanelOpen={resetPanelOpen}
                  resetChallengeCode={resetChallengeCode}
                  resetTypedCode={resetTypedCode}
                  prefersReducedMotion={effectiveReducedMotion}
                  onUpdateSettings={setStore}
                  onSetResetPanelOpen={setResetPanelOpen}
                  onSetResetChallengeCode={setResetChallengeCode}
                  onSetResetTypedCode={setResetTypedCode}
                  onResetComplete={(freshStore) => {
                    setStore(freshStore);
                    setUndoBanner(null);
                    setResetTypedCode('');
                    setResetPanelOpen(false);
                  }}
                  showToast={showToast}
                />
              )}

              {activeNav === 'backup' && (
                <BackupView
                  store={store}
                  todayISO={todayISO}
                  onRestoreStore={setStore}
                  showToast={showToast}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Global Modals & PDF Viewer */}
      <Modal
        activeModal={activeModal}
        isModalClosing={isModalClosing}
        reducedMotion={effectiveReducedMotion}
        editingRecord={editingRecord}
        pdfPreviewState={pdfPreviewState}
        downloadingKeys={downloadingKeys}
        selectedDateISO={selectedDateISO}
        todayISO={todayISO}
        onClose={closeModal}
        onSaveStore={setStore}
        onDownloadPdf={downloadPdfAttachment}
        showToast={showToast}
      />
    </div>
  );
}
