/**
 * 3-step spotlight tour (meal-architect.md §Header & global):
 * each step measures its real zone container (getBoundingClientRect on the
 * library / canvas / intelligence sections) and renders a precise spotlight —
 * dim rgba(43,38,32,0.45), champagne ring, breathing halo — with a glass step
 * card parked beside the target, never on top of it. Re-measures on resize,
 * scroll and step change; on the <1280px tab layout it adapts to the visible
 * zone instead of pointing at hidden panels.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_GLIDE } from './model'

interface StepDef {
  readonly targetId: string
  readonly prefer: Side
  readonly title: string
  readonly body: string
}

type Side = 'right' | 'left' | 'bottom' | 'top'

const STEPS: readonly StepDef[] = [
  {
    targetId: 'arch-zone-library',
    prefer: 'right',
    title: 'Your library',
    body: 'Search and browse every ingredient. What is at home is marked with a green dot.',
  },
  {
    targetId: 'arch-zone-canvas',
    prefer: 'bottom',
    title: 'The living plate',
    body: 'Ingredients land here as objects. Drag them, adjust quantities — the formula responds instantly.',
  },
  {
    targetId: 'arch-zone-intel',
    prefer: 'left',
    title: 'LIFE7 intelligence',
    body: 'Apply the smallest useful adjustment and watch the score transform before your eyes.',
  },
]

const DIM = 'rgba(43,38,32,0.45)'
const CARD_W = 340
const CARD_H = 208
const GAP = 18
const MARGIN = 16
const PAD = 8

interface SpotRect {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

interface Placement {
  readonly side: Side
  readonly x: number
  readonly y: number
}

/** Park the card beside the spotlight: preferred side first, then any side that fits. */
function placeCard(spot: SpotRect, prefer: Side): Placement {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const cx = spot.x + spot.w / 2
  const cy = spot.y + spot.h / 2
  const clampX = (x: number) => Math.min(Math.max(x, MARGIN), vw - CARD_W - MARGIN)
  const clampY = (y: number) => Math.min(Math.max(y, MARGIN), vh - CARD_H - MARGIN)
  const candidates: Record<Side, Placement> = {
    right: { side: 'right', x: spot.x + spot.w + GAP, y: clampY(cy - CARD_H / 2) },
    left: { side: 'left', x: spot.x - CARD_W - GAP, y: clampY(cy - CARD_H / 2) },
    bottom: { side: 'bottom', x: clampX(cx - CARD_W / 2), y: spot.y + spot.h + GAP },
    top: { side: 'top', x: clampX(cx - CARD_W / 2), y: spot.y - CARD_H - GAP },
  }
  const fits = (p: Placement) =>
    p.x >= MARGIN - 1 && p.x + CARD_W <= vw - MARGIN + 1 && p.y >= MARGIN - 1 && p.y + CARD_H <= vh - MARGIN + 1
  const order: Side[] = [prefer, ...(['right', 'left', 'bottom', 'top'] as Side[]).filter((s) => s !== prefer)]
  for (const s of order) if (fits(candidates[s])) return candidates[s]
  return { side: 'bottom', x: clampX(cx - CARD_W / 2), y: clampY(spot.y + spot.h + GAP) }
}

const CARET_CLS: Record<Side, string> = {
  right: '-left-[5px] top-1/2 -translate-y-1/2',
  left: '-right-[5px] top-1/2 -translate-y-1/2',
  bottom: '-top-[5px] left-1/2 -translate-x-1/2',
  top: '-bottom-[5px] left-1/2 -translate-x-1/2',
}

export default function TourOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [steps, setSteps] = useState<readonly StepDef[]>(STEPS)
  const [step, setStep] = useState(0)
  const [spot, setSpot] = useState<SpotRect | null>(null)
  const [placement, setPlacement] = useState<Placement | null>(null)

  const stepsRef = useRef(steps)
  const stepRef = useRef(step)
  const measureRef = useRef<() => void>(() => {})
  useEffect(() => {
    stepsRef.current = steps
    stepRef.current = step
  }, [steps, step])

  const measure = useCallback(() => {
    const def = stepsRef.current[stepRef.current]
    if (!def) return
    const el = document.getElementById(def.targetId)
    if (!el) {
      setSpot(null)
      return
    }
    const r = el.getBoundingClientRect()
    if (r.width < 4 || r.height < 4) {
      setSpot(null)
      return
    }
    const next: SpotRect = {
      x: Math.max(MARGIN / 2, r.left - PAD),
      y: Math.max(MARGIN / 2, r.top - PAD),
      w: Math.min(r.width + PAD * 2, window.innerWidth - MARGIN),
      h: Math.min(r.height + PAD * 2, window.innerHeight - MARGIN),
    }
    // Zone fills the viewport (tab layout) — a cutout around the whole screen
    // is meaningless: drop the spotlight and centre the card instead.
    const coverage = (next.w * next.h) / (window.innerWidth * window.innerHeight)
    if (coverage > 0.6) {
      setSpot(null)
      setPlacement(null)
      return
    }
    setSpot(next)
    setPlacement(placeCard(next, def.prefer))
  }, [])

  useEffect(() => {
    measureRef.current = measure
  }, [measure])

  const scheduleMeasure = useCallback(() => {
    // double rAF — measure after React commits and the browser has painted
    requestAnimationFrame(() => requestAnimationFrame(() => measureRef.current()))
  }, [])

  // open: adapt the tour to the zones actually visible (tab layout shows one).
  // Derived-state-from-props pattern — adjusted during render, not in an effect.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      const visible = STEPS.filter((s) => {
        const el = document.getElementById(s.targetId)
        return el && el.getBoundingClientRect().width > 4
      })
      setSteps(visible.length > 0 ? visible : STEPS)
      setStep(0)
    }
  }

  // Escape closes the tour
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // measure after open / step change / steps list swap
  useEffect(() => {
    if (!open) return
    scheduleMeasure()
  }, [open, step, steps, scheduleMeasure])

  // follow layout shifts while open
  useEffect(() => {
    if (!open) return
    const remeasure = () => measureRef.current()
    window.addEventListener('resize', remeasure)
    document.addEventListener('scroll', remeasure, true)
    return () => {
      window.removeEventListener('resize', remeasure)
      document.removeEventListener('scroll', remeasure, true)
    }
  }, [open])

  const def = steps[step]
  const next = () => {
    if (step >= steps.length - 1) onClose()
    else setStep((s) => s + 1)
  }
  const back = () => setStep((s) => Math.max(0, s - 1))

  return (
    <AnimatePresence>
      {open && def && (
        <motion.div
          className="fixed inset-0 z-[95]"
          role="dialog"
          aria-modal="true"
          aria-label="Meal Architect tour"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* click-away backdrop; full-screen steps dim plainly (no spotlight) */}
          <div
            className="absolute inset-0 transition-colors duration-380"
            style={{ background: spot ? 'transparent' : DIM }}
            onClick={onClose}
          />

          {/* spotlight cutout with champagne ring + breathing halo */}
          {spot && (
            <motion.div
              className="pointer-events-none absolute rounded-r-xl"
              style={{ boxShadow: `0 0 0 9999px ${DIM}` }}
              initial={false}
              animate={{ left: spot.x, top: spot.y, width: spot.w, height: spot.h }}
              transition={{ duration: 0.45, ease: EASE_GLIDE }}
            >
              <div className="absolute inset-0 rounded-r-xl border-2 border-champagne/90" />
              <div className="absolute inset-[3px] rounded-[10px] border border-soft-white/45" />
              <motion.span
                aria-hidden="true"
                className="absolute -inset-[7px] rounded-[16px] border border-champagne/50"
                animate={{ opacity: [0.8, 0.25, 0.8] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          )}

          {/* step card — parked beside the target, never covering it */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${step}-${def.targetId}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.38, ease: EASE_GLIDE }}
              className="glass-strong absolute w-[min(340px,calc(100vw-32px))] rounded-r-lg p-5 shadow-e-3"
              style={
                placement
                  ? { left: placement.x, top: placement.y }
                  : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
              }
            >
              {placement && (
                <span
                  aria-hidden="true"
                  className={cn('absolute h-2.5 w-2.5 rotate-45 border border-line bg-soft-white', CARET_CLS[placement.side])}
                />
              )}
              <button
                type="button"
                aria-label="Close tour"
                onClick={onClose}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-cream hover:text-ink"
              >
                <X size={14} strokeWidth={2} />
              </button>

              <p className="t-label text-[9px] text-gold-deep">
                Step {step + 1} of {steps.length}
              </p>
              <p className="t-display-sm mt-1.5 text-[19px] text-ink">{def.title}</p>
              <p className="t-ui-md mt-1.5 text-[14px] leading-snug text-ink-soft">{def.body}</p>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <span
                      key={i}
                      className={
                        i === step ? 'h-1.5 w-5 rounded-full bg-champagne' : 'h-1.5 w-1.5 rounded-full bg-sand'
                      }
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="t-ui-sm text-ink-faint underline-offset-2 hover:underline"
                  >
                    Skip
                  </button>
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={back}
                      className="t-ui-sm text-ink-soft underline-offset-2 hover:text-ink hover:underline"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={next}
                    className="t-ui-sm rounded-r-pill bg-forest px-4 py-2 text-soft-white shadow-e-1 transition-shadow hover:shadow-gold-glow"
                  >
                    {step >= steps.length - 1 ? 'Done' : 'Next'}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
