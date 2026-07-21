/**
 * Zone F — Waste & Cost Duet (progress.md): two cards.
 * 1. Food waste: declining bars (1.1 → 0.3 kg) in cream with forest tops, a
 *    leaf cap on the latest, and a gold arrow descending across the tops.
 * 2. Weekly cost: sage bars with a dashed burgundy budget line at €70 —
 *    never crossed. Caption: UNDER BUDGET 6 WEEKS IN A ROW.
 */
import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Leaf } from 'lucide-react'
import { GlassCard } from '@/components/life7'
import { EASE_GLIDE } from '@/pages/planner/ui'

const WASTE = [1.1, 0.9, 0.8, 0.6, 0.5, 0.3] as const
const COST = [68.2, 64.9, 66.1, 61.8, 59.3, 62.4] as const
const WEEK_LABELS = ['W19', 'W20', 'W21', 'W22', 'W23', 'W24'] as const
const BUDGET = 70

/** Deterministic per-store split for the cost hover popover. */
const STORE_SPLIT = [
  { label: 'Supermarket', share: 0.58 },
  { label: 'Farmers market', share: 0.27 },
  { label: 'Online', share: 0.15 },
] as const

function WasteCard() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const [hover, setHover] = useState<number | null>(null)
  const maxKg = 1.2
  const barH = (v: number) => (v / maxKg) * 132

  return (
    <GlassCard flat size="xl" className="flex h-full flex-col p-5 min-[768px]:p-6">
      <div ref={ref} className="flex flex-1 flex-col">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="t-label text-gold-deep">Food waste</span>
            <p className="t-ui-sm mt-1 font-medium text-ink-soft">Kilograms per week, good direction is down</p>
          </div>
          <span className="t-metric-sm tnum text-green">−38%</span>
        </div>

        <div className="relative mt-6 flex flex-1 items-end justify-between gap-2">
          {/* gold arrow descending across the bar tops */}
          <svg className="pointer-events-none absolute inset-x-2 top-0 h-[150px] w-[calc(100%-16px)]" preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <marker id="waste-arrowhead" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                <path d="M0,0 L6,3.5 L0,7 Z" fill="#B08A3E" />
              </marker>
            </defs>
            <motion.line
              x1="4"
              y1="12"
              x2="94"
              y2="76"
              stroke="#B08A3E"
              strokeWidth="1.6"
              strokeDasharray="4 4"
              markerEnd="url(#waste-arrowhead)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={inView ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ delay: 1.0, duration: 0.9, ease: EASE_GLIDE }}
            />
          </svg>
          {WASTE.map((v, i) => {
            const latest = i === WASTE.length - 1
            return (
              <div
                key={i}
                className="relative flex flex-1 flex-col items-center justify-end self-stretch"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {latest && (
                  <motion.span
                    className="mb-1 flex h-5 w-5 items-center justify-center rounded-full bg-sage-mist"
                    initial={{ scale: 0 }}
                    animate={inView ? { scale: 1 } : {}}
                    transition={{ delay: 1.4, type: 'spring', stiffness: 300, damping: 16 }}
                  >
                    <Leaf size={11} strokeWidth={1.8} className="text-green" />
                  </motion.span>
                )}
                <motion.div
                  className="w-full max-w-[38px] overflow-hidden rounded-t-md bg-cream"
                  style={{ height: barH(v) }}
                  initial={{ scaleY: 0 }}
                  animate={inView ? { scaleY: 1 } : {}}
                  transition={{ delay: 0.25 + i * 0.08, type: 'spring', stiffness: 190, damping: 22 }}
                >
                  <div className="h-[6px] w-full bg-forest" style={{ opacity: latest ? 1 : 0.75 }} />
                </motion.div>
                <span className="t-label mt-2 text-[9px] text-ink-faint">{WEEK_LABELS[i]}</span>
                {hover === i && (
                  <div className="glass-strong pointer-events-none absolute -top-2 left-1/2 z-10 w-[130px] -translate-x-1/2 -translate-y-full rounded-r-md p-2.5 text-center shadow-e-2">
                    <p className="t-ui-sm font-bold text-ink tnum">{v.toFixed(1)} kg</p>
                    <p className="t-ui-sm font-medium text-green tnum">€{((WASTE[0] - v) * 4.2).toFixed(2)} saved</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </GlassCard>
  )
}

function CostCard() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const [hover, setHover] = useState<number | null>(null)
  const scale = 78 // € max of the axis
  const barH = (v: number) => (v / scale) * 132

  return (
    <GlassCard flat size="xl" className="flex h-full flex-col p-5 min-[768px]:p-6">
      <div ref={ref} className="flex flex-1 flex-col">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="t-label text-gold-deep">Weekly cost</span>
            <p className="t-ui-sm mt-1 font-medium text-ink-soft">Total shop per week against the €{BUDGET} budget</p>
          </div>
        </div>

        <div className="relative mt-6 flex flex-1 items-end justify-between gap-2">
          {/* dashed burgundy budget line — never crossed */}
          <div
            className="pointer-events-none absolute inset-x-0 border-t-[1.5px] border-dashed border-burgundy/60"
            style={{ bottom: `${(BUDGET / scale) * 132 + 24}px` }}
          >
            <span className="t-label absolute -top-4 right-0 text-[9px] text-burgundy">Budget €{BUDGET}</span>
          </div>
          {COST.map((v, i) => (
            <div
              key={i}
              className="relative flex flex-1 flex-col items-center justify-end self-stretch"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <motion.span
                className="t-metric-sm tnum mb-1 text-[12px] text-ink"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.85 + i * 0.08 }}
              >
                €{v.toFixed(2)}
              </motion.span>
              <motion.div
                className="w-full max-w-[38px] rounded-t-md bg-sage transition-colors duration-200 hover:bg-green"
                style={{ height: barH(v) }}
                initial={{ scaleY: 0 }}
                animate={inView ? { scaleY: 1 } : {}}
                transition={{ delay: 0.25 + i * 0.08, type: 'spring', stiffness: 190, damping: 22 }}
              />
              <span className="t-label mt-2 text-[9px] text-ink-faint">{WEEK_LABELS[i]}</span>
              {hover === i && (
                <div className="glass-strong pointer-events-none absolute -top-3 left-1/2 z-10 w-[150px] -translate-x-1/2 -translate-y-full rounded-r-md p-3 shadow-e-2">
                  {STORE_SPLIT.map((s, si) => (
                    <div key={s.label} className="mb-1.5 last:mb-0">
                      <div className="t-label flex justify-between text-[8px] text-ink-soft">
                        <span>{s.label}</span>
                        <span className="tnum">€{(v * s.share).toFixed(2)}</span>
                      </div>
                      <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-cream">
                        <motion.div
                          className="h-full rounded-full bg-green"
                          initial={{ width: 0 }}
                          animate={{ width: `${s.share * 100}%` }}
                          transition={{ delay: si * 0.06, duration: 0.3 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <motion.p
          className="t-label mt-4 text-center text-green"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 1.3 }}
        >
          Under budget 6 weeks in a row
        </motion.p>
      </div>
    </GlassCard>
  )
}

export default function WasteCostDuet() {
  return (
    <div className="grid grid-cols-1 gap-6 min-[1024px]:grid-cols-2">
      <WasteCard />
      <CostCard />
    </div>
  )
}
