import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface GlassCardProps {
  children: ReactNode
  className?: string
  /** gold outer glow bloom on hover (AI / primary surfaces) */
  glow?: 'gold' | 'none'
  /** disable hover lift */
  flat?: boolean
  /** radius preset: r-lg standard, r-xl hero */
  size?: 'lg' | 'xl'
  onClick?: () => void
}

/**
 * Glass surface card (design.md §9): glass bg, e-1, hover lift + e-2 (220ms),
 * optional gold glow bloom.
 */
export default function GlassCard({
  children,
  className,
  glow = 'none',
  flat = false,
  size = 'lg',
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass shadow-e-1 transition-all duration-220 ease-soft',
        size === 'lg' ? 'rounded-r-lg' : 'rounded-r-xl',
        !flat && 'hover:-translate-y-[3px] hover:shadow-e-2',
        glow === 'gold' && 'hover:shadow-gold-glow',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}
