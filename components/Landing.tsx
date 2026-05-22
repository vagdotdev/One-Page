"use client";

import { useState } from "react";
import { KnowSomeToggle } from "@/components/KnowSomeToggle";
import { useJourney } from "@/lib/store";

const SUGGESTIONS = [
  "Quantum Entanglement",
  "Photosynthesis",
  "Rockets",
  "World War II",
  "Supply and Demand",
  "Black Holes",
];

export function Landing() {
  const startTopic = useJourney((s) => s.startTopic);
  const [input, setInput] = useState("");
  const [active, setActive] = useState(false);
  const [knowSome, setKnowSome] = useState(false);

  const go = (topic: string) => {
    const t = topic.trim();
    if (!t) return;
    startTopic(t, { placement: knowSome });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    go(input);
  };

  return (
    <div className="viewport-shell">
      <div className="measure w-full page-panel viewport-panel">
        <div className="viewport-body">
          <div className="landing-body">
            <div className="text-center mb-10">
              <h1 className="display text-5xl sm:text-6xl">One Page</h1>
            </div>

            <form onSubmit={handleSubmit} className="mb-8 w-full">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="What do you want to understand?"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setActive(true)}
                  onBlur={() => setActive(false)}
                  className={`ui landing-input w-full px-4 py-3 border rounded transition-colors outline-none ${
                    active
                      ? "border-ink-soft bg-paper text-ink"
                      : "border-rule bg-paper text-ink-soft"
                  }`}
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={`ui absolute right-3 top-1/2 -translate-y-1/2 text-sm transition-opacity ${
                    input.trim()
                      ? "opacity-60 hover:opacity-100 cursor-pointer"
                      : "opacity-25 cursor-not-allowed"
                  }`}
                >
                  Go
                </button>
              </div>
              <KnowSomeToggle checked={knowSome} onChange={setKnowSome} />
            </form>

            <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
              {SUGGESTIONS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => go(topic)}
                  className="ui px-3 py-2 text-sm border border-rule rounded hover:border-ink-faint transition-colors text-ink-mute hover:text-ink-soft text-center"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
