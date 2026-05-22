"use client";

import { depthProgressRatio } from "@/lib/depth";

interface DepthRailProps {
  depthIndex: number;
}

/** Thin beginner → PhD marker; linear on the full 40-layer climb. */
export function DepthRail({ depthIndex }: DepthRailProps) {
  const ratio = depthProgressRatio(depthIndex);
  const fillPct = `${ratio * 100}%`;

  return (
    <div
      className="depth-rail"
      role="progressbar"
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Depth from beginner toward PhD"
    >
      <div className="depth-rail-labels">
        <span className="depth-rail-label depth-rail-label--left">beginner</span>
        <span className="depth-rail-label depth-rail-label--right">PhD</span>
      </div>
      <div className="depth-rail-track">
        <div
          className="depth-rail-fill"
          style={{ width: fillPct }}
        />
      </div>
    </div>
  );
}
