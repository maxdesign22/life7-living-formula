# LIFE7 Living Formula — Engineering Handoff (Codex)

How to continue this codebase: architecture, what is real vs mocked, where the
production seams are, and the test/deployment plans. Read
[`README.md`](./README.md) first for product context and
[`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) before touching UI.

---

## 1. Architecture overview

**Stack:** React 19 · TypeScript 5.9 · Vite 7 · Tailwind CSS 3.4 (+ shadcn/ui
Radix primitives) · react-router-dom 7 · framer-motion (layout, drag, FLIP,
page transitions) · gsap (number tweens, ring fills, timelines) · lenis
(smooth inertial scroll on the content column only) · lucide-react (icons,
re-stroked to 1.5 px). No external data APIs. No chart library — Progress
charts are hand-built SVG. Node 20; dev server on port 3000.

**Layering (the rule that keeps this codebase sane):**

```
src/pages + src/components        THIN UI — render, animate, forward events
        │  calls
src/lib/*                         PURE TS — all business logic, deterministic,
        │  reads                  no React, no I/O, no randomness
src/data/*                        DEMO DATASET — typed, local, canonical
```

- **Thin UI over pure-TS lib modules.** Pages never compute nutrition,
  scores, prices or plans inline; they call `src/lib` and render results.
  Every lib transform is immutable (new objects out, inputs untouched).
- **Determinism.** The demo clock is fixed (`DEMO_NOW` = Thursday of Week 24,
  14:20, in `src/data/profile.ts`). Logic modules contain no `Math.random()`
  and no wall-clock reads; every "AI" latency and reply is scripted. This is
  what makes the demo reproducible and the logic unit-testable.
- **AI behind an interface.** `src/lib/aiService.ts` defines `AIService`;
  `MockAIService` is the only adapter today; `getAIService()` is the single
  factory the UI consumes. Swapping in a live model touches nothing else (§7).
- **State.** Local React state per screen; a `ToastProvider` at the root;
  splash gating via `sessionStorage`. No global store — the demo dataset is
  the source of truth and lib transforms derive everything else.

### The eight lib modules

| Module | Responsibility | Key exports |
|---|---|---|
| `nutrition.ts` | Per-100 g macro math, price math (weight / piece / volume / dry-goods conversion), meal & day totals, micro density, BMR (Mifflin–St Jeor) and TDEE | `mealTotals`, `dayTotals`, `priceForQuantity`, `macroSplit`, `mifflinStJeorBmr`, `estimateTdee` |
| `scoring.ts` | The 7-dimension score model (0–100), 11 goal profiles with per-goal weights, meal & day scoring, score bands, the 58/86 calibration anchors | `scoreMeal`, `scoreDay`, `rescoreMeal`, `verifyDemoAnchors`, `GOAL_PROFILES`, `compositeGoal`, `scoreBand` |
| `planning.ts` | Seven-day plan assembly, day-type modifiers (travel / rest / training / social / prep / normal), regenerate-day (3-state cycle), lock-day, optimise-week, meal moves | `assembleWeek`, `applyDayType`, `regenerateDay`, `lockDay`, `optimiseWeek`, `moveMeal` |
| `recommendations.ts` | Deterministic rule engine over `data/recommendationRules.ts` — meal-level (max 3 cards) and day-level rules, what-if re-scoring | `getRecommendations`, `applyRecommendations`, `estimateScoreAfter`, `getDayRecommendations` |
| `pantry.ts` | Pantry state, convex freshness decay curve, expiry queue (soonest + least-planned first), planned-usage mapping, waste reduction score | `createDemoPantry`, `freshnessAt`, `getExpiryQueue`, `expiringIngredientIds`, `wasteReductionScore`, `getWasteStats` |
| `shopping.ts` | List building (plan needs − pantry stock), store grouping & pricing, substitutions, budget alternatives, optimise-budget script, purchase state, text export | `buildShoppingList`, `getCanonicalShoppingList`, `optimiseBudget`, `markPurchased`, `exportListAsText` |
| `reminders.ts` | Thursday timeline events, reminder channel routing (incl. placeholders), quiet hours, notification composer, send-test | `buildThursdayTimeline`, `toggleChannel`, `routeNotification`, `sendTest`, `DEFAULT_CHANNELS` |
| `aiService.ts` | `AIService` interface + `MockAIService` deterministic adapter + `getAIService()` factory | `AIService`, `MockAIService`, `getAIService`, `DEFAULT_INTAKE` |

## 2. Screens

Target state per `design.md` §13 (routes already wired in `src/App.tsx`).
Build status at handoff: **Splash and Today are fully implemented; the other
eight screens render a branded stub (`src/pages/Stub.tsx`) while they are
assembled in parallel** — document against the target below, not the stub.

| Route | Screen | One-line capability |
|---|---|---|
| `/` → splash → `/today` | Splash | One-time living-mark assembly + typewriter tagline, skippable, dissolves into Today. |
| `/today` | Today | Daily command center: living score hero (74, ghost target 85), stat chips (energy 72 %, hydration 1.4/2.4 L), next-meal card with cooking mode, verbatim AI insight, week strip. |
| `/architect` | Meal Architect (flagship) | 3-zone laboratory: ingredient library → living meal canvas → intelligence panel; canonical 58 → 86 apply-all transformation with light wave and undo. |
| `/week` | LIFE7 Week | Breathing seven-day honeycomb (Mon 82 … Sun 84, avg 79); day-type marking, regenerate/lock, optimise-week (Thu 71→74 · Wed 74→77 · Sat 80→82). |
| `/continuum` | Continuum Shift | Four real-life change scenarios preserve explicit constraints, compose the smallest cross-system change set and expose a reversible Change Ledger. |
| `/generator` | AI Week Generator | Intake wizard (defaults = Alex) → deterministic thinking theater → full 7-day plan: score 84 · €62.40 · 22 min prep · 71 % pantry usage. |
| `/shopping` | Shopping | Store-grouped, pantry-deducted list (€62.40 / €70 across supermarket/market/pharmacy/online), swap popovers, optimise-budget €62.40 → €57.80, real .txt export. |
| `/pantry` | Pantry | 11 living freshness cards with decay rings and planned-usage chips, use-soon filter, expiry queue, waste score 86, scan placeholder drawer. |
| `/planner` | Planner | Sunlight orbit timeline (06:30–23:00) with drag-rescheduling, channel routing with quiet hours, the four verbatim notifications, send-test toasts. |
| `/coach` | AI Coach | Conversational space with breathing core: welcome + 8 quick-command scripts, free-text pattern matching, meal/savings/expiry cards, action endings. |
| `/progress` | Progress | Editorial hand-built SVG analytics: meal-score river, stat row (78 +6 · 82 % · 21 min −4 · 0.3 kg −38 %), waste & cost duet, Week/Month/Quarter. |
| `/settings` | Settings | Profile and preferences, LIFE7 Continuum founding-preview concept (€29/month indicative, no checkout), data export/import/reset. |

Navigation badges are live: Shopping shows the open-item count (`9`), Pantry
shows a burgundy dot while anything expires < 48 h (2 items in the demo:
spinach, bananas), Coach pulses gold on new insight.

## 3. Mocked features (with file pointers)

| Feature | Pointer | Mock behaviour |
|---|---|---|
| AI insight / coach / week generation | `src/lib/aiService.ts` (`MockAIService`), scripts in `src/data/coachScripts.ts` | Pattern-matched deterministic replies with scripted 900–1400 ms "thinking"; generator composes real lib modules. |
| Online grocery ordering | Shopping screen CTAs | Toast/state only; no store integration. |
| Barcode scan / camera | Pantry scan drawer | Laser-sweep theater; "detects Greek yoghurt 500 g" after 2.6 s. |
| WhatsApp / Telegram | `src/lib/reminders.ts` — `DEFAULT_CHANNELS` entries with `placeholder: true` | Toggle returns `PLACEHOLDER_TOAST` ("Coming with the mobile app — you're on the list."); never enables. |
| Push delivery / send-to-phone | `src/lib/reminders.ts` — `routeNotification`, `sendTest` | Renders routing outcomes and toast previews; nothing leaves the browser. |
| Subscription & payment | Settings Continuum preview | Local founding-preview reservation only; no checkout, card collection or payment. |
| Continuum Shift composition | `/continuum` | Deterministic, rule-verified demo scenarios; changes are not model-generated or persisted. |
| Real-time clock | `DEMO_NOW` in `src/data/profile.ts` | Fixed at Week 24, Thursday 14:20. |

Everything else is real computation: scoring, nutrition, price math, planning
transforms, recommendations, freshness/expiry, shopping totals, budget
optimisation, local state, and the two real file downloads (shopping `.txt`,
profile `.json`).

## 4. Next production tasks (prioritised)

1. **Persistence & auth.** Accounts (email/social), per-user profile / week /
   pantry / settings stored server-side; replace `sessionStorage` gating and
   the static `USER_PROFILE`.
2. **Remote AIService adapter** (§7) — insight, coach and generation served by
   GPT-5.6 behind the existing interface, with the lib modules as tools.
3. **Server-side formula engine** (§6) — move `scoring.ts` curves behind
   `/api/score`; keep the anchor contract.
4. **Real nutrition database** — replace `src/data/ingredients.ts` with a
   curated per-100 g DB (keep the `Ingredient` shape, price models and
   `microIndex` heuristic or a measured micronutrient profile).
5. **Notification delivery** — APNs/FCM push, email, WhatsApp/Telegram via the
   channel model in `reminders.ts`; port quiet-hours routing server-side.
6. **Mobile companion app** — scan/camera, send-to-phone, haptics; the
   prototype's placeholders define the contract.
7. **Commerce** — real grocery ordering hand-off per store; validate demand before implementing Continuum checkout.
8. **Accessibility & QA hardening** — live-region audits, contrast sweep,
   e2e suite (§8) wired into CI.

## 5. Recommended API boundaries

REST (or tRPC with the same shapes). Request/response types should reuse the
exported TypeScript interfaces from `src/lib` — they are already the domain
model.

| Endpoint | Method | Wraps | Payload notes |
|---|---|---|---|
| `/api/score/meal` | POST | `scoring.scoreMeal` | `{ items: MealItem[], mealType, goalId }` → `MealScore` (total, dims, raw, totals) |
| `/api/score/day` | POST | `scoring.scoreDay` | `{ meals: DayMealInput[], goalId }` → `DayScore` |
| `/api/plan/week` | GET / POST | `planning.assembleWeek`, `getDemoWeek` → per-user plan | GET current week; POST generate from intake (delegates to `/api/coach/generate-week` or lib composition) |
| `/api/plan/day-type` | POST | `planning.applyDayType` | `{ dayId, dayType }` → `{ week, summary }` |
| `/api/plan/regenerate` | POST | `planning.regenerateDay` | `{ dayId }` → `{ week, variant, scoreBefore, scoreAfter }` |
| `/api/plan/optimise` | POST | `planning.optimiseWeek` | `{ weekId }` → `OptimiseResult` |
| `/api/recommendations` | POST | `recommendations.getRecommendations` / `getDayRecommendations` | `{ items \| dayProgress, context }` → `Recommendation[]` |
| `/api/pantry` | GET / PATCH | `pantry.*` | GET state + summary; PATCH quantity add/adjust/remove |
| `/api/pantry/expiry` | GET | `pantry.getExpiryQueue`, `wasteReductionScore` | → `ExpiryEntry[]` + waste score |
| `/api/shopping/list` | POST | `shopping.buildShoppingList` | `{ weekId, budgetEur }` → `ShoppingList` (server deducts pantry) |
| `/api/shopping/optimise` | POST | `shopping.optimiseBudget` | → `BudgetOptimisation` (steps, before/after) |
| `/api/coach/message` | POST | `AIService.sendCoachMessage` | `{ text, context }` → `CoachReply` |
| `/api/coach/insight` | GET | `AIService.getDailyInsight` | → `DailyInsight` |
| `/api/coach/generate-week` | POST | `AIService.generateWeek` | `GeneratorIntake` → `GeneratedWeek` |
| `/api/reminders/route` | POST | `reminders.routeNotification` | `{ kind, atMinutes }` → delivery plan (server executes delivery) |

Conventions: ids (`ingredientId`, `dayId`, `mealId`) are stable strings from
the dataset; money is euros with 2-dp rounding server-side; scores are
integers 0–100; errors use `{ error: { code, message } }` with 4xx for domain
violations (e.g. unknown ingredient id mirrors `getIngredient`'s throw).

## 6. Formula engine integration point

**File:** `src/lib/scoring.ts`.

The score model is a set of clamped log-response curves `100·(x/T)^γ` (goal
alignment and the totals blend are affine maps), with constants solved so the
two canonical anchors reproduce exactly:

- base Thursday Lunch (chicken 140 g · rice 180 g · tomato 120 g · olive oil
  14 g) → **58**, dims (62, 22, 71, 34, 41, 66, 55)
- improved (+ Greek yoghurt 120 g · + broccoli 80 g · − olive oil 8 g) →
  **86**, dims (90, 48, 79, 58, 66, 84, 83)

All curve constants are isolated in the `CURVE` / `DAY_CURVE` objects; each
dimension is a small pure exported function (`proteinAdequacy`,
`fibreAdequacy`, `energyBalance`, `foodDiversity`, `micronutrientCoverage`,
`satietyPotential`, `goalAlignment`).

**To swap in a server-side formula engine:**

1. Keep the exported function signatures (`scoreMeal`, `scoreDay`,
   `rescoreMeal`) and the return types (`MealScore`, `DayScore`) stable — the
   UI and every other lib module depend only on these.
2. Introduce a `ScoreEngine` port (e.g. `interface ScoreEngine { scoreMeal(...): Promise<MealScore> }`)
   with two adapters: the current local curves and a remote client calling
   `/api/score/*`.
3. Ship the anchor vectors (`DEMO_ANCHOR_BASE`, `DEMO_ANCHOR_IMPROVED`,
   `EXPECTED_BASE_DIMS`, `EXPECTED_IMPROVED_DIMS`) to the server and run
   `verifyDemoAnchors()` equivalently in CI — **58/86 within ±1 is the
   contract**; any server model must reproduce it before deploy.
4. Goal profiles (`GOAL_PROFILES`, `compositeGoal`) stay client-shareable
   config — they are weights, not secrets.

## 7. GPT-5.6 integration point

**File:** `src/lib/aiService.ts`.

`AIService` is the complete contract the UI consumes:

```ts
interface AIService {
  getDailyInsight(): Promise<DailyInsight>;
  getCoachWelcome(): Promise<CoachReply>;
  sendCoachMessage(text: string, context?: CoachContext): Promise<CoachReply>;
  cycleQuickDinner(step: number): Promise<CoachReply>;
  generateWeek(intake: GeneratorIntake): Promise<GeneratedWeek>;
  getContextChips(): Promise<readonly string[]>;
}
```

**Replace** `MockAIService` with `RemoteAIService implements AIService` that
calls your GPT-5.6 endpoint; flip `getAIService()` to construct it. Nothing
else in the app changes.

Prompt/response contract notes:

- **Responses are structured, not prose.** Map GPT-5.6 JSON-mode output onto
  `CoachReply` (`text`, `cards: CoachCard[]`, `actions: CoachAction[]`,
  `thinkingMs`, `matched`). `CoachCard` is a closed union (meal-preview,
  replacement, goal-adjustment, week-insight, recalculation, savings,
  day-diff, expiry-plan) — validate with zod (already in deps) and fall back
  to the `COACH_FALLBACK` reply on schema failure.
- **Tools over tokens:** expose the lib modules as function tools
  (`score_meal`, `get_recommendations`, `optimise_budget`,
  `get_expiry_queue`, `apply_day_type`) so numbers always come from the
  deterministic engine, never from the model. The model composes and
  explains; the lib computes.
- **Voice:** system prompt carries the §10 copy rules — concise, warm,
  numbers over adjectives, no medical promises, every reply ends with
  actions. Italic editorial tone is rendered by the UI (`AILine`), not the
  model.
- **Context:** `getContextChips()` shows exactly what the coach sees (profile,
  week, pantry summary, targets) — send the same snapshot as the system
  context; keep the demo's four-chip shape.
- **Determinism for demos:** keep `MockAIService` behind an env flag
  (`VITE_AI_ADAPTER=mock|remote`) so sales demos never depend on network or
  model drift.
- **`generateWeek`** should remain a server composition of planning + scoring
  + shopping modules (as the mock does); use the model for intake
  normalisation and narrative only.

## 8. Test plan

**Unit tests (Vitest; all against `src/lib` — pure, so no mocks needed):**

| Suite | Assertions |
|---|---|
| `scoring` | **Anchor calibration:** `scoreMeal(DEMO_ANCHOR_BASE) === 58` and `scoreMeal(DEMO_ANCHOR_IMPROVED) === 86` (±1 per dim via `verifyDemoAnchors()`); goal-weight sums = 100; `compositeGoal('healthy','strong')` → `healthy-strong`; score bands 40/70 boundaries. |
| `nutrition` | Per-100 g scaling; price math for all four models (weight, piece, volume, dry rice 3:1); `macroSplit` sums ≈ 100; Mifflin–St Jeor for Alex → BMR 1802.5, TDEE ≈ 2794 → 2800 kcal target. |
| `recommendations` | Thursday Lunch yields exactly the 3 canonical cards in priority order (yoghurt +120, broccoli +80, oil −8) with ΣΔ +28; `estimateScoreAfter` → 86; day rules fire at the 60 %/40 %/110 % thresholds. |
| `planning` | `applyDayType` effects per type (travel converts 2 meals, training +30 g yoghurt…); `regenerateDay` cycles 0→1→2→0 and respects locks; `optimiseWeek` → Thu 74, Wed 77, Sat 82 with locked days skipped; immutability of inputs. |
| `pantry` | Freshness curve endpoints; expiry queue order (spinach first); `wasteReductionScore(createDemoPantry()) === 86`; `expiringIngredientIds` ≤ 48 h → spinach, banana. |
| `shopping` | Canonical list totals: €62.40/€70, subtotals 31.20/12.60/8.40/10.20, 18 items, pantry savings €8.20; `optimiseBudget` → €57.80 with 3 steps; `exportListAsText` snapshot. |
| `reminders` | Timeline has 12 events ordered by time; quiet hours hold all kinds except `expiry-move`; placeholder channels never enable; `sendTest` on disabled channel fails with the right toast. |
| `aiService` | Insight copy verbatim; each of the 8 commands matches its script; unknown text → fallback (`matched: false`); `generateWeek(DEFAULT_INTAKE)` → score 84, €62.40, 22 min, 71 % pantry usage. |

**Component smoke tests (Testing Library):** each page renders its title,
calls the expected lib entry points, and every named button triggers a visible
change (state, toast or drawer — the zero-dead-controls rule); `ScoreRing`
announces value changes via its live region.

**E2E (Playwright) — the demo flow as one spec:** splash → Today (hero 74;
mark lunch eaten → 76) → Architect (apply all → ring 86, undo → 58) → Week
(optimise → toast + new scores) → Generator (defaults → 84/€62.40/71 %) →
Coach ("Make the week cheaper." → €9.40 card) → Shopping (optimise → €57.80;
export downloads) → Pantry (use-soon filter → spinach leads; waste 86) →
Planner (WhatsApp toggle → placeholder toast) → Progress (78 stat visible) →
Settings (export JSON downloads). Run with `prefers-reduced-motion` both on
and off.

**CI gates:** `npm run build` (tsc is strict) + unit suites + the e2e spec on
PR; the 58/86 anchor test is a required check for any change touching
`src/lib` or `src/data`.

## 9. Deployment plan

**Prototype (now):** static hosting — `npm run build` emits `dist/` with
relative base (`vite.config.ts` sets `base: './'`), so any static host works
(Vercel / Netlify / S3 + CDN / GitHub Pages). No env vars required; fonts load
from Google Fonts CDN and all other assets are bundled in `public/`.
Recommended headers: long-cache immutable for hashed assets, short cache for
`index.html`.

**Env vars (when the remote adapter lands):**

| Var | Purpose |
|---|---|
| `VITE_AI_ADAPTER` | `mock` (default, fully offline) or `remote` |
| `VITE_API_BASE_URL` | Base URL for the `/api/*` boundaries in §5 |
| Server-side only | GPT-5.6 API key, nutrition DB credentials — never in the client bundle |

**Future full-stack notes:** the lib modules are isomorphic pure TS — lift
`src/lib` + `src/data` verbatim into the API service (or a shared package) so
client and server share one domain implementation. Add auth middleware,
per-user persistence (Postgres: profiles, weeks, pantry_items, plans,
notification_prefs), a job for push delivery honouring quiet hours, and keep
the static SPA as the client. Feature-flag the switch per screen: prototype
mode (local data) ↔ production mode (API data) should be a data-source swap,
not a rewrite — that is what the thin-UI rule buys.
