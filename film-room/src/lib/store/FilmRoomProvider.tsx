"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { seedState } from "@/data/seed";
import type {
  CollectionItem,
  CollectionKey,
  Film,
  FilmRoomState,
  ID,
} from "../types";
import { createId, now } from "../utils";
import { reducer, type Action } from "./reducer";
import { localStorageAdapter, type StateStorage } from "./persistence";

type NewItem<K extends CollectionKey> = Omit<CollectionItem<K>, "id"> & { id?: ID };

export interface FilmRoomActions {
  createFilm(input: Pick<Film, "title" | "format" | "duration" | "logline">): Film;
  updateFilm(id: ID, patch: Partial<Film>): void;
  deleteFilm(id: ID): void;
  removeTheme(filmId: ID, theme: string): void;
  create<K extends CollectionKey>(collection: K, item: NewItem<K>): CollectionItem<K>;
  update<K extends CollectionKey>(collection: K, id: ID, patch: Partial<CollectionItem<K>>): void;
  remove(collection: CollectionKey, id: ID): void;
  resetToSample(): void;
}

interface FilmRoomContextValue {
  state: FilmRoomState;
  hydrated: boolean;
  actions: FilmRoomActions;
}

const FilmRoomContext = createContext<FilmRoomContextValue | null>(null);

const ID_PREFIX: Record<CollectionKey, string> = {
  people: "p",
  storyNodes: "n",
  research: "r",
  visuals: "v",
  memories: "m",
  versions: "ver",
  notes: "note",
  documents: "doc",
  aiMessages: "msg",
};

export function FilmRoomProvider({
  children,
  storage = localStorageAdapter,
}: {
  children: ReactNode;
  storage?: StateStorage;
}) {
  const [state, dispatch] = useReducer(reducer, seedState);
  const [hydrated, setHydrated] = useState(false);
  const storageRef = useRef(storage);

  // Load persisted state once on the client.
  useEffect(() => {
    let cancelled = false;
    storageRef.current.load().then((saved) => {
      if (cancelled) return;
      if (saved) dispatch({ type: "hydrate", state: { ...seedState, ...saved } });
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist after every change once hydrated.
  useEffect(() => {
    if (hydrated) void storageRef.current.save(state);
  }, [state, hydrated]);

  const send = useCallback((action: Action) => dispatch(action), []);

  const actions = useMemo<FilmRoomActions>(
    () => ({
      createFilm(input) {
        const stamp = now();
        const film: Film = {
          id: createId("film"),
          status: "First idea",
          currentVersion: "V01",
          description: "",
          understanding: "",
          themes: [],
          currentQuestions: [],
          openQuestions: [],
          cover: "still:paper",
          createdAt: stamp,
          updatedAt: stamp,
          ...input,
        };
        send({ type: "film/create", film });
        return film;
      },
      updateFilm: (id, patch) => send({ type: "film/update", id, patch }),
      deleteFilm: (id) => send({ type: "film/delete", id }),
      removeTheme: (filmId, theme) => send({ type: "theme/remove", filmId, theme }),
      create(collection, item) {
        const full = { ...item, id: item.id ?? createId(ID_PREFIX[collection]) } as CollectionItem<
          typeof collection
        >;
        send({ type: "item/create", collection, item: full });
        return full;
      },
      update: (collection, id, patch) =>
        send({ type: "item/update", collection, id, patch: patch as Record<string, unknown> }),
      remove: (collection, id) => send({ type: "item/delete", collection, id }),
      resetToSample() {
        void storageRef.current.clear();
        send({ type: "hydrate", state: seedState });
      },
    }),
    [send],
  );

  const value = useMemo(() => ({ state, hydrated, actions }), [state, hydrated, actions]);
  return <FilmRoomContext.Provider value={value}>{children}</FilmRoomContext.Provider>;
}

export function useFilmRoom(): FilmRoomContextValue {
  const ctx = useContext(FilmRoomContext);
  if (!ctx) throw new Error("useFilmRoom must be used inside <FilmRoomProvider>");
  return ctx;
}
