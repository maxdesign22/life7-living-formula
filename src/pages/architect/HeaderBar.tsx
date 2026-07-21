/**
 * Meal Architect header: kinetic screen title + verbatim caption, the
 * meal-context selector (Thursday's four meals, crossfade) and the help
 * button opening the 3-step tour.
 */

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, CircleHelp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MealType } from '@/lib/scoring'
import { EASE_GLIDE } from './model'

/** Kinetic title: words rise inside overflow masks, stagger 55ms, 640ms (design.md §5.11). */
export function KineticWords({ text, className }: { text: string; className?: string }) {
  const words = text.split(' ')
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.64, delay: 0.05 + i * 0.055, ease: EASE_GLIDE }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

export const MEAL_CONTEXTS: readonly {
  readonly type: MealType
  readonly label: string
  readonly time: string
  readonly image: string
}[] = [
  { type: 'breakfast', label: 'Breakfast', time: '08:00', image: '/meal-oats-breakfast.jpg' },
  { type: 'lunch', label: 'Lunch', time: '12:30', image: '/meal-chicken-bowl.jpg' },
  { type: 'snack', label: 'Snack', time: '16:00', image: '/meal-yoghurt-snack.jpg' },
  { type: 'dinner', label: 'Dinner', time: '19:30', image: '/meal-salmon-greens.jpg' },
]

export interface HeaderBarProps {
  mealType: MealType
  onMealType: (t: MealType) => void
  onOpenTour: () => void
}

export default function HeaderBar({ mealType, onMealType, onOpenTour }: HeaderBarProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const current = MEAL_CONTEXTS.find((m) => m.type === mealType) ?? MEAL_CONTEXTS[1]

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [open])

  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div>
        <motion.span
          className="t-label block text-gold-deep"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          LIFE7 Living Formula
        </motion.span>
        <h1 className="t-display-lg mt-2 text-ink" style={{ fontSize: 'clamp(32px, 4vw, 44px)' }}>
          <KineticWords text="Meal Architect" />
        </h1>
        <motion.p
          className="t-serif-quote mt-1 max-w-[62ch] text-ink-soft"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          Your ingredients. Your goal. One better meal.
        </motion.p>
      </div>

      <div className="flex items-center gap-2.5">
        {/* meal context selector */}
        <div ref={wrapRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="glass flex items-center gap-2.5 rounded-r-pill py-1.5 pl-1.5 pr-3 shadow-e-1 transition-shadow duration-220 hover:shadow-e-2"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.img
                key={current.type}
                src={current.image}
                alt=""
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.25, ease: EASE_GLIDE }}
                className="h-8 w-8 rounded-full object-cover"
              />
            </AnimatePresence>
            <span className="text-left">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={current.type}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: EASE_GLIDE }}
                  className="t-ui-sm block text-ink"
                >
                  Thursday · {current.label}
                </motion.span>
              </AnimatePresence>
              <span className="t-label block text-[8.5px] text-ink-faint">{current.time}</span>
            </span>
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={cn('text-ink-faint transition-transform duration-200', open && 'rotate-180')}
            />
          </button>

          <AnimatePresence>
            {open && (
              <motion.ul
                role="listbox"
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.24, ease: EASE_GLIDE }}
                className="glass-strong absolute right-0 top-[calc(100%+8px)] z-50 w-[240px] rounded-r-lg p-1.5 shadow-e-2"
              >
                {MEAL_CONTEXTS.map((m) => (
                  <li key={m.type}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={m.type === mealType}
                      onClick={() => {
                        onMealType(m.type)
                        setOpen(false)
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-r-md px-2 py-2 text-left transition-colors duration-180 hover:bg-sage-mist',
                        m.type === mealType && 'bg-sage-mist/70',
                      )}
                    >
                      <img src={m.image} alt="" className="h-9 w-9 rounded-r-sm object-cover" />
                      <span className="flex-1">
                        <span className="t-ui-sm block text-ink">{m.label}</span>
                        <span className="t-label block text-[8.5px] text-ink-faint">{m.time}</span>
                      </span>
                      {m.type === mealType && <span className="h-1.5 w-1.5 rounded-full bg-champagne" />}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* help → 3-step tour */}
        <button
          type="button"
          aria-label="Open the tour"
          onClick={onOpenTour}
          className="glass flex h-10 w-10 items-center justify-center rounded-full shadow-e-1 transition-shadow duration-220 hover:shadow-gold-glow"
        >
          <CircleHelp size={17} strokeWidth={1.6} className="text-forest" />
        </button>
      </div>
    </header>
  )
}
