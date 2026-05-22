# One Page

Learn anything. One page. Deeply.

A single-surface learning experience: enter a topic, read an ELI5 explanation, answer a quiz, and the page **evolves in place** into deeper layers — same topic, richer detail, until you reach mastery.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up API keys

Copy `.env.example` to `.env.local` and add **either** Anthropic or OpenAI API key:

```bash
# Anthropic (recommended for prose quality)
ANTHROPIC_API_KEY=sk-ant-...

# Or OpenAI (alternative)
OPENAI_API_KEY=sk-...
```

Anthropic is preferred when both keys are present (better voice coherence).

### 3. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
onepage/
├── app/
│   ├── layout.tsx          # Root layout with Fraunces + Inter fonts
│   ├── page.tsx            # Single page app
│   ├── globals.css         # Design tokens, typography, animations
│   └── api/
│       └── layer/route.ts  # POST /api/layer — generate a layer
├── components/
│   ├── Landing.tsx         # Topic input + suggestions
│   ├── LayerIndicator.tsx  # Dot progress indicator
│   ├── Reader.tsx          # Layer display with staggered animation
│   ├── Quiz.tsx            # Multiple-choice + short answer
│   └── OnePage.tsx         # Main orchestrator (state + flow)
├── lib/
│   ├── types.ts            # Type definitions
│   ├── store.ts            # Zustand store + localStorage
│   ├── llm.ts              # LLM provider (Anthropic | OpenAI)
│   └── prompts.ts          # System prompt + layer instructions
├── .env.example
├── .env.local              # Your API keys (git-ignored)
└── WHAT-THIS-IS.md         # Original product spec
```

## How It Works

1. **User enters a topic** (e.g. "Rockets") → `Landing.tsx` calls `startTopic()`
2. **State → loading** → `OnePage` fetches `/api/layer` with topic + layer index
3. **API route** asks the LLM to generate that layer (with prior layers as context for coherence)
4. **Reader** displays layer text with staggered fade-in animation
5. **User clicks "I've read this"** → status → quiz
6. **Quiz** displays questions, validates answers (2/3 correct = pass)
7. **On pass** → status → "Ready for next layer?" button
8. **Advance** → fetch next layer, repeat until synthesis

All state is persisted to localStorage, so closing and reopening the browser resumes the journey.

## Design

- **Serif-led typography** (Fraunces) for reading content — warm, editorial, "solid"
- **Sans UI** (Inter) for inputs, buttons, quiz chrome — quiet, purposeful
- **Paper & ink** palette: warm off-white paper (#f5efe4), deep ink (#1a1814) in light mode; reversed in dark
- **One centered column** (~610px measure) — generous whitespace, no clutter
- **Subtle animations** — paragraph stagger, dot pulse while generating, title shimmer
- **No gamification theater** — progress is elegant and understated

## System Prompt Philosophy

The `SYSTEM_PROMPT` in `lib/prompts.ts` is the product. It enforces:

- **No clichés**: bans "imagine," "delve," "fascinating," "let's explore," etc.
- **Same story, deeper**: each layer rewrites the whole topic at higher fidelity, not a new sibling
- **Concrete language**: things, forces, parts — not abstract "concepts"
- **One voice**: direct, warm, unhurried — sounds like a thoughtful friend, not a chatbot
- **Layers**: ELI5 → mechanism → context → quantitative → synthesis

## Extending

### Add more topics
The LLM generates layers on-demand for any topic. No data needed — just ask.

### Custom layer labels
Edit `LAYER_BRIEF` in `lib/prompts.ts` to adjust the per-layer instructions.

### Eye-tracking (future)
The `Reader` component could integrate MediaDevices API + face detection to track dwell time and build private heatmaps. For v1, this is skipped to focus on writing and layout.

### Persistence to database
Currently uses localStorage. To save journeys across devices, add Supabase or similar — store `Journey` objects with user sign-up.

### Voice narration
Integrate a TTS API (e.g., OpenAI's `tts-1-hd`) to read paragraphs aloud as they appear.

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19** + TypeScript
- **Tailwind CSS v4** (new CSS layer syntax)
- **Framer Motion** (`motion/react`) for text animation
- **Zustand** for state + localStorage middleware
- **Anthropic SDK** | **OpenAI SDK** (swappable)

## MVP Criterion

A new user learns *Rockets* (or similar arbitrary topic) in one sitting, on one page, and thinks:

> That was calm. Beautiful. And I actually understand more than when I started.

---

*The whole point: simplify first, deepen with intention, repeat the topic at rising fidelity, and earn the next layer with questions.*
