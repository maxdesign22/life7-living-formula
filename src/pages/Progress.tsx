/**
 * Screen 9 — PROGRESS (/progress). "Proof that the system works", rendered
 * as editorial hand-built SVG infographics (no chart library): score river,
 * consistency bloom, twin coverage gauges, diversity orbit, waste & cost
 * duet, and the AI insights row. All charts animate on scroll into view.
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { EASE_GLIDE, KineticWords, SegmentedControl } from '@/pages/planner/ui'
import HeadlineStrip from '@/pages/progress/HeadlineStrip'
import ScoreRiver from '@/pages/progress/ScoreRiver'
import ConsistencyBloom from '@/pages/progress/ConsistencyBloom'
import TwinGauges from '@/pages/progress/TwinGauges'
import DiversityOrbit from '@/pages/progress/DiversityOrbit'
import WasteCostDuet from '@/pages/progress/WasteCostDuet'
import InsightsRow from '@/pages/progress/InsightsRow'
import { PERIOD_OPTIONS } from '@/pages/progress/shared'
import type { Period } from '@/pages/progress/shared'

export default function Progress() {
  const [period, setPeriod] = useState<Period>('week')

  return (
    <div className="mx-auto max-w-[1280px]">
      {/* header */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <motion.span
            className="t-label block text-gold-deep"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Week 24 · The annual report of one good week
          </motion.span>
          <h1 className="t-display-lg mt-2 text-ink">
            <KineticWords text="Progress" />
          </h1>
          <motion.p
            className="t-serif-quote mt-2 text-ink-soft"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            Less thinking. Better living.
          </motion.p>
        </div>
        <motion.div
          className="mt-1"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: EASE_GLIDE }}
        >
          <SegmentedControl id="progress-period" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
        </motion.div>
      </header>

      <div className="space-y-6">
        {/* Zone A — headline strip */}
        <HeadlineStrip period={period} />

        {/* Zones B + C — river & bloom */}
        <div className="grid grid-cols-1 gap-6 min-[1024px]:grid-cols-12">
          <div className="min-[1024px]:col-span-8">
            <ScoreRiver period={period} />
          </div>
          <div className="min-[1024px]:col-span-4">
            <ConsistencyBloom period={period} />
          </div>
        </div>

        {/* Zones D + E — twin gauges & diversity orbit */}
        <div className="grid grid-cols-1 gap-6 min-[1024px]:grid-cols-2">
          <TwinGauges period={period} />
          <DiversityOrbit />
        </div>

        {/* Zone F — waste & cost duet */}
        <WasteCostDuet />

        {/* Zone G — insights + footer line */}
        <InsightsRow />
      </div>
    </div>
  )
}
