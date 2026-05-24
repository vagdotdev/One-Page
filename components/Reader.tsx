"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Layer } from "@/lib/types";

export type ReaderPhase = "enter" | "dissolve" | "hold";

const SECTION_PREFIX = "§ ";

function isSubheading(para: string): boolean {
  return para.startsWith(SECTION_PREFIX);
}

function subheadingText(para: string): string {
  return para.slice(SECTION_PREFIX.length).trim();
}

interface ReaderProps {
  layer: Layer;
  phase: ReaderPhase;
  animationKey: number;
  onExit?: () => void;
  onReady?: () => void;
}

export function Reader({
  layer,
  phase,
  animationKey,
  onExit,
  onReady,
}: ReaderProps) {
  const onReadyRef = useRef(onReady);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    if (phase !== "enter") return;
    const timer = setTimeout(() => onReadyRef.current?.(), 900);
    return () => clearTimeout(timer);
  }, [layer.index, animationKey, phase]);

  const isSynthesis = layer.index === 4;
  const entering = phase === "enter";
  const dissolving = phase === "dissolve";

  let bodyIndex = 0;

  return (
    <div className="reader-fit w-full self-stretch">
      <article
        className="prose-body prose-body--viewport"
        key={`${layer.index}-${animationKey}`}
        data-selectable="true"
      >
        <div className="page-title-wrap mb-5">
          <h1 className="display display--viewport text-center mb-0">
            {layer.title}
          </h1>
          {onExit && (
            <button
              type="button"
              className="page-title-exit ui"
              onClick={onExit}
              aria-label="Back to topic selection"
            >
              ×
            </button>
          )}
        </div>

        <div>
          {layer.paragraphs.map((para, i) => {
            const delayIndex = bodyIndex++;
            const motionProps = {
              initial: entering
                ? {
                    opacity: 0,
                    y: shouldReduceMotion ? 0 : 10,
                    filter: shouldReduceMotion ? "blur(0px)" : "blur(6px)",
                  }
                : false,
              animate: dissolving
                ? {
                    opacity: 0,
                    y: shouldReduceMotion ? 0 : -18,
                    filter: shouldReduceMotion ? "blur(0px)" : "blur(16px)",
                  }
                : { opacity: 1, y: 0, filter: "blur(0px)" },
              transition: {
                duration: shouldReduceMotion ? 0.12 : dissolving ? 0.55 : 0.65,
                delay: shouldReduceMotion
                  ? 0
                  : entering
                    ? delayIndex * 0.045
                    : delayIndex * 0.035,
                ease: dissolving ? ("easeIn" as const) : ("easeOut" as const),
              },
            };

            if (isSubheading(para)) {
              return (
                <motion.h2
                  key={`${animationKey}-h-${i}`}
                  className="prose-subheading"
                  {...motionProps}
                >
                  {subheadingText(para)}
                </motion.h2>
              );
            }

            return (
              <motion.p
                key={`${animationKey}-${i}`}
                className={
                  isSynthesis && para.startsWith("•")
                    ? "bullet"
                    : isSynthesis && para.startsWith("If you want")
                      ? "coda"
                      : undefined
                }
                {...motionProps}
              >
                {para}
              </motion.p>
            );
          })}
        </div>
      </article>
    </div>
  );
}
