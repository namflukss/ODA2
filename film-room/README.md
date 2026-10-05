# Film Room

A creative workspace for developing and understanding a film — from its first idea through its evolving story.
The film is the project; everything else belongs to it.

## Run it

```bash
cd film-room
npm install
npm run dev        # http://localhost:3000
```

`npm run build && npm start` for a production build. `npm run lint` type-checks the project.

The app ships seeded with *The Mother I Didn't Become*. Everything you change is saved in the browser
(localStorage). "Restore sample film" at the bottom of My Films resets it.

## Routes

| Route | What it is |
| --- | --- |
| `/`, `/films` | My Films |
| `/films/[id]` | Overview — story, inquiry, questions, themes, version, last decision |
| `/films/[id]/room` | The Room — freeform notes, contextual suggestions, draggable wall |
| `/films/[id]/story` | Story map — draggable, connectable wall; Structure / Themes / Characters views; sequence view |
| `/films/[id]/people` | Participants and characters |
| `/films/[id]/research` | Research archive with tags and connections |
| `/films/[id]/visuals` | Visual world — masonry reference board |
| `/films/[id]/script` | Treatment, outline, scene ideas, screenplay fragments, notes |
| `/films/[id]/memory` | Film memory + version history |
| `/films/[id]/ai` | Think with the film — the development producer |

## Architecture

```
src/
  app/                    routes (thin) + /api/ai server route
  components/             UI, one folder per area; ui/ holds shared primitives
  data/seed.ts            sample film — the only place mock data lives
  lib/
    types.ts              the data model (Film, Person, StoryNode, ResearchItem, VisualReference,
                          FilmMemory, Version, Note, WritingDocument, AIMessage)
    store/                reducer + provider + hooks; persistence adapter (localStorage today)
    ai/                   context builder, provider interface, mock + remote providers, prompts
    refs.ts               resolving connections between pieces of material
```

**State.** All mutations go through one reducer (`lib/store/reducer.ts`) with a few generic
create / update / delete actions. They map one-to-one onto REST calls. Deleting anything also removes
every connection that pointed to it. To use a backend, implement `StateStorage` in
`lib/store/persistence.ts`, or swap the provider's actions for API calls. Components don't change.

**AI.** `getFilmContext(state, filmId)` (`lib/ai/context.ts`) gathers the film, story nodes, people, research, notes,
visual references, memory, versions and writing. `contextToBrief()` renders that as a structured brief for an LLM.
The UI only talks to the `FilmAIProvider` interface (`ask`, `suggestConnections`):

- `mock` (default) is a deterministic set of readings over the real film context. It notices a shift in the
  film's centre, reads the structure, a character or a theme, recalls past decisions, and lists open questions.
- `anthropic` sends the brief to `/api/ai`, which calls Claude with the Anthropic SDK on the server. The route
  enables server-side refusal fallback, so a declined request is retried on a fallback model. If the route
  is not configured, the remote provider falls back to the mock.

```bash
# .env.local
NEXT_PUBLIC_AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

To add OpenAI or another LLM, add a branch to `src/app/api/ai/route.ts`. The UI stays the same.

## Images

The MVP uses procedural "stills" (SVG colour fields, light and grain) instead of stock photos.
You can also upload your own images, which are stored as data URLs.
