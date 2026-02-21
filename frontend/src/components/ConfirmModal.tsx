import React from "react";
import Modal from "./Modal";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export default function ConfirmModal({
  open,
  title,
  description,
  onConfirm,
  onClose,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/45 bg-white/30 px-4 py-2 text-sm font-medium text-slate-700 transition duration-200 ease-in-out hover:bg-white/45 dark:border-slate-400/50 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition duration-200 ease-in-out ${
              danger
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-700 dark:text-slate-300">{description}</p>
    </Modal>
  );
}
