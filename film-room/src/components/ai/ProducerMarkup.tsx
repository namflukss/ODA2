/**
 * Renders the producer's light markup (see lib/ai/types.ts) as editorial text.
 */
import type { ReactNode } from "react";

export function ProducerMarkup({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: { n: string; text: string }[] = [];

  const flush = () => {
    if (paragraph.length) {
      blocks.push(
        <p key={blocks.length} className="leading-relaxed text-ink-2">
          {paragraph.join(" ")}
        </p>,
      );
      paragraph = [];
    }
    if (list.length) {
      blocks.push(
        <ol key={blocks.length} className="divide-y divide-rule border-y border-rule">
          {list.map((item) => (
            <li key={item.n + item.text} className="flex items-baseline gap-4 py-2">
              <span className="eyebrow text-red tabular-nums">{item.n}</span>
              <span className="font-medium">{item.text}</span>
            </li>
          ))}
        </ol>,
      );
      list = [];
    }
  };

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const numbered = line.match(/^(\d{2})\s*\/\s*(.+)$/);
    if (!line) flush();
    else if (line.startsWith("## ")) {
      flush();
      blocks.push(
        <h3 key={blocks.length} className="eyebrow pt-2 text-red">
          {line.slice(3)}
        </h3>,
      );
    } else if (line.startsWith("> ")) {
      flush();
      blocks.push(
        <p key={blocks.length} className="serif text-2xl leading-snug italic">
          {line.slice(2)}
        </p>,
      );
    } else if (numbered) {
      if (paragraph.length) {
        const p = paragraph;
        paragraph = [];
        blocks.push(
          <p key={blocks.length} className="leading-relaxed text-ink-2">
            {p.join(" ")}
          </p>,
        );
      }
      list.push({ n: numbered[1], text: numbered[2] });
    } else {
      if (list.length) flush();
      paragraph.push(line);
    }
  }
  flush();

  return <div className="space-y-3">{blocks}</div>;
}
