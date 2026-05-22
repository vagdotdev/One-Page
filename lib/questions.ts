"use client";

import { create } from "zustand";

// ---------------------------------------------------------------------------
// Questions panel state — the AI chat sidecar.
// Ephemeral by design: lives only for the current session, cleared on topic reset.
// ---------------------------------------------------------------------------

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type State = {
  isOpen: boolean;
  messages: ChatMessage[];
  // The selected passage this question is anchored to.
  // Stays attached across follow-ups in the same conversation until the user
  // clears it manually (× on the pill) or starts a new selection.
  anchorText: string | null;
  isThinking: boolean;
};

type Actions = {
  openWithSelection: (text: string) => void;
  open: () => void;
  close: () => void;
  clearAnchor: () => void;
  addMessage: (msg: ChatMessage) => void;
  setThinking: (b: boolean) => void;
  reset: () => void;
};

const initial: State = {
  isOpen: false,
  messages: [],
  anchorText: null,
  isThinking: false,
};

export const useQuestions = create<State & Actions>()((set) => ({
  ...initial,

  openWithSelection: (text) =>
    set({ isOpen: true, anchorText: text.trim() || null }),

  open: () => set({ isOpen: true }),

  close: () => set({ isOpen: false }),

  clearAnchor: () => set({ anchorText: null }),

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  setThinking: (b) => set({ isThinking: b }),

  reset: () => set(initial),
}));
