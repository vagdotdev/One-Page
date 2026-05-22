import type { NextRequest } from "next/server";
import { MAX_LAYER_INDEX, resolveLayer } from "@/lib/depth";
import { generateJSON, parseLayerJSON } from "@/lib/llm";
import { buildReviseUserMessage } from "@/lib/prompts";
import { normalizeQuiz } from "@/lib/quiz-normalize";
import { finalizeLayerQuiz } from "@/lib/quiz-policy";
import type { Layer } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { topic, currentLayer, priorLayers, missedQuestions } = (body ||
    {}) as {
    topic?: unknown;
    currentLayer?: unknown;
    priorLayers?: unknown;
    missedQuestions?: unknown;
  };

  if (typeof topic !== "string" || !topic.trim()) {
    return Response.json({ error: "Missing topic" }, { status: 400 });
  }

  const layer = currentLayer as Layer;
  if (
    !layer ||
    typeof layer.index !== "number" ||
    layer.index < 0 ||
    layer.index >= MAX_LAYER_INDEX
  ) {
    return Response.json({ error: "Invalid currentLayer" }, { status: 400 });
  }

  const prior = Array.isArray(priorLayers) ? (priorLayers as Layer[]) : [];
  const missed = Array.isArray(missedQuestions)
    ? missedQuestions.filter((q): q is string => typeof q === "string")
    : [];

  const { kind } = resolveLayer(layer.index);
  const userMessage = buildReviseUserMessage({
    topic: topic.trim(),
    layerIndex: layer.index,
    currentLayer: layer,
    priorLayers: prior,
    missedQuestions: missed,
  });

  try {
    const raw = await generateJSON(userMessage);
    const gen = parseLayerJSON(raw);

    const revised: Layer = {
      kind,
      index: layer.index,
      title: gen.title,
      layerLabel: gen.layerLabel,
      paragraphs: gen.paragraphs.filter((p) => typeof p === "string"),
      quiz: finalizeLayerQuiz(
        layer.index,
        kind,
        Array.isArray(gen.quiz) ? normalizeQuiz(gen.quiz) : [],
        gen.paragraphs.filter((p) => typeof p === "string"),
      ),
    };

    return Response.json({ layer: revised });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = /api key/i.test(message) ? 503 : 500;
    return Response.json({ error: message }, { status });
  }
}
