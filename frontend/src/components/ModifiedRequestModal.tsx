import React from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaveAndRun: () => void;
  onRunWithoutSaving: () => void;
};

export default function ModifiedRequestModal({
  open,
  onClose,
  onSaveAndRun,
  onRunWithoutSaving,
}: Props) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/25 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modified-request-title"
        aria-describedby="modified-request-description"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/40 bg-white/22 p-6 shadow-2xl shadow-slate-900/20 backdrop-blur-3xl dark:border-slate-500/40 dark:bg-slate-900/28"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-white/10 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white/40 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-white/15 dark:hover:text-white"
        >
          <FaTimes size={11} className="pointer-events-none" />
        </button>
        <h2
          id="modified-request-title"
          className="relative text-lg font-semibold text-slate-900 dark:text-slate-100"
        >
          You modified this request.
        </h2>
        <p
          id="modified-request-description"
          className="relative mt-2 text-sm text-slate-700 dark:text-slate-300"
        >
          Choose whether to save your changes before running this request.
        </p>
        <div className="relative mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onRunWithoutSaving}
            className="rounded-lg border border-white/45 bg-white/30 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white/45 dark:border-slate-400/50 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
          >
            Run Without Saving
          </button>
          <button
            type="button"
            onClick={onSaveAndRun}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Save &amp; Run
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
