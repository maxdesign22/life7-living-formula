/**
 * LIFE7 — Pantry state & freshness logic (pure, deterministic).
 *
 * The demo pantry (pantry.md): 11 items with quantity, freshness, expiry,
 * location and planned usage. Includes the freshness decay curve, the expiry
 * queue, planned-usage mapping and the waste reduction score (calibrated so
 * the demo pantry yields the canonical 86).
 */

import { getIngredient, type StorageLocation } from '../data/ingredients';
import type { MealType } from './scoring';
import { clamp } from './nutrition';

/** A planned use of a pantry item inside the week plan. */
export interface PlannedUsage {
  readonly dayId: string;
  readonly mealType: MealType;
  /** Chip label, e.g. "Thu dinner". */
  readonly label: string;
  readonly grams: number;
}

export interface PantryItem {
  readonly ingredientId: string;
  readonly quantityG: number;
  /** Display quantity, e.g. "4 pcs", "420 ml". */
  readonly quantityLabel: string;
  readonly freshnessPct: number;
  readonly expiresInDays: number;
  readonly location: StorageLocation;
  readonly plannedUsage: readonly PlannedUsage[];
}

export interface PantryState {
  readonly items: readonly PantryItem[];
}

// ------------------------------------------------------------- demo snapshot

const U = (dayId: string, mealType: MealType, label: string, grams: number): PlannedUsage => ({
  dayId,
  mealType,
  label,
  grams,
});

/** The 11 canonical pantry cards (pantry.md, Zone B). */
export function createDemoPantry(): PantryState {
  return {
    items: [
      {
        ingredientId: 'spinach',
        quantityG: 220,
        quantityLabel: '220 g',
        freshnessPct: 82,
        expiresInDays: 2,
        location: 'fridge',
        plannedUsage: [U('tue', 'lunch', 'Tue lunch', 60), U('thu', 'dinner', 'Thu dinner', 100)],
      },
      {
        ingredientId: 'greek-yoghurt',
        quantityG: 480,
        quantityLabel: '480 g',
        freshnessPct: 74,
        expiresInDays: 3,
        location: 'fridge',
        plannedUsage: [U('wed', 'snack', 'Wed snack', 200), U('fri', 'snack', 'Fri snack', 200)],
      },
      {
        ingredientId: 'tomato',
        quantityG: 480,
        quantityLabel: '4 pcs',
        freshnessPct: 71,
        expiresInDays: 3,
        location: 'fridge',
        plannedUsage: [U('thu', 'lunch', 'Thu lunch', 120), U('sat', 'dinner', 'Sat dinner', 150)],
      },
      {
        ingredientId: 'broccoli',
        quantityG: 320,
        quantityLabel: '320 g',
        freshnessPct: 88,
        expiresInDays: 4,
        location: 'fridge',
        plannedUsage: [U('fri', 'dinner', 'Fri dinner', 120), U('sun', 'dinner', 'Sun dinner', 100)],
      },
      {
        ingredientId: 'chicken-breast',
        quantityG: 560,
        quantityLabel: '560 g',
        freshnessPct: 90,
        expiresInDays: 5,
        location: 'fridge',
        plannedUsage: [U('thu', 'lunch', 'Thu lunch', 140), U('fri', 'dinner', 'Fri dinner', 160)],
      },
      {
        ingredientId: 'eggs',
        quantityG: 495,
        quantityLabel: '9 pcs',
        freshnessPct: 93,
        expiresInDays: 8,
        location: 'fridge',
        plannedUsage: [U('mon', 'breakfast', 'Daily breakfasts', 495)],
      },
      {
        ingredientId: 'banana',
        quantityG: 480,
        quantityLabel: '4 pcs',
        freshnessPct: 68,
        expiresInDays: 2,
        location: 'pantry',
        plannedUsage: [U('mon', 'breakfast', 'Breakfasts · snacks', 480)],
      },
      {
        ingredientId: 'oats',
        quantityG: 620,
        quantityLabel: '620 g',
        freshnessPct: 100,
        expiresInDays: 90,
        location: 'pantry',
        plannedUsage: [U('mon', 'breakfast', 'Breakfasts', 240)],
      },
      {
        ingredientId: 'rice',
        quantityG: 850,
        quantityLabel: '850 g',
        freshnessPct: 100,
        expiresInDays: 180,
        location: 'pantry',
        plannedUsage: [U('mon', 'lunch', 'Lunches · dinners', 600)],
      },
      {
        ingredientId: 'walnuts',
        quantityG: 140,
        quantityLabel: '140 g',
        freshnessPct: 96,
        expiresInDays: 60,
        location: 'pantry',
        plannedUsage: [U('mon', 'snack', 'Snacks · breakfasts', 80)],
      },
      {
        ingredientId: 'olive-oil',
        quantityG: 420,
        quantityLabel: '420 ml',
        freshnessPct: 100,
        expiresInDays: 240,
        location: 'pantry',
        plannedUsage: [U('mon', 'dinner', 'Daily cooking', 100)],
      },
    ],
  };
}

// ---------------------------------------------------------- freshness & decay

/**
 * Freshness decay curve: 100 % at purchase, easing to 0 at the end of shelf
 * life. Slightly convex (fresh food holds, then drops).
 */
export function freshnessAt(ageDays: number, shelfLifeDays: number): number {
  if (shelfLifeDays <= 0) return 0;
  return Math.round(clamp(100 * Math.pow(Math.max(0, 1 - ageDays / shelfLifeDays), 0.8)));
}

/** Freshness after `days` more days pass (decay projection). */
export function projectFreshness(item: PantryItem, days: number): number {
  const shelf = getIngredient(item.ingredientId).shelfLifeDays;
  const ageNow = shelf * (1 - Math.pow(item.freshnessPct / 100, 1 / 0.8));
  return freshnessAt(ageNow + days, shelf);
}

export type FreshnessTone = 'fresh' | 'aging' | 'urgent';

/** Ring color band: green → champagne → burgundy. */
export function freshnessTone(freshnessPct: number): FreshnessTone {
  if (freshnessPct >= 70) return 'fresh';
  if (freshnessPct >= 40) return 'aging';
  return 'urgent';
}

// --------------------------------------------------------------- expiry queue

export type ExpiryUrgency = 'critical' | 'soon' | 'fresh';

export interface ExpiryEntry {
  readonly item: PantryItem;
  readonly urgency: ExpiryUrgency;
  /** e.g. "Use within 2 days". */
  readonly label: string;
  /** Share of the quantity not yet covered by planned meals (0–1). */
  readonly unplannedRatio: number;
}

export function expiryUrgency(expiresInDays: number): ExpiryUrgency {
  if (expiresInDays <= 2) return 'critical';
  if (expiresInDays <= 5) return 'soon';
  return 'fresh';
}

export function expiryLabel(expiresInDays: number): string {
  if (expiresInDays < 1) return 'Use today';
  if (expiresInDays === 1) return 'Use within 1 day';
  if (expiresInDays <= 30) return `Use within ${expiresInDays} days`;
  const months = Math.round(expiresInDays / 30);
  return months === 1 ? 'Use within 1 month' : `Use within ${months} months`;
}

/** Total grams of an item covered by planned meals. */
export function plannedGrams(item: PantryItem): number {
  return item.plannedUsage.reduce((a, u) => a + u.grams, 0);
}

/** Share of the item already destined for meals (0–1, clamped). */
export function plannedCoverage(item: PantryItem): number {
  return item.quantityG > 0 ? clamp(plannedGrams(item) / item.quantityG, 0, 1) : 0;
}

/**
 * Expiry queue: soonest first; ties broken by least-planned first (what
 * needs attention leads — spinach before bananas).
 */
export function getExpiryQueue(pantry: PantryState): readonly ExpiryEntry[] {
  return pantry.items
    .map((item): ExpiryEntry => {
      const coverage = plannedCoverage(item);
      return {
        item,
        urgency: expiryUrgency(item.expiresInDays),
        label: expiryLabel(item.expiresInDays),
        unplannedRatio: 1 - coverage,
      };
    })
    .sort(
      (a, b) =>
        a.item.expiresInDays - b.item.expiresInDays || b.unplannedRatio - a.unplannedRatio,
    );
}

/** Items expiring within N days (Use-soon filter, default 3). */
export function useSoonItems(pantry: PantryState, withinDays = 3): readonly PantryItem[] {
  return getExpiryQueue(pantry)
    .filter((e) => e.item.expiresInDays <= withinDays)
    .map((e) => e.item);
}

/** Badge count for the nav dot (expires ≤ 2 days → 2 in the demo). */
export function expiringCount(pantry: PantryState, withinDays = 2): number {
  return pantry.items.filter((i) => i.expiresInDays <= withinDays).length;
}

/** Ingredient ids expiring within N hours — context for the rule engine. */
export function expiringIngredientIds(pantry: PantryState, withinHours = 48): readonly string[] {
  return getExpiryQueue(pantry)
    .filter((e) => e.item.expiresInDays * 24 <= withinHours)
    .map((e) => e.item.ingredientId);
}

// ---------------------------------------------------------- planned usage map

/** ingredientId → planned usages (for pantry cards and shopping deduction). */
export function plannedUsageMap(pantry: PantryState): ReadonlyMap<string, readonly PlannedUsage[]> {
  return new Map(pantry.items.map((i) => [i.ingredientId, i.plannedUsage]));
}

/** Pantry items without any planned use ("Not planned — Find a use"). */
export function unplannedItems(pantry: PantryState): readonly PantryItem[] {
  return pantry.items.filter((i) => i.plannedUsage.length === 0);
}

// --------------------------------------------------------------- waste score

const WASTE_PENALTY_K = 3.91;
const URGENCY_WEIGHT: Record<ExpiryUrgency, number> = { critical: 3, soon: 2, fresh: 0 };

/**
 * Waste reduction score 0–100: 100 minus a penalty for expiring food with no
 * planned use. Calibrated (k = 3.91 against the urgency mapping below) so the
 * demo pantry yields the canonical 86 ("on track to waste nothing").
 */
export function wasteReductionScore(pantry: PantryState): number {
  const penalty = getExpiryQueue(pantry).reduce(
    (acc, e) => acc + e.unplannedRatio * URGENCY_WEIGHT[e.urgency],
    0,
  );
  return Math.round(clamp(100 - WASTE_PENALTY_K * penalty));
}

/** Canonical waste-panel stats (pantry.md Zone C). */
export interface WasteStats {
  readonly score: number;
  readonly foodSavedKg: number;
  readonly moneySavedEur: number;
  readonly useFirstWins: number;
  readonly quote: string;
  readonly tip: string;
  readonly tipAction: string;
}

export function getWasteStats(pantry: PantryState): WasteStats {
  return {
    score: wasteReductionScore(pantry),
    foodSavedKg: 2.1,
    moneySavedEur: 23.6,
    useFirstWins: 14,
    quote:
      'This week you are on track to waste nothing. Last month the average household threw away €11.40 of food.',
    tip: 'Bananas at 68% — freeze two tonight for Saturday’s oats.',
    tipAction: 'Do it',
  };
}

// -------------------------------------------------------------- state helpers

/** Update an item's quantity (stepper in the pantry grid). */
export function adjustQuantity(pantry: PantryState, ingredientId: string, deltaG: number): PantryState {
  return {
    items: pantry.items.map((i) =>
      i.ingredientId === ingredientId ? { ...i, quantityG: Math.max(0, i.quantityG + deltaG) } : i,
    ),
  };
}

/** Add (or top up) a pantry item — used by the Scan / Add-food drawers. */
export function addPantryItem(pantry: PantryState, item: PantryItem): PantryState {
  const existing = pantry.items.find((i) => i.ingredientId === item.ingredientId);
  if (existing) {
    return adjustQuantity(pantry, item.ingredientId, item.quantityG);
  }
  return { items: [...pantry.items, item] };
}

/** Remove an item (undoable at the UI layer). */
export function removePantryItem(pantry: PantryState, ingredientId: string): PantryState {
  return { items: pantry.items.filter((i) => i.ingredientId !== ingredientId) };
}

/** Summary for headers and the AI context. */
export function getPantrySummary(pantry: PantryState): {
  readonly itemCount: number;
  readonly expiringSoon: number;
  readonly wasteScore: number;
  readonly expiringIds: readonly string[];
} {
  return {
    itemCount: pantry.items.length,
    expiringSoon: expiringCount(pantry),
    wasteScore: wasteReductionScore(pantry),
    expiringIds: expiringIngredientIds(pantry),
  };
}
