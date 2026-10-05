"use client";

import { useMemo } from "react";
import type { CollectionKey, FilmCollections, ID } from "../types";
import { useFilmRoom } from "./FilmRoomProvider";

/** The film record plus whether the store has finished loading. */
export function useFilm(filmId: ID) {
  const { state, hydrated } = useFilmRoom();
  const film = state.films.find((f) => f.id === filmId);
  return { film, hydrated };
}

/** One collection, scoped to a film. */
export function useCollection<K extends CollectionKey>(collection: K, filmId: ID): FilmCollections[K] {
  const { state } = useFilmRoom();
  const list = state[collection];
  return useMemo(
    () => (list as Array<{ filmId: ID }>).filter((x) => x.filmId === filmId) as FilmCollections[K],
    [list, filmId],
  );
}

export function useActions() {
  return useFilmRoom().actions;
}
