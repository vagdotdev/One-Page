"use client";

import type { RefObject } from "react";

type GazeCameraSinkProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  active: boolean;
};

/** Hidden video element for MediaPipe — no on-screen preview. */
export function GazeCameraSink({ videoRef, active }: GazeCameraSinkProps) {
  if (!active) return null;

  return (
    <video
      ref={videoRef}
      className="gaze-camera-sink"
      playsInline
      muted
      aria-hidden
    />
  );
}
