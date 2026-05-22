/** Collects your normal “reading the page” eye pose, then detects a jump toward the lens. */

const CALIBRATION_MS = 2800;
const MIN_SAMPLES = 18;

export type GazeSample = {
  eyeLookUp: number;
  eyeLookDown: number;
  irisRatio: number;
};

export type GazeBaseline = {
  eyeLookUp: number;
  eyeLookDown: number;
  irisRatio: number;
};

export type GazeCalibratorState = {
  ready: boolean;
  progress: number;
  baseline: GazeBaseline | null;
};

export class GazeCalibrator {
  private startedAt = 0;
  private samples: GazeSample[] = [];
  private baseline: GazeBaseline | null = null;

  reset(): void {
    this.startedAt = performance.now();
    this.samples = [];
    this.baseline = null;
  }

  getState(): GazeCalibratorState {
    if (!this.startedAt) {
      return { ready: false, progress: 0, baseline: null };
    }
    if (this.baseline) {
      return { ready: true, progress: 1, baseline: this.baseline };
    }
    const elapsed = performance.now() - this.startedAt;
    return {
      ready: false,
      progress: Math.min(1, elapsed / CALIBRATION_MS),
      baseline: null,
    };
  }

  /** Call every frame while the user is reading (calibration window). */
  ingest(sample: GazeSample): GazeCalibratorState {
    if (!this.startedAt) this.reset();

    if (!this.baseline) {
      this.samples.push(sample);
      const elapsed = performance.now() - this.startedAt;
      if (elapsed >= CALIBRATION_MS && this.samples.length >= MIN_SAMPLES) {
        this.baseline = medianBaseline(this.samples);
      }
    }

    return this.getState();
  }

  /**
   * 0–1: how much current eyes differ from reading baseline toward the webcam.
   */
  lensSignal(sample: GazeSample): number {
    if (!this.baseline) return 0;

    const upDelta = sample.eyeLookUp - this.baseline.eyeLookUp;
    const downDelta = this.baseline.eyeLookDown - sample.eyeLookDown;
    const irisDelta = this.baseline.irisRatio - sample.irisRatio;

    const upScore = clamp01(upDelta / 0.14);
    const downScore = clamp01(downDelta / 0.12);
    const irisScore = clamp01(irisDelta / 0.07);

    let combined = upScore * 0.5 + downScore * 0.28 + irisScore * 0.22;

    const stillReading =
      sample.eyeLookDown > this.baseline.eyeLookDown + 0.05 && upDelta < 0.07;
    if (stillReading) combined *= 0.3;

    return combined;
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function medianBaseline(samples: GazeSample[]): GazeBaseline {
  return {
    eyeLookUp: median(samples.map((s) => s.eyeLookUp)),
    eyeLookDown: median(samples.map((s) => s.eyeLookDown)),
    irisRatio: median(samples.map((s) => s.irisRatio)),
  };
}

export const GAZE_LENS_SIGNAL_THRESHOLD = 0.52;
