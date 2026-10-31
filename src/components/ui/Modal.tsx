import React from 'react';
import { X, FileText, Download, RefreshCw } from 'lucide-react';
import type {
  ActiveModalType,
  PdfPreviewState,
  KineticStore,
  Task,
  ScheduleBlock,
  Habit,
  Goal,
  Note
} from '../../store/types';
import { CATEGORIES } from '../../store/constants';
import { formatFileSize, parseMinutes } from '../../utils/formatting';
import { addDaysISO, toLocalISO } from '../../utils/dates';
import { idbSavePdfBlob } from '../../services/indexedDB';

interface ModalProps {
  activeModal: ActiveModalType;
  isModalClosing: boolean;
  reducedMotion: boolean;
  editingRecord: any;
  pdfPreviewState: PdfPreviewState | null;
  downloadingKeys: Record<string, boolean>;
  selectedDateISO: string;
  todayISO: string;
  onClose: () => void;
  onSaveStore: (updater: (prev: KineticStore) => KineticStore) => void;
  onDownloadPdf: (attachment: any) => void;
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export function Modal({
  activeModal,
  isModalClosing,
  reducedMotion,
  editingRecord,
  pdfPreviewState,
  downloadingKeys,
  selectedDateISO,
  todayISO,
  onClose,
  onSaveStore,
  onDownloadPdf,
  showToast
}: ModalProps) {
  if (!activeModal) return null;

  const backdropMotionClass = reducedMotion
    ? ''
    : isModalClosing
    ? 'kp-backdrop-exit'
    : 'kp-backdrop-enter';
  const dialogMotionClass = reducedMotion
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
          if (e.target === e.currentTarget) onClose();
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
                  onClick={() => onDownloadPdf(previewAtt)}
                  className="kp-btn inline-flex items-center gap-1.5 rounded-lg border border-indigo-400/35 bg-indigo-500/15 px-3 py-1.5 text-xs font-bold text-indigo-200 hover:bg-indigo-500/25 hover:text-white disabled:opacity-60"
                >
                  {isDownloadingPreview ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
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
        if (e.target === e.currentTarget) onClose();
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
            onClick={onClose}
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
              const newTask: Task = {
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
              onSaveStore((prev) => ({
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
              const submittedDate = String(fd.get('date') || '').trim();
              const blockDate = submittedDate ? toLocalISO(submittedDate) : (editingRecord?.date || selectedDateISO);
              const newBlock: ScheduleBlock = {
                id: editingRecord?.id || `sch-${Date.now()}`,
                title,
                date: blockDate,
                startTime,
                endTime,
                plannedMinutes,
                actualMinutes: editingRecord?.actualMinutes ?? 0,
                category,
                linkedGoalId: editingRecord?.linkedGoalId ?? null,
                linkedTaskId: editingRecord?.linkedTaskId ?? null,
                recurrence: String(fd.get('recurrence') || editingRecord?.recurrence || 'none'),
                completed: editingRecord?.completed ?? false,
                notes: String(fd.get('description') || editingRecord?.notes || '')
              };
              onSaveStore((prev) => ({
                ...prev,
                isStarterWorkspace: false,
                schedules: editingRecord
                  ? (prev.schedules || []).map((s) => (s.id === editingRecord.id ? newBlock : s))
                  : [newBlock, ...(prev.schedules || [])]
              }));
            } else if (activeModal === 'habit') {
              const trackingType = String(fd.get('trackingType') || editingRecord?.trackingType || 'binary');
              const targetValue =
                trackingType === 'binary'
                  ? 1
                  : Math.max(1, Number(fd.get('targetValue') || editingRecord?.targetValue || 30));
              const newHabit: Habit = {
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
                startDate: editingRecord?.startDate || todayISO,
                archivedAt: null
              };
              onSaveStore((prev) => ({
                ...prev,
                isStarterWorkspace: false,
                habits: editingRecord
                  ? (prev.habits || []).map((h) => (h.id === editingRecord.id ? newHabit : h))
                  : [...(prev.habits || []), newHabit]
              }));
            } else if (activeModal === 'goal') {
              const newGoal: Goal = {
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
              onSaveStore((prev) => ({
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
              const newNote: Note = {
                id: `note-${Date.now()}`,
                title,
                content: String(fd.get('description') || ''),
                category,
                tags: [],
                attachment,
                updatedAt: new Date().toISOString()
              };
              onSaveStore((prev) => ({
                ...prev,
                isStarterWorkspace: false,
                notes: [newNote, ...(prev.notes || [])]
              }));
            }

            showToast('Saved to Kinetic Protocol store.', 'success');
            onClose();
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

          {activeModal === 'schedule' && (
            <div>
              <label className="block font-bold text-slate-300 mb-1">Date</label>
              <input
                type="date"
                name="date"
                defaultValue={editingRecord?.date || selectedDateISO}
                className="w-full rounded-xl border border-white/10 bg-[#151926] px-3 py-2 text-white transition focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

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
              onClick={onClose}
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
}
