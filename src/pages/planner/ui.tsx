/**
 * Small shared UI primitives for the Planner / Progress / Settings pages.
 * (Page-local — the shared component library in src/components is untouched.)
 */
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]
export const EASE_SOFT = [0.4, 0, 0.2, 1] as [number, number, number, number]

/** Kinetic title: words rise inside overflow masks, stagger 55ms (design.md §5.11) */
export function KineticWords({ text, className }: { text: string; className?: string }) {
  const words = text.split(' ')
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.64, delay: 0.05 + i * 0.055, ease: EASE_GLIDE }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/** Toggle (design.md §9): 44×26, track cream→sage when on, soft-white knob, spring. */
export function Toggle({
  on,
  onChange,
  disabled = false,
  label,
}: {
  on: boolean
  onChange: () => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'relative h-[26px] w-[44px] shrink-0 rounded-full border border-sand transition-colors duration-200 ease-soft',
        on ? 'bg-sage' : 'bg-cream',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <motion.span
        className="absolute top-[2px] h-5 w-5 rounded-full bg-soft-white shadow-e-1"
        animate={{ left: on ? 21 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      />
    </button>
  )
}

/** Segmented control (design.md §9): cream pill track, soft-white thumb slides via layoutId. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  id,
  className,
}: {
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  id: string
  className?: string
}) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-r-pill bg-cream p-1', className)}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              't-ui-sm relative rounded-r-pill px-4 py-1.5 transition-colors duration-180',
              active ? 'text-forest' : 'text-ink-soft hover:text-forest',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-r-pill bg-soft-white shadow-e-1"
                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Format minutes since midnight as 'HH:MM'. */
export function fmtTime(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440
  const hh = String(Math.floor(m / 60)).padStart(2, '0')
  const mm = String(m % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

/** Small gold section header: label eyebrow + hairline. */
export function SectionHeader({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="t-label shrink-0 text-gold-deep">{children}</span>
      <span className="h-px flex-1 bg-line" />
      {right}
    </div>
  )
}
