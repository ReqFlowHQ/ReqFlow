import React from "react";
import { FaChevronDown } from "react-icons/fa";
import { createPortal } from "react-dom";

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface DropdownProps<T extends string = string> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (nextValue: T) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

interface MenuPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

const getNextEnabledIndex = <T extends string>(
  options: DropdownOption<T>[],
  startIndex: number,
  direction: 1 | -1
) => {
  if (options.length === 0) return -1;

  let cursor = startIndex;
  for (let step = 0; step < options.length; step += 1) {
    cursor = (cursor + direction + options.length) % options.length;
    if (!options[cursor].disabled) {
      return cursor;
    }
  }

  return -1;
};

export default function Dropdown<T extends string>({
  value,
  options,
  onChange,
  placeholder = "Select option",
  disabled = false,
  ariaLabel,
}: DropdownProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);
  const [menuPosition, setMenuPosition] = React.useState<MenuPosition>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 256,
  });

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const listboxId = React.useId();
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex].label : placeholder;

  const closeMenu = React.useCallback(() => {
    setOpen(false);
    setHighlightedIndex(-1);
  }, []);

  const updateMenuPosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gutter = 12;
    const gap = 8;
    const width = Math.min(rect.width, viewportWidth - gutter * 2);
    const left = Math.min(Math.max(rect.left, gutter), Math.max(gutter, viewportWidth - width - gutter));
    const top = rect.bottom + gap;
    const maxHeight = Math.max(120, Math.min(256, viewportHeight - top - gutter));

    setMenuPosition((current) => {
      if (
        current.top === top &&
        current.left === left &&
        current.width === width &&
        current.maxHeight === maxHeight
      ) {
        return current;
      }
      return { top, left, width, maxHeight };
    });
  }, []);

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      updateMenuPosition();
      const initialIndex =
        selectedIndex >= 0 && !options[selectedIndex]?.disabled
          ? selectedIndex
          : getNextEnabledIndex(options, -1, 1);
      setHighlightedIndex(initialIndex);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMounted(false);
    }, 200);
    return () => window.clearTimeout(timeoutId);
  }, [open, options, selectedIndex, updateMenuPosition]);

  React.useEffect(() => {
    if (!open) return;

    const onResize = () => {
      if (window.matchMedia("(max-width: 1023px)").matches) {
        closeMenu();
        return;
      }
      updateMenuPosition();
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [open, updateMenuPosition, closeMenu]);

  React.useEffect(() => {
    if (!open) return;
    if (!window.matchMedia("(max-width: 1023px)").matches) return;

    const onDocumentScroll = (event: Event) => {
      const target = event.target as Node | null;
      if (target && menuRef.current?.contains(target)) return;
      closeMenu();
    };

    document.addEventListener("scroll", onDocumentScroll, {
      capture: true,
      passive: true,
    });
    return () => {
      document.removeEventListener("scroll", onDocumentScroll, true);
    };
  }, [open, closeMenu]);

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      closeMenu();
    };

    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onWindowKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onWindowKeyDown);
    };
  }, [open, closeMenu]);

  const commitSelection = React.useCallback(
    (index: number) => {
      const option = options[index];
      if (!option || option.disabled) return;
      onChange(option.value);
      closeMenu();
      triggerRef.current?.focus();
    },
    [options, onChange, closeMenu]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlightedIndex((current) => getNextEnabledIndex(options, current, 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlightedIndex((current) => getNextEnabledIndex(options, current, -1));
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (highlightedIndex >= 0) {
        commitSelection(highlightedIndex);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      triggerRef.current?.focus();
      return;
    }

    if (event.key === "Tab") {
      closeMenu();
    }
  };

  const menu = mounted ? (
    <div
      ref={menuRef}
      id={listboxId}
      role="listbox"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      style={{
        position: "fixed",
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
        width: `${menuPosition.width}px`,
        maxHeight: `${menuPosition.maxHeight}px`,
      }}
      className={`z-50 overflow-auto rounded-2xl border border-slate-300 bg-white p-1 shadow-xl transition-all duration-200 ease-in-out dark:border-slate-700 dark:bg-slate-900 dark:shadow-xl ${
        open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
      }`}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const highlighted = index === highlightedIndex;

        return (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={selected}
            disabled={option.disabled}
            onMouseEnter={() => {
              if (!option.disabled) {
                setHighlightedIndex(index);
              }
            }}
            onClick={() => commitSelection(index)}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition duration-200 ease-in-out ${
              option.disabled
                ? "cursor-not-allowed text-slate-400 dark:text-slate-500"
                : selected
                  ? "bg-cyan-500/20 text-cyan-800 dark:bg-cyan-500/25 dark:text-cyan-200"
                  : highlighted
                    ? "bg-slate-200/80 text-slate-900 dark:bg-slate-700/80 dark:text-slate-100"
                    : "text-slate-700 hover:bg-slate-200/70 dark:text-slate-200 dark:hover:bg-slate-700/70"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onKeyDown={handleKeyDown}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        className={`inline-flex w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100`}
      >
        <span className="truncate">{selectedLabel}</span>
        <FaChevronDown
          size={11}
          className={`shrink-0 text-slate-500 transition-transform duration-200 ease-in-out dark:text-slate-300 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {menu && typeof document !== "undefined" ? createPortal(menu, document.body) : null}
    </div>
  );
}
