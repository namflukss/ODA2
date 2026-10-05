"use client";

/**
 * Still — a film frame.
 *
 * Accepts either a real image (URL / data URL) or a key from a small library of
 * procedural "stills": colour fields, light and grain drawn in SVG. They stand in
 * for the filmmaker's own images in the MVP without resorting to stock photos.
 */
import { useId } from "react";
import { cx } from "@/lib/utils";

type Shape =
  | { kind: "rect"; x: number; y: number; w: number; h: number; fill: string; opacity?: number; blur?: number }
  | { kind: "circle"; cx: number; cy: number; r: number; fill: string; opacity?: number; blur?: number };

interface Preset {
  label: string;
  from: string;
  to: string;
  angle: number;
  shapes: Shape[];
  grain: number;
}

export const STILLS: Record<string, Preset> = {
  "dawn-window": {
    label: "Dawn window",
    from: "#2b2622",
    to: "#4a3a2c",
    angle: 90,
    grain: 0.22,
    shapes: [
      { kind: "rect", x: 52, y: 10, w: 30, h: 58, fill: "#f2c46f", opacity: 0.85, blur: 3 },
      { kind: "rect", x: 52, y: 22, w: 30, h: 2, fill: "#2b2622", opacity: 0.6 },
      { kind: "rect", x: 52, y: 36, w: 30, h: 2, fill: "#2b2622", opacity: 0.6 },
      { kind: "rect", x: 52, y: 50, w: 30, h: 2, fill: "#2b2622", opacity: 0.6 },
      { kind: "rect", x: 20, y: 70, w: 80, h: 40, fill: "#c98a4a", opacity: 0.35, blur: 8 },
    ],
  },
  corridor: {
    label: "Corridor",
    from: "#9aa596",
    to: "#5f6b60",
    angle: 0,
    grain: 0.18,
    shapes: [
      { kind: "rect", x: 38, y: 0, w: 24, h: 100, fill: "#dfe6d6", opacity: 0.5, blur: 2 },
      { kind: "rect", x: 46, y: 30, w: 8, h: 38, fill: "#3b443c", opacity: 0.75 },
      { kind: "rect", x: 0, y: 8, w: 100, h: 3, fill: "#f4f7ee", opacity: 0.8, blur: 0.6 },
      { kind: "rect", x: 48.5, y: 52, w: 3, h: 14, fill: "#c4432c", opacity: 0.8 },
    ],
  },
  "hospital-night": {
    label: "Hospital night",
    from: "#0f1720",
    to: "#1d2a38",
    angle: 135,
    grain: 0.28,
    shapes: [
      { kind: "circle", cx: 70, cy: 62, r: 10, fill: "#8fd1c4", opacity: 0.55, blur: 6 },
      { kind: "circle", cx: 70, cy: 62, r: 2.5, fill: "#d8fff4", opacity: 0.9 },
      { kind: "rect", x: 10, y: 74, w: 50, h: 30, fill: "#2d3d50", opacity: 0.6, blur: 4 },
    ],
  },
  skin: {
    label: "Skin",
    from: "#e5bfa3",
    to: "#c78f72",
    angle: 160,
    grain: 0.16,
    shapes: [
      { kind: "circle", cx: 30, cy: 40, r: 40, fill: "#f2d3bd", opacity: 0.6, blur: 10 },
      { kind: "circle", cx: 78, cy: 80, r: 28, fill: "#a86c55", opacity: 0.45, blur: 10 },
    ],
  },
  nursery: {
    label: "Nursery",
    from: "#e9dcd6",
    to: "#cfc6c2",
    angle: 180,
    grain: 0.14,
    shapes: [
      { kind: "rect", x: 0, y: 64, w: 100, h: 36, fill: "#b9b0ab", opacity: 0.6 },
      { kind: "rect", x: 18, y: 30, w: 26, h: 38, fill: "#f3e7e2", opacity: 0.8, blur: 1.5 },
      { kind: "circle", cx: 72, cy: 34, r: 9, fill: "#e8b9b0", opacity: 0.7, blur: 2 },
    ],
  },
  "archive-84": {
    label: "Archive 1984",
    from: "#c9b48d",
    to: "#7d6649",
    angle: 120,
    grain: 0.38,
    shapes: [
      { kind: "rect", x: 56, y: 6, w: 38, h: 44, fill: "#fff3d8", opacity: 0.85, blur: 5 },
      { kind: "circle", cx: 36, cy: 52, r: 16, fill: "#5b4733", opacity: 0.7, blur: 3 },
      { kind: "rect", x: 22, y: 64, w: 30, h: 40, fill: "#4c3b2a", opacity: 0.7, blur: 3 },
    ],
  },
  red: {
    label: "One red",
    from: "#b7392a",
    to: "#7f2318",
    angle: 45,
    grain: 0.22,
    shapes: [{ kind: "circle", cx: 40, cy: 45, r: 34, fill: "#d9573f", opacity: 0.5, blur: 12 }],
  },
  fog: {
    label: "Fog",
    from: "#c8c6c0",
    to: "#8f8c86",
    angle: 180,
    grain: 0.2,
    shapes: [
      { kind: "rect", x: 0, y: 40, w: 100, h: 20, fill: "#eeece6", opacity: 0.6, blur: 6 },
      { kind: "rect", x: 30, y: 48, w: 2, h: 22, fill: "#3a3833", opacity: 0.6, blur: 0.6 },
    ],
  },
  kitchen: {
    label: "Kitchen",
    from: "#d9a35a",
    to: "#8c5a2b",
    angle: 100,
    grain: 0.24,
    shapes: [
      { kind: "rect", x: 8, y: 12, w: 34, h: 40, fill: "#fbe3b0", opacity: 0.75, blur: 3 },
      { kind: "rect", x: 0, y: 70, w: 100, h: 30, fill: "#6e4520", opacity: 0.55 },
      { kind: "circle", cx: 74, cy: 58, r: 7, fill: "#2a1b0e", opacity: 0.6, blur: 1 },
    ],
  },
  sea: {
    label: "Sea",
    from: "#a9b8bf",
    to: "#4e6470",
    angle: 180,
    grain: 0.2,
    shapes: [
      { kind: "rect", x: 0, y: 0, w: 100, h: 46, fill: "#d8dfe0", opacity: 0.55, blur: 4 },
      { kind: "rect", x: 0, y: 46, w: 100, h: 1, fill: "#e8eeee", opacity: 0.9 },
    ],
  },
  grain: {
    label: "Grain",
    from: "#6b625a",
    to: "#3b3530",
    angle: 60,
    grain: 0.55,
    shapes: [{ kind: "circle", cx: 50, cy: 50, r: 36, fill: "#a19383", opacity: 0.4, blur: 14 }],
  },
  paper: {
    label: "Paper",
    from: "#e8e1d3",
    to: "#d5ccbb",
    angle: 135,
    grain: 0.16,
    shapes: [
      { kind: "rect", x: 14, y: 20, w: 34, h: 6, fill: "#b8ad98", opacity: 0.8 },
      { kind: "rect", x: 52, y: 40, w: 30, h: 6, fill: "#b8ad98", opacity: 0.8 },
      { kind: "rect", x: 24, y: 60, w: 52, h: 4, fill: "#a39880", opacity: 0.8 },
      { kind: "rect", x: 20, y: 74, w: 6, h: 18, fill: "#c4432c", opacity: 0.7 },
    ],
  },
};

export const STILL_KEYS = Object.keys(STILLS);

export function isStill(image: string | undefined): boolean {
  return !!image && image.startsWith("still:") && image.slice(6) in STILLS;
}

export function Still({
  image,
  alt,
  className,
}: {
  image?: string;
  alt: string;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");

  if (image && !image.startsWith("still:")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={alt} className={cx("h-full w-full object-cover", className)} />;
  }

  const preset = STILLS[image?.slice(6) ?? ""] ?? STILLS.paper;
  const rad = (preset.angle * Math.PI) / 180;
  const x2 = 50 + Math.cos(rad) * 50;
  const y2 = 50 + Math.sin(rad) * 50;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={alt}
      className={cx("h-full w-full", className)}
    >
      <defs>
        <linearGradient id={`g${uid}`} x1={`${100 - x2}%`} y1={`${100 - y2}%`} x2={`${x2}%`} y2={`${y2}%`}>
          <stop offset="0" stopColor={preset.from} />
          <stop offset="1" stopColor={preset.to} />
        </linearGradient>
        <filter id={`n${uid}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        {preset.shapes.map((s, i) =>
          s.blur ? (
            <filter key={i} id={`b${uid}${i}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={s.blur} />
            </filter>
          ) : null,
        )}
      </defs>
      <rect width="100" height="100" fill={`url(#g${uid})`} />
      {preset.shapes.map((s, i) => {
        const common = {
          fill: s.fill,
          opacity: s.opacity ?? 1,
          filter: s.blur ? `url(#b${uid}${i})` : undefined,
        };
        return s.kind === "rect" ? (
          <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} {...common} />
        ) : (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} {...common} />
        );
      })}
      <rect width="100" height="100" filter={`url(#n${uid})`} opacity={preset.grain} style={{ mixBlendMode: "overlay" }} />
    </svg>
  );
}
