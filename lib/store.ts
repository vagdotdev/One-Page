"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Journey, Layer, LayerProgress, QuizAnswer } from "./types";

// ---------------------------------------------------------------------------
// Journey state. One topic at a time.
// Persisted to localStorage so a refresh keeps the reader where they were.
// ---------------------------------------------------------------------------

type Status =
  | "idle"
  | "placement-loading"
  | "placement"
  | "loading"
  | "reading"
  | "quiz"
  | "passed"
  | "done"
  | "error";

type State = {
  journey: Journey | null;
  status: Status;
  error: string | null;
};

type Actions = {
  startTopic: (topic: string, options?: { placement?: boolean }) => void;
  finishPlacement: (startIndex: number) => void;
  showPlacement: () => void;
  setLoading: () => void;
  setLayer: (layer: Layer) => void;
  replaceCurrentLayer: (layer: Layer) => void;
  setError: (msg: string) => void;
  markRead: () => void;
  enterQuiz: () => void;
  exitQuiz: () => void;
  submitQuiz: (answers: QuizAnswer[], passed: boolean) => void;
  advance: () => void; // move to the next layer index, status -> loading
  reset: () => void;
  /** Fix status after refresh — only persist journey, not transient UI status. */
  reconcileAfterHydration: () => void;
};

const initial: State = { journey: null, status: "idle", error: null };

function layerAtCurrentIndex(j: Journey): LayerProgress | undefined {
  return j.layers.find((p) => p.layer.index === j.currentIndex);
}

export const useJourney = create<State & Actions>()(
  persist(
    (set) => ({
      ...initial,

      startTopic: (topic, options) => {
        const t = topic.trim();
        if (!t) return;
        const placement = options?.placement === true;
        set({
          journey: {
            topic: t,
            createdAt: Date.now(),
            currentIndex: 0,
            layers: [],
            usedPlacement: placement,
          },
          status: placement ? "placement-loading" : "loading",
          error: null,
        });
      },

      finishPlacement: (startIndex) =>
        set((s) => {
          if (!s.journey) return s;
          return {
            journey: {
              ...s.journey,
              currentIndex: Math.max(0, startIndex),
              usedPlacement: true,
            },
            status: "loading",
            error: null,
          };
        }),

      showPlacement: () => set({ status: "placement", error: null }),

      setLoading: () => set({ status: "loading", error: null }),

      setLayer: (layer) =>
        set((s) => {
          if (!s.journey) return s;
          const layers: LayerProgress[] = [...s.journey.layers];
          const prog: LayerProgress = { layer, startedAt: Date.now() };
          // Replace if same index already exists (e.g. retry); else append.
          const existing = layers.findIndex(
            (p) => p.layer.index === layer.index,
          );
          if (existing >= 0) layers[existing] = prog;
          else layers.push(prog);
          return {
            journey: { ...s.journey, currentIndex: layer.index, layers },
            status: "reading",
            error: null,
          };
        }),

      replaceCurrentLayer: (layer) =>
        set((s) => {
          if (!s.journey) return s;
          const layers = [...s.journey.layers];
          const i = layers.length - 1;
          if (i < 0) return s;
          layers[i] = {
            layer,
            startedAt: layers[i].startedAt,
          };
          return {
            journey: { ...s.journey, layers },
            status: "reading",
            error: null,
          };
        }),

      setError: (msg) => set({ status: "error", error: msg }),

      markRead: () =>
        set((s) => {
          if (!s.journey) return s;
          const layers = [...s.journey.layers];
          const i = layers.length - 1;
          if (i < 0) return s;
          layers[i] = { ...layers[i], readAt: Date.now() };
          return { journey: { ...s.journey, layers }, status: "quiz" };
        }),

      enterQuiz: () => set({ status: "quiz" }),

      exitQuiz: () =>
        set((s) => (s.status === "quiz" ? { status: "reading" } : s)),

      submitQuiz: (answers, passed) =>
        set((s) => {
          if (!s.journey) return s;
          const layers = [...s.journey.layers];
          const i = layers.length - 1;
          if (i < 0) return s;
          layers[i] = {
            ...layers[i],
            answers,
            passedAt: passed ? Date.now() : layers[i].passedAt,
          };
          return {
            journey: { ...s.journey, layers },
            status: passed ? "passed" : "quiz",
          };
        }),

      advance: () =>
        set((s) => {
          if (!s.journey) return s;
          const next = s.journey.currentIndex + 1;
          return {
            journey: { ...s.journey, currentIndex: next },
            status: "loading",
            error: null,
          };
        }),

      reset: () => {
        set(initial);
        // Also clear persisted blob.
        if (typeof window !== "undefined") {
          try {
            window.localStorage.removeItem("onepage:journey");
          } catch {}
        }
      },

      reconcileAfterHydration: () =>
        set((s) => {
          if (!s.journey) return { status: "idle", error: null };

          const prog = layerAtCurrentIndex(s.journey);
          if (!prog) {
            const nextStatus =
              s.journey.usedPlacement &&
              (s.status === "placement" || s.status === "placement-loading")
                ? "placement-loading"
                : "loading";
            return { status: nextStatus, error: null };
          }

          if (
            s.status === "loading" ||
            s.status === "placement-loading" ||
            s.status === "placement"
          ) {
            if (prog.passedAt) return { status: "passed", error: null };
            // Note: status is narrowed to the loading family here, so we always
            // drop into the reading view once the layer is loaded.
            return { status: "reading", error: null };
          }

          if (s.status === "quiz" && !prog.readAt) {
            return { status: "reading", error: null };
          }

          return s;
        }),
    }),
    {
      name: "onepage:journey",
      storage: createJSONStorage(() => localStorage),
      // Transient statuses (loading, placement) are not persisted — avoids refresh loops.
      partialize: (s) => ({ journey: s.journey }),
      merge: (persisted, current) => {
        const p = persisted as { journey?: Journey | null } | undefined;
        return {
          ...current,
          journey: p?.journey ?? null,
          status: "idle",
          error: null,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.reconcileAfterHydration();
      },
    },
  ),
);

// Helper: prior layers (everything before currentIndex) — useful for prompts.
export function priorLayers(j: Journey | null): Layer[] {
  if (!j) return [];
  return j.layers
    .filter((p) => p.layer.index < j.currentIndex)
    .map((p) => p.layer);
}
