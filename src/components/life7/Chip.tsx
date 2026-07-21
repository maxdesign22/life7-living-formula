import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface ChipProps {
  children: ReactNode
  variant?: 'sage' | 'gold' | 'burgundy-outline' | 'glass'
  selected?: boolean
  onClick?: () => void
  icon?: ReactNode
  className?: string
}

const VARIANTS: Record<string, string> = {
  sage: 'bg-sage-mist text-forest border border-transparent',
  gold: 'bg-sunrise text-ink border border-transparent',
  'burgundy-outline': 'bg-transparent text-burgundy border border-burgundy/40',
  glass: 'glass text-ink-soft',
}

const SELECTED: Record<string, string> = {
  sage: 'bg-green text-soft-white shadow-e-1',
  gold: 'bg-champagne text-ink shadow-e-1',
  'burgundy-outline': 'bg-burgundy text-soft-white border-burgundy shadow-e-1',
  glass: 'bg-soft-white text-forest shadow-e-1',
}

/** Pill chip/tag (design.md §9) with spring-lift selected state. */
export default function Chip({ children, variant = 'sage', selected = false, onClick, icon, className }: ChipProps) {
  const cls = cn(
    't-ui-sm inline-flex items-center gap-1.5 rounded-r-pill px-3 py-1.5 transition-colors duration-180 ease-soft',
    VARIANTS[variant],
    selected && SELECTED[variant],
    onClick && 'cursor-pointer',
    className,
  )
  if (onClick) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 140, damping: 22 }}
        className={cls}
      >
        {icon}
        {children}
      </motion.button>
    )
  }
  return (
    <motion.span layout="position" transition={{ type: 'spring', stiffness: 140, damping: 22 }} className={cls}>
      {icon}
      {children}
    </motion.span>
  )
}
