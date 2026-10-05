/**
 * AI entry point. Choose the provider with NEXT_PUBLIC_AI_PROVIDER:
 *   "mock" (default) — local, context-aware mock
 *   "anthropic"      — real model via /api/ai (set ANTHROPIC_API_KEY on the server)
 * Adding OpenAI or another LLM means adding a branch to the /api/ai route; the UI is unchanged.
 */
import { mockProvider } from "./mock";
import { remoteProvider } from "./remote";
import type { FilmAIProvider } from "./types";

export function getAIProvider(): FilmAIProvider {
  return process.env.NEXT_PUBLIC_AI_PROVIDER && process.env.NEXT_PUBLIC_AI_PROVIDER !== "mock"
    ? remoteProvider
    : mockProvider;
}

export { getFilmContext, contextToBrief, contextInventory } from "./context";
export type { FilmContext } from "./context";
export type { FilmAIProvider, NoteSuggestions } from "./types";
