/**
 * LIFE7 — Recommendation engine (deterministic rule evaluation).
 *
 * Evaluates the script library (`data/recommendationRules.ts`) against a meal
 * or day analysis. For the canonical Thursday Lunch it emits exactly the
 * three design cards:
 *   1. Add Greek yoghurt — 120 g  (Protein +28 · Satiety +14 · Δ +11)
 *   2. Add broccoli — 80 g        (Fibre +26 · Micro +19 · Diversity +18 · Δ +9)
 *   3. Reduce olive oil — 8 g     (Energy +12 · Δ +8)
 * Apply all → 58 becomes 86 (see `estimateScoreAfter`).
 */

import { getIngredient } from '../data/ingredients';
import type { DailyTargets } from '../data/profile';
import {
  DAY_RULES,
  RECOMMENDATION_RULES,
  type Recommendation,
  type RecommendationRule,
  type RuleCandidate,
  type RuleCondition,
} from '../data/recommendationRules';
import {
  clamp,
  coreCategoryCount,
  mealTotals,
  type MacroTotals,
  type MealItem,
} from './nutrition';
import {
  applyQuantityChange,
  MEAL_ENERGY_TARGETS,
  rescoreMeal,
  scoreMeal,
  type GoalId,
  type MealScore,
  type MealType,
  type ScoreMealOptions,
} from './scoring';

/** Everything the rules need to know about a meal. */
export interface MealAnalysis {
  readonly totals: MacroTotals;
  readonly score: MealScore;
  readonly coreCategories: number;
  readonly distinctIngredients: number;
  readonly energyPctOfTarget: number;
  readonly oilGrams: number;
}

/** Optional context that unlocks context-aware rules (expiry use-first). */
export interface EngineContext {
  /** Ingredient ids in the pantry expiring within 48 h. */
  readonly expiringIngredientIds?: readonly string[];
  /** Max recommendations to return (Architect shows 3). */
  readonly maxResults?: number;
}

/** Analyze a meal: totals + score + rule inputs. */
export function analyzeMeal(items: readonly MealItem[], options?: ScoreMealOptions): MealAnalysis {
  const totals = mealTotals(items);
  const score = scoreMeal(items, options);
  const mealType: MealType = options?.mealType ?? 'lunch';
  const energyTarget = MEAL_ENERGY_TARGETS[mealType];
  const oilGrams = items
    .filter((i) => getIngredient(i.ingredientId).category === 'oils')
    .reduce((a, i) => a + i.grams, 0);
  return {
    totals,
    score,
    coreCategories: coreCategoryCount(items),
    distinctIngredients: items.length,
    energyPctOfTarget: energyTarget > 0 ? (totals.kcal / energyTarget) * 100 : 0,
    oilGrams,
  };
}

function conditionFires(
  condition: RuleCondition,
  analysis: MealAnalysis,
  context?: EngineContext,
): boolean {
  const { score, coreCategories } = analysis;
  switch (condition.kind) {
    case 'dim-below':
      return score.dims[condition.dim] < condition.threshold;
    case 'target-below':
      // day-level only — handled by getDayRecommendations
      return false;
    case 'energy-above':
      return analysis.energyPctOfTarget > condition.pct;
    case 'oil-trim':
      return analysis.oilGrams >= condition.minOilGrams && score.dims.energy < condition.energyDimBelow;
    case 'diversity-below':
      return coreCategories < condition.categories;
    case 'expiry-within':
      return (context?.expiringIngredientIds ?? []).length > 0;
  }
}

function pickCandidate(
  rule: RecommendationRule,
  items: readonly MealItem[],
  context?: EngineContext,
): RuleCandidate | undefined {
  for (const candidate of rule.candidates) {
    const existing = items.find((i) => i.ingredientId === candidate.ingredientId);
    if (candidate.deltaGrams > 0) {
      // adds: prefer something not already on the plate
      if (!existing) {
        if (rule.condition.kind === 'expiry-within') {
          const expiring = context?.expiringIngredientIds ?? [];
          if (!expiring.includes(candidate.ingredientId)) continue;
        }
        return candidate;
      }
    } else if (existing && existing.grams >= Math.abs(candidate.deltaGrams)) {
      // reductions: only when enough of the ingredient is present
      return candidate;
    }
  }
  return undefined;
}

function toRecommendation(
  rule: RecommendationRule,
  candidate: RuleCandidate,
  items: readonly MealItem[],
  options?: ScoreMealOptions,
): Recommendation {
  const ingredient = getIngredient(candidate.ingredientId);
  const before = scoreMeal(items, options).total;
  const after = rescoreMeal(
    items,
    { ingredientId: candidate.ingredientId, deltaGrams: candidate.deltaGrams },
    options,
  ).total;
  const grams = Math.abs(candidate.deltaGrams);
  return {
    id: `${rule.id}:${candidate.ingredientId}`,
    ruleId: rule.id,
    ingredientId: candidate.ingredientId,
    ingredientName: ingredient.name,
    deltaGrams: candidate.deltaGrams,
    title:
      candidate.deltaGrams >= 0
        ? `Add ${ingredient.name} — ${grams} g`
        : `Reduce ${ingredient.name} — ${grams} g`,
    why: rule.why,
    affectedDims: rule.affectedDims,
    deltaEstimate: rule.deltaEstimate,
    recomputedDelta: after - before,
    image: ingredient.image,
  };
}

/**
 * Run the meal-level rule engine. Deterministic: rules evaluate in priority
 * order, first applicable candidate wins, results capped at maxResults (3).
 */
export function getRecommendations(
  items: readonly MealItem[],
  options?: ScoreMealOptions & { readonly context?: EngineContext },
): readonly Recommendation[] {
  const analysis = analyzeMeal(items, options);
  const context = options?.context;
  const maxResults = context?.maxResults ?? 3;
  const rules = [...RECOMMENDATION_RULES].sort((a, b) => a.priority - b.priority);
  const out: Recommendation[] = [];
  for (const rule of rules) {
    if (out.length >= maxResults) break;
    if (!conditionFires(rule.condition, analysis, context)) continue;
    const candidate = pickCandidate(rule, items, context);
    if (!candidate) continue;
    out.push(toRecommendation(rule, candidate, items, options));
  }
  return out;
}

/** Apply one recommendation's quantity change to the meal. */
export function applyRecommendation(
  items: readonly MealItem[],
  recommendation: Recommendation,
): readonly MealItem[] {
  return applyQuantityChange(items, recommendation.ingredientId, recommendation.deltaGrams);
}

/** Apply all recommendations (the "Apply all" money moment). */
export function applyRecommendations(
  items: readonly MealItem[],
  recommendations: readonly Recommendation[],
): readonly MealItem[] {
  return recommendations.reduce((acc, r) => applyRecommendation(acc, r), items);
}

/** Score after applying all recommendations — feeds the ghost ring ("58 → possible 86"). */
export function estimateScoreAfter(
  items: readonly MealItem[],
  recommendations: readonly Recommendation[],
  options?: ScoreMealOptions,
): number {
  return scoreMeal(applyRecommendations(items, recommendations), options).total;
}

/** Sum of canonical card deltas (the "+28" chip on Apply all). */
export function totalDeltaEstimate(recommendations: readonly Recommendation[]): number {
  return recommendations.reduce((a, r) => a + r.deltaEstimate, 0);
}

// ---------------------------------------------------------------- day-level

/** Day analysis for the §11 day rules (protein < 60 %, fibre < 40 %, …). */
export interface DayAnalysis {
  readonly proteinPctOfTarget: number;
  readonly fibrePctOfTarget: number;
  readonly energyPctOfTarget: number;
  readonly coreCategories: number;
}

export function analyzeDayProgress(consumed: MacroTotals, targets: DailyTargets, dayItems: readonly MealItem[]): DayAnalysis {
  return {
    proteinPctOfTarget: targets.proteinG > 0 ? (consumed.protein / targets.proteinG) * 100 : 0,
    fibrePctOfTarget: targets.fibreG > 0 ? (consumed.fibre / targets.fibreG) * 100 : 0,
    energyPctOfTarget: targets.kcal > 0 ? (consumed.kcal / targets.kcal) * 100 : 0,
    coreCategories: coreCategoryCount(dayItems),
  };
}

function dayConditionFires(
  condition: RuleCondition,
  analysis: DayAnalysis,
  context?: EngineContext,
): boolean {
  switch (condition.kind) {
    case 'target-below':
      return condition.metric === 'protein'
        ? analysis.proteinPctOfTarget < condition.pct
        : analysis.fibrePctOfTarget < condition.pct;
    case 'energy-above':
      return analysis.energyPctOfTarget > condition.pct;
    case 'diversity-below':
      return analysis.coreCategories < condition.categories;
    case 'expiry-within':
      return (context?.expiringIngredientIds ?? []).length > 0;
    case 'dim-below':
    case 'oil-trim':
      return false;
  }
}

/**
 * Day-level recommendations (design.md §11 verbatim rules): protein < 60 % →
 * Greek yoghurt / eggs / chicken · fibre < 40 % → broccoli / spinach / oats ·
 * energy > 110 % → reduce olive oil · diversity < 3 categories → tomato /
 * banana · expiry < 48 h → use-first spinach.
 */
export function getDayRecommendations(
  consumed: MacroTotals,
  targets: DailyTargets,
  dayItems: readonly MealItem[],
  context?: EngineContext & { readonly goalId?: GoalId },
): readonly Recommendation[] {
  const analysis = analyzeDayProgress(consumed, targets, dayItems);
  const rules = [...DAY_RULES].sort((a, b) => a.priority - b.priority);
  const out: Recommendation[] = [];
  for (const rule of rules) {
    if (!dayConditionFires(rule.condition, analysis, context)) continue;
    const candidate =
      rule.condition.kind === 'expiry-within'
        ? rule.candidates.find((c) => (context?.expiringIngredientIds ?? []).includes(c.ingredientId))
        : rule.candidates[0];
    if (!candidate) continue;
    const ingredient = getIngredient(candidate.ingredientId);
    const grams = Math.abs(candidate.deltaGrams);
    out.push({
      id: `${rule.id}:${candidate.ingredientId}`,
      ruleId: rule.id,
      ingredientId: candidate.ingredientId,
      ingredientName: ingredient.name,
      deltaGrams: candidate.deltaGrams,
      title:
        candidate.deltaGrams >= 0
          ? `Add ${ingredient.name} — ${grams} g`
          : `Reduce ${ingredient.name} — ${grams} g`,
      why: rule.why,
      affectedDims: rule.affectedDims,
      deltaEstimate: rule.deltaEstimate,
      recomputedDelta: rule.deltaEstimate,
      image: ingredient.image,
    });
  }
  return out;
}

/** Percent of target helper for UI chips. */
export function pctOfTarget(value: number, target: number): number {
  return target > 0 ? Math.round(clamp((value / target) * 100, 0, 999)) : 0;
}
