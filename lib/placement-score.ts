import {
  MAX_LAYER_INDEX,
  PLACEMENT_MAX_START_INDEX,
  placementBandToLayerIndex,
} from "./depth";
import type { PlacementQuestion } from "./types";

const MASTERY_THRESHOLD = 0.66;

/**
 * Walk placement bands (0–6). Mastery skips intro only — capped well before PhD.
 */
export function computePlacementStartIndex(
  questions: PlacementQuestion[],
  selections: (number | null)[],
): number {
  if (questions.length === 0) return 0;

  const byBand = new Map<number, { correct: number; total: number }>();

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const band = Math.max(0, Math.min(6, Math.floor(q.depthLevel)));
    const bucket = byBand.get(band) ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (selections[i] !== null && selections[i] === q.answerIndex) {
      bucket.correct += 1;
    }
    byBand.set(band, bucket);
  }

  const bands = [...byBand.keys()].sort((a, b) => a - b);
  if (bands.length === 0) return 0;

  let start = 0;
  for (const band of bands) {
    const { correct, total } = byBand.get(band)!;
    const rate = total > 0 ? correct / total : 0;
    if (rate >= MASTERY_THRESHOLD) {
      const nextBand = Math.min(7, band + 1);
      start =
        nextBand > 6
          ? PLACEMENT_MAX_START_INDEX
          : placementBandToLayerIndex(nextBand);
    } else {
      start = placementBandToLayerIndex(band);
      break;
    }
  }

  return Math.max(0, Math.min(start, MAX_LAYER_INDEX - 1));
}
