"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { EditableText } from "@/components/ui/EditableText";
import { Link2, Plus, User, X } from "lucide-react";
import { Badge, ConfirmButton, FilterTabs, PageHeader, Select } from "@/components/ui/forms";
import { nudge, startDrag } from "@/lib/drag";
import { useActions, useCollection } from "@/lib/store";
import type { Point, StoryNode, StoryNodeType, StoryView } from "@/lib/types";
import { useIsDesktop } from "@/lib/useMediaQuery";
import { cx } from "@/lib/utils";
import { STORY_NODE_LABEL, STORY_NODE_TYPES, STORY_VIEWS } from "@/lib/vocabulary";
import { NODE_TONE, NODE_WIDTH, StoryNodeCard } from "./StoryNodeCard";

const WALL = { w: 1760, h: 1040 };

const posIn = (n: StoryNode, view: StoryView): Point => (view === "structure" ? n.position : n.positions?.[view] ?? n.position);

export function StoryMap({ filmId }: { filmId: string }) {
  const nodes = useCollection("storyNodes", filmId);
  const people = useCollection("people", filmId);
  const actions = useActions();
  const params = useSearchParams();
  const isDesktop = useIsDesktop();
  const [view, setView] = useState<StoryView>("structure");
  const [layout, setLayout] = useState<"wall" | "sequence">("wall");
  const [selectedId, setSelectedId] = useState<string | null>(params.get("node"));
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [live, setLive] = useState<Record<string, Point>>({});
  const scroller = useRef<HTMLDivElement>(null);

  const viewDef = STORY_VIEWS.find((v) => v.id === view)!;
  const visible = useMemo(() => nodes.filter((n) => viewDef.types.includes(n.type)), [nodes, viewDef]);
  const selected = nodes.find((n) => n.id === selectedId);

  // Undirected edges between visible nodes, deduplicated.
  const edges = useMemo(() => {
    const seen = new Set<string>();
    const out: [StoryNode, StoryNode][] = [];
    const byId = new Map(visible.map((n) => [n.id, n]));
    for (const a of visible)
      for (const id of a.connections) {
        const b = byId.get(id);
        const key = [a.id, id].sort().join("|");
        if (b && !seen.has(key)) {
          seen.add(key);
          out.push([a, b]);
        }
      }
    return out;
  }, [visible]);

  // Deep link: scroll the selected node into view once.
  useEffect(() => {
    const id = params.get("node");
    const n = nodes.find((x) => x.id === id);
    if (n && scroller.current) {
      const p = posIn(n, view);
      scroller.current.scrollTo({ left: Math.max(0, p.x - 200), top: Math.max(0, p.y - 160), behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!connectFrom) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setConnectFrom(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [connectFrom]);

  const pin = (n: StoryNode): Point => {
    const p = live[n.id] ?? posIn(n, view);
    return { x: p.x + NODE_WIDTH[n.type] / 2, y: p.y };
  };

  const move = (n: StoryNode, p: Point) =>
    view === "structure"
      ? actions.update("storyNodes", n.id, { position: p })
      : actions.update("storyNodes", n.id, { positions: { ...n.positions, [view]: p } });

  const toggleConnection = (a: StoryNode, b: StoryNode) => {
    const linked = a.connections.includes(b.id) || b.connections.includes(a.id);
    if (linked) {
      actions.update("storyNodes", a.id, { connections: a.connections.filter((c) => c !== b.id) });
      actions.update("storyNodes", b.id, { connections: b.connections.filter((c) => c !== a.id) });
    } else {
      actions.update("storyNodes", a.id, { connections: [...a.connections, b.id] });
    }
  };

  const onNodeClick = (n: StoryNode) => {
    if (connectFrom && connectFrom !== n.id) {
      const from = nodes.find((x) => x.id === connectFrom);
      if (from) toggleConnection(from, n);
      setConnectFrom(null);
      setSelectedId(n.id);
      return;
    }
    setSelectedId(n.id);
  };

  const addNode = (type: StoryNodeType) => {
    const el = scroller.current;
    const p = {
      x: Math.round((el?.scrollLeft ?? 0) + (el?.clientWidth ?? 800) / 2 - NODE_WIDTH[type] / 2 + (Math.random() - 0.5) * 60),
      y: Math.round((el?.scrollTop ?? 0) + (el?.clientHeight ?? 600) / 2 - 40 + (Math.random() - 0.5) * 60),
    };
    const node = actions.create("storyNodes", {
      filmId,
      type,
      title: type === "question" ? "A new question?" : `New ${STORY_NODE_LABEL[type].toLowerCase()}`,
      content: "",
      position: p,
      positions: view === "structure" ? undefined : { [view]: p },
      connections: [],
    });
    setSelectedId(node.id);
  };

  const sequence = useMemo(
    () => nodes.filter((n) => n.type === "scene" || n.type === "turning_point").sort((a, b) => a.position.x - b.position.x),
    [nodes],
  );

  const panel = selected && (
    <NodePanel
      node={selected}
      nodes={nodes}
      filmId={filmId}
      onClose={() => setSelectedId(null)}
      onConnect={() => setConnectFrom(selected.id)}
      connecting={connectFrom === selected.id}
      onToggle={(other) => toggleConnection(selected, other)}
    />
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Story map"
        subtitle={viewDef.hint}
        actions={
          <div className="flex rounded-full border border-line bg-surface p-0.5">
            {([
              ["wall", "Map"],
              ["sequence", "Sequence"],
            ] as const).map(([l, label]) => (
              <button
                key={l}
                onClick={() => setLayout(l)}
                aria-pressed={layout === l}
                className={cx("rounded-full px-3 py-1 text-xs font-medium", layout === l ? "bg-ink text-white" : "text-ink-2 hover:text-ink")}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs label="Story views" value={view} onChange={setView} options={STORY_VIEWS.map((v) => ({ value: v.id, label: v.label }))} />
        <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
          <span className="mr-1 text-xs text-mute">Add</span>
          {STORY_NODE_TYPES.map((t) => (
            <button key={t} onClick={() => addNode(t)} className="pill shrink-0 py-1 text-xs">
              <Plus size={12} /> {STORY_NODE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {connectFrom && (
        <div className="sticky top-16 z-20 flex items-center justify-between gap-4 rounded-full bg-ink px-5 py-2.5 text-sm text-white md:top-4">
          <span>
            Choose what to connect “{nodes.find((n) => n.id === connectFrom)?.title}” to — choose a connected one to disconnect
          </span>
          <button onClick={() => setConnectFrom(null)} className="shrink-0 text-white/70 hover:text-white">
            Cancel (Esc)
          </button>
        </div>
      )}

      {layout === "wall" ? (
        <div className="relative flex gap-4">
          <div ref={scroller} className="wall relative h-[74dvh] min-h-[520px] flex-1 overflow-auto rounded-3xl border border-line" aria-label="Story map">
            <div className="relative" style={{ width: WALL.w, height: WALL.h }}>
              <svg className="pointer-events-none absolute inset-0" width={WALL.w} height={WALL.h} aria-hidden>
                {edges.map(([a, b]) => {
                  const p = pin(a);
                  const q = pin(b);
                  const sag = Math.min(120, Math.hypot(q.x - p.x, q.y - p.y) * 0.18);
                  const hot = selectedId === a.id || selectedId === b.id;
                  return (
                    <path
                      key={`${a.id}-${b.id}`}
                      d={`M ${p.x} ${p.y} Q ${(p.x + q.x) / 2} ${(p.y + q.y) / 2 + sag} ${q.x} ${q.y}`}
                      fill="none"
                      stroke={hot ? "var(--color-accent)" : "var(--color-ink-2)"}
                      strokeOpacity={hot ? 0.9 : 0.3}
                      strokeWidth={hot ? 2 : 1.25}
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
              {visible.map((n) => {
                const p = live[n.id] ?? posIn(n, view);
                const related = selected && (selected.connections.includes(n.id) || n.connections.includes(selected.id) || selected.id === n.id);
                return (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${STORY_NODE_LABEL[n.type]}: ${n.title}`}
                    aria-pressed={selectedId === n.id}
                    className={cx("absolute cursor-grab touch-none select-none active:cursor-grabbing", live[n.id] && "z-20")}
                    style={{ left: p.x, top: p.y, width: NODE_WIDTH[n.type] }}
                    onPointerDown={(e) =>
                      startDrag(e, posIn(n, view), {
                        onMove: (np) => setLive((l) => ({ ...l, [n.id]: np })),
                        onEnd: (np) => {
                          move(n, np);
                          setLive(({ [n.id]: _, ...rest }) => rest);
                        },
                        onClick: () => onNodeClick(n),
                        bounds: { minX: 0, minY: 8, maxX: WALL.w - NODE_WIDTH[n.type], maxY: WALL.h - 80 },
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onNodeClick(n);
                      }
                      const np = nudge(e, posIn(n, view));
                      if (np) {
                        e.preventDefault();
                        move(n, np);
                      }
                    }}
                  >
                    <StoryNodeCard
                      node={n}
                      person={people.find((x) => x.id === n.personId)}
                      selected={selectedId === n.id}
                      dimmed={!!selected && !related}
                      connecting={!!connectFrom}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          {isDesktop && panel && <aside className="card w-[320px] shrink-0 overflow-hidden">{panel}</aside>}
        </div>
      ) : (
        <Sequence nodes={sequence} onOpen={setSelectedId} />
      )}

      <p className="text-xs text-mute">
        Drag to move · click to open · arrow keys nudge a focused card · {visible.length} pinned in this view
        {nodes.length - visible.length > 0 && `, ${nodes.length - visible.length} hidden`}
      </p>

      {(!isDesktop || layout === "sequence") && (
        <Drawer open={!!selected} onClose={() => setSelectedId(null)} title={selected?.title ?? ""} eyebrow={selected ? STORY_NODE_LABEL[selected.type] : ""}>
          {panel}
        </Drawer>
      )}
    </div>
  );
}

function Sequence({ nodes, onOpen }: { nodes: StoryNode[]; onOpen: (id: string) => void }) {
  return (
    <ol className="space-y-2">
      {nodes.map((n, i) => (
        <li key={n.id}>
          <button onClick={() => onOpen(n.id)} className="card group grid w-full grid-cols-[2.5rem_1fr] gap-x-4 gap-y-1 p-4 text-left hover:shadow-[var(--shadow-lift)] md:grid-cols-[2.5rem_16rem_1fr]">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-sunken text-sm font-medium tabular-nums">{i + 1}</span>
            <span>
              <Badge tone={NODE_TONE[n.type]}>{STORY_NODE_LABEL[n.type]}</Badge>
              <span className="mt-1 block text-lg font-semibold group-hover:text-accent">{n.title}</span>
            </span>
            <span className="col-start-2 text-sm leading-relaxed text-ink-2 md:col-start-3">{n.content}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function NodePanel({
  node,
  nodes,
  filmId,
  onClose,
  onConnect,
  connecting,
  onToggle,
}: {
  node: StoryNode;
  nodes: StoryNode[];
  filmId: string;
  onClose: () => void;
  onConnect: () => void;
  connecting: boolean;
  onToggle: (other: StoryNode) => void;
}) {
  const actions = useActions();
  const linked = nodes.filter((n) => n.id !== node.id && (node.connections.includes(n.id) || n.connections.includes(node.id)));
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <Select
          label="Node type"
          value={node.type}
          onChange={(type) => actions.update("storyNodes", node.id, { type })}
          options={(["film", ...STORY_NODE_TYPES] as StoryNodeType[]).map((t) => ({ value: t, label: STORY_NODE_LABEL[t] }))}
          className="w-auto py-1 text-sm"
        />
        <button onClick={onClose} className="hidden rounded-full p-1.5 text-mute hover:bg-hover hover:text-ink md:block" aria-label="Close">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <EditableText
          label="Title"
          value={node.title}
          onSave={(title) => title && actions.update("storyNodes", node.id, { title })}
          multiline
          className="text-xl leading-tight font-semibold"
        />
        <EditableText
          label="Description"
          value={node.content}
          onSave={(content) => actions.update("storyNodes", node.id, { content })}
          multiline
          placeholder="What happens, what it means, what you're unsure of…"
          className="serif text-lg leading-snug"
        />
        {node.personId && (
          <Link href={`/films/${filmId}/people?person=${node.personId}`} className="btn btn-ghost">
            <User size={14} /> Open person
          </Link>
        )}
        <div>
          <div className="flex items-center justify-between">
            <p className="label">Connected to</p>
            <button onClick={onConnect} className={cx("pill py-1 text-xs", connecting && "border-accent text-accent")}>
              <Link2 size={12} /> {connecting ? "Choose on the map…" : "Connect"}
            </button>
          </div>
          <ul className="mt-2 space-y-1">
            {linked.length === 0 && <li className="text-sm text-mute">Not connected to anything yet.</li>}
            {linked.map((n) => (
              <li key={n.id} className="group flex items-center justify-between gap-2 rounded-xl bg-canvas px-3 py-2">
                <span className="min-w-0">
                  <span className="block text-[0.7rem] text-mute">{STORY_NODE_LABEL[n.type]}</span>
                  <span className="block truncate text-sm font-medium">{n.title}</span>
                </span>
                <button onClick={() => onToggle(n)} className="rounded-full p-1 text-mute hover:bg-hover hover:text-accent" aria-label={`Disconnect from ${n.title}`}>
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-line px-4 py-2">
        <ConfirmButton
          onConfirm={() => {
            actions.remove("storyNodes", node.id);
            onClose();
          }}
        >
          Remove from map
        </ConfirmButton>
      </div>
    </div>
  );
}
