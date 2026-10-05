/**
 * Server-side AI route. Keeps API keys off the client and is the single place
 * where a model vendor is chosen. Today: Anthropic. Tomorrow: add a branch.
 */
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { PRODUCER_SYSTEM_PROMPT, SUGGEST_SYSTEM_PROMPT } from "@/lib/ai/prompts";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5";

type Body =
  | { mode: "ask"; brief: string; history: { role: "user" | "producer"; content: string }[]; question: string }
  | { mode: "suggest"; brief: string; text: string };

// If the model declines a request, the API re-routes it to a suitable fallback model.
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

function textOf(message: Anthropic.Beta.BetaMessage): string {
  return message.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 501 });
  }
  const body = (await req.json()) as Body;
  const client = new Anthropic();

  try {
    if (body.mode === "ask") {
      const messages: Anthropic.Beta.BetaMessageParam[] = [
        ...body.history.map((m) => ({
          role: m.role === "producer" ? ("assistant" as const) : ("user" as const),
          content: m.content,
        })),
        { role: "user", content: body.question },
      ];
      const message = await client.beta.messages.create({
        ...FALLBACK,
        model: MODEL,
        max_tokens: 16000,
        output_config: { effort: "medium" },
        system: [
          { type: "text", text: PRODUCER_SYSTEM_PROMPT },
          // The film brief is stable across a conversation, so cache it.
          { type: "text", text: `THE FILM BRIEF\n\n${body.brief}`, cache_control: { type: "ephemeral" } },
        ],
        messages,
      });
      if (message.stop_reason === "refusal") {
        return NextResponse.json({ text: "## I CAN'T HELP WITH THAT ONE\nTry asking about the film another way." });
      }
      return NextResponse.json({ text: textOf(message) });
    }

    const message = await client.beta.messages.create({
      ...FALLBACK,
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: "low" },
      system: SUGGEST_SYSTEM_PROMPT,
      messages: [{ role: "user", content: `${body.brief}\n\nNEW NOTE:\n${body.text}` }],
    });
    const raw = textOf(message);
    const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    return NextResponse.json(JSON.parse(json));
  } catch (error) {
    const status = error instanceof Anthropic.APIError && error.status ? error.status : 500;
    return NextResponse.json({ error: "AI request failed" }, { status });
  }
}
