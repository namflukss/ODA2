/**
 * Minimal pointer-drag helper shared by the Room and the Story wall.
 * Distinguishes a click from a drag with a small movement threshold.
 */
import type { Point } from "./types";

interface DragHandlers {
  onMove: (p: Point) => void;
  onEnd: (p: Point) => void;
  onClick?: () => void;
  bounds?: { minX: number; minY: number; maxX: number; maxY: number };
}

export function startDrag(e: React.PointerEvent, origin: Point, h: DragHandlers) {
  if (e.button !== 0) return;
  const startX = e.clientX;
  const startY = e.clientY;
  let dragging = false;
  let last = origin;
  const clamp = (p: Point): Point =>
    h.bounds
      ? {
          x: Math.min(Math.max(p.x, h.bounds.minX), h.bounds.maxX),
          y: Math.min(Math.max(p.y, h.bounds.minY), h.bounds.maxY),
        }
      : p;

  const move = (ev: PointerEvent) => {
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    if (!dragging && Math.hypot(dx, dy) < 4) return;
    dragging = true;
    ev.preventDefault();
    last = clamp({ x: Math.round(origin.x + dx), y: Math.round(origin.y + dy) });
    h.onMove(last);
  };
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
    if (dragging) h.onEnd(last);
    else h.onClick?.();
  };
  window.addEventListener("pointermove", move, { passive: false });
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
}

/** Arrow-key nudging for keyboard users. Returns null when the key isn't an arrow. */
export function nudge(e: React.KeyboardEvent, p: Point, step = 16): Point | null {
  const s = e.shiftKey ? step * 4 : step;
  switch (e.key) {
    case "ArrowLeft":
      return { x: p.x - s, y: p.y };
    case "ArrowRight":
      return { x: p.x + s, y: p.y };
    case "ArrowUp":
      return { x: p.x, y: p.y - s };
    case "ArrowDown":
      return { x: p.x, y: p.y + s };
    default:
      return null;
  }
}
