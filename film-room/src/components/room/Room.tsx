"use client";

import { CircleHelp, LayoutGrid, List, Network, SendHorizontal, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Connections } from "@/components/ui/Connections";
import { Drawer } from "@/components/ui/Drawer";
import { Badge, ConfirmButton, FilterTabs, PageHeader } from "@/components/ui/forms";
import { useNoteSuggestions } from "@/lib/ai/useProducer";
import type { NoteSuggestions } from "@/lib/ai";
import { nudge, startDrag } from "@/lib/drag";
import { resolveRefs } from "@/lib/refs";
import { useActions, useCollection, useFilmRoom } from "@/lib/store";
import type { Note, NoteCategory, Point } from "@/lib/types";
import { cx, formatRelative, now } from "@/lib/utils";
import { NOTE_CATEGORIES, NOTE_CATEGORY_LABEL } from "@/lib/vocabulary";
import { NOTE_BG, NOTE_TONE } from "./noteStyle";
import { Suggestions } from "./Suggestions";
import { useNoteActions } from "./useNoteActions";

const NOTE_W = 250;

/** First grid slot on the wall that doesn't overlap an existing note. */
function freeSpot(notes: Note[]): Point {
  const overlaps = (x: number, y: number) =>
    notes.some((n) => Math.abs(n.position.x - x) < NOTE_W + 12 && Math.abs(n.position.y - y) < 170);
  for (let row = 0; row < 40; row++)
    for (let col = 0; col < 4; col++) {
      const p = { x: 24 + col * 280, y: 24 + row * 190 };
      if (!overlaps(p.x, p.y)) return p;
    }
  return { x: 24, y: 24 };
}

export function Room({ filmId }: { filmId: string }) {
  const notes = useCollection("notes", filmId);
  const actions = useActions();
  const suggest = useNoteSuggestions(filmId);
  const [draft, setDraft] = useState("");
  const [category, setCategory] = useState<NoteCategory>("thought");
  const [fresh, setFresh] = useState<{ id: string; suggestions: NoteSuggestions | null } | null>(null);
  const [mode, setMode] = useState<"wall" | "list">("wall");
  const [filter, setFilter] = useState<NoteCategory | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const freshNote = notes.find((n) => n.id === fresh?.id);
  const openNote = notes.find((n) => n.id === openId);
  const visible = useMemo(() => notes.filter((n) => filter === "all" || n.category === filter), [notes, filter]);

  const write = async () => {
    const content = draft.trim();
    if (!content) return;
    const stamp = now();
    const position = freeSpot(notes);
    const note = actions.create("notes", { filmId, content, category, position, connections: [], createdAt: stamp, updatedAt: stamp });
    setDraft("");
    setFresh({ id: note.id, suggestions: null });
    const suggestions = await suggest(content);
    setFresh((f) => (f?.id === note.id ? { id: note.id, suggestions } : f));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="The room" subtitle="Think out loud. Anything can go here — the room shows you where it might belong." />

      <div className="grid items-start gap-5 lg:grid-cols-12">
        {/* Composer */}
        <section className="card overflow-hidden lg:col-span-7">
          <label htmlFor="room-input" className="sr-only">
            What&rsquo;s on your mind about the film?
          </label>
          <textarea
            id="room-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void write();
              }
            }}
            rows={4}
            placeholder="What's on your mind about the film?"
            className="serif block w-full bg-transparent px-6 pt-5 text-[1.65rem] leading-snug italic outline-none placeholder:text-mute/70"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas/50 px-4 py-3">
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Kind of note">
              {NOTE_CATEGORIES.map((c) => (
                <button key={c} role="radio" aria-checked={category === c} onClick={() => setCategory(c)} className="pill py-1 text-xs">
                  {NOTE_CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
            <button onClick={() => void write()} disabled={!draft.trim()} className="btn btn-accent">
              Leave it here <SendHorizontal size={14} />
            </button>
          </div>
        </section>

        <div className="lg:col-span-5" aria-live="polite">
          {fresh && freshNote ? (
            <Suggestions filmId={filmId} note={freshNote} suggestions={fresh.suggestions} onDone={() => setFresh(null)} />
          ) : (
            <div className="rounded-2xl border border-dashed border-line-strong p-6 text-ink-2">
              <p className="font-medium text-ink">Write anything.</p>
              <p className="mt-1 text-sm leading-relaxed">
                A doubt, an image, something someone said. After you leave a note, the room suggests the people, themes and scenes it touches — and what it could become.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* The notes */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterTabs
            label="Filter notes"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All notes", count: notes.length },
              ...NOTE_CATEGORIES.map((c) => ({ value: c, label: NOTE_CATEGORY_LABEL[c], count: notes.filter((n) => n.category === c).length })),
            ]}
          />
          <div className="hidden rounded-full border border-line bg-surface p-0.5 md:flex">
            {([
              ["wall", LayoutGrid],
              ["list", List],
            ] as const).map(([m, Icon]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={cx("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize", mode === m ? "bg-ink text-white" : "text-ink-2 hover:text-ink")}
              >
                <Icon size={13} /> {m}
              </button>
            ))}
          </div>
        </div>

        <div className={cx(mode === "wall" ? "hidden md:block" : "hidden")}>
          <NoteWall filmId={filmId} notes={visible} onOpen={setOpenId} highlight={fresh?.id} />
        </div>
        <div className={cx(mode === "wall" && "md:hidden")}>
          <NoteList notes={visible} onOpen={setOpenId} filmId={filmId} />
        </div>
      </section>

      <NoteDrawer filmId={filmId} note={openNote} onClose={() => setOpenId(null)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function NoteWall({ filmId, notes, onOpen, highlight }: { filmId: string; notes: Note[]; onOpen: (id: string) => void; highlight?: string }) {
  const actions = useActions();
  const [live, setLive] = useState<Record<string, Point>>({});
  const wall = useRef<HTMLDivElement>(null);
  const height = Math.max(560, ...notes.map((n) => (live[n.id] ?? n.position).y + 240));

  const commit = (note: Note, p: Point) => {
    actions.update("notes", note.id, { position: p });
    setLive(({ [note.id]: _, ...rest }) => rest);
  };

  return (
    <div ref={wall} className="wall relative overflow-hidden rounded-3xl border border-line" style={{ height }} aria-label="Notes wall — drag to move, arrow keys to nudge">
      {notes.length === 0 && <p className="absolute inset-0 grid place-items-center text-mute">Nothing here yet.</p>}
      {notes.map((note) => {
        const p = live[note.id] ?? note.position;
        return (
          <div
            key={note.id}
            role="button"
            tabIndex={0}
            aria-label={`Note: ${note.content.slice(0, 80)}`}
            onPointerDown={(e) =>
              startDrag(e, note.position, {
                onMove: (np) => setLive((l) => ({ ...l, [note.id]: np })),
                onEnd: (np) => commit(note, np),
                onClick: () => onOpen(note.id),
                bounds: { minX: 0, minY: 0, maxX: (wall.current?.clientWidth ?? 1200) - NOTE_W, maxY: 4000 },
              })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") onOpen(note.id);
              const np = nudge(e, note.position);
              if (np) {
                e.preventDefault();
                actions.update("notes", note.id, { position: { x: Math.max(0, np.x), y: Math.max(0, np.y) } });
              }
            }}
            style={{ left: p.x, top: p.y, width: NOTE_W, touchAction: "none" }}
            className={cx(
              "absolute cursor-grab touch-none rounded-2xl border border-line p-4 shadow-[var(--shadow-card)] transition-shadow select-none hover:shadow-[var(--shadow-lift)] active:cursor-grabbing",
              NOTE_BG[note.category],
              live[note.id] && "z-10 rotate-[0.6deg] shadow-[var(--shadow-pop)]",
              highlight === note.id && "ring-2 ring-accent",
            )}
          >
            <NoteBody note={note} filmId={filmId} />
          </div>
        );
      })}
    </div>
  );
}

function NoteList({ notes, onOpen, filmId }: { notes: Note[]; onOpen: (id: string) => void; filmId: string }) {
  const sorted = [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!sorted.length) return <p className="py-12 text-center text-mute">Nothing here yet.</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((note) => (
        <li key={note.id}>
          <button onClick={() => onOpen(note.id)} className={cx("card block h-full w-full p-4 text-left hover:shadow-[var(--shadow-lift)]", NOTE_BG[note.category])}>
            <NoteBody note={note} filmId={filmId} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function NoteBody({ note, filmId }: { note: Note; filmId: string }) {
  const { state } = useFilmRoom();
  const refs = resolveRefs(state, filmId, note.connections);
  const voice = note.category === "question" || note.category === "feeling";
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <Badge tone={NOTE_TONE[note.category]}>{NOTE_CATEGORY_LABEL[note.category]}</Badge>
        <span className="text-[0.7rem] text-mute">{formatRelative(note.createdAt)}</span>
      </div>
      <p className={cx("mt-2.5 leading-snug", voice ? "serif text-[1.15rem] italic" : "text-[0.93rem]")}>{note.content}</p>
      {refs.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {refs.map((r) => (
            <span key={`${r.ref.type}:${r.ref.id}`} className="rounded-full bg-sunken px-2 py-0.5 text-[0.7rem] text-ink-2">
              {r.label}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function NoteDrawer({ filmId, note, onClose }: { filmId: string; note?: Note; onClose: () => void }) {
  const actions = useActions();
  const { addToStory, saveAsQuestion, addToCharacter } = useNoteActions(filmId);
  const people = useCollection("people", filmId);
  const [content, setContent] = useState(note?.content ?? "");
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    setContent(note?.content ?? "");
    setFlash(null);
  }, [note?.id, note?.content]);

  if (!note) return null;

  const save = () => content.trim() && content !== note.content && actions.update("notes", note.id, { content: content.trim(), updatedAt: now() });

  return (
    <Drawer
      open
      onClose={() => {
        save();
        onClose();
      }}
      title="Note"
      eyebrow={`${NOTE_CATEGORY_LABEL[note.category]} · ${formatRelative(note.createdAt)}`}
      footer={
        <ConfirmButton
          onConfirm={() => {
            actions.remove("notes", note.id);
            onClose();
          }}
        >
          Delete note
        </ConfirmButton>
      }
    >
      <div className="space-y-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={save}
          rows={5}
          aria-label="Note text"
          className="input serif text-xl leading-snug italic"
        />

        <div>
          <p className="label mb-2">Kind</p>
          <div className="flex flex-wrap gap-1.5">
            {NOTE_CATEGORIES.map((c) => (
              <button key={c} onClick={() => actions.update("notes", note.id, { category: c, updatedAt: now() })} aria-pressed={note.category === c} className="pill">
                {NOTE_CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>

        <Connections
          filmId={filmId}
          value={note.connections}
          onChange={(connections) => actions.update("notes", note.id, { connections, updatedAt: now() })}
          types={["character", "theme", "scene", "story", "question", "research", "visual"]}
        />

        <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)]">
          <p className="label">Take it somewhere</p>
          {flash ? (
            <p className="mt-2 text-sm font-medium text-accent">{flash}</p>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    addToStory(note, note.connections.filter((c) => c.type === "scene" || c.type === "story").map((c) => c.id));
                    setFlash("Pinned to the story map");
                  }}
                >
                  <Network size={14} /> Add to story
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    saveAsQuestion(note);
                    setFlash("Saved as an open question");
                  }}
                >
                  <CircleHelp size={14} /> Save as question
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm text-ink-2">
                  <User size={14} /> Add to
                </span>
                {people.map((p) => (
                  <button
                    key={p.id}
                    className="pill"
                    onClick={() => {
                      addToCharacter(note, p.id);
                      setFlash(`Added to ${p.name}`);
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
