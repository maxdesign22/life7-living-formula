import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface AILineProps {
  children: ReactNode
  className?: string
  /** delay (s) before the diamond rotates in */
  delay?: number
}

/**
 * The editorial AI voice line (design.md §9): Fraunces italic preceded by a
 * 6px gold diamond that rotates 45° on mount.
 */
export default function AILine({ children, className, delay = 0 }: AILineProps) {
  return (
    <p className={cn('t-serif-quote flex items-start gap-3 text-ink', className)}>
      <motion.span
        aria-hidden="true"
        className="mt-[9px] inline-block h-1.5 w-1.5 shrink-0 bg-champagne"
        initial={{ rotate: 0, opacity: 0 }}
        animate={{ rotate: 45, opacity: 1 }}
        transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <span>{children}</span>
    </p>
  )
}
