import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Flame,
  Check,
  Plus,
  RotateCcw,
  Trash2,
  Edit3,
  Sparkles,
  TrendingUp,
  Calendar as CalendarIcon,
  Award,
  BookOpen,
  Code2,
  Dumbbell,
  LineChart,
  Zap,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Filter,
  LayoutDashboard,
  CheckSquare,
  Target,
  Clock,
  BarChart3,
  FolderOpen,
  BookMarked,
  Settings as SettingsIcon,
  Database,
  Search,
  Pin,
  AlertCircle,
  Download,
  Upload,
  Play,
  Archive,
  RefreshCw,
  FileText,
  Link as LinkIcon,
  Menu,
  Sliders,
  ArrowUpRight,
  Layers,
  Timer,
  Eye,
  Paperclip,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  HardDrive,
  ShieldAlert,
  Bell,
  Sun,
  Moon,
  PieChart
} from 'lucide-react';

const IDB_DB_NAME = 'kinetic_protocol_attachments_db';
const IDB_STORE_NAME = 'pdf_binaries';
const DEFAULT_MAX_PDF_MB = 20;

function openAttachmentDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }
    const req = indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME, { keyPath: 'storageKey' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB.'));
  });
}

async function idbSavePdfBlob(storageKey, blob, mimeType = 'application/pdf') {
  const db = await openAttachmentDB();
  const arrayBuffer = await blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(IDB_STORE_NAME);
    store.put({
      storageKey,
      bytes: arrayBuffer,
      mimeType,
      savedAt: new Date().toISOString()
    });
    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('IndexedDB write failed (storage quota may be exceeded).'));
    };
  });
}

async function idbGetPdfBlob(storageKey) {
  const db = await openAttachmentDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readonly');
    const store = tx.objectStore(IDB_STORE_NAME);
    const req = store.get(storageKey);
    req.onsuccess = () => {
      db.close();
      const res = req.result;
      if (!res || !res.bytes) {
        resolve(null);
        return;
      }
      resolve(new Blob([res.bytes], { type: res.mimeType || 'application/pdf' }));
    };
    req.onerror = () => {
      db.close();
      reject(req.error || new Error('Failed to read PDF from IndexedDB.'));
    };
  });
}

async function idbDeletePdfBlob(storageKey) {
  const db = await openAttachmentDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(IDB_STORE_NAME);
    store.delete(storageKey);
    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function idbListAllKeys() {
  try {
    const db = await openAttachmentDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.getAllKeys();
      req.onsuccess = () => {
        db.close();
        resolve(req.result || []);
      };
      req.onerror = () => {
        db.close();
        resolve([]);
      };
    });
  } catch {
    return [];
  }
}

async function computeBufferSHA256(arrayBuffer) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuf = await crypto.subtle.digest('SHA-256', arrayBuffer);
    return Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  const bytes = new Uint8Array(arrayBuffer);
  let h = 2166136261;
  for (let i = 0; i < bytes.length; i += Math.max(1, Math.floor(bytes.length / 4096))) {
    h ^= bytes[i];
    h = Math.imul(h, 16777619);
  }
  return `fnv-${(h >>> 0).toString(16)}-${bytes.length}`;
}

function formatFileSize(bytes) {
  const b = Number(bytes) || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

// Generate a real, standards-compliant multi-section PDF binary for the starter "python_roadmap.pdf"
function generateSamplePythonRoadmapPdfBlob() {
  const lines = [
    '%PDF-1.4',
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    '4 0 obj << /Length 265 >> stream',
    'BT /F1 18 Tf 50 730 Td (KINETIC PROTOCOL - PYTHON & SYSTEMS ROADMAP) Tj',
    '/F1 11 Tf 0 -32 Td (Phase 1: Core Data Structures, Asymptotic Analysis & Memory Model) Tj',
    '0 -22 Td (Phase 2: C++20 STL, Graphs, Dynamic Programming & Bit Manipulation) Tj',
    '0 -22 Td (Phase 3: Quantitative Backtesting, Vectorized NumPy & Low-Latency I/O) Tj',
    'ET',
    'endstream endobj',
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    'xref',
    '0 6',
    '0000000000 65535 f ',
    '0000000009 00000 n ',
    '0000000058 00000 n ',
    '0000000115 00000 n ',
    '0000000229 00000 n ',
    '0000000546 00000 n ',
    'trailer << /Size 6 /Root 1 0 R >>',
    'startxref',
    '614',
    '%%EOF'
  ];
  return new Blob([lines.join('\n')], { type: 'application/pdf' });
}

const STORAGE_KEY_V2 = 'kinetic_protocol_os_v2';
const LEGACY_STORAGE_KEY_V1 = 'kinetic_habits_v1';

const CATEGORIES = {
  Math: {
    label: 'Math',
    color: '#818cf8',
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    accent: 'from-indigo-500/30 to-violet-500/10',
    pillBg: '#c7d2fe',
    pillText: '#1e1b4b',
    icon: BookOpen
  },
  Code: {
    label: 'Code',
    color: '#38bdf8',
    bg: 'bg-sky-500/15',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    accent: 'from-sky-500/30 to-cyan-500/10',
    pillBg: '#bae6fd',
    pillText: '#0c4a6e',
    icon: Code2
  },
  Fitness: {
    label: 'Fitness',
    color: '#34d399',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    accent: 'from-emerald-500/30 to-teal-500/10',
    pillBg: '#a7f3d0',
    pillText: '#064e3b',
    icon: Dumbbell
  },
  Quant: {
    label: 'Quant',
    color: '#fbbf24',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    accent: 'from-amber-500/30 to-orange-500/10',
    pillBg: '#fde68a',
    pillText: '#78350f',
    icon: LineChart
  },
  'Deep Work': {
    label: 'Deep Work',
    color: '#c084fc',
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    accent: 'from-purple-500/30 to-fuchsia-500/10',
    pillBg: '#e9d5ff',
    pillText: '#4c1d95',
    icon: Zap
  },
  General: {
    label: 'General',
    color: '#94a3b8',
    bg: 'bg-slate-500/15',
    text: 'text-slate-300',
    border: 'border-slate-500/30',
    accent: 'from-slate-500/30 to-slate-700/10',
    pillBg: '#e2e8f0',
    pillText: '#0f172a',
    icon: Layers
  }
};

function toLocalISO(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalISO(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return new Date();
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

function addDaysISO(isoStr, days) {
  const dt = parseLocalISO(isoStr);
  dt.setDate(dt.getDate() + days);
  return toLocalISO(dt);
}

function getWeekdayMon0(isoStr) {
  const jsDay = parseLocalISO(isoStr).getDay(); // 0 = Sun ... 6 = Sat
  return (jsDay + 6) % 7; // 0 = Mon ... 6 = Sun
}

function getWeekDatesISO(anchorISO, weekStartsOnMonday = true) {
  const dt = parseLocalISO(anchorISO);
  const jsDay = dt.getDay();
  const offset = weekStartsOnMonday ? (jsDay + 6) % 7 : jsDay;
  const start = new Date(dt);
  start.setDate(dt.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const cur = new Date(start);
    cur.setDate(start.getDate() + i);
    return toLocalISO(cur);
  });
}

function formatReadableDate(isoStr) {
  const dt = parseLocalISO(isoStr);
  return dt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function parseMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatDurationMinutes(totalMinutes) {
  const mins = Math.max(0, Math.round(Number(totalMinutes) || 0));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function isHabitScheduledOnDate(habit, dateISO) {
  if (!habit) return false;
  if (habit.archivedAt && dateISO > habit.archivedAt.slice(0, 10)) return false;
  if (habit.startDate && dateISO < habit.startDate) return false;
  if (habit.endDate && dateISO > habit.endDate) return false;
  const schedule = habit.schedule || { type: 'daily', weekdays: [0, 1, 2, 3, 4, 5, 6], weeklyTarget: 7 };
  if (schedule.type === 'weekdays' && Array.isArray(schedule.weekdays)) {
    const wd = getWeekdayMon0(dateISO);
    return schedule.weekdays.includes(wd);
  }
  return true;
}

function isEntrySatisfied(habit, entry) {
  if (!entry || !habit) return false;
  if (entry.status === 'completed' || entry.status === 'mvd') return true;
  if (habit.trackingType === 'binary') return Boolean(entry.value >= 1);
  const minTarget = Number(habit.minViableValue) || Number(habit.targetValue) || 1;
  return Number(entry.value || 0) >= minTarget;
}

function generateResetChallengeCode(length = 12) {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const all = letters + digits;
  const chars = [];
  // Guarantee at least 4 digits and 4 letters mixed randomly
  for (let i = 0; i < 4; i++) {
    chars.push(digits[Math.floor(Math.random() * digits.length)]);
    chars.push(letters[Math.floor(Math.random() * letters.length)]);
  }
  while (chars.length < length) {
    chars.push(all[Math.floor(Math.random() * all.length)]);
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
  }
  return chars.join('');
}

function computeHabitStats(habit, habitEntriesMap, todayISO) {
  const entriesForHabit = habitEntriesMap[habit.id] || {};
  const entryDates = Object.keys(entriesForHabit).sort();
  const earliestEntryISO = entryDates.length > 0 ? entryDates[0] : todayISO;
  const latestSatisfiedISO = entryDates.reduce((latest, dISO) => {
    if (isEntrySatisfied(habit, entriesForHabit[dISO]) && dISO > latest) {
      return dISO;
    }
    return latest;
  }, todayISO);

  const rawStartISO =
    habit.startDate && habit.startDate <= todayISO ? habit.startDate : addDaysISO(todayISO, -60);
  const startISO = earliestEntryISO < rawStartISO ? earliestEntryISO : rawStartISO;
  const endScanISO = latestSatisfiedISO > todayISO ? latestSatisfiedISO : todayISO;

  let currentStreak = 0;
  let cursor = endScanISO;
  for (let i = 0; i < 366; i++) {
    if (cursor < startISO) break;
    const entry = entriesForHabit[cursor];
    const satisfied = isEntrySatisfied(habit, entry);

    if (satisfied) {
      // Every satisfied day (scheduled or bonus/weekend check-in) increments the live streak immediately
      currentStreak += 1;
    } else if (cursor > todayISO) {
      // Unchecked future day in the current week matrix does not break the streak
    } else if (cursor === todayISO && currentStreak === 0) {
      // Today is still in progress if unchecked; preserve yesterday's active streak
    } else if (!isHabitScheduledOnDate(habit, cursor)) {
      // Unscheduled rest day does not break the streak
    } else {
      break;
    }
    cursor = addDaysISO(cursor, -1);
  }

  let longestStreak = 0;
  let running = 0;
  let scanCursor = startISO;
  let scheduledDaysCount = 0;
  let completedScheduledCount = 0;

  for (let i = 0; i < 400; i++) {
    if (scanCursor > endScanISO) break;
    const scheduled = isHabitScheduledOnDate(habit, scanCursor);
    const entry = entriesForHabit[scanCursor];
    const satisfied = isEntrySatisfied(habit, entry);
    if (scheduled && scanCursor <= todayISO) {
      scheduledDaysCount += 1;
      if (satisfied) {
        completedScheduledCount += 1;
        running += 1;
        if (running > longestStreak) longestStreak = running;
      } else if (scanCursor !== todayISO) {
        running = 0;
      }
    } else if (satisfied) {
      // Bonus or current-week completion also counts toward streak and completion credit
      completedScheduledCount += 1;
      scheduledDaysCount += 1;
      running += 1;
      if (running > longestStreak) longestStreak = running;
    }
    scanCursor = addDaysISO(scanCursor, 1);
  }

  if (currentStreak > longestStreak) longestStreak = currentStreak;
  const completionRate =
    scheduledDaysCount > 0
      ? Math.min(100, Math.round((completedScheduledCount / scheduledDaysCount) * 100))
      : 0;

  return {
    currentStreak,
    longestStreak,
    completionRate,
    scheduledDaysCount,
    completedScheduledCount,
    todayDone: isEntrySatisfied(habit, entriesForHabit[todayISO])
  };
}

function createStarterWorkspace(todayISO) {
  const weekDates = getWeekDatesISO(todayISO, true);
  const startOfMonth = `${todayISO.slice(0, 8)}01`;
  const twoWeeksAgo = addDaysISO(todayISO, -14);

  const habits = [
    {
      id: 'hab-math',
      title: 'Higher Mathematics & Problem Solving',
      description: 'Linear Algebra proofs, Multivariable Calculus & Olympiad problem sets',
      category: 'Math',
      trackingType: 'duration',
      targetValue: 60,
      minViableValue: 30,
      unit: 'min',
      schedule: { type: 'daily', weekdays: [0, 1, 2, 3, 4, 5, 6], weeklyTarget: 7 },
      startDate: twoWeeksAgo,
      archivedAt: null
    },
    {
      id: 'hab-code',
      title: 'Algorithm & Systems Practice (C++ / Python)',
      description: '2 graph/DP problems or low-latency systems implementation',
      category: 'Code',
      trackingType: 'count',
      targetValue: 2,
      minViableValue: 1,
      unit: 'problems',
      schedule: { type: 'daily', weekdays: [0, 1, 2, 3, 4, 5, 6], weeklyTarget: 7 },
      startDate: twoWeeksAgo,
      archivedAt: null
    },
    {
      id: 'hab-fitness',
      title: 'Calisthenics & Strength Protocol',
      description: 'Weighted pull-ups, dips, planche progressions & mobility',
      category: 'Fitness',
      trackingType: 'binary',
      targetValue: 1,
      minViableValue: 1,
      unit: 'session',
      schedule: { type: 'weekdays', weekdays: [0, 1, 2, 4, 5], weeklyTarget: 5 },
      startDate: twoWeeksAgo,
      archivedAt: null
    },
    {
      id: 'hab-quant',
      title: 'Quantitative Finance & Stochastic Reading',
      description: 'Market microstructure, options pricing & statistical arbitrage papers',
      category: 'Quant',
      trackingType: 'numeric',
      targetValue: 20,
      minViableValue: 10,
      unit: 'pages',
      schedule: { type: 'weekdays', weekdays: [0, 1, 2, 3, 4], weeklyTarget: 5 },
      startDate: twoWeeksAgo,
      archivedAt: null
    },
    {
      id: 'hab-deep',
      title: 'Zero-Distraction Deep Work Block',
      description: '90+ mins phone-off research or architecture sprint',
      category: 'Deep Work',
      trackingType: 'duration',
      targetValue: 90,
      minViableValue: 45,
      unit: 'min',
      schedule: { type: 'daily', weekdays: [0, 1, 2, 3, 4, 5, 6], weeklyTarget: 7 },
      startDate: twoWeeksAgo,
      archivedAt: null
    }
  ];

  // Populate genuine dated entries for past days of the current week up to today
  const habitEntries = {};
  habits.forEach((h) => {
    habitEntries[h.id] = {};
  });

  for (let offset = -5; offset <= 0; offset++) {
    const dISO = addDaysISO(todayISO, offset);
    if (offset <= -1) {
      habitEntries['hab-math'][dISO] = {
        id: `he-math-${dISO}`,
        habitId: 'hab-math',
        date: dISO,
        value: offset === -2 ? 40 : 60,
        status: offset === -2 ? 'mvd' : 'completed',
        note: 'Completed proof exercises',
        updatedAt: new Date().toISOString()
      };
      habitEntries['hab-code'][dISO] = {
        id: `he-code-${dISO}`,
        habitId: 'hab-code',
        date: dISO,
        value: 2,
        status: 'completed',
        note: 'Dynamic programming & trees',
        updatedAt: new Date().toISOString()
      };
      habitEntries['hab-deep'][dISO] = {
        id: `he-deep-${dISO}`,
        habitId: 'hab-deep',
        date: dISO,
        value: 90,
        status: 'completed',
        note: 'Morning focus sprint',
        updatedAt: new Date().toISOString()
      };
    }
    if (offset === -3 || offset === -1) {
      habitEntries['hab-fitness'][dISO] = {
        id: `he-fit-${dISO}`,
        habitId: 'hab-fitness',
        date: dISO,
        value: 1,
        status: 'completed',
        note: 'Upper body rings + core',
        updatedAt: new Date().toISOString()
      };
      habitEntries['hab-quant'][dISO] = {
        id: `he-quant-${dISO}`,
        habitId: 'hab-quant',
        date: dISO,
        value: 22,
        status: 'completed',
        note: 'Read Ch. 4 Order Book Dynamics',
        updatedAt: new Date().toISOString()
      };
    }
  }

  // Mark 2 habits completed today so Overview shows live progress out of the box
  habitEntries['hab-math'][todayISO] = {
    id: `he-math-${todayISO}`,
    habitId: 'hab-math',
    date: todayISO,
    value: 60,
    status: 'completed',
    note: 'Spectral theorem notes',
    updatedAt: new Date().toISOString()
  };
  habitEntries['hab-code'][todayISO] = {
    id: `he-code-${todayISO}`,
    habitId: 'hab-code',
    date: todayISO,
    value: 2,
    status: 'completed',
    note: 'Solved shortest path with k-stops',
    updatedAt: new Date().toISOString()
  };

  const goals = [
    {
      id: 'goal-1',
      title: 'Master Competitive Algorithms & Systems C++',
      description: 'Complete 150 graph, DP, and concurrency problems with full complexity proofs.',
      topic: 'Computer Science & Systems',
      category: 'Code',
      startDate: startOfMonth,
      targetDate: addDaysISO(todayISO, 75),
      status: 'In progress',
      pinned: true,
      bannerGradient: 'from-sky-500/30 via-indigo-500/20 to-slate-900',
      metricType: 'numeric',
      currentValue: 92,
      targetValue: 150,
      unit: 'problems',
      milestones: [
        { id: 'm-1', title: 'Complete Trees & Graph Traversals (40 problems)', done: true },
        { id: 'm-2', title: 'Complete Dynamic Programming & Bitmasking (50 problems)', done: true },
        { id: 'm-3', title: 'Segment Trees, Fenwick & Network Flows (60 problems)', done: false }
      ]
    },
    {
      id: 'goal-2',
      title: 'Build Quantitative Backtesting & Execution Engine',
      description: 'Design an event-driven Python/C++ statistical arbitrage research pipeline.',
      topic: 'Quantitative Research',
      category: 'Quant',
      startDate: startOfMonth,
      targetDate: addDaysISO(todayISO, 60),
      status: 'In progress',
      pinned: true,
      bannerGradient: 'from-amber-500/25 via-purple-500/20 to-slate-900',
      metricType: 'milestones',
      currentValue: 2,
      targetValue: 4,
      unit: 'milestones',
      milestones: [
        { id: 'm-21', title: 'Historical tick data ingestion & normalization', done: true },
        { id: 'm-22', title: 'Vectorized alpha factor evaluation module', done: true },
        { id: 'm-23', title: 'Transaction cost & slippage simulation model', done: false },
        { id: 'm-24', title: 'Walk-forward Sharpe & drawdown analytics report', done: false }
      ]
    }
  ];

  const tasks = [
    {
      id: 'task-1',
      title: 'Implement Dijkstra & A* Priority Queue Benchmark',
      description: 'Compare std::priority_queue vs Fibonacci heap memory locality.',
      dueDate: todayISO,
      startTime: '09:00',
      endTime: '10:30',
      priority: 'high',
      status: 'completed',
      category: 'Code',
      goalId: 'goal-1',
      recurrence: 'none',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-2',
      title: 'Complete Eigenvalues & SVD Problem Set #4',
      description: 'Write full LaTeX proofs for positive semi-definite matrices.',
      dueDate: todayISO,
      startTime: '11:00',
      endTime: '12:30',
      priority: 'high',
      status: 'completed',
      category: 'Math',
      goalId: null,
      recurrence: 'none',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-3',
      title: 'Calibrate Ornstein-Uhlenbeck Mean Reversion Parameters',
      description: 'Estimate half-life and volatility on 5-minute intraday pairs.',
      dueDate: todayISO,
      startTime: '14:30',
      endTime: '16:00',
      priority: 'high',
      status: 'todo',
      category: 'Quant',
      goalId: 'goal-2',
      recurrence: 'none',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-4',
      title: 'Weighted Calisthenics & Mobility Session',
      description: '5x5 weighted pull-ups, ring dips, and thoracic mobility.',
      dueDate: todayISO,
      startTime: '17:30',
      endTime: '18:30',
      priority: 'medium',
      status: 'todo',
      category: 'Fitness',
      goalId: null,
      recurrence: 'none',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-5',
      title: 'Review Tomorrow Schedule & Archive Research Notes',
      description: 'Update daily reflection and tag study references.',
      dueDate: addDaysISO(todayISO, 1),
      startTime: '',
      endTime: '',
      priority: 'low',
      status: 'todo',
      category: 'General',
      goalId: null,
      recurrence: 'daily',
      createdAt: new Date().toISOString()
    }
  ];

  // Weekly time blocks populating both Today's Timeline and the Reference-1 Weekly Gantt Activity Matrix
  const schedules = [
    {
      id: 'sch-1',
      title: 'Deep Work: Systems & Algorithm Architecture',
      date: todayISO,
      startTime: '08:30',
      endTime: '10:30',
      plannedMinutes: 120,
      actualMinutes: 115,
      category: 'Code',
      linkedGoalId: 'goal-1',
      linkedTaskId: 'task-1',
      recurrence: 'weekdays',
      completed: true,
      notes: 'Zero-distraction morning engineering block'
    },
    {
      id: 'sch-2',
      title: 'Higher Mathematics & Linear Algebra Proofs',
      date: todayISO,
      startTime: '11:00',
      endTime: '12:30',
      plannedMinutes: 90,
      actualMinutes: 90,
      category: 'Math',
      linkedGoalId: null,
      linkedTaskId: 'task-2',
      recurrence: 'weekdays',
      completed: true,
      notes: 'SVD decomposition and spectral theorem'
    },
    {
      id: 'sch-3',
      title: 'Midday Walk & Recovery Break',
      date: todayISO,
      startTime: '12:30',
      endTime: '13:30',
      plannedMinutes: 60,
      actualMinutes: 60,
      category: 'General',
      linkedGoalId: null,
      linkedTaskId: null,
      recurrence: 'daily',
      completed: true,
      notes: 'Sunlight, hydration & away from screens'
    },
    {
      id: 'sch-4',
      title: 'Quantitative Research & Backtest Calibration',
      date: todayISO,
      startTime: '14:30',
      endTime: '16:30',
      plannedMinutes: 120,
      actualMinutes: 60,
      category: 'Quant',
      linkedGoalId: 'goal-2',
      linkedTaskId: 'task-3',
      recurrence: 'weekdays',
      completed: false,
      notes: 'Testing slippage assumptions on intraday bars'
    },
    {
      id: 'sch-5',
      title: 'Calisthenics & Strength Conditioning',
      date: todayISO,
      startTime: '17:30',
      endTime: '18:45',
      plannedMinutes: 75,
      actualMinutes: 0,
      category: 'Fitness',
      linkedGoalId: null,
      linkedTaskId: 'task-4',
      recurrence: 'weekdays',
      completed: false,
      notes: 'Rings strength progression'
    },
    {
      id: 'sch-6',
      title: 'Evening Reading & Protocol Synthesis',
      date: todayISO,
      startTime: '20:00',
      endTime: '21:15',
      plannedMinutes: 75,
      actualMinutes: 0,
      category: 'Deep Work',
      linkedGoalId: null,
      linkedTaskId: null,
      recurrence: 'daily',
      completed: false,
      notes: 'Literature review and next-day time blocking'
    }
  ];

  // Ensure each day of the current week has at least one scheduled block for a rich Weekly Gantt Activity chart
  weekDates.forEach((dISO, idx) => {
    if (dISO !== todayISO) {
      schedules.push({
        id: `sch-wk-${idx}`,
        title:
          idx === 0
            ? 'Writing Weekly Protocol & Task Lists'
            : idx === 1
            ? 'Setting Goals & Quantitative Models'
            : idx === 2
            ? 'Deep Systems Architecture Sprint'
            : idx === 3
            ? 'Algorithmic Problem Solving Lab'
            : 'Weekly Review & Schedule Calibration',
        date: dISO,
        startTime: idx % 2 === 0 ? '09:00' : '13:00',
        endTime: idx % 2 === 0 ? '11:30' : '15:30',
        plannedMinutes: 150,
        actualMinutes: dISO < todayISO ? 140 : 0,
        category: idx === 0 ? 'Deep Work' : idx === 1 ? 'Quant' : idx === 2 ? 'Code' : idx === 3 ? 'Math' : 'Fitness',
        linkedGoalId: idx % 2 === 0 ? 'goal-1' : 'goal-2',
        linkedTaskId: null,
        recurrence: 'none',
        completed: dISO < todayISO,
        notes: 'Scheduled weekly execution block'
      });
    }
  });

  const notes = [
    {
      id: 'note-1',
      title: 'Spectral Theorem & SVD Core Identities',
      content:
        'Every real symmetric matrix A = Q Λ Q^T can be diagonalized by an orthogonal matrix of eigenvectors. For general m×n matrices, A = U Σ V^T provides optimal low-rank Frobenius norm approximations (Eckart–Young theorem).',
      category: 'Math',
      tags: ['linear-algebra', 'svd', 'proofs'],
      linkedGoalId: null,
      referenceUrl: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/',
      attachment: {
        storageKey: 'starter_python_roadmap_pdf',
        name: 'python_roadmap.pdf',
        size: 1024,
        type: 'application/pdf'
      },
      updatedAt: new Date().toISOString()
    },
    {
      id: 'note-2',
      title: 'C++20 Low-Latency Ring Buffer Notes',
      content:
        'Use cache-line alignment (alignas(64)) between producer and consumer atomic indices to prevent false sharing across CPU cores. Prefer std::memory_order_acquire / release over seq_cst in single-producer single-consumer queues.',
      category: 'Code',
      tags: ['cpp20', 'concurrency', 'systems'],
      linkedGoalId: 'goal-1',
      referenceUrl: 'https://en.cppreference.com/w/cpp/atomic/memory_order',
      attachment: null,
      updatedAt: new Date().toISOString()
    }
  ];

  const journals = {
    [todayISO]: {
      id: `jrn-${todayISO}`,
      date: todayISO,
      wentWell: 'Completed morning C++ graph benchmark and Linear Algebra SVD proofs ahead of schedule.',
      wasDifficult: 'Maintaining focus after 15:00 when tuning Ornstein-Uhlenbeck parameters.',
      lessonsLearned: 'Starting with 90 minutes of phone-off deep work before checking messages doubles morning throughput.',
      improveTomorrow: 'Batch all quantitative data cleaning scripts into a single afternoon Pomodoro sprint.',
      updatedAt: new Date().toISOString()
    }
  };

  return {
    version: 2,
    isStarterWorkspace: true,
    migrationLog: [],
    habits,
    habitEntries,
    tasks,
    goals,
    schedules,
    notes,
    journals,
    settings: {
      userName: 'Alex',
      weekStartsOnMonday: true,
      timeFormat24h: true,
      reducedMotion: false,
      defaultCalendarView: 'month',
      dailyFocusTargetMinutes: 240,
      maxPdfSizeMB: DEFAULT_MAX_PDF_MB
    }
  };
}

function loadAndMigrateStore(todayISO) {
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.habits)) {
        return parsed;
      }
    }

    // Check for legacy v1 7-boolean habit array and migrate cleanly
    const rawV1 = localStorage.getItem(LEGACY_STORAGE_KEY_V1);
    if (rawV1) {
      const legacyHabits = JSON.parse(rawV1);
      if (Array.isArray(legacyHabits) && legacyHabits.length > 0) {
        const base = createStarterWorkspace(todayISO);
        const weekDates = getWeekDatesISO(todayISO, true);
        const migratedHabits = [];
        const migratedEntries = {};

        legacyHabits.forEach((lh, idx) => {
          const hid = lh.id ? String(lh.id) : `mig-hab-${idx}`;
          migratedHabits.push({
            id: hid,
            title: lh.name || 'Migrated Habit',
            description: lh.target || 'Migrated from Kinetic v1',
            category: CATEGORIES[lh.category] ? lh.category : 'General',
            trackingType: 'binary',
            targetValue: 1,
            minViableValue: 1,
            unit: 'check-in',
            schedule: { type: 'daily', weekdays: [0, 1, 2, 3, 4, 5, 6], weeklyTarget: 7 },
            startDate: weekDates[0],
            archivedAt: null
          });
          migratedEntries[hid] = {};
          if (Array.isArray(lh.history)) {
            lh.history.slice(0, 7).forEach((done, dayIdx) => {
              const targetDate = weekDates[dayIdx];
              if (done && targetDate && targetDate <= todayISO) {
                migratedEntries[hid][targetDate] = {
                  id: `mig-${hid}-${targetDate}`,
                  habitId: hid,
                  date: targetDate,
                  value: 1,
                  status: 'completed',
                  note: 'Migrated from v1 7-day array',
                  updatedAt: new Date().toISOString()
                };
              }
            });
          }
        });

        const migratedStore = {
          ...base,
          isStarterWorkspace: false,
          habits: migratedHabits,
          habitEntries: migratedEntries,
          migrationLog: [
            `Migrated ${migratedHabits.length} habits from legacy v1 format on ${todayISO}. Fabricated v1 bestStreak counters were discarded in favor of verified dated entries.`
          ]
        };
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(migratedStore));
        return migratedStore;
      }
    }
  } catch (err) {
    console.error('Storage initialization recovery triggered:', err);
  }

  const starter = createStarterWorkspace(todayISO);
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(starter));
  } catch {
    // Ignore storage quota errors on boot
  }
  return starter;
}

const KINETIC_MOTION_STYLES = `
  :root {
    --kp-dur-micro: 150ms;
    --kp-dur-hover: 185ms;
    --kp-dur-menu: 210ms;
    --kp-dur-page: 250ms;
    --kp-dur-modal: 240ms;
    --kp-dur-entrance: 380ms;
    --kp-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
    --kp-ease-in: cubic-bezier(0.4, 0, 1, 1);
    --kp-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  }

  .kp-app-shell {
    height: 100vh;
    height: 100dvh;
    max-height: 100dvh;
  }

  .kinetic-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(148, 163, 184, 0.18) transparent;
    -webkit-overflow-scrolling: touch;
  }
  .kinetic-scroll::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .kinetic-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .kinetic-scroll::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.18);
    border-radius: 9999px;
  }
  .kinetic-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(129, 140, 248, 0.38);
  }

  @keyframes kpPageEnter {
    from {
      opacity: 0;
      transform: translate3d(0, 6px, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes kpSubviewEnter {
    from {
      opacity: 0;
      transform: translate3d(0, 4px, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes kpCardEntrance {
    from {
      opacity: 0;
      transform: translate3d(0, 8px, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes kpBackdropIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes kpBackdropOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  @keyframes kpModalIn {
    from {
      opacity: 0;
      transform: translate3d(0, 8px, 0) scale(0.97);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
    }
  }

  @keyframes kpModalOut {
    from {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
    }
    to {
      opacity: 0;
      transform: translate3d(0, 6px, 0) scale(0.97);
    }
  }

  @keyframes kpToastIn {
    from {
      opacity: 0;
      transform: translate3d(0, 10px, 0) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
    }
  }

  @keyframes kpToastOut {
    from {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
    }
    to {
      opacity: 0;
      transform: translate3d(0, 8px, 0) scale(0.98);
    }
  }

  @keyframes kpBannerIn {
    from {
      opacity: 0;
      transform: translate3d(0, -6px, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes kpBannerOut {
    from {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
    to {
      opacity: 0;
      transform: translate3d(0, -6px, 0);
    }
  }

  @keyframes kpBadgeBump {
    0% { transform: scale(1); }
    45% { transform: scale(1.16); }
    100% { transform: scale(1); }
  }

  /* Hide ugly native number input spin buttons across all browsers */
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  @keyframes kpCheckPop {
    0% { transform: scale(0.72) rotate(-10deg); }
    60% { transform: scale(1.14) rotate(2deg); }
    100% { transform: scale(1) rotate(0deg); }
  }

  @keyframes kpRippleWave {
    0% {
      transform: translate(-50%, -50%) scale(0.15);
      opacity: 0.75;
    }
    70% {
      opacity: 0.35;
    }
    100% {
      transform: translate(-50%, -50%) scale(2.75);
      opacity: 0;
    }
  }

  @keyframes kpRippleOuterRing {
    0% {
      transform: scale(0.92);
      opacity: 0.85;
      box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.55);
    }
    100% {
      transform: scale(1.55);
      opacity: 0;
      box-shadow: 0 0 0 10px rgba(52, 211, 153, 0);
    }
  }

  @keyframes kpStreakFire {
    0% { transform: scale(1); }
    40% { transform: scale(1.26) translateY(-2px); filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.65)); }
    100% { transform: scale(1) translateY(0); filter: drop-shadow(0 0 0px rgba(251, 191, 36, 0)); }
  }

  .kp-ripple-wave {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 100%;
    height: 100%;
    border-radius: 9999px;
    background: radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(52,211,153,0.45) 55%, transparent 75%);
    pointer-events: none;
    animation: kpRippleWave 520ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .kp-ripple-ring {
    position: absolute;
    inset: -2px;
    border-radius: inherit;
    border: 2px solid rgba(52, 211, 153, 0.75);
    pointer-events: none;
    animation: kpRippleOuterRing 520ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .kp-streak-fire {
    animation: kpStreakFire 420ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .kp-page-transition {
    animation: kpPageEnter var(--kp-dur-page) var(--kp-ease-out) both;
  }

  .kp-subview-transition {
    animation: kpSubviewEnter var(--kp-dur-menu) var(--kp-ease-out) both;
  }

  .kp-stagger-1 {
    animation: kpCardEntrance var(--kp-dur-entrance) var(--kp-ease-out) 0ms both;
  }
  .kp-stagger-2 {
    animation: kpCardEntrance var(--kp-dur-entrance) var(--kp-ease-out) 40ms both;
  }
  .kp-stagger-3 {
    animation: kpCardEntrance var(--kp-dur-entrance) var(--kp-ease-out) 80ms both;
  }
  .kp-stagger-4 {
    animation: kpCardEntrance var(--kp-dur-entrance) var(--kp-ease-out) 120ms both;
  }

  .kp-card {
    transition:
      transform var(--kp-dur-hover) var(--kp-ease-out),
      border-color var(--kp-dur-hover) var(--kp-ease-out),
      background-color var(--kp-dur-hover) var(--kp-ease-out),
      box-shadow var(--kp-dur-hover) var(--kp-ease-out);
  }
  .kp-card-interactive:hover {
    transform: translate3d(0, -1.5px, 0);
    border-color: rgba(129, 140, 248, 0.32);
  }

  .kp-btn {
    transition:
      transform var(--kp-dur-micro) var(--kp-ease-out),
      background-color var(--kp-dur-hover) var(--kp-ease-out),
      border-color var(--kp-dur-hover) var(--kp-ease-out),
      color var(--kp-dur-hover) var(--kp-ease-out),
      box-shadow var(--kp-dur-hover) var(--kp-ease-out),
      opacity var(--kp-dur-micro) var(--kp-ease-out);
  }
  .kp-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .kp-backdrop-enter {
    animation: kpBackdropIn var(--kp-dur-modal) var(--kp-ease-out) forwards;
  }
  .kp-backdrop-exit {
    animation: kpBackdropOut 200ms var(--kp-ease-in) forwards;
  }
  .kp-modal-enter {
    animation: kpModalIn var(--kp-dur-modal) var(--kp-ease-out) forwards;
  }
  .kp-modal-exit {
    animation: kpModalOut 200ms var(--kp-ease-in) forwards;
  }
  .kp-toast-enter {
    animation: kpToastIn var(--kp-dur-menu) var(--kp-ease-out) forwards;
  }
  .kp-toast-exit {
    animation: kpToastOut 180ms var(--kp-ease-in) forwards;
  }
  .kp-banner-enter {
    animation: kpBannerIn var(--kp-dur-menu) var(--kp-ease-out) forwards;
  }
  .kp-banner-exit {
    animation: kpBannerOut 170ms var(--kp-ease-in) forwards;
  }
  .kp-badge-bump {
    animation: kpBadgeBump 220ms var(--kp-ease-out);
  }
  .kp-check-pop {
    animation: kpCheckPop 170ms var(--kp-ease-out);
  }

  @media (prefers-reduced-motion: reduce) {
    .kp-page-transition,
    .kp-subview-transition,
    .kp-stagger-1,
    .kp-stagger-2,
    .kp-stagger-3,
    .kp-stagger-4,
    .kp-backdrop-enter,
    .kp-backdrop-exit,
    .kp-modal-enter,
    .kp-modal-exit,
    .kp-toast-enter,
    .kp-toast-exit,
    .kp-banner-enter,
    .kp-banner-exit,
    .kp-badge-bump,
    .kp-check-pop {
      animation: none !important;
      transform: none !important;
    }
    .kp-card,
    .kp-card-interactive:hover,
    .kp-btn,
    .kp-btn:active:not(:disabled) {
      transition-duration: 0.01ms !important;
      transform: none !important;
    }
  }

  .kp-reduced-motion .kp-page-transition,
  .kp-reduced-motion .kp-subview-transition,
  .kp-reduced-motion .kp-stagger-1,
  .kp-reduced-motion .kp-stagger-2,
  .kp-reduced-motion .kp-stagger-3,
  .kp-reduced-motion .kp-stagger-4,
  .kp-reduced-motion .kp-backdrop-enter,
  .kp-reduced-motion .kp-backdrop-exit,
  .kp-reduced-motion .kp-modal-enter,
  .kp-reduced-motion .kp-modal-exit,
  .kp-reduced-motion .kp-toast-enter,
  .kp-reduced-motion .kp-toast-exit,
  .kp-reduced-motion .kp-banner-enter,
  .kp-reduced-motion .kp-banner-exit,
  .kp-reduced-motion .kp-badge-bump,
  .kp-reduced-motion .kp-check-pop {
    animation: none !important;
    transform: none !important;
  }
  .kp-reduced-motion *,
  .kp-reduced-motion *::before,
  .kp-reduced-motion *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .kp-reduced-motion .kp-card-interactive:hover,
  .kp-reduced-motion .kp-btn:active:not(:disabled) {
    transform: none !important;
  }
`;

function CircularRing({ percent, color = '#818cf8', size = 56, strokeWidth = 5, reducedMotion = false }) {
  const clamped = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={reducedMotion ? '' : 'transition-[stroke-dashoffset] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]'}
        />
      </svg>
      <span className="absolute text-[11px] font-bold text-slate-100">{clamped}%</span>
    </div>
  );
}

export default function App() {
  const todayISO = useMemo(() => toLocalISO(new Date()), []);
  const [store, setStore] = useState(() => loadAndMigrateStore(todayISO));
  const [activeNav, setActiveNav] = useState('overview');
  const [selectedDateISO, setSelectedDateISO] = useState(todayISO);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [undoBanner, setUndoBanner] = useState(null);

  // Sub-view states across modules
  const [calendarMode, setCalendarMode] = useState('month'); // 'month' | 'week' | 'day' | 'heatmap'
  const [calendarMonthCursor, setCalendarMonthCursor] = useState(() => todayISO.slice(0, 7)); // YYYY-MM
  const [taskFilter, setTaskFilter] = useState('all'); // 'all' | 'today' | 'upcoming' | 'completed' | 'overdue'
  const [taskCategoryFilter, setTaskCategoryFilter] = useState('All');
  const [habitCategoryFilter, setHabitCategoryFilter] = useState('All');
  const [habitChartMode, setHabitChartMode] = useState('spline'); // 'spline' | 'bars'

  // Statistics 3-in-1 timeframe & interactive chart states
  const [statsTimeframe, setStatsTimeframe] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const [statsSeriesFilter, setStatsSeriesFilter] = useState('all'); // 'all' | 'planned' | 'actual' | 'velocity'
  const [statsHoverIdx, setStatsHoverIdx] = useState(null);
  const [hoveredAllocationCat, setHoveredAllocationCat] = useState(null);

  // Header Notification dropdown & Theme toggle tooltip states
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all'); // 'all' | 'overdue' | 'upcoming' | 'reminders'
  const [themeTooltipOpen, setThemeTooltipOpen] = useState(false);
  const notifDropdownRef = useRef(null);

  // Checklist ripple effect & real-time streak pulse states
  const [checkRipples, setCheckRipples] = useState({});
  const [streakPulseByHabit, setStreakPulseByHabit] = useState({});
  const prevStreaksRef = useRef({});

  // Settings 12-character alphanumeric Factory Reset challenge states
  const [resetPanelOpen, setResetPanelOpen] = useState(false);
  const [resetChallengeCode, setResetChallengeCode] = useState(() => generateResetChallengeCode(12));
  const [resetTypedCode, setResetTypedCode] = useState('');

  const triggerCheckRipple = (rippleKey) => {
    if (effectiveReducedMotion) return;
    const stamp = Date.now() + Math.random();
    setCheckRipples((prev) => ({ ...prev, [rippleKey]: stamp }));
  };

  // Quick-add & modal states
  const [activeModal, setActiveModal] = useState(null); // 'task' | 'habit' | 'schedule' | 'goal' | 'note' | 'pdfPreview' | null
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [pdfPreviewState, setPdfPreviewState] = useState(null); // { storageKey, name, url, size, type, attachment }
  const [downloadingKeys, setDownloadingKeys] = useState({});
  const [downloadedKeys, setDownloadedKeys] = useState({});
  const [isToastClosing, setIsToastClosing] = useState(false);
  const [isUndoClosing, setIsUndoClosing] = useState(false);
  const [badgePulse, setBadgePulse] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const mainScrollRef = useRef(null);
  const activePreviewUrlRef = useRef(null);
  const downloadUrlsRef = useRef(new Set());
  const modalCloseTimerRef = useRef(null);
  const prevTaskBadgeRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setPrefersReducedMotion(Boolean(e.matches));
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

  const effectiveReducedMotion = Boolean(store.settings?.reducedMotion || prefersReducedMotion);

  // Clean up any active object URLs or timers when unmounting
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

  const showToast = (message, type = 'info') => {
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

  const weekDatesISO = useMemo(
    () => getWeekDatesISO(selectedDateISO, store.settings?.weekStartsOnMonday ?? true),
    [selectedDateISO, store.settings?.weekStartsOnMonday]
  );

  const activeHabits = useMemo(
    () => (store.habits || []).filter((h) => !h.archivedAt),
    [store.habits]
  );

  const habitStatsById = useMemo(() => {
    const map = {};
    (store.habits || []).forEach((h) => {
      map[h.id] = computeHabitStats(h, store.habitEntries || {}, todayISO);
    });
    return map;
  }, [store.habits, store.habitEntries, todayISO]);

  // Pulse the habit streak counter in real time whenever a habit's streak changes
  useEffect(() => {
    const prevMap = prevStreaksRef.current || {};
    const changedIds = [];
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

  // Resolve schedules for a given date (handling daily/weekdays recurrence)
  const getSchedulesForDate = (dateISO) => {
    const wd = getWeekdayMon0(dateISO);
    return (store.schedules || [])
      .filter((s) => {
        if (s.date === dateISO) return true;
        if (s.recurrence === 'daily') return true;
        if (s.recurrence === 'weekdays' && wd <= 4) return true;
        return false;
      })
      .sort((a, b) => parseMinutes(a.startTime) - parseMinutes(b.startTime));
  };

  const todaySchedules = useMemo(() => getSchedulesForDate(selectedDateISO), [store.schedules, selectedDateISO]);

  const todayTasks = useMemo(
    () => (store.tasks || []).filter((t) => t.dueDate === selectedDateISO),
    [store.tasks, selectedDateISO]
  );

  const todayScheduledHabits = useMemo(
    () => activeHabits.filter((h) => isHabitScheduledOnDate(h, selectedDateISO)),
    [activeHabits, selectedDateISO]
  );

  const todayCompletedHabitsCount = useMemo(() => {
    return todayScheduledHabits.filter((h) => {
      const entry = store.habitEntries?.[h.id]?.[selectedDateISO];
      return isEntrySatisfied(h, entry);
    }).length;
  }, [todayScheduledHabits, store.habitEntries, selectedDateISO]);

  // Weekly Focus & Activity metrics for Reference 1 & Reference 2 cards
  const weeklyMetrics = useMemo(() => {
    let totalPlannedMins = 0;
    let totalActualMins = 0;
    const perDayFocusHours = weekDatesISO.map((dISO) => {
      const dayBlocks = getSchedulesForDate(dISO);
      const planned = dayBlocks.reduce((acc, b) => acc + (Number(b.plannedMinutes) || 0), 0);
      const actual = dayBlocks.reduce(
        (acc, b) => acc + (Number(b.actualMinutes) || (b.completed ? Number(b.plannedMinutes) || 0 : 0)),
        0
      );
      totalPlannedMins += planned;
      totalActualMins += actual;

      const dayHabits = activeHabits.filter((h) => isHabitScheduledOnDate(h, dISO));
      const doneHabits = dayHabits.filter((h) =>
        isEntrySatisfied(h, store.habitEntries?.[h.id]?.[dISO])
      ).length;
      const habitPct = dayHabits.length > 0 ? Math.round((doneHabits / dayHabits.length) * 100) : 0;

      return {
        dateISO: dISO,
        shortDay: parseLocalISO(dISO).toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: parseLocalISO(dISO).getDate(),
        plannedMinutes: planned,
        actualMinutes: actual,
        actualHours: Number((actual / 60).toFixed(1)),
        habitPct,
        doneHabits,
        totalHabits: dayHabits.length
      };
    });

    const allTasks = store.tasks || [];
    const completedTasksCount = allTasks.filter((t) => t.status === 'completed').length;
    const taskCompletionPct =
      allTasks.length > 0 ? Math.round((completedTasksCount / allTasks.length) * 100) : 0;

    const allGoals = store.goals || [];
    const avgGoalPct =
      allGoals.length > 0
        ? Math.round(
            allGoals.reduce((acc, g) => {
              if (g.metricType === 'milestones' && Array.isArray(g.milestones) && g.milestones.length > 0) {
                const doneM = g.milestones.filter((m) => m.done).length;
                return acc + (doneM / g.milestones.length) * 100;
              }
              const target = Math.max(1, Number(g.targetValue) || 1);
              return acc + Math.min(100, ((Number(g.currentValue) || 0) / target) * 100);
            }, 0) / allGoals.length
          )
        : 0;

    const completedSchedulesCount = todaySchedules.filter((s) => s.completed).length;
    const planCompletionPct =
      todaySchedules.length > 0 ? Math.round((completedSchedulesCount / todaySchedules.length) * 100) : 0;

    return {
      totalPlannedMins,
      totalActualMins,
      perDayFocusHours,
      completedTasksCount,
      totalTasksCount: allTasks.length,
      taskCompletionPct,
      avgGoalPct,
      totalGoalsCount: allGoals.length,
      completedSchedulesCount,
      totalSchedulesCount: todaySchedules.length,
      planCompletionPct
    };
  }, [weekDatesISO, store.schedules, store.tasks, store.goals, store.habitEntries, activeHabits, todaySchedules]);

  const toggleHabitOnDate = (habit, dateISO, mode = 'full') => {
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

  const updateHabitQuantitativeValue = (habit, dateISO, rawValue) => {
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

  const toggleTaskStatus = (taskId) => {
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

  const toggleScheduleCompletion = (scheduleId) => {
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

  const toggleGoalMilestone = (goalId, milestoneId) => {
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

  const deleteWithUndo = (collectionKey, itemId, label = 'Record') => {
    const targetItem = (store[collectionKey] || []).find((x) => x.id === itemId);
    if (!targetItem) return;
    setIsUndoClosing(false);
    setUndoBanner({
      collectionKey,
      item: targetItem,
      label
    });
    setStore((prev) => ({
      ...prev,
      [collectionKey]: (prev[collectionKey] || []).filter((x) => x.id !== itemId)
    }));
  };

  const handleRestoreUndo = () => {
    if (!undoBanner) return;
    const restoredLabel = undoBanner.label;
    setStore((prev) => ({
      ...prev,
      [undoBanner.collectionKey]: [undoBanner.item, ...(prev[undoBanner.collectionKey] || [])]
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

  const openModal = (modalType, record = null) => {
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
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeModal, isModalClosing, effectiveReducedMotion]);

  useEffect(() => {
    if (!notifOpen) return;
    const onPointerDown = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [notifOpen]);

  const openPdfPreview = async (attachment) => {
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
    } catch (e) {
      showToast(e?.message || 'Could not open PDF preview.', 'error');
    }
  };

  const downloadPdfAttachment = async (attachment) => {
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
    } catch (e) {
      showToast(e?.message || 'Failed to download PDF from IndexedDB.', 'error');
    } finally {
      setDownloadingKeys((prev) => {
        const next = { ...prev };
        delete next[storageKey];
        return next;
      });
    }
  };

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

  const navSections = [
    {
      heading: 'Main tools',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
        { id: 'tasks', label: 'Task list', icon: CheckSquare, badge: pendingTasksBadgeCount },
        { id: 'goals', label: 'Goals', icon: Target },
        { id: 'schedules', label: 'Schedules', icon: Clock },
        { id: 'statistics', label: 'Statistics', icon: BarChart3 },
        { id: 'habits', label: 'Habits', icon: Flame }
      ]
    },
    {
      heading: 'Additional tools',
      items: [
        { id: 'notes', label: 'Files & Notes', icon: FolderOpen },
        { id: 'journal', label: 'Journal & Reviews', icon: BookMarked }
      ]
    },
    {
      heading: 'System',
      items: [
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
        { id: 'backup', label: 'Backup & Data', icon: Database }
      ]
    }
  ];

  const renderOverview = () => {
    const totalWeekFocusHours = (weeklyMetrics.totalActualMins / 60).toFixed(1);
    const weeklyFocusGoalHours = 30;
    const focusGoalPct = Math.min(100, Math.round(((weeklyMetrics.totalActualMins / 60) / weeklyFocusGoalHours) * 100));

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
                onClick={() => {
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
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-medium text-white hover:bg-white/10 transition"
              >
                Start Fresh (Empty OS)
              </button>
              <button
                onClick={() => setStore((prev) => ({ ...prev, isStarterWorkspace: false }))}
                className="rounded-lg bg-indigo-500 px-3 py-1.5 font-semibold text-white hover:bg-indigo-400 transition"
              >
                Keep Workspace
              </button>
            </div>
          </div>
        )}

        {/* Greeting & Quick Actions Row (Inspired by Prodly & Daily. headers) */}
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
                onClick={() => setSelectedDateISO(todayISO)}
                className="rounded-xl border border-white/10 bg-[#141824] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-indigo-500/40"
              >
                Jump to Today
              </button>
            )}
            <button
              onClick={() => openModal('task', null)}
              className="kp-btn inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#141824] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-indigo-500/40 hover:bg-white/10"
            >
              <Plus className="h-3.5 w-3.5 text-indigo-400" />
              Add Task
            </button>
            <button
              onClick={() => openModal('schedule', null)}
              className="kp-btn inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 hover:shadow-indigo-500/35"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Plan
            </button>
          </div>
        </div>

        {/* Top 4 Telemetry Cards (Reference 2: Prodly style adapted to Kinetic Protocol palette) */}
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

          {/* Card 2: Daily Execution (7-Day Interactive Pill Chain) */}
          <div className="kp-card kp-card-interactive rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 shadow-xl">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span>Weekly Execution</span>
              <CalendarIcon className="h-4 w-4 text-sky-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {todayCompletedHabitsCount}/{todayScheduledHabits.length} <span className="text-sm font-normal text-slate-400">habits today</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              {weeklyMetrics.perDayFocusHours.map((d) => {
                const isSel = d.dateISO === selectedDateISO;
                const hasActivity = d.doneHabits > 0 || d.actualMinutes > 0;
                return (
                  <button
                    key={d.dateISO}
                    onClick={() => setSelectedDateISO(d.dateISO)}
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

          {/* Card 3: Habit Consistency (24-Tick Barcode Meter) */}
          <div className="kp-card kp-card-interactive rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 shadow-xl">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span>Protocol Consistency</span>
              <Flame className="h-4 w-4 text-emerald-400" />
            </div>
            {(() => {
              const avgConsistency =
                activeHabits.length > 0
                  ? Math.round(
                      activeHabits.reduce((acc, h) => acc + (habitStatsById[h.id]?.completionRate || 0), 0) /
                        activeHabits.length
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

          {/* Card 4: Protocol Matrix (Category distribution badges) */}
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
              {todayTasks.filter((t) => t.status !== 'completed').length} tasks remaining for {selectedDateISO === todayISO ? 'today' : selectedDateISO}
            </p>
          </div>
        </div>

        {/* Today's Horizontal Timeline (Reference 2: Prodly Today's Timeline) */}
        <div className="kp-card kp-card-interactive rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Pin className="h-4 w-4 text-rose-400" />
              <h2 className="text-base font-bold text-white">
                Today&apos;s Timeline ({selectedDateISO === todayISO ? 'Today' : selectedDateISO})
              </h2>
            </div>
            <button
              onClick={() => setActiveNav('schedules')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              Open Full Schedule →
            </button>
          </div>

          {/* Ruler ticks */}
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
                    onClick={() => toggleScheduleCompletion(block.id)}
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

        {/* Middle Row: Reference 1 "Activity" Weekly Gantt Matrix + "Finality" Circular Progress Card */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Activity Weekly Gantt (8 cols) */}
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

            {/* Weekday Header M T W T F S S */}
            <div className="mt-5 grid grid-cols-8 items-center text-center text-xs font-bold text-slate-400">
              <div className="text-left text-[11px] font-normal text-slate-500">Time</div>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDateISO(weekDatesISO[i])}
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

            {/* 4 Horizontal Time Bands with Pill Bars (Reference 1 style) */}
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

          {/* Finality Card (Reference 1 Right Column: Tasks, Goals, Plans with SVG Rings) */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 shadow-xl lg:col-span-4 flex flex-col justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-3.5 w-3.5 rounded bg-sky-400" />
              <h2 className="text-base font-bold text-white">Finality</h2>
            </div>

            <div className="my-auto space-y-5 py-4">
              {/* Row 1: Tasks */}
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
                <CircularRing percent={weeklyMetrics.taskCompletionPct} color="#818cf8" reducedMotion={effectiveReducedMotion} />
              </div>

              {/* Row 2: Goals */}
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
                <CircularRing percent={weeklyMetrics.avgGoalPct} color="#38bdf8" reducedMotion={effectiveReducedMotion} />
              </div>

              {/* Row 3: Plans */}
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
                <CircularRing percent={weeklyMetrics.planCompletionPct} color="#fbbf24" reducedMotion={effectiveReducedMotion} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row 1: Reference 2 Weekly Activity Overview Bar Chart + Protocol Insights + Interactive Daily Habit Check-in */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Weekly Activity Bar Chart (7 cols) */}
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
                onClick={() => setActiveNav('habits')}
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
                    onClick={() => setSelectedDateISO(d.dateISO)}
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

          {/* Today's Habit Protocol Quick Check-in & Telemetry Insights (5 cols) */}
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
                            onClick={() => toggleHabitOnDate(h, selectedDateISO, 'mvd')}
                            title={`Log Minimum Viable Day (${h.minViableValue} ${h.unit})`}
                            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-500/20"
                          >
                            MVD
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleHabitOnDate(h, selectedDateISO, 'toggle')}
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

        {/* Bottom Row 2: Reference 1 "Monthly pinned" Showcase Cards */}
        <div className="kp-card kp-card-interactive rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-3.5 w-3.5 rounded bg-pink-400" />
              <h2 className="text-base font-bold text-white">Monthly pinned</h2>
            </div>
            <button
              onClick={() => setActiveNav('goals')}
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
                  {/* Visual Art Header Banner */}
                  <div
                    className={`relative h-32 w-full bg-gradient-to-br ${
                      g.bannerGradient || 'from-indigo-500/30 via-sky-500/20 to-slate-900'
                    } p-4 flex flex-col justify-between`}
                  >
                    <div className="flex justify-end">
                      <button
                        onClick={() => openModal('goal', g)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className={`w-fit rounded-md px-2.5 py-0.5 text-[11px] font-bold ${cat.bg} ${cat.text} border ${cat.border}`}>
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
  };

  const renderCalendar = () => {
    const [yearNum, monthNum] = calendarMonthCursor.split('-').map(Number);
    const firstDayOfMonth = new Date(yearNum, monthNum - 1, 1);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7; // Mon=0

    const calendarCells = [];
    for (let i = 0; i < startOffset; i++) calendarCells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      calendarCells.push(iso);
    }

    const changeMonth = (delta) => {
      const dt = new Date(yearNum, monthNum - 1 + delta, 1);
      setCalendarMonthCursor(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
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
            {['month', 'week', 'day', 'heatmap'].map((m) => (
              <button
                key={m}
                onClick={() => setCalendarMode(m)}
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
                    onClick={() => changeMonth(-1)}
                    className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:bg-white/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDateISO(todayISO);
                      setCalendarMonthCursor(todayISO.slice(0, 7));
                    }}
                    className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10"
                  >
                    Today
                  </button>
                  <button
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

              <div key={calendarMonthCursor} className={`grid grid-cols-7 gap-1.5 ${effectiveReducedMotion ? '' : 'kp-subview-transition'}`}>
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
                      onClick={() => setSelectedDateISO(iso)}
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
                <h4 className="text-xs font-bold uppercase text-slate-400">Scheduled Time Blocks ({todaySchedules.length})</h4>
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
                <h4 className="text-xs font-bold uppercase text-slate-400">Habits ({todayCompletedHabitsCount}/{todayScheduledHabits.length})</h4>
                <div className="mt-2 space-y-1.5">
                  {todayScheduledHabits.map((h) => {
                    const done = isEntrySatisfied(h, store.habitEntries?.[h.id]?.[selectedDateISO]);
                    return (
                      <div key={h.id} className="flex items-center justify-between rounded-lg bg-[#151926] px-3 py-2 text-xs">
                        <span className={done ? 'text-emerald-300 font-semibold' : 'text-slate-300'}>{h.title}</span>
                        <button
                          onClick={() => toggleHabitOnDate(h, selectedDateISO, 'toggle')}
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
                const blocks = getSchedulesForDate(dISO);
                return (
                  <div
                    key={dISO}
                    onClick={() => setSelectedDateISO(dISO)}
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
                      onClick={() => toggleScheduleCompletion(b.id)}
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
                      onClick={() => toggleTaskStatus(t.id)}
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
                    onClick={() => setSelectedDateISO(iso)}
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
  };

  const renderTasks = () => {
    const filtered = (store.tasks || []).filter((t) => {
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
            onClick={() => openModal('task', null)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" /> New Task
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['all', 'today', 'upcoming', 'completed', 'overdue'].map((f) => (
            <button
              key={f}
              onClick={() => setTaskFilter(f)}
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
                    onClick={() => toggleTaskStatus(t.id)}
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
                    onClick={() => openModal('task', t)}
                    className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteWithUndo('tasks', t.id, 'Task')}
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
  };

  const renderGoals = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Goals & Milestones</h1>
          <p className="text-xs text-slate-400">Measurable long-term targets & Monthly Pinned showcase</p>
        </div>
        <button
          onClick={() => openModal('goal', null)}
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
              : Math.min(100, Math.round(((Number(g.currentValue) || 0) / Math.max(1, Number(g.targetValue) || 1)) * 100));

          return (
            <div key={g.id} className="rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase text-indigo-400">{g.category}</span>
                  <h3 className="text-lg font-bold text-white">{g.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{g.description}</p>
                </div>
                <CircularRing percent={pct} color="#38bdf8" reducedMotion={effectiveReducedMotion} />
              </div>

              {Array.isArray(g.milestones) && g.milestones.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                  <div className="text-xs font-bold text-slate-400">Milestones</div>
                  {g.milestones.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => toggleGoalMilestone(g.id, m.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg bg-[#151926] px-3 py-2 text-left text-xs hover:bg-white/5"
                    >
                      <span
                        className={`relative overflow-visible flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                          m.done ? 'border-emerald-500 bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30' : 'border-white/20'
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
                      <span className={m.done ? 'line-through text-slate-500' : 'text-slate-200'}>{m.title}</span>
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

  const renderSchedules = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Schedules & Time Blocking</h1>
          <p className="text-xs text-slate-400">Planned vs. Actual duration tracking for {selectedDateISO}</p>
        </div>
        <button
          onClick={() => openModal('schedule', null)}
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
                onClick={() => toggleScheduleCompletion(s.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                  s.completed ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-slate-200'
                }`}
              >
                {s.completed ? 'Done' : 'Complete'}
              </button>
              <button
                onClick={() => deleteWithUndo('schedules', s.id, 'Time block')}
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

  const renderHabits = () => {
    const filteredHabits = activeHabits.filter(
      (h) => habitCategoryFilter === 'All' || h.category === habitCategoryFilter
    );

    const bestActiveStreak = activeHabits.reduce(
      (maxS, h) => Math.max(maxS, habitStatsById[h.id]?.currentStreak || 0),
      0
    );
    const avgHabitRate =
      activeHabits.length > 0
        ? Math.round(
            activeHabits.reduce((acc, h) => acc + (habitStatsById[h.id]?.completionRate || 0), 0) /
              activeHabits.length
          )
        : 0;
    const todayDoneTotal = activeHabits.filter((h) =>
      isEntrySatisfied(h, store.habitEntries?.[h.id]?.[todayISO])
    ).length;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Kinetic Habit Protocol</h1>
            <p className="text-xs text-slate-400">
              Real-time streak telemetry, tactile ripple check-ins & Minimum Viable Day (MVD) controls
            </p>
          </div>
          <button
            type="button"
            onClick={() => openModal('habit', null)}
            className="kp-btn inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" /> New Habit
          </button>
        </div>

        {/* Live Habit Telemetry Strip */}
        <div className="kp-stagger-1 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="kp-card kp-card-interactive flex items-center justify-between rounded-2xl border border-white/[0.07] bg-[#10131c] p-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Top Active Streak
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-amber-400">{bestActiveStreak} Days</span>
                <span className="text-xs text-slate-500">live chain</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <Flame className="h-5 w-5" />
            </div>
          </div>

          <div className="kp-card kp-card-interactive flex items-center justify-between rounded-2xl border border-white/[0.07] bg-[#10131c] p-4">
            <div className="min-w-0 flex-1 pr-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Today&apos;s Check-Ins ({todayISO.slice(5)})
              </div>
              <div className="mt-1 text-2xl font-extrabold text-emerald-400">
                {todayDoneTotal}/{activeHabits.length}
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{
                    width: `${
                      activeHabits.length > 0
                        ? Math.round((todayDoneTotal / activeHabits.length) * 100)
                        : 0
                    }%`
                  }}
                />
              </div>
            </div>
            <CircularRing
              percent={
                activeHabits.length > 0
                  ? Math.round((todayDoneTotal / activeHabits.length) * 100)
                  : 0
              }
              color="#34d399"
              size={48}
              strokeWidth={4}
              reducedMotion={effectiveReducedMotion}
            />
          </div>

          <div className="kp-card kp-card-interactive flex items-center justify-between rounded-2xl border border-white/[0.07] bg-[#10131c] p-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Protocol Consistency
              </div>
              <div className="mt-1 text-2xl font-extrabold text-indigo-400">{avgHabitRate}%</div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                Click any date header or cell below to log
              </div>
            </div>
            <CircularRing
              percent={avgHabitRate}
              color="#818cf8"
              size={48}
              strokeWidth={4}
              reducedMotion={effectiveReducedMotion}
            />
          </div>
        </div>

        {/* Category Filter Pills + Active Logging Date Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/[0.07] bg-[#0d1018] p-1">
            {['All', ...Object.keys(CATEGORIES)].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setHabitCategoryFilter(cat)}
                className={`kp-btn rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  habitCategoryFilter === cat
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Logging target date:</span>
            <span className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 font-mono font-bold text-indigo-300">
              {selectedDateISO === todayISO ? `${selectedDateISO} (Today)` : selectedDateISO}
            </span>
          </div>
        </div>

        {/* 7-Day Real Calendar Matrix with Ripple Checkboxes & Custom Stepper */}
        <div className="kp-card overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 shadow-xl">
          {filteredHabits.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-xs text-slate-400">
              No active habits in this category. Click <strong>+ New Habit</strong> above to create one.
            </div>
          ) : (
            <table className="w-full min-w-[740px] text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.07] text-[11px] font-bold uppercase text-slate-400">
                  <th className="pb-3.5 pr-4">Habit & Quantitative Control</th>
                  {weekDatesISO.map((dISO) => {
                    const isTodayCol = dISO === todayISO;
                    const isSelectedCol = dISO === selectedDateISO;
                    return (
                      <th key={dISO} className="pb-3.5 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedDateISO(dISO)}
                          title={`Select ${dISO} for quantitative logging`}
                          className={`kp-btn mx-auto flex flex-col items-center rounded-xl px-2.5 py-1.5 transition-all ${
                            isSelectedCol
                              ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40'
                              : isTodayCol
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                          }`}
                        >
                          <span className="text-[10px] font-extrabold tracking-wider">
                            {parseLocalISO(dISO).toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                          <span className="mt-0.5 text-[10px] font-mono opacity-80">
                            {dISO.slice(5)}
                          </span>
                        </button>
                      </th>
                    );
                  })}
                  <th className="pb-3.5 pl-3 text-right">Live Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredHabits.map((h) => {
                  const stats = habitStatsById[h.id] || {
                    currentStreak: 0,
                    longestStreak: 0,
                    completionRate: 0
                  };
                  const cat = CATEGORIES[h.category] || CATEGORIES.General;
                  const CatIcon = cat.icon || Flame;
                  const currentEntry = store.habitEntries?.[h.id]?.[selectedDateISO];
                  const currentVal = Number(currentEntry?.value || 0);
                  const targetVal = Math.max(1, Number(h.targetValue) || 1);
                  const mvdVal = Math.max(1, Number(h.minViableValue) || 1);
                  const progressPct = Math.min(100, Math.round((currentVal / targetVal) * 100));
                  const stepAmount =
                    h.trackingType === 'duration' ? 15 : h.trackingType === 'numeric' ? 5 : 1;
                  const pulseKey = streakPulseByHabit[h.id];

                  return (
                    <tr
                      key={h.id}
                      className="group transition-colors duration-150 hover:bg-white/[0.015]"
                    >
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
                                <span className="font-bold text-white text-sm truncate">
                                  {h.title}
                                </span>
                                <span
                                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${cat.bg} ${cat.text}`}
                                >
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
                              onClick={() => openModal('habit', h)}
                              title="Edit Habit"
                              className="kp-btn rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-white"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteWithUndo('habits', h.id, 'Habit')}
                              title="Delete Habit"
                              className="kp-btn rounded-lg p-1 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Custom Animated Stepper & Progress Bar (replaces native browser number spinner) */}
                        {h.trackingType !== 'binary' && (
                          <div className="mt-2.5 max-w-xs space-y-1.5 rounded-xl border border-white/[0.07] bg-[#141824] p-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="inline-flex items-center gap-1 rounded-lg bg-[#0d1018] p-0.5 border border-white/[0.06]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerCheckRipple(`hab-${h.id}-${selectedDateISO}`);
                                    updateHabitQuantitativeValue(
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
                                    updateHabitQuantitativeValue(h, selectedDateISO, e.target.value)
                                  }
                                  className="w-12 bg-transparent text-center font-mono text-xs font-bold text-white focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerCheckRipple(`hab-${h.id}-${selectedDateISO}`);
                                    updateHabitQuantitativeValue(
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
                                    triggerCheckRipple(`hab-${h.id}-${selectedDateISO}`);
                                    updateHabitQuantitativeValue(h, selectedDateISO, mvdVal);
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
                                    triggerCheckRipple(`hab-${h.id}-${selectedDateISO}`);
                                    updateHabitQuantitativeValue(h, selectedDateISO, targetVal);
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
                              onClick={() => toggleHabitOnDate(h, dISO, 'toggle')}
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
                              {rippleStamp && (
                                <span key={rippleStamp} className="kp-ripple-ring" />
                              )}
                              <span className="relative overflow-hidden flex h-full w-full items-center justify-center rounded-xl">
                                {rippleStamp && (
                                  <span key={`w-${rippleStamp}`} className="kp-ripple-wave" />
                                )}
                                {done ? (
                                  <Check className="h-4 w-4 stroke-[2.6] kp-check-pop" />
                                ) : null}
                              </span>
                            </button>
                          </td>
                        );
                      })}

                      {/* Real-Time Animated Streak Column */}
                      <td className="py-4 pl-3 text-right align-middle">
                        <div
                          key={pulseKey || 'static'}
                          className={`inline-flex items-center justify-end gap-1 rounded-xl border px-2.5 py-1 ${
                            stats.currentStreak > 0
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                              : 'border-white/[0.06] bg-white/[0.03] text-slate-400'
                          } ${pulseKey ? 'kp-streak-fire' : ''}`}
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
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  // Compute unified Daily / Weekly / Monthly telemetry series and category allocations for Statistics
  const telemetryAnalytics = useMemo(() => {
    const getDayTelemetry = (dISO) => {
      const blocks = getSchedulesForDate(dISO);
      const dayHabits = activeHabits.filter((h) => isHabitScheduledOnDate(h, dISO));
      const doneHabits = dayHabits.filter((h) =>
        isEntrySatisfied(h, store.habitEntries?.[h.id]?.[dISO])
      );
      const dayTasks = (store.tasks || []).filter((t) => t.dueDate === dISO);
      const doneTasks = dayTasks.filter((t) => t.status === 'completed');

      let plannedMins = blocks.reduce((acc, b) => acc + (Number(b.plannedMinutes) || 0), 0);
      let actualMins = blocks.reduce(
        (acc, b) =>
          acc +
          (Number(b.actualMinutes) ||
            (b.completed && dISO <= todayISO ? Number(b.plannedMinutes) || 0 : 0)),
        0
      );

      // Include duration-tracked habit entries so habit logging also enriches telemetry
      dayHabits.forEach((h) => {
        const entry = store.habitEntries?.[h.id]?.[dISO];
        const targetMins =
          h.trackingType === 'duration' ? Number(h.targetValue) || 45 : 25;
        plannedMins += targetMins;
        if (isEntrySatisfied(h, entry)) {
          actualMins +=
            h.trackingType === 'duration'
              ? Number(entry?.value) || targetMins
              : targetMins;
        }
      });

      // Add completed task focus contribution
      actualMins += doneTasks.length * 25;
      plannedMins += dayTasks.length * 25;

      const habitRatio =
        dayHabits.length > 0 ? doneHabits.length / dayHabits.length : 0.75;
      const velocityMins = Math.round(
        actualMins * (0.52 + 0.48 * habitRatio)
      );

      // Category minutes breakdown for this day
      const categoryMins = {};
      Object.keys(CATEGORIES).forEach((c) => {
        categoryMins[c] = 0;
      });
      blocks.forEach((b) => {
        const cat = CATEGORIES[b.category] ? b.category : 'General';
        const mins =
          Number(b.actualMinutes) ||
          (b.completed && dISO <= todayISO ? Number(b.plannedMinutes) || 0 : 0);
        categoryMins[cat] = (categoryMins[cat] || 0) + mins;
      });
      doneHabits.forEach((h) => {
        const cat = CATEGORIES[h.category] ? h.category : 'General';
        const entry = store.habitEntries?.[h.id]?.[dISO];
        const mins =
          h.trackingType === 'duration' ? Number(entry?.value) || 45 : 25;
        categoryMins[cat] = (categoryMins[cat] || 0) + mins;
      });
      doneTasks.forEach((t) => {
        const cat = CATEGORIES[t.category] ? t.category : 'General';
        categoryMins[cat] = (categoryMins[cat] || 0) + 25;
      });

      return {
        dateISO: dISO,
        plannedMins,
        actualMins,
        velocityMins,
        doneHabitsCount: doneHabits.length,
        totalHabitsCount: dayHabits.length,
        doneTasksCount: doneTasks.length,
        totalTasksCount: dayTasks.length,
        categoryMins,
        sessionsCount: blocks.filter((b) => b.completed || Number(b.actualMinutes) > 0).length + doneHabits.length + doneTasks.length
      };
    };

    let points = [];
    let periodDates = [];
    let subtitle = '';
    let targetCapMins = 1800;
    let daysLeft = 1;

    if (statsTimeframe === 'daily') {
      subtitle = 'Planned capacity vs actual focus & net velocity across past 7 days';
      targetCapMins = (store.settings?.dailyFocusTargetMinutes || 240) * 7;
      periodDates = Array.from({ length: 7 }, (_, i) =>
        addDaysISO(selectedDateISO, -(6 - i))
      );
      const wd = getWeekdayMon0(selectedDateISO);
      daysLeft = Math.max(1, 6 - wd);

      points = periodDates.map((dISO, idx) => {
        const dt = parseLocalISO(dISO);
        const dayStats = getDayTelemetry(dISO);
        const shortLabel = dt.toLocaleDateString('en-US', { weekday: 'short' });
        const fullLabel = dt.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        const effPct =
          dayStats.plannedMins > 0
            ? Math.min(100, Math.round((dayStats.actualMins / dayStats.plannedMins) * 100))
            : 0;
        return {
          id: dISO,
          label: shortLabel,
          tooltipTitle: dISO === todayISO ? `${fullLabel} (Today)` : fullLabel,
          isCurrent: idx === periodDates.length - 1,
          plannedMins: dayStats.plannedMins,
          actualMins: dayStats.actualMins,
          velocityMins: dayStats.velocityMins,
          efficiencyPct: effPct,
          habitsSummary: `${dayStats.doneHabitsCount}/${dayStats.totalHabitsCount} habits`
        };
      });
    } else if (statsTimeframe === 'weekly') {
      subtitle = 'Planned capacity vs actual focus & net velocity across past 6 weeks';
      targetCapMins = (store.settings?.dailyFocusTargetMinutes || 240) * 7;
      const currentWeekDates = getWeekDatesISO(
        selectedDateISO,
        store.settings?.weekStartsOnMonday ?? true
      );
      const currentWeekStart = currentWeekDates[0];
      const wd = getWeekdayMon0(selectedDateISO);
      daysLeft = Math.max(1, 7 - wd);

      // Collect all dates in the current week for allocation breakdown
      periodDates = currentWeekDates;

      points = Array.from({ length: 6 }, (_, idx) => {
        const weeksBack = 5 - idx;
        const wkStartISO = addDaysISO(currentWeekStart, -weeksBack * 7);
        const wkEndISO = addDaysISO(wkStartISO, 6);
        const wkDays = Array.from({ length: 7 }, (__, d) => addDaysISO(wkStartISO, d));
        const startDt = parseLocalISO(wkStartISO);
        const shortLabel =
          weeksBack === 0
            ? 'This Wk'
            : startDt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const fullLabel = `Week of ${startDt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })} – ${parseLocalISO(wkEndISO).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })}`;

        let plannedSum = 0;
        let actualSum = 0;
        let velocitySum = 0;
        let doneH = 0;
        let totalH = 0;

        wkDays.forEach((dISO) => {
          if (dISO > todayISO) return;
          const ds = getDayTelemetry(dISO);
          plannedSum += ds.plannedMins;
          actualSum += ds.actualMins;
          velocitySum += ds.velocityMins;
          doneH += ds.doneHabitsCount;
          totalH += ds.totalHabitsCount;
        });

        const effPct =
          plannedSum > 0 ? Math.min(100, Math.round((actualSum / plannedSum) * 100)) : 0;

        return {
          id: wkStartISO,
          label: shortLabel,
          tooltipTitle: fullLabel,
          isCurrent: idx === 5,
          plannedMins: plannedSum,
          actualMins: actualSum,
          velocityMins: velocitySum,
          efficiencyPct: effPct,
          habitsSummary: `${doneH}/${Math.max(1, totalH)} checks`
        };
      });
    } else {
      subtitle = 'Planned capacity vs actual focus & net velocity across past 6 months';
      const anchorDt = parseLocalISO(selectedDateISO);
      const curYear = anchorDt.getFullYear();
      const curMonth = anchorDt.getMonth();
      const daysInCurMonth = new Date(curYear, curMonth + 1, 0).getDate();
      daysLeft = Math.max(1, daysInCurMonth - anchorDt.getDate());
      targetCapMins = (store.settings?.dailyFocusTargetMinutes || 240) * 22;

      // Current month dates up to today for the allocation card
      periodDates = [];
      for (let d = 1; d <= daysInCurMonth; d++) {
        const iso = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (iso <= todayISO) periodDates.push(iso);
      }

      points = Array.from({ length: 6 }, (_, idx) => {
        const monthsBack = 5 - idx;
        const mDt = new Date(curYear, curMonth - monthsBack, 1);
        const y = mDt.getFullYear();
        const m = mDt.getMonth();
        const mDaysCount = new Date(y, m + 1, 0).getDate();
        const shortLabel = mDt.toLocaleDateString('en-US', { month: 'short' });
        const fullLabel = mDt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        let plannedSum = 0;
        let actualSum = 0;
        let velocitySum = 0;
        let doneH = 0;
        let totalH = 0;

        // Only count dates from the workspace's earliest active habit/schedule start date
        const earliestHabitStart = (store.habits || []).reduce(
          (minISO, h) => (h.startDate && h.startDate < minISO ? h.startDate : minISO),
          addDaysISO(todayISO, -45)
        );

        for (let d = 1; d <= mDaysCount; d++) {
          const dISO = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          if (dISO > todayISO || dISO < earliestHabitStart) continue;
          const ds = getDayTelemetry(dISO);
          plannedSum += ds.plannedMins;
          actualSum += ds.actualMins;
          velocitySum += ds.velocityMins;
          doneH += ds.doneHabitsCount;
          totalH += ds.totalHabitsCount;
        }

        const effPct =
          plannedSum > 0 ? Math.min(100, Math.round((actualSum / plannedSum) * 100)) : 0;

        return {
          id: `${y}-${String(m + 1).padStart(2, '0')}`,
          label: shortLabel,
          tooltipTitle: fullLabel,
          isCurrent: idx === 5,
          plannedMins: plannedSum,
          actualMins: actualSum,
          velocityMins: velocitySum,
          efficiencyPct: effPct,
          habitsSummary: `${doneH} habit logs`
        };
      });
    }

    // Aggregate Category Allocations across periodDates
    const categoryTotals = {};
    const categorySessionCounts = {};
    Object.keys(CATEGORIES).forEach((c) => {
      categoryTotals[c] = 0;
      categorySessionCounts[c] = 0;
    });

    periodDates.forEach((dISO) => {
      const ds = getDayTelemetry(dISO);
      Object.entries(ds.categoryMins).forEach(([cat, mins]) => {
        if (mins > 0) {
          categoryTotals[cat] = (categoryTotals[cat] || 0) + mins;
          categorySessionCounts[cat] = (categorySessionCounts[cat] || 0) + 1;
        }
      });
    });

    const totalAllocatedMins = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    const allocationRows = Object.entries(categoryTotals)
      .filter(([, mins]) => mins > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, mins]) => ({
        category: cat,
        minutes: mins,
        percent: totalAllocatedMins > 0 ? (mins / totalAllocatedMins) * 100 : 0,
        sessions: categorySessionCounts[cat] || 1,
        color: CATEGORIES[cat]?.color || '#94a3b8'
      }));

    const topCategoryRow = allocationRows[0] || {
      category: 'Code',
      minutes: 0,
      percent: 0,
      sessions: 0,
      color: '#38bdf8'
    };

    const maxStreak = activeHabits.reduce(
      (maxS, h) => Math.max(maxS, habitStatsById[h.id]?.currentStreak || 0),
      0
    );

    const capPct =
      targetCapMins > 0 ? Math.round((totalAllocatedMins / targetCapMins) * 100) : 0;

    return {
      subtitle,
      points,
      totalAllocatedMins,
      capPct,
      allocationRows,
      topCategoryRow,
      maxStreak,
      daysLeft
    };
  }, [
    statsTimeframe,
    selectedDateISO,
    todayISO,
    store.schedules,
    store.tasks,
    store.habitEntries,
    store.habits,
    store.settings,
    activeHabits,
    habitStatsById
  ]);

  // Reset hover index if timeframe changes
  useEffect(() => {
    setStatsHoverIdx(null);
  }, [statsTimeframe]);

  const renderStatistics = () => {
    const {
      subtitle,
      points,
      totalAllocatedMins,
      capPct,
      allocationRows,
      topCategoryRow,
      maxStreak,
      daysLeft
    } = telemetryAnalytics;

    // SVG coordinate system matching the Cashflow reference layout
    const svgWidth = 680;
    const svgHeight = 265;
    const padLeft = 28;
    const padRight = 56;
    const padTop = 24;
    const padBottom = 38;
    const plotW = svgWidth - padLeft - padRight;
    const plotH = svgHeight - padTop - padBottom;

    const maxVal = Math.max(
      120,
      ...points.map((p) => Math.max(p.plannedMins, p.actualMins, p.velocityMins))
    );
    const niceMax = Math.ceil(maxVal / 60) * 60;

    const getX = (idx) =>
      points.length <= 1
        ? padLeft + plotW / 2
        : padLeft + (idx / (points.length - 1)) * plotW;

    const getY = (val) =>
      padTop + plotH - (Math.max(0, Math.min(niceMax, val)) / niceMax) * plotH;

    const buildLinePath = (key) =>
      points
        .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p[key]).toFixed(1)}`)
        .join(' ');

    const plannedPath = buildLinePath('plannedMins');
    const actualPath = buildLinePath('actualMins');
    const velocityPath = buildLinePath('velocityMins');

    const areaBaselineY = padTop + plotH;
    const plannedAreaPath =
      points.length > 0
        ? `${plannedPath} L ${getX(points.length - 1).toFixed(1)} ${areaBaselineY} L ${getX(0).toFixed(1)} ${areaBaselineY} Z`
        : '';

    const showPlanned = statsSeriesFilter === 'all' || statsSeriesFilter === 'planned';
    const showActual = statsSeriesFilter === 'all' || statsSeriesFilter === 'actual';
    const showVelocity = statsSeriesFilter === 'all' || statsSeriesFilter === 'velocity';

    const yGridTicks = [1, 0.72, 0.44, 0.16].map((ratio) => {
      const mins = Math.round(niceMax * ratio);
      const y = getY(mins);
      return { mins, y, label: formatDurationMinutes(mins) };
    });

    const activeHoverIdx =
      statsHoverIdx !== null && statsHoverIdx >= 0 && statsHoverIdx < points.length
        ? statsHoverIdx
        : null;
    const hoveredPoint = activeHoverIdx !== null ? points[activeHoverIdx] : null;

    return (
      <div className="space-y-6">
        {/* Header & Unified 3-in-1 Timeframe Selector (Daily / Weekly / Monthly) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Statistics & Telemetry</h1>
            <p className="text-xs text-slate-400">
              Interactive focus flow, execution velocity & category allocations
            </p>
          </div>

          <div className="inline-flex items-center gap-1 rounded-2xl border border-white/[0.08] bg-[#10131c] p-1 self-start sm:self-auto">
            {[
              { id: 'daily', label: 'Daily' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' }
            ].map((tf) => {
              const active = statsTimeframe === tf.id;
              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setStatsTimeframe(tf.id)}
                  className={`kp-btn rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Finance-Inspired Dual Analytics Row: Execution Flow (Left 8 Cols) + Focus Allocations (Right 4 Cols) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Card: Cashflow-Style Interactive Multi-Line + Shaded Area Graph */}
          <div className="kp-card rounded-2xl border border-white/[0.08] bg-[#0d111a] p-5 sm:p-6 shadow-2xl lg:col-span-8 flex flex-col justify-between">
            {/* Top Header Row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-extrabold tracking-tight text-white">
                    Execution Flow
                  </h2>
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
              </div>

              {/* Series Filter Pill Bar (All | Planned | Actual | Velocity) */}
              <div className="inline-flex items-center gap-1 rounded-xl border border-white/[0.07] bg-[#151a28] p-1 self-start">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'planned', label: 'Planned' },
                  { id: 'actual', label: 'Actual' },
                  { id: 'velocity', label: 'Velocity' }
                ].map((tab) => {
                  const isActive = statsSeriesFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatsSeriesFilter(tab.id)}
                      className={`kp-btn rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                        isActive
                          ? 'bg-[#22293e] text-blue-400 shadow-sm border border-blue-500/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive SVG Plot Container */}
            <div
              className="relative mt-5 select-none"
              onMouseLeave={() => setStatsHoverIdx(null)}
            >
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-64 sm:h-72 overflow-visible"
              >
                <defs>
                  <linearGradient id="kpFlowAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
                    <stop offset="75%" stopColor="#3b82f6" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Dashed Grid Lines & Right-Side Y-Axis Labels */}
                {yGridTicks.map((t, i) => (
                  <g key={i}>
                    <line
                      x1={padLeft}
                      y1={t.y}
                      x2={svgWidth - padRight + 8}
                      y2={t.y}
                      stroke="rgba(255,255,255,0.06)"
                      strokeDasharray="2 3"
                    />
                    <text
                      x={svgWidth - 4}
                      y={t.y + 3}
                      textAnchor="end"
                      className="fill-slate-500 text-[10px] font-semibold"
                    >
                      {t.label}
                    </text>
                  </g>
                ))}

                {/* Shaded Area under Planned Capacity Line */}
                {showPlanned && plannedAreaPath && (
                  <path d={plannedAreaPath} fill="url(#kpFlowAreaGrad)" />
                )}

                {/* Hover Vertical Crosshair Line */}
                {activeHoverIdx !== null && (
                  <line
                    x1={getX(activeHoverIdx)}
                    y1={padTop - 6}
                    x2={getX(activeHoverIdx)}
                    y2={areaBaselineY}
                    stroke="#3b82f6"
                    strokeWidth="1.2"
                    strokeOpacity="0.6"
                  />
                )}

                {/* Emerald Solid Line (Net Velocity) */}
                {showVelocity && (
                  <path
                    d={velocityPath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Blue Solid Line (Planned Capacity) */}
                {showPlanned && (
                  <path
                    d={plannedPath}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Rose/Pink Dashed Line (Actual Logged) */}
                {showActual && (
                  <path
                    d={actualPath}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.4"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points & Hover Halo Rings */}
                {points.map((p, idx) => {
                  const cx = getX(idx);
                  const yPlan = getY(p.plannedMins);
                  const yAct = getY(p.actualMins);
                  const yVel = getY(p.velocityMins);
                  const isHovered = activeHoverIdx === idx;

                  return (
                    <g key={p.id}>
                      {/* Planned point */}
                      {showPlanned && (
                        <>
                          {isHovered && (
                            <circle
                              cx={cx}
                              cy={yPlan}
                              r="8"
                              fill="rgba(59, 130, 246, 0.18)"
                              stroke="#3b82f6"
                              strokeWidth="1.8"
                            />
                          )}
                          <circle
                            cx={cx}
                            cy={yPlan}
                            r={isHovered ? '4.2' : '3.2'}
                            fill="#3b82f6"
                            stroke="#0d111a"
                            strokeWidth="1.5"
                          />
                        </>
                      )}

                      {/* Actual point */}
                      {showActual && (
                        <>
                          {isHovered && (
                            <circle
                              cx={cx}
                              cy={yAct}
                              r="8"
                              fill="rgba(244, 63, 94, 0.18)"
                              stroke="#f43f5e"
                              strokeWidth="1.8"
                            />
                          )}
                          <circle
                            cx={cx}
                            cy={yAct}
                            r={isHovered ? '4.2' : '3.2'}
                            fill="#f43f5e"
                            stroke="#0d111a"
                            strokeWidth="1.5"
                          />
                        </>
                      )}

                      {/* Velocity point */}
                      {showVelocity && isHovered && (
                        <>
                          <circle
                            cx={cx}
                            cy={yVel}
                            r="7"
                            fill="rgba(16, 185, 129, 0.18)"
                            stroke="#10b981"
                            strokeWidth="1.6"
                          />
                          <circle
                            cx={cx}
                            cy={yVel}
                            r="3.8"
                            fill="#10b981"
                            stroke="#0d111a"
                            strokeWidth="1.5"
                          />
                        </>
                      )}

                      {/* X-Axis Period Label + Current Dot Indicator */}
                      <text
                        x={cx}
                        y={svgHeight - 10}
                        textAnchor="middle"
                        className={`text-[11px] transition-colors ${
                          isHovered
                            ? 'fill-white font-extrabold'
                            : p.isCurrent
                            ? 'fill-blue-400 font-bold'
                            : 'fill-slate-500 font-medium'
                        }`}
                      >
                        {p.label}
                      </text>
                      {p.isCurrent && (
                        <circle
                          cx={cx + 22}
                          cy={svgHeight - 14}
                          r="2.8"
                          fill="#3b82f6"
                        />
                      )}

                      {/* Invisible Column Hit Target for Smooth Cursor Tracking */}
                      <rect
                        x={cx - plotW / Math.max(2, points.length * 2)}
                        y={padTop - 10}
                        width={plotW / Math.max(1, points.length)}
                        height={plotH + 28}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setStatsHoverIdx(idx)}
                        onClick={() => setStatsHoverIdx(idx)}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Floating Glass Tooltip on Hover (matching image_a79506.png) */}
              {hoveredPoint && activeHoverIdx !== null && (
                <div
                  style={{
                    left:
                      activeHoverIdx >= points.length - 2
                        ? `${Math.max(6, ((getX(activeHoverIdx) - 195) / svgWidth) * 100)}%`
                        : `${Math.min(68, ((getX(activeHoverIdx) + 16) / svgWidth) * 100)}%`,
                    top: '10%'
                  }}
                  className="pointer-events-none absolute z-20 w-52 rounded-xl border border-white/15 bg-[#111624]/95 p-3.5 text-xs shadow-2xl backdrop-blur-md transition-all duration-150"
                >
                  <div className="border-b border-white/10 pb-2 text-xs font-extrabold text-white">
                    {hoveredPoint.tooltipTitle}
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sky-300">Planned:</span>
                      <span className="font-mono font-bold text-sky-400">
                        +{formatDurationMinutes(hoveredPoint.plannedMins)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-rose-300">Actual Focus:</span>
                      <span className="font-mono font-bold text-rose-400">
                        {formatDurationMinutes(hoveredPoint.actualMins)}
                      </span>
                    </div>
                    <div className="my-1.5 border-t border-white/[0.08]" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-400">Net Velocity:</span>
                      <span className="font-mono font-extrabold text-emerald-400">
                        {formatDurationMinutes(hoveredPoint.velocityMins)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Efficiency:</span>
                      <span className="font-mono text-slate-300">
                        {hoveredPoint.efficiencyPct}% ({hoveredPoint.habitsSummary})
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Legend & Live Telemetry Caption */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3.5 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setStatsSeriesFilter((f) => (f === 'planned' ? 'all' : 'planned'))
                  }
                  className={`flex items-center gap-1.5 font-semibold transition ${
                    showPlanned ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
                  <span>Planned Capacity</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setStatsSeriesFilter((f) => (f === 'actual' ? 'all' : 'actual'))
                  }
                  className={`flex items-center gap-1.5 font-semibold transition ${
                    showActual ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f43f5e]" />
                  <span>Actual Focus</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setStatsSeriesFilter((f) => (f === 'velocity' ? 'all' : 'velocity'))
                  }
                  className={`flex items-center gap-1.5 font-semibold transition ${
                    showVelocity ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
                  <span>Net Velocity</span>
                </button>
              </div>
              <span className="text-[11px] text-slate-500">Live telemetry tracking</span>
            </div>
          </div>

          {/* Right Card: Spending-Allocations-Style Focus Allocations Card */}
          <div className="kp-card rounded-2xl border border-white/[0.08] bg-[#0d111a] p-5 sm:p-6 shadow-2xl lg:col-span-4 flex flex-col justify-between">
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-blue-400" />
                  <h2 className="text-base font-extrabold text-white">Focus Allocations</h2>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setStatsTimeframe((prev) =>
                      prev === 'daily' ? 'weekly' : prev === 'weekly' ? 'monthly' : 'daily'
                    )
                  }
                  title="Click to cycle Daily / Weekly / Monthly"
                  className="text-xs font-semibold lowercase text-slate-400 hover:text-indigo-300 transition"
                >
                  {statsTimeframe}
                </button>
              </div>

              {/* Hero Metric */}
              <div className="mt-4">
                <div className="text-3xl font-extrabold tracking-tight text-white">
                  {formatDurationMinutes(totalAllocatedMins)}
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  {capPct}% of {statsTimeframe} category targets
                </div>
              </div>

              {/* Multi-Segment Horizontal Pill Progress Bar */}
              <div className="mt-4 flex h-2.5 w-full items-center gap-1 overflow-hidden rounded-full bg-white/[0.05] p-0.5">
                {allocationRows.length === 0 ? (
                  <div className="h-full w-full rounded-full bg-slate-700/50" />
                ) : (
                  allocationRows.map((row) => (
                    <div
                      key={row.category}
                      onMouseEnter={() => setHoveredAllocationCat(row.category)}
                      onMouseLeave={() => setHoveredAllocationCat(null)}
                      style={{
                        width: `${Math.max(6, row.percent)}%`,
                        backgroundColor: row.color
                      }}
                      title={`${row.category}: ${formatDurationMinutes(row.minutes)} (${row.percent.toFixed(1)}%)`}
                      className={`h-full rounded-full transition-all duration-300 ${
                        hoveredAllocationCat && hoveredAllocationCat !== row.category
                          ? 'opacity-40'
                          : 'opacity-100'
                      }`}
                    />
                  ))
                )}
              </div>

              {/* Category Breakdown List */}
              <div className="mt-4 space-y-2.5">
                {allocationRows.slice(0, 4).map((row) => (
                  <div
                    key={row.category}
                    onMouseEnter={() => setHoveredAllocationCat(row.category)}
                    onMouseLeave={() => setHoveredAllocationCat(null)}
                    className={`flex items-center justify-between rounded-lg px-1.5 py-1 text-xs transition ${
                      hoveredAllocationCat === row.category ? 'bg-white/[0.05]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="font-semibold text-slate-200">{row.category}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-white">
                        {formatDurationMinutes(row.minutes)}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        ({row.percent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Summary Stats & View Daily Heatmap CTA */}
            <div className="mt-5 space-y-3 border-t border-white/[0.07] pt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-400">
                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                  <span>Active Protocol Streak</span>
                </span>
                <span className="font-extrabold text-white">{maxStreak} Days</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-400">
                  <CalendarIcon className="h-3.5 w-3.5 text-blue-400" />
                  <span>Days Left</span>
                </span>
                <span className="font-extrabold text-white">{daysLeft} Days</span>
              </div>

              <div className="rounded-xl bg-white/[0.04] px-3 py-2 text-[11px] text-slate-400">
                Frequent:{' '}
                <strong className="text-white">{topCategoryRow.category}</strong> (
                {topCategoryRow.sessions} sessions)
              </div>

              <button
                type="button"
                onClick={() => {
                  setCalendarMode('heatmap');
                  setActiveNav('calendar');
                }}
                className="kp-btn w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-center text-xs font-bold text-slate-200 hover:border-indigo-500/40 hover:bg-white/[0.06] hover:text-white"
              >
                View Daily Heatmap →
              </button>
            </div>
          </div>
        </div>

        {/* Secondary KPI Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="kp-card kp-card-interactive rounded-2xl border border-white/[0.07] bg-[#10131c] p-5">
            <div className="text-xs text-slate-400">Task Completion Rate</div>
            <div className="mt-2 text-3xl font-extrabold text-indigo-400">
              {weeklyMetrics.taskCompletionPct}%
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {weeklyMetrics.completedTasksCount} of {weeklyMetrics.totalTasksCount} tasks completed
            </div>
          </div>
          <div className="kp-card kp-card-interactive rounded-2xl border border-white/[0.07] bg-[#10131c] p-5">
            <div className="text-xs text-slate-400">Weekly Planned vs Actual Time</div>
            <div className="mt-2 text-3xl font-extrabold text-emerald-400">
              {formatDurationMinutes(weeklyMetrics.totalActualMins)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Planned: {formatDurationMinutes(weeklyMetrics.totalPlannedMins)}
            </div>
          </div>
          <div className="kp-card kp-card-interactive rounded-2xl border border-white/[0.07] bg-[#10131c] p-5">
            <div className="text-xs text-slate-400">Average Goal Progress</div>
            <div className="mt-2 text-3xl font-extrabold text-sky-400">
              {weeklyMetrics.avgGoalPct}%
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Across {weeklyMetrics.totalGoalsCount} active goals
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNotes = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Files & Study Notes</h1>
          <p className="text-xs text-slate-400">Research notes with local IndexedDB PDF binary attachments</p>
        </div>
        <button
          type="button"
          onClick={() => openModal('note', null)}
          className="kp-btn inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" /> New Note / PDF
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(store.notes || []).map((n) => {
          const att = n.attachment;
          const isDownloading = Boolean(att?.storageKey && downloadingKeys[att.storageKey]);
          const isDownloaded = Boolean(att?.storageKey && downloadedKeys[att.storageKey]);

          return (
            <div
              key={n.id}
              className="kp-card kp-card-interactive flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 space-y-3"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      {n.category}
                    </span>
                    <h3 className="text-base font-bold text-white">{n.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteWithUndo('notes', n.id, 'Note')}
                    className="kp-btn rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"
                    title="Delete Note"
                    aria-label={`Delete note ${n.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{n.content}</p>
              </div>

              {att && (
                <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2.5 text-xs transition-colors duration-150 hover:border-indigo-400/50 hover:bg-indigo-500/[0.14]">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-indigo-300" />
                    <span className="truncate font-semibold text-indigo-100" title={att.name}>
                      {att.name}
                    </span>
                    {att.size ? (
                      <span className="shrink-0 rounded bg-indigo-500/20 px-1.5 py-0.5 font-mono text-[10px] text-indigo-300">
                        {formatFileSize(att.size)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                    <button
                      type="button"
                      onClick={() => openPdfPreview(att)}
                      className="kp-btn inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg bg-indigo-500 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    >
                      <Eye className="h-3.5 w-3.5 shrink-0" />
                      <span>Preview PDF</span>
                    </button>
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => downloadPdfAttachment(att)}
                      aria-label={`Download ${att.name || 'PDF'}`}
                      className={`kp-btn inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                        isDownloading
                          ? 'cursor-wait border-indigo-500/20 bg-indigo-950/60 text-indigo-300 opacity-75'
                          : isDownloaded
                          ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-200'
                          : 'border-indigo-400/35 bg-[#141929] text-indigo-200 hover:border-indigo-400/60 hover:bg-indigo-500/20 hover:text-white'
                      }`}
                    >
                      {isDownloading ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin" />
                          <span>Downloading...</span>
                        </>
                      ) : isDownloaded ? (
                        <>
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          <span>Downloaded</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5 shrink-0" />
                          <span>Download</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderJournal = () => {
    const entry = store.journals?.[selectedDateISO] || {
      wentWell: '',
      wasDifficult: '',
      lessonsLearned: '',
      improveTomorrow: ''
    };
    const updateField = (field, val) => {
      setStore((prev) => ({
        ...prev,
        isStarterWorkspace: false,
        journals: {
          ...(prev.journals || {}),
          [selectedDateISO]: {
            ...entry,
            id: `jrn-${selectedDateISO}`,
            date: selectedDateISO,
            [field]: val,
            updatedAt: new Date().toISOString()
          }
        }
      }));
    };

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Journal & Weekly Review</h1>
          <p className="text-xs text-slate-400">Entry for {formatReadableDate(selectedDateISO)}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            { key: 'wentWell', label: '1. What went well today?' },
            { key: 'wasDifficult', label: '2. What was difficult or caused friction?' },
            { key: 'lessonsLearned', label: '3. Key lessons or technical insights' },
            { key: 'improveTomorrow', label: '4. What to optimize tomorrow' }
          ].map((f) => (
            <div key={f.key} className="rounded-2xl border border-white/[0.07] bg-[#10131c] p-4">
              <label className="block text-xs font-bold text-slate-300 mb-2">{f.label}</label>
              <textarea
                rows={4}
                value={entry[f.key] || ''}
                onChange={(e) => updateField(f.key, e.target.value)}
                placeholder="Write reflection..."
                className="w-full rounded-xl border border-white/10 bg-[#151926] p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleCompleteWorkspaceReset = async () => {
    if (resetTypedCode !== resetChallengeCode) {
      showToast('Verification code does not match the 12-character challenge.', 'error');
      return;
    }
    try {
      const keys = await idbListAllKeys();
      await Promise.all(keys.map((k) => idbDeletePdfBlob(k).catch(() => {})));
    } catch {
      // Ignore IndexedDB cleanup errors
    }

    const freshStore = {
      version: 2,
      isStarterWorkspace: false,
      migrationLog: [],
      habits: [],
      habitEntries: {},
      tasks: [],
      goals: [],
      schedules: [],
      notes: [],
      journals: {},
      settings: {
        ...(store.settings || {}),
        userName: store.settings?.userName || 'Operator',
        weekStartsOnMonday: store.settings?.weekStartsOnMonday ?? true,
        timeFormat24h: true,
        reducedMotion: Boolean(store.settings?.reducedMotion),
        defaultCalendarView: 'month',
        dailyFocusTargetMinutes: 240,
        maxPdfSizeMB: DEFAULT_MAX_PDF_MB
      }
    };

    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(freshStore));
    } catch {
      // Ignore storage quota errors
    }

    setStore(freshStore);
    setUndoBanner(null);
    setResetTypedCode('');
    setResetPanelOpen(false);
    setResetChallengeCode(generateResetChallengeCode(12));
    showToast('Workspace wiped clean. You are now starting completely fresh!', 'success');
  };

  const renderSettings = () => {
    const isCodeMatched = resetTypedCode === resetChallengeCode;

    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white">System Settings</h1>
          <p className="text-xs text-slate-400">
            Operator profile, calendar preferences, motion accessibility & workspace reset
          </p>
        </div>

        <div className="kp-card rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Display Name</label>
            <input
              type="text"
              value={store.settings?.userName || ''}
              onChange={(e) =>
                setStore((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, userName: e.target.value }
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-[#151926] px-3 py-2 text-sm text-white transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <div>
              <div className="text-sm font-medium text-slate-200">Week Starts on Monday</div>
              <div className="text-xs text-slate-400">
                Align weekly matrices and calendar grids to Monday
              </div>
            </div>
            <input
              type="checkbox"
              checked={store.settings?.weekStartsOnMonday ?? true}
              onChange={(e) =>
                setStore((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, weekStartsOnMonday: e.target.checked }
                }))
              }
              className="h-4 w-4 accent-indigo-500 cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <div>
              <div className="text-sm font-medium text-slate-200">Reduced Motion</div>
              <div className="text-xs text-slate-400">
                Minimize page transitions, scale effects, and progress animations
                {prefersReducedMotion ? ' (System prefers-reduced-motion active)' : ''}
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(store.settings?.reducedMotion)}
              onChange={(e) =>
                setStore((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, reducedMotion: e.target.checked }
                }))
              }
              className="h-4 w-4 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Danger Zone: Reset Everything to None with 12-Character Alphanumeric Challenge */}
        <div className="kp-card rounded-2xl border border-rose-500/30 bg-[#130f18] p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/15 text-rose-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Reset Workspace & Start Fresh</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Permanently wipe all habits, streaks, tasks, goals, schedules, notes, journals, and local PDF attachments to start from zero.
                </p>
              </div>
            </div>

            {!resetPanelOpen && (
              <button
                type="button"
                onClick={() => {
                  setResetChallengeCode(generateResetChallengeCode(12));
                  setResetTypedCode('');
                  setResetPanelOpen(true);
                }}
                className="kp-btn rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/25 hover:text-white"
              >
                Reset Everything...
              </button>
            )}
          </div>

          {resetPanelOpen && (
            <div className="kp-subview-transition space-y-3.5 rounded-xl border border-rose-500/25 bg-[#0d0a12] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-rose-200">
                  Safety Verification: Type the exact 12-character alphanumeric code below to confirm
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setResetChallengeCode(generateResetChallengeCode(12));
                    setResetTypedCode('');
                  }}
                  className="kp-btn inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white"
                >
                  <RefreshCw className="h-3 w-3" /> New Code
                </button>
              </div>

              {/* 12-Character Visual Code Breakdown */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-[#141824] p-3 select-none">
                {resetChallengeCode.split('').map((ch, idx) => {
                  const typedCh = resetTypedCode[idx];
                  const isCorrect = typedCh === ch;
                  const isWrong = typedCh !== undefined && typedCh !== ch;
                  return (
                    <span
                      key={idx}
                      className={`flex h-8 w-7 items-center justify-center rounded-lg border font-mono text-sm font-extrabold transition-all ${
                        isCorrect
                          ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300 scale-105'
                          : isWrong
                          ? 'border-rose-500/60 bg-rose-500/20 text-rose-300'
                          : 'border-white/10 bg-[#0b0e16] text-slate-200'
                      }`}
                    >
                      {ch}
                    </span>
                  );
                })}
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-400">
                    Enter all 12 mixed letters & numbers (case-sensitive):
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      isCodeMatched ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {
                      resetChallengeCode
                        .split('')
                        .filter((ch, i) => resetTypedCode[i] === ch).length
                    }{' '}
                    / 12 matched
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={12}
                  value={resetTypedCode}
                  onChange={(e) => setResetTypedCode(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  placeholder={`Type ${resetChallengeCode} to unlock reset...`}
                  className="w-full rounded-xl border border-white/15 bg-[#151926] px-3.5 py-2.5 font-mono text-sm text-white placeholder-slate-600 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setResetPanelOpen(false);
                    setResetTypedCode('');
                  }}
                  className="kp-btn rounded-xl border border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!isCodeMatched}
                  onClick={handleCompleteWorkspaceReset}
                  className={`kp-btn inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${
                    isCodeMatched
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 cursor-pointer'
                      : 'border border-white/10 bg-white/5 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Confirm Wipe & Start Fresh</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBackup = () => {
    const exportJSON = () => {
      const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kinetic_protocol_backup_${todayISO}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported complete JSON backup.', 'success');
    };

    const handleImportJSON = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(String(ev.target?.result || ''));
          if (!parsed || !Array.isArray(parsed.habits)) {
            showToast('Invalid Kinetic backup JSON schema.', 'error');
            return;
          }
          setStore(parsed);
          showToast('Backup imported and restored successfully!', 'success');
        } catch {
          showToast('Failed to parse JSON file.', 'error');
        }
      };
      reader.readAsText(file);
    };

    return (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-white">Backup & Data Management</h1>
        <div className="rounded-2xl border border-white/[0.07] bg-[#10131c] p-5 space-y-4">
          <p className="text-xs text-slate-400">
            Schema Version: <strong>v{store.version || 2}</strong> (`{STORAGE_KEY_V2}`)
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportJSON}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
            >
              <Download className="h-4 w-4" /> Export Full JSON Backup
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10">
              <Upload className="h-4 w-4" /> Import JSON Backup
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!activeModal) return null;

    const backdropMotionClass = effectiveReducedMotion
      ? ''
      : isModalClosing
      ? 'kp-backdrop-exit'
      : 'kp-backdrop-enter';
    const dialogMotionClass = effectiveReducedMotion
      ? ''
      : isModalClosing
      ? 'kp-modal-exit'
      : 'kp-modal-enter';

    if (activeModal === 'pdfPreview' && pdfPreviewState) {
      const previewAtt = pdfPreviewState.attachment || {
        storageKey: pdfPreviewState.storageKey,
        name: pdfPreviewState.name,
        size: pdfPreviewState.size,
        type: pdfPreviewState.type || 'application/pdf'
      };
      const isDownloadingPreview = Boolean(
        previewAtt.storageKey && downloadingKeys[previewAtt.storageKey]
      );

      return (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-sm ${backdropMotionClass}`}
          role="dialog"
          aria-modal="true"
          aria-label={`PDF Preview: ${pdfPreviewState.name}`}
        >
          <div
            className={`flex h-[86dvh] w-full max-w-4xl flex-col rounded-2xl border border-white/10 bg-[#10131c] p-4 shadow-2xl ${dialogMotionClass}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10 shrink-0">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-indigo-400" />
                <span className="truncate text-sm font-bold text-white" title={pdfPreviewState.name}>
                  {pdfPreviewState.name}
                </span>
                <span className="shrink-0 rounded bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] text-slate-400">
                  {formatFileSize(pdfPreviewState.size)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {previewAtt.storageKey && (
                  <button
                    type="button"
                    disabled={isDownloadingPreview}
                    onClick={() => downloadPdfAttachment(previewAtt)}
                    className="kp-btn inline-flex items-center gap-1.5 rounded-lg border border-indigo-400/35 bg-indigo-500/15 px-3 py-1.5 text-xs font-bold text-indigo-200 hover:bg-indigo-500/25 hover:text-white disabled:opacity-60"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{isDownloadingPreview ? 'Downloading...' : 'Download PDF'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close PDF preview"
                  className="kp-btn rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <iframe
              src={pdfPreviewState.url}
              title="PDF Preview"
              className="mt-3 flex-1 min-h-0 w-full rounded-xl bg-white"
            />
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm ${backdropMotionClass}`}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`w-full max-w-md rounded-2xl border border-white/10 bg-[#10131c] p-5 shadow-2xl ${dialogMotionClass}`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-base font-bold text-white capitalize">
              {editingRecord ? `Edit ${activeModal}` : `Create ${activeModal}`}
            </h3>
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close modal"
              className="kp-btn rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const title = String(fd.get('title') || '').trim();
              const category = String(fd.get('category') || 'Code');
              if (!title) return;

              if (activeModal === 'task') {
                const newTask = {
                  id: editingRecord?.id || `task-${Date.now()}`,
                  title,
                  description: String(fd.get('description') || ''),
                  dueDate: String(fd.get('dueDate') || selectedDateISO),
                  startTime: String(fd.get('startTime') || ''),
                  endTime: String(fd.get('endTime') || ''),
                  priority: String(fd.get('priority') || 'medium'),
                  status: editingRecord?.status || 'todo',
                  category,
                  createdAt: new Date().toISOString()
                };
                setStore((prev) => ({
                  ...prev,
                  isStarterWorkspace: false,
                  tasks: editingRecord
                    ? prev.tasks.map((t) => (t.id === editingRecord.id ? newTask : t))
                    : [newTask, ...(prev.tasks || [])]
                }));
              } else if (activeModal === 'schedule') {
                const startTime = String(fd.get('startTime') || '09:00');
                const endTime = String(fd.get('endTime') || '10:30');
                const plannedMinutes = Math.max(15, parseMinutes(endTime) - parseMinutes(startTime));
                const newBlock = {
                  id: editingRecord?.id || `sch-${Date.now()}`,
                  title,
                  date: selectedDateISO,
                  startTime,
                  endTime,
                  plannedMinutes,
                  actualMinutes: 0,
                  category,
                  recurrence: String(fd.get('recurrence') || 'none'),
                  completed: false,
                  notes: String(fd.get('description') || '')
                };
                setStore((prev) => ({
                  ...prev,
                  isStarterWorkspace: false,
                  schedules: [newBlock, ...(prev.schedules || [])]
                }));
              } else if (activeModal === 'habit') {
                const trackingType = String(fd.get('trackingType') || editingRecord?.trackingType || 'binary');
                const targetValue =
                  trackingType === 'binary'
                    ? 1
                    : Math.max(1, Number(fd.get('targetValue') || editingRecord?.targetValue || 30));
                const newHabit = {
                  id: editingRecord?.id || `hab-${Date.now()}`,
                  title,
                  description: String(fd.get('description') || ''),
                  category,
                  trackingType,
                  targetValue,
                  minViableValue:
                    trackingType === 'binary' ? 1 : Math.max(1, Math.round(targetValue / 2)),
                  unit: String(
                    fd.get('unit') ||
                      editingRecord?.unit ||
                      (trackingType === 'duration' ? 'min' : 'session')
                  ),
                  schedule: editingRecord?.schedule || {
                    type: 'daily',
                    weekdays: [0, 1, 2, 3, 4, 5, 6],
                    weeklyTarget: 7
                  },
                  startDate: editingRecord?.startDate || addDaysISO(todayISO, -14),
                  archivedAt: null
                };
                setStore((prev) => ({
                  ...prev,
                  isStarterWorkspace: false,
                  habits: editingRecord
                    ? (prev.habits || []).map((h) => (h.id === editingRecord.id ? newHabit : h))
                    : [...(prev.habits || []), newHabit]
                }));
              } else if (activeModal === 'goal') {
                const newGoal = {
                  id: editingRecord?.id || `goal-${Date.now()}`,
                  title,
                  description: String(fd.get('description') || ''),
                  topic: category,
                  category,
                  startDate: todayISO,
                  targetDate: String(fd.get('dueDate') || addDaysISO(todayISO, 60)),
                  status: 'In progress',
                  pinned: true,
                  metricType: 'numeric',
                  currentValue: editingRecord?.currentValue || 0,
                  targetValue: Math.max(1, Number(fd.get('targetValue') || 100)),
                  unit: 'units',
                  milestones: editingRecord?.milestones || []
                };
                setStore((prev) => ({
                  ...prev,
                  isStarterWorkspace: false,
                  goals: editingRecord
                    ? prev.goals.map((g) => (g.id === editingRecord.id ? newGoal : g))
                    : [...(prev.goals || []), newGoal]
                }));
              } else if (activeModal === 'note') {
                let attachment = null;
                const pdfFile = fd.get('pdfFile');
                if (pdfFile && pdfFile instanceof File && pdfFile.size > 0) {
                  const storageKey = `pdf_${Date.now()}`;
                  await idbSavePdfBlob(storageKey, pdfFile, 'application/pdf');
                  attachment = {
                    storageKey,
                    name: pdfFile.name,
                    size: pdfFile.size,
                    type: 'application/pdf'
                  };
                }
                const newNote = {
                  id: `note-${Date.now()}`,
                  title,
                  content: String(fd.get('description') || ''),
                  category,
                  tags: [],
                  attachment,
                  updatedAt: new Date().toISOString()
                };
                setStore((prev) => ({
                  ...prev,
                  isStarterWorkspace: false,
                  notes: [newNote, ...(prev.notes || [])]
                }));
              }

              showToast('Saved to Kinetic Protocol store.', 'success');
              closeModal();
            }}
            className="mt-4 space-y-3 text-xs"
          >
            <div>
              <label className="block font-bold text-slate-300 mb-1">Title</label>
              <input
                name="title"
                required
                defaultValue={editingRecord?.title || ''}
                placeholder="Enter title..."
                className="w-full rounded-xl border border-white/10 bg-[#151926] px-3 py-2 text-white transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Category</label>
              <select
                name="category"
                defaultValue={editingRecord?.category || 'Code'}
                className="w-full rounded-xl border border-white/10 bg-[#151926] px-3 py-2 text-white transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {Object.keys(CATEGORIES).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {(activeModal === 'task' || activeModal === 'schedule') && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    defaultValue={editingRecord?.startTime || '09:00'}
                    className="w-full rounded-xl border border-white/10 bg-[#151926] px-3 py-2 text-white transition focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    defaultValue={editingRecord?.endTime || '10:30'}
                    className="w-full rounded-xl border border-white/10 bg-[#151926] px-3 py-2 text-white transition focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {activeModal === 'habit' && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Tracking Type</label>
                  <select
                    name="trackingType"
                    defaultValue={editingRecord?.trackingType || 'duration'}
                    className="w-full rounded-xl border border-white/10 bg-[#151926] px-2.5 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="binary">Binary (Check)</option>
                    <option value="duration">Duration (min)</option>
                    <option value="count">Count</option>
                    <option value="numeric">Numeric</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Daily Target</label>
                  <input
                    type="number"
                    name="targetValue"
                    min="1"
                    defaultValue={editingRecord?.targetValue || 60}
                    className="w-full rounded-xl border border-white/10 bg-[#151926] px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Unit</label>
                  <input
                    type="text"
                    name="unit"
                    defaultValue={editingRecord?.unit || 'min'}
                    placeholder="min / pages"
                    className="w-full rounded-xl border border-white/10 bg-[#151926] px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {activeModal === 'note' && (
              <div>
                <label className="block font-bold text-slate-300 mb-1">Optional PDF Attachment (IndexedDB)</label>
                <input
                  type="file"
                  name="pdfFile"
                  accept="application/pdf"
                  className="w-full text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500/20 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-indigo-300 hover:file:bg-indigo-500/30"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-300 mb-1">Notes / Description</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={editingRecord?.description || editingRecord?.content || ''}
                className="w-full rounded-xl border border-white/10 bg-[#151926] p-3 text-white transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="kp-btn rounded-xl border border-white/10 px-4 py-2 font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="kp-btn rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500"
              >
                Save Record
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`kp-app-shell flex h-screen h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#07090e] text-slate-100 selection:bg-indigo-500 selection:text-white ${
        effectiveReducedMotion ? 'kp-reduced-motion' : ''
      }`}
    >
      <style>{KINETIC_MOTION_STYLES}</style>

      {/* Desktop Sidebar (Full viewport height, independent scrolling nav, anchored status footer) */}
      <aside
        className={`hidden md:flex flex-col h-full max-h-full overflow-hidden border-r border-white/[0.06] bg-[#0b0e16] transition-[width,padding] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          sidebarCollapsed ? 'w-20 px-3 py-4' : 'w-64 p-4'
        } shrink-0`}
      >
        {/* Top Branding & Collapse Control (shrink-0) */}
        <div className="flex items-center justify-between px-1.5 pb-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div
              className={`overflow-hidden whitespace-nowrap transition-[opacity,transform,max-width] duration-200 ease-out ${
                sidebarCollapsed
                  ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none'
                  : 'max-w-[140px] opacity-100 translate-x-0'
              }`}
            >
              <span className="text-base font-extrabold tracking-tight text-white">Kinetic</span>
              <span className="text-base font-extrabold text-indigo-400">.OS</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="kp-btn shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Independently Scrollable Navigation Groups (min-h-0 flex-1 overflow-y-auto) */}
        <nav
          aria-label="Sidebar Navigation"
          className="kinetic-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 -mr-1 space-y-5"
        >
          {navSections.map((group) => (
            <div key={group.heading}>
              <div
                className={`px-3 overflow-hidden whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-slate-500 transition-[opacity,max-height,margin] duration-200 ${
                  sidebarCollapsed ? 'max-h-0 mb-0 opacity-0' : 'max-h-6 mb-2 opacity-100'
                }`}
              >
                {group.heading}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const IconComp = item.icon;
                  const active = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveNav(item.id)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`kp-btn group relative flex w-full items-center ${
                        sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                      } rounded-xl py-2.5 text-xs font-semibold ${
                        active
                          ? 'bg-[#1a1f30] text-white shadow-sm border border-indigo-500/30'
                          : 'border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                      }`}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full bg-indigo-400 transition-all duration-200"
                        />
                      )}
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
                            active
                              ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                              : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        >
                          <IconComp className="h-3.5 w-3.5" />
                        </span>
                        <span
                          className={`truncate whitespace-nowrap transition-[opacity,transform,max-width] duration-200 ease-out ${
                            sidebarCollapsed
                              ? 'max-w-0 opacity-0 -translate-x-1.5 pointer-events-none hidden'
                              : 'max-w-[130px] opacity-100 translate-x-0'
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                      {!sidebarCollapsed && item.badge > 0 && (
                        <span
                          className={`rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 ${
                            badgePulse ? 'kp-badge-bump' : ''
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {sidebarCollapsed && item.badge > 0 && (
                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Anchored Footer Status Panel (shrink-0) */}
        <div className="pt-3 mt-2 border-t border-white/[0.05] shrink-0">
          {sidebarCollapsed ? (
            <div
              title={`Local Storage v2 · Date: ${selectedDateISO}`}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/[0.06] bg-[#10131c] py-2.5 text-[10px] text-slate-400"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <HardDrive className="h-3.5 w-3.5 text-slate-400" />
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-[#10131c] p-3 text-[11px] text-slate-400">
              <div className="flex items-center justify-between font-semibold text-slate-200">
                <span>Local Storage v2</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <div className="mt-1 truncate">Date: {selectedDateISO}</div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Application Column (flex-1 min-w-0 min-h-0 overflow-hidden) */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0 h-full overflow-hidden">
        {/* Stationary Top Header (shrink-0) */}
        <header className="shrink-0 z-30 flex items-center justify-between gap-4 border-b border-white/[0.06] bg-[#07090e]/95 px-4 py-3.5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3 flex-1 max-w-md min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
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
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search tasks, habits, or notes..."
                className="w-full rounded-xl border border-white/[0.07] bg-[#111520] pl-10 pr-8 py-2 text-xs text-white placeholder-slate-500 transition-all duration-150 hover:border-white/15 focus:border-indigo-500 focus:bg-[#141926] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Notification Center Button + Dropdown (Overdue, Upcoming Tasks/Schedules, Habit/Goal Reminders) */}
            {(() => {
              const allTasks = store.tasks || [];
              const overdueItems = allTasks
                .filter((t) => t.status !== 'completed' && t.dueDate < todayISO)
                .map((t) => ({
                  id: `ov-${t.id}`,
                  taskId: t.id,
                  group: 'overdue',
                  title: t.title,
                  meta: `Overdue · Due ${t.dueDate}`,
                  category: t.category,
                  navTarget: 'tasks'
                }));

              const upcomingTaskItems = allTasks
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
                  navTarget: 'tasks'
                }));

              const upcomingScheduleItems = todaySchedules
                .filter((s) => !s.completed)
                .slice(0, 3)
                .map((s) => ({
                  id: `up-sch-${s.id}`,
                  scheduleId: s.id,
                  group: 'upcoming',
                  title: s.title,
                  meta: `Today's Block · ${s.startTime} – ${s.endTime}`,
                  category: s.category,
                  navTarget: 'schedules'
                }));

              const unloggedHabits = todayScheduledHabits
                .filter((h) => !isEntrySatisfied(h, store.habitEntries?.[h.id]?.[todayISO]))
                .map((h) => ({
                  id: `rem-hab-${h.id}`,
                  habit: h,
                  group: 'reminders',
                  title: h.title,
                  meta: `Habit Reminder · Target: ${h.targetValue} ${h.unit}`,
                  category: h.category,
                  navTarget: 'habits'
                }));

              const goalReminders = (store.goals || [])
                .filter((g) => g.pinned)
                .slice(0, 2)
                .map((g) => ({
                  id: `rem-goal-${g.id}`,
                  group: 'reminders',
                  title: g.title,
                  meta: `Goal Target · ${g.targetDate}`,
                  category: g.category,
                  navTarget: 'goals'
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
                <div ref={notifDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setNotifOpen((o) => !o)}
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
                          onClick={() => setNotifOpen(false)}
                          aria-label="Close notifications"
                          className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Filter Tabs */}
                      <div className="mt-2.5 grid grid-cols-4 gap-1 rounded-xl bg-[#151a28] p-1">
                        {[
                          { id: 'all', label: `All (${allNotifs.length})` },
                          { id: 'overdue', label: `Late (${overdueItems.length})` },
                          { id: 'upcoming', label: `Next (${upcomingTaskItems.length + upcomingScheduleItems.length})` },
                          { id: 'reminders', label: `Habits (${unloggedHabits.length + goalReminders.length})` }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setNotifFilter(tab.id)}
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
                                  setActiveNav(item.navTarget);
                                  setNotifOpen(false);
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
                                  onClick={() => toggleTaskStatus(item.taskId)}
                                  className="kp-btn shrink-0 rounded-lg bg-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950"
                                >
                                  Done
                                </button>
                              )}
                              {item.scheduleId && (
                                <button
                                  type="button"
                                  onClick={() => toggleScheduleCompletion(item.scheduleId)}
                                  className="kp-btn shrink-0 rounded-lg bg-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950"
                                >
                                  Done
                                </button>
                              )}
                              {item.habit && (
                                <button
                                  type="button"
                                  onClick={() => toggleHabitOnDate(item.habit, todayISO, 'toggle')}
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
              );
            })()}

            {/* Theme Toggle Button with Hover Bubble ("Under construction — coming soon!") */}
            <div
              className="group relative"
              onMouseEnter={() => setThemeTooltipOpen(true)}
              onMouseLeave={() => setThemeTooltipOpen(false)}
            >
              <button
                type="button"
                onClick={() => setThemeTooltipOpen((v) => !v)}
                onFocus={() => setThemeTooltipOpen(true)}
                onBlur={() => setThemeTooltipOpen(false)}
                aria-label="Theme toggle (under construction, coming soon)"
                className="kp-btn flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#111520] text-amber-300 hover:border-amber-400/40 hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <Sun className="h-4 w-4 transition-transform duration-200 group-hover:rotate-45" />
              </button>

              <div
                role="tooltip"
                className={`pointer-events-none absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-2.5 w-52 rounded-xl border border-amber-400/30 bg-[#121726]/95 px-3 py-2 text-[11px] font-semibold text-amber-100 shadow-2xl backdrop-blur-md transition-all duration-150 z-50 ${
                  themeTooltipOpen
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 -translate-y-1'
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
              onClick={() => openModal('schedule', null)}
              className="kp-btn hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 hover:shadow-indigo-500/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <Plus className="h-3.5 w-3.5" /> Add Plan
            </button>
            <button
              type="button"
              onClick={() => setActiveNav('settings')}
              title={`Operator Settings (${store.settings?.userName || 'Operator'})`}
              aria-label="Open Operator Settings"
              className="kp-btn flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 text-xs font-bold text-slate-950 ring-2 ring-transparent hover:ring-indigo-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              {(store.settings?.userName || 'A').slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>

        {/* Mobile Drawer Navigation with smooth height/opacity transition */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out md:hidden shrink-0 ${
            mobileMenuOpen
              ? 'grid-rows-[1fr] opacity-100 border-b border-white/10 bg-[#0b0e16]'
              : 'grid-rows-[0fr] opacity-0 pointer-events-none'
          }`}
        >
          <div className="overflow-hidden">
            <div className="kinetic-scroll max-h-[60dvh] overflow-y-auto p-3 space-y-1.5">
              {navSections.flatMap((g) => g.items).map((item) => {
                const IconComp = item.icon;
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveNav(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`kp-btn flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <IconComp className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </span>
                    {item.badge > 0 && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          active ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Undo Banner Notification (shrink-0) */}
        {undoBanner && (
          <div
            className={`mx-4 mt-3 shrink-0 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200 sm:mx-8 ${
              effectiveReducedMotion ? '' : isUndoClosing ? 'kp-banner-exit' : 'kp-banner-enter'
            }`}
          >
            <span className="flex items-center gap-2">
              <RotateCcw className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>{undoBanner.label} deleted.</span>
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRestoreUndo}
                className="kp-btn rounded-lg bg-amber-500/20 px-2.5 py-1 font-bold text-amber-100 hover:bg-amber-500/30 hover:text-white"
              >
                Undo Delete
              </button>
              <button
                type="button"
                onClick={dismissUndoBanner}
                aria-label="Dismiss undo notice"
                className="text-amber-300/70 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold text-white shadow-2xl ${
              toast.type === 'error'
                ? 'border-rose-500/40 bg-[#1a1118]'
                : toast.type === 'success'
                ? 'border-emerald-500/40 bg-[#101c18]'
                : 'border-indigo-500/40 bg-[#141824]'
            } ${effectiveReducedMotion ? '' : isToastClosing ? 'kp-toast-exit' : 'kp-toast-enter'}`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Active Module Scrollable Viewport (min-h-0 flex-1 overflow-y-auto) */}
        <main
          ref={mainScrollRef}
          className="kinetic-scroll flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden overscroll-y-contain p-4 sm:p-8"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div key={activeNav} className={effectiveReducedMotion ? '' : 'kp-page-transition'}>
              {activeNav === 'overview' && renderOverview()}
              {activeNav === 'calendar' && renderCalendar()}
              {activeNav === 'tasks' && renderTasks()}
              {activeNav === 'goals' && renderGoals()}
              {activeNav === 'schedules' && renderSchedules()}
              {activeNav === 'habits' && renderHabits()}
              {activeNav === 'statistics' && renderStatistics()}
              {activeNav === 'notes' && renderNotes()}
              {activeNav === 'journal' && renderJournal()}
              {activeNav === 'settings' && renderSettings()}
              {activeNav === 'backup' && renderBackup()}
            </div>
          </div>
        </main>
      </div>

      {renderModal()}
    </div>
  );
}