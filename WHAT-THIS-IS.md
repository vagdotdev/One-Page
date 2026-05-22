# What This Is

**One Page** — *Learn anything. One page.


---

## Why This Exists

I am building this because I want to **understand things in a manageable way**.

So much of what we try to learn arrives already feeling **overwhelming**. Take rocket science: the phrase alone sounds enormous — like a field you could spend a lifetime in and still barely touch. Courses, textbooks, and Wikipedia dumps reinforce that feeling before you have even started. You are told there is a mountain; you have not yet been shown the path.

But when you actually look at the idea without the noise, it is often much simpler than the label suggests. Rockets, at the core, are not magic. You need **fuel**. You need a **body** that can hold it. You need something that **pushes the exhaust out** so the rocket goes the other way. That is the spine of the whole thing — and once that lands, everything else can attach to something you already hold in your head.

**One Page** exists to teach that way on purpose:

1. **Start with the simplest true version** — explain it so anyone can get the shape of it in one calm read.
2. **Add complexity only after you have shown you understand** — each step is a little more precise, a little more complete, never a wall of new jargon dumped at once.
3. **Stay on the same topic the whole time** — you are not jumping to a new lesson or a new URL. You are reading **the same subject again and again**, but each pass is the **same story with deeper detail**. That repetition is not redundancy; it is how understanding actually sticks. You recognize what you already learned; you refine it; you connect new pieces to old ones.
4. **Quiz yourself before you go deeper** — being asked questions is one of the strongest forms of retention. Reading feels productive; answering forces you to know. The quiz is not a gimmick — it is the gate that earns the next layer.

I believe this is a **really good way to learn**: simplify first, deepen with intention, repeat the whole topic at rising fidelity, and prove it with questions along the way. Not more content for its own sake — **better understanding, in smaller steps, on one beautiful page**.

That is why this project exists.

---

## What This Is

**One Page** is a minimalist, premium web experience for self-directed learning. There is no course catalog, no sidebar, no “Lesson 3 of 12.” There is only **one topic** and **one page** — centered on the screen, beautifully typeset, calm and intentional — that teaches you from the simplest possible explanation to real depth.

You type a topic (e.g. *Rockets*, *Quantum entanglement*, *Photosynthesis*, *World War II*). The page becomes a **living document**: it starts absurdly simple, you prove you understand it, and then the **same page** refines itself — the text evolves in place with subtle, satisfying motion. You never leave the page. You never hunt for the next link. You read one beautiful surface, and through it you can learn **anything**.

This is not a dashboard, not a learning platform with menus, and not a gamified app. It is closer to opening a single, exquisitely designed essay that **matures with you**.

---

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **One URL, one topic** | Radical focus. The constraint is the product. |
| **Start simple, then deepen** | Topics feel huge until you see the core; build from that spine outward. |
| **Top-down disclosure** | Start ELI5; add precision, mechanism, math, and edge cases only when earned. |
| **Learning through repetition** | Each layer covers **the same topic again**, with more detail — not a new article, but a richer version of what you already read. |
| **Active recall** | Quizzes gate depth. Being asked questions is how retention actually happens. |
| **The page evolves** | New layers **refine** prior text — they do not feel like a pile of separate lessons. |
| **Taste over features** | Generous whitespace, serif-led typography, restrained motion, direct writing. |
| **Respect attention** | No clutter, no dark patterns, no noise. |

**Core loop (conceptual)**

1. Enter topic → Layer 1 loads (ELI5).
2. Read the page → signal engagement (see [Engagement & v1](#engagement--v1-no-camera-required)).
3. Quiz (2–5 questions) → performance unlocks the next layer.
4. Text animates and deepens — **same topic, more detail** — repeat until synthesis / “expert” layer.
5. Optional: summary, export, understanding score, future heatmap.

---

## The Experience — How It Should *Feel*

This section is as important as the feature list. If the implementation misses this, the product misses its soul.

### One page, centered, magical

The entire experience lives inside **one visual column** — not full-bleed chaos, not a cramped card. Imagine a **single sheet of premium editorial design** floating in the middle of the viewport:

- **Centered** horizontally and vertically balanced (hero/input) or with a comfortable reading measure once content loads.
- **Generous margins** on all sides — the page breathes; the background is calm (soft off-white, deep charcoal, or similarly restrained — never busy).
- **No chrome** competing for attention: minimal UI, almost no chrome at all during reading.
- **Magical but quiet**: motion is subtle — crossfades, gentle morphs, line-by-line refinement — never flashy, never “startup demo” energy.

The user should feel: *I opened something rare. I am reading one beautiful thing. It is changing because I understood it.*

### Typography & “solid” taste

Typography carries most of the premium feel.

- **Serif-forward body** for the learning content — readable, literary, confident (e.g. a refined serif for paragraphs; a clean sans for UI labels, inputs, and quiz chrome if needed).
- **Display or accent face** sparingly for the title / topic / layer labels — editorial, not playful.
- **Large, comfortable type size** and line height — this is meant to be **read**, not skimmed in tiny blocks.
- **Short paragraphs**, clear hierarchy, occasional pull quotes or key lines — still one page, still one voice.
- **Dark / light mode** done properly: both should feel intentional, not inverted as an afterthought.

The site should feel **sophisticated, warm, and solid** — like a high-end essay or a beautiful book spread, not like a generic SaaS template or AI slop.

### Writing voice

Every layer must share the same voice:

- **Direct, clean, never condescending**
- **Analogies first**, then mechanisms, then precision
- **No filler**, no “In conclusion,” no corporate learning tone
- Layers should feel like the **same author** zooming in — not five different bots

Content quality is non-negotiable. Generic AI prose will break the magic. Plan for strong prompting, consistency checks across layers, and human polish on flagship topics at launch.

### Motion, text evolution & repetition

When a layer unlocks, the page does not hard-cut to a new article. The text **evolves**:

- Prior ideas remain recognizable but become **more accurate and defined**
- You encounter **the same topic again** — fuel, thrust, orbit — but now with the next level of truth attached
- New sections may appear; vague phrases become specific; analogies tighten into mechanisms
- Animation: smooth fade, staggered paragraph reveal, or controlled morph — **fast enough to feel responsive, slow enough to feel intentional**
- Diagrams / simple visuals (later): inline, elegant, not clipart

The metaphor: **the document is maturing with the learner** — and each pass is deliberate **repetition with depth**, not starting over from scratch.

---

## Detailed User Flow

### 1. Landing / topic input

- Centered input, quiet tagline: *Learn anything. One page. Deeply.*
- Gentle topic suggestions (e.g. Rockets, CRISPR, Supply and demand) — not a noisy grid.
- On submit, transition into the reading experience (no jarring route change if possible — same page, new state).

### 2. Layer 1 — ELI5

- Friendly, minimal explanation — what it is, why it matters, one vivid analogy.
- Example (rockets): tall tubes, fuel, fire pushes down so the rocket goes up.
- Whitespace, serif body, maybe a single subtle progress indicator (ring, thin bar, or “Layer 1 of 4”) — understated.

### 3. Engagement — “I’ve read this”

**Planned capabilities (full vision)**

- **v1 (simple & reliable):** User signals completion without gaze — see [Engagement & v1](#engagement--v1-no-camera-required).
- **v1.5 (optional):** Look at camera ~5 seconds to confirm attention (webcam + face presence). Good for personal experiments; not required for launch.
- **Later:** Real eye-tracking (e.g. WebGazer-class) → dwell time per paragraph → private heatmap (lingered = interest or confusion; skimmed = mastery or disengagement).

**Important:** Eye-tracking on the web is imprecise with consumer webcams; privacy concerns are real; mobile support is weak. Treat gaze as **enhancement**, never the only signal.

### 4. Quiz gate

- Appears inline or as a focused overlay — still feels part of the one page.
- **2–5 questions**: multiple choice, short answer, conceptual checks.
- Adaptive difficulty (stretch): harder misses → stay on layer; strong performance → unlock.
- Tone: calm, not exam anxiety.
- **Purpose:** force recall before the next pass — retention, not performance theater.

### 5. Progressive layers (2 → N)

Each unlock deepens the **same narrative thread** — the full topic again, with more detail:

| Typical progression | What gets added |
|---------------------|-----------------|
| Layer 2 | Mechanisms, parts, “how it actually works” |
| Layer 3 | Types, examples, history, real-world instances |
| Layer 4 | Quantitative framing, equations with plain-language meaning |
| Layer 5+ | Edge cases, limits, open questions, current research |

**Rockets example**

- **L1:** Tubes, fuel, thrust — shoot fire down, go up.
- **L2:** Newton’s third law; engines, tanks, payload.
- **L3:** Orbital mechanics intro; Falcon 9–class examples.
- **L4:** Delta-v, Tsiolkovsky equation, specific impulse, reusability.

### 6. Completion

- Final **synthesis**: key takeaways, mental model, optional mini mind-map.
- Optional **understanding score** or journey stats (minutes, layers cleared).
- **Export** (later): Markdown / PDF of the journey.
- **Heatmap reward** (later): “Where you spent time on this page.”

---

## Engagement & v1: No Camera Required

> **Note for first version:** We can **skip the camera entirely** for v1. The product should ship and feel complete without webcam permission.

**Recommended v1 signals (no camera)**

- Explicit **“Continue to quiz”** or **“I’ve read this”** control — honest, zero friction, no permission prompt.
- **Time on layer** (minimum read time before quiz unlocks — gentle, not punitive).
- **Scroll depth** (reached end of content).
- **Quiz performance** as the primary gate for the next layer.

**Why skip camera in v1**

- Avoids permission drop-off (“Allow camera” kills trust and conversion).
- Works on **phones and laptops** equally.
- Avoids bad lighting, glasses, multi-monitor, and inaccurate gaze libraries.
- Keeps focus on **writing, layout, and text evolution** — the real differentiators.

**When to add camera**

- Personal / experimental builds: 5-second “look at the lens” as a playful attention ritual.
- Later: opt-in gaze with clear copy — *“Build your private reading heatmap”* — plus strong fallbacks if denied.

---

## Key Features (Summary)

| Feature | Description |
|---------|-------------|
| **Single-page learning** | One topic, one surface, no navigation tree |
| **Progressive layers** | ELI5 → depth → expert; same page refines |
| **Repetition with depth** | Same topic revisited each layer with more detail — spaced understanding, not new silos |
| **Text evolution animation** | Premium in-place transitions (Framer Motion / GSAP-class) |
| **Quiz gating** | Active recall unlocks next layer; questions drive retention |
| **Engagement signals** | v1: time, scroll, button, quiz; later: camera / gaze |
| **Attention heatmap** | Future: per-paragraph dwell map for strengths & gaps |
| **Progress persistence** | localStorage first; optional accounts later |
| **Voice narration** | Optional high-quality TTS (stretch) |
| **Export** | Notes / full journey as Markdown or PDF (stretch) |

---

## Design Principles (Do Not Compromise)

1. **One beautiful column** — centered, editorial, calm background.
2. **Serif-led reading experience** — the page is meant to be *read*.
3. **Whitespace is structure** — not emptiness to fill with widgets.
4. **Motion serves comprehension** — guides the eye when text deepens; never distracts.
5. **No gamification cosplay** — no XP explosions, no casino UI; progress can be elegant and quiet.
6. **Coherent narrative across layers** — each layer is a **refinement**, not a replacement dump.
7. **Repetition is pedagogy** — return to the whole topic at higher fidelity every layer.
8. **Quiz quality = retention** — pretty text without good questions creates illusion of learning.

---

## Content & AI Pipeline

- **Structured generation per topic:** fixed layer outline (ELI5 → mechanisms → … → synthesis).
- **Shared style guide in prompts:** voice, sentence length, analogy rules, banned phrases.
- **Cross-layer consistency pass:** same terms, same metaphors, escalating precision — each layer must read as **the same story, deeper**.
- **Human edit** on showcase topics before public launch.
- **Knowledge tree (optional):** per subject, a small ontology so depth feels coherent (e.g. Rockets → physics → engineering → history).

---

## Risks & Anti-Patterns

| Risk | Mitigation |
|------|------------|
| Generic AI writing | Strong prompts + edit + small curated topic set at first |
| Gimmicky eye-tracking | Opt-in later; hybrid signals; never block learning on gaze |
| Overwhelming depth | Cap layers; clear synthesis; pace via quizzes |
| Broken animations | Prototype transitions early; prefer fade/stagger over chaotic morph |
| Illusion of learning | Serious quizzes + final synthesis exercise |
| Platform creep | Resist sidebars, feeds, and social before core loop is perfect |
| Layers that feel unrelated | Enforce “same topic, more detail” in prompts and edits |

---

## Tech Stack (Recommended)

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router) + React + TypeScript |
| Styling | Tailwind CSS + restrained design tokens |
| Components | shadcn/ui or custom minimal primitives |
| Animation | Framer Motion (text evolution, layer transitions) |
| Content | LLM API with engineered layer prompts |
| State | Zustand or Jotai + localStorage |
| Webcam (later) | MediaDevices API + face presence / WebGazer-class |
| Hosting | Vercel |
| Backend (optional) | Supabase for accounts, saved journeys |

Build order that protects taste:

1. **UI shell** — centered page, serif typography, dark/light, static layer copy.
2. **Text evolution** — transitions between two hand-written layers.
3. **Quiz gate** — unlock layer 2 on success.
4. **Engagement (no camera)** — read time + continue button.
5. **Content pipeline** — generate layers + quizzes for arbitrary topics.
6. **Polish pass** — 5–10 real topics, obsess over timing and copy.
7. **Camera / gaze** — only when core loop already feels magical.

---

## MVP Definition (Version 1)

**In scope**

- Topic input → Layer 1 (ELI5) on centered, beautiful page
- **No camera** — continue when ready + light time/scroll guard
- Inline quiz → unlock Layer 2–4
- Text evolution animation between layers
- 3–4 layers + short synthesis
- localStorage for topic + layer progress
- Exceptional visual and typographic polish

**Out of scope for v1**

- Full eye-tracking and heatmaps
- User accounts (optional)
- Voice narration, export, social sharing
- Rich diagrams (Mermaid/D3 can wait)

**Success criterion**

A new user can learn *Rockets* (or similar) in one sitting, on one page, and say: *That felt calm, beautiful, and I actually understand more than when I started.*

---

## Future Extensions

- Opt-in **gaze heatmaps** and personal strength/weakness views
- **Spaced repetition** — return to a topic at last mastered layer
- **Shareable journeys** — “Rockets in 42 minutes, 4 layers”
- **Richer visuals** — Mermaid, D3, inline diagrams
- **Community or expert annotations** on popular topics
- **On-demand deeper dive** — ask for another analogy or sub-topic without leaving the page

---

## Reference: Example Layer Arc (Rockets)

**Layer 1 — ELI5**  
Rockets are tall tubes full of fuel. They push themselves up by shooting hot gas downward — like a fire hose pushing back on you.

**Layer 2 — Mechanism**  
Thrust from expelled mass; Newton’s third law; engines, propellant tanks, payload fairing.

**Layer 3 — Context & examples**  
Chemical vs ion; staging; LEO vs GEO; Falcon 9, Starship, historical arc.

**Layer 4 — Quantitative**  
Delta-v budgets; Tsiolkovsky rocket equation; specific impulse; reusability tradeoffs.

**Synthesis**  
One-paragraph mental model + 5 bullet takeaways + “what to read next.”

---

## Closing Intent

**One Page** is a **Personal Adaptive Learning Notebook** disguised as a single website: one topic, one serif-led surface in the middle of the screen, one voice that deepens as you prove you understand. The magic is not eye-tracking or AI for its own sake — it is the feeling that **the whole world of knowledge can fold into one immaculate page** that grows up with you.

You simplify first. You repeat the whole topic with more truth each time. You answer questions before you go deeper. That is the learning model — and it is why this exists.

Ship v1 without the camera. Make the page unbearably beautiful first. Everything else is amplification.

---

*Living spec — update as the product evolves.*
