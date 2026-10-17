import type { LucideIcon } from 'lucide-react';

export type CategoryKey = 'Math' | 'Code' | 'Fitness' | 'Quant' | 'Deep Work' | 'General' | string;

export interface CategoryConfig {
  label: string;
  color: string;
  bg: string;
  text: string;
  border: string;
  accent: string;
  pillBg: string;
  pillText: string;
  icon: LucideIcon;
}

export interface HabitSchedule {
  type: 'daily' | 'weekdays' | string;
  weekdays: number[]; // 0=Mon, 1=Tue, ..., 6=Sun
  weeklyTarget: number;
}

export interface Habit {
  id: string;
  title: string;
  description: string;
  category: CategoryKey;
  trackingType: 'binary' | 'duration' | 'count' | 'numeric' | string;
  targetValue: number;
  minViableValue: number;
  unit: string;
  schedule: HabitSchedule;
  startDate: string;
  endDate?: string;
  archivedAt: string | null;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  value: number;
  status: 'completed' | 'mvd' | 'partial' | string;
  note?: string;
  updatedAt?: string;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  scheduledDaysCount: number;
  completedScheduledCount: number;
  todayDone: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  priority: 'low' | 'medium' | 'high' | string;
  status: 'todo' | 'completed' | string;
  category: CategoryKey;
  goalId?: string | null;
  recurrence?: 'none' | 'daily' | 'weekdays' | string;
  createdAt?: string;
  completedAt?: string | null;
}

export interface GoalMilestone {
  id: string;
  title: string;
  done: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  topic?: string;
  category: CategoryKey;
  startDate?: string;
  targetDate: string;
  status: string;
  pinned?: boolean;
  bannerGradient?: string;
  metricType: 'numeric' | 'milestones' | string;
  currentValue: number;
  targetValue: number;
  unit?: string;
  milestones?: GoalMilestone[];
}

export interface ScheduleBlock {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  plannedMinutes: number;
  actualMinutes: number;
  category: CategoryKey;
  linkedGoalId?: string | null;
  linkedTaskId?: string | null;
  recurrence: 'none' | 'daily' | 'weekdays' | string;
  completed: boolean;
  notes?: string;
}

export interface NoteAttachment {
  storageKey: string;
  name: string;
  size: number;
  type: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: CategoryKey;
  tags?: string[];
  linkedGoalId?: string | null;
  referenceUrl?: string;
  attachment?: NoteAttachment | null;
  updatedAt?: string;
}

export interface JournalEntry {
  id?: string;
  date?: string;
  wentWell: string;
  wasDifficult: string;
  lessonsLearned: string;
  improveTomorrow: string;
  updatedAt?: string;
}

export interface KineticSettings {
  userName: string;
  weekStartsOnMonday: boolean;
  timeFormat24h: boolean;
  reducedMotion: boolean;
  defaultCalendarView: string;
  dailyFocusTargetMinutes: number;
  maxPdfSizeMB: number;
}

export interface KineticStore {
  version: number;
  isStarterWorkspace: boolean;
  migrationLog: string[];
  habits: Habit[];
  habitEntries: Record<string, Record<string, HabitEntry>>;
  tasks: Task[];
  goals: Goal[];
  schedules: ScheduleBlock[];
  notes: Note[];
  journals: Record<string, JournalEntry>;
  settings: KineticSettings;
}

/* UI and Transient States */
export type ActiveNavId =
  | 'overview'
  | 'calendar'
  | 'tasks'
  | 'goals'
  | 'schedules'
  | 'habits'
  | 'statistics'
  | 'notes'
  | 'journal'
  | 'settings'
  | 'backup';

export type ActiveModalType = 'task' | 'habit' | 'schedule' | 'goal' | 'note' | 'pdfPreview' | null;

export interface ToastState {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
}

export interface UndoBannerState {
  collectionKey: 'tasks' | 'habits' | 'schedules' | 'notes' | 'goals';
  item: any;
  label: string;
}

export interface PdfPreviewState {
  storageKey: string;
  name: string;
  size: number;
  type: string;
  url: string;
  attachment?: NoteAttachment;
}

export interface NotificationItem {
  id: string;
  group: 'overdue' | 'upcoming' | 'reminders';
  title: string;
  meta: string;
  category: string;
  navTarget: ActiveNavId;
  taskId?: string;
  scheduleId?: string;
  habit?: Habit;
}
