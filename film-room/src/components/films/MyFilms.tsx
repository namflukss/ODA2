"use client";

import { Clapperboard, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge, ConfirmButton, Field, Select } from "@/components/ui/forms";
import { Still } from "@/components/ui/Still";
import { useFilmRoom } from "@/lib/store";
import type { Film, FilmFormat } from "@/lib/types";
import { cx, formatRelative } from "@/lib/utils";
import { FILM_FORMATS } from "@/lib/vocabulary";

export function MyFilms() {
  const { state, actions } = useFilmRoom();
  const [creating, setCreating] = useState(false);
  const films = [...state.films].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <main className="mx-auto min-h-dvh max-w-[1280px] px-4 pb-24 md:px-10">
      <header className="flex items-center justify-between py-5">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-white">
            <Clapperboard size={15} />
          </span>
          Film Room
        </span>
        <button onClick={() => setCreating(true)} className="btn btn-primary">
          <Plus size={15} /> New film
        </button>
      </header>

      <section className="pt-8 pb-8 md:pt-14 md:pb-10">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">My films</h1>
        <p className="mt-2 text-lg text-ink-2">The films you&rsquo;re making, developing and thinking about.</p>
      </section>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {films.map((film, i) => (
          <FilmTile key={film.id} film={film} hero={i === 0} />
        ))}
        <li>
          <button
            onClick={() => setCreating(true)}
            className="grid h-full min-h-56 w-full place-items-center rounded-2xl border-2 border-dashed border-line-strong text-ink-2 transition-colors hover:border-ink hover:text-ink"
          >
            <span className="flex flex-col items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-surface shadow-[var(--shadow-card)]">
                <Plus size={18} />
              </span>
              <span className="font-medium">Begin a new film</span>
              <span className="text-sm text-mute">Every film starts as a sentence.</span>
            </span>
          </button>
        </li>
      </ul>

      <footer className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4 text-xs text-mute">
        <span>Everything is saved in this browser until Film Room is connected to a server.</span>
        <ConfirmButton onConfirm={actions.resetToSample}>Restore sample film</ConfirmButton>
      </footer>

      <NewFilmDrawer open={creating} onClose={() => setCreating(false)} />
    </main>
  );
}

function FilmTile({ film, hero }: { film: Film; hero: boolean }) {
  const { state } = useFilmRoom();
  // A small collage from the film's visual world gives each tile its own mood.
  const strip = state.visuals.filter((v) => v.filmId === film.id).slice(0, 3);
  return (
    <li className={cx(hero && "sm:col-span-2")}>
      <Link
        href={`/films/${film.id}`}
        aria-label={`Open ${film.title}`}
        className="group card block overflow-hidden transition-shadow hover:shadow-[var(--shadow-lift)]"
      >
        <div className={cx("relative flex gap-1 p-1", hero ? "h-64 md:h-80" : "h-52")}>
          <div className="relative flex-1 overflow-hidden rounded-xl">
            <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]">
              <Still image={film.cover} alt="" />
            </div>
          </div>
          {hero && strip.length > 0 && (
            <div className="hidden w-1/3 flex-col gap-1 md:flex">
              {strip.map((v) => (
                <div key={v.id} className="flex-1 overflow-hidden rounded-xl">
                  <Still image={v.image} alt="" />
                </div>
              ))}
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <Badge tone="dark">{film.status}</Badge>
            <span className="inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 text-[0.7rem] font-medium">{film.currentVersion}</span>
          </div>
        </div>
        <div className="px-5 pt-3 pb-5">
          <h2 className={cx("font-semibold tracking-tight group-hover:text-accent", hero ? "text-2xl" : "text-lg")}>{film.title}</h2>
          <p className="mt-0.5 text-sm text-mute">
            {film.format} · {film.duration} · Last worked on {lastWorked(film.updatedAt)}
          </p>
          {film.logline && (
            <p className={cx("serif mt-3 leading-snug text-ink-2 italic", hero ? "line-clamp-2 text-xl" : "line-clamp-3 text-lg")}>{film.logline}</p>
          )}
        </div>
      </Link>
    </li>
  );
}

/** "today", "3 days ago", "September 14" — month names keep their capital. */
function lastWorked(date: string): string {
  const rel = formatRelative(date);
  return /^[A-Z][a-z]+ \d/.test(rel) ? rel : rel.toLowerCase();
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
      <form onSubmit={submit} className="space-y-5">
        <Field label="Working title">
          <input data-autofocus required value={title} onChange={(e) => setTitle(e.target.value)} className="input text-lg font-medium" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Format">
            <Select label="Format" value={format} onChange={setFormat} options={FILM_FORMATS.map((f) => ({ value: f, label: f }))} />
          </Field>
          <Field label="Duration">
            <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 24 min" className="input" />
          </Field>
        </div>
        <Field label="The film in one sentence" hint="It will change. That's the point.">
          <textarea value={logline} onChange={(e) => setLogline(e.target.value)} rows={4} className="input serif text-lg italic" />
        </Field>
        <button type="submit" className="btn btn-primary w-full justify-center py-3">
          Open the room
        </button>
      </form>
    </Drawer>
  );
}
