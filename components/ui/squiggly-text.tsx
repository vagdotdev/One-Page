"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

type SquigglyTextProps = {
  children: ReactNode;
  /** When false, renders plain text with no filter animation. */
  active?: boolean;
  className?: string;
  steps?: number;
  stepDuration?: number;
  /** Max displacement in px — lower = subtler wobble. */
  scale?: [number, number];
};

/**
 * Aceternity-style squiggly text — SVG turbulence + displacement, stepped animation.
 * @see https://ui.aceternity.com/components/squiggly-text
 */
export function SquigglyText({
  children,
  active = true,
  className = "",
  steps = 4,
  stepDuration = 140,
  scale = [2, 3],
}: SquigglyTextProps) {
  const rawId = useId().replace(/:/g, "");
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(
      () => setFrame((f) => (f + 1) % steps),
      stepDuration,
    );
    return () => window.clearInterval(id);
  }, [active, steps, stepDuration]);

  if (!active) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={`inline-block ${className}`}>
      <svg
        className="pointer-events-none absolute h-0 w-0 overflow-hidden"
        aria-hidden
      >
        <defs>
          {Array.from({ length: steps }, (_, i) => (
            <filter
              key={i}
              id={`${rawId}-squiggly-${i}`}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.03"
                numOctaves={2}
                seed={i}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={i % 2 === 0 ? scale[0] : scale[1]}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          ))}
        </defs>
      </svg>
      <span
        className="inline-block"
        style={{ filter: `url(#${rawId}-squiggly-${frame})` }}
      >
        {children}
      </span>
    </span>
  );
}
