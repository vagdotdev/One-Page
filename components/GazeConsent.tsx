"use client";

import { useEffect, useState } from "react";
import { useGaze } from "@/lib/gaze-store";

export function GazeConsent() {
  const enabled = useGaze((s) => s.enabled);
  const consented = useGaze((s) => s.consented);
  const acceptConsent = useGaze((s) => s.acceptConsent);
  const declineConsent = useGaze((s) => s.declineConsent);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const done = () => setHydrated(true);
    if (useGaze.persist.hasHydrated()) done();
    return useGaze.persist.onFinishHydration(done);
  }, []);

  if (!hydrated || consented || !enabled) return null;

  return (
    <div
      className="gaze-consent"
      role="dialog"
      aria-labelledby="gaze-consent-title"
      aria-describedby="gaze-consent-desc"
    >
      <div className="gaze-consent-card measure">
        <h2 id="gaze-consent-title" className="display text-xl mb-2">
          Continue gesture
        </h2>
        <p
          id="gaze-consent-desc"
          className="text-ink-mute text-sm leading-relaxed mb-5"
        >
          Camera stays on your device. A short push of your hand right turns the
          page — or click Continue.
        </p>
        <div className="gaze-consent-actions ui flex gap-3 justify-center">
          <button
            type="button"
            onClick={acceptConsent}
            className="text-sm border border-rule text-ink-soft rounded px-4 py-2 hover:border-ink-faint transition-colors"
          >
            Enable
          </button>
          <button
            type="button"
            onClick={declineConsent}
            className="text-sm text-ink-faint hover:text-ink-mute transition-colors px-4 py-2"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
