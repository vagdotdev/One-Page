"use client";

import { useEffect, type RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Quiz, type QuizHandle } from "./Quiz";
import type { QuizAnswer, QuizQuestion } from "@/lib/types";

interface QuizModalProps {
  open: boolean;
  questions: QuizQuestion[];
  layerContext: string;
  formKey: number;
  onSubmit: (answers: QuizAnswer[], passed: boolean) => void;
  onDismiss: () => void;
  handsFree?: boolean;
  fingerPreview?: number;
  quizRef?: RefObject<QuizHandle | null>;
}

export function QuizModal({
  open,
  questions,
  layerContext,
  formKey,
  onSubmit,
  onDismiss,
  handsFree = false,
  fingerPreview = 0,
  quizRef,
}: QuizModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onDismiss]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="quiz-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="quiz-modal-title"
          onClick={onDismiss}
        >
          <motion.div
            className="quiz-modal"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p id="quiz-modal-title" className="kicker mb-5">
              {handsFree ? "Check · hands" : "Check"}
            </p>
            <Quiz
              ref={quizRef}
              key={formKey}
              questions={questions}
              layerContext={layerContext}
              onSubmit={onSubmit}
              handsFree={handsFree}
              fingerPreview={fingerPreview}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
