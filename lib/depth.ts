import type { LayerKind } from "./types";

/**
 * Full climb on one topic: curious beginner → working engineer → chief-engineer /
 * PhD rigor (equations, tradeoffs, systems, open problems). Each pass is one layer.
 */
export const MAX_LAYER_INDEX = 40;

/** Placement may skip intro bands only — never start near the PhD end of the rail. */
export const PLACEMENT_MAX_START_INDEX = Math.floor((MAX_LAYER_INDEX - 1) * 0.35);

type DepthRung = {
  endIndex: number;
  kind: LayerKind;
  depthLabel: string;
  phase: string;
};

const DEPTH_RUNGS: DepthRung[] = [
  {
    endIndex: 1,
    kind: "eli5",
    depthLabel: "What it is",
    phase:
      "First contact — vivid story, wonder, two or three examples, zero jargon.",
  },
  {
    endIndex: 10,
    kind: "mechanism",
    depthLabel: "How it works",
    phase:
      "Each layer adds the next pipeline step — cause and effect, plain part names, one growing model. Teach machinery, not hype.",
  },
  {
    endIndex: 13,
    kind: "context",
    depthLabel: "In the world",
    phase:
      "One scene where the pipeline runs — stakes, failure, or cost tied to the mechanism you built; not an industry survey.",
  },
  {
    endIndex: 23,
    kind: "quantitative",
    depthLabel: "Numbers I",
    phase:
      "Build quantitative intuition in words — proportional reasoning, units, one key relation; minimal notation.",
  },
  {
    endIndex: 27,
    kind: "quantitative",
    depthLabel: "Numbers II",
    phase:
      "Core equations for this topic — define variables, show one derivation or chain of relations; reader should be able to use them.",
  },
  {
    endIndex: 31,
    kind: "quantitative",
    depthLabel: "Numbers III",
    phase:
      "Engineering math — coupled relations, constraints, orders of magnitude, design-relevant calculations (chief-engineer toolkit, not homework fluff).",
  },
  {
    endIndex: 32,
    kind: "synthesis",
    depthLabel: "The whole picture",
    phase: "Integrated mental model — synthesis shape from system prompt; quiz: [].",
  },
  {
    endIndex: 35,
    kind: "scholar",
    depthLabel: "Professional depth",
    phase:
      "How senior engineers / specialists reason — tradeoffs, assumptions, failure modes, what you'd defend in a design review.",
  },
  {
    endIndex: 38,
    kind: "scholar",
    depthLabel: "Expert rigor",
    phase:
      "PhD-level precision on this topic — formal detail, edge cases, how the field argues; still readable prose.",
  },
  {
    endIndex: 39,
    kind: "frontier",
    depthLabel: "The frontier",
    phase:
      "What's unsettled, disputed, or at the research edge — honest limits of knowledge.",
  },
];

function findRung(index: number): DepthRung {
  const depth = Math.max(0, Math.min(index, MAX_LAYER_INDEX - 1));
  for (const rung of DEPTH_RUNGS) {
    if (depth <= rung.endIndex) return rung;
  }
  const last = DEPTH_RUNGS[DEPTH_RUNGS.length - 1];
  return {
    ...last,
    endIndex: MAX_LAYER_INDEX - 1,
    kind: "frontier",
    depthLabel: "Beyond the frontier",
    phase:
      "Another deep pass — chief-engineer / researcher depth; new material only; do not repeat prior layers.",
  };
}

export function resolveLayer(index: number): {
  kind: LayerKind;
  depth: number;
  depthLabel: string;
  phase: string;
} {
  const depth = Math.max(0, Math.min(index, MAX_LAYER_INDEX - 1));
  const rung = findRung(depth);
  return {
    kind: rung.kind,
    depth,
    depthLabel: rung.depthLabel,
    phase: rung.phase,
  };
}

export function canAdvanceFrom(index: number): boolean {
  return index < MAX_LAYER_INDEX - 1;
}

/** 0 at layer 0 (beginner), 1 at max index (PhD / chief engineer). Linear on real index. */
export function depthProgressRatio(index: number): number {
  const max = MAX_LAYER_INDEX - 1;
  if (max <= 0) return 0;
  const depth = Math.max(0, Math.min(index, max));
  return depth / max;
}

/** Map placement probe band (0–6) to a layer index on the full ladder. */
export function placementBandToLayerIndex(band: number): number {
  const bandMax = 6;
  const b = Math.max(0, Math.min(band, bandMax));
  if (b >= bandMax) return PLACEMENT_MAX_START_INDEX;
  return Math.round((b / bandMax) * PLACEMENT_MAX_START_INDEX);
}
