"use client";

/**
 * A focused panel: slides in from the right on desktop, rises as a sheet on mobile.
 * Escape and the scrim close it; focus moves inside on open and returns on close.
 */
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
      <div className="fade-in absolute inset-0 bg-ink/25" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cx(
          "rise-in absolute flex flex-col bg-paper outline-none",
          "inset-x-0 bottom-0 max-h-[92dvh] border-t border-ink",
          "md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:border-t-0 md:border-l",
          wide ? "md:w-[min(720px,92vw)]" : "md:w-[min(480px,92vw)]",
        )}
      >
        <header className="flex items-start justify-between gap-6 border-b border-rule px-5 pt-5 pb-4 md:px-8 md:pt-8">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow text-red">{eyebrow}</p>}
            <h2 className="mt-1 text-2xl font-bold tracking-tight uppercase md:text-3xl">{title}</h2>
          </div>
          <button data-close onClick={onClose} className="eyebrow shrink-0 pt-1 text-mute hover:text-ink">
            Close
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-6 md:px-8">{children}</div>
        {footer && <footer className="border-t border-rule px-5 py-4 md:px-8">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
