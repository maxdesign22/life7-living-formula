/**
 * Zone A — Headline strip (progress.md): 4 summary metrics + the goal
 * alignment ring card. Values count up 900 ms; delta chips pop 300 ms after.
 */
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { GlassCard } from '@/components/life7'
import { CountUp } from './shared'
import type { Period } from './shared'
import { EASE_GLIDE } from '@/pages/planner/ui'

interface HeadlineData {
  score: number
  scoreDelta: string
  alignment: number
  alignmentDelta: string
  cooking: number
  cookingDelta: string
  waste: number
  wasteDelta: string
}

const HEADLINE: Record<Period, HeadlineData> = {
  week: { score: 78, scoreDelta: '+6 vs last week', alignment: 82, alignmentDelta: '+3 pts', cooking: 21, cookingDelta: '−4 min', waste: 0.3, wasteDelta: '−38%' },
  month: { score: 76, scoreDelta: '+4 vs last month', alignment: 80, alignmentDelta: '+2 pts', cooking: 22, cookingDelta: '−3 min', waste: 0.5, wasteDelta: '−24%' },
  quarter: { score: 72, scoreDelta: '+9 vs Q1', alignment: 77, alignmentDelta: '+6 pts', cooking: 24, cookingDelta: '−6 min', waste: 0.8, wasteDelta: '−41%' },
}

function MetricCard({
  label,
  value,
  decimals = 0,
  suffix = '',
  delta,
  active,
  index,
}: {
  label: string
  value: number
  decimals?: number
  suffix?: string
  delta: string
  active: boolean
  index: number
}) {
  return (
    <div className="min-w-0 px-4 py-5 min-[768px]:px-5">
      <span className="t-label text-ink-soft">{label}</span>
      <div className="mt-2 flex items-baseline gap-2">
        <CountUp
          value={value}
          decimals={decimals}
          suffix={suffix}
          active={active}
          duration={0.9}
          delay={0.1 + index * 0.08}
          className="tnum text-[30px] font-semibold leading-none tracking-[-0.035em] text-ink"
        />
      </div>
      <motion.span
        className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-green"
        initial={{ opacity: 0, y: 3 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 1.05 + index * 0.08, duration: 0.3 }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-green" />
        {delta}
      </motion.span>
    </div>
  )
}

export default function HeadlineStrip({ period }: { period: Period }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const d = HEADLINE[period]

  return (
    <motion.div
      ref={ref}
      className="w-full"
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: EASE_GLIDE }}
    >
      <GlassCard flat className="overflow-hidden p-0">
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3.5 min-[768px]:px-5">
          <div>
            <span className="t-label text-gold-deep">Performance snapshot</span>
            <p className="mt-1 text-[12px] font-medium text-ink-faint">Healthy &amp; Strong · {period}</p>
          </div>
          <span className="rounded-r-pill bg-sage-mist/70 px-3 py-1.5 text-[11px] font-semibold text-forest">
            All core signals improving
          </span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-line min-[900px]:grid-cols-4 min-[900px]:divide-y-0">
          <MetricCard label="Avg meal score" value={d.score} delta={d.scoreDelta} active={inView} index={0} />
          <MetricCard label="Goal alignment" value={d.alignment} suffix="%" delta={d.alignmentDelta} active={inView} index={1} />
          <MetricCard label="Cooking time" value={d.cooking} suffix=" min" delta={d.cookingDelta} active={inView} index={2} />
          <MetricCard label="Food waste" value={d.waste} decimals={1} suffix=" kg" delta={d.wasteDelta} active={inView} index={3} />
        </div>
      </GlassCard>
    </motion.div>
  )
}
