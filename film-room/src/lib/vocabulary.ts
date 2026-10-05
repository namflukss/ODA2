/**
 * Human-facing labels for the data model's enumerations.
 * Kept in one place so UI copy stays consistent across the room.
 */
import type {
  DocumentType,
  FilmFormat,
  FilmStatus,
  MemoryType,
  NoteCategory,
  Pronouns,
  RefType,
  ResearchType,
  StoryNodeType,
  StoryView,
  VersionType,
  VisualCategory,
} from "./types";

export const FILM_FORMATS: FilmFormat[] = [
  "Documentary",
  "Fiction",
  "Hybrid",
  "Essay film",
  "Series",
  "Experimental",
];

export const FILM_STATUSES: FilmStatus[] = [
  "First idea",
  "Development",
  "Outline",
  "Treatment",
  "Script",
  "Shooting",
  "Editing",
  "Finished",
];

export const STORY_NODE_LABEL: Record<StoryNodeType, string> = {
  film: "The film",
  scene: "Scene",
  theme: "Theme",
  question: "Question",
  idea: "Idea",
  character: "Character",
  turning_point: "Turning point",
};

export const STORY_NODE_TYPES: StoryNodeType[] = [
  "scene",
  "turning_point",
  "theme",
  "question",
  "idea",
  "character",
];

export const STORY_VIEWS: { id: StoryView; label: string; types: StoryNodeType[]; hint: string }[] = [
  {
    id: "structure",
    label: "Structure",
    types: ["film", "scene", "turning_point", "idea", "question", "theme", "character"],
    hint: "The whole wall. Scenes, turns, ideas and what holds them together.",
  },
  {
    id: "themes",
    label: "Themes",
    types: ["film", "theme", "question", "scene", "turning_point"],
    hint: "What the film is about, and where each idea surfaces.",
  },
  {
    id: "characters",
    label: "Characters",
    types: ["film", "character", "scene", "turning_point"],
    hint: "Who carries which moment.",
  },
];

export const RESEARCH_TYPE_LABEL: Record<ResearchType, string> = {
  article: "Article",
  book: "Book",
  film: "Film",
  photograph: "Photograph",
  interview: "Interview",
  document: "Document",
  screenshot: "Screenshot",
  note: "Note",
};
export const RESEARCH_TYPES = Object.keys(RESEARCH_TYPE_LABEL) as ResearchType[];

export const VISUAL_CATEGORY_LABEL: Record<VisualCategory, string> = {
  image: "Image",
  color: "Colour",
  light: "Light",
  camera: "Camera",
  texture: "Texture",
  location: "Location",
  archive: "Archive",
  reference_film: "Reference films",
};
export const VISUAL_CATEGORIES = Object.keys(VISUAL_CATEGORY_LABEL) as VisualCategory[];

export const MEMORY_TYPE_LABEL: Record<MemoryType, string> = {
  decision: "Decision",
  change: "Change",
  deleted_idea: "Deleted idea",
  open_question: "Open question",
  milestone: "Milestone",
};
export const MEMORY_TYPE_PLURAL: Record<MemoryType, string> = {
  decision: "Decisions",
  change: "Changes",
  deleted_idea: "Deleted ideas",
  open_question: "Open questions",
  milestone: "Milestones",
};
export const MEMORY_TYPES = Object.keys(MEMORY_TYPE_LABEL) as MemoryType[];

export const NOTE_CATEGORY_LABEL: Record<NoteCategory, string> = {
  thought: "Thought",
  observation: "Observation",
  scene: "Scene",
  question: "Question",
  feeling: "Feeling",
  image: "Image",
};
export const NOTE_CATEGORIES = Object.keys(NOTE_CATEGORY_LABEL) as NoteCategory[];

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  treatment: "Treatment",
  outline: "Outline",
  scene_ideas: "Scene ideas",
  fragment: "Screenplay fragment",
  notes: "Notes",
};
export const DOCUMENT_TYPES = Object.keys(DOCUMENT_TYPE_LABEL) as DocumentType[];

export const VERSION_TYPES: VersionType[] = [
  "First idea",
  "Outline",
  "Treatment",
  "Script",
  "Rough cut",
  "Fine cut",
];

export const REF_TYPE_LABEL: Record<RefType, string> = {
  story: "Story",
  scene: "Scene",
  character: "Character",
  theme: "Theme",
  question: "Question",
  research: "Research",
  visual: "Visual",
  note: "Note",
  document: "Writing",
};

export const PRONOUN_FORMS: Record<Pronouns, { who: string; wants: string; fears: string }> = {
  she: { who: "Who she is", wants: "What she wants", fears: "What she fears" },
  he: { who: "Who he is", wants: "What he wants", fears: "What he fears" },
  they: { who: "Who they are", wants: "What they want", fears: "What they fear" },
};
