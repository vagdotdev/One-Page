import type { NextRequest } from "next/server";
import { gradeShortAnswers, type ShortAnswerGradeItem } from "@/lib/quiz-grade";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { layerContext, items } = (body || {}) as {
    layerContext?: unknown;
    items?: unknown;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "Missing items" }, { status: 400 });
  }

  const graded: ShortAnswerGradeItem[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    if (
      typeof row.index !== "number" ||
      typeof row.question !== "string" ||
      typeof row.answer !== "string" ||
      !Array.isArray(row.referencePhrases)
    ) {
      continue;
    }
    graded.push({
      index: row.index,
      question: row.question,
      referencePhrases: row.referencePhrases.filter(
        (p): p is string => typeof p === "string",
      ),
      answer: row.answer,
    });
  }

  if (graded.length === 0) {
    return Response.json({ error: "No valid items" }, { status: 400 });
  }

  const context =
    typeof layerContext === "string" ? layerContext : "";

  try {
    const correct = await gradeShortAnswers(graded, context);
    return Response.json({
      results: graded.map((item, i) => ({
        index: item.index,
        correct: correct[i],
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = /api key/i.test(message) ? 503 : 500;
    return Response.json({ error: message }, { status });
  }
}
