import React from 'react';
import { AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import type { ToastState } from '../../store/types';

interface ToastProps {
  toast: ToastState | null;
  isClosing: boolean;
  reducedMotion: boolean;
}

export function Toast({ toast, isClosing, reducedMotion }: ToastProps) {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold text-white shadow-2xl ${
        toast.type === 'error'
          ? 'border-rose-500/40 bg-[#1a1118]'
          : toast.type === 'success'
          ? 'border-emerald-500/40 bg-[#101c18]'
          : 'border-indigo-500/40 bg-[#141824]'
      } ${reducedMotion ? '' : isClosing ? 'kp-toast-exit' : 'kp-toast-enter'}`}
    >
      {toast.type === 'error' ? (
        <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
      ) : toast.type === 'success' ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
      ) : (
        <Zap className="h-4 w-4 shrink-0 text-indigo-400" />
      )}
      <span>{toast.message}</span>
    </div>
  );
}
