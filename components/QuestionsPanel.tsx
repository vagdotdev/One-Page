"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuestions, type ChatMessage } from "@/lib/questions";
import { useJourney } from "@/lib/store";

// The right-side AI sidecar — "Questions".
// Slides in from the right. Listens for an anchor (selected page text).
// Maintains a single conversation per session.

const PANEL_WIDTH = 400;
const MOBILE_BREAKPOINT = 640;

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

export function QuestionsPanel() {
  const isMobile = useIsMobile();
  const isOpen = useQuestions((s) => s.isOpen);
  const messages = useQuestions((s) => s.messages);
  const anchorText = useQuestions((s) => s.anchorText);
  const isThinking = useQuestions((s) => s.isThinking);
  const close = useQuestions((s) => s.close);
  const clearAnchor = useQuestions((s) => s.clearAnchor);
  const addMessage = useQuestions((s) => s.addMessage);
  const setThinking = useQuestions((s) => s.setThinking);

  const journey = useJourney((s) => s.journey);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Autoscroll to the latest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Focus the input when the panel opens (and on new anchor).
  useEffect(() => {
    if (isOpen) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 320);
      return () => window.clearTimeout(id);
    }
  }, [isOpen, anchorText]);

  // ESC to close.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isThinking) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    addMessage(userMsg);
    setInput("");

    // Snapshot anchor + history for this turn.
    const turnAnchor = anchorText;
    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const currentLayer = journey?.layers[journey.layers.length - 1]?.layer;
    const layerText = currentLayer?.paragraphs.join("\n\n");

    setThinking(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: journey?.topic || "",
          layerText,
          anchorText: turnAnchor,
          messages: history,
        }),
      });
      const data = (await res.json()) as { content?: string; error?: string };
      if (!res.ok || !data.content) {
        throw new Error(data.error || "Could not reach the model.");
      }
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: msg,
      });
    } finally {
      setThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const canSend = input.trim().length > 0 && !isThinking;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="questions-panel"
          initial={isMobile ? { y: "100%" } : { x: "100%" }}
          animate={isMobile ? { y: 0 } : { x: 0 }}
          exit={isMobile ? { y: "100%" } : { x: "100%" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="questions-panel"
          style={isMobile ? undefined : { width: PANEL_WIDTH }}
        >
          <header className="questions-panel__header">
            <h2 className="display questions-panel__title">Questions</h2>
            <button
              type="button"
              className="questions-panel__close ui"
              onClick={close}
              aria-label="Close questions"
            >
              ×
            </button>
          </header>

          <div className="questions-panel__messages">
            {messages.length === 0 && !isThinking && (
              <p className="questions-panel__empty ui">
                Highlight a passage to anchor your question, or just ask.
              </p>
            )}
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            {isThinking && <ThinkingDots />}
            <div ref={messagesEndRef} />
          </div>

          <form className="questions-panel__composer" onSubmit={handleSend}>
            <AnimatePresence initial={false}>
              {anchorText && (
                <motion.div
                  key="anchor-pill"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="anchor-pill ui"
                >
                  <span className="anchor-pill__quote" aria-hidden>
                    ❝
                  </span>
                  <span className="anchor-pill__text">{anchorText}</span>
                  <button
                    type="button"
                    className="anchor-pill__close"
                    onClick={clearAnchor}
                    aria-label="Remove anchor"
                  >
                    ×
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="composer-input-wrap">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={anchorText ? "Ask a follow-up" : "Ask anything"}
                rows={1}
                className="composer-input ui"
                disabled={isThinking}
              />
              <button
                type="submit"
                disabled={!canSend}
                className="composer-send ui"
                aria-label="Send"
              >
                ↑
              </button>
            </div>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="chat-user ui"
      >
        {message.content}
      </motion.div>
    );
  }
  // Assistant: render a fade-in block with prose styling.
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="chat-assistant"
    >
      {renderAssistant(message.content)}
    </motion.div>
  );
}

// Minimal renderer: respects paragraph breaks, keeps **bold** and `code` simple.
function renderAssistant(text: string): React.ReactNode {
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map((p, i) => (
    <p key={i} className="chat-assistant__p">
      {renderInline(p)}
    </p>
  ));
}

function renderInline(text: string): React.ReactNode {
  // Split on **bold** and `code` while preserving order.
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else {
      parts.push(
        <code key={key++} className="chat-assistant__code">
          {token.slice(1, -1)}
        </code>,
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function ThinkingDots() {
  return (
    <div className="chat-thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="breathe chat-thinking__dot"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  );
}
