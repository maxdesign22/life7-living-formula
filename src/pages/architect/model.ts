/**
 * Meal Architect — page-local model helpers.
 *
 * Everything scoring / nutrition / recommendation related is delegated to
 * src/lib (calibrated). This file only carries presentational constants:
 * easings, category labels/tints, dietary-restriction predicates, prep-time
 * and satiety display derivations, price labels and the plate slot geometry.
 */

import {
  getIngredient,
  INGREDIENT_CATEGORIES,
  type Ingredient,
  type IngredientCategory,
} from '@/data/ingredients'
import { priceForQuantity, type MealItem } from '@/lib/nutrition'

export const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]
export const EASE_SOFT = [0.4, 0, 0.2, 1] as [number, number, number, number]

// ------------------------------------------------------------------ flights

export interface FlightRect {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

export interface Flight {
  readonly id: number
  readonly image: string
  readonly from: FlightRect
  readonly to: FlightRect
  /** px the arc overshoots upward mid-flight (spec: −24) */
  readonly arc: number
  readonly durationMs: number
}

// --------------------------------------------------------------- categories

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

export const CATEGORY_ORDER: readonly IngredientCategory[] = INGREDIENT_CATEGORIES

/** Per-category blob backdrop tint for canvas objects (meal-architect.md §Center). */
export const CATEGORY_TINT: Record<IngredientCategory, string> = {
  vegetables: 'rgba(201,214,192,0.55)', // sage tint
  protein: 'rgba(247,223,167,0.60)', // sunrise tint
  oils: 'rgba(217,178,106,0.32)', // champagne tint
  fruit: 'rgba(247,223,167,0.42)',
  grains: 'rgba(243,235,218,0.95)', // cream
  dairy: 'rgba(255,253,247,0.95)',
  legumes: 'rgba(228,236,221,0.9)', // sage-mist
  'nuts-seeds': 'rgba(233,223,200,0.9)', // sand
  spices: 'rgba(243,235,218,0.9)',
  drinks: 'rgba(228,236,221,0.8)',
}

// -------------------------------------------------------------- restrictions

export type RestrictionId = 'no-shellfish' | 'vegetarian' | 'gluten-free' | 'dairy-free' | 'nut-free'

export const RESTRICTIONS: readonly { readonly id: RestrictionId; readonly label: string }[] = [
  { id: 'no-shellfish', label: 'No shellfish' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'gluten-free', label: 'Gluten-free' },
  { id: 'dairy-free', label: 'Dairy-free' },
  { id: 'nut-free', label: 'Nut-free' },
]

const MEAT_FISH_IDS: readonly string[] = ['chicken-breast', 'salmon-fillet']
const GLUTEN_IDS: readonly string[] = ['sourdough']

/** True when the ingredient conflicts with the restriction (dim + strikethrough). */
export function violatesRestriction(ing: Ingredient, restriction: RestrictionId): boolean {
  switch (restriction) {
    case 'no-shellfish':
      return /shellfish|shrimp|prawn|crab|lobster/i.test(`${ing.name} ${ing.tags.join(' ')}`)
    case 'vegetarian':
      return MEAT_FISH_IDS.includes(ing.id)
    case 'gluten-free':
      return GLUTEN_IDS.includes(ing.id)
    case 'dairy-free':
      return ing.category === 'dairy'
    case 'nut-free':
      return ing.category === 'nuts-seeds'
  }
}

export function isExcludedBy(ing: Ingredient, active: readonly RestrictionId[]): boolean {
  return active.some((r) => violatesRestriction(ing, r))
}

// ----------------------------------------------------------------- pricing

/** Human price label per purchasable unit: "€8.50 /kg" · "€0.25 /pc" · "€12.00 /L". */
export function priceLabel(ing: Ingredient): string {
  const p = ing.price
  switch (p.kind) {
    case 'weight':
      return `€${p.perKg.toFixed(2)} /kg`
    case 'piece':
      return `€${p.perPiece.toFixed(2)} /pc`
    case 'volume':
      return `€${p.perLitre.toFixed(2)} /L`
  }
}

export function euros(v: number): string {
  return `€${v.toFixed(2)}`
}

export function priceFor(ingredientId: string, grams: number): number {
  return priceForQuantity(getIngredient(ingredientId), grams)
}

// ------------------------------------------------------------ display maths

/** Prep minutes per category contribution (base meal yields 18 min, per spec). */
const PREP_BY_CATEGORY: Record<IngredientCategory, number> = {
  protein: 8,
  grains: 6,
  vegetables: 3,
  legumes: 4,
  fruit: 1,
  'nuts-seeds': 1,
  dairy: 0,
  oils: 0,
  spices: 0,
  drinks: 0,
}

/** Estimated preparation time for the plate (calibrated: demo base → 18 min). */
export function prepMinutes(items: readonly MealItem[]): number {
  if (items.length === 0) return 0
  return (
    1 +
    items.reduce((acc, item) => acc + PREP_BY_CATEGORY[getIngredient(item.ingredientId).category], 0)
  )
}

/** Satiety on a 0–5 seed scale (nearest 0.5) from the satiety dimension. */
export function satietyOf5(satietyDim: number): number {
  return Math.round((satietyDim / 20) * 2) / 2
}

// ------------------------------------------------------------ plate geometry

export interface SlotPosition {
  /** fraction of plate width/height from top-left (0–1) */
  readonly fx: number
  readonly fy: number
  /** editorial hand-placed rotation (−3°…+3°) */
  readonly rot: number
}

const SLOT_ROTS = [-2, 1.5, -1, 2, -1.5, 1, -2.5, 2.5, -0.5, 0.5] as const

/** Per-ingredient editorial tilt seed (positions come from plateAnchors). */
export function slotPosition(index: number): SlotPosition {
  return { fx: 0.5, fy: 0.5, rot: SLOT_ROTS[index % SLOT_ROTS.length] }
}

/**
 * Balanced token anchors on the plate well (fractions of the plate box,
 * center-origin), adapting to how many items sit on the plate:
 * a single ingredient takes the centre stage; 2–6 spread on an even ring;
 * 7+ push slightly wider. Even counts rotate half a step so no token sits
 * exactly on the vertical axis — top/bottom captions keep clear of the rim.
 */
export interface PlateAnchor {
  readonly fx: number
  readonly fy: number
}

export function plateAnchors(count: number): readonly PlateAnchor[] {
  if (count <= 0) return []
  if (count === 1) return [{ fx: 0.5, fy: 0.5 }]
  const r = count >= 8 ? 0.32 : count >= 7 ? 0.3 : 0.27
  const offsetDeg = count % 2 === 0 ? -90 + 180 / count : -90
  return Array.from({ length: count }, (_, i) => {
    const a = ((offsetDeg + (360 / count) * i) * Math.PI) / 180
    return { fx: 0.5 + r * Math.cos(a), fy: 0.5 + r * Math.sin(a) }
  })
}
