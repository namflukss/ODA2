/**
 * Remote provider: sends the film brief to our own `/api/ai` route, which talks
 * to a real model server-side (Anthropic by default). Falls back to the mock if
 * the route isn't configured, so the room never goes silent.
 */
import { contextToBrief, type FilmContext } from "./context";
import { mockProvider } from "./mock";
import type { FilmAIProvider, NoteSuggestions } from "./types";

async function post<T>(body: unknown): Promise<T> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`AI route responded ${res.status}`);
  return (await res.json()) as T;
}

/** Ids are needed for suggestions so the model can point at real entities. */
function idIndex(ctx: FilmContext): string {
  return [
    "# IDS",
    ...ctx.people.map((p) => `character ${p.id}: ${p.name}`),
    ...ctx.story.filter((n) => n.type !== "film" && n.type !== "character").map((n) => `storyNode ${n.id}: ${n.title}`),
    `themes: ${ctx.film.themes.join(", ")}`,
  ].join("\n");
}

export const remoteProvider: FilmAIProvider = {
  name: "Development producer",
  async ask(input) {
    try {
      const { text } = await post<{ text: string }>({
        mode: "ask",
        brief: contextToBrief(input.context),
        history: input.history.map((m) => ({ role: m.role, content: m.content })),
        question: input.question,
      });
      return text;
    } catch {
      return mockProvider.ask(input);
    }
  },
  async suggestConnections(input) {
    try {
      const raw = await post<{ characterIds: string[]; themes: string[]; storyNodeIds: string[]; question: string }>({
        mode: "suggest",
        brief: `${contextToBrief(input.context)}\n\n${idIndex(input.context)}`,
        text: input.text,
      });
      const ctx = input.context;
      const result: NoteSuggestions = {
        characters: ctx.people.filter((p) => raw.characterIds?.includes(p.id)).map((p) => ({ id: p.id, name: p.name })),
        themes: ctx.film.themes.filter((t) => raw.themes?.includes(t)),
        story: ctx.story.filter((n) => raw.storyNodeIds?.includes(n.id)).map((n) => ({ id: n.id, title: n.title })),
        question: raw.question,
      };
      return result;
    } catch {
      return mockProvider.suggestConnections(input);
    }
  },
};
