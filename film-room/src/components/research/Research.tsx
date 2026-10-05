"use client";

import {
  BookText,
  Camera,
  FileText,
  Film as FilmIcon,
  ImagePlus,
  type LucideIcon,
  Mic,
  MonitorSmartphone,
  Newspaper,
  Plus,
  Search,
  StickyNote,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Connections } from "@/components/ui/Connections";
import { Drawer } from "@/components/ui/Drawer";
import { EditableText } from "@/components/ui/EditableText";
import { Badge, ConfirmButton, Field, FilterTabs, ImagePicker, PageHeader, Select, TagInput } from "@/components/ui/forms";
import { Still } from "@/components/ui/Still";
import { resolveRefs } from "@/lib/refs";
import { useActions, useCollection, useFilmRoom } from "@/lib/store";
import type { ResearchItem, ResearchType } from "@/lib/types";
import { cx, now } from "@/lib/utils";
import { RESEARCH_TYPES, RESEARCH_TYPE_LABEL } from "@/lib/vocabulary";

const TYPE_ICON: Record<ResearchType, LucideIcon> = {
  article: Newspaper,
  book: BookText,
  film: FilmIcon,
  photograph: Camera,
  interview: Mic,
  document: FileText,
  screenshot: MonitorSmartphone,
  note: StickyNote,
};

export function Research({ filmId }: { filmId: string }) {
  const items = useCollection("research", filmId);
  const actions = useActions();
  const params = useSearchParams();
  const [type, setType] = useState<ResearchType | "all">("all");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(params.get("item"));

  const tags = useMemo(() => [...new Set(items.flatMap((i) => i.tags))].sort(), [items]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => type === "all" || i.type === type)
      .filter((i) => !tag || i.tags.includes(tag))
      .filter((i) => !q || `${i.title} ${i.description} ${i.source} ${i.tags.join(" ")}`.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [items, type, tag, query]);

  const add = () => {
    const item = actions.create("research", {
      filmId,
      title: "Untitled",
      type: type === "all" ? "note" : type,
      description: "",
      source: "",
      tags: [],
      connections: [],
      createdAt: now(),
    });
    setOpenId(item.id);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Research"
        subtitle="Articles, books, films, photographs, interviews and documents — each connected to the part of the film it feeds."
        actions={
          <button onClick={add} className="btn btn-primary">
            <Plus size={15} /> Add research
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-mute" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the archive" aria-label="Search research" className="input rounded-full pl-9" />
        </div>
        <FilterTabs
          label="Research types"
          value={type}
          onChange={setType}
          options={[
            { value: "all", label: "All", count: items.length },
            ...RESEARCH_TYPES.filter((t) => items.some((i) => i.type === t)).map((t) => ({ value: t, label: RESEARCH_TYPE_LABEL[t], count: items.filter((i) => i.type === t).length })),
          ]}
        />
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(tag === t ? null : t)}
              aria-pressed={tag === t}
              className={cx("rounded-full px-2.5 py-0.5 text-xs", tag === t ? "bg-ink text-white" : "bg-sunken text-ink-2 hover:text-ink")}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      <ul className="columns-1 gap-4 sm:columns-2 xl:columns-3">
        {visible.map((item) => (
          <ResearchCard key={item.id} item={item} filmId={filmId} onOpen={() => setOpenId(item.id)} />
        ))}
      </ul>
      {visible.length === 0 && <p className="py-12 text-center text-mute">Nothing matches.</p>}

      <ResearchDrawer filmId={filmId} item={items.find((i) => i.id === openId)} onClose={() => setOpenId(null)} />
    </div>
  );
}

function ResearchCard({ item, filmId, onOpen }: { item: ResearchItem; filmId: string; onOpen: () => void }) {
  const { state } = useFilmRoom();
  const refs = resolveRefs(state, filmId, item.connections);
  const Icon = TYPE_ICON[item.type];
  return (
    <li className="mb-4 break-inside-avoid">
      <button onClick={onOpen} className="group card block w-full overflow-hidden text-left transition-shadow hover:shadow-[var(--shadow-lift)]">
        {item.image && (
          <div className="h-44 overflow-hidden">
            <div className="h-full w-full transition-transform duration-700 group-hover:scale-[1.03]">
              <Still image={item.image} alt="" />
            </div>
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 text-xs text-mute">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-sunken text-ink-2">
              <Icon size={13} />
            </span>
            {RESEARCH_TYPE_LABEL[item.type]}
          </div>
          <p className="mt-2 text-[1.05rem] leading-snug font-semibold group-hover:text-accent">{item.title}</p>
          {item.source && <p className="mt-0.5 text-sm text-mute">{item.source}</p>}
          {item.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-2">{item.description}</p>}
          {(refs.length > 0 || item.tags.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-1">
              {refs.map((r) => (
                <Badge key={`${r.ref.type}:${r.ref.id}`} tone="accent">
                  {r.label}
                </Badge>
              ))}
              {item.tags.map((t) => (
                <Badge key={t}>#{t}</Badge>
              ))}
            </div>
          )}
        </div>
      </button>
    </li>
  );
}

function ResearchDrawer({ filmId, item, onClose }: { filmId: string; item?: ResearchItem; onClose: () => void }) {
  const actions = useActions();
  const [showImage, setShowImage] = useState(false);
  if (!item) return null;
  const update = (patch: Partial<ResearchItem>) => actions.update("research", item.id, patch);
  return (
    <Drawer
      open
      onClose={onClose}
      wide
      title={item.title}
      eyebrow={RESEARCH_TYPE_LABEL[item.type]}
      footer={
        <ConfirmButton
          onConfirm={() => {
            actions.remove("research", item.id);
            onClose();
          }}
        >
          Remove from archive
        </ConfirmButton>
      }
    >
      <div className="space-y-5">
        {item.image && (
          <div className="h-56 overflow-hidden rounded-2xl">
            <Still image={item.image} alt={item.title} />
          </div>
        )}
        <Field label="Title">
          <EditableText label="Title" value={item.title} onSave={(title) => title && update({ title })} className="text-lg font-semibold" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <Select label="Type" value={item.type} onChange={(type) => update({ type })} options={RESEARCH_TYPES.map((t) => ({ value: t, label: RESEARCH_TYPE_LABEL[t] }))} />
          </Field>
          <Field label="Source">
            <EditableText label="Source" value={item.source} onSave={(source) => update({ source })} placeholder="Author, year, where it lives" />
          </Field>
        </div>
        <Field label="Why it matters">
          <EditableText label="Description" value={item.description} onSave={(description) => update({ description })} multiline placeholder="What it gives the film." className="serif text-lg leading-snug" />
        </Field>
        <Field label="Tags">
          <TagInput tags={item.tags} onChange={(tags) => update({ tags })} />
        </Field>
        <Connections filmId={filmId} value={item.connections} onChange={(connections) => update({ connections })} types={["story", "scene", "character", "theme", "question"]} />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowImage((s) => !s)} className="btn btn-ghost">
            <ImagePlus size={14} /> {item.image ? "Change image" : "Attach image"}
          </button>
          {item.image && (
            <button onClick={() => update({ image: undefined })} className="btn btn-quiet">
              Remove image
            </button>
          )}
        </div>
        {showImage && <ImagePicker value={item.image} onChange={(image) => update({ image })} />}
      </div>
    </Drawer>
  );
}
