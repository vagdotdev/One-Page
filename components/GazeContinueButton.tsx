"use client";

import type { CSSProperties } from "react";
import type { GazeCameraStatus } from "@/hooks/useGazeCamera";

type GazeContinueButtonProps = {
  onContinue: () => void;
  gazeActive: boolean;
  progress: number;
  cameraStatus: GazeCameraStatus;
  cameraError: string | null;
};

export function GazeContinueButton({
  onContinue,
  gazeActive,
  progress,
  cameraStatus,
  cameraError,
}: GazeContinueButtonProps) {
  const showFill = gazeActive && progress > 0.02;
  const cameraBlocked =
    gazeActive &&
    (cameraStatus === "denied" || cameraStatus === "error");

  if (!gazeActive) {
    return (
      <button
        type="button"
        onClick={onContinue}
        className="ui text-sm text-ink-mute hover:text-ink-soft transition-colors border border-rule rounded px-5 py-2 hover:border-ink-faint"
      >
        Continue
      </button>
    );
  }

  return (
    <div className="gaze-continue-wrap">
      <button
        type="button"
        onClick={onContinue}
        className={[
          "gaze-continue ui text-sm text-ink-mute hover:text-ink-soft transition-colors border border-rule rounded px-5 py-2 hover:border-ink-faint",
          showFill ? "gaze-continue--fill" : "",
        ].join(" ")}
        style={
          showFill
            ? ({
                ["--gaze-progress" as string]: String(progress),
              } as CSSProperties)
            : undefined
        }
        aria-label="Continue — short hand push right, or click"
      >
        Continue
      </button>

      {cameraBlocked && cameraError && (
        <p className="gaze-continue-status ui text-xs text-ink-faint mt-2">
          {cameraError}. Click when ready.
        </p>
      )}
    </div>
  );
}
