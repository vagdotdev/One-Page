import type { NextRequest } from "next/server";
import { generateWithSystem } from "@/lib/llm";
import { parsePlacementJSON } from "@/lib/placement-parse";
import {
  PLACEMENT_SYSTEM,
  buildPlacementUserMessage,
} from "@/lib/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { topic } = (body || {}) as { topic?: unknown };
  if (typeof topic !== "string" || !topic.trim()) {
    return Response.json({ error: "Missing topic" }, { status: 400 });
  }

  try {
    const raw = await generateWithSystem(
      PLACEMENT_SYSTEM,
      buildPlacementUserMessage(topic.trim()),
      2500,
    );
    const questions = parsePlacementJSON(raw);
    return Response.json({ questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = /api key/i.test(message) ? 503 : 500;
    return Response.json({ error: message }, { status });
  }
}
