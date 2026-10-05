"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { EditableText } from "@/components/ui/EditableText";
import { ConfirmButton, Field, FilterTabs, ListEditor, SectionHeading, Select } from "@/components/ui/forms";
import { useActions, useCollection, useFilm } from "@/lib/store";
import type { FilmMemory, MemoryType, Version, VersionType } from "@/lib/types";
import { cx, formatDay, formatMonth, now, versionLabel } from "@/lib/utils";
import { MEMORY_TYPES, MEMORY_TYPE_LABEL, MEMORY_TYPE_PLURAL, VERSION_TYPES } from "@/lib/vocabulary";

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
    <div className="grid gap-x-12 gap-y-16 px-4 pb-24 md:grid-cols-12 md:px-10">
      <section className="md:col-span-8">
        <div className="border-t border-ink pt-6">
          <h2 className="text-title font-extrabold tracking-[-0.03em] uppercase">Film memory</h2>
          <p className="serif mt-3 max-w-xl text-xl leading-snug text-ink-2 italic">
            What you decided, what changed, what you let go of — and why. The reasons are the part you&rsquo;ll forget.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-2">
          <FilterTabs
            label="Memory categories"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: memories.length },
              ...MEMORY_TYPES.map((t) => ({ value: t, label: MEMORY_TYPE_PLURAL[t], count: memories.filter((m) => m.type === t).length })),
            ]}
          />
          <button onClick={() => setAdding(true)} className="link-action">
            Remember something
          </button>
        </div>

        {byMonth.length === 0 && <p className="serif py-12 text-2xl text-mute italic">Nothing remembered here yet.</p>}
        {byMonth.map((g) => (
          <div key={g.month} className="mt-10">
            <p className="eyebrow text-mute">{g.month}</p>
            <ol className="mt-3 border-t border-rule">
              {g.items.map((m) => (
                <MemoryItem key={m.id} memory={m} />
              ))}
            </ol>
          </div>
        ))}
      </section>

      <Versions filmId={filmId} />

      <NewMemoryDrawer filmId={filmId} open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

function MemoryItem({ memory }: { memory: FilmMemory }) {
  const actions = useActions();
  const [open, setOpen] = useState(false);
  const update = (patch: Partial<FilmMemory>) => actions.update("memories", memory.id, patch);
  const accent = memory.type === "decision" || memory.type === "open_question";

  return (
    <li className="border-b border-rule">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group grid w-full grid-cols-[6.5rem_1fr_auto] gap-4 py-5 text-left md:grid-cols-[9rem_1fr_auto]"
      >
        <span className="text-lg leading-none font-extrabold tracking-tight uppercase md:text-xl">{formatDay(memory.date)}</span>
        <span>
          <span className={cx("eyebrow", accent ? "text-red" : "text-mute")}>{MEMORY_TYPE_LABEL[memory.type]}</span>
          <span className={cx("mt-1 block leading-snug group-hover:text-red", memory.type === "deleted_idea" ? "text-lg text-ink-2 line-through decoration-red/60 decoration-1" : "text-lg font-medium")}>
            {memory.description}
          </span>
        </span>
        <span aria-hidden className={cx("pt-1 text-mute transition-transform", open && "rotate-45")}>+</span>
      </button>
      {open && (
        <div className="fade-in grid gap-5 pb-6 md:grid-cols-[9rem_1fr]">
          <span />
          <div className="space-y-5">
            <div>
              <p className="eyebrow text-mute">Reason</p>
              <EditableText label="Reason" value={memory.reason} onSave={(reason) => update({ reason })} multiline placeholder="Why?" className="serif mt-1 text-2xl leading-snug italic" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Title">
                <EditableText label="Title" value={memory.title} onSave={(title) => update({ title })} />
              </Field>
              <Field label="Kind">
                <Select label="Kind" value={memory.type} onChange={(type) => update({ type })} options={MEMORY_TYPES.map((t) => ({ value: t, label: MEMORY_TYPE_LABEL[t] }))} />
              </Field>
            </div>
            <Field label="What happened">
              <EditableText label="Description" value={memory.description} onSave={(description) => update({ description })} multiline />
            </Field>
            <ConfirmButton onConfirm={() => actions.remove("memories", memory.id)}>Forget this</ConfirmButton>
          </div>
        </div>
      )}
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
      <form onSubmit={submit} className="space-y-7">
        <div className="flex flex-wrap gap-x-4 gap-y-2" role="radiogroup" aria-label="Kind of memory">
          {MEMORY_TYPES.map((t) => (
            <button type="button" key={t} role="radio" aria-checked={type === t} onClick={() => setType(t)} className={cx("eyebrow", type === t ? "text-red" : "text-mute hover:text-ink")}>
              {MEMORY_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <Field label="What happened">
          <textarea data-autofocus value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="You decided to…" className="input text-lg" />
        </Field>
        <Field label="Why" hint="Future you will thank you.">
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="input serif text-xl italic" />
        </Field>
        <button type="submit" className="eyebrow w-full bg-ink py-3.5 text-paper hover:bg-red">
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
    <aside id="versions" className="scroll-mt-16 md:col-span-4">
      <SectionHeading action={<button onClick={newVersion} className="link-action">New version</button>}>Version history</SectionHeading>
      <ol className="mt-4">
        {sorted.map((v) => (
          <li key={v.id} className="border-b border-rule">
            <button onClick={() => setOpenId(v.id)} className="group w-full py-5 text-left">
              <span className="flex items-baseline gap-3">
                <span className={cx("text-4xl font-extrabold tracking-tight group-hover:text-red", v === current ? "text-ink" : "text-ink-2")}>
                  {versionLabel(v.versionNumber)}
                </span>
                {v === current && <span className="eyebrow text-red">— Current</span>}
              </span>
              <span className="mt-1 block text-sm">{v.type}</span>
              <span className="block text-sm text-mute">{formatDay(v.date)}</span>
            </button>
          </li>
        ))}
      </ol>
      {film && <p className="mt-4 text-xs text-mute">The film is currently marked {film.currentVersion}.</p>}
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
      <div className="space-y-10">
        <div className="grid grid-cols-2 gap-6">
          <Field label="Kind">
            <Select label="Version kind" value={version.type} onChange={(type) => update({ type, title: type })} options={VERSION_TYPES.map((t) => ({ value: t, label: t }))} />
          </Field>
        </div>
        <Field label="In one line">
          <EditableText label="Summary" value={version.summary} onSave={(summary) => update({ summary })} multiline placeholder="What this version is." className="serif text-2xl leading-snug italic" />
        </Field>
        <VersionList title="What changed" items={version.changes} onChange={(changes) => update({ changes })} />
        <VersionList title="What was removed" items={version.removed} onChange={(removed) => update({ removed })} strike />
        <VersionList title="What emerged" items={version.emerged} onChange={(emerged) => update({ emerged })} accent />
      </div>
    </Drawer>
  );
}

function VersionList({ title, items, onChange, strike, accent }: { title: string; items: string[]; onChange: (v: string[]) => void; strike?: boolean; accent?: boolean }) {
  return (
    <section>
      <SectionHeading>{title}</SectionHeading>
      <div className="mt-2">
        <ListEditor
          label={title}
          items={items}
          onChange={onChange}
          placeholder="Add…"
          itemClassName={cx("text-lg leading-snug", strike && "text-ink-2 line-through decoration-red/60", accent && "serif text-xl italic")}
        />
      </div>
    </section>
  );
}
