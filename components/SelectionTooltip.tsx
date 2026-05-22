"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuestions } from "@/lib/questions";

// A small floating "Ask" pill that appears above text the reader has selected
// inside a [data-selectable] container. Click → open Questions panel anchored
// to the selection.

type Pos = { top: number; left: number };

const MIN_SELECTION_LENGTH = 3;
const TOOLTIP_OFFSET = 12; // px above the selection
const MAX_ANCHOR_LENGTH = 600; // truncate absurdly long selections

export function SelectionTooltip() {
  const openWithSelection = useQuestions((s) => s.openWithSelection);
  const isOpen = useQuestions((s) => s.isOpen);

  const [pos, setPos] = useState<Pos | null>(null);
  const textRef = useRef<string>("");
  const ignoreNextSelectionChange = useRef(false);

  useEffect(() => {
    const updateFromSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setPos(null);
        textRef.current = "";
        return;
      }

      const range = selection.getRangeAt(0);
      const anchorNode = range.commonAncestorContainer;
      const node =
        anchorNode.nodeType === Node.ELEMENT_NODE
          ? (anchorNode as Element)
          : anchorNode.parentElement;

      // Only show inside an explicitly selectable surface (the reader article).
      if (!node || !node.closest("[data-selectable]")) {
        setPos(null);
        textRef.current = "";
        return;
      }

      const raw = selection.toString().trim();
      if (raw.length < MIN_SELECTION_LENGTH) {
        setPos(null);
        textRef.current = "";
        return;
      }

      // Position above the bounding rect of the range, anchored to its center.
      const rects = range.getClientRects();
      const rect =
        rects.length > 0 ? rects[rects.length - 1] : range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        setPos(null);
        return;
      }

      textRef.current =
        raw.length > MAX_ANCHOR_LENGTH
          ? raw.slice(0, MAX_ANCHOR_LENGTH) + "…"
          : raw;

      // Use top-of-first-rect (above the start of the selection looks tighter)
      const first = rects.length > 0 ? rects[0] : rect;
      setPos({
        top: first.top - TOOLTIP_OFFSET,
        left: first.left + first.width / 2,
      });
    };

    const onMouseUp = () => {
      // Defer so the browser has finalized the selection.
      requestAnimationFrame(updateFromSelection);
    };
    const onSelectionChange = () => {
      if (ignoreNextSelectionChange.current) {
        ignoreNextSelectionChange.current = false;
        return;
      }
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setPos(null);
        textRef.current = "";
      }
    };

    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchend", onMouseUp);
    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchend", onMouseUp);
      document.removeEventListener("selectionchange", onSelectionChange);
    };
  }, []);

  // Hide when the panel opens (we've captured the anchor).
  useEffect(() => {
    if (isOpen) setPos(null);
  }, [isOpen]);

  const handleAsk = () => {
    const text = textRef.current;
    if (!text) return;
    openWithSelection(text);
    // Clear the selection so the highlight doesn't linger awkwardly.
    ignoreNextSelectionChange.current = true;
    window.getSelection()?.removeAllRanges();
    setPos(null);
    textRef.current = "";
  };

  return (
    <AnimatePresence>
      {pos && (
        <motion.button
          // Prevent mousedown from collapsing the selection before our onClick fires.
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleAsk}
          initial={{ opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="selection-tooltip ui"
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
          }}
          aria-label="Ask a question about the selected text"
        >
          <span className="selection-tooltip__quote" aria-hidden>
            ❝
          </span>
          <span>Ask</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
