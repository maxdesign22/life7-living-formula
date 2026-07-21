/**
 * Zone D — Coverage Twin Gauges (progress.md): 240° half-radial gauges for
 * protein & fibre coverage. Needle-free: the arc fill is a gradient ribbon
 * ending in a glowing dot; target dot at 100%; 7-day sparkline below.
 * Hover reveals the per-day breakdown popover.
 */
import { useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { GlassCard } from '@/components/life7'
import { CountUp } from './shared'
import type { Period } from './shared'
import { EASE_GLIDE } from '@/pages/planner/ui'

const CX = 100
const CY = 96
const RR = 70
const START = 150 // degrees, bottom-left
const SWEEP = 240

const polar = (deg: number, r = RR): [number, number] => {
  const a = (deg * Math.PI) / 180
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)]
}

function arc(start: number, end: number, r = RR): string {
  const [x0, y0] = polar(start, r)
  const [x1, y1] = polar(end, r)
  const large = end - start > 180 ? 1 : 0
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

interface GaugeSpec {
  id: string
  label: string
  pct: number
  caption: string
  tone: 'green' | 'gold'
  spark: readonly number[]
  perDay: readonly number[]
}

const GAUGES: Record<Period, [GaugeSpec, GaugeSpec]> = {
  week: [
    { id: 'protein', label: 'Protein coverage', pct: 91, caption: 'of 150 g daily target', tone: 'green', spark: [84, 86, 88, 85, 90, 92, 91], perDay: [86, 92, 88, 90, 94, 89, 91] },
    { id: 'fibre', label: 'Fibre coverage', pct: 64, caption: 'rising +9%/week', tone: 'gold', spark: [52, 55, 58, 57, 61, 63, 64], perDay: [58, 62, 60, 64, 66, 68, 64] },
  ],
  month: [
    { id: 'protein', label: 'Protein coverage', pct: 88, caption: '4-week average', tone: 'green', spark: [82, 84, 85, 88, 86, 89, 88], perDay: [84, 88, 86, 87, 90, 88, 88] },
    { id: 'fibre', label: 'Fibre coverage', pct: 61, caption: 'rising +7%/week', tone: 'gold', spark: [50, 53, 55, 56, 58, 60, 61], perDay: [56, 60, 58, 61, 63, 64, 61] },
  ],
  quarter: [
    { id: 'protein', label: 'Protein coverage', pct: 84, caption: '12-week average', tone: 'green', spark: [78, 80, 79, 82, 81, 83, 84], perDay: [80, 84, 82, 83, 85, 84, 84] },
    { id: 'fibre', label: 'Fibre coverage', pct: 56, caption: 'rising +9%/week', tone: 'gold', spark: [44, 47, 50, 51, 53, 55, 56], perDay: [50, 54, 52, 56, 58, 59, 56] },
  ],
}

const TONE = {
  green: { from: '#8FAE7E', to: '#5C7A54', dot: '#5C7A54' },
  gold: { from: '#F2C14E', to: '#B08A3E', dot: '#D9B26A' },
} as const

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function Gauge({ spec, active, delay }: { spec: GaugeSpec; active: boolean; delay: number }) {
  const [hover, setHover] = useState(false)
  const tone = TONE[spec.tone]
  const end = START + (SWEEP * spec.pct) / 100
  const [dx, dy] = polar(end)
  const sparkPts = spec.spark.map((v, i) => `${(i / (spec.spark.length - 1)) * 160},${26 - (v / 100) * 22}`).join(' ')

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative w-full max-w-[230px]">
      <svg viewBox="0 0 200 130" className="w-full">
        <defs>
          <linearGradient id={`gauge-${spec.id}`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={tone.from} />
            <stop offset="100%" stopColor={tone.to} />
          </linearGradient>
        </defs>
        {/* track */}
        <path d={arc(START, START + SWEEP)} fill="none" stroke="#F3EBDA" strokeWidth="10" strokeLinecap="round" />
        {/* ticks every 10% */}
        {Array.from({ length: 11 }, (_, i) => {
          const a = START + (SWEEP / 10) * i
          const [tx1, ty1] = polar(a, RR + 9)
          const [tx2, ty2] = polar(a, RR + 14)
          return <line key={i} x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke="#A79C8A" strokeWidth="1" strokeLinecap="round" />
        })}
        {/* ribbon fill sweeps 0 → value */}
        <motion.path
          d={arc(START, end)}
          fill="none"
          stroke={`url(#gauge-${spec.id})`}
          strokeWidth="10"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={active ? { pathLength: 1 } : {}}
          transition={{ duration: 1.3, delay, ease: EASE_GLIDE }}
        />
        {/* target dot at 100% */}
        {(() => {
          const [tx, ty] = polar(START + SWEEP, RR + 21)
          return <circle cx={tx} cy={ty} r="3" fill="none" stroke="#B08A3E" strokeWidth="1.4" />
        })()}
        {/* glowing end dot — flares once after the sweep */}
        <motion.circle
          cx={dx}
          cy={dy}
          r="6"
          fill={tone.dot}
          stroke="#FFFDF7"
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={active ? { scale: [0, 1.6, 1] } : {}}
          transition={{ delay: delay + 1.25, duration: 0.5, times: [0, 0.4, 1] }}
          style={{ transformOrigin: `${dx}px ${dy}px` }}
        />
      </svg>
      {/* center value (HTML overlay — SVG <text> cannot host the CountUp span) */}
      <div className="pointer-events-none absolute left-1/2 top-[60%] -translate-x-1/2 text-center">
        <CountUp value={spec.pct} active={active} delay={delay} duration={1.2} suffix="%" className="t-metric-lg block text-[26px] text-ink" />
        <span className="t-ui-sm block font-medium text-ink-soft" style={{ fontSize: 10 }}>{spec.caption}</span>
      </div>
      </div>

      <span className="t-label -mt-1 text-ink">{spec.label}</span>

      {/* 7-day sparkline */}
      <svg viewBox="0 0 160 28" className="mt-2 w-full max-w-[170px]">
        <motion.polyline
          points={sparkPts}
          fill="none"
          stroke={tone.to}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={active ? { pathLength: 1 } : {}}
          transition={{ duration: 0.8, delay: delay + 0.5, ease: EASE_GLIDE }}
        />
      </svg>

      {/* per-day breakdown popover */}
      <AnimatePresence>
        {hover && (
          <motion.div
            className="glass-strong absolute -top-4 left-1/2 z-20 -translate-x-1/2 -translate-y-full rounded-r-md p-3 shadow-e-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-end gap-1.5">
              {spec.perDay.map((v, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="t-label text-[8px] text-ink-soft tnum">{v}</span>
                  <motion.div
                    className="w-3 rounded-t-sm"
                    style={{ background: `linear-gradient(180deg, ${tone.from}, ${tone.to})` }}
                    initial={{ height: 0 }}
                    animate={{ height: (v / 100) * 44 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                  />
                  <span className="t-label text-[8px] text-ink-faint">{DAYS[i]}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TwinGauges({ period }: { period: Period }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const [protein, fibre] = GAUGES[period]

  return (
    <GlassCard flat size="xl" className="flex h-full flex-col p-5 min-[768px]:p-6">
      <div ref={ref} className="flex flex-1 flex-col">
        <span className="t-label text-gold-deep">Coverage</span>
        <p className="t-ui-sm mt-1 font-medium text-ink-soft">Protein &amp; fibre against daily targets</p>
        <div className="mt-3 grid flex-1 grid-cols-1 gap-4 min-[520px]:grid-cols-2">
          <Gauge key={`p-${period}`} spec={protein} active={inView} delay={0.15} />
          <Gauge key={`f-${period}`} spec={fibre} active={inView} delay={0.35} />
        </div>
      </div>
    </GlassCard>
  )
}
