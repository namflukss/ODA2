"use client";

import { ChevronDown, GitBranchPlus, Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { EditableText } from "@/components/ui/EditableText";
import { Badge, ConfirmButton, Field, FilterTabs, ListEditor, PageHeader, Select, type Tone } from "@/components/ui/forms";
import { useActions, useCollection, useFilm } from "@/lib/store";
import type { FilmMemory, MemoryType, Version, VersionType } from "@/lib/types";
import { cx, formatDay, formatMonth, now, versionLabel } from "@/lib/utils";
import { MEMORY_TYPES, MEMORY_TYPE_LABEL, MEMORY_TYPE_PLURAL, VERSION_TYPES } from "@/lib/vocabulary";

const MEMORY_TONE: Record<MemoryType, Tone> = {
  decision: "accent",
  change: "sky",
  deleted_idea: "neutral",
  open_question: "plum",
  milestone: "ochre",
};
const DOT: Record<MemoryType, string> = {
  decision: "bg-accent",
  change: "bg-sky",
  deleted_idea: "bg-mute",
  open_question: "bg-plum",
  milestone: "bg-ochre",
};

export function Memory({ filmId }: { filmId: string }) {
  const memories = useCollection("memories", filmId);
  const [filter, setFilter] = useState<MemoryType | "all">("all");
  const [adding, setAdding] = useState(false);

  const sorted = useMemo(
    () => [...memories].filter((m) => filter === "all" || m.type === filter).sort((a, b) => b.date.localeCompare(a.date)),
    [memories, filter],
  );
  const byMonth = useMemo(() => {
    const groups: { month: string; items: FilmMemory[] }[] = [];
    for (const m of sorted) {
      const month = formatMonth(m.date);
      const g = groups.find((x) => x.month === month);
      if (g) g.items.push(m);
      else groups.push({ month, items: [m] });
    }
    return groups;
  }, [sorted]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Film memory"
        subtitle="What you decided, what changed, what you let go of — and why. The reasons are the part you'll forget."
        actions={
          <button onClick={() => setAdding(true)} className="btn btn-primary">
            <Plus size={15} /> Remember something
          </button>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <section className="lg:col-span-8">
          <FilterTabs
            label="Memory categories"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: memories.length },
              ...MEMORY_TYPES.map((t) => ({ value: t, label: MEMORY_TYPE_PLURAL[t], count: memories.filter((m) => m.type === t).length })),
            ]}
          />

          {byMonth.length === 0 && <p className="py-12 text-center text-mute">Nothing remembered here yet.</p>}
          {byMonth.map((g) => (
            <div key={g.month} className="mt-6">
              <p className="mb-3 text-sm font-medium text-ink-2">{g.month}</p>
              <ol className="relative space-y-3 pl-6 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-px before:bg-line-strong">
                {g.items.map((m) => (
                  <MemoryItem key={m.id} memory={m} />
                ))}
              </ol>
            </div>
          ))}
        </section>

        <Versions filmId={filmId} />
      </div>

      <NewMemoryDrawer filmId={filmId} open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

function MemoryItem({ memory }: { memory: FilmMemory }) {
  const actions = useActions();
  const [open, setOpen] = useState(false);
  const update = (patch: Partial<FilmMemory>) => actions.update("memories", memory.id, patch);

  return (
    <li className="relative">
      <span className={cx("absolute top-5 -left-6 h-[15px] w-[15px] rounded-full border-[3px] border-canvas", DOT[memory.type])} aria-hidden />
      <div className="card overflow-hidden">
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-start gap-4 p-4 text-left hover:bg-canvas/60">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={MEMORY_TONE[memory.type]}>{MEMORY_TYPE_LABEL[memory.type]}</Badge>
              <span className="text-xs text-mute">{formatDay(memory.date)}</span>
            </div>
            <p className={cx("mt-2 leading-snug", memory.type === "deleted_idea" ? "text-ink-2 line-through decoration-mute" : "font-medium")}>{memory.description}</p>
            {!open && memory.reason && <p className="serif mt-1 line-clamp-1 text-ink-2 italic">{memory.reason}</p>}
          </div>
          <ChevronDown size={18} className={cx("mt-1 shrink-0 text-mute transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div className="fade-in space-y-4 border-t border-line bg-canvas/40 p-4">
            <div>
              <p className="label">Why</p>
              <EditableText label="Reason" value={memory.reason} onSave={(reason) => update({ reason })} multiline placeholder="Why?" className="serif mt-1 text-xl leading-snug" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title">
                <EditableText label="Title" value={memory.title} onSave={(title) => update({ title })} />
              </Field>
              <Field label="Kind">
                <Select label="Kind" value={memory.type} onChange={(type) => update({ type })} options={MEMORY_TYPES.map((t) => ({ value: t, label: MEMORY_TYPE_LABEL[t] }))} className="py-1.5" />
              </Field>
            </div>
            <Field label="What happened">
              <EditableText label="Description" value={memory.description} onSave={(description) => update({ description })} multiline />
            </Field>
            <ConfirmButton onConfirm={() => actions.remove("memories", memory.id)}>Forget this</ConfirmButton>
          </div>
        )}
      </div>
    </li>
  );
}

function NewMemoryDrawer({ filmId, open, onClose }: { filmId: string; open: boolean; onClose: () => void }) {
  const actions = useActions();
  const [type, setType] = useState<MemoryType>("decision");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    const d = description.trim();
    actions.create("memories", {
      filmId,
      date: now(),
      type,
      title: d.length > 60 ? `${d.slice(0, 57)}…` : d,
      description: d,
      reason: reason.trim(),
    });
    setDescription("");
    setReason("");
    onClose();
  };

  return (
    <Drawer open={open} onClose={onClose} title="Remember" eyebrow="Film memory">
      <form onSubmit={submit} className="space-y-5">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Kind of memory">
          {MEMORY_TYPES.map((t) => (
            <button type="button" key={t} role="radio" aria-checked={type === t} onClick={() => setType(t)} className="pill">
              {MEMORY_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <Field label="What happened">
          <textarea data-autofocus value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="You decided to…" className="input" />
        </Field>
        <Field label="Why" hint="Future you will thank you.">
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="input serif text-lg italic" />
        </Field>
        <button type="submit" className="btn btn-primary w-full justify-center py-3">
          Keep it
        </button>
      </form>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ */
/* Version history                                                     */
/* ------------------------------------------------------------------ */

function Versions({ filmId }: { filmId: string }) {
  const { film } = useFilm(filmId);
  const versions = useCollection("versions", filmId);
  const actions = useActions();
  const params = useSearchParams();
  const [openId, setOpenId] = useState<string | null>(params.get("version"));
  const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
  const current = sorted[0];
  const open = versions.find((v) => v.id === openId);

  const newVersion = () => {
    const n = (current?.versionNumber ?? 0) + 1;
    const v = actions.create("versions", {
      filmId,
      versionNumber: n,
      title: current?.type ?? "Treatment",
      type: (current?.type ?? "Treatment") as VersionType,
      date: now(),
      summary: "",
      changes: [],
      removed: [],
      emerged: [],
    });
    actions.updateFilm(filmId, { currentVersion: versionLabel(n) });
    actions.create("memories", {
      filmId,
      date: now(),
      type: "milestone",
      title: `${versionLabel(n)} begun`,
      description: `Started ${versionLabel(n)} of the ${v.type.toLowerCase()}.`,
      reason: "",
    });
    setOpenId(v.id);
  };

  return (
    <aside id="versions" className="card scroll-mt-20 overflow-hidden lg:sticky lg:top-6 lg:col-span-4">
      <header className="flex items-center justify-between px-5 pt-4 pb-2">
        <h2 className="font-semibold">Version history</h2>
        <button onClick={newVersion} className="pill py-1 text-xs">
          <GitBranchPlus size={13} /> New version
        </button>
      </header>
      <ol className="px-3 pb-3">
        {sorted.map((v) => (
          <li key={v.id}>
            <button onClick={() => setOpenId(v.id)} className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-hover">
              <span className={cx("grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-semibold", v === current ? "bg-accent text-white" : "bg-sunken text-ink-2")}>
                {versionLabel(v.versionNumber)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-medium">
                  {v.type}
                  {v === current && <Badge tone="accent">Current</Badge>}
                </span>
                <span className="block truncate text-xs text-mute">
                  {formatDay(v.date)} · {v.summary || "No summary yet"}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      {film && <p className="border-t border-line px-5 py-3 text-xs text-mute">The film is currently marked {film.currentVersion}.</p>}
      <VersionDrawer version={open} isCurrent={open === current} onClose={() => setOpenId(null)} />
    </aside>
  );
}

function VersionDrawer({ version, isCurrent, onClose }: { version?: Version; isCurrent: boolean; onClose: () => void }) {
  const actions = useActions();
  if (!version) return null;
  const update = (patch: Partial<Version>) => actions.update("versions", version.id, patch);
  return (
    <Drawer
      open
      onClose={onClose}
      wide
      title={`${versionLabel(version.versionNumber)}${isCurrent ? " — Current" : ""}`}
      eyebrow={`${version.type} · ${formatDay(version.date)}`}
      footer={
        <ConfirmButton
          onConfirm={() => {
            actions.remove("versions", version.id);
            onClose();
          }}
        >
          Delete version
        </ConfirmButton>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <Field label="Kind">
            <Select label="Version kind" value={version.type} onChange={(type) => update({ type, title: type })} options={VERSION_TYPES.map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="In one line">
            <EditableText label="Summary" value={version.summary} onSave={(summary) => update({ summary })} multiline placeholder="What this version is." className="serif text-xl leading-snug" />
          </Field>
        </div>
        <VersionList title="What changed" tone="sky" items={version.changes} onChange={(changes) => update({ changes })} />
        <VersionList title="What was removed" tone="neutral" items={version.removed} onChange={(removed) => update({ removed })} strike />
        <VersionList title="What emerged" tone="accent" items={version.emerged} onChange={(emerged) => update({ emerged })} />
      </div>
    </Drawer>
  );
}

function VersionList({ title, items, onChange, strike, tone }: { title: string; items: string[]; onChange: (v: string[]) => void; strike?: boolean; tone: Tone }) {
  return (
    <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)]">
      <Badge tone={tone}>{title}</Badge>
      <div className="mt-3">
        <ListEditor label={title} items={items} onChange={onChange} placeholder="Add…" itemClassName={cx("leading-snug", strike && "text-ink-2 line-through decoration-mute")} />
      </div>
    </section>
  );
}
