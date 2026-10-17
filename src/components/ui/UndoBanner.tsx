import React from 'react';
import { RotateCcw, X } from 'lucide-react';
import type { UndoBannerState } from '../../store/types';

interface UndoBannerProps {
  undoBanner: UndoBannerState | null;
  isClosing: boolean;
  reducedMotion: boolean;
  onRestore: () => void;
  onDismiss: () => void;
}

export function UndoBanner({
  undoBanner,
  isClosing,
  reducedMotion,
  onRestore,
  onDismiss
}: UndoBannerProps) {
  if (!undoBanner) return null;

  return (
    <div
      className={`mx-4 mt-3 shrink-0 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200 sm:mx-8 ${
        reducedMotion ? '' : isClosing ? 'kp-banner-exit' : 'kp-banner-enter'
      }`}
    >
      <span className="flex items-center gap-2">
        <RotateCcw className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <span>{undoBanner.label} deleted.</span>
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRestore}
          className="kp-btn rounded-lg bg-amber-500/20 px-2.5 py-1 font-bold text-amber-100 hover:bg-amber-500/30 hover:text-white"
        >
          Undo Delete
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss undo notice"
          className="text-amber-300/70 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
