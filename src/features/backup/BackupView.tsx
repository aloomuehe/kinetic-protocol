import React from 'react';
import { Download, Upload } from 'lucide-react';
import type { KineticStore } from '../../store/types';
import { STORAGE_KEY_V2 } from '../../store/constants';
import { serializeBackup, parseAndValidateBackup } from '../../services/backup/backupService';

interface BackupViewProps {
  store: KineticStore;
  todayISO: string;
  onRestoreStore: (restored: KineticStore) => void;
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export function BackupView({
  store,
  todayISO,
  onRestoreStore,
  showToast
}: BackupViewProps) {
  const exportJSON = () => {
    const blob = new Blob([serializeBackup(store)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kinetic_protocol_backup_${todayISO}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported complete JSON backup.', 'success');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawText = String(ev.target?.result || '');
      const res = parseAndValidateBackup(rawText);
      if (!res.success || !res.data) {
        showToast(res.error || 'Invalid Kinetic backup JSON schema.', 'error');
        return;
      }
      onRestoreStore(res.data);
      showToast('Backup imported and restored successfully!', 'success');
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
            type="button"
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
}
