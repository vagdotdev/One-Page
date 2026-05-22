"use client";

import { SquigglyText } from "@/components/ui/squiggly-text";

interface KnowSomeToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function KnowSomeToggle({ checked, onChange }: KnowSomeToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="know-some-trigger ui"
    >
      <SquigglyText
        active={checked}
        steps={3}
        stepDuration={160}
        scale={[1.5, 2.5]}
        className={checked ? "know-some-label know-some-label--on" : "know-some-label"}
      >
        I already know some of this
      </SquigglyText>
    </button>
  );
}
