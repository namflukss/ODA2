"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Still } from "@/components/ui/Still";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Select, ConfirmButton } from "@/components/ui/forms";
import { useFilmRoom } from "@/lib/store";
import type { Film, FilmFormat } from "@/lib/types";
import { cx, formatRelative, pad } from "@/lib/utils";
import { FILM_FORMATS } from "@/lib/vocabulary";

export function MyFilms() {
  const { state, actions } = useFilmRoom();
  const [creating, setCreating] = useState(false);
  const films = [...state.films].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <main className="mx-auto min-h-dvh max-w-[1400px] px-4 pb-24 md:px-10">
      <header className="flex items-center justify-between border-b border-ink py-4">
        <span className="eyebrow">Film Room</span>
        <button onClick={() => setCreating(true)} className="link-action">
          Begin a new film
        </button>
      </header>

      <section className="grid gap-6 pt-12 pb-14 md:grid-cols-12 md:pt-24 md:pb-24">
        <h1 className="text-display font-extrabold tracking-[-0.04em] uppercase md:col-span-8">My films</h1>
        <p className="serif self-end text-2xl leading-snug text-ink-2 italic md:col-span-4 md:text-3xl">
          The films you&rsquo;re making, developing and thinking about.
        </p>
      </section>

      <ol>
        {films.map((film, i) => (
          <FilmEntry key={film.id} film={film} index={i + 1} />
        ))}
      </ol>

      {films.length === 0 && (
        <p className="serif border-t border-ink py-16 text-3xl text-ink-2 italic">
          No films yet. Every film starts as a sentence.
        </p>
      )}

      <footer className="mt-24 flex flex-wrap items-baseline justify-between gap-4 border-t border-rule pt-4 text-xs text-mute">
        <span>Everything stays on this device until Film Room is connected to a server.</span>
        <ConfirmButton onConfirm={actions.resetToSample}>Restore sample film</ConfirmButton>
      </footer>

      <NewFilmDrawer open={creating} onClose={() => setCreating(false)} />
    </main>
  );
}

function FilmEntry({ film, index }: { film: Film; index: number }) {
  const flip = index % 2 === 0;
  return (
    <li className="group border-t border-ink">
      <Link
        href={`/films/${film.id}`}
        className="grid gap-5 py-6 md:grid-cols-12 md:gap-8 md:py-10"
        aria-label={`Open ${film.title}`}
      >
        <div className={cx("relative overflow-hidden md:col-span-5", flip && "md:order-2 md:col-start-8")}>
          <div className="aspect-[16/10] transition-transform duration-700 ease-out group-hover:scale-[1.02]">
            <Still image={film.cover} alt="" />
          </div>
        </div>
        <div className={cx("flex flex-col md:col-span-7", flip && "md:order-1")}>
          <span className="eyebrow text-red tabular-nums">{pad(index)}</span>
          <h2 className="text-title mt-3 font-extrabold tracking-[-0.03em] uppercase transition-colors group-hover:text-red">
            {film.title}
          </h2>
          <p className="serif mt-4 max-w-xl text-lg leading-snug text-ink-2 italic md:text-xl">{film.logline}</p>
          <dl className="mt-auto grid grid-cols-2 gap-x-6 gap-y-1 pt-6 text-sm sm:grid-cols-3">
            <div>
              <dt className="sr-only">Format</dt>
              <dd>
                {film.format} · {film.duration}
              </dd>
            </div>
            <div>
              <dt className="sr-only">Stage</dt>
              <dd>
                {film.status} · {film.currentVersion}
              </dd>
            </div>
            <div className="col-span-2 text-mute sm:col-span-1">
              <dt className="inline">Last worked on: </dt>
              <dd className="inline text-ink">{formatRelative(film.updatedAt)}</dd>
            </div>
          </dl>
        </div>
      </Link>
    </li>
  );
}

function NewFilmDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { actions } = useFilmRoom();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState<FilmFormat>("Documentary");
  const [duration, setDuration] = useState("");
  const [logline, setLogline] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const film = actions.createFilm({
      title: title.trim(),
      format,
      duration: duration.trim() || "—",
      logline: logline.trim(),
    });
    actions.create("versions", {
      filmId: film.id,
      versionNumber: 1,
      title: "First idea",
      type: "First idea",
      date: film.createdAt,
      summary: logline.trim() || "The first sentence of the film.",
      changes: [],
      removed: [],
      emerged: [],
    });
    actions.create("memories", {
      filmId: film.id,
      date: film.createdAt,
      type: "milestone",
      title: "The first idea",
      description: logline.trim() || title.trim(),
      reason: "This is where the film started.",
    });
    onClose();
    router.push(`/films/${film.id}`);
  };

  return (
    <Drawer open={open} onClose={onClose} title="A new film" eyebrow="Begin">
      <form onSubmit={submit} className="space-y-7">
        <Field label="Working title">
          <input data-autofocus required value={title} onChange={(e) => setTitle(e.target.value)} className="input text-2xl font-bold uppercase" />
        </Field>
        <div className="grid grid-cols-2 gap-6">
          <Field label="Format">
            <Select label="Format" value={format} onChange={setFormat} options={FILM_FORMATS.map((f) => ({ value: f, label: f }))} />
          </Field>
          <Field label="Duration">
            <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 24 min" className="input" />
          </Field>
        </div>
        <Field label="The film in one sentence" hint="It will change. That's the point.">
          <textarea value={logline} onChange={(e) => setLogline(e.target.value)} rows={4} className="input serif text-xl italic" />
        </Field>
        <button type="submit" className="w-full bg-ink py-3.5 text-paper eyebrow hover:bg-red">
          Open the room
        </button>
      </form>
    </Drawer>
  );
}
