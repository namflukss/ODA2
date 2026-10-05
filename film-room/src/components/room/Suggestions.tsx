"use client";

import { BookOpen, Check, CircleHelp, Network, Plus, Sparkles, Tag, User } from "lucide-react";
import { useState } from "react";
import type { NoteSuggestions } from "@/lib/ai";
import type { EntityRef, Note } from "@/lib/types";
import { sameRef } from "@/lib/refs";
import { cx } from "@/lib/utils";
import { useNoteActions } from "./useNoteActions";

/**
 * Possible connections — shown after a note is written.
 * Each suggestion can be accepted on its own; the four actions decide where the note goes.
 */
export function Suggestions({
  filmId,
  note,
  suggestions,
  onDone,
}: {
  filmId: string;
  note: Note;
  suggestions: NoteSuggestions | null;
  onDone: () => void;
}) {
  const { connect, addToStory, addToCharacter, saveAsQuestion } = useNoteActions(filmId);
  const [done, setDone] = useState<string | null>(null);

  if (!suggestions) {
    return (
      <div className="card flex items-center gap-3 p-5 text-sm text-mute">
        <Sparkles size={16} className="animate-pulse text-accent" /> Looking for connections…
      </div>
    );
  }

  const isOn = (ref: EntityRef) => note.connections.some((c) => sameRef(c, ref));
  const rows: { kind: string; label: string; ref: EntityRef; icon: typeof User }[] = [
    ...suggestions.characters.map((c) => ({ kind: "Character", label: c.name, ref: { type: "character", id: c.id } as EntityRef, icon: User })),
    ...suggestions.themes.map((t) => ({ kind: "Theme", label: t, ref: { type: "theme", id: t } as EntityRef, icon: Tag })),
    ...suggestions.story.map((s) => ({ kind: "Story", label: s.title, ref: { type: "scene", id: s.id } as EntityRef, icon: BookOpen })),
  ];
  const finish = (msg: string) => {
    setDone(msg);
    setTimeout(onDone, 1100);
  };
  const person = suggestions.characters[0];

  return (
    <div className="card rise-in overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-4 text-sm font-medium">
        <Sparkles size={15} className="text-accent" /> Possible connections
      </div>
      <ul className="mt-2 px-3">
        {rows.map((r) => (
          <li key={`${r.ref.type}:${r.ref.id}`}>
            <button
              onClick={() => connect(note, [r.ref])}
              aria-pressed={isOn(r.ref)}
              className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-hover"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sunken text-ink-2">
                <r.icon size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-mute">{r.kind}</span>
                <span className="block truncate font-medium">{r.label}</span>
              </span>
              <span className={cx("grid h-7 w-7 place-items-center rounded-full border", isOn(r.ref) ? "border-ink bg-ink text-white" : "border-line text-mute group-hover:border-ink group-hover:text-ink")}>
                {isOn(r.ref) ? <Check size={14} /> : <Plus size={14} />}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {suggestions.question && (
        <div className="mx-5 mt-2 rounded-xl bg-accent-soft p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-accent-deep">
            <CircleHelp size={13} /> Open question
          </p>
          <p className="serif mt-1 text-lg leading-snug">{suggestions.question}</p>
        </div>
      )}

      {done ? (
        <p className="flex items-center gap-2 px-5 py-4 text-sm font-medium text-accent">
          <Check size={15} /> {done}
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line px-5 py-4">
          <button
            className="btn btn-primary"
            onClick={() => {
              addToStory(note, suggestions.story.map((s) => s.id));
              finish("Pinned to the story map");
            }}
          >
            <Network size={14} /> Add to story
          </button>
          <button
            className="btn btn-ghost"
            disabled={!person}
            onClick={() => {
              if (!person) return;
              addToCharacter(note, person.id);
              finish(`Added to ${person.name}`);
            }}
          >
            <User size={14} /> Add to character
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              saveAsQuestion(note, suggestions.question);
              finish("Saved as an open question");
            }}
          >
            <CircleHelp size={14} /> Save as question
          </button>
          <button className="btn btn-quiet" onClick={onDone}>
            Leave in room
          </button>
        </div>
      )}
    </div>
  );
}
