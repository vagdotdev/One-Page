import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import {
  analyzeHandFingers,
  resetFingerSelectionTracker,
  type HandFingerAnalysis,
} from "@/lib/hand-fingers";
import {
  analyzeHandSwipe,
  resetHandSwipeTracker,
  type HandSwipeAnalysis,
} from "@/lib/hand-swipe";

export type HandFrameAnalysis = HandSwipeAnalysis & HandFingerAnalysis;

export function analyzeHandFrame(
  result: HandLandmarkerResult | null,
  options?: { maxFingerChoices?: number },
): HandFrameAnalysis {
  const swipe = analyzeHandSwipe(result);
  const fingers = analyzeHandFingers(result, {
    maxChoices: options?.maxFingerChoices,
  });

  return {
    ...swipe,
    ...fingers,
    handVisible: swipe.handVisible || fingers.handVisible,
  };
}

export function resetHandFrameTrackers() {
  resetHandSwipeTracker();
  resetFingerSelectionTracker();
}
