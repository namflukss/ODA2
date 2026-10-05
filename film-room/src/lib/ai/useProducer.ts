"use client";

/**
 * React binding for the Development Producer: gathers the film context at the
 * moment of asking, calls the configured provider, and stores the exchange.
 */
import { useCallback, useState } from "react";
import { useCollection, useFilmRoom } from "../store";
import type { ID } from "../types";
import { now } from "../utils";
import { getFilmContext } from "./context";
import { getAIProvider } from "./index";
import type { NoteSuggestions } from "./types";

export function useProducer(filmId: ID) {
  const { state, actions } = useFilmRoom();
  const messages = useCollection("aiMessages", filmId);
  const [thinking, setThinking] = useState(false);

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || thinking) return;
      const context = getFilmContext(state, filmId);
      if (!context) return;
      const history = messages.slice(-12);
      actions.create("aiMessages", { filmId, role: "user", content: q, timestamp: now() });
      setThinking(true);
      try {
        const answer = await getAIProvider().ask({ context, history, question: q });
        actions.create("aiMessages", { filmId, role: "producer", content: answer, timestamp: now() });
      } finally {
        setThinking(false);
      }
    },
    [state, filmId, messages, actions, thinking],
  );

  const clear = useCallback(() => {
    for (const m of messages) actions.remove("aiMessages", m.id);
  }, [messages, actions]);

  return { messages, ask, thinking, clear, providerName: getAIProvider().name };
}

export function useNoteSuggestions(filmId: ID) {
  const { state } = useFilmRoom();
  return useCallback(
    async (text: string): Promise<NoteSuggestions | null> => {
      const context = getFilmContext(state, filmId);
      if (!context) return null;
      return getAIProvider().suggestConnections({ context, text });
    },
    [state, filmId],
  );
}
