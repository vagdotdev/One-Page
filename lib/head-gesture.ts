import type { FaceLandmarkerResult, Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision";

/** Cheek landmarks — Y gap estimates head roll (ear toward shoulder). */
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;

const CALIBRATION_MS = 2200;
const MIN_SAMPLES = 14;

/** Roll drop (rad) below baseline = tilt toward your left shoulder. */
const TILT_DELTA_RAD = 0.09;
/** Quick flick: roll velocity (rad/s), negative = tilting left. */
const FLICK_VEL_RAD_S = -0.28;

export type HeadPose = {
  /** Decreases when you tilt toward your left shoulder. */
  roll: number;
  pitch: number;
  yaw: number;
};

export type HeadGestureAnalysis = {
  pose: HeadPose;
  baselineRoll: number | null;
  rollDelta: number;
  rollVelocity: number;
  calibrationReady: boolean;
  calibrationProgress: number;
  /** 0–1 strength of left-shoulder tilt gesture. */
  gesture: number;
  triggered: boolean;
};

export function eulerFromMatrix(matrix: Matrix | undefined): HeadPose | null {
  if (!matrix?.data || matrix.data.length < 16) return null;

  const d = matrix.data;
  const sy = Math.sqrt(d[0] * d[0] + d[4] * d[4]);
  if (sy < 1e-6) return null;

  return {
    roll: Math.atan2(d[6], d[10]),
    pitch: Math.atan2(-d[2], sy),
    yaw: Math.atan2(d[4], d[0]),
  };
}

/** Landmark fallback when matrix is missing. */
export function rollFromLandmarks(
  landmarks: NormalizedLandmark[],
): number | null {
  const left = landmarks[LEFT_CHEEK];
  const right = landmarks[RIGHT_CHEEK];
  if (!left || !right) return null;
  return right.y - left.y;
}

export function extractHeadPose(
  result: FaceLandmarkerResult,
): HeadPose | null {
  const landmarks = result.faceLandmarks[0];
  if (!landmarks?.length) return null;

  const fromMatrix = eulerFromMatrix(
    result.facialTransformationMatrixes?.[0],
  );
  if (fromMatrix) return fromMatrix;

  const rollLm = rollFromLandmarks(landmarks);
  if (rollLm == null) return null;

  return { roll: rollLm * 4, pitch: 0, yaw: 0 };
}

class HeadGestureCalibrator {
  private startedAt = 0;
  private rolls: number[] = [];
  private baseline: number | null = null;

  reset() {
    this.startedAt = performance.now();
    this.rolls = [];
    this.baseline = null;
  }

  ingest(roll: number): { ready: boolean; progress: number; baseline: number | null } {
    if (!this.startedAt) this.reset();

    if (!this.baseline) {
      this.rolls.push(roll);
      const elapsed = performance.now() - this.startedAt;
      if (elapsed >= CALIBRATION_MS && this.rolls.length >= MIN_SAMPLES) {
        this.baseline = median(this.rolls);
      }
      return {
        ready: Boolean(this.baseline),
        progress: Math.min(1, elapsed / CALIBRATION_MS),
        baseline: this.baseline,
      };
    }

    return { ready: true, progress: 1, baseline: this.baseline };
  }

  get baselineRoll() {
    return this.baseline;
  }
}

let calibrator: HeadGestureCalibrator | null = null;

function getCalibrator() {
  if (!calibrator) calibrator = new HeadGestureCalibrator();
  return calibrator;
}

export function resetHeadGestureCalibration() {
  getCalibrator().reset();
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function analyzeHeadGesture(
  result: FaceLandmarkerResult,
  options: { calibrating: boolean; prevRoll: number | null; dtSec: number },
): HeadGestureAnalysis {
  const pose = extractHeadPose(result);
  const empty: HeadGestureAnalysis = {
    pose: { roll: 0, pitch: 0, yaw: 0 },
    baselineRoll: null,
    rollDelta: 0,
    rollVelocity: 0,
    calibrationReady: false,
    calibrationProgress: 0,
    gesture: 0,
    triggered: false,
  };

  if (!pose) return empty;

  const cal = getCalibrator();
  const calState = options.calibrating
    ? cal.ingest(pose.roll)
    : {
        ready: cal.baselineRoll != null,
        progress: 1,
        baseline: cal.baselineRoll,
      };

  const baseline = calState.baseline ?? cal.baselineRoll;
  const rollDelta = baseline != null ? pose.roll - baseline : 0;

  const rollVelocity =
    options.prevRoll != null && options.dtSec > 0
      ? (pose.roll - options.prevRoll) / options.dtSec
      : 0;

  let gesture = 0;
  let triggered = false;

  if (calState.ready && baseline != null) {
    const tiltAmount = -rollDelta;
    const tiltScore = clamp01(
      (tiltAmount - TILT_DELTA_RAD * 0.5) / TILT_DELTA_RAD,
    );
    const flickScore =
      rollVelocity <= FLICK_VEL_RAD_S && tiltAmount > TILT_DELTA_RAD * 0.4
        ? clamp01(Math.abs(rollVelocity / FLICK_VEL_RAD_S))
        : 0;

    gesture = Math.max(tiltScore, flickScore);
    triggered =
      tiltAmount >= TILT_DELTA_RAD ||
      (rollVelocity <= FLICK_VEL_RAD_S && tiltAmount >= TILT_DELTA_RAD * 0.45);
  }

  return {
    pose,
    baselineRoll: baseline,
    rollDelta,
    rollVelocity,
    calibrationReady: calState.ready,
    calibrationProgress: calState.progress,
    gesture,
    triggered,
  };
}

export const HEAD_GESTURE_HOLD_MS = 420;

export function isHeadGestureActive(analysis: HeadGestureAnalysis): boolean {
  return analysis.calibrationReady && analysis.triggered;
}
