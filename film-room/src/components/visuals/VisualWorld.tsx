"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { EditableText } from "@/components/ui/EditableText";
import { ConfirmButton, Field, FilterTabs, ImagePicker, Select } from "@/components/ui/forms";
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
    <div className="px-4 pb-24 md:px-10">
      <div className="grid gap-6 border-t border-ink pt-6 md:grid-cols-12">
        <h2 className="text-title font-extrabold tracking-[-0.03em] uppercase md:col-span-7">Visual world</h2>
        <p className="serif text-xl leading-snug text-ink-2 italic md:col-span-5 md:self-end">
          How the film looks, feels and remembers. Write down why each image is here.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-2">
        <FilterTabs
          label="Visual categories"
          value={category}
          onChange={setCategory}
          options={[
            { value: "all", label: "Everything", count: refs.length },
            ...VISUAL_CATEGORIES.map((c) => ({ value: c, label: VISUAL_CATEGORY_LABEL[c], count: refs.filter((r) => r.category === c).length })),
          ]}
        />
        <button onClick={add} className="link-action">
          Add a reference
        </button>
      </div>

      <div className="mt-8 columns-2 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 md:gap-6">
        {visible.map((r, i) => (
          <figure key={r.id} className="mb-6 break-inside-avoid md:mb-10">
            <button onClick={() => setOpenId(r.id)} className="group block w-full text-left" aria-label={`Open ${r.title}`}>
              <div className={cx("overflow-hidden", ASPECT[r.aspect])}>
                <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                  <Still image={r.image} alt={r.title} />
                </div>
              </div>
              <figcaption className="mt-2.5">
                <span className="eyebrow flex justify-between text-mute">
                  <span className={r.category === "color" ? "text-red" : undefined}>{VISUAL_CATEGORY_LABEL[r.category]}</span>
                  <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                </span>
                <span className="mt-1 block font-bold uppercase leading-tight group-hover:text-red">{r.title}</span>
                {r.annotation && <span className="serif mt-1 block text-[1.05rem] leading-snug text-ink-2 italic">{r.annotation}</span>}
              </figcaption>
            </button>
          </figure>
        ))}
      </div>
      {visible.length === 0 && <p className="serif py-12 text-2xl text-mute italic">No references here yet.</p>}

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
      <div className="space-y-7">
        <div className={cx("mx-auto max-w-sm overflow-hidden", ASPECT[item.aspect])}>
          <Still image={item.image} alt={item.title} />
        </div>
        <Field label="Image">
          <ImagePicker value={item.image} onChange={(image) => update({ image })} />
        </Field>
        <Field label="Title">
          <EditableText label="Title" value={item.title} onSave={(title) => title && update({ title })} className="text-2xl font-bold uppercase" />
        </Field>
        <Field label="Annotation" hint="Why this image is in the film.">
          <EditableText label="Annotation" value={item.annotation} onSave={(annotation) => update({ annotation })} multiline placeholder="What it gives the film…" className="serif text-xl leading-snug italic" />
        </Field>
        <div className="grid grid-cols-2 gap-6">
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
