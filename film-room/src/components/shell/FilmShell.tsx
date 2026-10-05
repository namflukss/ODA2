"use client";

import {
  ChevronLeft,
  Clapperboard,
  History,
  Images,
  LayoutGrid,
  Library,
  type LucideIcon,
  MoreHorizontal,
  Network,
  PenLine,
  Sparkles,
  StickyNote,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ProducerConversation } from "@/components/ai/ProducerConversation";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/forms";
import { Still } from "@/components/ui/Still";
import { useFilm } from "@/lib/store";
import type { Film } from "@/lib/types";
import { cx } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  short?: string;
}

const NAV: NavItem[] = [
  { href: "", label: "Overview", icon: LayoutGrid, short: "Film" },
  { href: "/room", label: "Room", icon: StickyNote },
  { href: "/story", label: "Story", icon: Network },
  { href: "/people", label: "People", icon: Users },
  { href: "/research", label: "Research", icon: Library },
  { href: "/visuals", label: "Visual world", icon: Images },
  { href: "/script", label: "Script", icon: PenLine },
  { href: "/memory", label: "Memory", icon: History },
];

const MOBILE_TABS = ["", "/room", "/story"];
const MORE = ["/people", "/research", "/visuals", "/script"];

export function FilmShell({ filmId, children }: { filmId: string; children: ReactNode }) {
  const { film, hydrated } = useFilm(filmId);
  const pathname = usePathname();
  const [thinking, setThinking] = useState(false);
  const [more, setMore] = useState(false);
  const base = `/films/${filmId}`;
  const section = pathname.replace(/\/$/, "").slice(base.length) || "";
  const onAI = section === "/ai";
  const isActive = (href: string) => (href === "" ? section === "" : section.startsWith(href));

  if (!film) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        {hydrated ? (
          <>
            <h1 className="text-2xl font-semibold">This film isn&rsquo;t here</h1>
            <p className="mt-2 text-ink-2">It may have been deleted, or it lives in another browser.</p>
            <Link href="/films" className="btn btn-primary mt-6">
              Back to my films
            </Link>
          </>
        ) : (
          <p className="text-mute">Opening the room…</p>
        )}
      </main>
    );
  }

  return (
    <div className="min-h-dvh md:pl-[248px]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line bg-canvas md:flex">
        <Link href="/films" className="flex items-center gap-2 px-5 pt-5 pb-4 text-sm font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-white">
            <Clapperboard size={15} />
          </span>
          Film Room
        </Link>

        <FilmCard film={film} />

        <nav aria-label="Film sections" className="mt-4 flex-1 overflow-y-auto px-3">
          <ul className="space-y-0.5">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={`${base}${item.href}`}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cx(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-[0.9rem] transition-colors",
                    isActive(item.href) ? "bg-surface font-medium text-ink shadow-[var(--shadow-card)]" : "text-ink-2 hover:bg-hover hover:text-ink",
                  )}
                >
                  <item.icon size={17} className={isActive(item.href) ? "text-accent" : "text-mute"} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-3">
          <button
            onClick={() => (onAI ? undefined : setThinking(true))}
            className={cx(
              "flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors",
              onAI ? "bg-accent text-white" : "bg-ink text-white hover:bg-black",
            )}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/12">
              <Sparkles size={17} />
            </span>
            <span>
              <span className="block text-sm font-semibold">Think with the film</span>
              <span className="block text-xs text-white/60">Your development producer</span>
            </span>
          </button>
          <Link href={`${base}/ai`} className="mt-1 block px-3 py-1.5 text-xs text-mute hover:text-ink">
            Open full conversation →
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/films" className="rounded-full p-1.5 text-ink-2 hover:bg-hover" aria-label="My films">
          <ChevronLeft size={20} />
        </Link>
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg">
          <Still image={film.cover} alt="" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{film.title}</p>
          <p className="truncate text-xs text-mute">
            {film.format} · {film.status} · {film.currentVersion}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 pt-6 pb-28 md:px-10 md:pt-10 md:pb-16">{children}</main>

      {/* Mobile tab bar */}
      <nav aria-label="Film sections" className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-line bg-surface/95 shadow-[var(--shadow-lift)] backdrop-blur md:hidden">
        <ul className="grid grid-cols-6 pb-[env(safe-area-inset-bottom)]">
          {NAV.filter((n) => MOBILE_TABS.includes(n.href)).map((item) => (
            <MobileTab key={item.href} href={`${base}${item.href}`} label={item.short ?? item.label} icon={item.icon} active={isActive(item.href)} />
          ))}
          <li className="grid place-items-center">
            <Link href={`${base}/ai`} aria-label="Think with the film" className={cx("grid h-11 w-11 place-items-center rounded-full text-white", onAI ? "bg-accent" : "bg-ink")}>
              <Sparkles size={18} />
            </Link>
          </li>
          <MobileTab href={`${base}/memory`} label="Memory" icon={History} active={isActive("/memory")} />
          <li>
            <button
              onClick={() => setMore(true)}
              className={cx("flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[0.65rem]", MORE.some(isActive) ? "text-accent" : "text-mute")}
            >
              <MoreHorizontal size={19} />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Drawer open={more} onClose={() => setMore(false)} title={film.title} eyebrow="Sections">
        <ul className="grid grid-cols-2 gap-2">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={`${base}${item.href}`}
                onClick={() => setMore(false)}
                className={cx("card flex items-center gap-3 p-4", isActive(item.href) && "ring-2 ring-accent")}
              >
                <item.icon size={18} className="text-accent" />
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/films" onClick={() => setMore(false)} className="btn btn-ghost mt-6">
          All my films
        </Link>
      </Drawer>

      <Drawer open={thinking} onClose={() => setThinking(false)} title="Think with the film" eyebrow="Development producer" wide>
        <ProducerConversation filmId={filmId} compact onNavigate={() => setThinking(false)} />
      </Drawer>
    </div>
  );
}

function FilmCard({ film }: { film: Film }) {
  return (
    <div className="mx-3 overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
      <div className="aspect-[16/9]">
        <Still image={film.cover} alt="" />
      </div>
      <div className="p-3">
        <p className="text-sm leading-snug font-semibold">{film.title}</p>
        <p className="mt-0.5 text-xs text-mute">
          {film.format} · {film.duration}
        </p>
        <div className="mt-2 flex gap-1.5">
          <Badge tone="accent">{film.status}</Badge>
          <Badge>{film.currentVersion}</Badge>
        </div>
      </div>
    </div>
  );
}

function MobileTab({ href, label, icon: Icon, active }: { href: string; label: string; icon: LucideIcon; active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cx("flex h-14 flex-col items-center justify-center gap-0.5 text-[0.65rem]", active ? "font-medium text-accent" : "text-mute")}
      >
        <Icon size={19} />
        {label}
      </Link>
    </li>
  );
}
