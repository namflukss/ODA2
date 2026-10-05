import type { ISODate } from "./types";

export function createId(prefix = "id"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

export function now(): ISODate {
  return new Date().toISOString();
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "October 4" */
export function formatDay(date: ISODate): string {
  const d = new Date(date);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "October 2026" */
export function formatMonth(date: ISODate): string {
  const d = new Date(date);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Today", "Yesterday", "3 days ago", "September 21" */
export function formatRelative(date: ISODate, reference = new Date()): string {
  const d = new Date(date);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(reference) - startOf(d)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDay(date);
}

export function formatTime(date: ISODate): string {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Editorial numbering: 1 → "01" */
export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function versionLabel(n: number): string {
  return `V${pad(n)}`;
}

const STOPWORDS = new Set(
  "a an and are as at be been but by can could did do does for from had has have her hers him his how i if in into is it its just me more my no not of on or our she so than that the their them then there these they this to too was we were what when where which who why will with would you your about after again all also am any because before being between both each few further here just most only other over same should some such through under until very while dont isnt its".split(
    " ",
  ),
);

/** Lower-cased content words, used by the mocked AI for matching. */
export function keywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, "").replace(/'s$/, ""))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/** Rough stem so "bonding" matches "bond", "fears" matches "fear". */
export function stem(word: string): string {
  return word.replace(/(ing|ed|es|s)$/, "");
}

export function overlapScore(a: string, b: string): number {
  const as = new Set(keywords(a).map(stem));
  let score = 0;
  for (const w of new Set(keywords(b).map(stem))) if (as.has(w)) score++;
  return score;
}
