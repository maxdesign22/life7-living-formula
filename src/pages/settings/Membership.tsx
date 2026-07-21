/**
 * Zone D — Membership (settings.md): the two tiers, presented with premium
 * restraint and no sales pressure.
 * D1 LIFE7 Core — ivory card, champagne border, the 7 inclusions, status
 *    chip, Manage-renewal popover with invoice history + confirm cancel.
 * D2 LIFE7 Boost — the app's only dark forest-glass card with drifting gold
 *    dust, 7 target chips, and the working "Enable Boost demo" toggle.
 */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Life7Mark, MagneticButton, useToast } from '@/components/life7'
import { EASE_GLIDE, SectionHeader } from '@/pages/planner/ui'

const CORE_INCLUSIONS = [
  'Seven-day intelligent nutrition system',
  'Meal calculator & LIFE7 Score',
  'Shopping planner',
  'Digital pantry',
  'Reminders & planner',
  'Weekly optimisation',
  'AI meal suggestions',
] as const

const BOOST_TARGETS = ['Muscle gain', 'Fat loss', 'Athletic performance', 'Mental focus', 'Sleep', 'Recovery', 'Custom targets'] as const

const INVOICES = [
  { date: '12 Jan 2025', amount: '€500.00', label: 'LIFE7 Core · year 2' },
  { date: '12 Jan 2024', amount: '€500.00', label: 'LIFE7 Core · year 1' },
] as const

/* --------------------------------------------------------------- Core card */

function CoreCard() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.25 })
  const { toast } = useToast()
  const [manageOpen, setManageOpen] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  return (
    <div ref={ref} className="relative overflow-hidden rounded-r-lg border-[1.5px] border-champagne bg-soft-white p-6 shadow-e-1">
      {/* soft gold corner bloom */}
      <span
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(247,223,167,0.55), transparent 70%)' }}
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Life7Mark size={36} />
          <div>
            <h3 className="t-display-sm text-ink">LIFE7 Core</h3>
            <span className="t-label text-[9px] text-gold-deep">Current plan</span>
          </div>
        </div>
        <div className="text-right">
          <p className="t-metric-lg text-[26px] text-ink">€500 <span className="t-ui-sm font-medium text-ink-faint">/ year</span></p>
          <p className="t-ui-sm font-medium text-ink-faint">≈ €1.37 per day</p>
        </div>
      </div>

      <ul className="relative mt-5 space-y-2">
        {CORE_INCLUSIONS.map((item, i) => (
          <motion.li
            key={item}
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, x: -10 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.15 + i * 0.05, duration: 0.35, ease: EASE_GLIDE }}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-mist">
              <Check size={11} strokeWidth={2.5} className="text-green" />
            </span>
            <span className="t-ui-sm font-medium text-ink">{item}</span>
          </motion.li>
        ))}
      </ul>

      <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
        <span className={cn('t-label rounded-r-pill px-3 py-1.5', cancelled ? 'bg-cream text-ink-soft' : 'bg-sage-mist text-forest')}>
          {cancelled ? 'Active · ends 12 Jan' : 'Active · renews 12 Jan'}
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setManageOpen((o) => !o)
              setConfirmCancel(false)
            }}
            className="t-ui-sm font-semibold text-forest underline-offset-4 decoration-champagne decoration-[1.5px] hover:underline"
          >
            Manage renewal
          </button>
          <AnimatePresence>
            {manageOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setManageOpen(false)} aria-hidden="true" />
                <motion.div
                  className="glass-strong absolute bottom-[calc(100%+10px)] right-0 z-40 w-[300px] rounded-r-lg p-4 shadow-e-3"
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.24, ease: EASE_GLIDE }}
                >
                  <p className="t-label text-gold-deep">Renewal</p>
                  <p className="t-ui-sm mt-1.5 font-medium text-ink">
                    {cancelled ? 'Core stays active until 12 Jan 2026.' : 'Next renewal 12 Jan 2026 · €500.00'}
                  </p>
                  <p className="t-label mt-4 text-ink-faint">Invoice history</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {INVOICES.map((inv) => (
                      <li key={inv.date} className="t-ui-sm flex items-center justify-between text-ink">
                        <span>{inv.date} · {inv.label}</span>
                        <span className="tnum font-bold">{inv.amount}</span>
                      </li>
                    ))}
                  </ul>
                  {!cancelled && (
                    <div className="mt-4 border-t border-line pt-3">
                      {confirmCancel ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="t-ui-sm font-semibold text-burgundy underline-offset-2 hover:underline"
                            onClick={() => {
                              setCancelled(true)
                              setManageOpen(false)
                              toast('Renewal cancelled — Core stays active until 12 Jan.', { tone: 'sage' })
                            }}
                          >
                            Confirm cancel
                          </button>
                          <button
                            type="button"
                            className="t-ui-sm font-semibold text-ink-soft hover:text-ink"
                            onClick={() => setConfirmCancel(false)}
                          >
                            Keep plan
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="t-ui-sm font-semibold text-burgundy/80 underline-offset-2 hover:text-burgundy hover:underline"
                          onClick={() => setConfirmCancel(true)}
                        >
                          Cancel renewal
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- Boost card */

/** A few gold dust specks drifting slowly inside the forest card. */
function GoldDust() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-champagne"
          style={{
            width: 2 + (i % 2),
            height: 2 + (i % 2),
            left: `${14 + i * 17}%`,
            top: `${22 + ((i * 29) % 58)}%`,
          }}
          animate={{
            y: [-7, 9, -7],
            x: [0, i % 2 === 0 ? 5 : -5, 0],
            opacity: [0.1, 0.32, 0.1],
          }}
          transition={{ duration: 9 + i * 1.6, repeat: Infinity, ease: 'easeInOut', delay: i * 1.1 }}
        />
      ))}
    </div>
  )
}

/**
 * Soft diagonal sheen that sweeps across the card exactly once per trigger
 * bump (Boost enable / target pick) and then unmounts. The old implementation
 * reused the shared `animate-wave-sweep` keyframes, which end at
 * translateX(320%) with `animation-fill-mode: none` — so the moment the sweep
 * finished, the 90%-opacity beam snapped back to translateX(0) and parked
 * across the card forever. This one is a scoped CSS animation that ends
 * `forwards` fully off-card, unmounts on `animationend` (a timeout backs that
 * up), and peaks at 30% opacity — premium, never stuck. CSS (not JS) driven,
 * so it also plays under heavy rAF throttling.
 */
function GoldSheen({ trigger }: { trigger: number }) {
  const [done, setDone] = useState(0)
  useEffect(() => {
    if (trigger === 0 || trigger === done) return
    const t = window.setTimeout(() => setDone(trigger), 1700)
    return () => window.clearTimeout(t)
  }, [trigger, done])
  if (trigger === 0 || trigger === done) return null
  return (
    <>
      <style>{`@keyframes boost-sheen-sweep { from { transform: translateX(-170%); } to { transform: translateX(560%); } }
.boost-sheen { animation: boost-sheen-sweep 1.5s cubic-bezier(0.45, 0, 0.25, 1) 1 forwards; }`}</style>
      <span
        key={trigger}
        className="boost-sheen pointer-events-none absolute -inset-y-8 left-0 z-10 w-[30%]"
        onAnimationEnd={() => setDone(trigger)}
        aria-hidden="true"
      >
        <span
          className="block h-full w-full -skew-x-12"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(247,223,167,0.12) 28%, rgba(247,223,167,0.3) 50%, rgba(247,223,167,0.12) 72%, transparent)',
          }}
        />
      </span>
    </>
  )
}

function BoostCard({
  demoOn,
  setDemoOn,
  target,
  setTarget,
}: {
  demoOn: boolean
  setDemoOn: (v: boolean) => void
  target: string | null
  setTarget: (t: string | null) => void
}) {
  const { toast } = useToast()
  const [wave, setWave] = useState(0)

  const enable = () => {
    setDemoOn(true)
    setWave((n) => n + 1)
    toast('Boost demo active — pick an ambition below.', { tone: 'gold' })
  }
  const restore = () => {
    setDemoOn(false)
    setTarget(null)
    toast('Back to Core — your base formula continues.', { tone: 'sage' })
  }
  const pick = (t: string) => {
    if (!demoOn) return
    setTarget(t)
    setWave((n) => n + 1)
    if (t === 'Muscle gain') toast('Boost demo active — protein target +25 g on training days', { tone: 'gold' })
    else toast(`Boost demo active — ${t.toLowerCase()} targets tuned from tomorrow.`, { tone: 'gold' })
  }

  return (
    <div className="forest-glass relative overflow-hidden rounded-r-lg p-6 shadow-e-2">
      {/* faint champagne edge glow: a hairline of light along the top edge
          plus a soft aura bleeding down from it — static, no animation */}
      <span
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-champagne/40 to-transparent"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute -top-24 left-1/2 h-36 w-[115%] -translate-x-1/2 rounded-full bg-champagne/[0.07] blur-2xl"
        aria-hidden="true"
      />
      <GoldDust />
      {/* one soft diagonal sheen per enable / selection — sweeps and unmounts */}
      <GoldSheen trigger={wave} />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <h3 className="t-display-sm text-soft-white">LIFE7 Boost</h3>
          <p className="t-serif-quote mt-1 text-[15px] text-soft-white/75">Advanced optimisation for specific ambitions.</p>
        </div>
        <span className="t-metric-sm tnum whitespace-nowrap text-champagne">+€240 <span className="t-ui-sm font-medium text-soft-white/60">/ year</span></span>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-2">
        {BOOST_TARGETS.map((t) => {
          const selected = target === t
          return (
            <button
              key={t}
              type="button"
              onClick={() => pick(t)}
              disabled={!demoOn}
              className={cn(
                't-ui-sm rounded-r-md border px-3 py-2 text-left font-semibold transition-all duration-200',
                selected
                  ? 'border-champagne bg-champagne/20 text-champagne shadow-[0_0_0_1px_rgba(217,178,106,0.5)]'
                  : 'border-soft-white/15 bg-soft-white/5 text-soft-white/80',
                demoOn ? 'hover:border-champagne/60 hover:text-champagne' : 'cursor-default opacity-70',
              )}
            >
              {t}
            </button>
          )
        })}
      </div>

      <div className="relative mt-5 flex items-center gap-3">
        {demoOn ? (
          <>
            <span className="t-label rounded-r-pill bg-champagne/15 px-3 py-1.5 text-champagne">
              Demo active{target ? ` · ${target}` : ''}
            </span>
            <button
              type="button"
              onClick={restore}
              className="t-ui-sm font-semibold text-soft-white/70 underline-offset-4 decoration-champagne hover:text-soft-white hover:underline"
            >
              Restore
            </button>
          </>
        ) : (
          <MagneticButton variant="gold" size="sm" onClick={enable}>
            Enable Boost demo
          </MagneticButton>
        )}
      </div>

      <p className="t-ui-sm relative mt-5 font-medium text-soft-white/60">
        LIFE7 supports everyday nutrition decisions. It is not a medical service and does not replace professional care.
      </p>
    </div>
  )
}

export default function Membership({
  boostActive,
  setBoostActive,
  boostTarget,
  setBoostTarget,
}: {
  boostActive: boolean
  setBoostActive: (v: boolean) => void
  boostTarget: string | null
  setBoostTarget: (t: string | null) => void
}) {
  return (
    <section aria-label="Membership">
      <SectionHeader>Membership</SectionHeader>
      <div className="space-y-5">
        <CoreCard />
        <BoostCard demoOn={boostActive} setDemoOn={setBoostActive} target={boostTarget} setTarget={setBoostTarget} />
      </div>
    </section>
  )
}
