import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Life7Mark, useToast } from '@/components/life7'
import { EASE_GLIDE, SectionHeader } from '@/pages/planner/ui'

const LIFE_LOOP = [
  { step: 'Sense', detail: 'your rhythm' },
  { step: 'Interpret', detail: 'the change' },
  { step: 'Compose', detail: 'the next move' },
  { step: 'Adapt', detail: 'the seven days' },
] as const

const CONTINUUM_MOMENTS = [
  {
    time: '08:10',
    signal: 'A shorter night',
    response: 'Breakfast and training intensity rebalance together.',
  },
  {
    time: '14:20',
    signal: 'Energy begins to drift',
    response: 'Lunch feedback reshapes the afternoon, not next month.',
  },
  {
    time: '18:40',
    signal: 'Spinach expires tomorrow',
    response: 'Dinner, shopping and waste score resolve in one move.',
  },
] as const

const TARGETS = ['Steady energy', 'Strength', 'Longevity', 'Deep focus', 'Recovery', 'Simple living'] as const

function GoldDust() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <motion.span
          key={index}
          className="absolute h-1 w-1 rounded-full bg-champagne"
          style={{ left: `${12 + index * 19}%`, top: `${18 + ((index * 31) % 66)}%` }}
          animate={{ y: [-6, 8, -6], opacity: [0.08, 0.32, 0.08] }}
          transition={{ duration: 8 + index, repeat: Infinity, ease: 'easeInOut', delay: index * 0.9 }}
        />
      ))}
    </div>
  )
}

function PreviewDialog({
  open,
  onClose,
  selectedTarget,
  onSelectTarget,
  reserved,
  onReserve,
}: {
  open: boolean
  onClose: () => void
  selectedTarget: string | null
  onSelectTarget: (target: string) => void
  reserved: boolean
  onReserve: () => void
}) {
  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 min-[640px]:items-center min-[640px]:p-6">
          <motion.button
            type="button"
            aria-label="Close upgrade preview"
            className="absolute inset-0 bg-forest/55 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="continuum-preview-title"
            className="glass-strong relative z-10 max-h-[calc(100dvh-7rem)] w-full max-w-[760px] overflow-y-auto overscroll-contain rounded-r-xl border border-champagne/70 shadow-e-3"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.3, ease: EASE_GLIDE }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-soft-white/95 px-5 py-4 backdrop-blur-md min-[640px]:px-7">
              <div>
                <p className="t-label text-gold-deep">Founding preview · no charge</p>
                <h2 id="continuum-preview-title" className="t-display-sm mt-1 text-ink">Meet LIFE7 Continuum</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/70 text-ink-soft transition-colors hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-7 p-5 min-[640px]:p-7 min-[720px]:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="t-serif-quote text-[20px] leading-relaxed text-ink">
                  Most apps wait for you to manage them. Continuum notices when life moves, then quietly recomposes what comes next.
                </p>

                <div className="mt-6 space-y-3">
                  {CONTINUUM_MOMENTS.map((moment, index) => (
                    <motion.div
                      key={moment.time}
                      className="rounded-r-lg border border-line bg-white/60 p-4"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + index * 0.08, duration: 0.35 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="t-label tnum rounded-r-pill bg-cream px-2.5 py-1 text-gold-deep">{moment.time}</span>
                        <p className="t-ui-sm font-bold text-ink">{moment.signal}</p>
                      </div>
                      <p className="t-ui-sm mt-2 font-medium leading-relaxed text-ink-soft">{moment.response}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="rounded-r-lg bg-forest p-5 text-soft-white shadow-e-2">
                <p className="t-label text-champagne">What should LIFE7 protect?</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {TARGETS.map((target) => (
                    <button
                      key={target}
                      type="button"
                      onClick={() => onSelectTarget(target)}
                      className={cn(
                        't-ui-sm rounded-r-md border px-3 py-2.5 text-left font-semibold transition-all',
                        selectedTarget === target
                          ? 'border-champagne bg-champagne/20 text-champagne'
                          : 'border-white/15 bg-white/5 text-white/75 hover:border-champagne/50 hover:text-white',
                      )}
                    >
                      {target}
                    </button>
                  ))}
                </div>

                <div className="mt-5 border-t border-white/10 pt-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="t-display-sm text-white">€29</span>
                    <span className="t-ui-sm text-white/55">/ month after trial</span>
                  </div>
                  <p className="t-ui-sm mt-1 text-white/55">Indicative founding price. No card today.</p>

                  <button
                    type="button"
                    onClick={onReserve}
                    className={cn(
                      'mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-r-pill px-5 t-ui-sm font-bold transition-all',
                      reserved
                        ? 'bg-sage-mist text-forest'
                        : 'bg-champagne text-forest hover:bg-gold-light',
                    )}
                  >
                    {reserved ? <><Check size={17} /> Preview reserved</> : <>Reserve founding access <ArrowRight size={17} /></>}
                  </button>
                  <p className="t-label mt-3 text-center text-white/45">Preview only · no payment is processed</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default function Membership({
  boostActive,
  setBoostActive,
  boostTarget,
  setBoostTarget,
}: {
  boostActive: boolean
  setBoostActive: (value: boolean) => void
  boostTarget: string | null
  setBoostTarget: (target: string | null) => void
}) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [reserved, setReserved] = useState(false)
  const { toast } = useToast()

  const reservePreview = () => {
    setReserved(true)
    setBoostActive(true)
    if (!boostTarget) setBoostTarget('Steady energy')
    toast('Founding preview reserved. No charge, no card.', { tone: 'gold' })
  }

  return (
    <section aria-label="Membership">
      <SectionHeader>Membership</SectionHeader>

      <div className="rounded-r-lg border border-line bg-soft-white/80 p-5 shadow-e-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Life7Mark size={36} />
            <div>
              <h3 className="t-display-sm text-ink">Prototype access</h3>
              <p className="t-ui-sm mt-0.5 font-medium text-ink-soft">Every judging flow stays open.</p>
            </div>
          </div>
          <span className="t-label shrink-0 rounded-r-pill bg-sage-mist px-3 py-1.5 text-forest">Full access</span>
        </div>
        <div className="mt-4 flex items-start gap-2.5 border-t border-line pt-4">
          <Check size={16} className="mt-0.5 shrink-0 text-green" />
          <p className="t-ui-sm font-medium leading-relaxed text-ink-soft">
            Meal intelligence, the seven-day system, pantry, planner and AI Coach are unlocked during the preview.
          </p>
        </div>
      </div>

      <div className="forest-glass relative mt-5 overflow-hidden rounded-r-xl p-5 shadow-e-2 min-[640px]:p-6">
        <GoldDust />
        <span className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-champagne/10 blur-3xl" aria-hidden="true" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="t-label text-champagne">Upgrade concept</p>
              <h3 className="t-display-sm mt-1 text-soft-white">LIFE7 Continuum</h3>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-champagne/30 bg-champagne/10 text-champagne">
              <Sparkles size={18} />
            </span>
          </div>

          <p className="t-serif-quote mt-4 text-[18px] leading-relaxed text-soft-white/80">
            Not more dashboards. A living layer that notices drift and recomposes the next seven days around you.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-r-lg border border-white/10 bg-white/10">
            {LIFE_LOOP.map((item, index) => (
              <div key={item.step} className="bg-forest/75 p-3">
                <div className="flex items-center gap-2">
                  <span className="t-label tnum text-champagne/60">0{index + 1}</span>
                  <span className="t-ui-sm font-bold text-soft-white">{item.step}</span>
                </div>
                <p className="t-ui-sm mt-1 text-soft-white/50">{item.detail}</p>
              </div>
            ))}
          </div>

          {boostActive && (
            <div className="mt-4 flex items-center gap-2 rounded-r-md border border-champagne/20 bg-champagne/10 px-3 py-2.5">
              <Check size={15} className="text-champagne" />
              <span className="t-ui-sm font-semibold text-champagne">Founding preview reserved · {boostTarget}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-r-pill bg-champagne px-5 t-ui-sm font-bold text-forest transition-all hover:bg-gold-light"
          >
            {reserved ? 'View your preview' : 'Explore the upgrade'}
            <ArrowRight size={17} />
          </button>
          <p className="t-label mt-3 text-center text-soft-white/45">Concept preview · no checkout · no charge</p>
        </div>
      </div>

      <PreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        selectedTarget={boostTarget}
        onSelectTarget={setBoostTarget}
        reserved={reserved}
        onReserve={reservePreview}
      />
    </section>
  )
}
