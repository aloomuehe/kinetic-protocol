import {
  BookOpen,
  Code2,
  Dumbbell,
  LineChart,
  Zap,
  Layers
} from 'lucide-react';
import type { CategoryConfig } from './types';

export const IDB_DB_NAME = 'kinetic_protocol_attachments_db';
export const IDB_STORE_NAME = 'pdf_binaries';
export const DEFAULT_MAX_PDF_MB = 20;

export const STORAGE_KEY_V2 = 'kinetic_protocol_os_v2';
export const LEGACY_STORAGE_KEY_V1 = 'kinetic_habits_v1';

export const CATEGORIES: Record<string, CategoryConfig> = {
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
