/**
 * Film Room — core data model.
 *
 * The film is the project. Every other entity belongs to a film via `filmId`.
 * These types are deliberately plain (JSON-serialisable) so the same shapes
 * can be persisted locally today and sent to / received from a backend later.
 */

export type ID = string;
export type ISODate = string;

/* ------------------------------------------------------------------ */
/* Cross-entity references                                             */
/* ------------------------------------------------------------------ */

/**
 * A pointer from one piece of material to another part of the film.
 * Themes are stored on the film itself, so a theme ref uses the theme name as `id`.
 */
export type RefType =
  | "story"
  | "scene"
  | "character"
  | "theme"
  | "question"
  | "research"
  | "visual"
  | "note"
  | "document";

export interface EntityRef {
  type: RefType;
  id: ID;
}

export interface Point {
  x: number;
  y: number;
}

/* ------------------------------------------------------------------ */
/* Film                                                                */
/* ------------------------------------------------------------------ */

export type FilmFormat =
  | "Documentary"
  | "Fiction"
  | "Hybrid"
  | "Essay film"
  | "Series"
  | "Experimental";

export type FilmStatus =
  | "First idea"
  | "Development"
  | "Outline"
  | "Treatment"
  | "Script"
  | "Shooting"
  | "Editing"
  | "Finished";

export interface Film {
  id: ID;
  title: string;
  format: FilmFormat;
  duration: string;
  status: FilmStatus;
  currentVersion: string;
  logline: string;
  description: string;
  /** What we're trying to understand — the film's inner inquiry. */
  understanding: string;
  themes: string[];
  currentQuestions: string[];
  openQuestions: string[];
  /** Key into the procedural still library, or an image URL / data URL. */
  cover: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export type PersonType = "participant" | "character";
export type Pronouns = "she" | "he" | "they";

export interface Person {
  id: ID;
  filmId: ID;
  name: string;
  role: string;
  type: PersonType;
  pronouns: Pronouns;
  description: string;
  wants: string;
  fears: string;
  unknowns: string;
  notes: string;
  interviewNotes: string;
  /** Free-text important moments; story nodes linked to the person are shown alongside. */
  moments: string[];
  portrait: string;
}

/* ------------------------------------------------------------------ */
/* Story                                                               */
/* ------------------------------------------------------------------ */

export type StoryNodeType =
  | "film"
  | "scene"
  | "theme"
  | "question"
  | "idea"
  | "character"
  | "turning_point";

export type StoryView = "structure" | "themes" | "characters";

export interface StoryNode {
  id: ID;
  filmId: ID;
  type: StoryNodeType;
  title: string;
  content: string;
  /** Position on the wall for the structure view. */
  position: Point;
  /** Optional per-view positions; falls back to `position`. */
  positions?: Partial<Record<StoryView, Point>>;
  /** Ids of other story nodes this one is pinned to. Undirected. */
  connections: ID[];
  /** Optional link to a person when the node is a character. */
  personId?: ID;
}

/* ------------------------------------------------------------------ */
/* Research                                                            */
/* ------------------------------------------------------------------ */

export type ResearchType =
  | "article"
  | "book"
  | "film"
  | "photograph"
  | "interview"
  | "document"
  | "screenshot"
  | "note";

export interface ResearchItem {
  id: ID;
  filmId: ID;
  title: string;
  type: ResearchType;
  description: string;
  source: string;
  image?: string;
  tags: string[];
  connections: EntityRef[];
  createdAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Visual world                                                        */
/* ------------------------------------------------------------------ */

export type VisualCategory =
  | "image"
  | "color"
  | "light"
  | "camera"
  | "texture"
  | "location"
  | "archive"
  | "reference_film";

export interface VisualReference {
  id: ID;
  filmId: ID;
  image: string;
  title: string;
  annotation: string;
  category: VisualCategory;
  /** Relative tile height for the masonry board. */
  aspect: "tall" | "square" | "wide";
}

/* ------------------------------------------------------------------ */
/* Memory & versions                                                   */
/* ------------------------------------------------------------------ */

export type MemoryType =
  | "decision"
  | "change"
  | "deleted_idea"
  | "open_question"
  | "milestone";

export interface FilmMemory {
  id: ID;
  filmId: ID;
  date: ISODate;
  type: MemoryType;
  title: string;
  description: string;
  reason: string;
}

export type VersionType =
  | "First idea"
  | "Outline"
  | "Treatment"
  | "Script"
  | "Rough cut"
  | "Fine cut";

export interface Version {
  id: ID;
  filmId: ID;
  versionNumber: number;
  title: string;
  type: VersionType;
  date: ISODate;
  summary: string;
  changes: string[];
  removed: string[];
  emerged: string[];
}

/* ------------------------------------------------------------------ */
/* Notes — the Room                                                    */
/* ------------------------------------------------------------------ */

export type NoteCategory =
  | "thought"
  | "observation"
  | "scene"
  | "question"
  | "feeling"
  | "image";

export interface Note {
  id: ID;
  filmId: ID;
  content: string;
  category: NoteCategory;
  position: Point;
  connections: EntityRef[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Writing — script / treatment                                        */
/* ------------------------------------------------------------------ */

export type DocumentType =
  | "treatment"
  | "outline"
  | "scene_ideas"
  | "fragment"
  | "notes";

export interface WritingDocument {
  id: ID;
  filmId: ID;
  type: DocumentType;
  title: string;
  content: string;
  connections: EntityRef[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* AI                                                                  */
/* ------------------------------------------------------------------ */

export interface AIMessage {
  id: ID;
  filmId: ID;
  role: "user" | "producer";
  content: string;
  timestamp: ISODate;
}

/* ------------------------------------------------------------------ */
/* Application state                                                   */
/* ------------------------------------------------------------------ */

/** Collections that belong to a film (everything except films themselves). */
export interface FilmCollections {
  people: Person[];
  storyNodes: StoryNode[];
  research: ResearchItem[];
  visuals: VisualReference[];
  memories: FilmMemory[];
  versions: Version[];
  notes: Note[];
  documents: WritingDocument[];
  aiMessages: AIMessage[];
}

export type CollectionKey = keyof FilmCollections;

export type CollectionItem<K extends CollectionKey> = FilmCollections[K][number];

export interface FilmRoomState extends FilmCollections {
  films: Film[];
}
