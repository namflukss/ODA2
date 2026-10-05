"use client";

import { useState } from "react";
import type { NoteSuggestions } from "@/lib/ai";
import type { EntityRef, Note } from "@/lib/types";
import { sameRef } from "@/lib/refs";
import { cx } from "@/lib/utils";
import { useNoteActions } from "./useNoteActions";

/**
 * POSSIBLE CONNECTIONS — shown after a note is written.
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
      <div className="eyebrow flex items-center gap-3 py-6 text-mute">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red" /> Looking for connections…
      </div>
    );
  }

  const isOn = (ref: EntityRef) => note.connections.some((c) => sameRef(c, ref));
  const rows: { kind: string; label: string; ref: EntityRef }[] = [
    ...suggestions.characters.map((c) => ({ kind: "Character", label: c.name, ref: { type: "character", id: c.id } as EntityRef })),
    ...suggestions.themes.map((t) => ({ kind: "Theme", label: t, ref: { type: "theme", id: t } as EntityRef })),
    ...suggestions.story.map((s) => ({ kind: "Story", label: s.title, ref: { type: "scene", id: s.id } as EntityRef })),
  ];
  const finish = (msg: string) => {
    setDone(msg);
    setTimeout(onDone, 1100);
  };
  const person = suggestions.characters[0];

  return (
    <div className="rise-in">
      <p className="eyebrow text-red">Possible connections</p>
      <ul className="mt-3 divide-y divide-rule border-y border-rule">
        {rows.map((r) => (
          <li key={`${r.ref.type}:${r.ref.id}`}>
            <button
              onClick={() => connect(note, [r.ref])}
              aria-pressed={isOn(r.ref)}
              className="group flex w-full items-baseline gap-4 py-2.5 text-left"
            >
              <span className="eyebrow w-24 shrink-0 text-mute">{r.kind}</span>
              <span className={cx("flex-1 text-lg font-semibold", isOn(r.ref) ? "text-ink" : "group-hover:text-red")}>{r.label}</span>
              <span className={cx("eyebrow", isOn(r.ref) ? "text-red" : "text-mute opacity-0 group-hover:opacity-100")}>
                {isOn(r.ref) ? "Connected" : "Connect"}
              </span>
            </button>
          </li>
        ))}
        {suggestions.question && (
          <li className="flex items-baseline gap-4 py-2.5">
            <span className="eyebrow w-24 shrink-0 text-mute">Open question</span>
            <span className="serif flex-1 text-xl leading-snug italic">{suggestions.question}</span>
          </li>
        )}
      </ul>

      {done ? (
        <p className="eyebrow mt-4 text-red">{done}</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-px bg-rule sm:grid-cols-4">
          <ActionButton
            onClick={() => {
              addToStory(note, suggestions.story.map((s) => s.id));
              finish("Pinned to the story wall");
            }}
          >
            Add to story
          </ActionButton>
          <ActionButton
            disabled={!person}
            onClick={() => {
              if (!person) return;
              addToCharacter(note, person.id);
              finish(`Added to ${person.name}`);
            }}
          >
            Add to character
          </ActionButton>
          <ActionButton
            onClick={() => {
              saveAsQuestion(note, suggestions.question);
              finish("Saved as an open question");
            }}
          >
            Save as question
          </ActionButton>
          <ActionButton onClick={onDone}>Leave in room</ActionButton>
        </div>
      )}
    </div>
  );
}

function ActionButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="eyebrow bg-paper px-3 py-3 text-left transition-colors hover:bg-ink hover:text-paper disabled:opacity-30">
      {children}
    </button>
  );
}
