# LIFE7 Living Formula

> **Seven days. One intelligent system. Better living.**

LIFE7 Living Formula is an intelligent seven-day nutrition system: your
ingredients, your goal, one connected week of meals, shopping, pantry and
reminders — scored, optimised and explained through a calm editorial interface.

**Live demo:** [life7.maxdesign.rs](https://life7.maxdesign.rs) · flagship flows:
[Meal Architect](https://life7.maxdesign.rs/architect) for the live GPT-5.6 proof and
[Continuum Shift](https://life7.maxdesign.rs/continuum) for the connected product idea.

The product combines a deterministic TypeScript nutrition engine with a real
server-side **GPT-5.6 Sol** analysis layer. LIFE7 computes nutrition, price,
constraints, seven score dimensions and the verified 58 → 86 outcome; GPT-5.6
ranks and explains only those engine-approved changes. The model cannot invent
ingredients, quantities, scores or prices, and the OpenAI key never reaches the
browser.

The remaining coach, generator and daily-insight experiences use deterministic
demo adapters so the full product story remains reproducible. They are clearly
identified in [What is mocked vs what is real](#what-is-mocked-vs-what-is-real).

**What this repository is not:** a production nutrition service. See
[What is mocked](#what-is-mocked-vs-what-is-real) and
[What should be replaced in production](#what-should-be-replaced-in-production).

## How I collaborated with Codex during Build Week

LIFE7 entered the submission period as a broad deterministic visual prototype.
During Build Week, I used Codex as an engineering and product collaborator to
turn that prototype into the deployed, testable full-stack experience in this
repository. The work added during the submission period is visible in the dated
commit history and includes:

- auditing the existing domain model and preserving the deterministic nutrition
  engine as the owner of scores, quantities, prices and recommendation deltas;
- designing and implementing the secure server-side GPT-5.6 Sol boundary with
  structured output, allow-listed recommendation IDs, validation, timeouts,
  rate limiting, `store: false` and graceful deterministic fallback;
- integrating the live Meal Architect states and verifying the canonical 58 →
  86 transformation against a real public GPT request;
- creating Continuum Shift, Protected Constants, the reversible Change Ledger
  and Voice Continuum as the differentiated product direction;
- diagnosing and fixing mobile overflow, incomplete scrolling, overlapping
  planner cards, dense statistics and low-contrast states across the product;
- deploying the frontend and API to Hetzner with HTTPS, Nginx, systemd, health
  checks and atomic releases, then running public desktop and mobile QA.

Codex accelerated repository inspection, implementation, refactoring, server
diagnosis, deployment scripting and repeatable browser verification. I retained
the key product and design decisions: the calm premium editorial direction,
the choice to keep generative AI away from numeric truth, the smallest-useful-
change interaction, user-controlled Protected Constants, the honest prototype
boundary and the decision to use voice as an input to the LIFE7 system rather
than as a generic chatbot. GPT-5.6 ranks and explains verified interventions;
it does not calculate or silently change the plan.

Companion docs:

| File | Contents |
|---|---|
| [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | Colour, typography, spacing, motion, components, iconography, visual rules. |
| [`CODEX_HANDOFF.md`](./CODEX_HANDOFF.md) | Architecture, integration points (formula engine, GPT-5.6), API boundaries, test & deployment plans. |
| [`SUBMISSION.md`](./SUBMISSION.md) | Devpost-ready copy, judging evidence, test instructions and the sub-three-minute video script. |
| [`DEMO_RUNBOOK.md`](./DEMO_RUNBOOK.md) | Deterministic recording checklist, exact 2:42 narration and live-demo recovery paths. |
| [`FINAL_QA.md`](./FINAL_QA.md) | Final public-route, GPT, responsive, server, TLS and demo-repeatability evidence. |

Source is public for Build Week evaluation under the repository's
[all-rights-reserved notice](./LICENSE); third-party dependencies retain their
own licenses.

---

## Project structure

```
.
├── index.html                  # Entry; fonts preconnect; life7-mark.svg favicon
├── tailwind.config.js          # LIFE7 palette, radii, elevations, easings, keyframes
├── server/                     # Private Node API: GPT-5.6 Responses API + Zod contract
├── deploy/                     # systemd, Nginx and atomic VPS deployment configuration
├── src/
│   ├── main.tsx                # createRoot + BrowserRouter
│   ├── App.tsx                 # Routes: splash gate (sessionStorage) + 11 screens under Layout
│   ├── index.css               # Google Fonts import, shadcn vars re-tuned to LIFE7 palette,
│   │                           #   t-* typography classes, .glass/.forest-glass, gradients,
│   │                           #   ambient keyframes, prefers-reduced-motion guard
│   ├── lib/                    # ★ BUSINESS LOGIC — pure, deterministic, React-free TS
│   │   ├── nutrition.ts        #   Per-100 g macro math, price math (weight/piece/volume/dry),
│   │   │                       #   meal/day totals, Mifflin–St Jeor BMR, TDEE
│   │   ├── scoring.ts          #   scoreMeal()/scoreDay(), 7-dimension model, 11 goal profiles,
│   │   │                       #   58→86 calibration anchors + verifyDemoAnchors()
│   │   ├── planning.ts         #   Week assembly, day-type modifiers, regenerate/lock day,
│   │   │                       #   optimiseWeek(), meal moves (all immutable transforms)
│   │   ├── recommendations.ts  #   Rule engine → scored recommendation cards (meal + day level)
│   │   ├── pantry.ts           #   Demo pantry, freshness decay curve, expiry queue,
│   │   │                       #   planned usage, waste score (canonical 86)
│   │   ├── shopping.ts         #   List building (plan − pantry), store grouping, substitutions,
│   │   │                       #   budget optimisation (€62.40 → €57.80), text export
│   │   ├── reminders.ts        #   Thursday timeline, channel routing, quiet hours,
│   │   │                       #   notification composer (verbatim §10 copy)
│   │   ├── aiService.ts        #   AIService interface + MockAIService + getAIService() factory
│   │   └── utils.ts            #   cn() (clsx + tailwind-merge)
│   ├── data/                   # ★ DEMO DATASET — deterministic, local (design.md §11)
│   │   ├── profile.ts          #   Alex (36 · 182 cm · 84 kg · Healthy & Strong), daily targets,
│   │   │                       #   DEMO_NOW = Thursday 12 June, Week 24, 14:20
│   │   ├── ingredients.ts      #   21 ingredients: 11 owned, 6 discover, 4 spices/drinks;
│   │   │                       #   per-100 g macros, microIndex, price models, stores, shelf life
│   │   ├── demoWeek.ts         #   Week 24: 7 days × 4 meals, canonical scores Mon 82 … Sun 84,
│   │   │                       #   avg 79 · €62.40 · 22 min prep
│   │   ├── recommendationRules.ts # 6 meal rules + 5 day rules (verbatim card copy, Δ estimates)
│   │   ├── notifications.ts    #   The 4 demo notifications (verbatim, do not reword)
│   │   └── coachScripts.ts     #   8 coach command scripts + fallback + welcome + dinner alternates
│   ├── components/
│   │   ├── Layout.tsx          #   App shell: AmbientLife + Navbar + Lenis scroll + liquid-fade routes
│   │   ├── AmbientLife.tsx     #   Persistent living background (sunlight field, grain, sprigs,
│   │   │                       #   Canvas-2D dust 42/18, breathing sun disc)
│   │   ├── Navbar.tsx          #   Floating glass rail 248px → icon rail <1200px → bottom dock <900px
│   │   ├── Footer.tsx          #   Rail status: "Week 24 · Day 4 of 7" + gold progress hairline
│   │   ├── life7/              #   Brand components (design.md §9): Life7Mark, ScoreRing, MetricBar,
│   │   │                       #   GlassCard, MagneticButton, Chip, MealCard, Toast, AILine, EmptyState
│   │   └── ui/                 #   shadcn/ui primitives (Radix), re-skinned to the warm palette
│   ├── hooks/
│   │   └── use-mobile.ts       #   Viewport breakpoint hook
│   └── pages/
│       ├── Splash.tsx          #   First-run: mark assembles + tagline typewriter → /today
│       ├── Today.tsx           #   Daily command center (living score hero, next meal, insight)
│       ├── Architect.tsx       #   /architect — Meal Architect (flagship; 3-zone score laboratory)
│       ├── Week.tsx            #   /week — LIFE7 Week honeycomb
│       ├── Continuum.tsx       #   /continuum — cross-system adaptive Shift + protected constants
│       ├── Generator.tsx       #   /generator — AI Week Generator intake wizard
│       ├── Shopping.tsx        #   /shopping — store-grouped shopping command center
│       ├── Pantry.tsx          #   /pantry — living freshness inventory
│       ├── Planner.tsx         #   /planner — sunlight orbit timeline + reminders
│       ├── Coach.tsx           #   /coach — AI Coach conversation space
│       ├── Progress.tsx        #   /progress — editorial animated analytics
│       ├── Settings.tsx        #   /settings — profile, membership tiers, data
│       └── Stub.tsx            #   Shared placeholder used while screens are assembled
└── public/                     # 29 brand assets: life7-mark.svg, 2 botanical sprigs, grain texture,
                                #   avatar-alex.png, 6 meal photos (1200×900), 17 ingredient
                                #   illustrations (400×400), empty-plate.png
```

Architecture rule: **UI is thin, logic lives in `src/lib`.** Pages and
components never contain nutrition/scoring/planning math — they call lib
modules and render results. All lib modules are pure TypeScript (no React, no
I/O, no randomness), which is what makes the prototype deterministic and
testable.

## How to run

Requires **Node 20**.

```bash
npm install
npm run dev       # Vite dev server → http://localhost:3000
npm run build     # tsc -b && vite build → dist/
npm run preview   # serve the production build locally
npm run lint      # eslint
```

The product is fully navigable without the optional live model service. To run
the GPT-5.6 Meal Architect analysis locally, start the API in a second terminal:

```bash
cd server
npm ci
OPENAI_API_KEY="your-key" npm start   # macOS/Linux
```

PowerShell equivalent:

```powershell
cd server
$env:OPENAI_API_KEY="your-key"
npm start
```

The Vite development server proxies `/api` to `127.0.0.1:8787`. Never commit
the API key; production reads it from a protected systemd environment file.

First load shows the one-time splash (skippable on click); it is shown once per
session (`sessionStorage["life7-splash-seen"]`). `/` then redirects to `/today`.

## Design system (summary)

Full specification: **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)**. The five rules
that matter most:

1. **Light is the material.** Warm ivory surfaces, warm brown-green shadows,
   champagne-gold highlights. Never pure white, never pure black, never cool
   greys. Light theme only — no dark mode.
2. **Gold means intelligence.** Champagne/gold is reserved for AI insights,
   recommendations, active navigation and score deltas.
3. **Burgundy is rationed (≤ 5 % of any viewport).** Low scores, expiry alerts,
   quiet warnings only — thin rings and small dots, never large fills.
4. **Editorial type.** Fraunces (display serif, italic = the AI's editorial
   voice) + Manrope (UI/data, `tnum` for every metric).
5. **Alive, never static.** Every viewport has at least one gentle idle
   animation; hover is a bonus, never the only motion.

Tokens live in `tailwind.config.js` (colours, `r-*` radii, `e-*` shadows,
easings, keyframes) and `src/index.css` (`t-*` type classes, `.glass`,
signature gradients). The functional score scale: **0–40 burgundy** (needs
attention) · **41–70 champagne/gold** (building) · **71–100 green** (thriving).

## Animation system (summary)

- **Ambient Life System** (`src/components/AmbientLife.tsx`): fixed
  full-viewport background — drifting sunlight gradients, paper grain, two
  swaying botanical sprigs, a breathing sun disc, and 42 (desktop) / 18
  (mobile) Canvas-2D dust particles on `requestAnimationFrame`, paused when the
  tab is hidden.
- **The living mark** (`src/components/life7/Life7Mark.tsx`): breathing sun
  disc, seed-heart beating ≈ 62 bpm, seven orbit segments counter-rotating on
  three rings (24 s / 36 s / 48 s), a "thinking" shimmer every 12 s; states
  `rest` / `thinking` / `celebrate`.
- **Signature animations** (12, spec'd in design.md §5): liquid-fade page
  transitions, score-ring fill with synced count-up (+2 overshoot on
  improvement), count-up metrics, nutrient bars, breathing, orbits, heartbeat,
  light-wave sweep on Apply, FLIP glide-in of applied recommendations,
  magnetic buttons, kinetic titles, shimmer thinking dots.
- **Performance budget:** ≤ 10 simultaneously animating elements per viewport;
  one heavy effect per screen; particles capped and paused off-tab; Canvas 2D +
  CSS only (no WebGL/Three.js).
- **Reduced motion:** `prefers-reduced-motion` disables ambient loops,
  particles and magnetic pull; state changes render instantly (see the guard in
  `src/index.css` and the `matchMedia` checks in `Layout.tsx` /
  `AmbientLife.tsx`).

## Product walkthrough

Deterministic demo state: **Alex · Week 24 · Thursday (day 4 of 7) · 14:20**.
Every number below is computed live by the logic layer or shipped as canonical
demo data.

| # | Stop | Do | Show |
|---|---|---|---|
| 1 | **Splash** (`/`, first load) | Let it play (or click to skip) | LIFE7 mark assembles segment-by-segment, tagline types character-by-character: *"Seven days. One intelligent system. Better living."* |
| 2 | **Today** (`/today`) | Point at the hero; tap the hydration chip; press **Start cooking (18 min)**, then **Mark as eaten** | Living score hero (ScoreRing 300 px, value 74, ghost target 85), energy 72 % / hydration 1.4 of 2.4 L chips, cooking-mode overlay with step timers; marking lunch eaten sweeps a sage wave and nudges the ring 74 → 76. |
| 3 | **Meal Architect** (`/architect`) — the money moment | Press **Apply all** in the intelligence panel | Thursday Lunch starts at **58**; three recommendation cards (＋ Greek yoghurt 120 g, ＋ broccoli 80 g, − olive oil 8 g; Σ Δ +28); the ring tweens **58 → 86**, dimension bars re-render, a light wave sweeps the panel, toast offers undo. |
| 4 | **Continuum Shift** (`/continuum`) — the product moat | For the connected path, start in Pantry and press **Scan item → Add & coordinate the week**. Or use the winning voice phrase. Review Protected Constants, preview, then apply. | A scanned use-by signal or a spoken real-life change becomes the smallest coordinated decision set across Today, Week, Shopping and Pantry. The expiry path shows the verified **58 → 86 Meal Score**, removes a duplicate **€1.80** purchase only after approval, assigns the pack to dinner and supports immediate undo. |
| 5 | **LIFE7 Week** (`/week`) | Press **Optimise week** | Breathing honeycomb of seven days (Mon 82 · Tue 78 · Wed 74 · Thu 71 · Fri 86 · Sat 80 · Sun 84; avg 79 · €62.40 · 22 min). Optimise ticks **Thu 71→74, Wed 74→77, Sat 80→82**, toast *"Week rebalanced — protein evened across 7 days."* Undo available. |
| 6 | **AI Week Generator** (`/generator`) | Step through the intake wizard (defaults = Alex's profile) and generate | Four deterministic "thinking" lines → full 7-day plan with summary band: **week score 84 · €62.40 total (€7.60 under budget) · prep avg 22 min · pantry usage 71 %**, shopping preview, leftovers and expiry plan, Sunday 17:00 prep schedule (35 min saves 52). |
| 7 | **AI Coach** (`/coach`) | Click quick-command chips: **Make the week cheaper.**, **I missed lunch.**, **Use what expires first.** | Shimmer-thinking (900–1400 ms, deterministic per command), then scripted replies with cards and actions — e.g. *"I found €9.40 without touching your protein."* Free text pattern-matches the same 8 scripts; unmatched input gets the fallback. |
| 8 | **Shopping** (`/shopping`) | Press **Optimise budget** (header or optimiser card) | Store-grouped list — Supermarket €31.20 · Farmers market €12.60 · Pharmacy €8.40 · Online €10.20 — total **€62.40 / €70** with pantry already deducted (€8.20 saved). Optimise runs the 3-step swap script: total tweens **€62.40 → €57.80**. Export downloads a real `life7-week24-shopping.txt`. |
| 9 | **Pantry** (`/pantry`) | Toggle **Use soon**, then press **Scan item** and follow the connected handoff | 11 living freshness cards plus a simulated camera/label scan that recognises **spinach · 300 g · use by tomorrow**. The pack persists for the demo session, becomes a Continuum expiry signal and, after approval, appears as **520 g** assigned to Thursday dinner while Shopping falls **€62.40 → €60.60**. |
| 10 | **Planner** (`/planner`) | Drag a timeline event; toggle WhatsApp; press **Send test** | Thursday sunlight timeline (06:30 wake → 23:00 sleep), the four verbatim notifications (*"Your lunch is ready in 8 minutes."* …), quiet hours 22:30–06:30 (everything held except expiry alerts), WhatsApp/Telegram toggles return *"Coming with the mobile app — you're on the list."* |
| 11 | **Progress** (`/progress`) | Switch Week / Month / Quarter | Hand-built SVG analytics (no chart library): meal-score river (28 points), stat row (avg meal score 78 +6 · goal alignment 82 % · cooking 21 min −4 · waste 0.3 kg −38 %), declining waste bars. |
| 12 | **Settings** (`/settings`) | Open **LIFE7 Continuum** and reserve the founding preview; press **Export my data** | Transparent upgrade concept with indicative €29/month founding price, no checkout and no charge; export downloads a real `life7-alex-data.json`; import and reset-prototype round out the data zone. |

## What is mocked vs what is real

**Mocked (deterministic local stand-ins):**

| Feature | Where | Notes |
|---|---|---|
| AI insight, coach and week-generation narrative | `src/lib/aiService.ts` → `MockAIService` | Pattern-matched scripts; the generator still composes real planning/scoring/shopping modules. |
| Online grocery ordering | Shopping screen actions | Buttons produce toasts/state only; no store API. |
| Barcode scan / camera capture | Pantry → Scan item drawer | Camera/OCR input is simulated by a timed label recognition. Its output is real session state and drives Pantry, Continuum and Shopping. |
| WhatsApp / Telegram channels | `src/lib/reminders.ts` (`placeholder: true`) | Toggling returns the *"Coming with the mobile app"* toast. |
| Send-to-phone / push delivery | Planner notification stack | Rendered cards + `sendTest()` toast previews; nothing leaves the browser. |
| Subscription/payment | Settings → LIFE7 Continuum | Founding-preview reservation only; no checkout, card collection or payment. |
| Continuum Shift composition | `/continuum` | Deterministic, rule-verified scenarios rather than unrestricted model mutations. Approved demo state is session-persisted, visible across affected routes and reversible. |

**Real (actual computation, not theater):**

- Meal Architect live analysis through `server/index.mjs` and OpenAI's Responses
  API using `gpt-5.6-sol`, strict Zod structured output, request validation,
  per-client rate limiting and a privacy-preserving safety identifier.
- The model receives only deterministic candidate changes. Returned IDs are
  allow-listed and re-sanitised before they can affect presentation order or copy.
- All scoring math — the 7-dimension model in `src/lib/scoring.ts` reproduces
  the canonical 58 → 86 calibration exactly; `verifyDemoAnchors()` self-checks
  it at runtime.
- All nutrition, price, planning, recommendation, pantry-freshness, expiry,
  shopping-list and budget-optimisation math (`src/lib/*` over `src/data/*`).
- Connected local state — plan edits, day-type changes, locks, purchased items,
  pantry quantities and scanner/Continuum handoffs behave within the session;
  approved cross-system changes are carried by an explicit reversible ledger.
- File export — shopping list (`.txt`) and profile data (`.json`) are real
  downloads generated in-browser.

## What should be replaced in production

| Prototype piece | Production replacement |
|---|---|
| Mock coach/generator/insight narratives | Extend the deployed GPT-5.6 adapter beyond Meal Architect while retaining deterministic tools. |
| Static demo dataset (`src/data/*`) | Real nutrition database + per-user profile, plan and pantry persisted server-side. |
| `sessionStorage`/in-memory state | Auth (accounts) + durable persistence (API + DB). |
| Toast-only notification previews | Real push (APNs/FCM), email and messaging-channel delivery; keep quiet-hours routing logic. |
| Deterministic scoring curves | Server-side formula engine behind `/api/score` (keep `verifyDemoAnchors()` as the contract test). |
| Simulated scan | On-device barcode/vision scanning in the mobile app. |

## Handoff notes (continuing in VS Code with Codex)

Detailed engineering guidance lives in **[CODEX_HANDOFF.md](./CODEX_HANDOFF.md)**.
Working agreements for this codebase:

1. **Module-first development.** New behaviour starts as a pure function in the
   appropriate `src/lib` module (or a new one), with types exported. Only then
   wire it to UI.
2. **Thin-UI rule.** Components and pages render lib results and forward
   events. If you are writing math in a `.tsx` file, move it to `src/lib`.
3. **Determinism is a feature.** No `Math.random()` in logic modules, no wall
   clock reads — the demo clock is `DEMO_NOW` in `src/data/profile.ts`.
   (Ambient visuals may use randomness inside the canvas only.)
4. **Adding a screen:** create `src/pages/MyScreen.tsx`, add a `<Route>` in
   `src/App.tsx`, add a nav item in `src/components/Navbar.tsx` (both
   `NAV_ITEMS` and, for mobile, `MORE_ITEMS` if needed). Follow the shell
   pattern: kinetic `t-label` eyebrow + `t-display-lg` title + `t-serif-quote`
   caption, `GlassCard` content, staggered entrances.
5. **Adding an ingredient:** append to `INGREDIENTS` in
   `src/data/ingredients.ts` (id, per-100 g macros, `microIndex`, price model,
   store, shelf life, image, tags). Drop a 400×400 transparent illustration
   into `public/`. Everything downstream (scoring, shopping, pantry) picks it
   up automatically.
6. **Adding a recommendation rule:** append to `RECOMMENDATION_RULES` (meal
   level) or `DAY_RULES` (day level) in `src/data/recommendationRules.ts` —
   condition, candidates, verbatim `why` copy, affected dims, Δ estimate and a
   priority that respects existing ordering. The engine evaluates in priority
   order and caps results at 3.
7. **Verify the anchors after any logic change:** run `verifyDemoAnchors()`
   from `src/lib/scoring.ts` — base meal must score 58, improved meal 86.
   `npm run build` must stay green.
