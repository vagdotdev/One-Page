import type { NextRequest } from "next/server";
import { generateJSON, parseLayerJSON } from "@/lib/llm";
import { MAX_LAYER_INDEX, resolveLayer } from "@/lib/depth";
import { buildUserMessage } from "@/lib/prompts";
import { normalizeQuiz } from "@/lib/quiz-normalize";
import { finalizeLayerQuiz } from "@/lib/quiz-policy";
import type { Layer } from "@/lib/types";

// Generate a single layer for a topic.
// POST body: {
//   topic: string,
//   layerIndex: number,
//   priorLayers: Layer[],
//   includeQuiz?: boolean   // default true; client-side cadence decides
// }
// Returns:   { layer: Layer }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { topic, layerIndex, priorLayers, includeQuiz } = (body || {}) as {
    topic?: unknown;
    layerIndex?: unknown;
    priorLayers?: unknown;
    includeQuiz?: unknown;
  };

  // Default to true if not specified (keeps API back-compatible).
  const wantQuiz = includeQuiz !== false;

  if (typeof topic !== "string" || !topic.trim()) {
    return Response.json({ error: "Missing topic" }, { status: 400 });
  }
  if (
    typeof layerIndex !== "number" ||
    !Number.isInteger(layerIndex) ||
    layerIndex < 0 ||
    layerIndex >= MAX_LAYER_INDEX
  ) {
    return Response.json({ error: "Invalid layerIndex" }, { status: 400 });
  }
  const prior = Array.isArray(priorLayers) ? (priorLayers as Layer[]) : [];
  const { kind } = resolveLayer(layerIndex);

  const userMessage = buildUserMessage({
    topic: topic.trim(),
    layerIndex,
    priorLayers: prior,
    includeQuiz: wantQuiz,
  });

  try {
    const raw = await generateJSON(userMessage);
    const gen = parseLayerJSON(raw);

    const cleanParagraphs = gen.paragraphs.filter((p) => typeof p === "string");
    // Hard guard: if cadence said no quiz, drop whatever the model returned.
    const modelQuiz =
      wantQuiz && Array.isArray(gen.quiz) ? normalizeQuiz(gen.quiz) : [];

    const layer: Layer = {
      kind,
      index: layerIndex,
      title: gen.title,
      layerLabel: gen.layerLabel,
      paragraphs: cleanParagraphs,
      quiz: finalizeLayerQuiz(layerIndex, kind, modelQuiz, cleanParagraphs),
    };

    return Response.json({ layer });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // Distinguish missing-key (likely setup) from generation errors.
    const status = /api key/i.test(message) ? 503 : 500;
    return Response.json({ error: message }, { status });
  }
}
