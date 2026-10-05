"use client";

import { Archive, Camera, CircleHelp, Heart, MessageSquareQuote, Plus, ShieldAlert, Sparkle, UserRound } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { EditableText } from "@/components/ui/EditableText";
import { Badge, Card, ConfirmButton, Field, ImagePicker, ListEditor, PageHeader } from "@/components/ui/forms";
import { Still } from "@/components/ui/Still";
import { useActions, useCollection } from "@/lib/store";
import type { Person, PersonType, Pronouns } from "@/lib/types";
import { cx } from "@/lib/utils";
import { PRONOUN_FORMS, RESEARCH_TYPE_LABEL, STORY_NODE_LABEL } from "@/lib/vocabulary";
import { NODE_TONE } from "@/components/story/StoryNodeCard";

export function People({ filmId }: { filmId: string }) {
  const people = useCollection("people", filmId);
  const params = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(params.get("person") ?? people[0]?.id ?? null);
  const [adding, setAdding] = useState(false);
  const selected = people.find((p) => p.id === selectedId) ?? people[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        subtitle="Documentary participants and fictional characters — who they are, and what we don't know yet."
        actions={
          <button onClick={() => setAdding(true)} className="btn btn-primary">
            <Plus size={15} /> Add person
          </button>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-12">
        <nav aria-label="People" className="lg:col-span-3">
          <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:block lg:space-y-1.5 lg:px-0">
            {people.map((p) => (
              <li key={p.id} className="shrink-0">
                <button
                  onClick={() => setSelectedId(p.id)}
                  aria-current={selected?.id === p.id}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-2xl border p-2 pr-4 text-left transition-colors",
                    selected?.id === p.id ? "border-line bg-surface shadow-[var(--shadow-card)]" : "border-transparent hover:bg-hover",
                  )}
                >
                  <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full">
                    <Still image={p.portrait} alt="" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{p.name}</span>
                    <span className="block truncate text-xs text-mute">{p.role}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-9">
          {selected ? (
            <PersonDetail key={selected.id} person={selected} filmId={filmId} onDeleted={() => setSelectedId(null)} />
          ) : (
            <div className="card p-10 text-center">
              <p className="text-lg font-medium">Nobody here yet.</p>
              <p className="mt-1 text-ink-2">Who is the film about?</p>
            </div>
          )}
        </div>
      </div>

      <NewPersonDrawer filmId={filmId} open={adding} onClose={() => setAdding(false)} onCreated={setSelectedId} />
    </div>
  );
}

function PersonDetail({ person, filmId, onDeleted }: { person: Person; filmId: string; onDeleted: () => void }) {
  const actions = useActions();
  const nodes = useCollection("storyNodes", filmId);
  const research = useCollection("research", filmId);
  const [editingPortrait, setEditingPortrait] = useState(false);
  const update = (patch: Partial<Person>) => actions.update("people", person.id, patch);
  const forms = PRONOUN_FORMS[person.pronouns];

  // Moments on the map: scenes connected to this person's character card, or naming them.
  const card = nodes.find((n) => n.personId === person.id);
  const moments = nodes.filter(
    (n) =>
      (n.type === "scene" || n.type === "turning_point") &&
      (card?.connections.includes(n.id) || n.connections.includes(card?.id ?? "—") || n.content.includes(person.name) || n.title.includes(person.name)),
  );
  const archive = research.filter((r) => r.connections.some((c) => c.type === "character" && c.id === person.id));

  return (
    <article className="fade-in space-y-5">
      {/* Profile header */}
      <section className="card overflow-hidden">
        <div className="grid md:grid-cols-[260px_1fr]">
          <button onClick={() => setEditingPortrait(true)} className="group relative h-56 overflow-hidden md:h-auto" aria-label="Change portrait">
            <Still image={person.portrait} alt={`${person.name} — portrait`} />
            <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
              <Camera size={12} /> Change
            </span>
          </button>
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={person.type === "participant" ? "sage" : "plum"}>{person.type === "participant" ? "Documentary participant" : "Fictional character"}</Badge>
            </div>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">{person.name}</h2>
            <EditableText label="Role" value={person.role} onSave={(role) => update({ role })} className="serif mt-1 text-xl text-ink-2 italic" />
            <div className="mt-5 flex flex-wrap gap-4">
              <div className="flex rounded-full border border-line p-0.5" role="radiogroup" aria-label="Kind of person">
                {(["participant", "character"] as PersonType[]).map((t) => (
                  <button
                    key={t}
                    role="radio"
                    aria-checked={person.type === t}
                    onClick={() => update({ type: t })}
                    className={cx("rounded-full px-3 py-1 text-xs font-medium", person.type === t ? "bg-ink text-white" : "text-ink-2 hover:text-ink")}
                  >
                    {t === "participant" ? "Participant" : "Character"}
                  </button>
                ))}
              </div>
              <div className="flex rounded-full border border-line p-0.5" role="radiogroup" aria-label="Pronouns">
                {(["she", "he", "they"] as Pronouns[]).map((p) => (
                  <button
                    key={p}
                    role="radio"
                    aria-checked={person.pronouns === p}
                    onClick={() => update({ pronouns: p })}
                    className={cx("rounded-full px-3 py-1 text-xs font-medium", person.pronouns === p ? "bg-ink text-white" : "text-ink-2 hover:text-ink")}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 border-t border-line pt-4">
              <p className="label flex items-center gap-1.5">
                <UserRound size={13} /> {forms.who}
              </p>
              <EditableText label={forms.who} value={person.description} onSave={(description) => update({ description })} multiline placeholder="Who is this person, today?" className="mt-1 leading-relaxed" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <Card title={forms.wants} icon={<Heart size={15} />}>
          <EditableText label={forms.wants} value={person.wants} onSave={(wants) => update({ wants })} multiline placeholder="What they want — and what they say they want." className="serif text-[1.3rem] leading-snug" />
        </Card>
        <Card title={forms.fears} icon={<ShieldAlert size={15} />}>
          <EditableText label={forms.fears} value={person.fears} onSave={(fears) => update({ fears })} multiline placeholder="What they're afraid of." className="serif text-[1.3rem] leading-snug" />
        </Card>
        <section className="rounded-2xl bg-accent-soft p-5 md:col-span-2">
          <p className="flex items-center gap-2 text-[0.8rem] font-medium text-accent-deep">
            <CircleHelp size={15} /> What we don&rsquo;t know yet
          </p>
          <EditableText label="What we don't know yet" value={person.unknowns} onSave={(unknowns) => update({ unknowns })} multiline placeholder="The gaps are where the film is." className="mt-2 text-lg leading-relaxed" />
        </section>
        <Card title="Important moments" icon={<Sparkle size={15} />} className="md:col-span-2">
          {moments.length > 0 && (
            <ul className="mb-4 flex flex-wrap gap-2">
              {moments.map((n) => (
                <li key={n.id}>
                  <Link href={`/films/${filmId}/story?node=${n.id}`} className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2 hover:border-line-strong">
                    <Badge tone={NODE_TONE[n.type]}>{STORY_NODE_LABEL[n.type]}</Badge>
                    <span className="text-sm font-medium">{n.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <ListEditor label="Moment" items={person.moments} onChange={(m) => update({ moments: m })} placeholder="A moment that matters…" itemClassName="leading-snug" />
        </Card>
        <Card title={person.type === "participant" ? "Interview notes" : "Notes"} icon={<MessageSquareQuote size={15} />}>
          <EditableText
            label="Interview notes"
            value={person.interviewNotes}
            onSave={(interviewNotes) => update({ interviewNotes })}
            multiline
            placeholder={person.type === "participant" ? "What they said, and how." : "Voice, history, contradictions."}
            className="text-sm leading-relaxed whitespace-pre-wrap"
          />
          <p className="label mt-4 mb-1">Working notes</p>
          <EditableText label="Notes" value={person.notes} onSave={(notes) => update({ notes })} multiline placeholder="Anything else." className="text-sm leading-relaxed text-ink-2" />
        </Card>
        <Card title="Archive" icon={<Archive size={15} />}>
          {archive.length ? (
            <ul className="grid grid-cols-2 gap-2">
              {archive.map((r) => (
                <li key={r.id}>
                  <Link href={`/films/${filmId}/research?item=${r.id}`} className="group block overflow-hidden rounded-xl border border-line hover:border-line-strong">
                    <div className="h-20 bg-sunken">{r.image && <Still image={r.image} alt="" />}</div>
                    <div className="p-2.5">
                      <span className="block text-[0.7rem] text-mute">{RESEARCH_TYPE_LABEL[r.type]}</span>
                      <span className="line-clamp-2 text-sm font-medium group-hover:text-accent">{r.title}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mute">Nothing in the research archive is connected to {person.name} yet.</p>
          )}
        </Card>
      </div>

      <ConfirmButton
        onConfirm={() => {
          actions.remove("people", person.id);
          onDeleted();
        }}
      >
        Remove {person.name} from the film
      </ConfirmButton>

      <Drawer open={editingPortrait} onClose={() => setEditingPortrait(false)} title="Portrait" eyebrow={person.name}>
        <ImagePicker value={person.portrait} onChange={(portrait) => update({ portrait })} />
      </Drawer>
    </article>
  );
}

function NewPersonDrawer({ filmId, open, onClose, onCreated }: { filmId: string; open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const actions = useActions();
  const nodes = useCollection("storyNodes", filmId);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [type, setType] = useState<PersonType>("participant");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const person = actions.create("people", {
      filmId,
      name: name.trim(),
      role: role.trim() || (type === "participant" ? "Participant" : "Character"),
      type,
      pronouns: "they",
      description: "",
      wants: "",
      fears: "",
      unknowns: "",
      notes: "",
      interviewNotes: "",
      moments: [],
      portrait: "still:paper",
    });
    // Every person gets a card on the story map, so they can be connected to scenes.
    actions.create("storyNodes", {
      filmId,
      type: "character",
      title: person.name,
      content: person.role,
      position: { x: 120 + nodes.length * 14, y: 900 },
      positions: { characters: { x: 120 + nodes.length * 20, y: 300 } },
      connections: [],
      personId: person.id,
    });
    setName("");
    setRole("");
    onCreated(person.id);
    onClose();
  };

  return (
    <Drawer open={open} onClose={onClose} title="A new person" eyebrow="People">
      <form onSubmit={submit} className="space-y-5">
        <Field label="Name">
          <input data-autofocus required value={name} onChange={(e) => setName(e.target.value)} className="input text-lg font-medium" />
        </Field>
        <Field label="Role in the film">
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Main subject, her mother, the doctor…" className="input" />
        </Field>
        <div className="flex gap-2" role="radiogroup" aria-label="Kind of person">
          {(["participant", "character"] as PersonType[]).map((t) => (
            <button type="button" key={t} role="radio" aria-checked={type === t} onClick={() => setType(t)} className="pill">
              {t === "participant" ? "Documentary participant" : "Fictional character"}
            </button>
          ))}
        </div>
        <button type="submit" className="btn btn-primary w-full justify-center py-3">
          Add to the film
        </button>
      </form>
    </Drawer>
  );
}
