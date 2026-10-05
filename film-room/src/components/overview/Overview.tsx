"use client";

import {
  ArrowRight,
  BookOpen,
  CircleHelp,
  Compass,
  GitCommitVertical,
  Images,
  Pencil,
  Plus,
  Scale,
  Tags,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { EditableText } from "@/components/ui/EditableText";
import { Badge, Card, ConfirmButton, Field, ImagePicker, ListEditor, Select, TONE, type Tone } from "@/components/ui/forms";
import { Still } from "@/components/ui/Still";
import { useActions, useCollection, useFilm } from "@/lib/store";
import type { Film } from "@/lib/types";
import { cx, formatDay, versionLabel } from "@/lib/utils";
import { FILM_FORMATS, FILM_STATUSES } from "@/lib/vocabulary";

const THEME_TONES: Tone[] = ["accent", "ochre", "sage", "sky", "plum", "neutral"];

export function Overview({ filmId }: { filmId: string }) {
  const { film } = useFilm(filmId);
  const actions = useActions();
  const versions = useCollection("versions", filmId);
  const memories = useCollection("memories", filmId);
  const visuals = useCollection("visuals", filmId);
  const people = useCollection("people", filmId);
  const [editing, setEditing] = useState(false);
  if (!film) return null;

  const update = (patch: Partial<Film>) => actions.updateFilm(film.id, patch);
  const current = [...versions].sort((a, b) => b.versionNumber - a.versionNumber)[0];
  const lastDecision = [...memories].filter((m) => m.type === "decision").sort((a, b) => b.date.localeCompare(a.date))[0];
  const base = `/films/${film.id}`;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl">
        <div className="h-64 md:h-80">
          <Still image={film.cover} alt={`${film.title} — cover`} />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(20,18,16,0.78),rgba(20,18,16,0.05)_65%)]" />
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-6 md:p-8">
          <div className="max-w-3xl text-white">
            <div className="mb-3 flex flex-wrap gap-1.5">
              <Badge tone="accent">{film.status}</Badge>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[0.7rem] font-medium backdrop-blur">
                {film.format} · {film.duration} · {film.currentVersion}
              </span>
            </div>
            <h1 className="text-3xl leading-tight font-semibold tracking-tight md:text-[2.75rem]">{film.title}</h1>
          </div>
          <button onClick={() => setEditing(true)} className="btn bg-white/90 text-ink backdrop-blur hover:bg-white">
            <Pencil size={14} /> Edit details
          </button>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-12">
        {/* The story */}
        <Card title="The story" icon={<BookOpen size={15} />} className="md:col-span-8">
          <EditableText
            label="Logline"
            value={film.logline}
            onSave={(logline) => update({ logline })}
            multiline
            placeholder="The film in one sentence."
            className="serif text-[1.6rem] leading-[1.2] italic md:text-[1.85rem]"
          />
          <EditableText
            label="Story"
            value={film.description}
            onSave={(description) => update({ description })}
            multiline
            placeholder="What happens — as you understand it today."
            className="mt-3 leading-relaxed text-ink-2"
          />
        </Card>

        {/* Current version + last decision */}
        <div className="flex flex-col gap-5 md:col-span-4">
          <Card
            title="Current version"
            icon={<GitCommitVertical size={15} />}
            action={
              <Link href={`${base}/memory#versions`} className="text-xs text-mute hover:text-ink">
                History →
              </Link>
            }
          >
            {current ? (
              <Link href={`${base}/memory?version=${current.id}#versions`} className="group block">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-semibold tracking-tight group-hover:text-accent">{versionLabel(current.versionNumber)}</span>
                  <span className="text-sm text-mute">
                    {current.type} · {formatDay(current.date)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{current.summary}</p>
              </Link>
            ) : (
              <p className="text-mute">No versions yet.</p>
            )}
            <div className="mt-3">
              <Select label="Stage" value={film.status} onChange={(status) => update({ status })} options={FILM_STATUSES.map((s) => ({ value: s, label: s }))} className="py-1.5 text-sm" />
            </div>
          </Card>

          <Card
            title="Last decision"
            icon={<Scale size={15} />}
            className="flex-1"
            action={
              <Link href={`${base}/memory`} className="text-xs text-mute hover:text-ink">
                Memory →
              </Link>
            }
          >
            {lastDecision ? (
              <>
                <p className="text-xs font-medium text-accent">{formatDay(lastDecision.date)}</p>
                <p className="mt-1 leading-snug font-medium">{lastDecision.description}</p>
                <p className="serif mt-2 text-lg leading-snug text-ink-2 italic">{lastDecision.reason}</p>
              </>
            ) : (
              <p className="text-mute">Nothing decided yet. That&rsquo;s allowed.</p>
            )}
          </Card>
        </div>

        {/* Current questions — the film's own question gets the loudest card */}
        <section className="rounded-2xl bg-accent p-6 text-white md:col-span-5">
          <h2 className="flex items-center gap-2 text-[0.8rem] font-medium text-white/75">
            <CircleHelp size={15} /> Current question
          </h2>
          <div className="mt-3 [&_svg]:text-white/70 [&_.field:focus]:bg-white/10 [&_.field:hover]:bg-white/10 [&_input]:placeholder:text-white/60">
            <ListEditor
              label="Current question"
              items={film.currentQuestions}
              onChange={(currentQuestions) => update({ currentQuestions })}
              placeholder="Add the question the film is asking now…"
              marker="none"
              itemClassName="text-2xl leading-tight font-semibold tracking-tight md:text-[1.75rem]"
            />
          </div>
        </section>

        <Card title="What we're trying to understand" icon={<Compass size={15} />} className="md:col-span-7">
          <EditableText
            label="What we're trying to understand"
            value={film.understanding}
            onSave={(understanding) => update({ understanding })}
            multiline
            placeholder="The inquiry underneath the story."
            className="serif text-[1.45rem] leading-snug"
          />
        </Card>

        {/* Visual world strip */}
        <Card
          title="Visual world"
          icon={<Images size={15} />}
          className="md:col-span-8"
          action={
            <Link href={`${base}/visuals`} className="text-xs text-mute hover:text-ink">
              Open board →
            </Link>
          }
        >
          {visuals.length ? (
            <Link href={`${base}/visuals`} className="grid grid-cols-4 gap-2">
              {visuals.slice(0, 5).map((v, i) => (
                <div key={v.id} className={cx("overflow-hidden rounded-xl", i === 0 ? "col-span-2 row-span-2" : "aspect-square")}>
                  <Still image={v.image} alt={v.title} />
                </div>
              ))}
            </Link>
          ) : (
            <Link href={`${base}/visuals`} className="btn btn-ghost">
              <Plus size={14} /> Start the board
            </Link>
          )}
        </Card>

        {/* People */}
        <Card
          title="People"
          icon={<Users size={15} />}
          className="md:col-span-4"
          action={
            <Link href={`${base}/people`} className="text-xs text-mute hover:text-ink">
              All →
            </Link>
          }
        >
          <ul className="space-y-1">
            {people.map((p) => (
              <li key={p.id}>
                <Link href={`${base}/people?person=${p.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-hover">
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                    <Still image={p.portrait} alt="" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{p.name}</span>
                    <span className="block truncate text-xs text-mute">{p.role}</span>
                  </span>
                </Link>
              </li>
            ))}
            {people.length === 0 && <li className="text-sm text-mute">Nobody yet.</li>}
          </ul>
        </Card>

        {/* Themes */}
        <Card title="Themes" icon={<Tags size={15} />} className="md:col-span-5">
          <Themes film={film} />
        </Card>

        {/* Open questions */}
        <Card title="Open questions" icon={<CircleHelp size={15} />} className="md:col-span-7">
          <ListEditor
            label="Open question"
            items={film.openQuestions}
            onChange={(openQuestions) => update({ openQuestions })}
            placeholder="Something you don't know yet…"
            itemClassName="serif text-lg leading-snug italic"
          />
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={`${base}/room`} className="group card flex items-center justify-between p-5 hover:shadow-[var(--shadow-lift)]">
          <span>
            <span className="block text-sm text-mute">Continue in</span>
            <span className="text-lg font-semibold">The room</span>
          </span>
          <ArrowRight size={18} className="text-mute transition-transform group-hover:translate-x-1 group-hover:text-accent" />
        </Link>
        <Link href={`${base}/story`} className="group card flex items-center justify-between p-5 hover:shadow-[var(--shadow-lift)]">
          <span>
            <span className="block text-sm text-mute">Look at</span>
            <span className="text-lg font-semibold">The story map</span>
          </span>
          <ArrowRight size={18} className="text-mute transition-transform group-hover:translate-x-1 group-hover:text-accent" />
        </Link>
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
    <div>
      <ul className="flex flex-wrap gap-2">
        {film.themes.map((t, i) => (
          <li key={t} className={cx("group flex items-center gap-1 rounded-full py-1.5 pr-2 pl-3.5 font-medium", TONE[THEME_TONES[i % THEME_TONES.length]])}>
            {t}
            <button
              onClick={() => actions.removeTheme(film.id, t)}
              className="rounded-full p-0.5 opacity-40 group-hover:opacity-100 hover:bg-black/5 focus:opacity-100"
              aria-label={`Remove theme ${t}`}
            >
              <X size={13} />
            </button>
          </li>
        ))}
        <li>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            onBlur={add}
            placeholder="+ Add theme"
            aria-label="Add theme"
            className="w-32 rounded-full border border-dashed border-line-strong bg-transparent px-3.5 py-1.5 text-sm outline-none placeholder:text-mute focus:border-ink"
          />
        </li>
      </ul>
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
      <div className="space-y-5">
        <Field label="Title">
          <EditableText label="Title" value={film.title} onSave={(title) => title && update({ title })} className="text-lg font-semibold" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
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
