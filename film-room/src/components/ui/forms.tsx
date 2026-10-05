"use client";

import { useRef, useState, type ReactNode } from "react";
import { cx, pad } from "@/lib/utils";
import { EditableText } from "./EditableText";
import { STILLS, STILL_KEYS, Still } from "./Still";

/** Editorial section heading: "01  THE STORY". */
export function SectionHeading({
  index,
  children,
  action,
  className,
}: {
  index?: number;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex items-baseline justify-between gap-4 border-t border-ink pt-3", className)}>
      <h2 className="eyebrow flex items-baseline gap-4">
        {index !== undefined && <span className="text-red tabular-nums">{pad(index)}</span>}
        <span>{children}</span>
      </h2>
      {action}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="eyebrow text-mute">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs text-mute">{hint}</span>}
    </label>
  );
}

/** Two-step destructive action. */
export function ConfirmButton({
  onConfirm,
  children = "Delete",
  className,
}: {
  onConfirm: () => void;
  children?: ReactNode;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      onBlur={() => setArmed(false)}
      className={cx("eyebrow", armed ? "text-red" : "text-mute hover:text-red", className)}
    >
      {armed ? "Click again to confirm" : children}
    </button>
  );
}

/** A numbered list of editable lines (questions, moments, changes…). */
export function ListEditor({
  items,
  onChange,
  placeholder,
  numbered = true,
  label,
  itemClassName,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  numbered?: boolean;
  label: string;
  itemClassName?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft("");
  };
  return (
    <div>
      <ol className="divide-y divide-rule">
        {items.map((item, i) => (
          <li key={`${i}-${item.slice(0, 12)}`} className="group flex items-baseline gap-4 py-2.5">
            {numbered && <span className="eyebrow w-6 shrink-0 text-red tabular-nums">{pad(i + 1)}</span>}
            <EditableText
              label={`${label} ${i + 1}`}
              value={item}
              multiline
              onSave={(v) => onChange(v ? items.map((x, j) => (j === i ? v : x)) : items.filter((_, j) => j !== i))}
              className={itemClassName}
            />
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-mute opacity-0 group-hover:opacity-100 hover:text-red focus:opacity-100"
              aria-label={`Remove ${label} ${i + 1}`}
            >
              ×
            </button>
          </li>
        ))}
      </ol>
      <div className="flex items-baseline gap-4 border-t border-rule py-2.5">
        {numbered && <span className="eyebrow w-6 shrink-0 text-mute tabular-nums">{pad(items.length + 1)}</span>}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          onBlur={add}
          placeholder={placeholder}
          aria-label={`Add ${label}`}
          className="field text-mute placeholder:text-mute/70 focus:text-ink"
        />
      </div>
    </div>
  );
}

export function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim().toLowerCase();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setDraft("");
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <span key={t} className="flex items-center gap-1 bg-paper-2 py-0.5 pr-1 pl-2 text-xs">
          #{t}
          <button onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`} className="px-1 text-mute hover:text-red">
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
          if (e.key === "Backspace" && !draft && tags.length) onChange(tags.slice(0, -1));
        }}
        onBlur={add}
        placeholder="add tag"
        aria-label="Add tag"
        className="min-w-24 flex-1 bg-transparent py-1 text-xs outline-none"
      />
    </div>
  );
}

/** Choose a procedural still or upload a local image (stored as a data URL in the MVP). */
export function ImagePicker({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const file = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="grid grid-cols-6 gap-1.5">
        {STILL_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onChange(`still:${k}`)}
            className={cx("aspect-square overflow-hidden outline-offset-2", value === `still:${k}` && "outline-2 outline-red")}
            aria-label={`Use ${STILLS[k].label}`}
            aria-pressed={value === `still:${k}`}
          >
            <Still image={`still:${k}`} alt="" />
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4">
        <button type="button" onClick={() => file.current?.click()} className="link-action">
          Upload an image
        </button>
        {value && !value.startsWith("still:") && <span className="text-xs text-mute">Your image is in use.</span>}
      </div>
      <input
        ref={file}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => typeof reader.result === "string" && onChange(reader.result);
          reader.readAsDataURL(f);
        }}
      />
    </div>
  );
}

export function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <select
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value as T)}
      className={cx("input cursor-pointer appearance-none bg-transparent", className)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Filter row of editorial tabs. */
export function FilterTabs<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "eyebrow shrink-0 border-b py-1.5 transition-colors",
            value === o.value ? "border-ink text-ink" : "border-transparent text-mute hover:text-ink",
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="ml-1.5 text-mute tabular-nums">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
