import React from 'react';
import { ShieldAlert, RefreshCw, Trash2 } from 'lucide-react';
import type { KineticStore } from '../../store/types';
import { generateResetChallengeCode } from '../../utils/security';
import { idbListAllKeys, idbDeletePdfBlob } from '../../services/indexedDB';
import { DEFAULT_MAX_PDF_MB, LEGACY_STORAGE_KEY_V1, STORAGE_KEY_V2 } from '../../store/constants';

interface SettingsViewProps {
  store: KineticStore;
  resetPanelOpen: boolean;
  resetChallengeCode: string;
  resetTypedCode: string;
  prefersReducedMotion: boolean;
  onUpdateSettings: (updater: (prev: KineticStore) => KineticStore) => void;
  onSetResetPanelOpen: (open: boolean) => void;
  onSetResetChallengeCode: (code: string) => void;
  onSetResetTypedCode: (code: string) => void;
  onResetComplete: (freshStore: KineticStore) => void;
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export function SettingsView({
  store,
  resetPanelOpen,
  resetChallengeCode,
  resetTypedCode,
  prefersReducedMotion,
  onUpdateSettings,
  onSetResetPanelOpen,
  onSetResetChallengeCode,
  onSetResetTypedCode,
  onResetComplete,
  showToast
}: SettingsViewProps) {
  const isCodeMatched = resetTypedCode === resetChallengeCode;

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

    const freshStore: KineticStore = {
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

    onResetComplete(freshStore);
    onSetResetChallengeCode(generateResetChallengeCode(12));
    showToast('Workspace wiped clean. You are now starting completely fresh!', 'success');
  };

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
              onUpdateSettings((prev) => ({
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
              onUpdateSettings((prev) => ({
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
              onUpdateSettings((prev) => ({
                ...prev,
                settings: { ...prev.settings, reducedMotion: e.target.checked }
              }))
            }
            className="h-4 w-4 accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Danger Zone */}
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
                onSetResetChallengeCode(generateResetChallengeCode(12));
                onSetResetTypedCode('');
                onSetResetPanelOpen(true);
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
                  onSetResetChallengeCode(generateResetChallengeCode(12));
                  onSetResetTypedCode('');
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
                onChange={(e) => onSetResetTypedCode(e.target.value)}
                onPaste={(e) => e.preventDefault()}
                placeholder={`Type ${resetChallengeCode} to unlock reset...`}
                className="w-full rounded-xl border border-white/15 bg-[#151926] px-3.5 py-2.5 font-mono text-sm text-white placeholder-slate-600 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onSetResetPanelOpen(false);
                  onSetResetTypedCode('');
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
}
