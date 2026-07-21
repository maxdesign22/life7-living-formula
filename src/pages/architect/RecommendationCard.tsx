/**
 * RecommendationCard (design.md §9 + meal-architect.md §Right Block 3):
 * gold left spine, ingredient + qty, "why it helps" in Fraunces italic,
 * affected-dimension chips, Δ estimate in gold, Apply button.
 */

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { MagneticButton } from '@/components/life7'
import type { Recommendation } from '@/data/recommendationRules'
import type { DimensionKey } from '@/lib/scoring'
import { DeltaChip } from './controls'

const DIM_SHORT: Record<DimensionKey, string> = {
  protein: 'Protein',
  fibre: 'Fibre',
  energy: 'Energy',
  diversity: 'Diversity',
  micro: 'Micro',
  satiety: 'Satiety',
  goal: 'Goal',
}

export interface RecommendationCardProps {
  rec: Recommendation
  index: number
  applied?: boolean
  onApply: (rec: Recommendation, rect: DOMRect) => void
}

export default function RecommendationCard({ rec, index, applied = false, onApply }: RecommendationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  return (
    <motion.div
      ref={cardRef}
      layout="position"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: applied ? 0.55 : 1, y: 0 }}
      exit={{ opacity: 0, x: 28, transition: { duration: 0.3 } }}
      transition={{ duration: 0.42, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-r-lg bg-soft-white/80 py-3 pl-4 pr-3 shadow-e-1"
    >
      {/* gold spine */}
      <span aria-hidden="true" className="bg-sunrise-gold absolute left-0 top-0 h-full w-[3px]" />

      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream">
          <img src={`/${rec.image}`} alt="" className="h-8 w-8 object-contain" draggable={false} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="t-ui-md text-[14px] font-semibold text-ink">{rec.title}</p>
          <p className="t-serif-quote mt-1 text-[15px] leading-snug text-ink-soft">{rec.why}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {rec.affectedDims.map((d) => (
              <DeltaChip key={d.dim} label={DIM_SHORT[d.dim]} delta={d.delta} />
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="t-metric-sm tnum text-gold-deep">Δ +{rec.deltaEstimate}</span>
          <MagneticButton
            variant="primary"
            size="sm"
            shape="md"
            disabled={applied}
            onClick={() => {
              const rect = cardRef.current?.getBoundingClientRect()
              if (rect) onApply(rec, rect)
            }}
            icon={<ArrowRight size={13} strokeWidth={2} />}
          >
            Apply
          </MagneticButton>
        </div>
      </div>
    </motion.div>
  )
}
