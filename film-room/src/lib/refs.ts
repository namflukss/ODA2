/**
 * Resolving connections between pieces of material into something readable,
 * and listing what a piece of material *could* connect to.
 */
import type { EntityRef, FilmRoomState, ID, RefType } from "./types";
import { DOCUMENT_TYPE_LABEL, REF_TYPE_LABEL, STORY_NODE_LABEL } from "./vocabulary";

export interface RefOption {
  ref: EntityRef;
  label: string;
  kind: string;
  href: string;
}

const STORY_REF_FOR_NODE: Record<string, RefType> = {
  scene: "scene",
  turning_point: "scene",
  question: "question",
  theme: "story",
  idea: "story",
  film: "story",
  character: "story",
};

export function resolveRef(state: FilmRoomState, filmId: ID, ref: EntityRef): RefOption | null {
  const base = `/films/${filmId}`;
  switch (ref.type) {
    case "theme": {
      const film = state.films.find((f) => f.id === filmId);
      if (!film?.themes.includes(ref.id)) return null;
      return { ref, label: ref.id, kind: "Theme", href: `${base}` };
    }
    case "character": {
      const p = state.people.find((x) => x.id === ref.id);
      return p ? { ref, label: p.name, kind: "Character", href: `${base}/people?person=${p.id}` } : null;
    }
    case "story":
    case "scene":
    case "question": {
      const n = state.storyNodes.find((x) => x.id === ref.id);
      if (n) return { ref, label: n.title, kind: STORY_NODE_LABEL[n.type], href: `${base}/story?node=${n.id}` };
      if (ref.type === "question") {
        const film = state.films.find((f) => f.id === filmId);
        const q = [...(film?.openQuestions ?? []), ...(film?.currentQuestions ?? [])].find((x) => x === ref.id);
        if (q) return { ref, label: q, kind: "Question", href: base };
      }
      return null;
    }
    case "research": {
      const r = state.research.find((x) => x.id === ref.id);
      return r ? { ref, label: r.title, kind: "Research", href: `${base}/research?item=${r.id}` } : null;
    }
    case "visual": {
      const v = state.visuals.find((x) => x.id === ref.id);
      return v ? { ref, label: v.title, kind: "Visual", href: `${base}/visuals` } : null;
    }
    case "note": {
      const n = state.notes.find((x) => x.id === ref.id);
      return n
        ? { ref, label: n.content.slice(0, 48) + (n.content.length > 48 ? "…" : ""), kind: "Note", href: `${base}/room` }
        : null;
    }
    case "document": {
      const d = state.documents.find((x) => x.id === ref.id);
      return d ? { ref, label: d.title, kind: DOCUMENT_TYPE_LABEL[d.type], href: `${base}/script?doc=${d.id}` } : null;
    }
  }
}

export function resolveRefs(state: FilmRoomState, filmId: ID, refs: EntityRef[]): RefOption[] {
  return refs.map((r) => resolveRef(state, filmId, r)).filter((x): x is RefOption => x !== null);
}

/** Everything in a film that a piece of material can be connected to. */
export function refOptions(state: FilmRoomState, filmId: ID, types?: RefType[]): RefOption[] {
  const want = (t: RefType) => !types || types.includes(t);
  const out: RefOption[] = [];
  const film = state.films.find((f) => f.id === filmId);
  const base = `/films/${filmId}`;

  if (want("character"))
    for (const p of state.people.filter((x) => x.filmId === filmId))
      out.push({ ref: { type: "character", id: p.id }, label: p.name, kind: "Character", href: `${base}/people?person=${p.id}` });

  if (want("theme"))
    for (const t of film?.themes ?? [])
      out.push({ ref: { type: "theme", id: t }, label: t, kind: "Theme", href: base });

  for (const n of state.storyNodes.filter((x) => x.filmId === filmId && x.type !== "character" && x.type !== "film")) {
    const t = STORY_REF_FOR_NODE[n.type];
    if (want(t))
      out.push({ ref: { type: t, id: n.id }, label: n.title, kind: STORY_NODE_LABEL[n.type], href: `${base}/story?node=${n.id}` });
  }

  if (want("question"))
    for (const q of film?.openQuestions ?? [])
      if (!out.some((o) => o.label === q))
        out.push({ ref: { type: "question", id: q }, label: q, kind: "Open question", href: base });

  if (want("research"))
    for (const r of state.research.filter((x) => x.filmId === filmId))
      out.push({ ref: { type: "research", id: r.id }, label: r.title, kind: "Research", href: `${base}/research?item=${r.id}` });

  if (want("visual"))
    for (const v of state.visuals.filter((x) => x.filmId === filmId))
      out.push({ ref: { type: "visual", id: v.id }, label: v.title, kind: "Visual", href: `${base}/visuals` });

  if (want("document"))
    for (const d of state.documents.filter((x) => x.filmId === filmId))
      out.push({ ref: { type: "document", id: d.id }, label: d.title, kind: DOCUMENT_TYPE_LABEL[d.type], href: `${base}/script?doc=${d.id}` });

  return out;
}

export function sameRef(a: EntityRef, b: EntityRef): boolean {
  return a.type === b.type && a.id === b.id;
}

export function refTypeLabel(t: RefType): string {
  return REF_TYPE_LABEL[t];
}
