import { useRef } from 'react'
import type { ReactNode, MouseEvent as ReactMouseEvent } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface MagneticButtonProps {
  children: ReactNode
  variant?: 'primary' | 'gold' | 'glass' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  /** pill for CTAs, md for inline (design.md §9) */
  shape?: 'pill' | 'md'
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
  icon?: ReactNode
}

const VARIANTS: Record<string, string> = {
  primary: 'bg-forest text-soft-white shadow-e-1 hover:shadow-gold-glow',
  gold: 'bg-sunrise-gold text-ink shadow-e-1 hover:shadow-gold-glow',
  glass: 'glass text-forest hover:shadow-e-2',
  ghost:
    'bg-transparent text-forest underline-offset-4 decoration-champagne decoration-[1.5px] hover:underline shadow-none',
}

const SIZES: Record<string, string> = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-11 px-6 text-sm',
  lg: 'h-[52px] px-8 text-[15px]',
}

/**
 * Primary action button (design.md §5.10 / §9): magnetic cursor pull up to
 * 5px within 48px, gold glow bloom on hover, press scale 0.97.
 */
export default function MagneticButton({
  children,
  variant = 'primary',
  size = 'md',
  shape = 'pill',
  onClick,
  type = 'button',
  disabled = false,
  className,
  icon,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 140, damping: 22 })
  const sy = useSpring(y, { stiffness: 140, damping: 22 })

  const handleMove = (e: ReactMouseEvent) => {
    const el = ref.current
    if (!el || disabled) return
    const rect = el.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    const dist = Math.hypot(dx, dy)
    const radius = Math.max(rect.width, rect.height) / 2 + 48
    if (dist < radius) {
      const pull = 5 * (1 - dist / radius)
      x.set((dx / (dist || 1)) * pull)
      y.set((dy / (dist || 1)) * pull)
    } else {
      x.set(0)
      y.set(0)
    }
  }

  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        't-ui-sm inline-flex items-center justify-center gap-2 font-semibold transition-shadow duration-300 ease-soft',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne',
        shape === 'pill' ? 'rounded-r-pill' : 'rounded-r-md',
        SIZES[size],
        VARIANTS[variant],
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      {icon}
      {children}
    </motion.button>
  )
}
