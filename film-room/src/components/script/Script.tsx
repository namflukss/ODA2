"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Connections } from "@/components/ui/Connections";
import { ConfirmButton, Select } from "@/components/ui/forms";
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
    <div className="grid gap-x-10 px-4 pb-24 md:grid-cols-12 md:px-10">
      <nav aria-label="Writing" className={cx("md:col-span-3", mobileEditing && "hidden md:block")}>
        <div className="border-t border-ink pt-4 md:sticky md:top-20">
          {DOCUMENT_TYPES.map((type) => {
            const list = docs.filter((d) => d.type === type);
            return (
              <div key={type} className="mb-6">
                <div className="flex items-baseline justify-between">
                  <p className="eyebrow text-mute">{DOCUMENT_TYPE_LABEL[type]}</p>
                  <button onClick={() => create(type)} className="eyebrow text-mute hover:text-red" aria-label={`New ${DOCUMENT_TYPE_LABEL[type]}`}>
                    +
                  </button>
                </div>
                <ul className="mt-1.5">
                  {list.map((d) => (
                    <li key={d.id}>
                      <button
                        onClick={() => select(d.id)}
                        aria-current={d.id === openId}
                        className={cx("block w-full py-1 text-left leading-snug", d.id === openId ? "font-semibold text-red" : "hover:text-red")}
                      >
                        {d.title}
                      </button>
                    </li>
                  ))}
                  {list.length === 0 && <li className="py-1 text-sm text-mute/70">—</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>

      <div className={cx("md:col-span-9", !mobileEditing && "hidden md:block")}>
        {open ? (
          <Editor key={open.id} doc={open} filmId={filmId} onBack={() => setMobileEditing(false)} onDeleted={() => setOpenId(null)} />
        ) : (
          <div className="border-t border-ink pt-8">
            <p className="serif text-3xl text-mute italic">Nothing open. Start with a treatment — a page is enough.</p>
            <button onClick={() => create("treatment")} className="link-action mt-6 inline-block">
              Start a treatment
            </button>
          </div>
        )}
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
    <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[1fr_260px]">
      <article className="border-t border-ink pt-4">
        <div className="flex items-center justify-between gap-4">
          <button onClick={onBack} className="eyebrow text-mute hover:text-ink md:hidden">
            ← All writing
          </button>
          <Select
            label="Kind of writing"
            value={doc.type}
            onChange={(type) => actions.update("documents", doc.id, { type, updatedAt: now() })}
            options={DOCUMENT_TYPES.map((t) => ({ value: t, label: DOCUMENT_TYPE_LABEL[t] }))}
            className="eyebrow w-auto border-0 py-0 text-red"
          />
          <span className="eyebrow text-mute" aria-live="polite">
            {saved ? `Saved · ${formatRelative(doc.updatedAt)}` : "Writing…"} · {words} words
          </span>
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Title"
          className="mt-6 w-full bg-transparent text-[clamp(1.75rem,3.4vw,3rem)] leading-tight font-extrabold tracking-tight uppercase outline-none"
        />
        <textarea
          ref={area}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          aria-label={`${DOCUMENT_TYPE_LABEL[doc.type]} text`}
          placeholder={isScreenplay ? "INT. SOMEWHERE — NIGHT" : "Write the film as you see it today…"}
          spellCheck
          className={cx(
            "mt-6 w-full max-w-[68ch] bg-transparent leading-[1.75] outline-none placeholder:text-mute/60",
            isScreenplay ? "font-mono text-[0.95rem] whitespace-pre-wrap" : "serif text-[1.35rem]",
          )}
        />
      </article>

      <aside className="space-y-8 border-t border-rule pt-4 lg:border-ink">
        <Connections
          filmId={filmId}
          value={doc.connections}
          onChange={(connections) => actions.update("documents", doc.id, { connections, updatedAt: now() })}
          types={["character", "scene", "theme", "research", "visual", "question", "story"]}
          label="This writing touches"
        />
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
