"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type GazeState = {
  /** User wants gaze / camera features on. */
  enabled: boolean;
  /** User accepted the reading-lens prompt and camera may run. */
  consented: boolean;
};

type GazeActions = {
  setEnabled: (enabled: boolean) => void;
  acceptConsent: () => void;
  declineConsent: () => void;
};

export const useGaze = create<GazeState & GazeActions>()(
  persist(
    (set) => ({
      enabled: false,
      consented: false,

      setEnabled: (enabled) => set({ enabled }),

      acceptConsent: () => set({ consented: true }),

      declineConsent: () => set({ consented: false, enabled: false }),
    }),
    {
      name: "onepage-gaze",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        enabled: s.enabled,
        consented: s.consented,
      }),
    },
  ),
);

/** Camera + landmarker may run when both are true. */
export function gazeIsActive(s: GazeState): boolean {
  return s.enabled && s.consented;
}
