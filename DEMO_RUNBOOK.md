# LIFE7 final demo runbook

Use this as the exact recording and live-judging sequence. Target length:
**2:35–2:42**; never exceed 2:45.

## Before recording

1. Use a 1440 × 900 browser window at 100% zoom.
2. Close bookmarks, downloads and personal tabs.
3. Open these tabs in order:
   - `https://life7.maxdesign.rs/today`
   - `https://life7.maxdesign.rs/architect`
   - `https://life7.maxdesign.rs/continuum`
4. On Continuum, press **Restart demo**.
5. On Architect, refresh and confirm the score starts at 58.
6. Confirm `https://life7.maxdesign.rs/api/health` returns `ok: true` and
   `configured: true`.
7. Disable notifications and do not expose the OpenAI or server consoles.

The microphone is optional. The official recording should use **Try the
winning demo phrase** so the result is deterministic and does not depend on a
permission prompt or the browser speech service.

## Timed script

### 0:00–0:18 — The problem

**Screen:** Today.

> Nutrition apps tell us what happened or generate another static plan. LIFE7
> decides what to do next — across the food you own, your goals, budget, time
> and one connected week.

Pause briefly on the score and signals. Move directly to Meal Architect.

### 0:18–0:52 — Verified baseline

**Screen:** Meal Architect, score 58.

> This is Thursday lunch, scored by LIFE7's deterministic nutrition engine
> across seven dimensions. The engine owns every number. GPT-5.6 receives only
> the verified context and the allowed candidate changes.

Press **Analyze with GPT-5.6**. Let the live state resolve.

### 0:52–1:25 — Smallest useful intervention

Point to the three recommendations and projected score.

> GPT-5.6 ranks and explains the smallest useful intervention. It cannot invent
> ingredients, quantities, prices or scores, and it cannot override the budget,
> preparation limit or restrictions.

Press **Apply all**. Let 58 → 86 and the light wave finish.

### 1:25–1:38 — Transition to the moat

**Screen:** Continuum Shift.

> But a good meal is not the product moat. Real life changes, and seven separate
> plans break. Continuum treats the week as one decision system.

### 1:38–1:58 — Voice Continuum

Press **Try the winning demo phrase**. Point to the transcript and extracted
signals.

> I do not edit four screens. I tell LIFE7 what changed: the spinach expires
> tomorrow and I only have twenty minutes to cook. LIFE7 shows exactly what it
> heard before it composes anything. LIFE7 does not store the audio.

### 1:58–2:25 — Protected shift

Point to **Protected Constants**, then press **Compose the shift**. Let all four
ledger cards resolve.

> Protein, budget, preparation time and tonight's dinner are protected. LIFE7
> finds the smallest coordinated change across Today, Week, Shopping and Pantry. Every
> downstream effect is visible in the Change Ledger, and the whole shift remains
> reversible.

Press **Apply 4 coordinated changes**.

### 2:25–2:42 — Close

Hold on the applied state and four ledger cards.

> Codex helped turn LIFE7 into a deployed full-stack system: the domain engine,
> secure GPT-5.6 boundary, voice input, adaptive product flow, Hetzner deployment
> and public QA. Most apps optimise a meal or generate a plan. LIFE7 protects
> the week.

End. Do not continue into secondary screens.

## Live judge path

1. `/architect` → **Analyze with GPT-5.6** → **Apply all**.
2. `/continuum` → **Restart demo** → **Try the winning demo phrase**.
3. Confirm the extracted spinach/expiry/preparation-time signals.
4. **Compose the shift** → inspect Today, Week, Shopping and Pantry.
5. **Apply 4 coordinated changes**.

## Failure-safe narration

- **GPT request fails:** “The intelligence layer is temporarily unavailable;
  the verified engine and its recommendations remain fully active by design.”
- **Microphone is unavailable or denied:** use **Try the winning demo phrase**
  or type the sentence. Do not troubleshoot permissions during a demo.
- **A prior Continuum state is visible:** press **Restart demo**.
- **Network becomes slow:** the deterministic product remains interactive; do
  not refresh repeatedly.

## Submission truth boundary

- Meal Architect analysis uses the live GPT-5.6 Sol server integration.
- Nutrition, scoring, price and recommendation deltas are deterministic.
- Continuum scenarios and signal matching are deterministic prototypes.
- Browser speech recognition is used when available; LIFE7 does not store audio.
- Login, persistent user data, payments, messaging delivery, scanning and
  grocery ordering are not represented as production integrations.
