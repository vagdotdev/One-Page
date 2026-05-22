import { generateWithSystem, pickProvider } from "./llm";
import { gradeShortAnswerLocally } from "./quiz-grade-local";

export type ShortAnswerGradeItem = {
  index: number;
  question: string;
  referencePhrases: string[];
  answer: string;
};

const GRADE_SYSTEM = `You grade short-answer quiz responses for a learning app.

Be generous: accept paraphrases, synonyms, informal wording, and partial answers that show the reader understood the core idea. Only mark incorrect when the answer is clearly wrong, off-topic, or empty of relevant ideas.

Return ONLY valid JSON, no markdown, matching:
{ "results": [ { "index": number, "correct": boolean }, ... ] }

Include one result per input item, using the same index values.`;

function parseGradeJSON(
  raw: string,
  items: ShortAnswerGradeItem[],
): boolean[] | null {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) text = text.slice(start, end + 1);

  try {
    const parsed = JSON.parse(text) as {
      results?: { index?: unknown; correct?: unknown }[];
    };
    if (!Array.isArray(parsed.results)) return null;

    const byIndex = new Map<number, boolean>();
    for (const row of parsed.results) {
      if (
        typeof row.index === "number" &&
        typeof row.correct === "boolean"
      ) {
        byIndex.set(row.index, row.correct);
      }
    }

    return items.map((item) => byIndex.get(item.index) ?? false);
  } catch {
    return null;
  }
}

export async function gradeShortAnswers(
  items: ShortAnswerGradeItem[],
  layerContext: string,
): Promise<boolean[]> {
  if (items.length === 0) return [];

  const fallback = () =>
    items.map((item) =>
      gradeShortAnswerLocally(item.referencePhrases, item.answer),
    );

  if (!pickProvider()) return fallback();

  try {
    const raw = await generateWithSystem(
      GRADE_SYSTEM,
      JSON.stringify(
        {
          layerContext: layerContext.slice(0, 2000),
          items: items.map((item) => ({
            index: item.index,
            question: item.question,
            referenceIdeas: item.referencePhrases,
            studentAnswer: item.answer,
          })),
        },
        null,
        2,
      ),
      512,
    );
    const parsed = parseGradeJSON(raw, items);
    if (!parsed) return fallback();
    return parsed.map(
      (llmCorrect, i) =>
        llmCorrect ||
        gradeShortAnswerLocally(items[i].referencePhrases, items[i].answer),
    );
  } catch {
    return fallback();
  }
}
