"use client";

import { useMemo } from "react";
import { contextInventory, getFilmContext } from "@/lib/ai";
import { useFilmRoom } from "@/lib/store";
import { pad } from "@/lib/utils";
import { ProducerConversation } from "./ProducerConversation";

export function ThinkWithTheFilm({ filmId }: { filmId: string }) {
  const { state } = useFilmRoom();
  const context = useMemo(() => getFilmContext(state, filmId), [state, filmId]);
  if (!context) return null;
  const inventory = contextInventory(context);

  return (
    <div className="grid gap-x-12 gap-y-10 px-4 pb-24 md:grid-cols-12 md:px-10">
      <aside className="order-2 md:order-1 md:col-span-4">
        <div className="border-t border-ink pt-4 md:sticky md:top-20">
          <p className="eyebrow text-red">Film development producer</p>
          <p className="serif mt-3 text-xl leading-snug text-ink-2 italic">
            Reads the whole film before every answer. Doesn&rsquo;t decide for you — shows you what it sees.
          </p>

          <p className="eyebrow mt-10 text-mute">What it has read</p>
          <ul className="mt-2 divide-y divide-rule border-y border-rule">
            {inventory.map((i) => (
              <li key={i.label} className="flex items-baseline justify-between py-2 text-sm">
                <span>{i.label}</span>
                <span className="font-semibold tabular-nums">{pad(i.count)}</span>
              </li>
            ))}
          </ul>

          {context.film.currentQuestions[0] && (
            <>
              <p className="eyebrow mt-10 text-mute">The film is asking</p>
              <p className="mt-2 text-2xl leading-[1.05] font-extrabold uppercase">{context.film.currentQuestions[0]}</p>
            </>
          )}
        </div>
      </aside>

      <section className="order-1 md:order-2 md:col-span-8">
        <div className="border-t border-ink pt-4">
          <h2 className="text-title mb-10 font-extrabold tracking-[-0.03em] uppercase">Think with the film</h2>
          <ProducerConversation filmId={filmId} />
        </div>
      </section>
    </div>
  );
}
