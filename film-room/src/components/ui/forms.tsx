"use client";

import { Plus, Upload, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/utils";
import { EditableText } from "./EditableText";
import { STILLS, STILL_KEYS, Still } from "./Still";

/** A rounded surface with an optional header row. */
export function Card({
  title,
  icon,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cx("card", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4">
          <h2 className="flex items-center gap-2 text-[0.8rem] font-medium text-mute">
            {icon && <span className="text-ink-2">{icon}</span>}
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className={cx("px-5 pt-2 pb-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Page title row used at the top of every film section. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight md:text-[2rem]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="mt-1.5">{children}</div>
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
      className={cx("btn", armed ? "bg-accent text-white" : "btn-quiet text-mute hover:text-accent", className)}
    >
      {armed ? "Click again to confirm" : children}
    </button>
  );
}

/** A list of editable lines (questions, moments, changes…). */
export function ListEditor({
  items,
  onChange,
  placeholder,
  label,
  itemClassName,
  marker = "dot",
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  label: string;
  itemClassName?: string;
  marker?: "dot" | "number" | "none";
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft("");
  };
  const mark = (i: number) =>
    marker === "number" ? (
      <span className="mt-1 w-5 shrink-0 text-xs font-medium text-mute tabular-nums">{i + 1}</span>
    ) : marker === "dot" ? (
      <span className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
    ) : null;
  return (
    <div>
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li key={`${i}-${item.slice(0, 12)}`} className="group flex items-start gap-3">
            {mark(i)}
            <EditableText
              label={`${label} ${i + 1}`}
              value={item}
              multiline
              onSave={(v) => onChange(v ? items.map((x, j) => (j === i ? v : x)) : items.filter((_, j) => j !== i))}
              className={itemClassName}
            />
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="mt-1 rounded-md p-1 text-mute opacity-0 group-hover:opacity-100 hover:bg-hover hover:text-accent focus:opacity-100"
              aria-label={`Remove ${label} ${i + 1}`}
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-1 flex items-center gap-3">
        <Plus size={14} className="shrink-0 text-mute" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          onBlur={add}
          placeholder={placeholder}
          aria-label={`Add ${label}`}
          className="field text-sm placeholder:text-mute"
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
    <div className="input flex flex-wrap items-center gap-1.5 py-1.5">
      {tags.map((t) => (
        <span key={t} className="flex items-center gap-1 rounded-full bg-sunken py-0.5 pr-1 pl-2.5 text-xs">
          {t}
          <button onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`} className="rounded-full p-0.5 text-mute hover:text-accent">
            <X size={12} />
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
        placeholder="Add tag"
        aria-label="Add tag"
        className="min-w-24 flex-1 bg-transparent py-0.5 text-sm outline-none"
      />
    </div>
  );
}

/** Choose a built-in still or upload a local image (stored as a data URL in the MVP). */
export function ImagePicker({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const file = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="grid grid-cols-6 gap-2">
        {STILL_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onChange(`still:${k}`)}
            className={cx(
              "aspect-square overflow-hidden rounded-lg ring-offset-2 transition",
              value === `still:${k}` ? "ring-2 ring-accent" : "hover:opacity-90",
            )}
            aria-label={`Use ${STILLS[k].label}`}
            aria-pressed={value === `still:${k}`}
          >
            <Still image={`still:${k}`} alt="" />
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={() => file.current?.click()} className="btn btn-ghost">
          <Upload size={14} /> Upload image
        </button>
        {value && !value.startsWith("still:") && <span className="text-xs text-mute">Using your image</span>}
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
      className={cx("input cursor-pointer", className)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** A row of filter pills. */
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
    <div role="tablist" aria-label={label} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)} className="pill shrink-0">
          {o.label}
          {o.count !== undefined && <span className="tabular-nums opacity-60">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** A soft coloured badge. */
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium", TONE[tone])}>{children}</span>;
}

export type Tone = "neutral" | "accent" | "ochre" | "sage" | "sky" | "plum" | "dark";
export const TONE: Record<Tone, string> = {
  neutral: "bg-sunken text-ink-2",
  accent: "bg-accent-soft text-accent-deep",
  ochre: "bg-ochre-soft text-[#8a6413]",
  sage: "bg-sage-soft text-[#4d6853]",
  sky: "bg-sky-soft text-[#466583]",
  plum: "bg-plum-soft text-[#6f4868]",
  dark: "bg-ink text-white",
};
