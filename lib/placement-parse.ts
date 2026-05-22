import type { PlacementQuestion } from "./types";

export function parsePlacementJSON(raw: string): PlacementQuestion[] {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) text = text.slice(start, end + 1);

  const parsed = JSON.parse(text) as { questions?: unknown[] };
  if (!Array.isArray(parsed.questions)) {
    throw new Error("Placement output missing questions array");
  }

  const out: PlacementQuestion[] = [];
  for (const item of parsed.questions) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (
      row.type !== "mcq" ||
      typeof row.question !== "string" ||
      !Array.isArray(row.choices) ||
      row.choices.length !== 4 ||
      !row.choices.every((c) => typeof c === "string") ||
      typeof row.answerIndex !== "number" ||
      row.answerIndex < 0 ||
      row.answerIndex > 3 ||
      typeof row.depthLevel !== "number"
    ) {
      continue;
    }
    out.push({
      type: "mcq",
      question: row.question.trim(),
      choices: row.choices.map((c) => (c as string).trim()),
      answerIndex: row.answerIndex,
      depthLevel: Math.max(0, Math.min(6, Math.floor(row.depthLevel))),
    });
  }

  if (out.length < 6) {
    throw new Error("Placement quiz too short");
  }

  return out.slice(0, 14);
}
