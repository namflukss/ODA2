"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Connections } from "@/components/ui/Connections";
import { ConfirmButton, FilterTabs } from "@/components/ui/forms";
import { useNoteSuggestions } from "@/lib/ai/useProducer";
import type { NoteSuggestions } from "@/lib/ai";
import { nudge, startDrag } from "@/lib/drag";
import { resolveRefs } from "@/lib/refs";
import { useActions, useCollection, useFilmRoom } from "@/lib/store";
import type { Note, NoteCategory, Point } from "@/lib/types";
import { cx, formatRelative, now } from "@/lib/utils";
import { NOTE_CATEGORIES, NOTE_CATEGORY_LABEL } from "@/lib/vocabulary";
import { Suggestions } from "./Suggestions";
import { useNoteActions } from "./useNoteActions";

const NOTE_W = 260;

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
  const visible = useMemo(
    () => notes.filter((n) => filter === "all" || n.category === filter),
    [notes, filter],
  );

  const write = async () => {
    const content = draft.trim();
    if (!content) return;
    const stamp = now();
    // New notes land in the top-left of the wall, nudged so they don't stack exactly.
    const position = { x: 40 + (notes.length % 5) * 24, y: 40 + (notes.length % 5) * 20 };
    const note = actions.create("notes", { filmId, content, category, position, connections: [], createdAt: stamp, updatedAt: stamp });
    setDraft("");
    setFresh({ id: note.id, suggestions: null });
    const suggestions = await suggest(content);
    setFresh((f) => (f?.id === note.id ? { id: note.id, suggestions } : f));
  };

  return (
    <div className="px-4 pb-24 md:px-10">
      {/* Writing */}
      <section className="grid gap-8 border-t border-ink pt-6 md:grid-cols-12 md:pt-10">
        <div className="md:col-span-7">
          <label htmlFor="room-input" className="eyebrow text-mute">
            The room
          </label>
          <textarea
            id="room-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
                e.preventDefault();
                void write();
              }
            }}
            rows={3}
            placeholder="What's on your mind about the film?"
            className="serif mt-3 w-full bg-transparent text-[clamp(1.75rem,3.4vw,3rem)] leading-[1.1] italic outline-none placeholder:text-ink/35"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-3">
            <div className="flex flex-wrap gap-x-4 gap-y-2" role="radiogroup" aria-label="Kind of note">
              {NOTE_CATEGORIES.map((c) => (
                <button
                  key={c}
                  role="radio"
                  aria-checked={category === c}
                  onClick={() => setCategory(c)}
                  className={cx("eyebrow", category === c ? "text-red" : "text-mute hover:text-ink")}
                >
                  {NOTE_CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
            <button onClick={() => void write()} disabled={!draft.trim()} className="eyebrow bg-ink px-4 py-2.5 text-paper hover:bg-red disabled:opacity-30">
              Leave it here ↵
            </button>
          </div>
        </div>
        <div className="md:col-span-5" aria-live="polite">
          {fresh && freshNote ? (
            <Suggestions filmId={filmId} note={freshNote} suggestions={fresh.suggestions} onDone={() => setFresh(null)} />
          ) : (
            <p className="serif text-xl leading-snug text-mute italic md:pt-8">
              Write anything — a doubt, an image, something someone said. The room will show you where it might belong. It doesn&rsquo;t have to belong anywhere.
            </p>
          )}
        </div>
      </section>

      {/* The notes */}
      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-2">
          <FilterTabs
            label="Filter notes"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "Everything", count: notes.length },
              ...NOTE_CATEGORIES.map((c) => ({ value: c, label: NOTE_CATEGORY_LABEL[c], count: notes.filter((n) => n.category === c).length })),
            ]}
          />
          <div className="hidden gap-4 md:flex">
            {(["wall", "list"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={cx("eyebrow", mode === m ? "text-ink" : "text-mute hover:text-ink")} aria-pressed={mode === m}>
                {m}
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
  const height = Math.max(640, ...notes.map((n) => (live[n.id] ?? n.position).y + 260));

  const commit = (note: Note, p: Point) => {
    actions.update("notes", note.id, { position: p });
    setLive((l) => {
      const { [note.id]: _, ...rest } = l;
      return rest;
    });
  };

  return (
    <div ref={wall} className="wall relative mt-6 overflow-hidden" style={{ height }} aria-label="Notes wall — drag to move, arrow keys to nudge">
      {notes.length === 0 && <p className="serif absolute inset-0 grid place-items-center text-2xl text-mute italic">Nothing here yet.</p>}
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
              "absolute cursor-grab touch-none border border-rule bg-card p-4 select-none active:cursor-grabbing",
              live[note.id] && "z-10 shadow-[6px_8px_0_0_rgba(29,27,24,0.08)]",
              highlight === note.id && "border-red",
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
  if (!sorted.length) return <p className="serif py-12 text-2xl text-mute italic">Nothing here yet.</p>;
  return (
    <ol className="divide-y divide-rule">
      {sorted.map((note) => (
        <li key={note.id}>
          <button onClick={() => onOpen(note.id)} className="block w-full py-5 text-left hover:bg-paper-2/60 md:px-2">
            <NoteBody note={note} filmId={filmId} large />
          </button>
        </li>
      ))}
    </ol>
  );
}

function NoteBody({ note, filmId, large }: { note: Note; filmId: string; large?: boolean }) {
  const { state } = useFilmRoom();
  const refs = resolveRefs(state, filmId, note.connections);
  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cx("eyebrow", note.category === "question" ? "text-red" : "text-mute")}>{NOTE_CATEGORY_LABEL[note.category]}</span>
        <span className="text-[0.7rem] text-mute">{formatRelative(note.createdAt)}</span>
      </div>
      <p className={cx("mt-2 leading-snug", note.category === "question" || note.category === "feeling" ? "serif italic" : "", large ? "text-xl" : "text-[0.95rem]")}>
        {note.content}
      </p>
      {refs.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-x-2 gap-y-0.5 text-[0.7rem] text-mute">
          {refs.map((r) => (
            <span key={`${r.ref.type}:${r.ref.id}`}>→ {r.label}</span>
          ))}
        </p>
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

  if (!note) return <Drawer open={false} onClose={onClose} title="">{null}</Drawer>;

  const save = () => content.trim() && content !== note.content && actions.update("notes", note.id, { content: content.trim(), updatedAt: now() });
  const done = (msg: string) => setFlash(msg);

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
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={save}
        rows={5}
        aria-label="Note text"
        className="serif w-full bg-transparent text-2xl leading-snug italic outline-none"
      />

      <div className="mt-6">
        <p className="eyebrow mb-2 text-mute">Kind</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {NOTE_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => actions.update("notes", note.id, { category: c, updatedAt: now() })}
              aria-pressed={note.category === c}
              className={cx("eyebrow", note.category === c ? "text-red" : "text-mute hover:text-ink")}
            >
              {NOTE_CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <Connections
          filmId={filmId}
          value={note.connections}
          onChange={(connections) => actions.update("notes", note.id, { connections, updatedAt: now() })}
          types={["character", "theme", "scene", "story", "question", "research", "visual"]}
        />
      </div>

      <div className="mt-10 border-t border-ink pt-4">
        <p className="eyebrow text-mute">Take it somewhere</p>
        {flash ? (
          <p className="eyebrow mt-3 text-red">{flash}</p>
        ) : (
          <div className="mt-3 space-y-3">
            <button
              onClick={() => {
                addToStory(note, note.connections.filter((c) => c.type === "scene" || c.type === "story").map((c) => c.id));
                done("Pinned to the story wall");
              }}
              className="link-action block"
            >
              Add to story
            </button>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="eyebrow">Add to character:</span>
              {people.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    addToCharacter(note, p.id);
                    done(`Added to ${p.name}`);
                  }}
                  className="link-action"
                >
                  {p.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                saveAsQuestion(note);
                done("Saved as an open question");
              }}
              className="link-action block"
            >
              Save as question
            </button>
          </div>
        )}
      </div>
    </Drawer>
  );
}
