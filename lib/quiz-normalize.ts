import type { QuizQuestion } from "./types";

/** Typed short-answer items cap at 15% of the quiz; the rest are multiple choice. */
export const SHORT_ANSWER_MAX_RATIO = 0.15;

function isMcq(q: unknown): q is QuizQuestion & { type: "mcq" } {
  if (!q || typeof q !== "object") return false;
  const row = q as Record<string, unknown>;
  return (
    row.type === "mcq" &&
    typeof row.question === "string" &&
    Array.isArray(row.choices) &&
    row.choices.length === 4 &&
    row.choices.every((c) => typeof c === "string") &&
    typeof row.answerIndex === "number" &&
    row.answerIndex >= 0 &&
    row.answerIndex < 4
  );
}

function isShort(q: unknown): q is QuizQuestion & { type: "short" } {
  if (!q || typeof q !== "object") return false;
  const row = q as Record<string, unknown>;
  return (
    row.type === "short" &&
    typeof row.question === "string" &&
    Array.isArray(row.acceptableAnswers) &&
    row.acceptableAnswers.some((a) => typeof a === "string" && a.trim())
  );
}

export function normalizeQuiz(raw: unknown[]): QuizQuestion[] {
  const mcq: QuizQuestion[] = [];
  const short: QuizQuestion[] = [];

  for (const item of raw) {
    if (isMcq(item)) {
      mcq.push({
        type: "mcq",
        question: item.question.trim(),
        choices: item.choices.map((c) => c.trim()),
        answerIndex: item.answerIndex,
      });
    } else if (isShort(item)) {
      short.push({
        type: "short",
        question: item.question.trim(),
        acceptableAnswers: item.acceptableAnswers.filter(
          (a): a is string => typeof a === "string" && a.trim().length > 0,
        ),
      });
    }
  }

  const combined = [...mcq, ...short];
  if (combined.length === 0) return [];

  const maxShort = Math.floor(combined.length * SHORT_ANSWER_MAX_RATIO);
  const keptShort = short.slice(0, maxShort);

  return [...mcq, ...keptShort].slice(0, 3);
}
