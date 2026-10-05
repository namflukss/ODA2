"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { EditableText } from "@/components/ui/EditableText";
import { Plus } from "lucide-react";
import { ConfirmButton, Field, FilterTabs, ImagePicker, PageHeader, Select } from "@/components/ui/forms";
import { Still } from "@/components/ui/Still";
import { useActions, useCollection } from "@/lib/store";
import type { VisualCategory, VisualReference } from "@/lib/types";
import { cx } from "@/lib/utils";
import { VISUAL_CATEGORIES, VISUAL_CATEGORY_LABEL } from "@/lib/vocabulary";

const ASPECT: Record<VisualReference["aspect"], string> = {
  tall: "aspect-[3/4]",
  square: "aspect-square",
  wide: "aspect-[16/10]",
};

export function VisualWorld({ filmId }: { filmId: string }) {
  const refs = useCollection("visuals", filmId);
  const actions = useActions();
  const [category, setCategory] = useState<VisualCategory | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const visible = refs.filter((r) => category === "all" || r.category === category);

  const add = () => {
    const v = actions.create("visuals", {
      filmId,
      image: "still:paper",
      title: "Untitled reference",
      annotation: "",
      category: category === "all" ? "image" : category,
      aspect: "square",
    });
    setOpenId(v.id);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Visual world"
        subtitle="How the film looks, feels and remembers. Write down why each image is here."
        actions={
          <button onClick={add} className="btn btn-primary">
            <Plus size={15} /> Add reference
          </button>
        }
      />
      <FilterTabs
        label="Visual categories"
        value={category}
        onChange={setCategory}
        options={[
          { value: "all", label: "Everything", count: refs.length },
          ...VISUAL_CATEGORIES.map((c) => ({ value: c, label: VISUAL_CATEGORY_LABEL[c], count: refs.filter((r) => r.category === c).length })),
        ]}
      />

      <div className="columns-2 gap-3 md:gap-4 lg:columns-3 xl:columns-4">
        {visible.map((r) => (
          <figure key={r.id} className="mb-3 break-inside-avoid md:mb-4">
            <button onClick={() => setOpenId(r.id)} className="group relative block w-full overflow-hidden rounded-2xl text-left" aria-label={`Open ${r.title}`}>
              <div className={ASPECT[r.aspect]}>
                <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]">
                  <Still image={r.image} alt={r.title} />
                </div>
              </div>
              <span className="absolute top-2.5 left-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[0.7rem] font-medium backdrop-blur">{VISUAL_CATEGORY_LABEL[r.category]}</span>
              <figcaption className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,rgba(20,18,16,0.82),transparent)] p-3 pt-10 text-white opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                <span className="block text-sm leading-tight font-semibold">{r.title}</span>
                {r.annotation && <span className="mt-1 line-clamp-3 block text-xs leading-snug text-white/80">{r.annotation}</span>}
              </figcaption>
            </button>
          </figure>
        ))}
        <button onClick={add} className="mb-4 grid aspect-square w-full break-inside-avoid place-items-center rounded-2xl border-2 border-dashed border-line-strong text-mute hover:border-ink hover:text-ink">
          <span className="flex flex-col items-center gap-1.5 text-sm">
            <Plus size={18} /> Add reference
          </span>
        </button>
      </div>
      {visible.length === 0 && <p className="py-8 text-center text-mute">No references in this category yet.</p>}

      <VisualDrawer item={refs.find((r) => r.id === openId)} onClose={() => setOpenId(null)} />
    </div>
  );
}

function VisualDrawer({ item, onClose }: { item?: VisualReference; onClose: () => void }) {
  const actions = useActions();
  if (!item) return null;
  const update = (patch: Partial<VisualReference>) => actions.update("visuals", item.id, patch);
  return (
    <Drawer
      open
      onClose={onClose}
      title={item.title}
      eyebrow={VISUAL_CATEGORY_LABEL[item.category]}
      wide
      footer={
        <ConfirmButton
          onConfirm={() => {
            actions.remove("visuals", item.id);
            onClose();
          }}
        >
          Remove reference
        </ConfirmButton>
      }
    >
      <div className="space-y-5">
        <div className={cx("mx-auto max-w-sm overflow-hidden rounded-2xl", ASPECT[item.aspect])}>
          <Still image={item.image} alt={item.title} />
        </div>
        <Field label="Image">
          <ImagePicker value={item.image} onChange={(image) => update({ image })} />
        </Field>
        <Field label="Title">
          <EditableText label="Title" value={item.title} onSave={(title) => title && update({ title })} className="text-lg font-semibold" />
        </Field>
        <Field label="Annotation" hint="Why this image is in the film.">
          <EditableText label="Annotation" value={item.annotation} onSave={(annotation) => update({ annotation })} multiline placeholder="What it gives the film…" className="serif text-lg leading-snug" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <Select label="Category" value={item.category} onChange={(category) => update({ category })} options={VISUAL_CATEGORIES.map((c) => ({ value: c, label: VISUAL_CATEGORY_LABEL[c] }))} />
          </Field>
          <Field label="Shape">
            <Select
              label="Shape"
              value={item.aspect}
              onChange={(aspect) => update({ aspect })}
              options={[
                { value: "tall", label: "Tall" },
                { value: "square", label: "Square" },
                { value: "wide", label: "Wide" },
              ]}
            />
          </Field>
        </div>
      </div>
    </Drawer>
  );
}
