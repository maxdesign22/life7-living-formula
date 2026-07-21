/**
 * Page-local view model for the Shopping screen. All list math starts from
 * lib/shopping (canonical Week 24 list); this layer only applies the screen's
 * interactive row patches (purchased / removed / swapped) on top.
 */
import type { ShoppingItem, ShoppingList, ShoppingStoreId, StoreSection } from '@/lib/shopping'
import { DEMO_WEEK } from '@/data/demoWeek'
import { DAY_NAMES_SHORT } from '@/data/profile'

export interface RowPatch {
  readonly purchased?: boolean
  readonly removed?: boolean
  /** Replacement label after a swap is applied (e.g. "Chicken 400 g + eggs ×2"). */
  readonly swapName?: string
  /** Price after swap / budget optimisation. */
  readonly priceOverride?: number
  /** Swap badge consumed. */
  readonly swapUsed?: boolean
}

export type RowPatches = Readonly<Record<string, RowPatch>>

/**
 * Patch keys are namespaced by store: the canonical list reuses ingredient
 * ids across sections (e.g. "eggs" exists in both supermarket and pantry).
 */
export const rowKey = (store: ShoppingStoreId, id: string): string => `${store}::${id}`

export interface ViewItem extends ShoppingItem {
  readonly displayName: string
  readonly displayPrice: number
}

export interface ViewSection {
  readonly store: ShoppingStoreId
  readonly label: string
  readonly items: readonly ViewItem[]
  /** Remaining to pay (unpurchased rows) — tweens down as items are checked. */
  readonly remainingEur: number
  /** Editorial subtotal for the shopping path nodes. */
  readonly canonicalSubtotalEur: number
  readonly complete: boolean
}

export function deriveSections(list: ShoppingList, patches: RowPatches): readonly ViewSection[] {
  return list.sections.map((s: StoreSection): ViewSection => {
    const patched = s.items
      .map((i): ViewItem | null => {
        const p = patches[rowKey(s.store, i.id)]
        if (p?.removed) return null
        return {
          ...i,
          purchased: p?.purchased ?? i.purchased,
          displayName: p?.swapName ?? i.name,
          displayPrice: p?.priceOverride ?? i.priceEur,
          badges: p?.swapUsed ? i.badges.filter((b) => b !== 'swap') : i.badges,
        }
      })
      .filter((x): x is ViewItem => x !== null)
    // purchased rows settle to the bottom of their section (stable)
    const items = [...patched.filter((i) => !i.purchased), ...patched.filter((i) => i.purchased)]
    /*
     * Anchor to the canonical subtotal: the editorial supermarket subtotal
     * (€31.20) includes a €2.00 pack-level rounding over the raw item sum,
     * keeping the week headline €62.40 (and €57.80 after optimisation) exact.
     * The adjustment persists while anything remains to buy; a fully
     * purchased section settles to €0.00.
     */
    const rawSum = s.items.reduce((a, i) => a + i.priceEur, 0)
    const adjustment = Math.round((s.subtotalEur - rawSum) * 100) / 100
    const unpurchased = items.filter((i) => !i.purchased)
    const remainingEur =
      s.store === 'pantry' || unpurchased.length === 0
        ? 0
        : Math.round((unpurchased.reduce((a, i) => a + i.displayPrice, 0) + adjustment) * 100) / 100
    return {
      store: s.store,
      label: s.label,
      items,
      remainingEur,
      canonicalSubtotalEur: s.subtotalEur,
      complete: items.every((i) => i.purchased),
    }
  })
}

export function viewProgress(sections: readonly ViewSection[]): { done: number; total: number } {
  const rows = sections.filter((s) => s.store !== 'pantry').flatMap((s) => s.items)
  return { done: rows.filter((i) => i.purchased).length, total: rows.length }
}

export function remainingTotal(sections: readonly ViewSection[]): number {
  return Math.round(sections.filter((s) => s.store !== 'pantry').reduce((a, s) => a + s.remainingEur, 0) * 100) / 100
}

/* -------------------------------------------------- which meals use an item */

export interface MealUsage {
  readonly dayId: string
  readonly chip: string
  readonly mealName: string
}

const usageCache = new Map<string, readonly MealUsage[]>()

/** Chips for the item detail popover ("which meals use it") — links to /week. */
export function mealsUsing(ingredientId: string | undefined): readonly MealUsage[] {
  if (!ingredientId) return []
  const cached = usageCache.get(ingredientId)
  if (cached) return cached
  const out: MealUsage[] = []
  for (const day of DEMO_WEEK.days) {
    for (const meal of day.meals) {
      if (meal.items.some((it) => it.ingredientId === ingredientId)) {
        out.push({
          dayId: day.id,
          chip: `${DAY_NAMES_SHORT[day.dayIndex]} ${meal.mealType}`,
          mealName: meal.name,
        })
      }
    }
  }
  usageCache.set(ingredientId, out)
  return out
}
