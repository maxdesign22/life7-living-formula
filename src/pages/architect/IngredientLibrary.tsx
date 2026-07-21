/**
 * LEFT zone — Ingredient Library (meal-architect.md):
 * search, 10-category browsing, At home / Discover sections, inline
 * expansion with quantity presets, ghost-fly add, and the Today's
 * Constraints block (dietary chips, budget + cooking-time sliders).
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, SyntheticEvent as ReactSyntheticEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Plus, Search } from 'lucide-react'
import { Chip } from '@/components/life7'
import { cn } from '@/lib/utils'
import {
  DISCOVER_INGREDIENTS,
  OWNED_INGREDIENTS,
  type Ingredient,
  type IngredientCategory,
} from '@/data/ingredients'
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  EASE_GLIDE,
  RESTRICTIONS,
  isExcludedBy,
  priceLabel,
  type RestrictionId,
} from './model'
import { ArchSlider, ArchStepper } from './controls'

export interface ConstraintState {
  readonly restrictions: readonly RestrictionId[]
  readonly budgetEur: number
  readonly maxMinutes: number
}

// -------------------------------------------------------------- tiny pieces

/** At-home dot; gently pulses when the item is used today. */
const HomeDot = memo(function HomeDot({ pulse }: { pulse: boolean }) {
  return (
    <motion.span
      aria-label="available at home"
      className="inline-block h-2 w-2 shrink-0 rounded-full bg-green"
      animate={pulse ? { scale: [1, 1.35, 1], opacity: [1, 0.6, 1] } : undefined}
      transition={pulse ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : undefined}
    />
  )
})

function MacroCell({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex flex-col items-center rounded-r-sm bg-cream/70 px-1 py-1">
      <span className="t-metric-sm tnum text-[12px] text-ink">{value}</span>
      <span className="t-label text-[8px] text-ink-faint">{label}</span>
    </span>
  )
}

// ------------------------------------------------------------ ingredient row

interface RowProps {
  ing: Ingredient
  index: number
  dimmed: boolean
  usedToday: boolean
  inMeal: boolean
  expanded: boolean
  onToggle: () => void
  onAdd: (ing: Ingredient, grams: number, rect: DOMRect) => void
}

const IngredientRow = memo(function IngredientRow({
  ing,
  index,
  dimmed,
  usedToday,
  inMeal,
  expanded,
  onToggle,
  onAdd,
}: RowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [justAdded, setJustAdded] = useState(false)
  const [qty, setQty] = useState(100)

  const fireAdd = (grams: number) => {
    if (dimmed) return
    const rect = rowRef.current?.getBoundingClientRect()
    if (rect) onAdd(ing, grams, rect)
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 900)
  }

  return (
    <motion.div
      ref={rowRef}
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: dimmed ? 0.35 : 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 12) * 0.04, ease: EASE_GLIDE }}
      className="rounded-r-md"
    >
      <div
        className={cn(
          'group flex cursor-pointer items-center gap-3 rounded-r-md px-2 py-2 transition-colors duration-180 hover:bg-soft-white/80',
          expanded && 'bg-soft-white/80',
        )}
        onClick={onToggle}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
      >
        {/* illustration plate */}
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center bg-cream"
          style={{ borderRadius: '46% 54% 52% 48% / 48% 46% 54% 52%' }}
        >
          <img src={`/${ing.image}`} alt="" className="h-11 w-11 object-contain" draggable={false} loading="lazy" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className={cn('t-ui-sm truncate text-ink', dimmed && 'line-through')}>{ing.name}</span>
            {ing.owned && <HomeDot pulse={usedToday} />}
          </span>
          <span className="mt-0.5 block text-[11px] font-medium text-ink-faint">
            {ing.per100g.kcal} kcal · P {ing.per100g.protein}g <span className="text-ink-faint/70">/100 g</span>
          </span>
          <span className="t-label mt-0.5 block text-[9px] normal-case tracking-normal text-gold-deep">
            {priceLabel(ing)}
          </span>
        </span>

        {/* add button: rotates 90° → check with sage ripple */}
        <motion.button
          type="button"
          aria-label={`Add ${ing.name}`}
          disabled={dimmed}
          onClick={(e) => {
            e.stopPropagation()
            fireAdd(100)
          }}
          whileTap={{ scale: 0.88 }}
          className={cn(
            'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300',
            justAdded ? 'bg-sage' : 'glass hover:bg-soft-white',
            inMeal && !justAdded && 'border-champagne/60',
          )}
        >
          <motion.span
            animate={{ rotate: justAdded ? 90 : 0 }}
            transition={{ duration: 0.3, ease: EASE_GLIDE }}
            className="flex"
          >
            {justAdded ? (
              <Check size={14} strokeWidth={2.5} className="text-forest" />
            ) : (
              <Plus size={14} strokeWidth={2} className="text-forest" />
            )}
          </motion.span>
          <AnimatePresence>
            {justAdded && (
              <motion.span
                className="pointer-events-none absolute inset-0 rounded-full border-2 border-sage"
                initial={{ opacity: 0.9, scale: 0.6 }}
                animate={{ opacity: 0, scale: 1.9 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: EASE_GLIDE }}
              />
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* inline expansion: full macros + quantity presets */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="overflow-hidden"
          >
            <div className="mx-2 mb-2 rounded-r-sm bg-soft-white/70 p-3">
              <div className="grid grid-cols-5 gap-1">
                <MacroCell label="kcal" value={`${ing.per100g.kcal}`} />
                <MacroCell label="prot" value={`${ing.per100g.protein}`} />
                <MacroCell label="carb" value={`${ing.per100g.carbs}`} />
                <MacroCell label="fat" value={`${ing.per100g.fat}`} />
                <MacroCell label="fibre" value={`${ing.per100g.fibre}`} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <ArchStepper value={qty} onChange={setQty} min={10} max={600} compact ariaLabel={`Quantity of ${ing.name}`} />
                <button
                  type="button"
                  disabled={dimmed}
                  onClick={() => fireAdd(qty)}
                  className="t-ui-sm rounded-r-pill bg-forest px-3.5 py-1.5 text-soft-white shadow-e-1 transition-shadow hover:shadow-gold-glow disabled:opacity-40"
                >
                  Add {qty} g
                </button>
              </div>
              <div className="mt-2 flex gap-1.5">
                {[50, 100, 150, 200].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setQty(g)}
                    className={cn(
                      't-label rounded-r-pill px-2 py-1 text-[9px] transition-colors duration-180',
                      qty === g ? 'bg-sage text-forest' : 'bg-cream text-ink-soft hover:bg-sage-mist',
                    )}
                  >
                    {g} g
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

// -------------------------------------------------------------- category rail

interface CategoryRailProps {
  value: 'all' | IngredientCategory
  onChange: (c: 'all' | IngredientCategory) => void
}

/**
 * Horizontally scrollable chip rail — never clips a chip. Mouse-wheel motion
 * is translated into horizontal scrolling (native, non-passive listener so
 * Lenis leaves it alone via data-lenis-prevent), mouse drag scrolls too, and
 * soft edge fades signal that more categories live off-canvas.
 */
const CategoryRail = memo(function CategoryRail({ value, onChange }: CategoryRailProps) {
  const railRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startScroll: number; moved: boolean } | null>(null)
  const movedRef = useRef(false)
  const [edges, setEdges] = useState({ left: false, right: false })

  const updateEdges = useCallback(() => {
    const el = railRef.current
    if (!el) return
    const left = el.scrollLeft > 4
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
    setEdges((e) => (e.left === left && e.right === right ? e : { left, right }))
  }, [])

  useEffect(() => {
    const el = railRef.current
    if (!el) return
    updateEdges()
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth + 1) return
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      const atStart = el.scrollLeft <= 0 && delta < 0
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && delta > 0
      if (atStart || atEnd) return // hand the gesture back to the page at the ends
      e.preventDefault()
      e.stopPropagation()
      el.scrollLeft += delta
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    const ro = new ResizeObserver(updateEdges)
    ro.observe(el)
    return () => {
      el.removeEventListener('wheel', onWheel)
      ro.disconnect()
    }
  }, [updateEdges])

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = railRef.current
    if (!el || e.pointerType !== 'mouse') return // touch scrolls natively
    dragRef.current = { startX: e.clientX, startScroll: el.scrollLeft, moved: false }
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    const el = railRef.current
    if (!d || !el) return
    const dx = e.clientX - d.startX
    if (!d.moved && Math.abs(dx) > 4) {
      d.moved = true
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* pointer already released */
      }
    }
    if (d.moved) el.scrollLeft = d.startScroll - dx
  }
  const endDrag = () => {
    if (dragRef.current?.moved) {
      movedRef.current = true
      window.setTimeout(() => {
        movedRef.current = false
      }, 90)
    }
    dragRef.current = null
  }
  const suppressClickAfterDrag = (e: ReactSyntheticEvent) => {
    if (movedRef.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <div className="relative mt-3">
      <div
        ref={railRef}
        data-lenis-prevent
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={suppressClickAfterDrag}
        onScroll={updateEdges}
        className="-mx-1 flex cursor-grab select-none gap-1.5 overflow-x-auto px-1 pb-1 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Chip variant="sage" selected={value === 'all'} onClick={() => onChange('all')} className="shrink-0">
          All
        </Chip>
        {CATEGORY_ORDER.map((c) => (
          <Chip key={c} variant="sage" selected={value === c} onClick={() => onChange(c)} className="shrink-0">
            {CATEGORY_LABELS[c]}
          </Chip>
        ))}
      </div>
      {/* edge fades */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-7 bg-gradient-to-r from-soft-white via-soft-white/70 to-transparent transition-opacity duration-220"
        style={{ opacity: edges.left ? 1 : 0 }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-7 bg-gradient-to-l from-soft-white via-soft-white/70 to-transparent transition-opacity duration-220"
        style={{ opacity: edges.right ? 1 : 0 }}
      />
    </div>
  )
})

// ------------------------------------------------------------------ library

export interface IngredientLibraryProps {
  constraints: ConstraintState
  onConstraintsChange: (c: ConstraintState) => void
  /** fired while constraint sliders move — right panel shows a 300ms recompute shimmer */
  onRecomputeNudge: () => void
  usedToday: ReadonlySet<string>
  inMeal: ReadonlySet<string>
  onAdd: (ing: Ingredient, grams: number, rect: DOMRect) => void
}

export default function IngredientLibrary({
  constraints,
  onConstraintsChange,
  onRecomputeNudge,
  usedToday,
  inMeal,
  onAdd,
}: IngredientLibraryProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | IngredientCategory>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const matches = (ing: Ingredient) => {
    if (category !== 'all' && ing.category !== category) return false
    if (query && !ing.name.toLowerCase().includes(query.trim().toLowerCase())) return false
    return true
  }

  const owned = useMemo(() => OWNED_INGREDIENTS.filter(matches), [query, category])
  const discover = useMemo(() => DISCOVER_INGREDIENTS.filter(matches), [query, category])

  const toggleRestriction = (id: RestrictionId) => {
    const next = constraints.restrictions.includes(id)
      ? constraints.restrictions.filter((r) => r !== id)
      : [...constraints.restrictions, id]
    onConstraintsChange({ ...constraints, restrictions: next })
    onRecomputeNudge()
  }

  const renderSection = (label: string, list: readonly Ingredient[], startIndex: number) =>
    list.length > 0 && (
      <div key={label}>
        <p className="t-label px-2 pb-1 pt-3 text-gold-deep">{label}</p>
        {list.map((ing, i) => (
          <IngredientRow
            key={ing.id}
            ing={ing}
            index={startIndex + i}
            dimmed={isExcludedBy(ing, constraints.restrictions)}
            usedToday={usedToday.has(ing.id)}
            inMeal={inMeal.has(ing.id)}
            expanded={expandedId === ing.id}
            onToggle={() => setExpandedId(expandedId === ing.id ? null : ing.id)}
            onAdd={onAdd}
          />
        ))}
      </div>
    )

  return (
    <div className="glass flex h-full flex-col overflow-hidden rounded-r-xl shadow-e-1">
      {/* sticky header: search + categories */}
      <div className="shrink-0 px-4 pt-4">
        <p className="t-label mb-2 text-ink-soft">Ingredient library</p>
        <label className="flex items-center gap-2 rounded-r-pill bg-soft-white/80 px-3.5 py-2 shadow-e-1">
          <Search size={15} strokeWidth={1.8} className="shrink-0 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ingredients…"
            className="t-ui-sm w-full bg-transparent text-ink outline-none placeholder:text-ink-faint"
            aria-label="Search ingredients"
          />
        </label>
        <CategoryRail value={category} onChange={setCategory} />
      </div>

      {/* scrollable list — data-lenis-prevent keeps native wheel scrolling alive
          (Lenis on the outer wrapper would otherwise swallow hover wheel events) */}
      <div
        data-lenis-prevent
        className="mt-1 max-h-[46dvh] flex-1 overflow-y-auto px-2 pb-3 min-[1280px]:max-h-none"
        key={`${category}-${query}`}
      >
        {renderSection('At home', owned, 0)}
        {renderSection('Discover', discover, owned.length)}
        {owned.length === 0 && discover.length === 0 && (
          <p className="t-serif-quote px-4 py-10 text-center text-[16px] text-ink-faint">
            Nothing in the pantry matches that search.
          </p>
        )}
      </div>

      {/* constraints block */}
      <div className="shrink-0 border-t border-line bg-soft-white/50 px-4 py-3">
        <p className="t-label mb-2 text-ink-soft">Today's constraints</p>
        <div className="flex flex-wrap gap-1.5">
          {RESTRICTIONS.map((r) => (
            <Chip
              key={r.id}
              variant="sage"
              selected={constraints.restrictions.includes(r.id)}
              onClick={() => toggleRestriction(r.id)}
              className="px-2.5 py-1 text-[11px]"
            >
              {r.label}
            </Chip>
          ))}
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="t-label text-[9px] text-ink-faint">Budget per meal</span>
            <span className="t-metric-sm tnum text-[13px] text-ink">€{constraints.budgetEur.toFixed(2)}</span>
          </div>
          <ArchSlider
            min={2}
            max={20}
            step={0.5}
            value={constraints.budgetEur}
            onChange={(v) => {
              onConstraintsChange({ ...constraints, budgetEur: v })
              onRecomputeNudge()
            }}
            format={(v) => `€${v.toFixed(2)}`}
            ariaLabel="Budget per meal in euros"
          />
        </div>
        <div className="mt-1">
          <div className="flex items-baseline justify-between">
            <span className="t-label text-[9px] text-ink-faint">Cooking time</span>
            <span className="t-metric-sm tnum text-[13px] text-ink">≤ {constraints.maxMinutes} min</span>
          </div>
          <ArchSlider
            min={5}
            max={60}
            step={5}
            value={constraints.maxMinutes}
            onChange={(v) => {
              onConstraintsChange({ ...constraints, maxMinutes: v })
              onRecomputeNudge()
            }}
            format={(v) => `${v} min`}
            ariaLabel="Maximum cooking time in minutes"
          />
          <p className="t-serif-quote -mt-0.5 text-[13px] text-ink-faint">
            LIFE7 will favour faster assemblies.
          </p>
        </div>
      </div>
    </div>
  )
}
