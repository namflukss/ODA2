"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Connections } from "@/components/ui/Connections";
import { ChevronLeft, Plus } from "lucide-react";
import { Card, ConfirmButton, PageHeader, Select } from "@/components/ui/forms";
import { useActions, useCollection } from "@/lib/store";
import type { DocumentType, WritingDocument } from "@/lib/types";
import { cx, formatRelative, now } from "@/lib/utils";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABEL } from "@/lib/vocabulary";

export function Script({ filmId }: { filmId: string }) {
  const docs = useCollection("documents", filmId);
  const actions = useActions();
  const params = useSearchParams();
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(params.get("doc") ?? docs[0]?.id ?? null);
  const [mobileEditing, setMobileEditing] = useState(!!params.get("doc"));
  const open = docs.find((d) => d.id === openId);

  const select = (id: string) => {
    setOpenId(id);
    setMobileEditing(true);
    router.replace(`/films/${filmId}/script?doc=${id}`, { scroll: false });
  };

  const create = (type: DocumentType) => {
    const stamp = now();
    const d = actions.create("documents", {
      filmId,
      type,
      title: `New ${DOCUMENT_TYPE_LABEL[type].toLowerCase()}`,
      content: "",
      connections: [],
      createdAt: stamp,
      updatedAt: stamp,
    });
    select(d.id);
  };

  return (
    <div className="space-y-5">
      <div className={cx(mobileEditing && "hidden md:block")}>
        <PageHeader title="Script" subtitle="Treatment, outline, scene ideas, screenplay fragments and notes — connected to the rest of the film." />
      </div>
      <div className="grid items-start gap-5 md:grid-cols-12">
      <nav aria-label="Writing" className={cx("card p-3 md:sticky md:top-6 md:col-span-3", mobileEditing && "hidden md:block")}>
        {DOCUMENT_TYPES.map((type) => {
          const list = docs.filter((d) => d.type === type);
          return (
            <div key={type} className="mb-2">
              <div className="flex items-center justify-between px-2 pt-2 pb-1">
                <p className="label">{DOCUMENT_TYPE_LABEL[type]}</p>
                <button onClick={() => create(type)} className="rounded-md p-1 text-mute hover:bg-hover hover:text-ink" aria-label={`New ${DOCUMENT_TYPE_LABEL[type]}`}>
                  <Plus size={14} />
                </button>
              </div>
              <ul>
                {list.map((d) => (
                  <li key={d.id}>
                    <button
                      onClick={() => select(d.id)}
                      aria-current={d.id === openId}
                      className={cx("block w-full rounded-lg px-2 py-1.5 text-left text-sm leading-snug", d.id === openId ? "bg-accent-soft font-medium text-accent-deep" : "hover:bg-hover")}
                    >
                      {d.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className={cx("md:col-span-9", !mobileEditing && "hidden md:block")}>
        {open ? (
          <Editor key={open.id} doc={open} filmId={filmId} onBack={() => setMobileEditing(false)} onDeleted={() => setOpenId(null)} />
        ) : (
          <div className="card p-10 text-center">
            <p className="text-lg font-medium">Nothing open.</p>
            <p className="mt-1 text-ink-2">Start with a treatment — a page is enough.</p>
            <button onClick={() => create("treatment")} className="btn btn-primary mt-5">
              <Plus size={15} /> Start a treatment
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

function Editor({ doc, filmId, onBack, onDeleted }: { doc: WritingDocument; filmId: string; onBack: () => void; onDeleted: () => void }) {
  const actions = useActions();
  const [title, setTitle] = useState(doc.title);
  const [content, setContent] = useState(doc.content);
  const [saved, setSaved] = useState(true);
  const area = useRef<HTMLTextAreaElement>(null);
  const isScreenplay = doc.type === "fragment";

  // Autosave shortly after typing stops.
  useEffect(() => {
    if (title === doc.title && content === doc.content) return;
    setSaved(false);
    const t = setTimeout(() => {
      actions.update("documents", doc.id, { title: title.trim() || "Untitled", content, updatedAt: now() });
      setSaved(true);
    }, 600);
    return () => clearTimeout(t);
  }, [title, content, doc.id, doc.title, doc.content, actions]);

  useLayoutEffect(() => {
    const el = area.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.max(el.scrollHeight, 480)}px`;
    }
  }, [content]);

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_260px]">
      <article className="card px-5 py-4 md:px-10 md:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={onBack} className="btn btn-quiet -ml-3 md:hidden">
            <ChevronLeft size={15} /> All writing
          </button>
          <Select
            label="Kind of writing"
            value={doc.type}
            onChange={(type) => actions.update("documents", doc.id, { type, updatedAt: now() })}
            options={DOCUMENT_TYPES.map((t) => ({ value: t, label: DOCUMENT_TYPE_LABEL[t] }))}
            className="w-auto rounded-full py-1 text-sm"
          />
          <span className="text-xs text-mute" aria-live="polite">
            {saved ? `Saved · ${formatRelative(doc.updatedAt)}` : "Writing…"} · {words} words
          </span>
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Title"
          className="mt-6 w-full bg-transparent text-[1.75rem] leading-tight font-semibold tracking-tight outline-none md:text-[2rem]"
        />
        <textarea
          ref={area}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          aria-label={`${DOCUMENT_TYPE_LABEL[doc.type]} text`}
          placeholder={isScreenplay ? "INT. SOMEWHERE — NIGHT" : "Write the film as you see it today…"}
          spellCheck
          className={cx(
            "mt-4 w-full max-w-[68ch] bg-transparent leading-[1.75] outline-none placeholder:text-mute/60",
            isScreenplay ? "font-mono text-[0.92rem] whitespace-pre-wrap" : "serif text-[1.3rem]",
          )}
        />
      </article>

      <aside className="space-y-3 lg:sticky lg:top-6">
        <Card title="This writing touches">
        <Connections
          compact
          filmId={filmId}
          value={doc.connections}
          onChange={(connections) => actions.update("documents", doc.id, { connections, updatedAt: now() })}
          types={["character", "scene", "theme", "research", "visual", "question", "story"]}
          label="This writing touches"
        />
        </Card>
        <ConfirmButton
          onConfirm={() => {
            actions.remove("documents", doc.id);
            onDeleted();
          }}
        >
          Delete
        </ConfirmButton>
      </aside>
    </div>
  );
}
