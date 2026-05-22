"use client";

/** Hint for hand swipe to continue. */
export function LensTarget({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="lens-target" aria-hidden>
      <span className="lens-target-arrow">→</span>
      <span className="lens-target-label ui">
        A short push right with your hand turns the page
      </span>
    </div>
  );
}
