"use client";

import Link from "next/link";
import { useState } from "react";
import { Still } from "@/components/ui/Still";
import { EditableText } from "@/components/ui/EditableText";
import { Drawer } from "@/components/ui/Drawer";
import { ConfirmButton, Field, ImagePicker, ListEditor, SectionHeading, Select } from "@/components/ui/forms";
import { useActions, useCollection, useFilm } from "@/lib/store";
import type { Film } from "@/lib/types";
import { formatDay, versionLabel } from "@/lib/utils";
import { FILM_FORMATS, FILM_STATUSES } from "@/lib/vocabulary";
import { useRouter } from "next/navigation";

export function Overview({ filmId }: { filmId: string }) {
  const { film } = useFilm(filmId);
  const actions = useActions();
  const versions = useCollection("versions", filmId);
  const memories = useCollection("memories", filmId);
  const [editing, setEditing] = useState(false);
  if (!film) return null;

  const update = (patch: Partial<Film>) => actions.updateFilm(film.id, patch);
  const current = [...versions].sort((a, b) => b.versionNumber - a.versionNumber)[0];
  const lastDecision = [...memories].filter((m) => m.type === "decision").sort((a, b) => b.date.localeCompare(a.date))[0];
  const base = `/films/${film.id}`;

  return (
    <div className="px-4 pb-24 md:px-10">
      {/* Cover strip */}
      <div className="relative mt-2 h-40 overflow-hidden md:mt-0 md:h-72">
        <Still image={film.cover} alt={`${film.title} — cover`} />
        <button
          onClick={() => setEditing(true)}
          className="eyebrow absolute right-3 bottom-3 bg-paper/90 px-3 py-1.5 hover:text-red"
        >
          Edit film details
        </button>
      </div>

      <div className="mt-12 grid gap-x-10 gap-y-16 md:mt-16 md:grid-cols-12">
        {/* 01 — The story */}
        <section className="md:col-span-8">
          <SectionHeading index={1}>The story</SectionHeading>
          <EditableText
            label="Logline"
            value={film.logline}
            onSave={(logline) => update({ logline })}
            multiline
            placeholder="The film in one sentence."
            className="serif mt-6 text-[clamp(1.6rem,3vw,2.6rem)] leading-[1.12] italic"
          />
          <EditableText
            label="Story"
            value={film.description}
            onSave={(description) => update({ description })}
            multiline
            placeholder="What happens — as you understand it today."
            className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2"
          />
        </section>

        {/* 02 / 03 — Version & decision: an asymmetric side column */}
        <aside className="space-y-12 md:col-span-4 md:pt-1">
          <section>
            <SectionHeading index={2} action={<Link href={`${base}/memory#versions`} className="link-action text-mute">History</Link>}>
              Current version
            </SectionHeading>
            {current ? (
              <Link href={`${base}/memory?version=${current.id}#versions`} className="group mt-5 block">
                <p className="text-6xl font-extrabold tracking-tight group-hover:text-red">{versionLabel(current.versionNumber)}</p>
                <p className="eyebrow mt-2 text-mute">
                  {current.type} · {formatDay(current.date)}
                </p>
                <p className="mt-3 leading-relaxed text-ink-2">{current.summary}</p>
              </Link>
            ) : (
              <p className="mt-5 text-mute">No versions yet.</p>
            )}
            <div className="mt-4 max-w-48">
              <Select label="Stage" value={film.status} onChange={(status) => update({ status })} options={FILM_STATUSES.map((s) => ({ value: s, label: s }))} className="eyebrow" />
            </div>
          </section>

          <section>
            <SectionHeading index={3} action={<Link href={`${base}/memory`} className="link-action text-mute">Memory</Link>}>
              Last decision
            </SectionHeading>
            {lastDecision ? (
              <div className="mt-5">
                <p className="eyebrow text-red">{formatDay(lastDecision.date)}</p>
                <p className="mt-2 text-lg leading-snug font-medium">{lastDecision.description}</p>
                <p className="serif mt-3 text-lg leading-snug text-ink-2 italic">{lastDecision.reason}</p>
              </div>
            ) : (
              <p className="mt-5 text-mute">Nothing decided yet. That&rsquo;s allowed.</p>
            )}
          </section>
        </aside>

        {/* 04 — What we're trying to understand */}
        <section className="md:col-span-7 md:col-start-2">
          <SectionHeading index={4}>What we&rsquo;re trying to understand</SectionHeading>
          <EditableText
            label="What we're trying to understand"
            value={film.understanding}
            onSave={(understanding) => update({ understanding })}
            multiline
            placeholder="The inquiry underneath the story."
            className="serif mt-6 text-2xl leading-snug md:text-3xl"
          />
        </section>

        {/* 05 — Current questions */}
        <section className="md:col-span-12">
          <SectionHeading index={5}>Current questions</SectionHeading>
          <div className="mt-4">
            <ListEditor
              label="Current question"
              items={film.currentQuestions}
              onChange={(currentQuestions) => update({ currentQuestions })}
              placeholder="Add the question the film is asking now…"
              itemClassName="text-[clamp(1.5rem,3.6vw,3.25rem)] leading-[1.02] font-extrabold tracking-[-0.02em] uppercase"
            />
          </div>
        </section>

        {/* 06 — Themes */}
        <section className="md:col-span-6">
          <SectionHeading index={6}>Themes</SectionHeading>
          <Themes film={film} />
        </section>

        {/* 07 — Open questions */}
        <section className="md:col-span-6">
          <SectionHeading index={7}>Open questions</SectionHeading>
          <div className="mt-4">
            <ListEditor
              label="Open question"
              items={film.openQuestions}
              onChange={(openQuestions) => update({ openQuestions })}
              placeholder="Something you don't know yet…"
              itemClassName="serif text-xl leading-snug italic"
            />
          </div>
        </section>

        <section className="flex flex-wrap gap-x-10 gap-y-4 border-t border-ink pt-6 md:col-span-12">
          <Link href={`${base}/room`} className="group">
            <span className="eyebrow text-mute">Continue in</span>
            <span className="block text-3xl font-extrabold uppercase group-hover:text-red">The room →</span>
          </Link>
          <Link href={`${base}/story`} className="group">
            <span className="eyebrow text-mute">Look at</span>
            <span className="block text-3xl font-extrabold uppercase group-hover:text-red">The story wall →</span>
          </Link>
        </section>
      </div>

      <FilmDetailsDrawer film={film} open={editing} onClose={() => setEditing(false)} />
    </div>
  );
}

function Themes({ film }: { film: Film }) {
  const actions = useActions();
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (t && !film.themes.some((x) => x.toLowerCase() === t.toLowerCase()))
      actions.updateFilm(film.id, { themes: [...film.themes, t.charAt(0).toUpperCase() + t.slice(1)] });
    setDraft("");
  };
  return (
    <div className="mt-5">
      <ul className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        {film.themes.map((t, i) => (
          <li key={t} className="group flex items-baseline">
            <span className={i % 3 === 0 ? "serif text-4xl italic" : "text-3xl font-bold tracking-tight uppercase"}>{t}</span>
            <button
              onClick={() => actions.removeTheme(film.id, t)}
              className="ml-1 text-mute opacity-0 group-hover:opacity-100 hover:text-red focus:opacity-100"
              aria-label={`Remove theme ${t}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        onBlur={add}
        placeholder="Add a theme…"
        aria-label="Add theme"
        className="field mt-4 border-b border-rule text-mute focus:text-ink"
      />
    </div>
  );
}

function FilmDetailsDrawer({ film, open, onClose }: { film: Film; open: boolean; onClose: () => void }) {
  const actions = useActions();
  const router = useRouter();
  const update = (patch: Partial<Film>) => actions.updateFilm(film.id, patch);
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Film details"
      eyebrow={film.title}
      footer={
        <ConfirmButton
          onConfirm={() => {
            actions.deleteFilm(film.id);
            router.push("/films");
          }}
        >
          Delete this film
        </ConfirmButton>
      }
    >
      <div className="space-y-7">
        <Field label="Title">
          <EditableText label="Title" value={film.title} onSave={(title) => title && update({ title })} className="text-2xl font-bold uppercase" />
        </Field>
        <div className="grid grid-cols-2 gap-6">
          <Field label="Format">
            <Select label="Format" value={film.format} onChange={(format) => update({ format })} options={FILM_FORMATS.map((f) => ({ value: f, label: f }))} />
          </Field>
          <Field label="Duration">
            <EditableText label="Duration" value={film.duration} onSave={(duration) => update({ duration })} />
          </Field>
          <Field label="Stage">
            <Select label="Stage" value={film.status} onChange={(status) => update({ status })} options={FILM_STATUSES.map((s) => ({ value: s, label: s }))} />
          </Field>
          <Field label="Current version">
            <EditableText label="Current version" value={film.currentVersion} onSave={(currentVersion) => update({ currentVersion })} />
          </Field>
        </div>
        <Field label="Cover">
          <ImagePicker value={film.cover} onChange={(cover) => update({ cover })} />
        </Field>
      </div>
    </Drawer>
  );
}
