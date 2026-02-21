import React from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClassName?: string;
  closeOnBackdrop?: boolean;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  widthClassName = "max-w-md",
  closeOnBackdrop = true,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(open);

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMounted(false);
    }, 200);
    return () => window.clearTimeout(timeoutId);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 ease-in-out ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <button
        type="button"
        aria-label="Close modal"
        onClick={() => {
          if (closeOnBackdrop) onClose();
        }}
        className={`absolute inset-0 bg-black/35 backdrop-blur-sm transition-opacity duration-200 ease-in-out ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${widthClassName} overflow-hidden rounded-2xl border border-white/40 bg-white/22 p-6 shadow-2xl shadow-slate-900/20 backdrop-blur-3xl transition-all duration-200 ease-in-out dark:border-slate-500/40 dark:bg-slate-900/28 ${
          open ? "translate-y-0 scale-100 opacity-100" : "translate-y-1 scale-95 opacity-0"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-white/10 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors duration-200 ease-in-out hover:bg-white/40 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-white/15 dark:hover:text-white"
        >
          <FaTimes size={11} className="pointer-events-none" />
        </button>

        {title && (
          <h2 className="relative text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
        )}

        <div className={`relative ${title ? "mt-2" : ""}`}>{children}</div>

        {footer && <div className="relative mt-6 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
