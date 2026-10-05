"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Connections } from "@/components/ui/Connections";
import { Drawer } from "@/components/ui/Drawer";
import { EditableText } from "@/components/ui/EditableText";
import { ConfirmButton, Field, FilterTabs, ImagePicker, Select, TagInput } from "@/components/ui/forms";
import { Still } from "@/components/ui/Still";
import { resolveRefs } from "@/lib/refs";
import { useActions, useCollection, useFilmRoom } from "@/lib/store";
import type { ResearchItem, ResearchType } from "@/lib/types";
import { cx, now, pad } from "@/lib/utils";
import { RESEARCH_TYPES, RESEARCH_TYPE_LABEL } from "@/lib/vocabulary";

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
    <div className="px-4 pb-24 md:px-10">
      <div className="grid gap-6 border-t border-ink pt-6 md:grid-cols-12">
        <div className="md:col-span-7">
          <h2 className="text-title font-extrabold tracking-[-0.03em] uppercase">Research</h2>
          <p className="serif mt-3 max-w-xl text-xl leading-snug text-ink-2 italic">
            What the film is made of before it&rsquo;s made. Connect each piece to the part of the film it feeds.
          </p>
        </div>
        <div className="flex flex-col justify-end gap-4 md:col-span-5">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the archive…" aria-label="Search research" className="input" />
          <button onClick={add} className="link-action self-start">
            Add to the archive
          </button>
        </div>
      </div>

      <div className="mt-8 border-b border-rule pb-2">
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
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {tags.map((t) => (
            <button key={t} onClick={() => setTag(tag === t ? null : t)} aria-pressed={tag === t} className={cx(tag === t ? "text-red" : "text-mute hover:text-ink")}>
              #{t}
            </button>
          ))}
        </div>
      )}

      <ol className="mt-6 border-t border-ink">
        {visible.map((item, i) => (
          <ResearchRow key={item.id} item={item} index={i + 1} filmId={filmId} onOpen={() => setOpenId(item.id)} />
        ))}
      </ol>
      {visible.length === 0 && <p className="serif py-12 text-2xl text-mute italic">Nothing matches.</p>}

      <ResearchDrawer filmId={filmId} item={items.find((i) => i.id === openId)} onClose={() => setOpenId(null)} />
    </div>
  );
}

function ResearchRow({ item, index, filmId, onOpen }: { item: ResearchItem; index: number; filmId: string; onOpen: () => void }) {
  const { state } = useFilmRoom();
  const refs = resolveRefs(state, filmId, item.connections);
  return (
    <li className="border-b border-rule">
      <button onClick={onOpen} className="group grid w-full grid-cols-[2.5rem_1fr] gap-x-4 gap-y-2 py-5 text-left md:grid-cols-[3rem_7rem_1fr_16rem_5rem]">
        <span className="eyebrow pt-1 text-red tabular-nums">{pad(index)}</span>
        <span className="eyebrow pt-1 text-mute md:order-none">{RESEARCH_TYPE_LABEL[item.type]}</span>
        <span className="col-start-2 md:col-start-auto">
          <span className="block text-xl font-bold group-hover:text-red">{item.title}</span>
          {item.source && <span className="serif block text-mute italic">{item.source}</span>}
          <span className="mt-2 line-clamp-2 block max-w-2xl text-ink-2">{item.description}</span>
        </span>
        <span className="col-start-2 text-xs text-mute md:col-start-auto">
          {refs.map((r) => (
            <span key={`${r.ref.type}:${r.ref.id}`} className="mr-2 inline-block">
              → {r.label}
            </span>
          ))}
          {item.tags.length > 0 && <span className="mt-1 block">{item.tags.map((t) => `#${t}`).join(" ")}</span>}
        </span>
        {item.image ? (
          <span className="col-start-2 block h-16 w-20 overflow-hidden md:col-start-auto">
            <Still image={item.image} alt="" />
          </span>
        ) : (
          <span className="hidden md:block" />
        )}
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
      <div className="space-y-7">
        <Field label="Title">
          <EditableText label="Title" value={item.title} onSave={(title) => title && update({ title })} className="text-2xl font-bold" />
        </Field>
        <div className="grid grid-cols-2 gap-6">
          <Field label="Type">
            <Select label="Type" value={item.type} onChange={(type) => update({ type })} options={RESEARCH_TYPES.map((t) => ({ value: t, label: RESEARCH_TYPE_LABEL[t] }))} />
          </Field>
          <Field label="Source">
            <EditableText label="Source" value={item.source} onSave={(source) => update({ source })} placeholder="Author, year, where it lives" />
          </Field>
        </div>
        <Field label="Why it matters">
          <EditableText label="Description" value={item.description} onSave={(description) => update({ description })} multiline placeholder="What it gives the film." className="serif text-xl leading-snug italic" />
        </Field>
        <Field label="Tags">
          <TagInput tags={item.tags} onChange={(tags) => update({ tags })} />
        </Field>
        <Connections
          filmId={filmId}
          value={item.connections}
          onChange={(connections) => update({ connections })}
          types={["story", "scene", "character", "theme", "question"]}
        />
        <div>
          {item.image && (
            <div className="mb-3 aspect-[16/10] overflow-hidden">
              <Still image={item.image} alt={item.title} />
            </div>
          )}
          <button onClick={() => setShowImage((s) => !s)} className="link-action">
            {item.image ? "Change image" : "Attach an image"}
          </button>
          {item.image && (
            <button onClick={() => update({ image: undefined })} className="link-action ml-5 text-mute">
              Remove image
            </button>
          )}
          {showImage && (
            <div className="mt-4">
              <ImagePicker value={item.image} onChange={(image) => update({ image })} />
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
