/**
 * Zone C — Consistency Bloom (progress.md): a 7-petal bloom, one petal per
 * weekday; petal length = consistency % (meals completed as planned). Missed
 * meals carve a notch in the petal edge. Petals grow from center with a
 * staggered spring, then the bloom idles with a slow ±2° rotate. Future days
 * render as dashed ghost petals (planned readiness).
 */
import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { GlassCard, Life7Mark } from '@/components/life7'
import type { Period } from './shared'

const C = 150 // center
const MAX_L = 108

interface Petal {
  day: string
  pct: number
  ghost?: boolean
  notch?: boolean
  note: string
}

const BLOOMS: Record<Period, Petal[]> = {
  week: [
    { day: 'Mon', pct: 100, note: '4 of 4 meals as planned' },
    { day: 'Tue', pct: 100, note: '4 of 4 meals as planned' },
    { day: 'Wed', pct: 75, notch: true, note: '3 of 4, dinner out (Social)' },
    { day: 'Thu', pct: 50, note: '2 of 4 so far, today is live' },
    { day: 'Fri', pct: 92, ghost: true, note: 'planned readiness 92%' },
    { day: 'Sat', pct: 88, ghost: true, note: 'planned readiness 88%' },
    { day: 'Sun', pct: 95, ghost: true, note: 'planned readiness 95%' },
  ],
  month: [
    { day: 'Mon', pct: 96, note: '4-week average' },
    { day: 'Tue', pct: 94, note: '4-week average' },
    { day: 'Wed', pct: 82, notch: true, note: 'social Wednesdays dip' },
    { day: 'Thu', pct: 90, note: '4-week average' },
    { day: 'Fri', pct: 90, note: '4-week average' },
    { day: 'Sat', pct: 86, note: '4-week average' },
    { day: 'Sun', pct: 93, note: '4-week average' },
  ],
  quarter: [
    { day: 'Mon', pct: 90, note: '12-week average' },
    { day: 'Tue', pct: 92, note: '12-week average' },
    { day: 'Wed', pct: 84, notch: true, note: 'social Wednesdays dip' },
    { day: 'Thu', pct: 88, note: '12-week average' },
    { day: 'Fri', pct: 86, note: '12-week average' },
    { day: 'Sat', pct: 84, note: '12-week average' },
    { day: 'Sun', pct: 90, note: '12-week average' },
  ],
}

/** Teardrop path pointing up from the center. */
function petalPath(length: number): string {
  const w = 23
  const tipY = C - length
  return [
    `M ${C} ${C}`,
    `C ${C - w} ${C - length * 0.32}, ${C - w * 0.62} ${C - length * 0.74}, ${C} ${tipY}`,
    `C ${C + w * 0.62} ${C - length * 0.74}, ${C + w} ${C - length * 0.32}, ${C} ${C}`,
    'Z',
  ].join(' ')
}

export default function ConsistencyBloom({ period }: { period: Period }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const [hover, setHover] = useState<number | null>(null)
  const petals = BLOOMS[period]

  return (
    <GlassCard flat size="xl" className="relative flex h-full flex-col p-5 min-[768px]:p-6">
      <div ref={ref} className="flex flex-1 flex-col">
        <span className="t-label text-gold-deep">Weekly consistency</span>
        <p className="t-ui-sm mt-1 font-medium text-ink-soft">Meals completed as planned, per weekday</p>

        <div className="relative mx-auto mt-2 w-full max-w-[300px] flex-1">
          <motion.svg
            viewBox="0 0 300 300"
            className="h-auto w-full"
            animate={{ rotate: [-1.6, 1.6] }}
            transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            style={{ transformOrigin: '150px 150px' }}
          >
            {/* hairline guide rings */}
            {[46, 80, 108].map((r) => (
              <circle key={r} cx={C} cy={C} r={r} fill="none" stroke="rgba(46,70,48,0.07)" strokeWidth="1" />
            ))}
            {petals.map((p, i) => {
              const angle = i * (360 / 7)
              const length = 30 + (p.pct / 100) * (MAX_L - 30)
              const hovered = hover === i
              return (
                <g key={`${period}-${p.day}`} transform={`rotate(${angle} ${C} ${C})`}>
                  <motion.path
                    d={petalPath(length)}
                    fill={hovered ? '#F2C14E' : p.ghost ? 'rgba(201,214,192,0.35)' : '#C9D6C0'}
                    stroke={hovered ? '#B08A3E' : '#2E4630'}
                    strokeOpacity={p.ghost ? 0.4 : 0.55}
                    strokeWidth="1.2"
                    strokeDasharray={p.ghost ? '4 4' : undefined}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={inView ? { scale: 1, opacity: 1 } : {}}
                    transition={{ delay: 0.2 + i * 0.09, type: 'spring', stiffness: 170, damping: 19 }}
                    style={{ transformOrigin: '150px 150px', cursor: 'pointer' }}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                  />
                  {/* missed-meal notch near the petal tip */}
                  {p.notch && (
                    <motion.path
                      d={`M ${C} ${C - length + 2} L ${C - 6.5} ${C - length + 15} L ${C + 6.5} ${C - length + 15} Z`}
                      fill="#FAF6EC"
                      initial={{ opacity: 0 }}
                      animate={inView ? { opacity: 1 } : {}}
                      transition={{ delay: 0.3 + i * 0.09 }}
                      pointerEvents="none"
                    />
                  )}
                </g>
              )
            })}
          </motion.svg>

          {/* center mark */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Life7Mark size={48} />
          </div>

          {/* hover tooltip */}
          {hover != null && (
            <div className="glass-strong pointer-events-none absolute left-1/2 top-2 z-10 w-[190px] -translate-x-1/2 rounded-r-md p-3 text-center shadow-e-2">
              <p className="t-ui-sm font-bold text-ink">
                {petals[hover].day} · <span className="tnum text-gold-deep">{petals[hover].pct}%</span>
              </p>
              <p className="t-ui-sm mt-0.5 font-medium text-ink-soft">{petals[hover].note}</p>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center justify-center gap-4">
          <span className="t-label flex items-center gap-1.5 text-ink-faint">
            <span className="inline-block h-2 w-2 rounded-full bg-sage" /> Lived
          </span>
          <span className="t-label flex items-center gap-1.5 text-ink-faint">
            <span className="inline-block h-2 w-2 rounded-full border border-dashed border-forest/40 bg-sage/40" /> Planned
          </span>
          <span className="t-label flex items-center gap-1.5 text-ink-faint">
            <span className="inline-block h-2 w-2 bg-ivory shadow-[inset_0_0_0_1px_rgba(46,70,48,0.3)]" /> Notch = missed meal
          </span>
        </div>
      </div>
    </GlassCard>
  )
}
