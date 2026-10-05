/**
 * A single, predictable reducer for all Film Room state.
 *
 * Every mutation goes through one of a handful of generic actions so that the
 * same intents can later be mapped 1:1 onto API calls (POST / PATCH / DELETE).
 */
import type {
  CollectionItem,
  CollectionKey,
  EntityRef,
  Film,
  FilmRoomState,
  ID,
} from "../types";
import { now } from "../utils";

export type Action =
  | { type: "hydrate"; state: FilmRoomState }
  | { type: "film/create"; film: Film }
  | { type: "film/update"; id: ID; patch: Partial<Film> }
  | { type: "film/delete"; id: ID }
  | { type: "theme/remove"; filmId: ID; theme: string }
  | { type: "item/create"; collection: CollectionKey; item: CollectionItem<CollectionKey> }
  | { type: "item/update"; collection: CollectionKey; id: ID; patch: Record<string, unknown> }
  | { type: "item/delete"; collection: CollectionKey; id: ID };

export const COLLECTIONS: CollectionKey[] = [
  "people",
  "storyNodes",
  "research",
  "visuals",
  "memories",
  "versions",
  "notes",
  "documents",
  "aiMessages",
];

/** Refs pointing at a deleted entity are removed everywhere so nothing dangles. */
function withoutRef(refs: EntityRef[], id: ID): EntityRef[] {
  return refs.some((r) => r.id === id) ? refs.filter((r) => r.id !== id) : refs;
}

function pruneReferences(state: FilmRoomState, id: ID): FilmRoomState {
  return {
    ...state,
    storyNodes: state.storyNodes.map((n) =>
      n.connections.includes(id) || n.personId === id
        ? {
            ...n,
            connections: n.connections.filter((c) => c !== id),
            personId: n.personId === id ? undefined : n.personId,
          }
        : n,
    ),
    research: state.research.map((r) => ({ ...r, connections: withoutRef(r.connections, id) })),
    notes: state.notes.map((n) => ({ ...n, connections: withoutRef(n.connections, id) })),
    documents: state.documents.map((d) => ({ ...d, connections: withoutRef(d.connections, id) })),
  };
}

/** Any change to a film's material counts as working on the film. */
function touchFilm(state: FilmRoomState, filmId: ID | undefined): FilmRoomState {
  if (!filmId) return state;
  const stamp = now();
  return {
    ...state,
    films: state.films.map((f) => (f.id === filmId ? { ...f, updatedAt: stamp } : f)),
  };
}

function filmIdOf(state: FilmRoomState, collection: CollectionKey, id: ID): ID | undefined {
  const list = state[collection] as Array<{ id: ID; filmId: ID }>;
  return list.find((x) => x.id === id)?.filmId;
}

export function reducer(state: FilmRoomState, action: Action): FilmRoomState {
  switch (action.type) {
    case "hydrate":
      return action.state;

    case "film/create":
      return { ...state, films: [action.film, ...state.films] };

    case "film/update":
      return {
        ...state,
        films: state.films.map((f) =>
          f.id === action.id ? { ...f, ...action.patch, updatedAt: now() } : f,
        ),
      };

    case "film/delete": {
      const next: FilmRoomState = { ...state, films: state.films.filter((f) => f.id !== action.id) };
      for (const key of COLLECTIONS) {
        (next[key] as Array<{ filmId: ID }>) = (state[key] as Array<{ filmId: ID }>).filter(
          (x) => x.filmId !== action.id,
        );
      }
      return next;
    }

    case "theme/remove": {
      const next: FilmRoomState = {
        ...state,
        films: state.films.map((f) =>
          f.id === action.filmId
            ? { ...f, themes: f.themes.filter((t) => t !== action.theme), updatedAt: now() }
            : f,
        ),
      };
      return pruneReferences(next, action.theme);
    }

    case "item/create": {
      const list = state[action.collection] as CollectionItem<CollectionKey>[];
      const next = { ...state, [action.collection]: [...list, action.item] } as FilmRoomState;
      return touchFilm(next, action.item.filmId);
    }

    case "item/update": {
      const list = state[action.collection] as Array<{ id: ID }>;
      const next = {
        ...state,
        [action.collection]: list.map((x) => (x.id === action.id ? { ...x, ...action.patch } : x)),
      } as FilmRoomState;
      return touchFilm(next, filmIdOf(state, action.collection, action.id));
    }

    case "item/delete": {
      const filmId = filmIdOf(state, action.collection, action.id);
      const list = state[action.collection] as Array<{ id: ID }>;
      const next = {
        ...state,
        [action.collection]: list.filter((x) => x.id !== action.id),
      } as FilmRoomState;
      return touchFilm(pruneReferences(next, action.id), filmId);
    }
  }
}
