import React from 'react';
import { Plus, Trash2, Paperclip, Eye, RefreshCw, Check, Download } from 'lucide-react';
import type { KineticStore, NoteAttachment } from '../../store/types';
import { formatFileSize } from '../../utils/formatting';

interface NotesViewProps {
  store: KineticStore;
  downloadingKeys: Record<string, boolean>;
  downloadedKeys: Record<string, boolean>;
  onOpenModal: (type: 'note', record: null) => void;
  onDeleteWithUndo: (collectionKey: 'notes', id: string, label: string) => void;
  onOpenPdfPreview: (attachment: NoteAttachment) => void;
  onDownloadPdf: (attachment: NoteAttachment) => void;
}

export function NotesView({
  store,
  downloadingKeys,
  downloadedKeys,
  onOpenModal,
  onDeleteWithUndo,
  onOpenPdfPreview,
  onDownloadPdf
}: NotesViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Files & Study Notes</h1>
          <p className="text-xs text-slate-400">Research notes with local IndexedDB PDF binary attachments</p>
        </div>
        <button
          type="button"
          onClick={() => onOpenModal('note', null)}
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
                    onClick={() => onDeleteWithUndo('notes', n.id, 'Note')}
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
                      onClick={() => onOpenPdfPreview(att)}
                      className="kp-btn inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg bg-indigo-500 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    >
                      <Eye className="h-3.5 w-3.5 shrink-0" />
                      <span>Preview PDF</span>
                    </button>
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => onDownloadPdf(att)}
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
}
