# One Page — Built ✓

Everything for **One Page** — the single-surface learning experience — is built, typed, and ready to run.

## What's Built

### Architecture

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Client-side state** (Zustand + localStorage) — zero server persistence in v1
- **API route** for LLM generation — `/api/layer`
- **Zero JS bloat** — only motion/react (text animation), zustand (state)

### The Flow

1. **Landing** — topic input + suggestions
2. **Loading** — fetch layer from LLM (with prior layers as context)
3. **Reading** — display content with staggered paragraph animation
4. **Quiz** — validate understanding (2/3 correct = pass)
5. **Passed** → advance to next layer (or completion)

**All state survives page refresh.** Close the browser, reopen, you're exactly where you left.

### Components

| File | Role |
|------|------|
| `app/page.tsx` | Entry point (mounts `OnePage`) |
| `components/OnePage.tsx` | Orchestrator (state flow + layer fetching) |
| `components/Landing.tsx` | Topic input with 6 suggestions |
| `components/Reader.tsx` | Layer display with staggered fade-in |
| `components/Quiz.tsx` | Multiple-choice + short-answer questions |
| `components/LayerIndicator.tsx` | Dot progress bar (1–5 layers) |

### Backend

| File | Role |
|------|------|
| `app/api/layer/route.ts` | POST `/api/layer` — generates a single layer |
| `lib/llm.ts` | Provider abstraction (Anthropic preferred, OpenAI fallback) |
| `lib/prompts.ts` | **System prompt** (enforces voice, structure, no clichés) |
| `lib/store.ts` | Zustand store + localStorage persistence |

### Types

| File | Exports |
|------|---------|
| `lib/types.ts` | `Layer`, `LayerKind`, `Journey`, `QuizQuestion`, `QuizAnswer` |

### Design

| File | Contains |
|------|----------|
| `app/globals.css` | Design tokens, typography, animations (paper-and-ink palette) |
| `app/layout.tsx` | Fraunces (serif body) + Inter (UI sans) fonts from Google |

---

## To Run

### 1. Add API keys to `.env.local`

```bash
# Either (preferred):
ANTHROPIC_API_KEY=sk-ant-...

# Or:
OPENAI_API_KEY=sk-...
```

### 2. Start dev server

```bash
npm run dev
```

Open http://localhost:3000.

### 3. Test flow

- Type a topic (e.g. "Rockets")
- Wait for Layer 1 (ELI5) to generate
- Read it, click "I've read this"
- Answer 2–3 quiz questions (get ≥66% to pass)
- Click "Next layer" to continue

---

## Why This Works

### 1. The System Prompt

The prompt in `lib/prompts.ts` is **the entire product**. It:

- **Bans clichés** ("imagine," "delve," "fascinating," etc.) — AI prose dies on arrival otherwise
- **Enforces coherence** ("same story, deeper") — each layer rewrites the topic at higher fidelity, not a new sibling
- **Sets tone** (direct, warm, concrete) — sounds like a thoughtful friend, not a chatbot
- **Structures output** (JSON) — clean, parseable, no prose noise

### 2. The Layers

```
L1: The Idea         (ELI5 — simplest true version)
L2: How It Works     (mechanism — the parts)
L3: In The World     (context — examples, history, variations)
L4: The Numbers      (quantitative — precision, equations)
L5: Putting It Together (synthesis — mental model + takeaways)
```

Each layer re-reads as a **refinement of the prior one**, not a new topic.

### 3. The Quiz Gate

Questions test **understanding**, not recall. Multiple-choice + short-answer mix. ≥66% correct = pass = unlock next layer.

This is **active recall** — the strongest form of learning.

### 4. The Design

- **Serif body (Fraunces)** — warm, editorial, "solid" — reads like a book
- **Sans UI (Inter)** — quiet, purposeful chrome for inputs/buttons
- **One centered column** (~610px) — generous whitespace, no clutter
- **Subtle animations** — paragraph stagger, breathing dots, title shimmer
- **Paper & ink palette** — off-white + deep ink in light; reversed in dark

The design is **restrained**. No gamification cosplay, no XP explosions. Progress is elegant and quiet.

---

## What's Next

### Phase 1 (done)
- ✅ Shell, layout, typography, colors
- ✅ Component architecture
- ✅ Zustand store + localStorage
- ✅ API route + LLM integration
- ✅ System prompt
- ✅ Full flow (landing → reading → quiz → advancement)

### Phase 2 (future)
- Publish 5–10 curated topics with human polish
- Optional: Supabase for multi-device journey persistence
- Optional: Voice narration (TTS)
- Optional: Eye-tracking heatmap (opt-in, WebGazer-class)
- Optional: Richer visuals (Mermaid, D3, SVG diagrams)

---

## Deployment

Build is production-ready:

```bash
npm run build
npm run start
```

Or deploy to Vercel with one click. The API route will fetch LLM completions at request time (no cold-start penalty; Anthropic + OpenAI are fast).

---

## The Product in a Sentence

A single, serif-led page that teaches one topic at a time, deepening as you prove you understand. Calm. Beautiful. No fluff.

---

*Built 2025. One Page. Learn anything, deeply, on one beautiful surface.*
