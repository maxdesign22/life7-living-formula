/**
 * AI Week Generator — page-local building blocks.
 * Kinetic title words, animated counters, the bespoke LIFE7 slider,
 * numeric stepper fields, segmented control, chip input and the meals-per-day
 * sun-arc micro diagram. All motion follows design.md §5.
 */
import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, animate, motion } from 'framer-motion'
import { Minus, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Chip } from '@/components/life7'
import type { ChipProps } from '@/components/life7'
import { getIngredient } from '@/data/ingredients'
import type { MealItem } from '@/lib/nutrition'

export const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]
export const EASE_SOFT = [0.4, 0, 0.2, 1] as [number, number, number, number]
export const EASE_SPRING = { type: 'spring', stiffness: 140, damping: 22 } as const

/* ------------------------------------------------------------------ text */

/** Kinetic title: words rise inside overflow masks, stagger 55ms (§5.11). */
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
            {/* nbsp: a plain trailing space collapses inside the inline-block mask */}
            {i < words.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/** Count-up metric, 900ms ease-glide from 0 (§5.3). */
export function AnimatedNumber({
  value,
  delay = 0,
  duration = 0.9,
  format = (n: number) => String(Math.round(n)),
  className,
}: {
  value: number
  delay?: number
  duration?: number
  format?: (n: number) => string
  className?: string
}) {
  const [display, setDisplay] = useState(() => format(0))
  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      delay,
      ease: EASE_GLIDE,
      onUpdate: (v) => setDisplay(format(v)),
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay, duration])
  return <span className={cn('tnum', className)}>{display}</span>
}

/* ----------------------------------------------------------------- fields */

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <span className="t-label text-ink-soft">{children}</span>
      {hint && <span className="t-ui-sm text-ink-faint">{hint}</span>}
    </div>
  )
}

/** Shake wrapper — validation feedback x ±6px (generator.md). */
export function Shake({ tick, children }: { tick: number; children: ReactNode }) {
  return (
    <motion.div
      key={tick}
      animate={tick > 0 ? { x: [0, -6, 6, -4, 4, 0] } : undefined}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

/** Numeric input with steppers, metric-sm value (generator.md step 1). */
export function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit: string
  onChange: (v: number) => void
}) {
  const clampSet = (v: number) => onChange(Math.min(max, Math.max(min, v)))
  return (
    <div className="min-w-0">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => clampSet(value - step)}
          className="glass flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-forest shadow-e-1 transition-shadow hover:shadow-e-2"
        >
          <Minus size={12} strokeWidth={2.5} />
        </button>
        <div className="flex h-9 min-w-[64px] items-center justify-center gap-1 rounded-r-sm bg-cream px-2">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            aria-label={label}
            onChange={(e) => {
              const n = Number(e.target.value)
              if (Number.isFinite(n)) clampSet(n)
            }}
            className="t-metric-sm w-12 bg-transparent text-right text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="t-ui-sm text-ink-faint">{unit}</span>
        </div>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => clampSet(value + step)}
          className="glass flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-forest shadow-e-1 transition-shadow hover:shadow-e-2"
        >
          <Plus size={12} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

/** LIFE7 slider (§9): cream track, gold fill, soft-white thumb, drag bubble. */
export function LifeSlider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  format,
  caption,
}: {
  label: string
  min: number
  max: number
  step?: number
  value: number
  onChange: (v: number) => void
  format: (v: number) => string
  caption?: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const pct = ((value - min) / (max - min)) * 100

  const setFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const raw = min + ratio * (max - min)
    onChange(Math.round(raw / step) * step)
  }

  return (
    <div>
      <FieldLabel hint={caption}>{label}</FieldLabel>
      <div className="flex items-center gap-3">
        <div
          ref={trackRef}
          role="slider"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(max, value + step))
            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(min, value - step))
          }}
          onPointerDown={(e) => {
            ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
            setDragging(true)
            setFromClientX(e.clientX)
          }}
          onPointerMove={(e) => dragging && setFromClientX(e.clientX)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          className="relative h-6 flex-1 cursor-pointer touch-none select-none"
        >
          <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-cream" />
          <div
            className="bg-sunrise-gold absolute top-1/2 h-1 -translate-y-1/2 rounded-full"
            style={{ width: `${pct}%` }}
          />
          <motion.div
            className="absolute top-1/2 h-5 w-5 rounded-full border border-champagne bg-soft-white shadow-e-1"
            style={{ left: `${pct}%`, x: '-50%', y: '-50%' }}
            animate={{ scale: dragging ? 1.15 : 1 }}
            transition={EASE_SPRING}
          />
          <AnimatePresence>
            {dragging && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="glass-strong t-label pointer-events-none absolute -top-7 -translate-x-1/2 rounded-r-sm px-2 py-1 text-ink shadow-e-1"
                style={{ left: `${pct}%` }}
              >
                {format(value)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <span className="t-metric-sm w-16 text-right text-ink">{format(value)}</span>
      </div>
    </div>
  )
}

/** Segmented control (§9): cream pill track, sliding soft-white thumb. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  ariaLabel: string
}) {
  const id = useId()
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex rounded-r-pill bg-cream p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            // flex-auto sizes each segment to its label before sharing leftover
            // space, so the longest label ("Other") can never be clipped by an
            // equal-thirds split, even in the narrowest grid track
            't-ui-sm relative flex h-7 flex-auto items-center justify-center whitespace-nowrap rounded-r-pill px-2 transition-colors duration-180',
            value === opt.value ? 'text-forest' : 'text-ink-soft hover:text-forest',
          )}
        >
          {value === opt.value && (
            <motion.span
              layoutId={`seg-${id}`}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="absolute inset-0 rounded-r-pill bg-soft-white shadow-e-1"
            />
          )}
          <span className="relative">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}

/** Chip input (type → enter → chip springs in). Chips removable. */
export function ChipInput({
  values,
  onAdd,
  onRemove,
  placeholder,
  variant = 'sage',
  ariaLabel,
}: {
  values: readonly string[]
  onAdd: (v: string) => void
  onRemove: (v: string) => void
  placeholder: string
  variant?: ChipProps['variant']
  ariaLabel: string
}) {
  const [draft, setDraft] = useState('')
  const commit = () => {
    const v = draft.trim()
    if (!v) return
    if (!values.some((x) => x.toLowerCase() === v.toLowerCase())) onAdd(v)
    setDraft('')
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <AnimatePresence initial={false}>
        {values.map((v) => (
          <motion.span
            key={v}
            layout
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={EASE_SPRING}
            className="inline-flex"
          >
            <Chip variant={variant} className="max-w-full pr-1.5 [overflow-wrap:anywhere]">
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={() => onRemove(v)}
                className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-ink/10"
              >
                <X size={10} strokeWidth={3} />
              </button>
            </Chip>
          </motion.span>
        ))}
      </AnimatePresence>
      <input
        value={draft}
        aria-label={ariaLabel}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
        }}
        onBlur={commit}
        placeholder={placeholder}
        className="t-ui-md h-9 min-w-[140px] flex-1 rounded-r-sm bg-cream/70 px-3 text-ink placeholder:text-ink-faint focus:bg-cream"
      />
    </div>
  )
}

/* --------------------------------------------------------------- sun arc */

/**
 * Meals-per-day sun-arc micro diagram: a dawn arc with one dot per meal,
 * dots animate in/out as the stepper changes (generator.md step 2).
 */
export function SunArcMeals({ count }: { count: number }) {
  const cx = 70
  const cy = 58
  const r = 46
  const dots = Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const angle = Math.PI * (1 - (0.14 + t * 0.72))
    return { i, x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) }
  })
  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="64" viewBox="0 0 140 64" fill="none" aria-hidden="true">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} stroke="#E9DFC8" strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx - r - 6} cy={cy + 2} r="7" fill="url(#sunarc-core)" />
        <defs>
          <radialGradient id="sunarc-core" cx="38%" cy="34%" r="72%">
            <stop offset="0%" stopColor="#FFE9B8" />
            <stop offset="55%" stopColor="#F2C14E" />
            <stop offset="100%" stopColor="#D9A84E" />
          </radialGradient>
        </defs>
        <AnimatePresence>
          {dots.map((d) => (
            <motion.circle
              key={d.i}
              cx={d.x}
              cy={d.y}
              r="4.5"
              fill="#FFFDF7"
              stroke="#D9B26A"
              strokeWidth="2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ ...EASE_SPRING, delay: d.i * 0.06 }}
              style={{ transformOrigin: `${d.x}px ${d.y}px` }}
            />
          ))}
        </AnimatePresence>
      </svg>
      <span className="t-label mt-1 text-ink-faint">{count} meals along the day</span>
    </div>
  )
}

/* ------------------------------------------------------------- formatting */

export const eur = (n: number) => `€${n.toFixed(2)}`

/** Display name without the parenthetical storage note ("Oats (dry)" → "Oats"). */
export function displayName(ingredientId: string): string {
  return getIngredient(ingredientId).name.replace(/\s*\(.*\)$/, '')
}

/** Piece-aware quantity label (generator.md: "Oats 60 g, banana 1 pc, …"). */
export function quantityLabel(item: MealItem): string {
  if (item.ingredientId === 'eggs') return `×${Math.max(1, Math.round(item.grams / 55))}`
  if (item.ingredientId === 'banana') {
    const pcs = item.grams / 120
    return `${Number.isInteger(pcs) ? pcs : pcs.toFixed(1)} pc`
  }
  return `${item.grams} g`
}

/** "Oats 60 g · banana 1 pc · walnuts 20 g · Greek yoghurt 150 g". */
export function itemsLine(items: readonly MealItem[]): string {
  return items
    .map((i) => {
      const name = displayName(i.ingredientId)
      const q = quantityLabel(i)
      const lower = q.endsWith('pc') || q.startsWith('×') ? name.toLowerCase() : name
      return `${lower} ${q}`
    })
    .join(' · ')
}
