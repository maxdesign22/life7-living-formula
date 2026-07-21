/**
 * CENTER zone — Meal Canvas (meal-architect.md):
 * a refined ceramic plate — concentric rim rings, warm inner shadow, a soft
 * sunlight highlight and clear margins inside its panel — carrying the meal
 * as uniform premium medallion tokens (photo disc, gold hairline rim, name,
 * grams stepper, kcal/P micro-line). Tokens sit on balanced anchors that
 * adapt to the item count; the plate's centre shows a live plate summary
 * (or the LIFE7 mark when empty). Drag-rearrange, quantity steppers, the
 * popover editor, dust-poof removal and the Apply gold ring are preserved.
 */

import { memo, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { AnimatePresence, motion, useAnimationControls, useDragControls } from 'framer-motion'
import { Pencil, X } from 'lucide-react'
import { Life7Mark, MagneticButton } from '@/components/life7'
import { cn } from '@/lib/utils'
import { getIngredient, type IngredientCategory } from '@/data/ingredients'
import { scalePer100, type MealItem } from '@/lib/nutrition'
import type { MealType } from '@/lib/scoring'
import { CATEGORY_TINT, EASE_GLIDE, plateAnchors, type SlotPosition } from './model'
import { ArchSegmented, ArchSlider, ArchStepper } from './controls'
import TweenNumber from './TweenNumber'

const MEAL_TYPE_OPTIONS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'snack', label: 'Snack' },
  { id: 'dinner', label: 'Dinner' },
] as const

/** "Replace with…" suggestions per category (first not already on the plate wins). */
const REPLACE_SUGGESTIONS: Record<IngredientCategory, readonly string[]> = {
  protein: ['salmon-fillet', 'eggs', 'chicken-breast'],
  vegetables: ['spinach', 'broccoli', 'tomato'],
  fruit: ['blueberries', 'banana', 'avocado'],
  grains: ['oats', 'sourdough', 'rice'],
  legumes: ['lentils'],
  dairy: ['feta', 'greek-yoghurt'],
  'nuts-seeds': ['walnuts'],
  oils: ['olive-oil'],
  spices: ['cinnamon', 'black-pepper'],
  drinks: ['green-tea', 'coffee'],
}

// ------------------------------------------------------------- plate visual

interface PlateVisualProps {
  empty: boolean
  count: number
  totalKcal: number
  flashKey: number
  goldRingKey: number
}

/** The ceramic plate — memoized so perpetual breathing never resets. */
const PlateVisual = memo(function PlateVisual({ empty, count, totalKcal, flashKey, goldRingKey }: PlateVisualProps) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ scale: 0.94, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE_GLIDE }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ scale: [1, 1.012, 1] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Photographic ceramic plate. The clean centre remains available for
            interactive ingredients and the live nutrition summary. */}
        <img
          src="/plate-photorealistic.webp"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none rounded-[28px] object-cover"
          style={{ boxShadow: '0 30px 64px -24px rgba(59,48,26,0.24)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[7%] rounded-full"
          style={{ boxShadow: 'inset 0 0 22px rgba(255,253,247,0.18)' }}
        />

        {/* sage flash on drop */}
        <AnimatePresence>
          {flashKey > 0 && (
            <motion.div
              key={flashKey}
              className="pointer-events-none absolute -inset-1 rounded-full"
              style={{ border: '2px solid rgba(92,122,84,0.7)' }}
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE_GLIDE }}
            />
          )}
        </AnimatePresence>
        {/* expanding gold ring on Apply */}
        <AnimatePresence>
          {goldRingKey > 0 && (
            <motion.div
              key={`g${goldRingKey}`}
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ border: '2px solid rgba(217,178,106,0.85)' }}
              initial={{ opacity: 0.9, scale: 1 }}
              animate={{ opacity: 0, scale: 1.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: EASE_GLIDE }}
            />
          )}
        </AnimatePresence>

        {/* centre: LIFE7 mark when empty, live plate summary otherwise */}
        {empty ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
            <Life7Mark size={64} state="rest" />
            <p className="t-serif-quote mt-4 max-w-[26ch] text-[16px] leading-snug text-ink-faint">
              Add ingredients from your library. Watch the formula respond.
            </p>
          </div>
        ) : (
          count >= 2 && (
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 hidden aspect-square w-[26%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-champagne/25 bg-soft-white/55 text-center min-[1440px]:flex"
              style={{ boxShadow: 'inset 0 1px 5px rgba(59,48,26,0.05)' }}
            >
              <span className="t-label text-[8px] text-ink-faint">Plate total</span>
              <TweenNumber
                value={Math.round(totalKcal)}
                duration={0.6}
                className="t-display-sm tnum mt-0.5 leading-none text-ink"
              />
              <span className="t-label mt-1 text-[8px] text-gold-deep">
                kcal · {count} items
              </span>
            </div>
          )
        )}
      </motion.div>
    </motion.div>
  )
})

// -------------------------------------------------------------- float layer

/** Idle float y ±3px, phase-offset — memoized so re-renders never restart it. */
const FloatWrap = memo(function FloatWrap({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      animate={{ y: [3, -3, 3] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {children}
    </motion.div>
  )
})

// ------------------------------------------------------------ canvas object

interface CanvasObjectProps {
  item: MealItem
  index: number
  count: number
  slot: SlotPosition
  /** true for the demo composition loaded with the screen (stagger 130ms) */
  firstLoad: boolean
  onQuantity: (id: string, grams: number) => void
  onRemove: (id: string) => void
  onEdit: (id: string) => void
  onDrop: () => void
}

function CanvasObject({ item, index, count, slot, firstLoad, onQuantity, onRemove, onEdit, onDrop }: CanvasObjectProps) {
  const ing = getIngredient(item.ingredientId)
  const m = scalePer100(ing, item.grams)
  const settle = useAnimationControls()
  const dragControls = useDragControls()
  const [dragging, setDragging] = useState(false)
  const suppressClick = useRef(false)
  const anchor = plateAnchors(count)[index] ?? { fx: 0.5, fy: 0.5 }

  // dust poof particles (6), directions fixed per mount
  const dust = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + 0.4
        return { x: Math.cos(a) * (18 + (i % 3) * 7), y: Math.sin(a) * (16 + (i % 2) * 8) }
      }),
    [],
  )

  return (
    <motion.div
      className="absolute z-10 w-[clamp(76px,20%,104px)]"
      initial={false}
      animate={{ left: `${anchor.fx * 100}%`, top: `${anchor.fy * 100}%`, x: '-50%', y: '-50%' }}
      transition={{ type: 'spring', stiffness: 220, damping: 28 }}
    >
      <motion.div
        variants={{
          enter: { scale: 1, rotate: slot.rot, opacity: 1, y: 0 },
          exit: (i: number) => ({
            scale: 0.55,
            opacity: 0,
            y: -18 - i * 6,
            transition: { duration: 0.35, delay: i * 0.04, ease: EASE_GLIDE },
          }),
        }}
        initial={{ scale: 0.4, rotate: -6, opacity: 0, y: -30 }}
        animate="enter"
        exit="exit"
        custom={index}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: firstLoad ? index * 0.13 : 0 }}
      >
        <motion.div
          drag
          dragListener={false}
          dragControls={dragControls}
          dragMomentum={false}
          dragElastic={0.18}
          whileDrag={{ scale: 1.06 }}
          onDragStart={() => {
            setDragging(true)
            suppressClick.current = true
          }}
          onDragEnd={() => {
            setDragging(false)
            window.setTimeout(() => {
              suppressClick.current = false
            }, 140)
            void settle.start({ scale: [1, 1.04, 1], transition: { duration: 0.35, ease: EASE_GLIDE } })
            onDrop()
          }}
          className={cn('relative', dragging && 'z-30')}
        >
          <motion.div animate={settle}>
            <FloatWrap delay={index * 0.55}>
              <div
                onPointerDown={(e) => dragControls.start(e)}
                onClick={() => {
                  if (!suppressClick.current) onEdit(item.ingredientId)
                }}
                role="button"
                aria-label={`Edit ${ing.name}`}
                className="group relative flex w-full cursor-grab flex-col items-center active:cursor-grabbing"
                style={{ touchAction: 'none' }}
              >
                {/* full macro tooltip on hover */}
                <div className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-r-sm bg-forest px-2.5 py-1.5 opacity-0 shadow-e-2 transition-opacity duration-180 group-hover:opacity-100">
                  <span className="t-label text-[8px] text-soft-white/90">
                    P {m.protein.toFixed(1)} · C {m.carbs.toFixed(1)} · F {m.fat.toFixed(1)} · Fibre{' '}
                    {m.fibre.toFixed(1)}
                  </span>
                </div>

                {/* photo medallion — gold hairline rim, warm shadow, category tint */}
                <div className="relative aspect-square w-full">
                  <div
                    className="absolute inset-0 rounded-full border border-champagne/50"
                    style={{
                      background: `radial-gradient(68% 60% at 32% 26%, rgba(255,253,247,0.98), rgba(255,253,247,0.62) 58%, rgba(255,253,247,0.2)), ${CATEGORY_TINT[ing.category]}`,
                      boxShadow:
                        '0 12px 26px -10px rgba(59,48,26,0.28), 0 2px 6px rgba(59,48,26,0.06), inset 0 1.5px 4px rgba(255,255,255,0.9), inset 0 -6px 12px rgba(59,48,26,0.05)',
                    }}
                  />
                  <img
                    src={`/${ing.image}`}
                    alt={ing.name}
                    className="pointer-events-none absolute inset-0 m-auto h-[62%] w-[62%] object-contain drop-shadow-sm"
                    draggable={false}
                  />

                  {/* remove */}
                  <button
                    type="button"
                    aria-label={`Remove ${ing.name}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(item.ingredientId)
                    }}
                    className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-soft-white text-ink-soft opacity-0 shadow-e-1 transition-opacity duration-180 hover:text-burgundy group-hover:opacity-100"
                  >
                    <X size={11} strokeWidth={2.5} />
                  </button>

                  {/* edit */}
                  <button
                    type="button"
                    aria-label={`Edit ${ing.name}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(item.ingredientId)
                    }}
                    className="absolute -bottom-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-soft-white text-ink-faint opacity-0 shadow-e-1 transition-opacity duration-180 hover:text-gold-deep group-hover:opacity-100"
                  >
                    <Pencil size={10} strokeWidth={2} />
                  </button>

                  {/* dust poof — 6 particles fly out on removal */}
                  {dust.map((d, i) => (
                    <motion.span
                      key={i}
                      className="pointer-events-none absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-champagne opacity-0"
                      exit={{
                        opacity: [0, 1, 0],
                        x: d.x,
                        y: d.y,
                        scale: [0.6, 1, 0.2],
                        transition: { duration: 0.42, ease: EASE_GLIDE },
                      }}
                    />
                  ))}
                </div>

                {/* caption: name, grams stepper, kcal/P micro-line */}
                <p className="t-ui-sm mt-1.5 max-w-full truncate text-[12px] leading-tight text-ink">{ing.name}</p>
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5"
                >
                  <ArchStepper
                    value={item.grams}
                    onChange={(g) => onQuantity(item.ingredientId, g)}
                    min={10}
                    max={600}
                    compact
                    ariaLabel={`Quantity of ${ing.name}`}
                  />
                </div>
                {count < 7 && (
                  <p className="t-metric-sm tnum mt-0.5 hidden text-[11px] leading-tight text-ink-soft min-[1440px]:block">
                    {Math.round(m.kcal)} kcal <span className="text-ink-faint">·</span> P {Math.round(m.protein)}
                    <span className="text-ink-faint">g</span>
                  </p>
                )}
              </div>
            </FloatWrap>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// ------------------------------------------------------------------- canvas

export interface MealCanvasProps {
  items: readonly MealItem[]
  slots: Readonly<Record<string, SlotPosition>>
  mealName: string
  onMealName: (n: string) => void
  mealType: MealType
  onMealType: (t: MealType) => void
  onQuantity: (id: string, grams: number) => void
  onRemove: (id: string) => void
  onReplace: (fromId: string, toId: string) => void
  onClear: () => void
  onSave: () => void
  goldRingKey: number
  plateRef: RefObject<HTMLDivElement | null>
}

export default function MealCanvas({
  items,
  slots,
  mealName,
  onMealName,
  mealType,
  onMealType,
  onQuantity,
  onRemove,
  onReplace,
  onClear,
  onSave,
  goldRingKey,
  plateRef,
}: MealCanvasProps) {
  const [flashKey, setFlashKey] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editGrams, setEditGrams] = useState(100)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const initialIds = useRef<ReadonlySet<string>>(new Set(items.map((i) => i.ingredientId)))

  const editingItem = items.find((i) => i.ingredientId === editingId)
  const editingIng = editingItem ? getIngredient(editingItem.ingredientId) : null

  const totalKcal = useMemo(
    () => items.reduce((acc, i) => acc + scalePer100(getIngredient(i.ingredientId), i.grams).kcal, 0),
    [items],
  )

  const replacement = (fromId: string): string | null => {
    const cat = getIngredient(fromId).category
    const onPlate = new Set(items.map((i) => i.ingredientId))
    return (REPLACE_SUGGESTIONS[cat] ?? []).find((id) => id !== fromId && !onPlate.has(id)) ?? null
  }

  return (
    <div className="relative">
      {/* toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="group flex min-w-0 items-center gap-2">
          <input
            ref={nameInputRef}
            value={mealName}
            onChange={(e) => onMealName(e.target.value)}
            aria-label="Meal name"
            className="t-display-sm w-[220px] min-w-0 border-b border-transparent bg-transparent text-ink outline-none transition-colors focus:border-champagne"
            style={{ fontSize: 'clamp(19px, 2vw, 24px)' }}
          />
          <button
            type="button"
            aria-label="Edit meal name"
            onClick={() => nameInputRef.current?.focus()}
            className="text-ink-faint opacity-0 transition-opacity duration-180 hover:text-gold-deep group-hover:opacity-100"
          >
            <Pencil size={14} strokeWidth={1.8} />
          </button>
        </div>
        <ArchSegmented
          idPrefix="meal-type"
          options={MEAL_TYPE_OPTIONS}
          value={mealType}
          onChange={onMealType}
          small
        />
        <div className="ml-auto flex items-center gap-2">
          <MagneticButton variant="ghost" size="sm" onClick={onClear} disabled={items.length === 0}>
            Clear
          </MagneticButton>
          <MagneticButton variant="primary" size="sm" onClick={onSave} disabled={items.length === 0}>
            Save to day
          </MagneticButton>
        </div>
      </div>

      {/* placemat stage — the plate sits inside with clear margins */}
      <div
        className="relative mx-auto w-full max-w-[680px] rounded-r-xl border border-line px-3 py-5 shadow-e-1 min-[768px]:px-6 min-[768px]:py-7"
        style={{
          background:
            'radial-gradient(90% 80% at 50% 28%, rgba(243,235,218,0.5), rgba(250,246,236,0) 78%), rgba(255,253,247,0.4)',
        }}
      >
        {/* plate */}
        <div ref={plateRef} className="relative mx-auto aspect-square w-[min(100%,560px)]">
          <PlateVisual
            empty={items.length === 0}
            count={items.length}
            totalKcal={totalKcal}
            flashKey={flashKey}
            goldRingKey={goldRingKey}
          />
          <AnimatePresence>
            {items.map((item, i) => (
              <CanvasObject
                key={item.ingredientId}
                item={item}
                index={i}
                count={items.length}
                firstLoad={initialIds.current.has(item.ingredientId)}
                slot={slots[item.ingredientId] ?? { fx: 0.5, fy: 0.5, rot: 0 }}
                onQuantity={onQuantity}
                onRemove={onRemove}
                onEdit={(id) => {
                  setEditingId(id)
                  setEditGrams(item.grams)
                }}
                onDrop={() => setFlashKey((k) => k + 1)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* popover editor */}
      <AnimatePresence>
        {editingItem && editingIng && (
          <motion.div
            className="absolute inset-0 z-40 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 rounded-r-xl bg-ink/10" onClick={() => setEditingId(null)} />
            <motion.div
              initial={{ scale: 0.92, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 8 }}
              transition={{ duration: 0.28, ease: EASE_GLIDE }}
              className="glass-strong relative w-[280px] rounded-r-lg p-4 shadow-e-2"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream">
                  <img src={`/${editingIng.image}`} alt="" className="h-8 w-8 object-contain" />
                </span>
                <div>
                  <p className="t-ui-sm text-ink">{editingIng.name}</p>
                  <p className="t-label text-[9px] text-ink-faint">{editGrams} g on the plate</p>
                </div>
              </div>
              <div className="mt-3">
                <ArchSlider
                  min={10}
                  max={400}
                  step={10}
                  value={editGrams}
                  onChange={(v) => {
                    setEditGrams(v)
                    onQuantity(editingItem.ingredientId, v)
                  }}
                  format={(v) => `${v} g`}
                  ariaLabel={`Quantity of ${editingIng.name}`}
                />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="t-ui-sm text-burgundy underline-offset-2 hover:underline"
                  onClick={() => {
                    onRemove(editingItem.ingredientId)
                    setEditingId(null)
                  }}
                >
                  Remove
                </button>
                <button
                  type="button"
                  className="t-ui-sm text-gold-deep underline-offset-2 hover:underline disabled:opacity-40"
                  disabled={!replacement(editingItem.ingredientId)}
                  onClick={() => {
                    const r = replacement(editingItem.ingredientId)
                    if (r) {
                      onReplace(editingItem.ingredientId, r)
                      setEditingId(null)
                    }
                  }}
                >
                  Replace with…
                </button>
                <button
                  type="button"
                  className="t-ui-sm rounded-r-pill bg-forest px-3 py-1 text-soft-white"
                  onClick={() => setEditingId(null)}
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
