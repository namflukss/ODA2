"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useProducer } from "@/lib/ai/useProducer";
import { useActions, useFilm } from "@/lib/store";
import type { AIMessage, MemoryType } from "@/lib/types";
import { formatTime, now } from "@/lib/utils";
import { ProducerMarkup } from "./ProducerMarkup";

const PROMPTS = [
  "I don't know if this film is actually about Dana anymore.",
  "What is the structure doing right now?",
  "Should I keep the conversation with her mother?",
  "Which themes don't have scenes yet?",
  "What questions is the film still holding?",
];

const GENERIC_PROMPTS = [
  "What is this film actually about?",
  "What is the structure doing right now?",
  "What questions is the film still holding?",
];

export function ProducerConversation({
  filmId,
  compact,
  onNavigate,
}: {
  filmId: string;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const { film } = useFilm(filmId);
  const { messages, ask, thinking, clear, providerName } = useProducer(filmId);
  const [draft, setDraft] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, thinking]);

  // The sample film gets prompts about its own people; other films get neutral openings.
  const prompts = film?.id === "mother" ? PROMPTS : GENERIC_PROMPTS;

  const submit = (text = draft) => {
    if (!text.trim()) return;
    setDraft("");
    void ask(text);
  };

  return (
    <div className="flex flex-col gap-8">
      {messages.length === 0 && !thinking && (
        <div>
          <p className="serif text-3xl leading-tight italic md:text-4xl">
            I&rsquo;ve read everything in the room. What&rsquo;s on your mind about the film?
          </p>
          <ul className="mt-6 divide-y divide-rule border-y border-rule">
            {prompts.map((p) => (
              <li key={p}>
                <button onClick={() => submit(p)} className="group flex w-full items-baseline justify-between gap-4 py-3 text-left hover:text-red">
                  <span>{p}</span>
                  <span aria-hidden className="text-mute group-hover:text-red">→</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ol className="space-y-10" aria-live="polite">
        {messages.map((m) => (
          <li key={m.id} className="fade-in">
            {m.role === "user" ? <UserTurn message={m} /> : <ProducerTurn message={m} filmId={filmId} />}
          </li>
        ))}
        {thinking && (
          <li className="eyebrow flex items-center gap-3 text-mute">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red" />
            Reading the film…
          </li>
        )}
      </ol>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="border-t border-ink pt-3"
      >
        <label className="eyebrow text-mute" htmlFor={`ask-${filmId}`}>
          Think with the film
        </label>
        <div className="mt-1 flex items-end gap-4">
          <textarea
            id={`ask-${filmId}`}
            data-autofocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="Something about the film that won't leave you alone…"
            className="serif flex-1 bg-transparent py-1 text-xl italic outline-none placeholder:text-mute/70"
          />
          <button type="submit" disabled={!draft.trim() || thinking} className="eyebrow bg-ink px-4 py-2.5 text-paper hover:bg-red disabled:opacity-30">
            Ask
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-mute">
          <span>{providerName} · reads this film&rsquo;s story, people, notes, research, visuals, memory and versions</span>
          <span className="flex gap-4">
            {messages.length > 0 && (
              <button type="button" onClick={clear} className="hover:text-red">
                Clear
              </button>
            )}
            {compact && (
              <Link href={`/films/${filmId}/ai`} onClick={onNavigate} className="hover:text-ink">
                Open full room →
              </Link>
            )}
          </span>
        </div>
      </form>
      <div ref={end} className="scroll-mb-24" />
    </div>
  );
}

function UserTurn({ message }: { message: AIMessage }) {
  return (
    <div className="ml-auto max-w-[85%] border-l-2 border-ink pl-4">
      <p className="eyebrow text-mute">You · {formatTime(message.timestamp)}</p>
      <p className="serif mt-1 text-2xl leading-snug italic">{message.content}</p>
    </div>
  );
}

function ProducerTurn({ message, filmId }: { message: AIMessage; filmId: string }) {
  const actions = useActions();
  const [saved, setSaved] = useState<MemoryType | null>(null);

  const remember = (type: MemoryType) => {
    const heading = message.content.match(/^## (.+)$/m)?.[1] ?? "From the producer";
    const quote = message.content.match(/^> (.+)$/m)?.[1];
    actions.create("memories", {
      filmId,
      date: now(),
      type,
      title: heading.charAt(0) + heading.slice(1).toLowerCase(),
      description: quote ?? message.content.replace(/^## .+$/gm, "").replace(/\n+/g, " ").trim().slice(0, 280),
      reason: "Surfaced while thinking with the development producer.",
    });
    setSaved(type);
  };

  return (
    <article className="max-w-2xl">
      <p className="eyebrow mb-3 text-mute">Producer · {formatTime(message.timestamp)}</p>
      <ProducerMarkup text={message.content} />
      <div className="mt-5 flex flex-wrap gap-5">
        {saved ? (
          <span className="eyebrow text-red">Saved to film memory</span>
        ) : (
          <>
            <button onClick={() => remember("open_question")} className="link-action text-mute">
              Remember as question
            </button>
            <button onClick={() => remember("decision")} className="link-action text-mute">
              Remember as decision
            </button>
          </>
        )}
      </div>
    </article>
  );
}
