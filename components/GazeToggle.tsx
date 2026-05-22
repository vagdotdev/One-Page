"use client";

import { useEffect, useState } from "react";
import { useGaze } from "@/lib/gaze-store";

function EyesIcon({ off }: { off: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="2.5" />
      {off && <path d="M4 4l16 16" strokeWidth="1.25" />}
    </svg>
  );
}

export function GazeToggle() {
  const enabled = useGaze((s) => s.enabled);
  const consented = useGaze((s) => s.consented);
  const setEnabled = useGaze((s) => s.setEnabled);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const done = () => setHydrated(true);
    if (useGaze.persist.hasHydrated()) done();
    return useGaze.persist.onFinishHydration(done);
  }, []);

  if (!hydrated) return null;

  const on = enabled && consented;

  const handleClick = () => {
    if (on) {
      setEnabled(false);
    } else {
      setEnabled(true);
    }
  };

  return (
    <button
      type="button"
      className={[
        "gaze-toggle ui",
        on ? "gaze-toggle--on" : "gaze-toggle--off",
      ].join(" ")}
      onClick={handleClick}
      aria-pressed={on}
      aria-label={
        on
          ? "Hand swipe on — turn off camera"
          : "Hand swipe off — turn on camera"
      }
      title={on ? "Hand swipe on" : "Hand swipe off"}
    >
      <EyesIcon off={!on} />
    </button>
  );
}
