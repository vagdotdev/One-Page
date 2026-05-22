// Shared types for the One Page learning surface.

export type LayerKind =
  | "eli5"
  | "mechanism"
  | "context"
  | "quantitative"
  | "synthesis"
  | "scholar"
  | "frontier";

export type QuizQuestion =
  | {
      type: "mcq";
      question: string;
      choices: string[];
      answerIndex: number;
    }
  | {
      type: "short";
      question: string;
      acceptableAnswers: string[];
    };

export type Layer = {
  kind: LayerKind;
  index: number;
  title: string;
  layerLabel: string;
  paragraphs: string[];
  quiz: QuizQuestion[];
};

export type QuizAnswer =
  | { type: "mcq"; choiceIndex: number; correct: boolean }
  | { type: "short"; text: string; correct: boolean };

export type LayerProgress = {
  layer: Layer;
  startedAt: number;
  readAt?: number;
  passedAt?: number;
  answers?: QuizAnswer[];
};

/** Diagnostic question — probes a depth band to pick a starting layer. */
export type PlacementQuestion = {
  type: "mcq";
  question: string;
  choices: string[];
  answerIndex: number;
  /** 0 = eli5 … 6 = frontier — what depth this question probes */
  depthLevel: number;
};

export type Journey = {
  topic: string;
  createdAt: number;
  currentIndex: number;
  layers: LayerProgress[];
  /** User chose "already know some" — ran placement before first layer */
  usedPlacement?: boolean;
};
