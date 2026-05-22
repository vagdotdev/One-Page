"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  analyzeHandFrame,
  resetHandFrameTrackers,
  type HandFrameAnalysis,
} from "@/lib/hand-frame";

const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

/** Brief flash on Continue after swipe (continue fires immediately). */
export const GAZE_SWIPE_FLASH_MS = 100;

export type GazeCameraStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "denied"
  | "error";

type UseGazeCameraOptions = {
  active: boolean;
  /** When false, swipe won't fire continue (camera may still run). */
  gestureEnabled?: boolean;
  /** When true, stable 1–4 finger hold fires onFingerSelect. */
  fingerSelectEnabled?: boolean;
  /** Max option index for finger count (1–4). */
  maxFingerChoices?: number;
  onHoldComplete?: () => void;
  onFingerSelect?: (count: number) => void;
};

export function useGazeCamera({
  active,
  gestureEnabled = true,
  fingerSelectEnabled = false,
  maxFingerChoices = 4,
  onHoldComplete,
  onFingerSelect,
}: UseGazeCameraOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<import("@mediapipe/tasks-vision").HandLandmarker | null>(
    null,
  );
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const lastMpTimestampRef = useRef(0);
  const progressRef = useRef(0);
  const firedRef = useRef(false);
  const onHoldCompleteRef = useRef(onHoldComplete);
  const onFingerSelectRef = useRef(onFingerSelect);

  const [status, setStatus] = useState<GazeCameraStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [looking, setLooking] = useState(false);
  const [analysis, setAnalysis] = useState<HandFrameAnalysis>({
    handVisible: false,
    velocityX: 0,
    deltaX: 0,
    deltaY: 0,
    swipeDetected: false,
    rawCount: 0,
    fingerCount: 0,
    selectionConfirmed: false,
    selectedValue: null,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onHoldCompleteRef.current = onHoldComplete;
  }, [onHoldComplete]);

  useEffect(() => {
    onFingerSelectRef.current = onFingerSelect;
  }, [onFingerSelect]);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastVideoTimeRef.current = -1;
    lastMpTimestampRef.current = 0;
  }, []);

  const stopStream = useCallback(() => {
    stopLoop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const v = videoRef.current;
    if (v) v.srcObject = null;
  }, [stopLoop]);

  const resetProgress = useCallback(() => {
    progressRef.current = 0;
    lastVideoTimeRef.current = -1;
    lastMpTimestampRef.current = 0;
    firedRef.current = false;
    setProgress(0);
    setLooking(false);
    setAnalysis({
      handVisible: false,
      velocityX: 0,
      deltaX: 0,
      deltaY: 0,
      swipeDetected: false,
      rawCount: 0,
      fingerCount: 0,
      selectionConfirmed: false,
      selectedValue: null,
    });
  }, []);

  const resetCalibration = useCallback(() => {
    resetHandFrameTrackers();
    resetProgress();
  }, [resetProgress]);

  useEffect(() => {
    if (!active) {
      stopStream();
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      setStatus("idle");
      setError(null);
      resetProgress();
      return;
    }

    let cancelled = false;

    const run = async () => {
      setStatus("requesting");
      setError(null);
      resetProgress();

      try {
        const { FilesetResolver, HandLandmarker } = await import(
          "@mediapipe/tasks-vision"
        );

        const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate: "CPU" },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.45,
          minHandPresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });

        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          landmarker.close();
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) throw new Error("Video element missing");

        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;
        await video.play();

        if (cancelled) return;

        setStatus("ready");
        lastMpTimestampRef.current = 0;

        const tick = () => {
          if (cancelled || !landmarkerRef.current || !videoRef.current) return;

          const videoEl = videoRef.current;
          if (
            videoEl.readyState < 2 ||
            videoEl.videoWidth === 0 ||
            videoEl.videoHeight === 0
          ) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }

          if (videoEl.currentTime === lastVideoTimeRef.current) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }
          lastVideoTimeRef.current = videoEl.currentTime;

          let timestamp = performance.now();
          if (timestamp <= lastMpTimestampRef.current) {
            timestamp = lastMpTimestampRef.current + 1;
          }
          lastMpTimestampRef.current = timestamp;

          const now = performance.now();
          let frame: HandFrameAnalysis = {
            handVisible: false,
            velocityX: 0,
            deltaX: 0,
            deltaY: 0,
            swipeDetected: false,
            rawCount: 0,
            fingerCount: 0,
            selectionConfirmed: false,
            selectedValue: null,
          };

          try {
            const result = landmarkerRef.current.detectForVideo(
              videoEl,
              timestamp,
            );
            frame = analyzeHandFrame(result, {
              maxFingerChoices: fingerSelectEnabled
                ? maxFingerChoices
                : undefined,
            });
          } catch {
            frame = analyzeHandFrame(null);
          }

          setAnalysis(frame);
          setLooking(frame.handVisible);

          if (
            fingerSelectEnabled &&
            frame.selectionConfirmed &&
            frame.selectedValue != null
          ) {
            onFingerSelectRef.current?.(frame.selectedValue);
          }

          if (frame.swipeDetected && gestureEnabled) {
            if (!firedRef.current) {
              firedRef.current = true;
              onHoldCompleteRef.current?.();
              progressRef.current = 1;
              setProgress(1);
              window.setTimeout(() => {
                progressRef.current = 0;
                firedRef.current = false;
                setProgress(0);
              }, GAZE_SWIPE_FLASH_MS);
            }
          }

          rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
      } catch (err) {
        if (cancelled) return;
        const name =
          err instanceof DOMException
            ? err.name
            : err instanceof Error
              ? err.name
              : "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setStatus("denied");
          setError("Camera access denied");
        } else {
          setStatus("error");
          setError(
            err instanceof Error ? err.message : "Could not start camera",
          );
        }
        stopStream();
      }
    };

    void run();

    return () => {
      cancelled = true;
      stopStream();
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, [
    active,
    gestureEnabled,
    fingerSelectEnabled,
    maxFingerChoices,
    resetProgress,
    stopStream,
  ]);

  return {
    videoRef,
    status,
    progress,
    looking,
    analysis,
    error,
    resetProgress,
    resetCalibration,
  };
}
