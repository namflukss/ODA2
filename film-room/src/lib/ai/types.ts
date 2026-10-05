/**
 * The AI provider contract. The UI only ever talks to this interface, so the
 * mocked producer can be swapped for Anthropic, OpenAI or any other LLM.
 */
import type { AIMessage } from "../types";
import type { FilmContext } from "./context";

export interface AskInput {
  context: FilmContext;
  /** Prior turns in this film's conversation, oldest first. */
  history: AIMessage[];
  question: string;
}

/** Contextual suggestions for a freshly written note in the Room. */
export interface NoteSuggestions {
  characters: { id: string; name: string }[];
  themes: string[];
  story: { id: string; title: string }[];
  question?: string;
}

export interface SuggestInput {
  context: FilmContext;
  text: string;
}

export interface FilmAIProvider {
  readonly name: string;
  ask(input: AskInput): Promise<string>;
  suggestConnections(input: SuggestInput): Promise<NoteSuggestions>;
}

/**
 * Response format shared by every provider (and asked of real LLMs in the system prompt):
 *   "## HEADING"       → section heading
 *   "01 / Something"   → numbered item
 *   "> line"           → emphasised (serif) line
 *   blank line         → paragraph break
 */
export type ProducerMarkup = string;
