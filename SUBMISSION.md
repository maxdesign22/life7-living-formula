# LIFE7 — OpenAI Build Week Submission Kit

## Devpost essentials

**Track:** Apps for Your Life

**Tagline:** Seven days. One intelligent system. Better living.

**One sentence:** LIFE7 is a seven-day decision engine that finds the smallest
connected set of food, schedule, pantry and shopping changes needed when life
shifts — without breaking what the user chose to protect.

**Live demo:** https://life7.maxdesign.rs

**Best judging routes:** https://life7.maxdesign.rs/architect (live GPT-5.6
proof) and https://life7.maxdesign.rs/continuum (flagship product idea)

## Description

Most nutrition apps ask people to log the past or generate another static plan.
LIFE7 helps them decide what to do next — and what else must move when reality
changes. It connects a meal architect, weekly plan, pantry freshness, shopping,
budget optimisation and schedule into one living formula.

The flagship Meal Architect begins with a real lunch scored at 58 across seven
dimensions. LIFE7's deterministic engine identifies the smallest useful
changes, verifies every quantity and recalculates the meal to 86. GPT-5.6 Sol
then ranks those approved changes and explains the best next move in context.
It cannot invent nutrition numbers or silently override restrictions, budget or
preparation limits. One action applies the changes and makes the verified
before/after transformation visible.

Continuum Shift then demonstrates the larger product idea. A short night, late
dinner, tighter budget or expiring ingredient becomes one input. LIFE7
recomposes the smallest connected set of decisions across Today, Week, Shopping
and Pantry while preserving explicit Protected Constants such as a protein
floor, budget ceiling, sleep window or family dinner. A Change Ledger explains
every downstream effect before the user accepts the reversible shift.

Voice Continuum makes that input feel native to real life: the user simply says
what changed, LIFE7 shows the transcript and extracted signals, then asks for
confirmation before composing anything. Audio is not stored, and a complete
text fallback keeps the flow available without microphone support.

The result is not a chatbot attached to a dashboard. It is a coherent consumer
product in which AI explains decisions, a domain engine remains the source of
truth, and adaptation stays visible and reversible.

## What was built with Codex and GPT-5.6 during Build Week

- Extended LIFE7 from a deterministic visual prototype into a deployed
  full-stack application with a real GPT-5.6 Sol analysis path.
- Designed a strict boundary: TypeScript computes; GPT-5.6 ranks and explains.
- Built a Node service using OpenAI's Responses API, Zod Structured Outputs,
  allow-listed recommendation IDs, request validation, timeouts, rate limiting,
  hashed safety identifiers and server-only secret handling.
- Connected live analysis to the Meal Architect with loading, success, stale
  response and graceful fallback states.
- Decluttered the dense statistics surface while preserving all seven
  dimensions and the 58 → 86 proof moment.
- Built Continuum Shift: four real-life change scenarios, user-controlled
  Protected Constants, an animated cross-system composition and a transparent
  before/after Change Ledger.
- Added Voice Continuum with browser speech recognition, visible signal
  extraction, a privacy disclosure and a permission-independent text fallback.
- Deployed the frontend and API to Hetzner using Nginx, HTTPS, systemd hardening
  and atomic releases.
- Used Codex to inspect the domain model, implement the API/UI boundary, run
  TypeScript and lint checks, diagnose deployment configuration, execute a real
  GPT-5.6 request and verify the public flow in a browser.

## How it maps to the judging criteria

### Technological implementation

- Real `gpt-5.6-sol` Responses API call with validated structured output.
- Deterministic nutrition, scoring, pantry, planning, shopping and budget logic.
- Model output is post-sanitised against engine-approved recommendation IDs.
- Secrets stay in a root-owned VPS environment file; the service binds only to
  localhost behind Nginx.
- Live deployment has rate limiting, no-store responses, health checks and
  graceful deterministic fallback.

### Design

- Eleven connected product screens share a coherent editorial visual system.
- The main interaction is a legible before/after decision, not an AI text dump.
- Motion communicates state: thinking, verified recommendation, apply and score
  improvement.
- Continuum turns a complex system response into one calm, reversible flow.

### Potential impact

- Audience: people who want to eat better without planning every meal from
  scratch or wasting food they already bought.
- LIFE7 combines health goals with constraints people actually face: pantry,
  expiry, cost and preparation time.
- The system turns recommendations into an immediately applicable meal and
  week, reducing the gap between advice and action.
- Protected Constants give people control over what optimisation is never
  allowed to sacrifice.

### Quality of the idea

- LIFE7 treats nutrition as a connected seven-day decision system, rather than
  a calorie diary, isolated recipe chatbot or static generated plan.
- Its differentiator is not a score alone. It combines verified intervention
  deltas with the smallest connected change set, Protected Constants and a
  reversible Change Ledger.
- Its technical trust boundary remains explicit: generative AI handles judgment
  and explanation while a transparent domain engine owns every number.

## Video script — 2:45 maximum

### 0:00–0:18 — Problem and promise

> Nutrition apps tell us what happened. LIFE7 helps decide what to do next —
> using your ingredients, goal, budget and time across one connected week.

Show the Today screen, point to the central **Shift** entry, then move directly
to Meal Architect.

### 0:18–0:55 — Establish the deterministic baseline

> This lunch scores 58 across seven dimensions. These calories, macros, cost
> and constraints come from LIFE7's deterministic TypeScript engine — not from
> a language model.

Point to the score, low fibre and protein, meal totals and three candidate
changes.

### 0:55–1:30 — The GPT-5.6 proof

Press **Analyze with GPT-5.6**.

> GPT-5.6 receives only these verified candidates. It ranks the smallest useful
> action and explains the trade-off. Strict structured output and an allow-list
> prevent it from inventing an ingredient, quantity, score or price.

Show the `gpt-5.6-sol · LIFE7 verified` badge, summary and rewritten rationale.

### 1:30–1:58 — Money moment

Press **Apply all**.

> One action changes the plate and the engine recomputes every dimension. The
> meal moves from 58 to 86. GPT explains; LIFE7 verifies.

Let the ring, cards, light wave and toast finish.

### 1:58–2:30 — Continuum Shift — the product moat

Open **Continuum Shift** and press **Try the winning demo phrase** (or say: “I
slept only five hours and still want to protect Friday training”). Point to the
transcript and the three extracted signals, then press **Compose the shift**.

> I do not edit four screens. I tell LIFE7 what changed. It protects the protein
> floor, budget, sleep window and family dinner, then reveals the smallest
> coordinated changes across Today, Week, Shopping and Pantry. Nothing important
> changes silently, and the entire shift is reversible.

Show the verified Change Ledger and apply the shift.

### 2:30–2:45 — Codex and closing

> Codex helped turn the product into a deployed full-stack system: it mapped the
> domain engine, built the secure GPT-5.6 boundary, integrated the live states,
> deployed to Hetzner and tested the public flow. Most apps optimise a meal or
> generate a plan. LIFE7 protects the week.

End on the applied Continuum Shift and the four connected systems.

## Judge testing instructions

1. Open https://life7.maxdesign.rs/architect — no account is required.
2. Confirm the starting meal score is 58.
3. Press **Analyze with GPT-5.6** and wait for the live verified panel.
4. Confirm the badge identifies `gpt-5.6-sol` and the recommendations remain
   limited to Greek yoghurt, broccoli and olive oil.
5. Press **Apply all** and confirm the score reaches 86.
6. Use Undo in the toast if you want to repeat the transformation.
7. Open https://life7.maxdesign.rs/continuum, choose any life change, press
   **Compose the shift**, inspect the four-system Change Ledger and apply it.
8. Optionally use **Try the winning demo phrase** to test Voice Continuum without
   granting microphone access.

The app remains usable if model access is temporarily unavailable: the
deterministic recommendations and calculations stay active.

## Submission checklist

- [ ] Register/join the hackathon on Devpost.
- [ ] Record the English demo with audio; keep the uploaded YouTube video under
      three minutes and publicly visible.
- [ ] Create the code repository and make it public, or share the private repo
      with `testing@devpost.com` and `build-week-event@openai.com`.
- [ ] Add the repository URL and YouTube URL to Devpost.
- [ ] Run `/feedback` in the primary Codex project task and add that Session ID.
- [ ] Submit before July 21, 2026 at 5:00 PM Pacific Time.
- [ ] Keep the live demo free and available through the judging period ending
      August 5, 2026.

## Honest scope disclosure

The Meal Architect uses the real GPT-5.6 Sol integration described above.
Continuum Shift is a deterministic interactive product prototype; its changes
are rule-verified demo scenarios, not model-generated or persisted. Voice
capture uses the browser speech-recognition capability when available; signal
matching is deterministic and audio is not stored by LIFE7. Coach,
week-generation narrative, scanning, messaging delivery and commerce remain
deterministic or simulated demo experiences. Nutrition guidance is
informational and not medical advice.
