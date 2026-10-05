"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { ProducerConversation } from "@/components/ai/ProducerConversation";
import { useFilm } from "@/lib/store";
import type { Film } from "@/lib/types";
import { cx } from "@/lib/utils";

const NAV = [
  { href: "", label: "Overview", mobile: "Film" },
  { href: "/room", label: "Room" },
  { href: "/story", label: "Story" },
  { href: "/people", label: "People" },
  { href: "/research", label: "Research" },
  { href: "/visuals", label: "Visual world" },
  { href: "/script", label: "Script" },
  { href: "/memory", label: "Memory" },
];

const MOBILE_PRIMARY = ["", "/room", "/story", "/memory"];

export function FilmShell({ filmId, children }: { filmId: string; children: ReactNode }) {
  const { film, hydrated } = useFilm(filmId);
  const pathname = usePathname();
  const [thinking, setThinking] = useState(false);
  const [more, setMore] = useState(false);
  const base = `/films/${filmId}`;
  const section = pathname.slice(base.length) || "";
  const onAI = section === "/ai";

  if (!film) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-24">
        {hydrated ? (
          <>
            <p className="eyebrow text-red">Not here</p>
            <h1 className="mt-3 text-4xl font-extrabold uppercase">This film isn&rsquo;t in your room.</h1>
            <Link href="/films" className="link-action mt-8 inline-block">
              Back to my films
            </Link>
          </>
        ) : (
          <p className="eyebrow text-mute">Opening the room…</p>
        )}
      </main>
    );
  }

  const isActive = (href: string) => (href === "" ? section === "" : section.startsWith(href));

  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <FilmHeader film={film} onThink={() => setThinking(true)} onAI={onAI} compact={section !== ""} />

      <nav aria-label="Film sections" className="sticky top-0 z-30 hidden border-b border-ink bg-paper/95 backdrop-blur-sm md:block">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-10">
          <ul className="flex gap-7">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={`${base}${item.href}`}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cx(
                    "eyebrow block border-b-2 py-3.5 transition-colors",
                    isActive(item.href) ? "border-red text-ink" : "border-transparent text-mute hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <span className="serif truncate text-sm text-mute italic">{film.title}</span>
        </div>
      </nav>

      <div className="mx-auto max-w-[1600px]">{children}</div>

      {/* Mobile: a notebook's tab bar. */}
      <nav aria-label="Film sections" className="fixed inset-x-0 bottom-0 z-40 border-t border-ink bg-paper md:hidden">
        <ul className="grid grid-cols-6 pb-[env(safe-area-inset-bottom)]">
          {NAV.filter((n) => MOBILE_PRIMARY.includes(n.href)).slice(0, 3).map((item) => (
            <MobileTab key={item.href} href={`${base}${item.href}`} label={item.mobile ?? item.label} active={isActive(item.href)} />
          ))}
          <li>
            <Link
              href={`${base}/ai`}
              className={cx("flex h-14 flex-col items-center justify-center gap-1 bg-ink text-paper", onAI && "bg-red")}
            >
              <span aria-hidden className="h-0.5 w-4" />
              <span className="eyebrow text-[0.6rem]">Think</span>
            </Link>
          </li>
          <MobileTab href={`${base}/memory`} label="Memory" active={isActive("/memory")} />
          <li>
            <button
              onClick={() => setMore(true)}
              className={cx("eyebrow flex h-14 w-full flex-col items-center justify-center gap-1 text-[0.6rem]", ["/people", "/research", "/visuals", "/script"].some(isActive) ? "text-red" : "text-mute")}
            >
              <span aria-hidden className="h-0.5 w-4" />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Drawer open={more} onClose={() => setMore(false)} title={film.title} eyebrow="The film">
        <ul className="divide-y divide-rule border-y border-rule">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={`${base}${item.href}`}
                onClick={() => setMore(false)}
                className={cx("flex items-baseline justify-between py-4 text-2xl font-bold uppercase", isActive(item.href) && "text-red")}
              >
                {item.label}
                <span aria-hidden className="text-mute">→</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/films" onClick={() => setMore(false)} className="link-action mt-8 inline-block">
          All my films
        </Link>
      </Drawer>

      <Drawer open={thinking} onClose={() => setThinking(false)} title="Think with the film" eyebrow="Development producer" wide>
        <ProducerConversation filmId={filmId} compact onNavigate={() => setThinking(false)} />
      </Drawer>
    </div>
  );
}

function MobileTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cx("eyebrow flex h-14 flex-col items-center justify-center gap-1 text-[0.6rem]", active ? "text-ink" : "text-mute")}
      >
        <span aria-hidden className={cx("h-0.5 w-4", active ? "bg-red" : "bg-transparent")} />
        {label}
      </Link>
    </li>
  );
}

function FilmHeader({ film, onThink, onAI, compact }: { film: Film; onThink: () => void; onAI: boolean; compact: boolean }) {
  return (
    <header className="mx-auto max-w-[1600px] px-4 md:px-10">
      <div className="flex items-center justify-between border-b border-rule py-3 md:py-4">
        <Link href="/films" className="eyebrow text-mute hover:text-ink">
          <span aria-hidden>← </span>My films
        </Link>
        {!onAI && (
          <button
            onClick={onThink}
            className="eyebrow hidden items-center gap-3 bg-ink px-4 py-2.5 text-paper transition-colors hover:bg-red md:flex"
          >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-red" />
            Think with the film
          </button>
        )}
      </div>
      <div className={cx("grid gap-2 md:grid-cols-12 md:items-end md:gap-8", compact ? "py-4 md:py-5" : "py-6 md:py-10")}>
        <h1
          className={cx(
            "leading-[0.92] font-extrabold tracking-[-0.035em] uppercase md:col-span-9",
            compact ? "text-[clamp(1.35rem,2.6vw,2.25rem)]" : "text-[clamp(1.9rem,5.4vw,4.75rem)]",
          )}
        >
          {film.title}
        </h1>
        <dl className="text-sm leading-relaxed md:col-span-3 md:text-right">
          <dt className="sr-only">Format</dt>
          <dd>
            {film.format} · {film.duration}
          </dd>
          <dt className="sr-only">Stage</dt>
          <dd className="text-mute">
            {film.status} · <span className="text-red">{film.currentVersion}</span>
          </dd>
        </dl>
      </div>
    </header>
  );
}
