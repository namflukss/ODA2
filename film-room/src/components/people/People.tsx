"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { EditableText } from "@/components/ui/EditableText";
import { ConfirmButton, Field, ImagePicker, ListEditor, SectionHeading } from "@/components/ui/forms";
import { Still } from "@/components/ui/Still";
import { useActions, useCollection } from "@/lib/store";
import type { Person, PersonType, Pronouns } from "@/lib/types";
import { cx, pad } from "@/lib/utils";
import { PRONOUN_FORMS, RESEARCH_TYPE_LABEL, STORY_NODE_LABEL } from "@/lib/vocabulary";

export function People({ filmId }: { filmId: string }) {
  const people = useCollection("people", filmId);
  const params = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(params.get("person") ?? people[0]?.id ?? null);
  const [adding, setAdding] = useState(false);
  const selected = people.find((p) => p.id === selectedId) ?? people[0];

  return (
    <div className="grid gap-x-12 gap-y-10 px-4 pb-24 md:grid-cols-12 md:px-10">
      <nav aria-label="People" className="md:col-span-3">
        <div className="border-t border-ink pt-4 md:sticky md:top-20">
          <p className="eyebrow text-mute">People in the film</p>
          <ol className="no-scrollbar -mx-4 mt-3 flex gap-6 overflow-x-auto px-4 md:mx-0 md:block md:space-y-1 md:px-0">
            {people.map((p, i) => (
              <li key={p.id} className="shrink-0">
                <button
                  onClick={() => setSelectedId(p.id)}
                  aria-current={selected?.id === p.id}
                  className={cx("group flex items-baseline gap-3 py-1 text-left", selected?.id === p.id ? "text-ink" : "text-mute hover:text-ink")}
                >
                  <span className="eyebrow text-red tabular-nums">{pad(i + 1)}</span>
                  <span className="text-2xl font-extrabold uppercase md:text-3xl">{p.name}</span>
                </button>
              </li>
            ))}
          </ol>
          <button onClick={() => setAdding(true)} className="link-action mt-6 inline-block">
            Add a person
          </button>
        </div>
      </nav>

      <div className="md:col-span-9">
        {selected ? (
          <PersonDetail key={selected.id} person={selected} filmId={filmId} onDeleted={() => setSelectedId(null)} />
        ) : (
          <p className="serif border-t border-ink pt-8 text-3xl text-mute italic">Nobody here yet. Who is the film about?</p>
        )}
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

  // Moments on the wall: scenes connected to this person's character card, or naming them.
  const card = nodes.find((n) => n.personId === person.id);
  const moments = nodes.filter(
    (n) =>
      (n.type === "scene" || n.type === "turning_point") &&
      (card?.connections.includes(n.id) || n.connections.includes(card?.id ?? "—") || n.content.includes(person.name) || n.title.includes(person.name)),
  );
  const archive = research.filter((r) => r.connections.some((c) => c.type === "character" && c.id === person.id));

  return (
    <article className="fade-in">
      <header className="grid gap-6 border-t border-ink pt-6 md:grid-cols-[1fr_220px]">
        <div>
          <h2 className="text-display font-extrabold tracking-[-0.04em] uppercase">{person.name}</h2>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <EditableText label="Role" value={person.role} onSave={(role) => update({ role })} className="serif w-auto max-w-xs text-2xl italic" />
            <div className="flex gap-3" role="radiogroup" aria-label="Kind of person">
              {(["participant", "character"] as PersonType[]).map((t) => (
                <button key={t} role="radio" aria-checked={person.type === t} onClick={() => update({ type: t })} className={cx("eyebrow", person.type === t ? "text-red" : "text-mute hover:text-ink")}>
                  {t === "participant" ? "Documentary participant" : "Fictional character"}
                </button>
              ))}
            </div>
            <div className="flex gap-2" role="radiogroup" aria-label="Pronouns">
              {(["she", "he", "they"] as Pronouns[]).map((p) => (
                <button key={p} role="radio" aria-checked={person.pronouns === p} onClick={() => update({ pronouns: p })} className={cx("eyebrow", person.pronouns === p ? "text-ink" : "text-mute hover:text-ink")}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button onClick={() => setEditingPortrait(true)} className="group relative aspect-[4/5] w-28 overflow-hidden md:w-full" aria-label="Change portrait">
          <Still image={person.portrait} alt={`${person.name} — portrait`} />
          <span className="eyebrow absolute bottom-2 left-2 bg-paper/90 px-2 py-1 opacity-0 group-hover:opacity-100">Change</span>
        </button>
      </header>

      <div className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-2">
        <PersonSection index={1} title={forms.who} wide>
          <EditableText label={forms.who} value={person.description} onSave={(description) => update({ description })} multiline placeholder="Who is this person, today?" className="text-xl leading-relaxed" />
        </PersonSection>
        <PersonSection index={2} title={forms.wants}>
          <EditableText label={forms.wants} value={person.wants} onSave={(wants) => update({ wants })} multiline placeholder="What they want — and what they say they want." className="serif text-2xl leading-snug italic" />
        </PersonSection>
        <PersonSection index={3} title={forms.fears}>
          <EditableText label={forms.fears} value={person.fears} onSave={(fears) => update({ fears })} multiline placeholder="What they're afraid of." className="serif text-2xl leading-snug italic" />
        </PersonSection>
        <PersonSection index={4} title="What we don't know yet" wide>
          <EditableText label="What we don't know yet" value={person.unknowns} onSave={(unknowns) => update({ unknowns })} multiline placeholder="The gaps are where the film is." className="text-lg leading-relaxed text-red" />
        </PersonSection>
        <PersonSection index={5} title="Important moments" wide>
          {moments.length > 0 && (
            <ul className="mb-4 flex flex-wrap gap-2">
              {moments.map((n) => (
                <li key={n.id}>
                  <Link href={`/films/${filmId}/story?node=${n.id}`} className="flex items-baseline gap-2 border border-rule bg-card px-3 py-1.5 hover:border-ink">
                    <span className="eyebrow text-[0.6rem] text-mute">{STORY_NODE_LABEL[n.type]}</span>
                    <span className="font-semibold uppercase">{n.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <ListEditor label="Moment" items={person.moments} onChange={(m) => update({ moments: m })} placeholder="A moment that matters…" itemClassName="text-lg leading-snug" />
        </PersonSection>
        <PersonSection index={6} title={person.type === "participant" ? "Interview notes" : "Notes"}>
          <EditableText
            label="Interview notes"
            value={person.interviewNotes}
            onSave={(interviewNotes) => update({ interviewNotes })}
            multiline
            placeholder={person.type === "participant" ? "What they said, and how." : "Voice, history, contradictions."}
            className="leading-relaxed whitespace-pre-wrap"
          />
          <p className="eyebrow mt-6 mb-1 text-mute">Working notes</p>
          <EditableText label="Notes" value={person.notes} onSave={(notes) => update({ notes })} multiline placeholder="Anything else." className="leading-relaxed text-ink-2" />
        </PersonSection>
        <PersonSection index={7} title="Archive">
          {archive.length ? (
            <ul className="divide-y divide-rule border-y border-rule">
              {archive.map((r) => (
                <li key={r.id}>
                  <Link href={`/films/${filmId}/research?item=${r.id}`} className="flex items-center gap-4 py-3 hover:text-red">
                    {r.image && (
                      <span className="h-12 w-12 shrink-0 overflow-hidden">
                        <Still image={r.image} alt="" />
                      </span>
                    )}
                    <span>
                      <span className="eyebrow block text-[0.6rem] text-mute">{RESEARCH_TYPE_LABEL[r.type]}</span>
                      {r.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-mute">Nothing in the research archive is connected to {person.name} yet.</p>
          )}
        </PersonSection>
      </div>

      <div className="mt-16 border-t border-rule pt-4">
        <ConfirmButton
          onConfirm={() => {
            actions.remove("people", person.id);
            onDeleted();
          }}
        >
          Remove {person.name} from the film
        </ConfirmButton>
      </div>

      <Drawer open={editingPortrait} onClose={() => setEditingPortrait(false)} title="Portrait" eyebrow={person.name}>
        <ImagePicker value={person.portrait} onChange={(portrait) => update({ portrait })} />
      </Drawer>
    </article>
  );
}

function PersonSection({ index, title, children, wide }: { index: number; title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <section className={cx(wide && "md:col-span-2")}>
      <SectionHeading index={index}>{title}</SectionHeading>
      <div className="mt-4">{children}</div>
    </section>
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
    // Every person gets a card on the story wall, so they can be connected to scenes.
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
      <form onSubmit={submit} className="space-y-7">
        <Field label="Name">
          <input data-autofocus required value={name} onChange={(e) => setName(e.target.value)} className="input text-2xl font-bold uppercase" />
        </Field>
        <Field label="Role in the film">
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Main subject, her mother, the doctor…" className="input" />
        </Field>
        <div className="flex gap-4" role="radiogroup" aria-label="Kind of person">
          {(["participant", "character"] as PersonType[]).map((t) => (
            <button type="button" key={t} role="radio" aria-checked={type === t} onClick={() => setType(t)} className={cx("eyebrow", type === t ? "text-red" : "text-mute hover:text-ink")}>
              {t === "participant" ? "Documentary participant" : "Fictional character"}
            </button>
          ))}
        </div>
        <button type="submit" className="eyebrow w-full bg-ink py-3.5 text-paper hover:bg-red">
          Add to the film
        </button>
      </form>
    </Drawer>
  );
}
