"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { gradeShortAnswerLocally } from "@/lib/quiz-grade-local";
import type { QuizQuestion, QuizAnswer } from "@/lib/types";

export type QuizHandle = {
  /** 1-based finger count → option index. */
  applyFingerChoice: (count: number) => void;
};

interface QuizProps {
  questions: QuizQuestion[];
  layerContext: string;
  onSubmit: (answers: QuizAnswer[], passed: boolean) => void;
  /** Lens on + all MCQ: one question at a time, hold up 1–4 fingers. */
  handsFree?: boolean;
  /** Live finger count for hint UI. */
  fingerPreview?: number;
}

export const Quiz = forwardRef<QuizHandle, QuizProps>(function Quiz(
  {
    questions,
    layerContext,
    onSubmit,
    handsFree = false,
    fingerPreview = 0,
  },
  ref,
) {
  const [answers, setAnswers] = useState<(string | null)[]>(
    questions.map(() => null),
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [grading, setGrading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    setAnswers(questions.map(() => null));
    setStepIndex(0);
    setErrors([]);
  }, [questions]);

  const handleMCQChange = (qIdx: number, choiceIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[qIdx] = String(choiceIdx);
    setAnswers(newAnswers);
  };

  const handleShortChange = (qIdx: number, text: string) => {
    const newAnswers = [...answers];
    newAnswers[qIdx] = text;
    setAnswers(newAnswers);
  };

  const runSubmit = useCallback(
    async (finalAnswers: (string | null)[]) => {
      setErrors([]);
      setGrading(true);

      const shortItems = questions
        .map((q, index) =>
          q.type === "short"
            ? {
                index,
                question: q.question,
                referencePhrases: q.acceptableAnswers,
                answer: finalAnswers[index]!.trim(),
              }
            : null,
        )
        .filter((item): item is NonNullable<typeof item> => item !== null);

      const shortCorrectByIndex = new Map<number, boolean>();

      if (shortItems.length > 0) {
        try {
          const res = await fetch("/api/quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ layerContext, items: shortItems }),
          });
          if (res.ok) {
            const data = (await res.json()) as {
              results?: { index: number; correct: boolean }[];
            };
            for (const row of data.results ?? []) {
              shortCorrectByIndex.set(row.index, row.correct);
            }
          } else {
            setErrors(["Could not check your answers. Try again."]);
            setGrading(false);
            return;
          }
        } catch {
          setErrors(["Could not check your answers. Try again."]);
          setGrading(false);
          return;
        }
      }

      const scored: QuizAnswer[] = [];
      let correct = 0;
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const ans = finalAnswers[i]!;
        if (q.type === "mcq") {
          const isCorrect = parseInt(ans, 10) === q.answerIndex;
          scored.push({
            type: "mcq",
            choiceIndex: parseInt(ans, 10),
            correct: isCorrect,
          });
          if (isCorrect) correct++;
        } else {
          let isCorrect = shortCorrectByIndex.get(i);
          if (isCorrect === undefined) {
            isCorrect = gradeShortAnswerLocally(q.acceptableAnswers, ans.trim());
          }
          scored.push({ type: "short", text: ans, correct: isCorrect });
          if (isCorrect) correct++;
        }
      }

      const passed = correct === questions.length;
      setGrading(false);
      onSubmit(scored, passed);
    },
    [questions, layerContext, onSubmit],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: string[] = [];
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === null || answers[i]?.trim() === "") {
        newErrors.push(`Question ${i + 1} is required`);
      }
    }
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    await runSubmit(answers);
  };

  const applyFingerChoice = useCallback(
    (count: number) => {
      if (!handsFree || grading) return;
      const qIdx = stepIndex;
      const q = questions[qIdx];
      if (!q || q.type !== "mcq") return;

      const choiceIdx = count - 1;
      if (choiceIdx < 0 || choiceIdx >= q.choices.length) return;

      const nextAnswers = [...answers];
      nextAnswers[qIdx] = String(choiceIdx);
      setAnswers(nextAnswers);

      const isLast = qIdx >= questions.length - 1;
      if (isLast) {
        void runSubmit(nextAnswers);
        return;
      }

      window.setTimeout(() => {
        setStepIndex((s) => s + 1);
      }, 320);
    },
    [handsFree, grading, stepIndex, questions, answers, runSubmit],
  );

  useImperativeHandle(ref, () => ({ applyFingerChoice }), [applyFingerChoice]);

  if (handsFree) {
    const q = questions[stepIndex];
    if (!q || q.type !== "mcq") return null;

    const selected = answers[stepIndex];
    const maxFingers = Math.min(4, q.choices.length);
    const preview =
      fingerPreview >= 1 && fingerPreview <= maxFingers
        ? fingerPreview
        : null;

    return (
      <div className="space-y-5">
        <p className="ui text-xs text-ink-faint">
          Question {stepIndex + 1} of {questions.length}
        </p>
        <div className="space-y-2">
          <p className="block text-ink-soft font-medium text-sm leading-snug">
            {stepIndex + 1}. {q.question}
          </p>
          <ul className="space-y-2 pl-1" role="listbox" aria-label="Choices">
            {q.choices.map((choice, cIdx) => {
              const num = cIdx + 1;
              const checked = selected === String(cIdx);
              const previewing = preview === num;
              return (
                <li
                  key={cIdx}
                  role="option"
                  aria-selected={checked}
                  className={[
                    "quiz-finger-choice flex gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors",
                    checked
                      ? "border-ink bg-paper-soft text-ink-soft"
                      : previewing
                        ? "border-ink-faint bg-paper-soft/80 text-ink-soft"
                        : "border-rule text-ink-mute",
                  ].join(" ")}
                >
                  <span className="ui shrink-0 w-5 text-ink-faint tabular-nums">
                    {num}
                  </span>
                  <span>{choice}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="ui text-xs text-ink-mute leading-relaxed">
          Hold up{" "}
          {maxFingers === 1
            ? "1 finger"
            : `1–${maxFingers} fingers`}{" "}
          from your index (not your thumb). For 4, spread your pinky up to match
          your ring finger. Lower your hand before the next question.
        </p>

        {errors.length > 0 && (
          <div className="text-sm text-ink-mute space-y-1">
            {errors.map((err, i) => (
              <p key={i}>{err}</p>
            ))}
          </div>
        )}

        {grading && (
          <p className="ui text-sm text-ink-mute">Checking…</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {questions.map((q, qIdx) => (
        <div key={qIdx} className="space-y-2">
          <label className="block text-ink-soft font-medium text-sm leading-snug">
            {qIdx + 1}. {q.question}
          </label>

          {q.type === "mcq" ? (
            <div className="space-y-1.5 pl-1">
              {q.choices.map((choice, cIdx) => (
                <label key={cIdx} className="flex gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name={`q${qIdx}`}
                    value={cIdx}
                    checked={answers[qIdx] === String(cIdx)}
                    onChange={() => handleMCQChange(qIdx, cIdx)}
                    className="mt-0.5"
                    disabled={grading}
                  />
                  <span className="text-ink-soft text-sm">{choice}</span>
                </label>
              ))}
            </div>
          ) : (
            <input
              type="text"
              value={(answers[qIdx] as string) || ""}
              onChange={(e) => handleShortChange(qIdx, e.target.value)}
              disabled={grading}
              className="ui w-full px-3 py-2 border border-rule rounded text-ink-soft text-sm focus:outline-none focus:border-ink-soft bg-paper disabled:opacity-60"
            />
          )}
        </div>
      ))}

      {errors.length > 0 && (
        <div className="text-sm text-ink-mute space-y-1">
          {errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={grading}
        className="ui w-full py-2.5 px-4 bg-ink text-paper rounded text-sm hover:opacity-80 transition-opacity disabled:opacity-60"
      >
        {grading ? "Checking…" : "Submit"}
      </button>
    </form>
  );
});
