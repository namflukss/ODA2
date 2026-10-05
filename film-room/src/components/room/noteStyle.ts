import type { Tone } from "@/components/ui/forms";
import type { NoteCategory } from "@/lib/types";

/** Each kind of note gets its own soft colour on the wall. */
export const NOTE_TONE: Record<NoteCategory, Tone> = {
  thought: "sky",
  observation: "sage",
  scene: "ochre",
  question: "accent",
  feeling: "plum",
  image: "neutral",
};

export const NOTE_BG: Record<NoteCategory, string> = {
  thought: "bg-surface",
  observation: "bg-surface",
  scene: "bg-[#fffaf0]",
  question: "bg-[#fff7f4]",
  feeling: "bg-[#fcf8fb]",
  image: "bg-surface",
};
