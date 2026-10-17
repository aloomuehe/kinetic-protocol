import type {
  Habit,
  HabitEntry,
  Goal,
  Task,
  ScheduleBlock,
  Note,
  JournalEntry,
  KineticStore
} from './types';
import { DEFAULT_MAX_PDF_MB } from './constants';
import { getWeekDatesISO, addDaysISO } from '../utils/dates';

export function createStarterWorkspace(todayISO: string): KineticStore {
  const weekDates = getWeekDatesISO(todayISO, true);
  const startOfMonth = `${todayISO.slice(0, 8)}01`;
  const twoWeeksAgo = addDaysISO(todayISO, -14);

  const habits: Habit[] = [
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
  const habitEntries: Record<string, Record<string, HabitEntry>> = {};
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

  const goals: Goal[] = [
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

  const tasks: Task[] = [
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
  const schedules: ScheduleBlock[] = [
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
        category:
          idx === 0
            ? 'Deep Work'
            : idx === 1
            ? 'Quant'
            : idx === 2
            ? 'Code'
            : idx === 3
            ? 'Math'
            : 'Fitness',
        linkedGoalId: idx % 2 === 0 ? 'goal-1' : 'goal-2',
        linkedTaskId: null,
        recurrence: 'none',
        completed: dISO < todayISO,
        notes: 'Scheduled weekly execution block'
      });
    }
  });

  const notes: Note[] = [
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

  const journals: Record<string, JournalEntry> = {
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
