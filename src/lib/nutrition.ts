/**
 * LIFE7 — nutrition math (pure, deterministic).
 *
 * Per-100 g base math, quantity scaling, price math (weight / piece / volume /
 * dry-goods conversion), meal totals, day totals and energy-expenditure
 * estimates. No React, no I/O, no randomness.
 */

import {
  CORE_CATEGORIES,
  getIngredient,
  type Ingredient,
  type IngredientCategory,
} from '../data/ingredients';

/** One ingredient at one quantity inside a meal or shopping/pantry context. */
export interface MealItem {
  readonly ingredientId: string;
  readonly grams: number;
}

/** Aggregated nutrition for a set of items (meal or whole day). */
export interface MacroTotals {
  readonly kcal: number;
  readonly protein: number; // g
  readonly carbs: number; // g
  readonly fat: number; // g
  readonly fibre: number; // g
  /** Total edible weight in grams. */
  readonly weightG: number;
  /** Σ microIndex × grams — raw material for micronutrient coverage. */
  readonly microSum: number;
  /** Estimated ingredient cost in euros. */
  readonly costEur: number;
}

export const EMPTY_TOTALS: MacroTotals = {
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fibre: 0,
  weightG: 0,
  microSum: 0,
  costEur: 0,
};

/** Round to 1 decimal (display-stable). */
export const round1 = (v: number): number => Math.round(v * 10) / 10;
/** Round to 2 decimals (prices). */
export const round2 = (v: number): number => Math.round(v * 100) / 100;

/** Clamp helper used across the logic layer. */
export const clamp = (v: number, min = 0, max = 100): number => Math.min(max, Math.max(min, v));

/**
 * Macros for one ingredient at a given quantity (per-100 g base math).
 * Quantities are "as served" grams (rice is weighed cooked).
 */
export function scalePer100(ingredient: Ingredient, grams: number): Omit<MacroTotals, 'microSum' | 'costEur'> {
  const q = grams / 100;
  return {
    kcal: ingredient.per100g.kcal * q,
    protein: ingredient.per100g.protein * q,
    carbs: ingredient.per100g.carbs * q,
    fat: ingredient.per100g.fat * q,
    fibre: ingredient.per100g.fibre * q,
    weightG: grams,
  };
}

/**
 * Price of a quantity in euros.
 * - weight: €/kg straight from grams
 * - piece: prorated by piece weight (eggs, avocado, sourdough)
 * - volume: €/litre converted through density (olive oil)
 * - dry goods: plan grams are cooked; price applies to the dry equivalent
 *   (rice: cooked = dry × dryToCookedRatio)
 */
export function priceForQuantity(ingredient: Ingredient, grams: number): number {
  const effectiveGrams =
    ingredient.soldAs === 'dry' && ingredient.dryToCookedRatio
      ? grams / ingredient.dryToCookedRatio
      : grams;
  const p = ingredient.price;
  switch (p.kind) {
    case 'weight':
      return (effectiveGrams / 1000) * p.perKg;
    case 'piece':
      return (effectiveGrams / p.pieceGrams) * p.perPiece;
    case 'volume':
      return (effectiveGrams / p.gramsPerLitre) * p.perLitre;
  }
}

/** Micronutrient raw sum for one item (microIndex × grams). */
export function microSumFor(ingredient: Ingredient, grams: number): number {
  return ingredient.microIndex * grams;
}

/** Sum a list of meal items into totals (macros, weight, micros, cost). */
export function sumItems(items: readonly MealItem[]): MacroTotals {
  let acc = EMPTY_TOTALS;
  for (const item of items) {
    const ing = getIngredient(item.ingredientId);
    const m = scalePer100(ing, item.grams);
    acc = {
      kcal: acc.kcal + m.kcal,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
      fibre: acc.fibre + m.fibre,
      weightG: acc.weightG + m.weightG,
      microSum: acc.microSum + microSumFor(ing, item.grams),
      costEur: acc.costEur + priceForQuantity(ing, item.grams),
    };
  }
  return acc;
}

/** Meal totals — the per-meal aggregate used by scoring and UI totals grids. */
export function mealTotals(items: readonly MealItem[]): MacroTotals {
  return sumItems(items);
}

/** Day totals across all of a day's meals. */
export function dayTotals(meals: ReadonlyArray<readonly MealItem[]>): MacroTotals {
  return sumItems(meals.flat());
}

/** Estimated cost (€) of a single meal. */
export function estimateMealCost(items: readonly MealItem[]): number {
  return sumItems(items).costEur;
}

/** Gram-weighted average micronutrient density (0–100 per 100 g). */
export function microDensity(totals: MacroTotals): number {
  return totals.weightG > 0 ? totals.microSum / totals.weightG : 0;
}

/** Distinct categories present in a set of items. */
export function categorySet(items: readonly MealItem[]): ReadonlySet<IngredientCategory> {
  const set = new Set<IngredientCategory>();
  for (const item of items) set.add(getIngredient(item.ingredientId).category);
  return set;
}

/** Number of core food-group categories (diversity driver, max 6). */
export function coreCategoryCount(items: readonly MealItem[]): number {
  const set = categorySet(items);
  return CORE_CATEGORIES.filter((c) => set.has(c)).length;
}

/** Number of distinct ingredients in a set of items. */
export function distinctIngredientCount(items: readonly MealItem[]): number {
  return new Set(items.map((i) => i.ingredientId)).size;
}

/** Energy content of macros via Atwater factors (P/C 4 kcal/g, F 9 kcal/g). */
export function kcalFromMacros(proteinG: number, carbsG: number, fatG: number): number {
  return proteinG * 4 + carbsG * 4 + fatG * 9;
}

/** Macro split as percentages of macro-derived energy (sums ≈ 100). */
export function macroSplit(
  proteinG: number,
  carbsG: number,
  fatG: number,
): { readonly proteinPct: number; readonly carbsPct: number; readonly fatPct: number } {
  const total = kcalFromMacros(proteinG, carbsG, fatG);
  if (total <= 0) return { proteinPct: 0, carbsPct: 0, fatPct: 0 };
  return {
    proteinPct: (proteinG * 4 * 100) / total,
    carbsPct: (carbsG * 4 * 100) / total,
    fatPct: (fatG * 9 * 100) / total,
  };
}

// ------------------------------------------------------------------ profile math

export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'high', 'athlete'] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  athlete: 1.9,
};

export type Sex = 'male' | 'female' | 'other';

/** Mifflin–St Jeor BMR (kcal/day). */
export function mifflinStJeorBmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'female' ? base - 161 : base + 5;
}

/** Estimated TDEE (kcal/day) from BMR and activity level. */
export function estimateTdee(bmr: number, activity: ActivityLevel): number {
  return bmr * ACTIVITY_FACTORS[activity];
}
