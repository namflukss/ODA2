"use client";

/**
 * Text that reads as text and edits in place.
 * Saves on blur, on Enter (single line) or ⌘/Ctrl+Enter (multi-line). Escape reverts.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cx } from "@/lib/utils";

interface Props {
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  label: string;
  /** Uppercase display while keeping the stored value as typed. */
  uppercase?: boolean;
}

export function EditableText({ value, onSave, multiline, placeholder, className, label, uppercase }: Props) {
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  useEffect(() => setDraft(value), [value]);

  // Auto-grow textareas so text never hides behind a scrollbar.
  useLayoutEffect(() => {
    const el = ref.current;
    if (multiline && el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [draft, multiline]);

  const commit = () => {
    const next = draft.trim();
    if (next !== value.trim()) onSave(next);
  };

  const common = {
    ref,
    value: draft,
    "aria-label": label,
    placeholder,
    className: cx("field", uppercase && "uppercase", className),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setDraft(value);
        (e.target as HTMLElement).blur();
      }
      if (e.key === "Enter" && (!multiline || e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      }
    },
  };

  return multiline ? <textarea rows={1} {...common} /> : <input {...common} />;
}
