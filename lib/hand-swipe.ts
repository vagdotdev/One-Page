import type { HandLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

const WRIST = 0;
const BUFFER_MS = 300;
const MOTION_MS = 260;
const COOLDOWN_MS = 1200;

/** Export for debug UI — subtle desk push. */
export const HAND_SWIPE_TRIGGER_VX = 0.2;

/**
 * Front camera, unmirrored frame: user's right is −x (left side of bitmap).
 * Subtle push: small Δx, vx ramp ~0.2+ (not a big arm sweep).
 */
const MIN_DX = 0.014;
const TRIGGER_VX = HAND_SWIPE_TRIGGER_VX;
const PEAK_VX = TRIGGER_VX + 0.03;
/** Lenient — subtle motion may not start from a perfect freeze. */
const STILL_VX = 0.14;
const MAX_DY = 0.06;
const MAX_SLOPE = 0.4;

type Sample = { x: number; y: number; t: number };

export type HandSwipeAnalysis = {
  handVisible: boolean;
  /** Smoothed rightward speed magnitude (normalized / sec) — debug. */
  velocityX: number;
  deltaX: number;
  deltaY: number;
  swipeDetected: boolean;
};

function pairwiseVx(samples: Sample[]): number[] {
  const vxs: number[] = [];
  for (let i = 1; i < samples.length; i++) {
    const dt = (samples[i].t - samples[i - 1].t) / 1000;
    if (dt <= 0 || dt > 0.12) continue;
    const vx = (samples[i].x - samples[i - 1].x) / dt;
    if (vx < 0) vxs.push(-vx);
  }
  return vxs;
}

function recentVelocityX(samples: Sample[]): number {
  const vxs = pairwiseVx(samples);
  if (!vxs.length) return 0;
  const tail = vxs.slice(-4);
  return tail.reduce((a, b) => a + b, 0) / tail.length;
}

/** EMA + recent tail — subtle pushes register without overshooting. */
function effectiveVelocityX(samples: Sample[]): number {
  const vxs = pairwiseVx(samples);
  if (!vxs.length) return 0;
  let ema = vxs[0];
  for (let i = 1; i < vxs.length; i++) {
    ema = 0.5 * vxs[i] + 0.5 * ema;
  }
  const recent = recentVelocityX(samples);
  return Math.max(ema, recent);
}

function peakVelocityX(samples: Sample[]): number {
  const vxs = pairwiseVx(samples);
  return vxs.length ? Math.max(...vxs) : 0;
}

function peakAbsVelocityX(samples: Sample[]): number {
  let peak = 0;
  for (let i = 1; i < samples.length; i++) {
    const dt = (samples[i].t - samples[i - 1].t) / 1000;
    if (dt <= 0 || dt > 0.12) continue;
    const vx = Math.abs((samples[i].x - samples[i - 1].x) / dt);
    if (vx > peak) peak = vx;
  }
  return peak;
}

function motionSegment(
  samples: Sample[],
  now: number,
): { deltaX: number; deltaY: number; segment: Sample[] } | null {
  const cutoff = now - MOTION_MS;
  const seg = samples.filter((s) => s.t >= cutoff);
  if (seg.length < 2) return null;
  const first = seg[0];
  const last = seg[seg.length - 1];
  return {
    deltaX: last.x - first.x,
    deltaY: last.y - first.y,
    segment: seg,
  };
}

function startedFromStill(segment: Sample[]): boolean {
  if (segment.length < 3) return true;
  const span = segment[segment.length - 1].t - segment[0].t;
  const earlyEnd = segment[0].t + span * 0.35;
  const early = segment.filter((s) => s.t <= earlyEnd);
  if (early.length < 2) return true;
  return peakAbsVelocityX(early) < STILL_VX;
}

function passesAngle(deltaX: number, deltaY: number): boolean {
  const ax = Math.abs(deltaX);
  if (Math.abs(deltaY) > MAX_DY) return false;
  if (ax < MIN_DX * 0.4) return false;
  return Math.abs(deltaY) / ax <= MAX_SLOPE;
}

export class HandSwipeTracker {
  private samples: Sample[] = [];
  private lastFireAt = 0;

  reset() {
    this.samples = [];
    this.lastFireAt = 0;
  }

  push(x: number, y: number, now = performance.now()): HandSwipeAnalysis {
    this.samples.push({ x, y, t: now });
    const cutoff = now - BUFFER_MS;
    this.samples = this.samples.filter((s) => s.t >= cutoff);

    if (this.samples.length < 2) {
      return {
        handVisible: true,
        velocityX: 0,
        deltaX: 0,
        deltaY: 0,
        swipeDetected: false,
      };
    }

    const motion = motionSegment(this.samples, now);
    const deltaX = motion?.deltaX ?? 0;
    const deltaY = motion?.deltaY ?? 0;
    const velocityX = effectiveVelocityX(this.samples);
    const peakVx = peakVelocityX(this.samples);

    const cooledDown = now - this.lastFireAt >= COOLDOWN_MS;
    const ramped = velocityX >= TRIGGER_VX || peakVx >= PEAK_VX;
    const swipeDetected =
      cooledDown &&
      motion != null &&
      startedFromStill(motion.segment) &&
      deltaX <= -MIN_DX &&
      ramped &&
      passesAngle(deltaX, deltaY);

    if (swipeDetected) {
      this.lastFireAt = now;
      this.samples = [];
    }

    return {
      handVisible: true,
      velocityX,
      deltaX,
      deltaY,
      swipeDetected,
    };
  }

  clearHand() {
    this.samples = [];
    return {
      handVisible: false,
      velocityX: 0,
      deltaX: 0,
      deltaY: 0,
      swipeDetected: false,
    };
  }
}

let tracker: HandSwipeTracker | null = null;

export function getHandSwipeTracker(): HandSwipeTracker {
  if (!tracker) tracker = new HandSwipeTracker();
  return tracker;
}

export function resetHandSwipeTracker() {
  getHandSwipeTracker().reset();
}

export function wristFromResult(
  result: HandLandmarkerResult,
): NormalizedLandmark | null {
  const hands = result.landmarks;
  if (!hands?.length) return null;
  return hands[0][WRIST] ?? null;
}

export function analyzeHandSwipe(
  result: HandLandmarkerResult | null,
): HandSwipeAnalysis {
  const t = getHandSwipeTracker();
  if (!result) return t.clearHand();

  const wrist = wristFromResult(result);
  if (!wrist) return t.clearHand();

  return t.push(wrist.x, wrist.y);
}
