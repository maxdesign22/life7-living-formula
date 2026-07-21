import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Slim product status element (design.md §8 Footer): lives at the bottom of
 * the nav rail — "Week 24 · Day 4 of 7" + a hairline gold progress line.
 */
export default function Footer({ compact = false }: { compact?: boolean }) {
  const day = 4
  const pct = (day / 7) * 100
  return (
    <div className={cn('w-full', compact ? 'px-1' : 'px-1')}>
      {!compact && (
        <div className="t-label mb-2 flex items-center justify-between text-ink-faint">
          <span>Week 24</span>
          <span className="tnum">Day {day} of 7</span>
        </div>
      )}
      <div className="h-[2px] w-full overflow-hidden rounded-full bg-cream">
        <motion.div
          className="h-full rounded-full bg-champagne"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
        />
      </div>
    </div>
  )
}
