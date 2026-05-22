import type { HandLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

const WRIST = 0;
const INDEX_TIP = 8;
const INDEX_DIP = 7;
const INDEX_PIP = 6;
const MIDDLE_TIP = 12;
const MIDDLE_DIP = 11;
const MIDDLE_PIP = 10;
const RING_TIP = 16;
const RING_DIP = 15;
const RING_PIP = 14;
const PINKY_TIP = 20;
const PINKY_DIP = 19;
const PINKY_PIP = 18;

/** Quiz holds index → pinky only (no thumb). */
const FINGER_CHAIN = [
  { tip: INDEX_TIP, dip: INDEX_DIP, pip: INDEX_PIP, yMargin: 0.012 },
  { tip: MIDDLE_TIP, dip: MIDDLE_DIP, pip: MIDDLE_PIP, yMargin: 0.014 },
  { tip: RING_TIP, dip: RING_DIP, pip: RING_PIP, yMargin: 0.016 },
  { tip: PINKY_TIP, dip: PINKY_DIP, pip: PINKY_PIP, yMargin: 0.022 },
] as const;

export type HandFingerAnalysis = {
  handVisible: boolean;
  /** Extended index→pinky digits 0–4 (thumb excluded). */
  rawCount: number;
  /** Smoothed count for display / selection. */
  fingerCount: number;
  /** Stable 1–4 held long enough to register a choice. */
  selectionConfirmed: boolean;
  /** Value passed on confirmation (1–4). */
  selectedValue: number | null;
};

function dist(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

type FingerSpec = (typeof FINGER_CHAIN)[number];

/**
 * Stricter than tip-vs-PIP alone: tip above DIP, DIP above PIP, and tip
 * farther from wrist than PIP (reduces half-curled ring/pinky).
 */
function digitExtended(lm: NormalizedLandmark[], spec: FingerSpec): boolean {
  const wrist = lm[WRIST];
  const tip = lm[spec.tip];
  const dip = lm[spec.dip];
  const pip = lm[spec.pip];
  if (!wrist || !tip || !dip || !pip) return false;

  const tipAboveDip = tip.y < dip.y - spec.yMargin * 0.5;
  const dipAbovePip = dip.y < pip.y - spec.yMargin * 0.35;
  const tipAbovePip = tip.y < pip.y - spec.yMargin;
  const tipReach = dist(tip, wrist) > dist(pip, wrist) * 0.88;

  return tipAboveDip && dipAbovePip && tipAbovePip && tipReach;
}

/**
 * Pinky is noisy vs ring — require it to rise at least to ring-tip height
 * when claiming 4 fingers (3 = ring up, pinky clearly down).
 */
function pinkyExtendedForFour(lm: NormalizedLandmark[]): boolean {
  const spec = FINGER_CHAIN[3];
  if (!digitExtended(lm, spec)) return false;

  const pinkyTip = lm[PINKY_TIP];
  const ringTip = lm[RING_TIP];
  const middleTip = lm[MIDDLE_TIP];
  if (!pinkyTip || !ringTip || !middleTip) return false;

  const alignedWithRing = pinkyTip.y <= ringTip.y + 0.012;
  const notDropping = pinkyTip.y <= middleTip.y + 0.04;
  const pinkyReach =
    dist(pinkyTip, lm[WRIST]) > dist(lm[PINKY_PIP], lm[WRIST]) * 0.9;

  return alignedWithRing && notDropping && pinkyReach;
}

/**
 * Count raised fingers index → pinky (1–4 for quiz). Stops at the first
 * finger that is not clearly extended so 3 vs 4 hinges on pinky only.
 */
export function countRaisedFingers(lm: NormalizedLandmark[]): number {
  for (let i = 0; i < FINGER_CHAIN.length; i++) {
    const spec = FINGER_CHAIN[i];
    const extended =
      i === 3 ? pinkyExtendedForFour(lm) : digitExtended(lm, spec);
    if (!extended) return i;
  }
  return 4;
}

export function countExtendedFingers(
  result: HandLandmarkerResult | null,
): { count: number; handVisible: boolean } {
  if (!result?.landmarks?.length) {
    return { count: 0, handVisible: false };
  }

  const lm = result.landmarks[0];
  if (!lm || lm.length < 21) return { count: 0, handVisible: false };

  return { count: countRaisedFingers(lm), handVisible: true };
}

const SMOOTH_WINDOW = 7;
const STABLE_MS = 520;
const COOLDOWN_MS = 900;
const RELEASE_MS = 220;

/** Prefer modal count when 3/4 flicker — needs majority over the window. */
function smoothFingerCount(samples: number[]): number {
  if (samples.length === 0) return 0;
  const counts = new Map<number, number>();
  for (const n of samples) {
    counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  let best = samples[samples.length - 1];
  let bestVotes = 0;
  for (const [n, votes] of counts) {
    if (votes > bestVotes) {
      bestVotes = votes;
      best = n;
    }
  }
  return best;
}

export class FingerSelectionTracker {
  private smooth: number[] = [];
  private stableSince: number | null = null;
  private lastFireAt = 0;
  private releasedAt = 0;
  private armed = true;
  private maxChoices = 4;

  reset() {
    this.smooth = [];
    this.stableSince = null;
    this.lastFireAt = 0;
    this.releasedAt = performance.now();
    this.armed = true;
    this.maxChoices = 4;
  }

  setMaxChoices(n: number) {
    this.maxChoices = Math.min(4, Math.max(1, n));
  }

  push(
    rawCount: number,
    handVisible: boolean,
    now = performance.now(),
  ): Omit<HandFingerAnalysis, "rawCount"> & { rawCount: number } {
    if (!handVisible) {
      this.smooth = [];
      this.stableSince = null;
      if (this.armed) this.releasedAt = now;
      return {
        handVisible: false,
        rawCount: 0,
        fingerCount: 0,
        selectionConfirmed: false,
        selectedValue: null,
      };
    }

    this.smooth.push(rawCount);
    if (this.smooth.length > SMOOTH_WINDOW) this.smooth.shift();
    const fingerCount = smoothFingerCount(this.smooth);

    const inRange =
      fingerCount >= 1 && fingerCount <= this.maxChoices;

    if (!inRange) {
      this.stableSince = null;
      if (fingerCount === 0 && now - this.releasedAt >= RELEASE_MS) {
        this.armed = true;
      }
      return {
        handVisible: true,
        rawCount,
        fingerCount,
        selectionConfirmed: false,
        selectedValue: null,
      };
    }

    const unanimous =
      this.smooth.length >= 4 &&
      this.smooth.every((n) => n === fingerCount);

    if (!unanimous) {
      this.stableSince = null;
      return {
        handVisible: true,
        rawCount,
        fingerCount,
        selectionConfirmed: false,
        selectedValue: null,
      };
    }

    if (this.stableSince == null) this.stableSince = now;
    const held = now - this.stableSince >= STABLE_MS;
    const cooled = now - this.lastFireAt >= COOLDOWN_MS;

    if (held && cooled && this.armed) {
      this.lastFireAt = now;
      this.armed = false;
      this.stableSince = null;
      this.smooth = [];
      return {
        handVisible: true,
        rawCount,
        fingerCount,
        selectionConfirmed: true,
        selectedValue: fingerCount,
      };
    }

    return {
      handVisible: true,
      rawCount,
      fingerCount,
      selectionConfirmed: false,
      selectedValue: null,
    };
  }
}

let fingerTracker: FingerSelectionTracker | null = null;

export function getFingerSelectionTracker(): FingerSelectionTracker {
  if (!fingerTracker) fingerTracker = new FingerSelectionTracker();
  return fingerTracker;
}

export function resetFingerSelectionTracker() {
  getFingerSelectionTracker().reset();
}

export function analyzeHandFingers(
  result: HandLandmarkerResult | null,
  options?: { maxChoices?: number },
): HandFingerAnalysis {
  const tracker = getFingerSelectionTracker();
  if (options?.maxChoices != null) {
    tracker.setMaxChoices(options.maxChoices);
  }

  const { count: rawCount, handVisible } = countExtendedFingers(result);
  return tracker.push(rawCount, handVisible);
}
