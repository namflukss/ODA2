"use client";

import { Still } from "@/components/ui/Still";
import { Badge, type Tone } from "@/components/ui/forms";
import type { Person, StoryNode } from "@/lib/types";
import { cx } from "@/lib/utils";
import { STORY_NODE_LABEL } from "@/lib/vocabulary";

/** Width per node type — also used to place the anchor that connections attach to. */
export const NODE_WIDTH: Record<StoryNode["type"], number> = {
  film: 250,
  scene: 210,
  turning_point: 210,
  theme: 200,
  question: 240,
  idea: 190,
  character: 180,
};

export const NODE_TONE: Record<StoryNode["type"], Tone> = {
  film: "dark",
  scene: "ochre",
  turning_point: "accent",
  theme: "sage",
  question: "accent",
  idea: "sky",
  character: "plum",
};

/** One card on the map. Purely visual; interaction lives in StoryMap. */
export function StoryNodeCard({
  node,
  person,
  selected,
  dimmed,
  connecting,
}: {
  node: StoryNode;
  person?: Person;
  selected?: boolean;
  dimmed?: boolean;
  connecting?: boolean;
}) {
  const base = cx(
    "relative rounded-2xl border shadow-[var(--shadow-card)] transition-[opacity,box-shadow] duration-200 hover:shadow-[var(--shadow-lift)]",
    dimmed && "opacity-30",
    selected && "ring-2 ring-accent ring-offset-2 ring-offset-sunken",
    connecting && "hover:ring-2 hover:ring-ink",
  );
  const anchor = <span aria-hidden className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full border-2 border-surface bg-ink-2" />;

  switch (node.type) {
    case "film":
      return (
        <div className={cx(base, "border-ink bg-ink p-4 text-white")}>
          {anchor}
          <p className="text-xs font-medium text-white/60">The film</p>
          <p className="serif mt-1 text-lg leading-snug italic">{node.content}</p>
        </div>
      );
    case "theme":
      return (
        <div className={cx(base, "border-transparent bg-sage-soft px-4 py-3 text-center")}>
          {anchor}
          <p className="text-[0.7rem] font-medium text-[#4d6853]">Theme</p>
          <p className="serif text-[1.35rem] leading-tight italic">{node.title}</p>
        </div>
      );
    case "question":
      return (
        <div className={cx(base, "border-transparent bg-accent-soft p-4")}>
          {anchor}
          <p className="text-[0.7rem] font-medium text-accent-deep">Question</p>
          <p className="serif mt-0.5 text-lg leading-snug">{node.title}</p>
        </div>
      );
    case "character":
      return (
        <div className={cx(base, "flex items-center gap-3 border-line bg-surface p-2.5")}>
          {anchor}
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
            <Still image={person?.portrait ?? "still:paper"} alt="" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{node.title}</p>
            <p className="truncate text-xs text-mute">{person?.role ?? "Character"}</p>
          </div>
        </div>
      );
    default:
      return (
        <div className={cx(base, "border-line p-3.5", node.type === "idea" ? "bg-ochre-soft border-transparent" : "bg-surface")}>
          {anchor}
          <Badge tone={NODE_TONE[node.type]}>{STORY_NODE_LABEL[node.type]}</Badge>
          <p className="mt-2 leading-snug font-semibold">{node.title}</p>
        </div>
      );
  }
}
