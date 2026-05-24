"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useJourney, priorLayers } from "@/lib/store";
import { useQuestions } from "@/lib/questions";
import { canAdvanceFrom } from "@/lib/depth";
import { shouldQuizForNext } from "@/lib/quiz-cadence";
import { computePlacementStartIndex } from "@/lib/placement-score";
import type { PlacementQuestion, QuizAnswer, QuizQuestion } from "@/lib/types";
import { DepthRail } from "./DepthRail";
import { Landing } from "./Landing";
import { PlacementModal } from "./PlacementModal";
import { Reader, type ReaderPhase } from "./Reader";
import { QuizModal } from "./QuizModal";
import type { QuizHandle } from "./Quiz";
import { SelectionTooltip } from "./SelectionTooltip";
import { QuestionsPanel } from "./QuestionsPanel";
import { GazeContinueButton } from "./GazeContinueButton";
import { GazeConsent } from "./GazeConsent";
import { GazeCameraSink } from "./GazeCameraSink";
import { LensTarget } from "./LensTarget";
import { GazeToggle } from "./GazeToggle";
import { useGazeCamera } from "@/hooks/useGazeCamera";
import { gazeIsActive, useGaze } from "@/lib/gaze-store";

const DISSOLVE_MS = 650;

function missedQuestionTexts(
  questions: QuizQuestion[],
  answers: QuizAnswer[],
): string[] {
  return questions
    .filter((_, i) => answers[i] && !answers[i].correct)
    .map((q) => q.question);
}

export function OnePage() {
  const journey = useJourney((s) => s.journey);
  const status = useJourney((s) => s.status);
  const error = useJourney((s) => s.error);
  const setLayer = useJourney((s) => s.setLayer);
  const replaceCurrentLayer = useJourney((s) => s.replaceCurrentLayer);
  const setError = useJourney((s) => s.setError);
  const markRead = useJourney((s) => s.markRead);
  const exitQuiz = useJourney((s) => s.exitQuiz);
  const submitQuiz = useJourney((s) => s.submitQuiz);
  const advance = useJourney((s) => s.advance);
  const reset = useJourney((s) => s.reset);
  const finishPlacement = useJourney((s) => s.finishPlacement);
  const showPlacement = useJourney((s) => s.showPlacement);
  const setLoading = useJourney((s) => s.setLoading);
  const reconcileAfterHydration = useJourney((s) => s.reconcileAfterHydration);

  const isQuestionsOpen = useQuestions((s) => s.isOpen);
  const resetQuestions = useQuestions((s) => s.reset);

  const generatingRef = useRef(false);
  const placementFetchingRef = useRef(false);
  const [placementQuestions, setPlacementQuestions] = useState<
    PlacementQuestion[]
  >([]);
  const [readerPhase, setReaderPhase] = useState<ReaderPhase>("enter");
  const [animationKey, setAnimationKey] = useState(0);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizFormKey, setQuizFormKey] = useState(0);
  const [revising, setRevising] = useState(false);
  const quizRef = useRef<QuizHandle | null>(null);

  // Reset Questions whenever the topic resets (journey becomes null).
  useEffect(() => {
    if (!journey) resetQuestions();
  }, [journey, resetQuestions]);

  // After localStorage rehydrate, fix status (journey-only persist).
  useEffect(() => {
    const run = () => reconcileAfterHydration();
    if (useJourney.persist.hasHydrated()) run();
    return useJourney.persist.onFinishHydration(run);
  }, [reconcileAfterHydration]);

  // Recover from stuck UI: placement modal open in store but questions lost in memory.
  useEffect(() => {
    if (!journey) return;

    const prog = journey.layers.find(
      (p) => p.layer.index === journey.currentIndex,
    );

    if (status === "placement" && placementQuestions.length === 0) {
      placementFetchingRef.current = false;
      useJourney.setState({ status: "placement-loading", error: null });
      return;
    }

    if (
      !prog &&
      status !== "loading" &&
      status !== "placement-loading" &&
      status !== "error" &&
      status !== "idle"
    ) {
      generatingRef.current = false;
      setLoading();
    }
  }, [journey, status, placementQuestions.length, setLoading]);

  const handleReset = useCallback(() => {
    resetQuestions();
    reset();
  }, [reset, resetQuestions]);

  useEffect(() => {
    if (status !== "placement-loading" || !journey) return;
    if (placementFetchingRef.current) return;

    placementFetchingRef.current = true;

    const fetchPlacement = async () => {
      try {
        const res = await fetch("/api/placement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: journey.topic }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as { questions?: PlacementQuestion[] };
        if (!Array.isArray(data.questions) || data.questions.length === 0) {
          throw new Error("Invalid placement response");
        }
        setPlacementQuestions(data.questions);
        showPlacement();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
      } finally {
        placementFetchingRef.current = false;
      }
    };

    fetchPlacement();
  }, [status, journey, showPlacement, setError]);

  useEffect(() => {
    if (status !== "loading" || !journey) return;
    if (generatingRef.current) return;

    generatingRef.current = true;

    const fetchLayer = async () => {
      try {
        // Flow-aware cadence: decide whether this layer should carry a quiz.
        // Synthesis layers and band-transitions force a quiz; otherwise it's
        // probabilistic based on recent performance.
        const includeQuiz = shouldQuizForNext(journey);

        const res = await fetch("/api/layer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: journey.topic,
            layerIndex: journey.currentIndex,
            priorLayers: priorLayers(journey),
            includeQuiz,
          }),
        });

        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        const data = (await res.json()) as { layer?: unknown };
        if (!data.layer || typeof data.layer !== "object") {
          throw new Error("Invalid layer response");
        }
        setLayer(data.layer as Parameters<typeof setLayer>[0]);
        setReaderPhase("enter");
        setAnimationKey((k) => k + 1);
        setQuizFormKey((k) => k + 1);
        setQuizOpen(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
      } finally {
        generatingRef.current = false;
      }
    };

    fetchLayer();
  }, [status, journey, setLayer, setError]);

  useEffect(() => {
    if (status === "quiz") setQuizOpen(true);
    if (status === "reading" || status === "passed") setQuizOpen(false);
  }, [status]);

  const onQuizPass = useCallback(
    (answers: QuizAnswer[]) => {
      setQuizOpen(false);
      const idx = journey?.currentIndex ?? 0;

      if (!canAdvanceFrom(idx)) {
        submitQuiz(answers, true);
        return;
      }

      setReaderPhase("dissolve");
      window.setTimeout(() => {
        submitQuiz(answers, true);
        advance();
      }, DISSOLVE_MS);
    },
    [journey, submitQuiz, advance],
  );

  const handleContinue = useCallback(() => {
    const progress = journey?.layers[journey.layers.length - 1];
    const quiz = progress?.layer.quiz ?? [];
    if (quiz.length === 0) {
      onQuizPass([]);
      return;
    }
    markRead();
  }, [journey, markRead, onQuizPass]);

  const handleGoDeeper = useCallback(() => {
    if (readerPhase === "dissolve") return;
    setReaderPhase("dissolve");
    window.setTimeout(() => {
      advance();
    }, DISSOLVE_MS);
  }, [advance, readerPhase]);

  const gazeEnabled = useGaze((s) => s.enabled);
  const gazeConsented = useGaze((s) => s.consented);
  const gazeActive = gazeIsActive({ enabled: gazeEnabled, consented: gazeConsented });

  const isReadingLayer = status === "reading" && !revising;

  const activeLayerQuiz =
    journey?.layers.find((p) => p.layer.index === journey.currentIndex)?.layer
      .quiz ?? [];

  const quizHandsFree =
    gazeActive &&
    quizOpen &&
    activeLayerQuiz.length > 0 &&
    activeLayerQuiz.every((q) => q.type === "mcq");

  const gaze = useGazeCamera({
    active: gazeActive,
    gestureEnabled: isReadingLayer && !quizOpen,
    fingerSelectEnabled: quizHandsFree,
    onHoldComplete: () => {
      if (isReadingLayer) handleContinue();
    },
    onFingerSelect: (count) => {
      quizRef.current?.applyFingerChoice(count);
    },
  });

  useEffect(() => {
    if (!isReadingLayer) gaze.resetProgress();
  }, [isReadingLayer, gaze.resetProgress]);

  useEffect(() => {
    if (isReadingLayer && gazeActive) gaze.resetCalibration();
  }, [animationKey, isReadingLayer, gazeActive, gaze.resetCalibration]);

  useEffect(() => {
    if (quizOpen && quizHandsFree) gaze.resetCalibration();
  }, [quizOpen, quizHandsFree, quizFormKey, gaze.resetCalibration]);

  const reviseAfterFail = useCallback(
    async (
      answers: QuizAnswer[],
      layer: Parameters<typeof replaceCurrentLayer>[0],
    ) => {
      if (!journey) return;

      setQuizOpen(false);
      setReaderPhase("dissolve");
      submitQuiz(answers, false);

      await new Promise((r) => setTimeout(r, DISSOLVE_MS));

      setRevising(true);
      try {
        const missed = missedQuestionTexts(layer.quiz, answers);
        const res = await fetch("/api/layer/revise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: journey.topic,
            currentLayer: layer,
            priorLayers: priorLayers(journey),
            missedQuestions: missed,
          }),
        });

        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        const data = (await res.json()) as { layer?: unknown };
        if (!data.layer || typeof data.layer !== "object") {
          throw new Error("Invalid revise response");
        }

        replaceCurrentLayer(
          data.layer as Parameters<typeof replaceCurrentLayer>[0],
        );
        setQuizFormKey((k) => k + 1);
        setReaderPhase("enter");
        setAnimationKey((k) => k + 1);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not rewrite";
        setError(msg);
      } finally {
        setRevising(false);
      }
    },
    [journey, submitQuiz, replaceCurrentLayer, setError],
  );

  const handleQuizSubmit = useCallback(
    (answers: QuizAnswer[], passed: boolean) => {
      const progress = journey?.layers[journey.layers.length - 1];
      if (!progress) return;

      if (!passed) {
        void reviseAfterFail(answers, progress.layer);
        return;
      }
      onQuizPass(answers);
    },
    [journey, onQuizPass, reviseAfterFail],
  );

  const handlePlacementComplete = useCallback(
    (selections: (number | null)[]) => {
      const startIndex = computePlacementStartIndex(
        placementQuestions,
        selections,
      );
      setPlacementQuestions([]);
      finishPlacement(startIndex);
    },
    [placementQuestions, finishPlacement],
  );

  const handleQuizDismiss = useCallback(() => {
    exitQuiz();
  }, [exitQuiz]);

  // -------------------------------------------------------------------------
  // Build inner content (everything inside .viewport-shell).
  // -------------------------------------------------------------------------

  const renderInner = (): React.ReactNode => {
    if (!journey) return <Landing />;

    if (status === "error") {
      const isKeyMissing = /api key/i.test(error || "");
      return (
        <div className="measure w-full text-center">
          <h2 className="display text-3xl mb-4">Something went wrong</h2>
          {isKeyMissing ? (
            <p className="text-ink-mute mb-2">
              No API key found. Add{" "}
              <code className="ui text-sm bg-paper-soft px-1 rounded">
                ANTHROPIC_API_KEY
              </code>{" "}
              or{" "}
              <code className="ui text-sm bg-paper-soft px-1 rounded">
                OPENAI_API_KEY
              </code>{" "}
              to{" "}
              <code className="ui text-sm bg-paper-soft px-1 rounded">
                .env.local
              </code>
              .
            </p>
          ) : (
            <p className="text-ink-mute mb-2">{error}</p>
          )}
          <p className="text-ink-faint text-sm mb-8">
            Then restart the dev server.
          </p>
          <button
            onClick={handleReset}
            className="ui text-sm text-ink-mute hover:text-ink-soft transition-colors border border-rule rounded px-4 py-2 hover:border-ink-faint"
          >
            Back
          </button>
        </div>
      );
    }

    if (status === "placement-loading" || status === "loading") {
      const label = journey.topic;
      return (
        <div className="measure w-full page-panel viewport-panel">
          <div className="viewport-body flex items-center justify-center">
            <div className="text-center">
              <h2 className="display display--viewport title-shimmer mb-4">
                {label}
              </h2>
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="breathe w-1.5 h-1.5 rounded-full bg-ink-faint"
                    style={{ animationDelay: `${i * 0.25}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (status === "placement" && placementQuestions.length > 0) {
      return (
        <PlacementModal
          open
          topic={journey.topic}
          questions={placementQuestions}
          onComplete={handlePlacementComplete}
        />
      );
    }

    const currentLayerProgress = journey.layers.find(
      (p) => p.layer.index === journey.currentIndex,
    );
    if (!currentLayerProgress) {
      return (
        <div className="measure w-full page-panel viewport-panel">
          <div className="viewport-body flex items-center justify-center">
            <div className="text-center">
              <h2 className="display display--viewport title-shimmer mb-4">
                {journey.topic}
              </h2>
              <div className="flex justify-center gap-1.5 mb-8">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="breathe w-1.5 h-1.5 rounded-full bg-ink-faint"
                    style={{ animationDelay: `${i * 0.25}s` }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="ui text-sm text-ink-mute hover:text-ink-soft transition-colors border border-rule rounded px-4 py-2 hover:border-ink-faint"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      );
    }

    const layer = currentLayerProgress.layer;
    const canGoDeeper = canAdvanceFrom(journey.currentIndex);
    const hasQuiz = layer.quiz.length > 0;
    const continueWithoutQuiz = !hasQuiz;
    const transitioning = readerPhase === "dissolve";

    return (
      <>
        <div className="measure w-full page-panel viewport-panel">
          <DepthRail depthIndex={journey.currentIndex} />
          <div className="viewport-body">
            <Reader
              layer={layer}
              phase={readerPhase}
              animationKey={animationKey}
              onExit={handleReset}
            />
            {revising && (
              <p className="ui absolute inset-x-0 bottom-1/3 text-center text-sm text-ink-mute">
                Another way in…
              </p>
            )}
          </div>

          <div className="viewport-footer">
            {status === "reading" && hasQuiz && !revising && !transitioning && (
              <GazeContinueButton
                onContinue={handleContinue}
                gazeActive={gazeActive}
                progress={gaze.progress}
                cameraStatus={gaze.status}
                cameraError={gaze.error}
              />
            )}

            {status === "passed" && canGoDeeper && !transitioning && (
              <button
                onClick={handleGoDeeper}
                className="ui text-sm text-ink-mute hover:text-ink-soft transition-colors border border-rule rounded px-5 py-2 hover:border-ink-faint"
              >
                Go deeper
              </button>
            )}

            {status === "passed" && !canGoDeeper && !transitioning && (
              <button
                onClick={handleReset}
                className="ui text-sm text-ink-mute hover:text-ink-soft transition-colors border border-rule rounded px-5 py-2 hover:border-ink-faint"
              >
                Choose another topic
              </button>
            )}

            {status === "reading" &&
              continueWithoutQuiz &&
              !revising &&
              !transitioning && (
              <GazeContinueButton
                onContinue={handleContinue}
                gazeActive={gazeActive}
                progress={gaze.progress}
                cameraStatus={gaze.status}
                cameraError={gaze.error}
              />
            )}
          </div>
        </div>

        {hasQuiz && (
          <QuizModal
            open={quizOpen}
            formKey={quizFormKey}
            questions={layer.quiz}
            layerContext={layer.paragraphs.join("\n\n")}
            onSubmit={handleQuizSubmit}
            onDismiss={handleQuizDismiss}
            handsFree={quizHandsFree}
            fingerPreview={gaze.analysis.fingerCount}
            quizRef={quizRef}
          />
        )}
      </>
    );
  };

  const shellClass = isQuestionsOpen
    ? "viewport-shell viewport-shell--with-panel"
    : "viewport-shell";

  return (
    <div className="app-shell">
      <GazeToggle />
      <GazeConsent />
      <LensTarget visible={gazeActive && isReadingLayer} />
      <GazeCameraSink videoRef={gaze.videoRef} active={gazeActive} />
      <div className="app-shell__main">
        <div className={shellClass}>{renderInner()}</div>
      </div>
      <SelectionTooltip />
      <QuestionsPanel />
    </div>
  );
}
