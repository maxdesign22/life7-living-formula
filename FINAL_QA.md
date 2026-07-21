# LIFE7 final submission QA

**Date:** 21 July 2026  
**Public URL:** https://life7.maxdesign.rs  
**Release:** `/var/www/life7/releases/20260721-final-submission`

## Passed

- Production TypeScript/Vite build.
- ESLint for the final Continuum implementation.
- `git diff --check`.
- Nginx configuration validation and reload.
- `nginx`, `life7-api` and `certbot.timer` active.
- Firewall active; public inbound ports limited to 22, 80 and 443.
- TLS certificate valid through 19 October 2026; automatic renewal active.
- API health: `ok: true`, `configured: true`, model `gpt-5.6-sol`.
- All 11 public product routes return HTTP 200.
- Desktop 1440 × 900: no horizontal overflow.
- Mobile 402 × 874: body/document width 402, no horizontal overflow,
  scroll reaches the exact end (`remaining: 0`).
- Live Meal Architect request resolves as `gpt-5.6-sol · LIFE7 verified`.
- Canonical transformation reaches 58 → 86 and exposes Undo.
- Voice demo phrase produces the spinach, expiry and preparation-time signals.
- A separate budget sentence selects the Budget scenario.
- Continuum Compose → four-system ledger → Apply completes.
- **Restart demo** restores the voice prompt, sleep scenario, Protected
  Constants, pending ledger and Compose action.

## Public-route check

`/today`, `/architect`, `/week`, `/continuum`, `/generator`, `/shopping`,
`/pantry`, `/planner`, `/coach`, `/progress`, `/settings`: **200**.

## Expected, non-blocking warnings

- The local machine uses Node 21.4.0; Vite recommends Node 20.19+ or 22.12+.
  The production build completes successfully. Upgrade the local runtime after
  submission rather than changing it immediately before recording.
- The main JavaScript bundle is above Vite's 500 kB advisory threshold. This is
  a performance optimisation task, not a functional failure; route-level code
  splitting belongs in the post-submission backlog.
- `caniuse-lite` is seven months old. Updating browser metadata is not required
  for the current compiled CSS and would introduce unnecessary lockfile churn.

## Honest test boundary

Responsive behaviour was verified at desktop and iPhone-class viewport sizes
in the controlled browser. The final presenter should still open the public URL
once in the exact Safari/Chrome device used for recording; no claim is made that
physical Mac, iPhone and Android hardware were automated from this Windows
workspace.
