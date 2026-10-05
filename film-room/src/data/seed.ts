/**
 * Seed material for the MVP. Kept entirely separate from components so it can be
 * replaced by a backend fetch without touching the UI.
 */
import type {
  FilmMemory,
  FilmRoomState,
  Film,
  Note,
  Person,
  ResearchItem,
  StoryNode,
  Version,
  VisualReference,
  WritingDocument,
} from "@/lib/types";

const M = "mother";

/* ------------------------------------------------------------------ */
/* Films                                                               */
/* ------------------------------------------------------------------ */

const films: Film[] = [
  {
    id: M,
    title: "The Mother I Didn't Become",
    format: "Documentary",
    duration: "24 min",
    status: "Treatment",
    currentVersion: "V04",
    logline:
      "A woman becomes a mother without giving birth — and discovers that the fear of not bonding with her child is replaced by a different fear: how deeply she has bonded.",
    description:
      "Dana's partner Noa is carrying their first child. Dana has spent the pregnancy rehearsing a distance she is sure will come: the baby will belong to Noa's body first. When the birth goes wrong and Noa is taken into surgery, Dana spends the first twenty-four hours alone with a daughter she was afraid she would not recognise. The film stays with her in that time — and in the months after, when the fear turns around.",
    understanding:
      "Whether motherhood is something that happens to a body, or something that happens between two people. And what it costs Dana to find out that she was never really afraid of not loving enough.",
    themes: ["Motherhood", "Identity", "Recognition", "Fear", "Intimacy", "Family", "Responsibility"],
    currentQuestions: ["When does someone become a mother?"],
    openQuestions: [
      "Is Dana's fear actually about motherhood or abandonment?",
      "How much of Noa's surgery do we show — or only hear?",
      "Does Miriam belong in the present of the film, or only in the archive?",
    ],
    cover: "still:dawn-window",
    createdAt: "2026-08-12T09:00:00.000Z",
    updatedAt: "2026-10-05T08:40:00.000Z",
  },
  {
    id: "low-tide",
    title: "Low Tide",
    format: "Fiction",
    duration: "92 min",
    status: "Outline",
    currentVersion: "V02",
    logline:
      "Two estranged brothers return to their father's oyster farm the winter it fails, and have to decide which of them gets to be the one who stayed.",
    description:
      "A slow, tidal family drama about inheritance, labour and the stories siblings tell about who sacrificed what.",
    understanding: "What we owe to the people who stayed behind.",
    themes: ["Inheritance", "Brotherhood", "Work", "Place"],
    currentQuestions: ["Whose film is it — Ilan's or Tom's?"],
    openQuestions: ["Does the father need to be alive at the start?"],
    cover: "still:sea",
    createdAt: "2026-06-02T09:00:00.000Z",
    updatedAt: "2026-09-29T17:20:00.000Z",
  },
  {
    id: "night-switchboard",
    title: "Night Switchboard",
    format: "Essay film",
    duration: "48 min",
    status: "First idea",
    currentVersion: "V01",
    logline:
      "An essay on the women who connected a city's phone calls through the night, built from the last surviving operator's memory and a box of unlabelled tapes.",
    description: "Archive-led. Voices without faces. A city heard rather than seen.",
    understanding: "What it means to be the invisible link in other people's intimacy.",
    themes: ["Labour", "Listening", "Archive", "The city"],
    currentQuestions: ["Can a film be mostly sound?"],
    openQuestions: [],
    cover: "still:hospital-night",
    createdAt: "2026-09-14T09:00:00.000Z",
    updatedAt: "2026-09-14T22:10:00.000Z",
  },
];

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

const people: Person[] = [
  {
    id: "p-dana",
    filmId: M,
    name: "Dana",
    role: "Main subject",
    type: "participant",
    pronouns: "she",
    description:
      "Thirty-eight. A sound engineer who works nights at a radio station. Precise, funny, guarded. The person in every room who notices what everyone else is avoiding — and says it a beat too late.",
    wants:
      "To be recognised as the baby's mother — by the hospital, by her own mother, and most of all by herself. She says she wants 'to feel it'. She doesn't say what 'it' is.",
    fears:
      "That she will hold her daughter and feel nothing. Underneath: that she will be left — by Noa, by the baby's need for Noa, by the version of the family she imagined.",
    unknowns:
      "Whether she ever wanted to carry a child herself. What happened between her and Miriam when she came out. What she did in the hospital chapel at 4 a.m.",
    notes:
      "She is most open when her hands are busy. Interviews in the car work; interviews at the table don't.",
    interviewNotes:
      "Pre-interview, July: 'Everyone keeps asking Noa how she feels. Nobody asks me, and I'm grateful, because I don't know.'\n\nSecond conversation, September: talks about the first night for forty minutes without once saying the word 'love'.",
    moments: [
      "Tells the nurse 'I'm the other mother' — then corrects herself to 'I'm her mother'.",
      "Sings to the baby the radio station's closing jingle because it's the only song she can remember.",
    ],
    portrait: "still:skin",
  },
  {
    id: "p-noa",
    filmId: M,
    name: "Noa",
    role: "Dana's partner",
    type: "participant",
    pronouns: "she",
    description:
      "Forty. A primary school teacher. Carries the baby. Warm, decisive, physically brave. Wants the film to be made more than Dana does.",
    wants: "For Dana to stop waiting for permission to be a parent.",
    fears: "That her body will be the centre of a story she wanted to share.",
    unknowns: "How much she remembers of the surgery. Whether she resents the first night she missed.",
    notes: "Agreed to be filmed in recovery only with sound, not image. Revisit in November.",
    interviewNotes: "",
    moments: ["Asks to see a photo of the baby before she asks about herself."],
    portrait: "still:nursery",
  },
  {
    id: "p-miriam",
    filmId: M,
    name: "Miriam",
    role: "Dana's mother",
    type: "participant",
    pronouns: "she",
    description:
      "Sixty-nine. Raised Dana alone after Dana's father left. Generous with food, careful with words. Took three years to call Noa by name.",
    wants: "To be needed again, without having to say so.",
    fears: "That her daughter has become the kind of mother she was — or the kind she wasn't.",
    unknowns: "What she thinks makes someone a mother. She has never been asked directly.",
    notes: "Has a box of photographs from 1984–1990. Offered to lend them.",
    interviewNotes: "",
    moments: ["Holds the baby and says, without looking at Dana: 'She has your hands.'"],
    portrait: "still:archive-84",
  },
];

/* ------------------------------------------------------------------ */
/* Story wall                                                          */
/* ------------------------------------------------------------------ */

const node = (
  id: string,
  type: StoryNode["type"],
  title: string,
  content: string,
  x: number,
  y: number,
  connections: string[],
  positions?: StoryNode["positions"],
  personId?: string,
): StoryNode => ({
  id,
  filmId: M,
  type,
  title,
  content,
  position: { x, y },
  positions,
  connections,
  personId,
});

const storyNodes: StoryNode[] = [
  node("n-film", "film", "The film", "A woman becomes a mother without giving birth.", 820, 470, [
    "n-motherhood",
    "n-becoming",
    "n-dana",
  ], { themes: { x: 760, y: 440 }, characters: { x: 760, y: 120 } }),
  node(
    "n-waiting",
    "scene",
    "Before — the waiting",
    "Dana assembling the cot alone at 2 a.m. while Noa sleeps. Instructions in four languages. She reads all of them.",
    120,
    150,
    ["n-fear-bonding"],
    { themes: { x: 160, y: 120 }, characters: { x: 140, y: 420 } },
  ),
  node(
    "n-birth",
    "scene",
    "Birth",
    "Observational. Dana at the edge of the frame as Noa labours. She is told where to stand. She fears she will be left outside the moment.",
    420,
    120,
    ["n-fear-bonding", "n-partner-risk", "n-dana"],
    { themes: { x: 420, y: 140 }, characters: { x: 420, y: 420 } },
  ),
  node(
    "n-partner-risk",
    "turning_point",
    "Partner at risk",
    "Complications. Noa is taken into surgery. A nurse puts the baby in Dana's arms and leaves the room.",
    720,
    170,
    ["n-alone"],
    { themes: { x: 980, y: 120 }, characters: { x: 700, y: 440 } },
  ),
  node(
    "n-alone",
    "scene",
    "Dana alone with baby",
    "The first night. Twenty-four hours, one room, a phone she keeps checking. Fear of being left alone with a stranger, and the stranger who won't stop looking at her.",
    1040,
    210,
    ["n-fear-loving", "n-dana"],
    { themes: { x: 1200, y: 300 }, characters: { x: 980, y: 440 } },
  ),
  node(
    "n-mother-talk",
    "scene",
    "Conversation with her mother",
    "Miriam in her kitchen. Dana asks what it felt like when she was left alone with a baby. Miriam answers a different question. The fear underneath both of them.",
    1320,
    330,
    ["n-fear-loving", "n-miriam", "n-question"],
    { themes: { x: 1240, y: 600 }, characters: { x: 1260, y: 440 } },
  ),
  node(
    "n-becoming",
    "turning_point",
    "Becoming a mother",
    "Not a moment — an accumulation. Perhaps the film's last image is ordinary: Dana warming a bottle without looking.",
    1160,
    620,
    ["n-question"],
    { themes: { x: 900, y: 760 }, characters: { x: 1160, y: 740 } },
  ),
  node(
    "n-motherhood",
    "theme",
    "Motherhood",
    "As something done, not something carried.",
    520,
    520,
    ["n-fear-bonding", "n-becoming"],
    { themes: { x: 520, y: 420 }, characters: { x: 560, y: 120 } },
  ),
  node(
    "n-fear-bonding",
    "theme",
    "Fear of not bonding",
    "Where the film starts. Dana's certainty that she will feel like a guest.",
    300,
    380,
    [],
    { themes: { x: 240, y: 360 } },
  ),
  node(
    "n-fear-loving",
    "theme",
    "Fear of loving too much",
    "Where the film may end. Bonded so deeply that the old fear of being left returns, bigger.",
    1200,
    470,
    ["n-becoming"],
    { themes: { x: 1000, y: 470 } },
  ),
  node(
    "n-question",
    "question",
    "When does someone become a mother?",
    "The film's central question. Not to be answered in dialogue.",
    820,
    760,
    [],
    { themes: { x: 620, y: 700 } },
  ),
  node(
    "n-corridor",
    "idea",
    "The corridor as a recurring space",
    "Every time Dana is waiting, she is in a corridor. Could be the visual spine of the film.",
    170,
    640,
    ["n-birth"],
  ),
  node(
    "n-dana",
    "character",
    "Dana",
    "Main subject.",
    560,
    760,
    [],
    { characters: { x: 420, y: 140 } },
    "p-dana",
  ),
  node(
    "n-miriam",
    "character",
    "Miriam",
    "Dana's mother.",
    1460,
    600,
    [],
    { characters: { x: 1140, y: 140 } },
    "p-miriam",
  ),
  node(
    "n-noa",
    "character",
    "Noa",
    "Dana's partner.",
    560,
    260,
    ["n-birth", "n-partner-risk"],
    { characters: { x: 260, y: 140 } },
    "p-noa",
  ),
];

/* ------------------------------------------------------------------ */
/* Research                                                            */
/* ------------------------------------------------------------------ */

const research: ResearchItem[] = [
  {
    id: "r-bonding-study",
    filmId: M,
    title: "Bonding in non-gestational mothers",
    type: "article",
    description:
      "Summary of interviews with forty non-gestational mothers. Most describe the first weeks as 'proving' — to staff, to family, to themselves. Several describe the fear inverting once attachment arrives.",
    source: "Journal of Family Studies, 2023",
    tags: ["attachment", "recognition", "first weeks"],
    connections: [
      { type: "theme", id: "Recognition" },
      { type: "character", id: "p-dana" },
    ],
    createdAt: "2026-08-16T10:00:00.000Z",
  },
  {
    id: "r-rich",
    filmId: M,
    title: "Of Woman Born",
    type: "book",
    description:
      "Rich separates motherhood as experience from motherhood as institution. Useful for keeping the film out of the institution — the hospital forms, the 'other mother' box.",
    source: "Adrienne Rich, 1976",
    tags: ["motherhood", "institution"],
    connections: [{ type: "theme", id: "Motherhood" }],
    createdAt: "2026-08-20T10:00:00.000Z",
  },
  {
    id: "r-stories",
    filmId: M,
    title: "Stories We Tell",
    type: "film",
    description:
      "How a family's competing accounts become the structure. Relevant to Miriam — she remembers Dana's childhood differently every time.",
    source: "Sarah Polley, 2012",
    tags: ["family", "memory", "structure"],
    connections: [
      { type: "character", id: "p-miriam" },
      { type: "scene", id: "n-mother-talk" },
    ],
    createdAt: "2026-08-25T10:00:00.000Z",
  },
  {
    id: "r-pre-interview",
    filmId: M,
    title: "Pre-interview with Dana",
    type: "interview",
    description:
      "Ninety minutes in the car. The line about nobody asking her how she feels. Talks about the cot instructions as if they were a test.",
    source: "Recorded July 28, Dana's car",
    tags: ["dana", "voice", "fear"],
    connections: [
      { type: "character", id: "p-dana" },
      { type: "scene", id: "n-waiting" },
    ],
    createdAt: "2026-07-28T10:00:00.000Z",
  },
  {
    id: "r-miriam-photo",
    filmId: M,
    title: "Miriam holding Dana, 1984",
    type: "photograph",
    description:
      "Kitchen, overexposed window behind them. Miriam is looking at the camera, not the baby. Same kitchen as today.",
    source: "Miriam's box of family photographs",
    image: "still:archive-84",
    tags: ["archive", "kitchen", "mirror"],
    connections: [
      { type: "character", id: "p-miriam" },
      { type: "scene", id: "n-mother-talk" },
      { type: "theme", id: "Family" },
    ],
    createdAt: "2026-09-03T10:00:00.000Z",
  },
  {
    id: "r-birth-plan",
    filmId: M,
    title: "Hospital birth plan",
    type: "document",
    description:
      "Two-page form. 'Partner' printed in the field where Dana's name goes. Dana crossed it out and wrote 'Mother' in pen.",
    source: "Noa & Dana's hospital folder",
    tags: ["institution", "recognition"],
    connections: [
      { type: "theme", id: "Recognition" },
      { type: "scene", id: "n-birth" },
    ],
    createdAt: "2026-09-10T10:00:00.000Z",
  },
  {
    id: "r-notes-app",
    filmId: M,
    title: "Dana's notes app, 03:12",
    type: "screenshot",
    description:
      "Written during the first night: 'she sneezed. I checked if she was still breathing 11 times. I am not a guest.'",
    source: "Shared by Dana, September",
    image: "still:hospital-night",
    tags: ["first night", "voice", "text on screen"],
    connections: [
      { type: "scene", id: "n-alone" },
      { type: "theme", id: "Fear" },
    ],
    createdAt: "2026-09-18T10:00:00.000Z",
  },
];

/* ------------------------------------------------------------------ */
/* Visual world                                                        */
/* ------------------------------------------------------------------ */

const v = (
  id: string,
  category: VisualReference["category"],
  title: string,
  annotation: string,
  image: string,
  aspect: VisualReference["aspect"],
): VisualReference => ({ id, filmId: M, category, title, annotation, image, aspect });

const visuals: VisualReference[] = [
  v("v-window", "light", "Dawn through a hospital blind", "The only warm light in the first night. Let it arrive late and leave early.", "still:dawn-window", "tall"),
  v("v-corridor", "location", "Maternity ward corridor", "Fluorescent, endless, green-grey. Dana always at the far end of the frame.", "still:corridor", "wide"),
  v("v-skin", "texture", "Skin against skin", "Close enough that you lose which body is which.", "still:skin", "square"),
  v("v-red", "color", "One red", "The film is pale. One red, once: the blanket the nurse wraps the baby in.", "still:red", "square"),
  v("v-night", "light", "Monitor glow", "Practicals only. The baby monitor and the phone are the key lights.", "still:hospital-night", "tall"),
  v("v-archive", "archive", "Miriam's kitchen, 1984", "Rhyme with the present-day kitchen — same window, same overexposure.", "still:archive-84", "tall"),
  v("v-handheld", "camera", "Breathing handheld", "Camera at Dana's chest height. Never above her eyeline in the hospital.", "still:fog", "wide"),
  v("v-nursery", "color", "Nursery palette", "Chalk pink, grey, bone. Nothing new-looking.", "still:nursery", "square"),
  v("v-kitchen", "location", "Miriam's kitchen today", "Ochre tiles, a radio always on.", "still:kitchen", "wide"),
  v("v-sea", "reference_film", "Stories We Tell", "Permission to let a family contradict itself on screen.", "still:sea", "square"),
  v("v-grain", "texture", "16mm grain for memory", "If we use archive textures, only for Miriam's memories, never Dana's.", "still:grain", "tall"),
  v("v-cot", "image", "The unassembled cot", "Flat-pack parts on the floor like a diagram of a family.", "still:paper", "wide"),
];

/* ------------------------------------------------------------------ */
/* Memory & versions                                                   */
/* ------------------------------------------------------------------ */

const memories: FilmMemory[] = [
  {
    id: "m-first-idea",
    filmId: M,
    date: "2026-08-12T10:00:00.000Z",
    type: "milestone",
    title: "The first idea",
    description: "After dinner with Dana and Noa: 'Nobody makes films about the one who doesn't give birth.'",
    reason: "This is where the film started.",
  },
  {
    id: "m-observational",
    filmId: M,
    date: "2026-08-14T10:00:00.000Z",
    type: "decision",
    title: "Keep the birth observational",
    description:
      "You decided to keep Dana's birth experience observational instead of interview-led.",
    reason:
      "You wanted the audience to experience her uncertainty rather than hear her explain it.",
  },
  {
    id: "m-voiceover",
    filmId: M,
    date: "2026-08-22T10:00:00.000Z",
    type: "deleted_idea",
    title: "Dana's voice-over diary",
    description: "A voice-over track of Dana reading from a diary she kept during the pregnancy.",
    reason: "It explained the fear instead of letting us sit inside it. It also made her sound certain, and she isn't.",
  },
  {
    id: "m-pov",
    filmId: M,
    date: "2026-08-30T10:00:00.000Z",
    type: "change",
    title: "From the couple to Dana",
    description: "The film moved from a portrait of a couple having a baby to Dana's point of view alone.",
    reason: "Noa's story is about her body. Dana's story is about recognition — and that's the film nobody has made.",
  },
  {
    id: "m-abandonment",
    filmId: M,
    date: "2026-09-09T10:00:00.000Z",
    type: "open_question",
    title: "Motherhood or abandonment?",
    description: "Is Dana's fear actually about motherhood or abandonment?",
    reason: "Came up after the second interview — she talks about her father leaving more than she talks about the baby.",
  },
  {
    id: "m-miriam",
    filmId: M,
    date: "2026-09-21T10:00:00.000Z",
    type: "decision",
    title: "Miriam stays in the film",
    description: "The conversation with her mother becomes a full scene, not archive texture.",
    reason: "Miriam is the only person in the film who has been left alone with a baby. She is the mirror.",
  },
  {
    id: "m-ultrasound",
    filmId: M,
    date: "2026-09-28T10:00:00.000Z",
    type: "deleted_idea",
    title: "Opening on ultrasound images",
    description: "Opening the film on the ultrasound scans.",
    reason: "It opens on Noa's body. The film should open on Dana waiting.",
  },
  {
    id: "m-v04",
    filmId: M,
    date: "2026-10-04T10:00:00.000Z",
    type: "milestone",
    title: "Treatment V04",
    description: "Fourth version of the treatment, built around the first twenty-four hours.",
    reason: "The structure finally has a spine: before, the first night, after.",
  },
];

const versions: Version[] = [
  {
    id: "ver-1",
    filmId: M,
    versionNumber: 1,
    title: "First idea",
    type: "First idea",
    date: "2026-08-12T10:00:00.000Z",
    summary: "Dana becoming a mother without giving birth.",
    changes: ["A one-paragraph idea written after dinner with Dana and Noa."],
    removed: [],
    emerged: ["The 'other mother' as a film nobody has made."],
  },
  {
    id: "ver-2",
    filmId: M,
    versionNumber: 2,
    title: "Outline",
    type: "Outline",
    date: "2026-08-30T10:00:00.000Z",
    summary: "A portrait of the pregnancy from both sides, in three movements.",
    changes: ["Three-movement structure: waiting, birth, after.", "Point of view moved to Dana alone."],
    removed: ["Dana's voice-over diary.", "Noa's prenatal appointments as a through-line."],
    emerged: ["The corridor as a recurring space.", "Dana's fear of not bonding as the engine."],
  },
  {
    id: "ver-3",
    filmId: M,
    versionNumber: 3,
    title: "Treatment",
    type: "Treatment",
    date: "2026-09-21T10:00:00.000Z",
    summary: "First treatment. Miriam enters the film as a mirror.",
    changes: ["Conversation with Miriam becomes a full scene.", "Birth kept strictly observational."],
    removed: ["Interview-led birth sequence."],
    emerged: ["Dana's father leaving — mentioned twice, unprompted."],
  },
  {
    id: "ver-4",
    filmId: M,
    versionNumber: 4,
    title: "Treatment",
    type: "Treatment",
    date: "2026-10-04T10:00:00.000Z",
    summary: "The film is rebuilt around the first twenty-four hours alone.",
    changes: [
      "Noa's surgery becomes the turning point that leaves Dana alone.",
      "The first night is now the centre of the film, not the birth.",
    ],
    removed: ["Opening on ultrasound images.", "The baby shower sequence."],
    emerged: [
      "Dana's fear of being left alone — and how motherhood changes that fear.",
      "The fear of loving too much as a possible ending.",
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Room notes                                                          */
/* ------------------------------------------------------------------ */

const notes: Note[] = [
  {
    id: "note-1",
    filmId: M,
    content: "What if the nurse who hands Dana the baby is the only person who never questions that she's the mother?",
    category: "thought",
    position: { x: 60, y: 40 },
    connections: [{ type: "scene", id: "n-partner-risk" }, { type: "theme", id: "Recognition" }],
    createdAt: "2026-10-03T21:12:00.000Z",
    updatedAt: "2026-10-03T21:12:00.000Z",
  },
  {
    id: "note-2",
    filmId: M,
    content: "Dana checks her phone in every scene. Not for news — to see if anyone has called her by name.",
    category: "observation",
    position: { x: 400, y: 90 },
    connections: [{ type: "character", id: "p-dana" }],
    createdAt: "2026-10-02T23:40:00.000Z",
    updatedAt: "2026-10-02T23:40:00.000Z",
  },
  {
    id: "note-3",
    filmId: M,
    content: "Is the film actually about Miriam being left alone with Dana in 1984?",
    category: "question",
    position: { x: 740, y: 30 },
    connections: [{ type: "character", id: "p-miriam" }],
    createdAt: "2026-10-01T08:05:00.000Z",
    updatedAt: "2026-10-01T08:05:00.000Z",
  },
  {
    id: "note-4",
    filmId: M,
    content: "The sound of the hospital ventilation at night. Low, constant. Could carry the whole first night.",
    category: "image",
    position: { x: 160, y: 300 },
    connections: [{ type: "scene", id: "n-alone" }],
    createdAt: "2026-09-30T02:30:00.000Z",
    updatedAt: "2026-09-30T02:30:00.000Z",
  },
  {
    id: "note-5",
    filmId: M,
    content: "I keep feeling protective of Dana in the edit — like I'm the one afraid she won't be recognised.",
    category: "feeling",
    position: { x: 560, y: 320 },
    connections: [],
    createdAt: "2026-09-27T19:00:00.000Z",
    updatedAt: "2026-09-27T19:00:00.000Z",
  },
];

/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

const documents: WritingDocument[] = [
  {
    id: "doc-treatment",
    filmId: M,
    type: "treatment",
    title: "Treatment — V04",
    content: `BEFORE

It is two in the morning and Dana is building a cot. The instructions come in four languages and she reads every one of them, as if one might contain a different answer. In the next room Noa sleeps, eight months pregnant. The house is very quiet. Dana works the way she works at the radio station: alone, at night, attentive to everything.

She tells us — in the car, never at the table — that she is afraid she will hold her daughter and feel like a guest.

THE FIRST TWENTY-FOUR HOURS

The birth is filmed from where Dana is told to stand. We don't cut closer than she is allowed to be. When the monitors change and the room fills with people, the camera stays with her as she is moved to the edge of it, then out of it.

A nurse comes into the corridor and puts the baby in her arms. Noa is in surgery. The nurse leaves.

What follows is the centre of the film: one room, one night, a phone that doesn't ring. Dana checks the baby's breathing eleven times. She sings the only song she can remember, the station's closing jingle. Somewhere around dawn, she stops checking her phone.

AFTER

Miriam's kitchen, the same kitchen as a photograph from 1984. Dana asks her mother what it was like to be left alone with a baby. Miriam answers a different question.

The fear has turned around. Dana is no longer afraid of not loving her daughter. She is afraid of how much she does — and of what it would mean to be left now.`,
    connections: [
      { type: "character", id: "p-dana" },
      { type: "scene", id: "n-alone" },
      { type: "theme", id: "Motherhood" },
    ],
    createdAt: "2026-09-21T10:00:00.000Z",
    updatedAt: "2026-10-04T18:30:00.000Z",
  },
  {
    id: "doc-outline",
    filmId: M,
    type: "outline",
    title: "Three movements",
    content: `01 / Before — the waiting (4 min)
02 / The birth — observational, from Dana's position (5 min)
03 / Partner at risk — the hand-over in the corridor (2 min)
04 / The first night — Dana alone with the baby (8 min)
05 / Miriam's kitchen (3 min)
06 / After — warming a bottle without looking (2 min)`,
    connections: [{ type: "story", id: "n-film" }],
    createdAt: "2026-08-30T10:00:00.000Z",
    updatedAt: "2026-10-04T10:00:00.000Z",
  },
  {
    id: "doc-scenes",
    filmId: M,
    type: "scene_ideas",
    title: "Scene ideas — the first night",
    content: `— The hospital bracelet. Dana's name isn't on it. She reads the baby's name aloud to check it is real.
— A cleaner comes in at 4 a.m. and congratulates her without any hesitation.
— Dana films the baby on her phone and then deletes it, afraid it looks like evidence.`,
    connections: [{ type: "scene", id: "n-alone" }, { type: "theme", id: "Recognition" }],
    createdAt: "2026-09-25T10:00:00.000Z",
    updatedAt: "2026-10-02T10:00:00.000Z",
  },
  {
    id: "doc-fragment",
    filmId: M,
    type: "fragment",
    title: "Kitchen — Miriam & Dana",
    content: `INT. MIRIAM'S KITCHEN — DAY

The radio is on. MIRIAM (69) cuts bread for no one in particular.

DANA
When Dad left. The first night. What did you do?

MIRIAM
I cleaned the oven.

A long pause. The radio plays the station's closing jingle.

MIRIAM (CONT'D)
You were very loud. I remember thinking — she knows. She knows it's only me now.`,
    connections: [
      { type: "character", id: "p-miriam" },
      { type: "scene", id: "n-mother-talk" },
      { type: "question", id: "n-question" },
    ],
    createdAt: "2026-09-27T10:00:00.000Z",
    updatedAt: "2026-09-27T10:00:00.000Z",
  },
];

export const seedState: FilmRoomState = {
  films,
  people,
  storyNodes,
  research,
  visuals,
  memories,
  versions,
  notes,
  documents,
  aiMessages: [],
};
