"use client";

import { Sparkles } from "lucide-react";
import { useMemo } from "react";
import { Card, PageHeader } from "@/components/ui/forms";
import { contextInventory, getFilmContext } from "@/lib/ai";
import { useFilmRoom } from "@/lib/store";
import { ProducerConversation } from "./ProducerConversation";

export function ThinkWithTheFilm({ filmId }: { filmId: string }) {
  const { state } = useFilmRoom();
  const context = useMemo(() => getFilmContext(state, filmId), [state, filmId]);
  if (!context) return null;
  const inventory = contextInventory(context);

  return (
    <div className="space-y-6">
      <PageHeader title="Think with the film" subtitle="Your development producer. It reads the whole film before every answer — and shows you what it sees instead of deciding for you." />

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <section className="lg:col-span-8">
          <ProducerConversation filmId={filmId} />
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:col-span-4">
          {context.film.currentQuestions[0] && (
            <section className="rounded-2xl bg-accent p-5 text-white">
              <p className="text-xs font-medium text-white/70">The film is asking</p>
              <p className="mt-2 text-xl leading-tight font-semibold">{context.film.currentQuestions[0]}</p>
            </section>
          )}
          <Card title="What the producer has read" icon={<Sparkles size={14} />}>
            <ul className="grid grid-cols-2 gap-2">
              {inventory.map((i) => (
                <li key={i.label} className="rounded-xl bg-canvas px-3 py-2.5">
                  <span className="block text-xl font-semibold tabular-nums">{i.count}</span>
                  <span className="block text-xs text-mute">{i.label}</span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
