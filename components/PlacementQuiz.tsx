"use client";

import { useState } from "react";
import type { PlacementQuestion } from "@/lib/types";

interface PlacementQuizProps {
  questions: PlacementQuestion[];
  onComplete: (selections: (number | null)[]) => void;
}

export function PlacementQuiz({ questions, onComplete }: PlacementQuizProps) {
  const [selections, setSelections] = useState<(number | null)[]>(
    questions.map(() => null),
  );
  const [index, setIndex] = useState(0);

  const q = questions[index];
  const isLast = index === questions.length - 1;

  const advance = (next: (number | null)[]) => {
    if (isLast) {
      onComplete(next);
      return;
    }
    setIndex((i) => i + 1);
  };

  const skip = () => {
    setSelections((prev) => {
      const next = [...prev];
      next[index] = null;
      queueMicrotask(() => advance(next));
      return next;
    });
  };

  const pick = (choiceIdx: number) => {
    setSelections((prev) => {
      const next = [...prev];
      next[index] = choiceIdx;
      return next;
    });
  };

  const confirm = () => {
    setSelections((prev) => {
      queueMicrotask(() => advance(prev));
      return prev;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      skip();
    }
  };

  if (!q) return null;

  return (
    <div className="placement-quiz" onKeyDown={handleKeyDown}>
      <p className="text-ink-soft font-medium text-sm leading-snug mb-4">
        {q.question}
      </p>

      <div className="space-y-2 mb-6">
        {q.choices.map((choice, cIdx) => (
          <label key={cIdx} className="flex gap-2.5 cursor-pointer">
            <input
              type="radio"
              name={`placement-${index}`}
              checked={selections[index] === cIdx}
              onChange={() => pick(cIdx)}
              className="mt-0.5"
            />
            <span className="text-ink-soft text-sm">{choice}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={skip}
          className="ui flex-1 py-2.5 px-3 border border-rule rounded text-sm text-ink-mute hover:text-ink-soft hover:border-ink-faint transition-colors"
        >
          Skip
        </button>
        {selections[index] !== null && (
          <button
            type="button"
            onClick={confirm}
            className="ui flex-1 py-2.5 px-3 bg-ink text-paper rounded text-sm hover:opacity-80 transition-opacity"
          >
            {isLast ? "Start" : "Next"}
          </button>
        )}
      </div>
    </div>
  );
}
