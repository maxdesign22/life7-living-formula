import type { PantryItem, PantryState } from './pantry'
import type { ShoppingList } from './shopping'

export interface ScannerDemoState {
  readonly ingredientId: 'spinach'
  readonly name: 'Spinach'
  readonly quantityG: 300
  readonly expiresInDays: 1
  readonly freshnessPct: 58
  readonly addedAt: number
}

export const SCANNER_DEMO_EVENT = 'life7:scanner-demo-change'
const STORAGE_KEY = 'life7-scanner-demo'

export const SCANNED_SPINACH: Omit<ScannerDemoState, 'addedAt'> = {
  ingredientId: 'spinach',
  name: 'Spinach',
  quantityG: 300,
  expiresInDays: 1,
  freshnessPct: 58,
}

export function readScannerDemoState(): ScannerDemoState | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ScannerDemoState>
    if (parsed.ingredientId !== 'spinach' || typeof parsed.addedAt !== 'number') return null
    return { ...SCANNED_SPINACH, addedAt: parsed.addedAt }
  } catch {
    return null
  }
}

export function saveScannerDemoState(): ScannerDemoState {
  const state: ScannerDemoState = { ...SCANNED_SPINACH, addedAt: Date.now() }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent(SCANNER_DEMO_EVENT))
  return state
}

export function clearScannerDemoState() {
  window.sessionStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(SCANNER_DEMO_EVENT))
}

export function scannedPantryItem(): PantryItem {
  return {
    ingredientId: 'spinach',
    quantityG: SCANNED_SPINACH.quantityG,
    quantityLabel: '300 g',
    freshnessPct: SCANNED_SPINACH.freshnessPct,
    expiresInDays: SCANNED_SPINACH.expiresInDays,
    location: 'fridge',
    plannedUsage: [],
  }
}

/** Add the scanned pack once on top of the canonical demo pantry. */
export function applyScannerToPantry(pantry: PantryState, scanned: ScannerDemoState | null): PantryState {
  if (!scanned) return pantry
  return {
    items: pantry.items.map((item) =>
      item.ingredientId === scanned.ingredientId
        ? {
            ...item,
            quantityG: item.quantityG + scanned.quantityG,
            quantityLabel: `${item.quantityG + scanned.quantityG} g`,
            freshnessPct: Math.min(item.freshnessPct, scanned.freshnessPct),
            expiresInDays: Math.min(item.expiresInDays, scanned.expiresInDays),
          }
        : item,
    ),
  }
}

/** Assign the scanned pack to tonight only after the Continuum change is approved. */
export function applyScannerPlanToPantry(pantry: PantryState, approved: boolean): PantryState {
  return {
    items: pantry.items.map((item) => {
      if (item.ingredientId !== 'spinach') return item
      const hasScannedPlan = item.plannedUsage.some((usage) => usage.label === 'Thu dinner · scanned')
      if (approved === hasScannedPlan) return item
      return {
        ...item,
        plannedUsage: item.plannedUsage.map((usage) =>
          approved && usage.dayId === 'thu' && usage.mealType === 'dinner'
            ? { ...usage, label: 'Thu dinner · scanned', grams: usage.grams + 300 }
            : !approved && usage.label === 'Thu dinner · scanned'
              ? { ...usage, label: 'Thu dinner', grams: Math.max(0, usage.grams - 300) }
            : usage,
        ),
      }
    }),
  }
}

/**
 * The scanned pack is now at home, so the duplicate 300 g purchase disappears
 * and the Pantry section records where the saving came from.
 */
export function applyScannerToShoppingList(list: ShoppingList, scanned: ScannerDemoState | null): ShoppingList {
  if (!scanned) return list
  return {
    ...list,
    sections: list.sections.map((section) => {
      if (section.store === 'supermarket') {
        return {
          ...section,
          items: section.items.filter((item) => item.ingredientId !== scanned.ingredientId),
          subtotalEur: Math.round((section.subtotalEur - 1.8) * 100) / 100,
        }
      }
      if (section.store === 'pantry') {
        return {
          ...section,
          items: [
            {
              id: 'scan-spinach',
              ingredientId: 'spinach',
              name: 'Spinach · scanned pack',
              quantityLabel: '300 g',
              grams: 300,
              priceEur: 0,
              image: 'ing-spinach.png',
              badges: ['at-home'],
              purchased: true,
              note: 'Label recognised · use by tomorrow',
            },
            ...section.items,
          ],
        }
      }
      return section
    }),
    totalEur: Math.round((list.totalEur - 1.8) * 100) / 100,
    itemCount: list.itemCount - 1,
    pantrySavingsEur: Math.round((list.pantrySavingsEur + 1.8) * 100) / 100,
  }
}
