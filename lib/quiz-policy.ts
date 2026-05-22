import type { LayerKind, QuizQuestion } from "./types";

/** First two layers (beginner beats) — quiz optional when content is too simple to check. */
export const EARLY_OPTIONAL_QUIZ_MAX_INDEX = 1;

export function earlyLayerQuizOptional(layerIndex: number): boolean {
  return layerIndex >= 0 && layerIndex <= EARLY_OPTIONAL_QUIZ_MAX_INDEX;
}

export function quizPolicyHint(layerIndex: number): string | null {
  if (!earlyLayerQuizOptional(layerIndex)) return null;
  return [
    "Quiz judgment (first pages only):",
    "- Questions must test understanding — not \"which field uses X\" or trivia.",
    "- If you taught a concrete step, include 2 MCQ; skip only when a check would be pointless.",
    "- Default to a short quiz when unsure.",
  ].join("\n");
}

const TRIVIAL_QUIZ_RE =
  /^(what (is|are)\b|which of the following best defines|the main idea of this (page|layer) is)/i;

function isTrivialEarlyQuiz(
  quiz: QuizQuestion[],
  paragraphs: string[],
): boolean {
  if (quiz.length === 0 || quiz.length > 2) return false;
  const words = paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
  if (words > 220) return false;

  return quiz.every((q) => {
    const text = q.question.trim();
    return text.length < 72 && TRIVIAL_QUIZ_RE.test(text);
  });
}

/** Apply kind rules after normalize; never invent questions server-side. */
export function finalizeLayerQuiz(
  layerIndex: number,
  kind: LayerKind,
  quiz: QuizQuestion[],
  paragraphs: string[] = [],
): QuizQuestion[] {
  if (kind === "synthesis") return [];
  if (!earlyLayerQuizOptional(layerIndex)) return quiz;
  if (quiz.length === 0) return [];
  if (isTrivialEarlyQuiz(quiz, paragraphs)) return [];
  return quiz;
}
