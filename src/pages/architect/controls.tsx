/**
 * Meal Architect — page-local form controls built to design.md §9 specs:
 * Slider (gold fill, value bubble while dragging), Stepper (hold to
 * accelerate, sage tap ripple) and SegmentedControl (sliding spring thumb).
 */

import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_GLIDE } from './model'

// ------------------------------------------------------------------- Slider

export interface ArchSliderProps {
  min: number
  max: number
  step?: number
  value: number
  onChange: (v: number) => void
  format: (v: number) => string
  ariaLabel: string
  className?: string
}

/** Track 4px cream, gold gradient fill, 20px soft-white thumb, bubble while dragging. */
export function ArchSlider({ min, max, step = 1, value, onChange, format, ariaLabel, className }: ArchSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const pct = ((value - min) / (max - min)) * 100

  const setFromClientX = (clientX: number) => {
    const el = trackRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const raw = min + ratio * (max - min)
    const snapped = Math.round(raw / step) * step
    onChange(Math.min(max, Math.max(min, snapped)))
  }

  const onPointerDown = (e: ReactPointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    setFromClientX(e.clientX)
  }
  const onPointerMove = (e: ReactPointerEvent) => {
    if (dragging) setFromClientX(e.clientX)
  }
  const stop = () => setDragging(false)

  return (
    <div className={cn('relative select-none py-2', className)}>
      <div
        ref={trackRef}
        role="slider"
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stop}
        onPointerCancel={stop}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(max, value + step))
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(min, value - step))
        }}
        className="relative h-4 cursor-pointer touch-none"
      >
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-r-pill bg-cream" />
        <div
          className="bg-sunrise-gold absolute top-1/2 h-1 -translate-y-1/2 rounded-r-pill"
          style={{ width: `${pct}%` }}
        />
        {/* thumb */}
        <div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-champagne bg-soft-white shadow-e-1"
          style={{ left: `${pct}%` }}
        />
      </div>
      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ duration: 0.18, ease: EASE_GLIDE }}
            className="t-label pointer-events-none absolute -top-4 z-10 -translate-x-1/2 rounded-r-pill bg-forest px-2 py-1 text-soft-white shadow-e-2"
            style={{ left: `${pct}%` }}
          >
            {format(value)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ------------------------------------------------------------------ Stepper

export interface ArchStepperProps {
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  suffix?: string
  compact?: boolean
  ariaLabel?: string
  className?: string
}

/** − value + row; hold to accelerate; tap ripples a 24px sage ring. */
export function ArchStepper({
  value,
  onChange,
  step = 10,
  min = 0,
  max = 900,
  suffix = 'g',
  compact = false,
  ariaLabel,
  className,
}: ArchStepperProps) {
  const timer = useRef<number | undefined>(undefined)
  const valueRef = useRef(value)
  valueRef.current = value
  const [ripple, setRipple] = useState(0)

  const bump = (dir: 1 | -1) => {
    onChange(Math.min(max, Math.max(min, valueRef.current + dir * step)))
    setRipple((r) => r + 1)
  }

  /** hold to accelerate: repeat delay shrinks 340ms → 60ms */
  const startHold = (dir: 1 | -1) => {
    bump(dir)
    let delay = 300
    const tick = () => {
      bump(dir)
      delay = Math.max(60, delay * 0.72)
      timer.current = window.setTimeout(tick, delay)
    }
    timer.current = window.setTimeout(tick, 340)
  }
  const stopHold = () => {
    window.clearTimeout(timer.current)
  }
  useEffect(() => stopHold, [])

  const btn = cn(
    'relative flex items-center justify-center rounded-full glass text-forest transition-colors duration-180 hover:bg-soft-white disabled:opacity-40',
    compact ? 'h-6 w-6' : 'h-7 w-7',
  )

  return (
    <div className={cn('flex items-center gap-1.5', compact && 'gap-1', className)} aria-label={ariaLabel}>
      <button
        type="button"
        aria-label="decrease"
        disabled={value <= min}
        className={btn}
        onPointerDown={() => startHold(-1)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
      >
        <Minus size={compact ? 11 : 13} strokeWidth={2} />
      </button>
      <span className={cn('t-metric-sm tnum relative min-w-[52px] text-center text-ink', compact && 'min-w-[42px] text-[12px]')}>
        {value}
        <span className={cn('ml-0.5 text-[10px] font-semibold text-ink-faint', compact && 'text-[9px]')}>{suffix}</span>
        <AnimatePresence>
          {ripple > 0 && (
            <motion.span
              key={ripple}
              className="pointer-events-none absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sage"
              initial={{ opacity: 0.8, scale: 0.5 }}
              animate={{ opacity: 0, scale: 1.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE_GLIDE }}
            />
          )}
        </AnimatePresence>
      </span>
      <button
        type="button"
        aria-label="increase"
        disabled={value >= max}
        className={btn}
        onPointerDown={() => startHold(1)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
      >
        <Plus size={compact ? 11 : 13} strokeWidth={2} />
      </button>
    </div>
  )
}

// ---------------------------------------------------------- SegmentedControl

export interface SegmentedOption<T extends string> {
  readonly id: T
  readonly label: string
}

export interface ArchSegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (v: T) => void
  idPrefix: string
  className?: string
  small?: boolean
}

/** Pill track cream, soft-white thumb slides with layoutId spring (380ms). */
export function ArchSegmented<T extends string>({ options, value, onChange, idPrefix, className, small }: ArchSegmentedProps<T>) {
  return (
    <div className={cn('flex items-center gap-0.5 rounded-r-pill bg-cream p-1', className)} role="tablist">
      {options.map((opt) => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              'relative rounded-r-pill font-semibold transition-colors duration-180 ease-soft',
              small ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-[12px]',
              active ? 'text-forest' : 'text-ink-soft hover:text-forest',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${idPrefix}`}
                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                className="absolute inset-0 rounded-r-pill bg-soft-white shadow-e-1"
              />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ------------------------------------------------------------- tiny helpers

/** Gold delta chip, e.g. "Protein +28". */
export function DeltaChip({ label, delta, className }: { label: string; delta: number; className?: string }) {
  return (
    <span
      className={cn(
        't-label inline-flex items-center gap-1 rounded-r-pill bg-sage-mist px-2 py-[3px] text-[9px] text-forest',
        className,
      )}
    >
      {label}
      <span className="tnum text-gold-deep">{delta >= 0 ? `+${delta}` : delta}</span>
    </span>
  )
}
