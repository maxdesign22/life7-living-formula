import { memo } from 'react'
import { CalendarDays, ChefHat, Diamond, Moon, Plane, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { DayType } from '@/data/demoWeek'
import { cn } from '@/lib/utils'

/** Custom line-icon mapping for day types (design.md §9 DayTypeBadge / week.md legend). */
export const DAY_TYPE_META: Readonly<Record<DayType, { label: string; Icon: LucideIcon }>> = {
  normal: { label: 'Standard', Icon: CalendarDays },
  travel: { label: 'Travel', Icon: Plane },
  rest: { label: 'Rest', Icon: Moon },
  training: { label: 'Training', Icon: Zap },
  social: { label: 'Social', Icon: Diamond },
  prep: { label: 'Prep day', Icon: ChefHat },
}

export interface DayTypeBadgeProps {
  type: DayType
  className?: string
  /** icon-only tiny chip for honeycomb corners */
  compact?: boolean
}

/**
 * Tiny icon + label chip for Travel / Rest / Training / Social / Prep days
 * (week.md: badge sits top-left on the cell; sage chip, never for 'normal').
 */
function DayTypeBadge({ type, className, compact = false }: DayTypeBadgeProps) {
  if (type === 'normal') return null
  const { label, Icon } = DAY_TYPE_META[type]
  return (
    <span
      className={cn(
        't-label inline-flex items-center gap-1 rounded-r-pill border border-green/40 bg-sage-mist text-forest',
        compact ? 'px-1.5 py-1' : 'px-2 py-1',
        className,
      )}
      title={label}
      aria-label={`Day type: ${label}`}
    >
      <Icon size={11} strokeWidth={1.8} aria-hidden="true" />
      {!compact && <span className="text-[9px]">{label}</span>}
    </span>
  )
}

export default memo(DayTypeBadge)
