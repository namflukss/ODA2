"use client";

/**
 * What a thought in the Room can become: part of the story, part of a person,
 * or a question the film carries.
 */
import { useCallback } from "react";
import { useFilmRoom } from "@/lib/store";
import type { EntityRef, Note, StoryNodeType } from "@/lib/types";
import { now } from "@/lib/utils";
import { sameRef } from "@/lib/refs";

const NODE_TYPE_FOR_CATEGORY: Record<Note["category"], StoryNodeType> = {
  thought: "idea",
  observation: "idea",
  scene: "scene",
  question: "question",
  feeling: "idea",
  image: "idea",
};

export function useNoteActions(filmId: string) {
  const { state, actions } = useFilmRoom();

  const connect = useCallback(
    (note: Note, refs: EntityRef[]) => {
      const fresh = refs.filter((r) => !note.connections.some((c) => sameRef(c, r)));
      if (fresh.length)
        actions.update("notes", note.id, { connections: [...note.connections, ...fresh], updatedAt: now() });
    },
    [actions],
  );

  /** Pin the note on the story wall, next to whatever it relates to. */
  const addToStory = useCallback(
    (note: Note, relatedNodeIds: string[] = []) => {
      const anchors = state.storyNodes.filter((n) => relatedNodeIds.includes(n.id));
      const filmNode = state.storyNodes.find((n) => n.filmId === filmId && n.type === "film");
      const anchor = anchors[0] ?? filmNode;
      const position = anchor
        ? { x: anchor.position.x + 60 + Math.random() * 80, y: anchor.position.y + 150 + Math.random() * 60 }
        : { x: 200 + Math.random() * 300, y: 200 + Math.random() * 200 };
      const title = note.content.split(/[.?!\n]/)[0].slice(0, 60).trim() || "From the room";
      const node = actions.create("storyNodes", {
        filmId,
        type: NODE_TYPE_FOR_CATEGORY[note.category],
        title,
        content: note.content,
        position,
        connections: anchors.map((a) => a.id),
      });
      connect(note, [{ type: node.type === "scene" ? "scene" : node.type === "question" ? "question" : "story", id: node.id }]);
      return node;
    },
    [state.storyNodes, filmId, actions, connect],
  );

  const addToCharacter = useCallback(
    (note: Note, personId: string) => {
      const person = state.people.find((p) => p.id === personId);
      if (!person) return;
      const notes = person.notes ? `${person.notes}\n\n${note.content}` : note.content;
      actions.update("people", personId, { notes });
      connect(note, [{ type: "character", id: personId }]);
    },
    [state.people, actions, connect],
  );

  const saveAsQuestion = useCallback(
    (note: Note, question?: string) => {
      const film = state.films.find((f) => f.id === filmId);
      const q = (question ?? note.content).trim();
      if (!film || !q) return;
      if (!film.openQuestions.includes(q)) actions.updateFilm(filmId, { openQuestions: [...film.openQuestions, q] });
      actions.create("memories", {
        filmId,
        date: now(),
        type: "open_question",
        title: q.length > 60 ? `${q.slice(0, 57)}…` : q,
        description: q,
        reason: `Came out of a note in the room: “${note.content.slice(0, 140)}”`,
      });
      actions.update("notes", note.id, { category: "question", updatedAt: now() });
      connect(note, [{ type: "question", id: q }]);
    },
    [state.films, filmId, actions, connect],
  );

  return { connect, addToStory, addToCharacter, saveAsQuestion };
}
