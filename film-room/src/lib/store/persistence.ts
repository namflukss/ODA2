/**
 * Persistence adapter.
 *
 * The MVP keeps everything in localStorage. A backend implementation only has to
 * satisfy the same `StateStorage` interface (e.g. GET /api/state, PUT /api/state,
 * or per-collection endpoints) — the provider and UI don't change.
 */
import type { FilmRoomState } from "../types";

export interface StateStorage {
  load(): Promise<FilmRoomState | null>;
  save(state: FilmRoomState): Promise<void>;
  clear(): Promise<void>;
}

const KEY = "film-room/state/v1";

export const localStorageAdapter: StateStorage = {
  async load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as FilmRoomState) : null;
    } catch {
      return null;
    }
  },
  async save(state) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked: the session keeps working in memory.
    }
  },
  async clear() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};
