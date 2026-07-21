import { motion } from 'framer-motion'
import { Archive, Refrigerator, Snowflake } from 'lucide-react'
import type { StorageLocation, Ingredient, IngredientCategory } from '@/data/ingredients'
import { INGREDIENT_BY_ID } from '@/data/ingredients'
import { freshnessAt, freshnessTone, type PantryItem } from '@/lib/pantry'
import { DAY_NAMES, DAY_NAMES_SHORT } from '@/data/profile'

export const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]

/** Kinetic title (design.md §5.11). */
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
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/* ------------------------------------------------------------- ingredient */

/** The demo-only freezer card added by the waste tip ("Banana (frozen) ×2"). */
export const CUSTOM_NAMES: Record<string, string> = { 'banana-frozen': 'Banana (frozen)' }

/** Resolve the ingredient for a pantry item; custom demo rows fall back to banana. */
export function ingredientOf(item: PantryItem): Ingredient {
  return INGREDIENT_BY_ID.get(item.ingredientId) ?? INGREDIENT_BY_ID.get('banana')!
}

export function displayName(item: PantryItem): string {
  return CUSTOM_NAMES[item.ingredientId] ?? ingredientOf(item).name
}

/* -------------------------------------------------------------- quantity */

/** Grams per piece for piece-counted rows (stepper math). */
const PIECE_GRAMS: Record<string, number> = { eggs: 55, banana: 120, tomato: 120, 'banana-frozen': 120 }

export type QtyUnit = 'g' | 'ml' | 'pcs' | 'x'

export function unitOf(quantityLabel: string): QtyUnit {
  if (quantityLabel.endsWith('pcs')) return 'pcs'
  if (quantityLabel.startsWith('×')) return 'x'
  if (quantityLabel.endsWith('ml')) return 'ml'
  return 'g'
}

export function stepFor(item: PantryItem): number {
  const unit = unitOf(item.quantityLabel)
  if (unit === 'pcs' || unit === 'x') return PIECE_GRAMS[item.ingredientId] ?? 100
  return unit === 'ml' ? 10 : 20
}

export function labelFor(item: PantryItem, quantityG: number): string {
  const unit = unitOf(item.quantityLabel)
  if (unit === 'pcs' || unit === 'x') {
    const pcs = Math.max(0, Math.round(quantityG / (PIECE_GRAMS[item.ingredientId] ?? 100)))
    return unit === 'pcs' ? `${pcs} pcs` : `×${pcs}`
  }
  if (unit === 'ml') return `${Math.round(quantityG)} ml`
  return `${Math.round(quantityG)} g`
}

/** Build the quantity label for a freshly added ingredient. */
export function newItemLabel(ing: Ingredient, grams: number): string {
  if (ing.price.kind === 'piece') {
    const pcs = Math.max(1, Math.round(grams / ing.price.pieceGrams))
    return `${pcs} pcs`
  }
  if (ing.price.kind === 'volume') return `${Math.round(grams)} ml`
  return `${Math.round(grams)} g`
}

/* -------------------------------------------------------------- locations */

export const LOCATION_META: Record<
  StorageLocation,
  { label: string; icon: typeof Refrigerator }
> = {
  fridge: { label: 'Fridge', icon: Refrigerator },
  pantry: { label: 'Pantry', icon: Archive },
  freezer: { label: 'Freezer', icon: Snowflake },
}

/* ------------------------------------------------------------- categories */

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  protein: 'Protein',
  vegetables: 'Vegetables',
  fruit: 'Fruit',
  grains: 'Grains',
  legumes: 'Legumes',
  dairy: 'Dairy',
  'nuts-seeds': 'Nuts & seeds',
  oils: 'Oils',
  spices: 'Spices',
  drinks: 'Drinks',
}

/** Blob backdrop tint per category (pantry.md Zone B). */
export const CATEGORY_TINTS: Record<IngredientCategory, string> = {
  protein: 'bg-sunrise/70',
  vegetables: 'bg-sage-mist',
  fruit: 'bg-sunrise/60',
  grains: 'bg-cream',
  legumes: 'bg-sage/60',
  dairy: 'bg-soft-white',
  'nuts-seeds': 'bg-cream',
  oils: 'bg-sunrise/50',
  spices: 'bg-cream',
  drinks: 'bg-sage-mist',
}

/* -------------------------------------------------------------- day names */

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export function fullDayName(dayId: string): string {
  const i = (DAY_ORDER as readonly string[]).indexOf(dayId)
  return i >= 0 ? DAY_NAMES[i] : dayId
}

export function shortDayName(dayId: string): string {
  const i = (DAY_ORDER as readonly string[]).indexOf(dayId)
  return i >= 0 ? DAY_NAMES_SHORT[i] : dayId
}

/** "Tuesday lunch and Thursday dinner" — the signature usage sentence. */
export function usageSentence(item: PantryItem): string | null {
  if (item.plannedUsage.length === 0) return null
  const parts = item.plannedUsage.map((u) => `${fullDayName(u.dayId)} ${u.mealType}`)
  if (parts.length === 1) return parts[0]
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

/* ------------------------------------------------------ freshness helpers */

export const TONE_COLORS = { fresh: '#5C7A54', aging: '#D9B26A', urgent: '#7E3B46' } as const

/** 7-day freshness history (oldest → today) for the detail-drawer sparkline. */
export function freshnessHistory(item: PantryItem): readonly number[] {
  const shelf = ingredientOf(item).shelfLifeDays
  const ageNow = shelf * (1 - Math.pow(item.freshnessPct / 100, 1 / 0.8))
  return Array.from({ length: 7 }, (_, i) => freshnessAt(Math.max(0, ageNow - (6 - i)), shelf))
}

/**
 * Freshness indicator ring (pantry.md): green→champagne→burgundy by
 * freshness, slow shimmer sweep 4s, 1.6s pulse when < 48h to expiry.
 */
export function FreshnessRing({
  value,
  size = 48,
  urgentPulse = false,
}: {
  value: number
  size?: number
  /** item expires in ≤ 2 days → pulsing alert ring */
  urgentPulse?: boolean
}) {
  const stroke = 4
  const r = (size - stroke) / 2 - 3
  const c = 2 * Math.PI * r
  const tone = TONE_COLORS[freshnessTone(value)]
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      {urgentPulse && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-burgundy/50"
          animate={{ scale: [1, 1.18], opacity: [0.7, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
          aria-hidden="true"
        />
      )}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(46,70,48,0.08)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1.15, ease: EASE_GLIDE }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* slow shimmer sweep (4s) */}
        <motion.g
          style={{ originX: `${size / 2}px`, originY: `${size / 2}px` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="rgba(255,253,247,0.85)"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${c * 0.08} ${c * 0.92}`}
          />
        </motion.g>
      </svg>
      <span className="tnum absolute inset-0 flex items-center justify-center text-[11px] font-bold text-ink">
        {value}
      </span>
    </span>
  )
}
