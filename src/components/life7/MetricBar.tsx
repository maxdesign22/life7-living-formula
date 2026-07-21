import { motion } from 'framer-motion'

const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]

export interface MetricBarProps {
  label: string
  /** right-side value, e.g. "48%" or "1.4 / 2.4 L" */
  value: string
  /** 0–100+ fill percentage of target */
  pct: number
  /** draw a 2px gold target tick at this % */
  targetPct?: number
  /** animate width on mount/value change (design.md §5.4) */
  animated?: boolean
  height?: number
  /** label row can be hidden for hairline mini bars */
  compact?: boolean
  className?: string
}

/**
 * Nutrient metric bar (design.md §9): cream track, sage-mist→green fill,
 * gold target tick, over-target cap with +N% gold chip.
 */
export default function MetricBar({
  label,
  value,
  pct,
  targetPct,
  animated = true,
  height = 6,
  compact = false,
  className = '',
}: MetricBarProps) {
  const capped = Math.max(0, Math.min(100, pct))
  const over = pct > 100

  return (
    <div className={className}>
      {!compact && (
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="t-label text-ink-soft">{label}</span>
          <span className="t-metric-sm text-ink">{value}</span>
        </div>
      )}
      <div className="relative w-full overflow-visible rounded-r-pill bg-cream" style={{ height }}>
        <motion.div
          className="bg-metric-fill h-full rounded-r-pill"
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${capped}%` }}
          transition={{ duration: 0.8, ease: EASE_GLIDE }}
        />
        {targetPct != null && targetPct > 0 && targetPct < 100 && (
          <div
            className="absolute top-[-3px] bottom-[-3px] w-[2px] rounded-full bg-gold-deep"
            style={{ left: `${targetPct}%` }}
            aria-hidden="true"
          />
        )}
        {over && (
          <span className="t-label absolute -top-2 right-0 translate-y-[-100%] rounded-r-pill bg-sunrise px-1.5 py-0.5 text-[9px] text-ink shadow-e-1">
            +{Math.round(pct - 100)}%
          </span>
        )}
      </div>
    </div>
  )
}
