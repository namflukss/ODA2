"use client";

import { Still } from "@/components/ui/Still";
import type { Person, StoryNode } from "@/lib/types";
import { cx } from "@/lib/utils";
import { STORY_NODE_LABEL } from "@/lib/vocabulary";

/** Width per node type — also used to place the pin that strings attach to. */
export const NODE_WIDTH: Record<StoryNode["type"], number> = {
  film: 250,
  scene: 210,
  turning_point: 210,
  theme: 230,
  question: 250,
  idea: 190,
  character: 170,
};

/** One piece of paper on the wall. Purely visual; interaction lives in StoryMap. */
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
    "relative transition-[opacity,box-shadow] duration-200",
    dimmed && "opacity-35",
    selected && "shadow-[0_0_0_1.5px_var(--color-red)]",
    connecting && "hover:shadow-[0_0_0_1.5px_var(--color-ink)]",
  );
  const pin = (
    <span aria-hidden className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border border-red-deep bg-red shadow-[1px_2px_0_rgba(0,0,0,0.15)]" />
  );

  switch (node.type) {
    case "film":
      return (
        <div className={cx(base, "bg-ink p-5 text-paper")}>
          {pin}
          <p className="eyebrow text-red">The film</p>
          <p className="serif mt-2 text-lg leading-snug italic">{node.content}</p>
        </div>
      );
    case "theme":
      return (
        <div className={cx(base, "px-2 pt-4 pb-2 text-center")}>
          {pin}
          <p className="eyebrow text-mute">Theme</p>
          <p className="serif mt-1 text-[1.65rem] leading-[1.05] italic">{node.title}</p>
        </div>
      );
    case "question":
      return (
        <div className={cx(base, "border-y border-red px-1 pt-4 pb-3")}>
          {pin}
          <p className="eyebrow text-red">Question</p>
          <p className="serif mt-1 text-xl leading-snug text-red italic">{node.title}</p>
        </div>
      );
    case "idea":
      return (
        <div className={cx(base, "bg-[#efdca8] p-4 -rotate-1")}>
          {pin}
          <p className="eyebrow text-ink/60">Idea</p>
          <p className="mt-1 text-sm leading-snug font-semibold">{node.title}</p>
        </div>
      );
    case "character":
      return (
        <div className={cx(base, "flex items-center gap-3 border border-ink bg-card p-2.5")}>
          {pin}
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full">
            <Still image={person?.portrait ?? "still:paper"} alt="" />
          </div>
          <div className="min-w-0">
            <p className="eyebrow text-[0.6rem] text-mute">{person?.role ?? "Character"}</p>
            <p className="truncate text-base font-extrabold uppercase">{node.title}</p>
          </div>
        </div>
      );
    default:
      return (
        <div className={cx(base, "border border-rule bg-card p-4", node.type === "turning_point" && "border-t-[3px] border-t-red")}>
          {pin}
          <p className={cx("eyebrow", node.type === "turning_point" ? "text-red" : "text-mute")}>{STORY_NODE_LABEL[node.type]}</p>
          <p className="mt-1.5 text-[1.05rem] leading-[1.1] font-extrabold tracking-tight uppercase">{node.title}</p>
        </div>
      );
  }
}
