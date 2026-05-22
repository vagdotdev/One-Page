import type { NextRequest } from "next/server";
import { chatWithSystem, type ChatTurn } from "@/lib/llm";
import { CHAT_SYSTEM_PROMPT, buildChatContextBlock } from "@/lib/prompts";

// POST /api/chat
// Body: {
//   topic: string,
//   layerText?: string,
//   anchorText?: string,
//   messages: { role: "user" | "assistant", content: string }[]
// }
// Returns: { content: string }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  topic?: unknown;
  layerText?: unknown;
  anchorText?: unknown;
  messages?: unknown;
};

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const layerText =
    typeof body.layerText === "string" ? body.layerText : undefined;
  const anchorText =
    typeof body.anchorText === "string" ? body.anchorText : undefined;

  if (!topic) {
    return Response.json({ error: "Missing topic" }, { status: 400 });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "Missing messages" }, { status: 400 });
  }

  const turns: ChatTurn[] = [];
  for (const m of body.messages as unknown[]) {
    if (!m || typeof m !== "object") continue;
    const mm = m as { role?: unknown; content?: unknown };
    if (
      (mm.role === "user" || mm.role === "assistant") &&
      typeof mm.content === "string" &&
      mm.content.trim()
    ) {
      turns.push({ role: mm.role, content: mm.content });
    }
  }
  if (turns.length === 0 || turns[turns.length - 1].role !== "user") {
    return Response.json(
      { error: "Conversation must end with a user message" },
      { status: 400 },
    );
  }

  const context = buildChatContextBlock({ topic, layerText, anchorText });
  const system = `${CHAT_SYSTEM_PROMPT}\n\n---\n${context}`;

  try {
    const content = await chatWithSystem(system, turns);
    return Response.json({ content });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = /api key/i.test(message) ? 503 : 500;
    return Response.json({ error: message }, { status });
  }
}
