/**
 * getFilmContext — the heart of the AI layer.
 *
 * Gathers everything the Development Producer needs to understand *this* film
 * (not filmmaking in general) and offers a compact text rendering for LLMs.
 * On a real backend, the same function would run server-side against the database.
 */
import type {
  AIMessage,
  Film,
  FilmMemory,
  FilmRoomState,
  ID,
  Note,
  Person,
  ResearchItem,
  StoryNode,
  Version,
  VisualReference,
  WritingDocument,
} from "../types";
import { formatDay } from "../utils";
import {
  MEMORY_TYPE_LABEL,
  RESEARCH_TYPE_LABEL,
  STORY_NODE_LABEL,
  VISUAL_CATEGORY_LABEL,
  DOCUMENT_TYPE_LABEL,
} from "../vocabulary";

export interface FilmContext {
  film: Film;
  story: StoryNode[];
  people: Person[];
  research: ResearchItem[];
  notes: Note[];
  visuals: VisualReference[];
  memories: FilmMemory[];
  versions: Version[];
  documents: WritingDocument[];
  conversation: AIMessage[];
}

export function getFilmContext(state: FilmRoomState, filmId: ID): FilmContext | null {
  const film = state.films.find((f) => f.id === filmId);
  if (!film) return null;
  const mine = <T extends { filmId: ID }>(list: T[]) => list.filter((x) => x.filmId === filmId);
  return {
    film,
    story: mine(state.storyNodes),
    people: mine(state.people),
    research: mine(state.research),
    notes: mine(state.notes).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    visuals: mine(state.visuals),
    memories: mine(state.memories).sort((a, b) => b.date.localeCompare(a.date)),
    versions: mine(state.versions).sort((a, b) => b.versionNumber - a.versionNumber),
    documents: mine(state.documents),
    conversation: mine(state.aiMessages),
  };
}

const clip = (s: string, n = 600) => (s.length > n ? s.slice(0, n) + "…" : s);

/** Render the context as a structured brief for a language model. */
export function contextToBrief(ctx: FilmContext): string {
  const { film } = ctx;
  const byId = new Map(ctx.story.map((n) => [n.id, n.title]));
  const lines: string[] = [];
  const section = (title: string) => lines.push("", `# ${title}`);

  section("FILM");
  lines.push(
    `Title: ${film.title}`,
    `Format: ${film.format} · ${film.duration}`,
    `Stage: ${film.status} · ${film.currentVersion}`,
    `Logline: ${film.logline}`,
    `Story: ${film.description}`,
    `What we're trying to understand: ${film.understanding}`,
    `Themes: ${film.themes.join(", ")}`,
    `Current questions: ${film.currentQuestions.join(" | ")}`,
    `Open questions: ${film.openQuestions.join(" | ")}`,
  );

  section("STORY WALL");
  for (const n of ctx.story) {
    const links = n.connections.map((c) => byId.get(c)).filter(Boolean).join(", ");
    lines.push(`- [${STORY_NODE_LABEL[n.type]}] ${n.title}: ${clip(n.content, 240)}${links ? ` (→ ${links})` : ""}`);
  }

  section("PEOPLE");
  for (const p of ctx.people) {
    lines.push(
      `- ${p.name} (${p.role}, ${p.type})`,
      `  Who: ${clip(p.description, 300)}`,
      `  Wants: ${clip(p.wants, 300)}`,
      `  Fears: ${clip(p.fears, 300)}`,
      `  Unknown: ${clip(p.unknowns, 300)}`,
    );
  }

  section("VERSIONS (newest first)");
  for (const v of ctx.versions) {
    lines.push(
      `- V${String(v.versionNumber).padStart(2, "0")} ${v.type}, ${formatDay(v.date)}: ${v.summary}`,
      `  Changed: ${v.changes.join("; ")}`,
      `  Removed: ${v.removed.join("; ")}`,
      `  Emerged: ${v.emerged.join("; ")}`,
    );
  }

  section("FILM MEMORY (newest first)");
  for (const m of ctx.memories)
    lines.push(`- ${formatDay(m.date)} [${MEMORY_TYPE_LABEL[m.type]}] ${m.title}: ${m.description} Reason: ${m.reason}`);

  section("NOTES FROM THE ROOM (newest first)");
  for (const n of ctx.notes.slice(0, 20)) lines.push(`- (${n.category}) ${clip(n.content, 300)}`);

  section("RESEARCH");
  for (const r of ctx.research)
    lines.push(`- [${RESEARCH_TYPE_LABEL[r.type]}] ${r.title} — ${r.source}: ${clip(r.description, 240)}`);

  section("VISUAL WORLD");
  for (const v of ctx.visuals) lines.push(`- [${VISUAL_CATEGORY_LABEL[v.category]}] ${v.title}: ${clip(v.annotation, 200)}`);

  section("WRITING");
  for (const d of ctx.documents) lines.push(`- [${DOCUMENT_TYPE_LABEL[d.type]}] ${d.title}: ${clip(d.content, 900)}`);

  return lines.join("\n").trim();
}

/** Small summary of what the producer "has read", shown in the UI. */
export function contextInventory(ctx: FilmContext) {
  return [
    { label: "Story nodes", count: ctx.story.length },
    { label: "People", count: ctx.people.length },
    { label: "Notes", count: ctx.notes.length },
    { label: "Research", count: ctx.research.length },
    { label: "Visual references", count: ctx.visuals.length },
    { label: "Memories", count: ctx.memories.length },
    { label: "Versions", count: ctx.versions.length },
    { label: "Pages of writing", count: ctx.documents.length },
  ];
}
