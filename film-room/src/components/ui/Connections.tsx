"use client";

/**
 * Connections between pieces of material: a row of linked chips plus a picker
 * that searches everything else in the film.
 */
import Link from "next/link";
import { useMemo, useRef, useState, useEffect } from "react";
import { refOptions, resolveRefs, sameRef } from "@/lib/refs";
import { useFilmRoom } from "@/lib/store";
import type { EntityRef, ID, RefType } from "@/lib/types";
import { cx } from "@/lib/utils";

interface Props {
  filmId: ID;
  value: EntityRef[];
  onChange: (next: EntityRef[]) => void;
  /** Which kinds of material may be connected. */
  types?: RefType[];
  /** Hide this entity from the picker (no self-links). */
  exclude?: ID;
  compact?: boolean;
  label?: string;
}

export function Connections({ filmId, value, onChange, types, exclude, compact, label = "Connected to" }: Props) {
  const { state } = useFilmRoom();
  const resolved = resolveRefs(state, filmId, value);

  return (
    <div>
      {!compact && <p className="eyebrow mb-2 text-mute">{label}</p>}
      <ul className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {resolved.map((r) => (
          <li key={`${r.ref.type}:${r.ref.id}`} className="group flex items-center border border-rule bg-card text-sm">
            <Link href={r.href} className="flex items-baseline gap-1.5 py-1 pr-1 pl-2 hover:text-red">
              <span className="eyebrow text-[0.6rem] text-mute">{r.kind}</span>
              <span className="max-w-[16rem] truncate">{r.label}</span>
            </Link>
            <button
              onClick={() => onChange(value.filter((v) => !sameRef(v, r.ref)))}
              className="px-2 py-1 text-mute hover:text-red"
              aria-label={`Disconnect ${r.label}`}
            >
              ×
            </button>
          </li>
        ))}
        <li>
          <ConnectPicker
            filmId={filmId}
            types={types}
            exclude={exclude}
            selected={value}
            onPick={(ref) => onChange([...value, ref])}
          />
        </li>
      </ul>
    </div>
  );
}

export function ConnectPicker({
  filmId,
  types,
  exclude,
  selected,
  onPick,
  label = "+ Connect",
}: {
  filmId: ID;
  types?: RefType[];
  exclude?: ID;
  selected: EntityRef[];
  onPick: (ref: EntityRef) => void;
  label?: string;
}) {
  const { state } = useFilmRoom();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return refOptions(state, filmId, types)
      .filter((o) => o.ref.id !== exclude && !selected.some((s) => sameRef(s, o.ref)))
      .filter((o) => !q || o.label.toLowerCase().includes(q) || o.kind.toLowerCase().includes(q))
      .slice(0, 40);
  }, [state, filmId, types, exclude, selected, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => setActive(0), [query]);

  const pick = (i: number) => {
    const o = options[i];
    if (!o) return;
    onPick(o.ref);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="eyebrow px-1 py-1.5 text-red hover:text-ink"
      >
        {label}
      </button>
      {open && (
        <div className="fade-in absolute top-full left-0 z-30 mt-1 w-72 border border-ink bg-paper shadow-[4px_4px_0_0_rgba(29,27,24,0.08)]">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, options.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                pick(active);
              } else if (e.key === "Escape") {
                e.stopPropagation();
                setOpen(false);
              }
            }}
            placeholder="Find a scene, person, theme…"
            aria-label="Search material to connect"
            className="w-full border-b border-rule bg-transparent px-3 py-2.5 text-sm outline-none"
          />
          <ul role="listbox" className="max-h-72 overflow-y-auto py-1">
            {options.length === 0 && <li className="px-3 py-2 text-sm text-mute">Nothing else to connect.</li>}
            {options.map((o, i) => (
              <li
                key={`${o.ref.type}:${o.ref.id}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(i);
                }}
                className={cx("flex cursor-pointer items-baseline gap-2 px-3 py-1.5 text-sm", i === active && "bg-paper-2")}
              >
                <span className="eyebrow w-20 shrink-0 text-[0.6rem] text-mute">{o.kind}</span>
                <span className="truncate">{o.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
