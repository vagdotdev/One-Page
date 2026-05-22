import type {
  Category,
  FaceLandmarkerResult,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import {
  GAZE_LENS_SIGNAL_THRESHOLD,
  type GazeCalibratorState,
  type GazeSample,
  GazeCalibrator,
} from "@/lib/gaze-calibration";

const LEFT_IRIS = 468;
const RIGHT_IRIS = 473;
const LEFT_EYE_TOP = 159;
const LEFT_EYE_BOTTOM = 145;
const RIGHT_EYE_TOP = 386;
const RIGHT_EYE_BOTTOM = 374;

function blendScore(categories: Category[] | undefined, name: string): number {
  if (!categories?.length) return 0;
  const hit = categories.find((c) => c.categoryName === name);
  return hit?.score ?? 0;
}

function irisRatio(
  landmarks: NormalizedLandmark[],
  irisIdx: number,
  topIdx: number,
  bottomIdx: number,
): number | null {
  const iris = landmarks[irisIdx];
  const top = landmarks[topIdx];
  const bottom = landmarks[bottomIdx];
  if (!iris || !top || !bottom) return null;

  const span = bottom.y - top.y;
  if (Math.abs(span) < 1e-5) return null;
  return (iris.y - top.y) / span;
}

export function meanIrisRatio(landmarks: NormalizedLandmark[]): number | null {
  const left = irisRatio(landmarks, LEFT_IRIS, LEFT_EYE_TOP, LEFT_EYE_BOTTOM);
  const right = irisRatio(landmarks, RIGHT_IRIS, RIGHT_EYE_TOP, RIGHT_EYE_BOTTOM);
  if (left == null || right == null) return null;
  return (left + right) / 2;
}

export function extractGazeSample(
  result: FaceLandmarkerResult,
): GazeSample | null {
  const landmarks = result.faceLandmarks[0];
  const blends = result.faceBlendshapes[0]?.categories;
  if (!landmarks?.length) return null;

  const ratio = meanIrisRatio(landmarks);
  if (ratio == null) return null;

  const eyeLookUp =
    (blendScore(blends, "eyeLookUpLeft") +
      blendScore(blends, "eyeLookUpRight")) /
    2;
  const eyeLookDown =
    (blendScore(blends, "eyeLookDownLeft") +
      blendScore(blends, "eyeLookDownRight")) /
    2;

  return { eyeLookUp, eyeLookDown, irisRatio: ratio };
}

export type GazeAnalysis = {
  lensSignal: number;
  eyeLookUp: number;
  eyeLookDown: number;
  irisRatio: number;
  calibration: GazeCalibratorState;
};

let sharedCalibrator: GazeCalibrator | null = null;

export function getGazeCalibrator(): GazeCalibrator {
  if (!sharedCalibrator) sharedCalibrator = new GazeCalibrator();
  return sharedCalibrator;
}

export function resetGazeCalibration(): void {
  getGazeCalibrator().reset();
}

export function analyzeGaze(
  result: FaceLandmarkerResult,
  options: { calibrating: boolean },
): GazeAnalysis {
  const calibrator = getGazeCalibrator();
  const sample = extractGazeSample(result);

  if (!sample) {
    return {
      lensSignal: 0,
      eyeLookUp: 0,
      eyeLookDown: 0,
      irisRatio: 0.5,
      calibration: calibrator.getState(),
    };
  }

  const calibration = options.calibrating
    ? calibrator.ingest(sample)
    : calibrator.getState();

  const lensSignal = calibration.ready
    ? calibrator.lensSignal(sample)
    : 0;

  return {
    lensSignal,
    eyeLookUp: sample.eyeLookUp,
    eyeLookDown: sample.eyeLookDown,
    irisRatio: sample.irisRatio,
    calibration,
  };
}

export function isLookingAtLens(analysis: GazeAnalysis): boolean {
  return (
    analysis.calibration.ready &&
    analysis.lensSignal >= GAZE_LENS_SIGNAL_THRESHOLD
  );
}
