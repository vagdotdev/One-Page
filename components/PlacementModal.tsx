"use client";

import { AnimatePresence, motion } from "motion/react";
import { PlacementQuiz } from "./PlacementQuiz";
import type { PlacementQuestion } from "@/lib/types";

interface PlacementModalProps {
  open: boolean;
  topic: string;
  questions: PlacementQuestion[];
  onComplete: (selections: (number | null)[]) => void;
}

export function PlacementModal({
  open,
  topic,
  questions,
  onComplete,
}: PlacementModalProps) {
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
          aria-label={`Placement for ${topic}`}
        >
          <motion.div
            className="quiz-modal placement-modal"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <PlacementQuiz questions={questions} onComplete={onComplete} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
