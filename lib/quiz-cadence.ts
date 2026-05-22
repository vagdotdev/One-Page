import { resolveLayer } from "./depth";
import type { Journey, QuizAnswer } from "./types";

// ---------------------------------------------------------------------------
// Decide whether the next layer to be generated should include a quiz.
//
// Quizzes are pedagogically valuable, but firing one on every layer interrupts
// flow and starts to feel like a chore — especially across a 40-layer climb.
// This module spaces them out intelligently.
//
// Rules:
//   1. Synthesis layer: never quiz (it's a reflection beat).
//   2. First layer of a journey: always quiz (anchor / validate placement).
//   3. Band transitions (depthLabel changes between layers): always quiz
//      — consolidates the band you just left.
//   4. Within a band: probabilistic, biased by recent performance.
//   5. Safety net: force a quiz after 4 quiz-less layers in a row.
//
// Net effect on a 40-layer climb: roughly 10–13 quizzes total, landing at
// meaningful moments rather than every single page.
// ---------------------------------------------------------------------------

// Probability of a quiz inside a band, given the most recent performance.
const PROB_AFTER_ACED = 0.2; // crushed it (100%) → lighten up significantly
const PROB_AFTER_PASSED = 0.35; // passed (66–99%) → moderate cadence
const PROB_AFTER_STRUGGLED = 0.7; // barely passed → check again sooner
const PROB_NO_HISTORY = 0.3; // fallback (last quiz had no answers stored)

const MAX_QUIZLESS_STREAK = 4;

function performanceRatio(answers: QuizAnswer[] | undefined): number | null {
  if (!answers || answers.length === 0) return null;
  const correct = answers.filter((a) => a.correct).length;
  return correct / answers.length;
}

export function shouldQuizForNext(journey: Journey): boolean {
  const targetIndex = journey.currentIndex;
  const target = resolveLayer(targetIndex);

  // The synthesis beat is reflection, never gated by a quiz.
  if (target.kind === "synthesis") return false;

  // Only layers *before* the one we're about to generate count as completed.
  const completed = journey.layers.filter(
    (p) => p.layer.index < targetIndex,
  );

  // First layer in this session (covers both fresh starts and placement skips).
  if (completed.length === 0) return true;

  // Band transition — depthLabel just changed. Quiz to consolidate the band
  // we just finished.
  const prev = completed[completed.length - 1];
  const prevLabel = resolveLayer(prev.layer.index).depthLabel;
  if (prevLabel !== target.depthLabel) return true;

  // Walk back to find the most recent quizzed layer + its performance.
  let sinceLastQuiz = 0;
  let lastQuizAnswers: QuizAnswer[] | undefined;
  for (let i = completed.length - 1; i >= 0; i--) {
    if (completed[i].layer.quiz.length > 0) {
      lastQuizAnswers = completed[i].answers;
      break;
    }
    sinceLastQuiz++;
  }

  // Safety net: never let the reader drift too long without a check.
  if (sinceLastQuiz >= MAX_QUIZLESS_STREAK) return true;

  const ratio = performanceRatio(lastQuizAnswers);
  let prob: number;
  if (ratio === null) prob = PROB_NO_HISTORY;
  else if (ratio === 1) prob = PROB_AFTER_ACED;
  else if (ratio >= 0.66) prob = PROB_AFTER_PASSED;
  else prob = PROB_AFTER_STRUGGLED;

  return Math.random() < prob;
}
