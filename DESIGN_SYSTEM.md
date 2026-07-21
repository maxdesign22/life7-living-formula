# LIFE7 Living Formula — Design System

The single reference for how LIFE7 looks, moves and speaks. Source of truth:
`design.md` (§2–§9); implementation: `tailwind.config.js` + `src/index.css` +
`src/components/life7/`.

Design character: **Apple Health × Oura × Fable-style motion × luxury wellness
editorial × subtle futuristic control system.** Light theme only.

---

## 1. Principles

1. **Alive, never static.** Every viewport contains at least one visible,
   gentle idle animation (breathing light, drifting dust, a beating heart, an
   orbiting segment, a pulsing honeycomb). Hover is a bonus, never the only
   motion.
2. **Sunlit, not clinical.** Light is the primary material: warm ivory and
   glass surfaces, warm brown shadows (never grey-blue), champagne-gold
   highlights.
3. **Editorial restraint.** Few words, set beautifully. Serif display + quiet
   sans UI. No marketing noise inside the product.
4. **One connected system.** Seven days are visually bound — orbiting
   segments, honeycomb loops, flowing connectors. Nothing looks like a
   spreadsheet of separate plans.
5. **Decisions, not data.** Every number answers "what should I do next?"
   Every panel ends in an action.
6. **Premium calm.** No purple gradients, no neon, no gym aesthetics, no stock
   wellness iconography, no dark mode, no generic SaaS dashboard grids.

## 2. Colour

All tokens are Tailwind colours (`bg-ivory`, `text-ink-soft`, …) declared in
`tailwind.config.js`. shadcn HSL variables in `src/index.css` are re-tuned to
the same palette.

### Core palette

| Token | Hex | Usage |
|---|---|---|
| `ivory` | `#FAF6EC` | App background base |
| `cream` | `#F3EBDA` | Recessed surfaces, wells, timeline track |
| `soft-white` | `#FFFDF7` | Cards, elevated glass base |
| `sand` | `#E9DFC8` | Borders on cream, warm dividers |
| `champagne` | `#D9B26A` | Primary accent — gold highlights, active states, score mid-range |
| `gold-deep` | `#B08A3E` | Gold text on light, ring gradient start |
| `sunlight` | `#F2C14E` | Sun core, glows, warm highlights |
| `sunrise` | `#F7DFA7` | Soft gold fills, gradients |
| `sage` | `#C9D6C0` | Pale green surfaces, success-tinted chips |
| `sage-mist` | `#E4ECDD` | Lightest green fill (bars, tracks) |
| `green` | `#5C7A54` | Natural green — primary action, high score, freshness |
| `forest` | `#2E4630` | Deep green — primary button bg, heading accent, dark glass |
| `burgundy` | `#7E3B46` | Subtle accent ONLY — low scores, expiry alerts, quiet warnings. Never large fills. |
| `ink` | `#2B2620` | Primary text (warm charcoal) |
| `ink-soft` | `#6E6659` | Secondary text |
| `ink-faint` | `#A79C8A` | Tertiary text, placeholders |
| `line` | `rgba(46,70,48,0.10)` | Hairline borders on glass |

### Functional score scale

Used by `ScoreRing`, `MetricBar`, score chips and `scoreBand()` in
`src/lib/scoring.ts`.

| Range | Colour | Meaning |
|---|---|---|
| 0–40 | `burgundy` `#7E3B46` | Needs attention |
| 41–70 | `champagne` / `gold-deep` | Building |
| 71–100 | `green` `#5C7A54` | Thriving |

### Signature gradients (CSS classes in `src/index.css`)

| Name | Class | Definition |
|---|---|---|
| Sunlight field (ambient bg) | `.bg-sunlight-field` | `radial-gradient(60% 50% at 70% 10%, rgba(247,223,167,0.55), transparent 70%)` over `radial-gradient(50% 40% at 15% 85%, rgba(201,214,192,0.45), transparent 70%)` on `ivory` |
| Score ring stroke | `.bg-score-gradient` | Linear 135° `#B08A3E → #F2C14E → #5C7A54` (gold flows into green as the score rises) |
| Sun core | `.bg-sun-core` | Radial `#FFE9B8 → #F2C14E → #D9A84E` |
| Forest glass (dark panels: Boost card, coach core) | `.forest-glass` | Linear 160° `#2E4630 → #243A27` + 1 px `rgba(217,178,106,0.35)` inner border |
| Light wave (apply feedback) | `.bg-light-wave` | Linear 100° transparent → `rgba(255,233,184,0.9)` → transparent, 35 % width band |
| Metric bar fill | `.bg-metric-fill` | Linear 90° `#E4ECDD → #5C7A54` (sage-mist → green) |
| Sunrise gold (gold buttons) | `.bg-sunrise-gold` | Linear 135° `#F7DFA7 → #D9B26A` |

### Colour rules

- **Never** pure white `#FFFFFF` (use `soft-white`), **never** pure black,
  **never** cool greys.
- Burgundy appears in **≤ 5 % of any viewport** — thin rings, small dots,
  short labels.
- **Gold is the intelligence colour**: AI insights, recommendations, active
  nav, score deltas.
- Contrast ≥ 4.5:1 for all text; gold text only on `forest`, or `gold-deep` on
  `ivory` for large labels.

## 3. Typography

Fonts (Google Fonts, imported in `src/index.css`):

- **Fraunces** — display/editorial; weights 300–600, italics enabled;
  `font-variation-settings: "opsz" auto, "SOFT" 50, "WONK" 0` (applied to
  `.font-display`, `h1–h3`). Tailwind: `font-display`.
- **Manrope** — UI/data; weights 400–800. Tailwind: `font-sans`.
- **Numerals:** Manrope with `font-feature-settings: "tnum" 1` for all metrics
  (`.tnum`, built into `.t-metric-*`) — perfect column alignment in animated
  counters.

### Scale (implemented as `t-*` classes in `src/index.css`)

| Name | Class | Font | Size / LH | Weight | Tracking | Usage |
|---|---|---|---|---|---|---|
| `display-xl` | `.t-display-xl` | Fraunces | 64 / 1.02 | 400 | −0.02em | Score hero numerals (Fraunces 300 italic for the "/100" suffix) |
| `display-lg` | `.t-display-lg` | Fraunces | 44 / 1.08 | 400 | −0.015em | Screen titles ("Meal Architect") |
| `display-md` | `.t-display-md` | Fraunces | 32 / 1.15 | 500 | −0.01em | Section titles, drawer titles |
| `display-sm` | `.t-display-sm` | Fraunces | 24 / 1.2 | 500 | −0.005em | Card titles, meal names |
| `serif-quote` | `.t-serif-quote` | Fraunces Italic | 20 / 1.45 | 400 | 0 | AI insights, brand lines |
| `ui-lg` | `.t-ui-lg` | Manrope | 17 / 1.5 | 500 | 0 | Body emphasis |
| `ui-md` | `.t-ui-md` | Manrope | 15 / 1.5 | 500 | 0 | Default UI text |
| `ui-sm` | `.t-ui-sm` | Manrope | 13 / 1.45 | 600 | 0.01em | Dense labels, table rows |
| `label` | `.t-label` | Manrope | 11 / 1.3 | 700 | 0.14em | UPPERCASE eyebrow labels ("LIFE7 SCORE", "HYDRATION") |
| `metric-lg` | `.t-metric-lg` | Manrope (tnum) | 34 / 1.1 | 700 | −0.01em | Stat values |
| `metric-sm` | `.t-metric-sm` | Manrope (tnum) | 15 / 1.2 | 700 | 0 | Macro chips, prices |

### Typographic rules

- Screen titles are sentence case in Fraunces; eyebrow labels above them in
  `label` style, gold.
- **Italic Fraunces is reserved for intelligence** — AI insights, the tagline,
  "why it helps" text. The AI reads as an editorial voice, not a robot.
- Max line length 62 ch. Numbers never wrap.
- Kinetic typography: screen titles animate word-by-word on mount (55 ms
  stagger, masked rise); the first-load tagline animates
  character-by-character (34 ms/char).

## 4. Layout, spacing, shape

- **App grid:** left floating nav rail (248 px; icon rail 76 px below 1200 px;
  bottom dock below 900 px) + fluid content column, max 1440 px, padding
  40 px desktop / 24 px tablet / 16 px mobile.
- **Spacing scale:** 4, 8, 12, 16, 20, 24, 32, 40, 56, 80. Cards use 20–28 px
  internal padding.
- **Depth layering (back → front):** ivory base → sunlight gradient field →
  grain texture → botanical leaves (blurred) → dust particles (canvas) →
  content cards → floating nav → toasts/modals.

### Radii (Tailwind `rounded-r-*` — controlled, no bubble UI)

| Token | Value | Usage |
|---|---|---|
| `r-sm` | 10 px | Chips, small inputs |
| `r-md` | 16 px | Buttons, small cards |
| `r-lg` | 22 px | Standard cards/panels |
| `r-xl` | 28 px | Hero panels, drawers |
| `r-pill` | 999 px | Nav pills, segmented controls, tags |

Organic blob radii (`46% 54% 52% 48% / 48% 46% 54% 52%`, animated ±3 % over
12 s via `.blob`) are **reserved** for the sun core, the meal canvas plate and
ambient blobs only.

### Elevation (warm shadows, always brown-green tinted; Tailwind `shadow-e-*`)

| Token | Value | Usage |
|---|---|---|
| `e-1` | `0 1px 2px rgba(59,48,26,0.05), 0 4px 16px rgba(59,48,26,0.06)` | Resting cards |
| `e-2` | `0 2px 6px rgba(59,48,26,0.06), 0 18px 44px -12px rgba(59,48,26,0.16)` | Hover lift |
| `e-3` | `0 8px 24px rgba(46,70,48,0.10), 0 32px 80px -16px rgba(46,70,48,0.22)` | Floating nav, drawers |
| `gold-glow` | `0 0 0 1px rgba(217,178,106,0.5), 0 8px 30px -6px rgba(217,178,106,0.45)` | Hover on primary/AI elements |

### Glass

```css
.glass {
  background: rgba(255,253,247,0.66);
  backdrop-filter: blur(18px) saturate(1.15);
  border: 1px solid rgba(46,70,48,0.10);
}
```

Always provide a solid `soft-white` fallback (implemented via `@supports` in
`src/index.css`). `.glass-strong` (0.82 opacity, 22 px blur) is used for
sheets and tooltips.

## 5. Motion language

### Easings & durations

| Token | Value | Use |
|---|---|---|
| `ease-glide` | `cubic-bezier(0.22, 1, 0.36, 1)` (Tailwind `ease-glide`) | Entrances, layout moves, ring fills |
| `ease-soft` | `cubic-bezier(0.4, 0, 0.2, 1)` (Tailwind `ease-soft`) | Micro state changes |
| `ease-spring` | Framer spring `{ stiffness: 140, damping: 22 }` | Drags, magnetic buttons, chips |
| `ease-breathe` | sine in-out | Infinite ambient loops |
| `d-micro` | 180 ms | Hovers, toggles |
| `d-ui` | 380 ms | Cards, drawers, tabs |
| `d-reveal` | 650–900 ms | Hero entrances, score rings |
| `d-page` | 480 ms | Route transitions |
| `d-ambient` | 4–40 s | Breathing, orbits, drifts |

### The 12 signature animations

| # | Name | Spec |
|---|---|---|
| 1 | **Page transition (liquid fade)** | Outgoing: opacity 1→0, y 0→−14 px, 260 ms `ease-soft`. Incoming: opacity 0→1, y 18→0, blur 10→0 px, 480 ms `ease-glide`, inner sections stagger 70 ms. Implemented in `Layout.tsx`. |
| 2 | **Score ring fill** | `stroke-dashoffset` tween, 1.15 s `ease-glide`; numeral counts up in sync; on improvement the ring overshoots +2 then settles (spring) and a light wave sweeps the host panel. Implemented in `ScoreRing.tsx`. |
| 3 | **Count-up metrics** | 900 ms `ease-glide` from the previous value; intermediate values render with `tnum`. |
| 4 | **Nutrient bars** | Width tween 800 ms `ease-glide`, staggered 60 ms; fill `sage-mist → green`; over-target segment caps with a gold tick / `+N %` chip. Implemented in `MetricBar.tsx`. |
| 5 | **Breathing** | Scale 1↔1.025, 4.5 s `ease-breathe` infinite (`animate-breathe`); honeycomb cells stagger by index × 0.5 s so the colony breathes in a wave. |
| 6 | **Orbit** | Rotation 24 s / 36 s / 48 s linear infinite at 3 radii (`animate-orbit-24/36/48`); segments counter-rotate to stay upright. |
| 7 | **Heartbeat** | Core scale keyframes `1 → 1.09 (12 %) → 1 (24 %) → 1.05 (36 %) → 1 (48 %)`, 1.15 s loop (≈ 62 bpm, `animate-heartbeat`), plus expanding halo ring fading out (`animate-halo-ping`). |
| 8 | **Light wave sweep** | Gradient band translates −120 % → +120 % across a panel, 950 ms `ease-glide` (`animate-wave-sweep`), once per Apply event. |
| 9 | **Glide-in (recommendation applied)** | FLIP clone of the recommendation card flies from the intelligence panel into the meal canvas (Framer Motion `layoutId`), arc path with y-overshoot −24 px, 720 ms `ease-glide`, lands with soft scale 1.06→1. |
| 10 | **Magnetic buttons** | Cursor-attract translate up to 5 px within 48 px proximity (spring), gold glow bloom on hover, press scale 0.97. Implemented in `MagneticButton.tsx`. |
| 11 | **Kinetic title** | Words slide up 110 %→0 inside overflow-hidden masks, stagger 55 ms, 640 ms `ease-glide`. |
| 12 | **Shimmer thinking** | Three dots scale 0.6→1 staggered 160 ms loop + core halo pulse (AI Coach, 900–1400 ms deterministic per command). |

### Ambient Life System (persistent background)

`src/components/AmbientLife.tsx` — fixed, full-viewport, `pointer-events: none`:

1. **Sunlight field** — the two radial gradients drifting on a 120 %-sized
   layer (A: ±6 % over 26 s, B: ±5 % over 34 s; `.ambient-drift-a/b`).
2. **Dust particles** — Canvas 2D: 42 particles desktop / 18 mobile (1–2.5 px,
   gold → soft-white), upward-diagonal drift 4–9 px/s with sine wobble,
   twinkle over 3–7 s each. `requestAnimationFrame`, paused when the tab is
   hidden.
3. **Botanical leaves** — `botanical-sprig-1.svg` (bottom-left) and
   `botanical-sprig-2.svg` (top-right), `rgba(46,70,48,0.14)`, rotating ±2.2°
   over 11 s / 14 s with `blur(0.4px)`.
4. **Grain** — `texture-grain.png`, 220×220 tile, `mix-blend-mode: multiply`,
   opacity 0.05, static.
5. **Sun disc** — 520 px soft radial gold bloom top-right, opacity 0.35,
   breathing 1↔1.04 over 18 s.

Per-screen accents may add **one** extra living element (honeycomb pulse on
Week, orbit rings on Planner) — never more.

### The LIFE7 living mark

`src/components/life7/Life7Mark.tsx` (static export `public/life7-mark.svg`):

- **Sun disc** — 28 px radius, sun-core gradient, 30 % `feGaussianBlur` halo.
- **Seed-heart** — single continuous 1.8 px `soft-white` stroke: a heart whose
  bottom extends into a sprout curve.
- **Seven orbit segments** — 34° arcs with ~17.4° gaps across three concentric
  orbits (r = 40, 52, 64), 2.5 px rounded caps in `champagne`. Clockwise from
  top: **Nutrition · Hydration · Recovery · Movement · Stress · Focus · Joy**;
  segment 1 solid gold, the rest fade 85 %→55 %.
- **Idle:** whole mark breathes 4.5 s; heart beats ~62 bpm with halo; rings
  rotate 24 s / 36 s (reverse) / 48 s; one random segment glows to full gold
  for 1.2 s every 12 s.
- **States:** `rest` (default) · `thinking` (segments pulse sequentially
  200 ms apart, 2 loops) · `celebrate` (segments burst outward 8 px and spring
  back with a gold flash — score threshold crossings).
- **Sizes:** 36 px nav · 64 px panel headers · 180–220 px heroes. Radial
  `label` captions appear at hero size on hover (opacity 0→0.9, 300 ms,
  stagger 40 ms).

### Performance budget

- ≤ 10 simultaneously animating elements per viewport; ambient canvas
  particles capped at 42 (desktop) / 18 (mobile), paused when the tab is
  hidden.
- One heavy effect per screen (dust canvas OR orbiting logo field, never
  stacked with WebGL). No Three.js — ambient life is Canvas 2D + CSS; all
  shader-like looks have CSS fallbacks.
- **`prefers-reduced-motion`:** ambient loops, particles and magnetic pull
  disabled (global guard in `src/index.css` + `matchMedia` checks in
  `Layout.tsx` / `AmbientLife.tsx`); state changes render instantly.

### Cursor

System default; `cursor: pointer` on interactive elements. No custom cursor
graphic — primary CTAs use magnetic behaviour + glow instead.

## 6. Component patterns

Brand components live in `src/components/life7/` (barrel: `index.ts`).
shadcn/ui primitives in `src/components/ui/` provide a11y internals, fully
re-skinned to this system.

| Component | File | Spec & usage |
|---|---|---|
| `ScoreRing` | `ScoreRing.tsx` | SVG ring. Props: `value 0–100`, `size`, `strokeWidth`, `tone` (`auto` per score scale, or forced), `ghost` (dashed target ring, fades in on hover), `animated`, `driver`, center slot (node or render-prop receiving the animated count). Track `rgba(46,70,48,0.08)`; fill = score gradient, round caps; tick marks every 10 points (0.8 px, `ink-faint`). Fill animation #2 above. |
| `MetricBar` | `MetricBar.tsx` | Nutrient bar: `label` + value `metric-sm` row, 6 px `cream` track, `sage-mist → green` fill, gold target tick at `targetPct`, over-target `+N %` gold chip. `compact` hides the label row. |
| `GlassCard` | `GlassCard.tsx` | `r-lg` (or `size="xl"` → `r-xl`), glass bg, `e-1`; hover lift `translateY(-3px)` + `e-2` 220 ms (disable with `flat`); `glow="gold"` for AI/primary surfaces. |
| `MagneticButton` | `MagneticButton.tsx` | Variants `primary` (forest bg, soft-white text, gold hover glow) · `gold` (sunrise gradient, ink text) · `glass` · `ghost` (underline slide-in). Sizes `sm` 36 / `md` 44 / `lg` 52; `shape="pill"` for CTAs, `md` for inline. Magnetic pull #10, press 0.97, focus ring 2 px champagne offset 2 px. |
| `Chip` | `Chip.tsx` | Pill `ui-sm` 600, variants `sage` / `gold` / `burgundy-outline` / `glass`; selected state fills and lifts with spring. |
| `MealCard` | `MealCard.tsx` | Photo left (96 px, `r-md`, scales 1.04 on hover inside mask), Fraunces 20 px name, macro chips row (kcal/P/C/F, `metric-sm`), time + prep caption, status icon (`done` check / `NEXT` label). Entrance y 24→0, 560 ms `ease-glide`, stagger 80 ms via `delay`. |
| `Toast` + `ToastProvider` / `useToast` | `Toast.tsx` | Bottom-center glass pill, tone icon (`sage` / `gold` / `burgundy`), optional action; spring entrance, 4.2 s auto-dismiss with gold progress hairline; max 3 stacked. |
| `AILine` | `AILine.tsx` | The editorial AI voice: Fraunces italic preceded by a 6 px gold diamond rotating 45° on mount. |
| `EmptyState` | `EmptyState.tsx` | Botanical sprig watermark + Fraunces italic line + one `ghost` action. Never a blank box. |

Components specified in design.md §9 and composed per-screen from these +
shadcn primitives: `IngredientCard`, `FreshnessIndicator`,
`RecommendationCard` (gold left spine 3 px, serif "why", +delta chips, Δ score
in gold), `DayTypeBadge` (travel/rest/training/social line icons),
`Drawer` (right-side 460 px glass, `r-xl` left corners, slides 420 ms
`ease-glide`, scrim `rgba(43,38,32,0.18)` + 2 px blur), `SegmentedControl`
(cream pill track, `soft-white` thumb sliding with `layoutId` spring 380 ms),
`Slider` (4 px cream track, gold fill, 20 px thumb with champagne border,
value bubble while dragging), `Stepper` (28 px glass circles, sage ripple),
`Toggle` (44×26, `cream → sage` track), `Tooltip` (glass, 160 ms fade,
300 ms intent delay).

### App shell

- **Desktop rail** (`Navbar.tsx`): fixed left, 16 px inset, 248 px wide, glass,
  `r-xl`, `e-3`. Brand top (mark 36 px + "LIFE7" Fraunces 22 px + gold
  `LIVING FORMULA` caption); 40 px pill items with 20 px icons; active item
  gets `soft-white` bg + `e-1` + gold 6 px dot sliding via
  `layoutId="nav-dot"` (420 ms spring); badges — Shopping count pill (`9`),
  Pantry burgundy dot (expiry < 48 h), Coach gold pulse dot (new insight).
  Bottom: user chip (avatar 32 px, 1.5 px gold ring) + 7-dot week rhythm →
  `/week` + status footer "Week 24 · Day 4 of 7" with gold progress hairline.
  Collapses to a 76 px icon rail below 1200 px (labels become tooltips).
- **Mobile dock (< 900 px):** floating glass pill, 64 px, five slots — Today ·
  Architect · Week (center, elevated 14 px with the living mark + gold glow) ·
  Pantry · More (bottom sheet, 420 ms `ease-glide`, scrim
  `rgba(43,38,32,0.25)`).
- **Header (per screen):** kinetic title + one-line `serif-quote` caption
  left; contextual actions + the circular 40 px glass AI-activity button
  (mark in `thinking` state) right.

## 7. Iconography

- **Thin-line, 1.5 px stroke, round caps.** Base shapes from `lucide-react`
  rendered at `strokeWidth={1.5}`, 20 px in nav, 13–16 px inline.
- **8 custom SVG icons** where Lucide has no shape: honeycomb cell, orbit,
  seed-heart, sprig, sun-arc, basket, wave, bell-orbit — same 1.5 px language.
- Colour: `ink-soft` at rest → `forest` on hover → `gold-deep` when active.
- No filled emoji-style or stock wellness icons anywhere.

## 8. Visual rules (hard constraints)

1. Light theme only — **no dark mode**.
2. Never pure white, never pure black, never cool greys.
3. Burgundy ≤ 5 % of any viewport; large fills are forbidden.
4. Gold = intelligence; do not spend it on decoration.
5. No purple gradients, no neon, no glassmorphism-on-dark.
6. Organic blob radii are reserved for the sun core, the meal canvas plate and
   ambient blobs.
7. Every viewport keeps at least one gentle idle animation.
8. All drag interactions have click alternatives; focus is always visible
   (2 px champagne outline, offset 2 px); every named button performs a
   visible action — zero dead controls.
9. Score changes are announced via a live region ("Meal score improved to 86").

## 9. Voice & copy

Concise, confident, warm, precise. Short sentences. Numbers over adjectives.
No medical promises — never "guaranteed health", "cure", "diagnosis", "100 %".

Verbatim brand lines (use exactly):

- "Seven days. One intelligent system. Better living." — splash + Settings about
- "Your ingredients. Your goal. One better meal." — Meal Architect caption
- "LIFE7 does not just track food. It organises the decisions around it." — Generator intro
- "Less thinking. Better living." — Progress insight footer
- "Seven days are not seven separate plans. They are one connected system." — Week caption
- "Most apps tell you what you ate. LIFE7 tells you what is missing and what to do next." — Coach welcome
