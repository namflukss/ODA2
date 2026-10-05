"use client";

import { ArrowUp, Bookmark, Check, Sparkles } from "lucide-react";
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
    <div className="flex flex-col gap-6">
      {messages.length === 0 && !thinking && (
        <div>
          <div className="flex items-start gap-3">
            <ProducerAvatar />
            <div className="rounded-2xl rounded-tl-md bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
              <p className="serif text-xl leading-snug">I&rsquo;ve read everything in the room. What&rsquo;s on your mind about the film?</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 pl-12">
            {prompts.map((p) => (
              <button key={p} onClick={() => submit(p)} className="rounded-full border border-line bg-surface px-3.5 py-2 text-left text-sm text-ink-2 hover:border-ink hover:text-ink">
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <ol className="space-y-6" aria-live="polite">
        {messages.map((m) => (
          <li key={m.id} className="fade-in">
            {m.role === "user" ? <UserTurn message={m} /> : <ProducerTurn message={m} filmId={filmId} />}
          </li>
        ))}
        {thinking && (
          <li className="flex items-center gap-3">
            <ProducerAvatar />
            <span className="flex items-center gap-2 rounded-2xl bg-surface px-4 py-3 text-sm text-mute shadow-[var(--shadow-card)]">
              <Sparkles size={14} className="animate-pulse text-accent" /> Reading the film…
            </span>
          </li>
        )}
      </ol>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="rounded-2xl border border-line bg-surface p-2 shadow-[var(--shadow-card)] focus-within:border-line-strong"
      >
        <label className="sr-only" htmlFor={`ask-${filmId}`}>
          Think with the film
        </label>
        <div className="flex items-end gap-2">
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
            className="flex-1 bg-transparent px-2 py-1.5 outline-none placeholder:text-mute"
          />
          <button type="submit" disabled={!draft.trim() || thinking} className="grid h-9 w-9 place-items-center rounded-full bg-accent text-white hover:bg-accent-deep disabled:opacity-30" aria-label="Ask">
            <ArrowUp size={17} />
          </button>
        </div>
      </form>
      <div className="-mt-3 flex items-center justify-between px-1 text-xs text-mute">
        <span>{providerName} · reads the story, people, notes, research, visuals, memory and versions</span>
        <span className="flex gap-3">
          {messages.length > 0 && (
            <button type="button" onClick={clear} className="hover:text-accent">
              Clear
            </button>
          )}
          {compact && (
            <Link href={`/films/${filmId}/ai`} onClick={onNavigate} className="hover:text-ink">
              Full view →
            </Link>
          )}
        </span>
      </div>
      <div ref={end} className="scroll-mb-24" />
    </div>
  );
}

function ProducerAvatar() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-white">
      <Sparkles size={15} />
    </span>
  );
}

function UserTurn({ message }: { message: AIMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-ink px-4 py-3 text-white">
        <p className="serif text-lg leading-snug">{message.content}</p>
        <p className="mt-1 text-right text-[0.7rem] text-white/50">{formatTime(message.timestamp)}</p>
      </div>
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
    <div className="flex items-start gap-3">
      <ProducerAvatar />
      <article className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-md bg-surface px-5 py-4 shadow-[var(--shadow-card)]">
          <ProducerMarkup text={message.content} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-mute">Producer · {formatTime(message.timestamp)}</span>
          {saved ? (
            <span className="flex items-center gap-1 font-medium text-accent">
              <Check size={13} /> Saved to film memory
            </span>
          ) : (
            <>
              <button onClick={() => remember("open_question")} className="pill py-0.5 text-xs">
                <Bookmark size={12} /> Remember as question
              </button>
              <button onClick={() => remember("decision")} className="pill py-0.5 text-xs">
                <Bookmark size={12} /> Remember as decision
              </button>
            </>
          )}
        </div>
      </article>
    </div>
  );
}
