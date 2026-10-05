/**
 * Mocked Development Producer.
 *
 * Not an LLM — a set of readings over the real film context. It never answers
 * generically: every response is assembled from the film's own material, which
 * keeps the MVP honest about what the real model will be asked to do.
 */
import type { FilmMemory, Person, StoryNode } from "../types";
import { formatDay, keywords, overlapScore, pad, stem } from "../utils";
import type { FilmContext } from "./context";
import type { AskInput, FilmAIProvider, NoteSuggestions, SuggestInput } from "./types";

/** Generic associations that let the mock recognise a theme without the word itself. */
const THEME_LEXICON: Record<string, string[]> = {
  motherhood: ["mother", "mum", "mom", "baby", "birth", "maternal", "daughter", "son", "child", "bottle", "nurse"],
  identity: ["who", "self", "name", "identity", "become", "became", "person", "role"],
  recognition: ["recognise", "recognize", "seen", "see", "name", "called", "acknowledge", "form", "bracelet", "guest"],
  fear: ["fear", "afraid", "scared", "terrified", "anxious", "panic", "worry", "dread"],
  intimacy: ["touch", "hold", "close", "skin", "intimate", "body", "arms", "breath"],
  family: ["family", "father", "dad", "mother", "parents", "kitchen", "home", "sister", "brother"],
  responsibility: ["responsible", "care", "alone", "protect", "duty", "checking", "check", "breathing"],
};

const byScore = <T,>(items: T[], score: (t: T) => number) =>
  items
    .map((item, i) => ({ item, s: score(item), i }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.item);

function themeScore(theme: string, text: string): number {
  const words = new Set(keywords(text).map(stem));
  const own = keywords(theme).map(stem);
  const lex = (THEME_LEXICON[theme.toLowerCase()] ?? []).map(stem);
  let s = 0;
  for (const w of own) if (words.has(w)) s += 3;
  for (const w of lex) if (words.has(w)) s += 1;
  return s;
}

function mentionedPeople(ctx: FilmContext, text: string): Person[] {
  const lower = text.toLowerCase();
  return ctx.people.filter((p) => new RegExp(`\\b${p.name.toLowerCase()}\\b`).test(lower));
}

function mainSubject(ctx: FilmContext): Person | undefined {
  return ctx.people.find((p) => /main/i.test(p.role)) ?? ctx.people[0];
}

const scenesOf = (ctx: FilmContext) =>
  ctx.story
    .filter((n) => n.type === "scene" || n.type === "turning_point")
    .sort((a, b) => a.position.x - b.position.x);

/** "Birth" → "The birth"; longer titles are kept as written. */
const sceneLabel = (n: StoryNode) =>
  /\s/.test(n.title.trim()) ? n.title : `The ${n.title.toLowerCase()}`;

const latest = (ctx: FilmContext, type: FilmMemory["type"]) => ctx.memories.find((m) => m.type === type);

/* ------------------------------------------------------------------ */
/* Readings                                                            */
/* ------------------------------------------------------------------ */

function readCentre(ctx: FilmContext): string {
  const first = ctx.versions[ctx.versions.length - 1];
  const current = ctx.versions[0];
  const shift = current?.emerged[0];
  if (!first || !current || first === current || !shift) return readGeneral(ctx);

  // Strongest three, then told in the order they happen in the film.
  const support = byScore(scenesOf(ctx), (n) => overlapScore(shift, `${n.title} ${n.content}`))
    .slice(0, 3)
    .sort((a, b) => a.position.x - b.position.x);
  const scenes = support.length ? support : scenesOf(ctx).slice(0, 3);
  const words = ["One scene supports", "Two scenes support", "Three scenes support"];

  return [
    "## WHAT I'M SEEING",
    "The centre of the film seems to have shifted.",
    "",
    "Originally:",
    `> ${first.summary}`,
    "",
    "Latest material:",
    `> ${shift}`,
    "",
    `${words[scenes.length - 1]} this shift:`,
    ...scenes.map((n, i) => `${pad(i + 1)} / ${sceneLabel(n)}`),
    "",
    "## WHAT TO DECIDE",
    "You may want to decide whether this is a new direction or something the film should resist.",
    latest(ctx, "open_question")
      ? `It also answers, partly, a question you logged on ${formatDay(latest(ctx, "open_question")!.date)}: “${latest(ctx, "open_question")!.description}”`
      : "",
  ]
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n");
}

function readPerson(ctx: FilmContext, p: Person): string {
  const linkedNode = ctx.story.find((n) => n.personId === p.id);
  const moments = ctx.story.filter(
    (n) => (n.type === "scene" || n.type === "turning_point") && (linkedNode?.connections.includes(n.id) || n.connections.includes(linkedNode?.id ?? "") || n.content.includes(p.name)),
  );
  const research = ctx.research.filter((r) => r.connections.some((c) => c.id === p.id));
  const notes = ctx.notes.filter((n) => n.content.includes(p.name) || n.connections.some((c) => c.id === p.id));
  return [
    `## ${p.name.toUpperCase()} AS THE FILM SEES ${p.pronouns === "she" ? "HER" : p.pronouns === "he" ? "HIM" : "THEM"}`,
    `${p.name} wants: ${p.wants || "— not written yet."}`,
    "",
    `${p.name} fears: ${p.fears || "— not written yet."}`,
    "",
    "## WHERE THAT LIVES ON SCREEN",
    ...(moments.length
      ? moments.slice(0, 4).map((n, i) => `${pad(i + 1)} / ${n.title}`)
      : [`Nothing on the story wall carries ${p.name} yet. That's worth noticing.`]),
    "",
    research.length || notes.length
      ? `You also have ${research.length} piece${research.length === 1 ? "" : "s"} of research and ${notes.length} note${notes.length === 1 ? "" : "s"} about ${p.name}.`
      : "",
    "## WHAT WE DON'T KNOW",
    `> ${p.unknowns || "Nothing logged — which may mean you think you know more than you do."}`,
    "",
    `The gap between what ${p.name} wants and what ${p.name} fears is where the scenes are. Which moment on the wall puts both in the same room?`,
  ].join("\n");
}

function readStructure(ctx: FilmContext): string {
  const scenes = scenesOf(ctx);
  const orphans = ctx.story.filter(
    (n) => n.type !== "film" && n.connections.length === 0 && !ctx.story.some((o) => o.connections.includes(n.id)),
  );
  const turns = scenes.filter((n) => n.type === "turning_point");
  return [
    "## THE SHAPE ON THE WALL",
    "Reading left to right, the film currently moves like this:",
    ...scenes.map((n, i) => `${pad(i + 1)} / ${n.title}${n.type === "turning_point" ? " — turn" : ""}`),
    "",
    turns.length
      ? `The weight sits on ${turns.length === 1 ? "one turn" : `${turns.length} turns`}: ${turns.map((t) => t.title).join(" and ")}. Everything before ${turns[0].title.toLowerCase()} is waiting; the question is whether the audience feels that waiting as Dana does or simply sits through it.`
      : "There is no turning point on the wall yet. The film may be a portrait rather than a story — decide whether that's intentional.",
    "",
    ...(orphans.length
      ? ["## LOOSE ON THE WALL", ...orphans.slice(0, 3).map((n, i) => `${pad(i + 1)} / ${n.title}`), "", "These aren't connected to anything yet. Either they belong somewhere, or they belong in Film Memory as deleted ideas."]
      : []),
  ].join("\n");
}

function readTheme(ctx: FilmContext, theme: string): string {
  const carriers = byScore(ctx.story.filter((n) => n.type !== "film"), (n) => themeScore(theme, `${n.title} ${n.content}`));
  const research = ctx.research.filter((r) => r.connections.some((c) => c.type === "theme" && c.id === theme));
  const unseen = ctx.film.themes.filter(
    (t) => t !== theme && byScore(ctx.story, (n) => themeScore(t, `${n.title} ${n.content}`)).length === 0,
  );
  return [
    `## ${theme.toUpperCase()} IN THIS FILM`,
    carriers.length
      ? `${theme} surfaces most strongly in:`
      : `${theme} is named as a theme but nothing on the story wall carries it yet.`,
    ...carriers.slice(0, 3).map((n, i) => `${pad(i + 1)} / ${n.title}`),
    "",
    research.length ? `Research you've tied to it: ${research.map((r) => r.title).join(", ")}.` : "",
    "",
    ...(unseen.length
      ? ["## THEMES WITHOUT SCENES", `${unseen.join(", ")} ${unseen.length === 1 ? "is" : "are"} listed but not yet visible in any scene. A theme the audience can't see is a theme the film doesn't have.`]
      : []),
  ].join("\n");
}

function readDecision(ctx: FilmContext, question: string): string {
  const related = byScore(ctx.memories, (m) => overlapScore(question, `${m.title} ${m.description} ${m.reason}`)).slice(0, 2);
  const decisions = related.length ? related : ctx.memories.filter((m) => m.type === "decision").slice(0, 2);
  return [
    "## WHAT YOU'VE ALREADY DECIDED",
    ...decisions.flatMap((m, i) => [`${pad(i + 1)} / ${formatDay(m.date)} — ${m.description}`, `Because: ${m.reason}`, ""]),
    "## THE TRADE",
    "Whatever you choose here should be consistent with the reason behind those decisions — or deliberately break it. If it breaks it, the film is changing, and that's worth recording.",
    "",
    `> Ask it this way: does this help the audience experience ${mainSubject(ctx)?.name ?? "the film"}'s uncertainty, or explain it?`,
    "",
    "When you decide, add it to Film Memory with the reason. In three months, the reason is the part you'll have forgotten.",
  ].join("\n");
}

function readQuestions(ctx: FilmContext): string {
  const qs = [...ctx.film.currentQuestions, ...ctx.film.openQuestions];
  const logged = ctx.memories.filter((m) => m.type === "open_question");
  return [
    "## THE QUESTIONS THE FILM IS HOLDING",
    ...qs.map((q, i) => `${pad(i + 1)} / ${q}`),
    "",
    logged.length ? `The oldest one still open in memory is from ${formatDay(logged[logged.length - 1].date)}: “${logged[logged.length - 1].description}”` : "",
    "",
    "## A SUGGESTION",
    `Not every question needs an answer before the shoot. The one that does is the one that changes where you put the camera. Of these, “${qs[0] ?? "the central question"}” is the one the film itself should ask — the others are yours to answer.`,
  ].join("\n");
}

function readGeneral(ctx: FilmContext): string {
  const decision = latest(ctx, "decision");
  const note = ctx.notes[0];
  const q = ctx.film.currentQuestions[0];
  return [
    "## WHAT I'M SEEING",
    `${ctx.film.title} is at ${ctx.film.currentVersion}, in ${ctx.film.status.toLowerCase()}. ${ctx.versions[0]?.summary ?? ""}`,
    "",
    decision ? `Your last decision (${formatDay(decision.date)}): ${decision.description}` : "",
    note ? `The last thing you left in the Room: “${note.content}”` : "",
    "",
    "## WHAT I'D ASK",
    q ? `> ${q}` : "> What does the audience understand at the end that they didn't at the start?",
    "",
    "Tell me what's bothering you about the film — a scene, a person, the ending — and I'll read it against everything you've put here.",
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

function respond({ context: ctx, question }: AskInput): string {
  const q = question.toLowerCase();
  const people = mentionedPeople(ctx, question);
  const theme = ctx.film.themes.find((t) => q.includes(t.toLowerCase()));

  if (/(about|anymore|center|centre|really|heart|core|what is this film|shifted|direction)/.test(q) && /(film|about|anymore)/.test(q))
    return readCentre(ctx);
  if (/(should i|should we|keep|cut|remove|decide|choose|or not)/.test(q)) return readDecision(ctx, question);
  if (/(structure|order|ending|end\b|beginning|opening|act|shape|pace|scene)/.test(q)) return readStructure(ctx);
  if (theme) return readTheme(ctx, theme);
  if (people.length) return readPerson(ctx, people[0]);
  if (/(question|don't know|dont know|unsure|unclear|stuck)/.test(q)) return readQuestions(ctx);
  return readGeneral(ctx);
}

function suggest({ context: ctx, text }: SuggestInput): NoteSuggestions {
  const people = mentionedPeople(ctx, text);
  const characters = (people.length ? people : [mainSubject(ctx)].filter(Boolean) as Person[])
    .slice(0, 2)
    .map((p) => ({ id: p.id, name: p.name }));

  const themes = byScore(ctx.film.themes, (t) => themeScore(t, text)).slice(0, 2);
  const story = byScore(
    ctx.story.filter((n) => n.type === "scene" || n.type === "turning_point" || n.type === "idea"),
    (n) => overlapScore(text, `${n.title} ${n.content}`),
  )
    .slice(0, 2)
    .map((n) => ({ id: n.id, title: n.title }));

  const who = characters[0]?.name ?? "the film";
  const t1 = (themes[0] ?? ctx.film.themes[0] ?? "this").toLowerCase();
  const t2 = (themes[1] ?? ctx.film.themes.find((t) => t.toLowerCase() !== t1) ?? "something else").toLowerCase();
  const fearful = themeScore("Fear", text) > 0;
  const question = fearful
    ? `Is ${who}'s fear actually about ${t1 === "fear" ? t2 : t1} or ${t1 === "fear" ? "abandonment" : t2}?`
    : `What does this tell us about ${who} that ${who} wouldn't say out loud?`;

  return { characters, themes: themes.length ? themes : ctx.film.themes.slice(0, 1), story, question };
}

/** A short delay so the interface behaves as it will with a real model. */
const think = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockProvider: FilmAIProvider = {
  name: "Mock producer",
  async ask(input) {
    await think(700);
    return respond(input);
  },
  async suggestConnections(input) {
    await think(250);
    return suggest(input);
  },
};
