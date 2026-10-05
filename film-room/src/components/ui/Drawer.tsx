"use client";

/**
 * A focused panel: slides in from the right on desktop, rises as a sheet on mobile.
 * Escape and the backdrop close it; focus moves inside on open and returns on close.
 */
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function Drawer({ open, onClose, title, eyebrow, children, footer, wide }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => {
      const first = panel.current?.querySelector<HTMLElement>("[data-autofocus]");
      (first ?? panel.current)?.focus();
    }, 30);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
      document.body.style.overflow = overflow;
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="fade-in absolute inset-0 bg-ink/20 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cx(
          "rise-in absolute flex flex-col bg-canvas shadow-[var(--shadow-pop)] outline-none",
          "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl",
          "md:inset-y-3 md:right-3 md:left-auto md:max-h-none md:rounded-3xl",
          wide ? "md:w-[min(680px,92vw)]" : "md:w-[min(460px,92vw)]",
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line-strong md:hidden" aria-hidden />
        <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
          <div className="min-w-0">
            {eyebrow && <p className="label">{eyebrow}</p>}
            <h2 className="mt-0.5 truncate text-xl font-semibold tracking-tight">{title}</h2>
          </div>
          <button data-close onClick={onClose} className="rounded-full p-2 text-mute hover:bg-hover hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6">{children}</div>
        {footer && <footer className="flex items-center justify-between border-t border-line px-6 py-3">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
