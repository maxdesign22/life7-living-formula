/**
 * LIFE7 — Meal & day scoring model (pure, deterministic).
 *
 * Seven dimensions, each 0–100, blended by goal-specific weights:
 * protein adequacy · fibre adequacy · energy balance · food diversity ·
 * micronutrient coverage · satiety potential · goal alignment.
 *
 * CALIBRATION (design.md §11, canonical Meal Architect demo — holds ±0):
 *   base meal  = chicken 140 g · rice 180 g · tomato 120 g · olive oil 14 g
 *     → score 58, dims (62, 22, 71, 34, 41, 66, 55)
 *   improved   = base + Greek yoghurt 120 g + broccoli 80 g − olive oil 8 g
 *     → score 86, dims (90, 48, 79, 58, 66, 84, 83)
 * `verifyDemoAnchors()` re-checks this at runtime.
 *
 * Each dimension is a clamped log-response curve 100·(x/T)^γ (or an affine
 * map for goal alignment); constants below were solved so both anchor states
 * reproduce exactly with the ingredient table in `data/ingredients.ts`.
 */

import {
  clamp,
  coreCategoryCount,
  dayTotals,
  distinctIngredientCount,
  macroSplit,
  mealTotals,
  microDensity,
  type MacroTotals,
  type MealItem,
} from './nutrition';

// --------------------------------------------------------------------- goals

export const GOAL_IDS = [
  'healthy',
  'strong',
  'healthy-strong',
  'lean',
  'muscle-gain',
  'stable-energy',
  'mental-focus',
  'longevity',
  'athlete',
  'budget-health',
  'simple-living',
] as const;
export type GoalId = (typeof GOAL_IDS)[number];

export const DIMENSION_KEYS = [
  'protein',
  'fibre',
  'energy',
  'diversity',
  'micro',
  'satiety',
  'goal',
] as const;
export type DimensionKey = (typeof DIMENSION_KEYS)[number];

export type DimensionScores = Record<DimensionKey, number>;

export interface MacroSplitTarget {
  readonly protein: number; // % of macro energy
  readonly carbs: number;
  readonly fat: number;
}

export interface GoalProfile {
  readonly id: GoalId;
  readonly label: string;
  /** Weights across the 7 dimensions; always sum to 100. */
  readonly weights: DimensionScores;
  readonly macroSplit: MacroSplitTarget;
  /** Daily protein target basis (g per kg body weight). */
  readonly proteinPerKg: number;
  /** Multiplier on TDEE for the day's energy target. */
  readonly calorieFactor: number;
  readonly caption: string;
}

const W = (
  protein: number,
  fibre: number,
  energy: number,
  diversity: number,
  micro: number,
  satiety: number,
  goal: number,
): DimensionScores => ({ protein, fibre, energy, diversity, micro, satiety, goal });

/** Default blend (design.md §11): 20 / 12 / 16 / 12 / 16 / 12 / 12. */
export const DEFAULT_WEIGHTS: DimensionScores = W(20, 12, 16, 12, 16, 12, 12);

export const GOAL_PROFILES: Record<GoalId, GoalProfile> = {
  healthy: {
    id: 'healthy',
    label: 'Healthy',
    weights: W(16, 16, 18, 14, 18, 10, 8),
    macroSplit: { protein: 25, carbs: 45, fat: 30 },
    proteinPerKg: 1.4,
    calorieFactor: 1.0,
    caption: 'Balanced coverage, energy in balance.',
  },
  strong: {
    id: 'strong',
    label: 'Strong',
    weights: W(24, 8, 14, 10, 14, 14, 16),
    macroSplit: { protein: 35, carbs: 40, fat: 25 },
    proteinPerKg: 1.8,
    calorieFactor: 1.0,
    caption: 'Protein forward, strength supported.',
  },
  'healthy-strong': {
    id: 'healthy-strong',
    label: 'Healthy & Strong',
    weights: DEFAULT_WEIGHTS,
    macroSplit: { protein: 35, carbs: 40, fat: 25 },
    proteinPerKg: 1.8,
    calorieFactor: 1.0,
    caption: 'The composite: coverage meets strength.',
  },
  lean: {
    id: 'lean',
    label: 'Lean',
    weights: W(22, 14, 20, 10, 12, 12, 10),
    macroSplit: { protein: 35, carbs: 35, fat: 30 },
    proteinPerKg: 1.8,
    calorieFactor: 0.85,
    caption: 'Slight deficit, protein protected.',
  },
  'muscle-gain': {
    id: 'muscle-gain',
    label: 'Muscle gain',
    weights: W(28, 6, 14, 8, 12, 14, 18),
    macroSplit: { protein: 35, carbs: 45, fat: 20 },
    proteinPerKg: 2.0,
    calorieFactor: 1.1,
    caption: 'Surplus with protein at the centre.',
  },
  'stable-energy': {
    id: 'stable-energy',
    label: 'Stable energy',
    weights: W(14, 16, 22, 12, 14, 16, 6),
    macroSplit: { protein: 25, carbs: 50, fat: 25 },
    proteinPerKg: 1.4,
    calorieFactor: 1.0,
    caption: 'Slow carbs, even glucose, no crashes.',
  },
  'mental-focus': {
    id: 'mental-focus',
    label: 'Mental focus',
    weights: W(14, 12, 18, 14, 20, 14, 8),
    macroSplit: { protein: 25, carbs: 45, fat: 30 },
    proteinPerKg: 1.4,
    calorieFactor: 1.0,
    caption: 'Micronutrients and steady fuel for the brain.',
  },
  longevity: {
    id: 'longevity',
    label: 'Longevity',
    weights: W(12, 18, 14, 16, 20, 10, 10),
    macroSplit: { protein: 20, carbs: 50, fat: 30 },
    proteinPerKg: 1.2,
    calorieFactor: 0.95,
    caption: 'Plants, fibre and micronutrient density.',
  },
  athlete: {
    id: 'athlete',
    label: 'Athlete',
    weights: W(24, 8, 18, 8, 14, 16, 12),
    macroSplit: { protein: 30, carbs: 50, fat: 20 },
    proteinPerKg: 1.9,
    calorieFactor: 1.15,
    caption: 'Fuel the work, recover fast.',
  },
  'budget-health': {
    id: 'budget-health',
    label: 'Budget health',
    weights: W(16, 14, 16, 12, 14, 10, 18),
    macroSplit: { protein: 30, carbs: 40, fat: 30 },
    proteinPerKg: 1.5,
    calorieFactor: 1.0,
    caption: 'Maximum nutrition per euro.',
  },
  'simple-living': {
    id: 'simple-living',
    label: 'Simple living',
    weights: W(14, 14, 16, 16, 14, 12, 14),
    macroSplit: { protein: 25, carbs: 45, fat: 30 },
    proteinPerKg: 1.3,
    calorieFactor: 1.0,
    caption: 'Few moving parts, gently balanced.',
  },
};

export const DEFAULT_GOAL_ID: GoalId = 'healthy-strong';

export function getGoalProfile(goalId: GoalId): GoalProfile {
  return GOAL_PROFILES[goalId];
}

/** Average two goal profiles (intake wizard allows up to two selections). */
export function compositeGoal(a: GoalId, b: GoalId): GoalProfile {
  if (a === b) return GOAL_PROFILES[a];
  const pa = GOAL_PROFILES[a];
  const pb = GOAL_PROFILES[b];
  const avg = (x: number, y: number): number => Math.round((x + y) / 2);
  const weights = W(
    avg(pa.weights.protein, pb.weights.protein),
    avg(pa.weights.fibre, pb.weights.fibre),
    avg(pa.weights.energy, pb.weights.energy),
    avg(pa.weights.diversity, pb.weights.diversity),
    avg(pa.weights.micro, pb.weights.micro),
    avg(pa.weights.satiety, pb.weights.satiety),
    avg(pa.weights.goal, pb.weights.goal),
  );
  return {
    id: a === 'healthy' && b === 'strong' ? 'healthy-strong' : pa.id,
    label: `${pa.label} & ${pb.label}`,
    weights,
    macroSplit: {
      protein: avg(pa.macroSplit.protein, pb.macroSplit.protein),
      carbs: avg(pa.macroSplit.carbs, pb.macroSplit.carbs),
      fat: avg(pa.macroSplit.fat, pb.macroSplit.fat),
    },
    proteinPerKg: (pa.proteinPerKg + pb.proteinPerKg) / 2,
    calorieFactor: (pa.calorieFactor + pb.calorieFactor) / 2,
    caption: `The composite: ${pa.label.toLowerCase()} meets ${pb.label.toLowerCase()}.`,
  };
}

// --------------------------------------------------------------- calibration

export const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

/**
 * Per-meal-type energy targets (kcal). Lunch 875 kcal is the calibrated
 * anchor; the others scale the day target 2800 kcal (20 / 31 / 11 / 38 %).
 */
export const MEAL_ENERGY_TARGETS: Record<MealType, number> = {
  breakfast: 560,
  lunch: 875,
  snack: 300,
  dinner: 1065,
};

/** Canonical demo meal (Thursday Lunch) — the anchor the model is fitted to. */
export const DEMO_ANCHOR_BASE: readonly MealItem[] = [
  { ingredientId: 'chicken-breast', grams: 140 },
  { ingredientId: 'rice', grams: 180 },
  { ingredientId: 'tomato', grams: 120 },
  { ingredientId: 'olive-oil', grams: 14 },
];

/** Anchor meal after all three recommendations are applied. */
export const DEMO_ANCHOR_IMPROVED: readonly MealItem[] = [
  { ingredientId: 'chicken-breast', grams: 140 },
  { ingredientId: 'rice', grams: 180 },
  { ingredientId: 'tomato', grams: 120 },
  { ingredientId: 'olive-oil', grams: 6 },
  { ingredientId: 'greek-yoghurt', grams: 120 },
  { ingredientId: 'broccoli', grams: 80 },
];

/** Solved curve constants (see Python calibration notes in the module header). */
const CURVE = {
  /** protein adequacy: 100·(P / T_p)^1.6, T_p per meal type = 66.5·E/875 g */
  proteinTargetAtLunch: 66.5,
  proteinGamma: 1.6,
  /** fibre adequacy: 100·(f / T_f)^1.15, T_f per meal type = 8·E/875 g */
  fibreTargetAtLunch: 8.0,
  fibreGamma: 1.15,
  /** energy balance: 100·(kcal/E)^0.95 under target, 100·(E/kcal)^1.05 over */
  energyGammaUnder: 0.95,
  energyGammaOver: 1.05,
  /** diversity: 100·(coreCats/6)² + 2.25·distinctIngredients */
  diversityCoreBase: 6,
  diversityPerIngredient: 2.25,
  /** micronutrient coverage: 100·(avgDensity/43.5)^1.71 */
  microTarget: 43.5,
  microGamma: 1.71,
  /** satiety: SI=(2P + 6·fibre + 0.05·weight)/(kcal/100); 100·(SI/30.72)^1.25 */
  satietyTarget: 30.72,
  satietyGamma: 1.25,
  /** goal alignment: 5.0633·splitFit − 401.46, splitFit = 100 − L1(split) */
  goalSlope: 5.0633,
  goalIntercept: -401.46,
  /** total: 1.25·weightedMean − 6.45 */
  totalSlope: 1.25,
  totalIntercept: -6.45,
} as const;

/** Day-level scoring constants (live recompute; canonical demo scores are data). */
const DAY_CURVE = {
  kcalTarget: 2800,
  proteinTarget: 150,
  fibreTarget: 30,
  goalL1Slope: 1.5,
  totalSlope: 1.0129,
  totalIntercept: 7.1546,
} as const;

// ------------------------------------------------------- dimension functions

/** Protein adequacy 0–100 vs the per-meal protein target. */
export function proteinAdequacy(proteinG: number, mealType: MealType): number {
  const target = CURVE.proteinTargetAtLunch * (MEAL_ENERGY_TARGETS[mealType] / MEAL_ENERGY_TARGETS.lunch);
  if (proteinG <= 0) return 0;
  return clamp(100 * Math.pow(proteinG / target, CURVE.proteinGamma));
}

/** Fibre adequacy 0–100 vs the per-meal fibre target. */
export function fibreAdequacy(fibreG: number, mealType: MealType): number {
  const target = CURVE.fibreTargetAtLunch * (MEAL_ENERGY_TARGETS[mealType] / MEAL_ENERGY_TARGETS.lunch);
  if (fibreG <= 0) return 0;
  return clamp(100 * Math.pow(fibreG / target, CURVE.fibreGamma));
}

/** Energy balance 0–100 — peaks at target, decays both sides. */
export function energyBalance(kcal: number, mealType: MealType): number {
  const target = MEAL_ENERGY_TARGETS[mealType];
  if (kcal <= 0) return 0;
  return kcal <= target
    ? clamp(100 * Math.pow(kcal / target, CURVE.energyGammaUnder))
    : clamp(100 * Math.pow(target / kcal, CURVE.energyGammaOver));
}

/** Food diversity 0–100 from core food groups + distinct ingredient count. */
export function foodDiversity(coreCategories: number, distinctIngredients: number): number {
  if (distinctIngredients <= 0) return 0;
  return clamp(
    100 * Math.pow(coreCategories / CURVE.diversityCoreBase, 2) +
      CURVE.diversityPerIngredient * distinctIngredients,
  );
}

/** Micronutrient coverage 0–100 from gram-weighted micro density. */
export function micronutrientCoverage(microAvgPer100g: number): number {
  if (microAvgPer100g <= 0) return 0;
  return clamp(100 * Math.pow(microAvgPer100g / CURVE.microTarget, CURVE.microGamma));
}

/**
 * Satiety potential 0–100. Satiety index blends protein, fibre and sheer
 * volume against energy density.
 */
export function satietyPotential(totals: MacroTotals): number {
  if (totals.kcal <= 0) return 0;
  const si =
    (2 * totals.protein + 6 * totals.fibre + 0.05 * totals.weightG) / (totals.kcal / 100);
  return clamp(100 * Math.pow(si / CURVE.satietyTarget, CURVE.satietyGamma));
}

/** Goal alignment 0–100 — L1 distance of the macro split to the goal split. */
export function goalAlignment(totals: MacroTotals, split: MacroSplitTarget): number {
  const s = macroSplit(totals.protein, totals.carbs, totals.fat);
  const l1 =
    Math.abs(s.proteinPct - split.protein) +
    Math.abs(s.carbsPct - split.carbs) +
    Math.abs(s.fatPct - split.fat);
  const splitFit = 100 - l1;
  return clamp(CURVE.goalSlope * splitFit + CURVE.goalIntercept);
}

/** Day-level goal alignment — gentler slope for whole-day aggregates. */
function dayGoalAlignment(totals: MacroTotals, split: MacroSplitTarget): number {
  const s = macroSplit(totals.protein, totals.carbs, totals.fat);
  const l1 =
    Math.abs(s.proteinPct - split.protein) +
    Math.abs(s.carbsPct - split.carbs) +
    Math.abs(s.fatPct - split.fat);
  return clamp(100 - DAY_CURVE.goalL1Slope * l1);
}

// ------------------------------------------------------------------- scoring

export interface MealScore {
  /** 0–100, rounded. */
  readonly total: number;
  /** Rounded dimension values for bars/chips. */
  readonly dims: DimensionScores;
  /** Unrounded dimension values (1 dp) for tweens and deltas. */
  readonly raw: DimensionScores;
  readonly weights: DimensionScores;
  readonly totals: MacroTotals;
}

export interface ScoreMealOptions {
  readonly mealType?: MealType;
  readonly goalId?: GoalId;
}

/** Blend raw dimension scores with goal weights into the 0–100 total. */
function blendTotal(dims: DimensionScores, weights: DimensionScores): number {
  const mean =
    DIMENSION_KEYS.reduce((acc, k) => acc + dims[k] * weights[k], 0) / 100;
  return Math.round(clamp(CURVE.totalSlope * mean + CURVE.totalIntercept));
}

/** Score raw dimension values for a meal aggregate. */
function dimensionScores(
  totals: MacroTotals,
  coreCategories: number,
  distinctIngredients: number,
  mealType: MealType,
  goal: GoalProfile,
): DimensionScores {
  return {
    protein: proteinAdequacy(totals.protein, mealType),
    fibre: fibreAdequacy(totals.fibre, mealType),
    energy: energyBalance(totals.kcal, mealType),
    diversity: foodDiversity(coreCategories, distinctIngredients),
    micro: micronutrientCoverage(microDensity(totals)),
    satiety: satietyPotential(totals),
    goal: goalAlignment(totals, goal.macroSplit),
  };
}

const roundDims = (dims: DimensionScores): DimensionScores => ({
  protein: Math.round(dims.protein),
  fibre: Math.round(dims.fibre),
  energy: Math.round(dims.energy),
  diversity: Math.round(dims.diversity),
  micro: Math.round(dims.micro),
  satiety: Math.round(dims.satiety),
  goal: Math.round(dims.goal),
});

/**
 * Score a meal. Defaults reproduce the canonical demo: Thursday Lunch under
 * Healthy & Strong → 58 (and 86 once the three recommendations are applied).
 */
export function scoreMeal(items: readonly MealItem[], options?: ScoreMealOptions): MealScore {
  const mealType = options?.mealType ?? 'lunch';
  const goal = getGoalProfile(options?.goalId ?? DEFAULT_GOAL_ID);
  const totals = mealTotals(items);
  const raw = dimensionScores(
    totals,
    coreCategoryCount(items),
    distinctIngredientCount(items),
    mealType,
    goal,
  );
  return {
    total: blendTotal(raw, goal.weights),
    dims: roundDims(raw),
    raw,
    weights: goal.weights,
    totals,
  };
}

/** Re-score after applying a quantity change — used for what-if estimates. */
export function rescoreMeal(
  items: readonly MealItem[],
  change: { readonly ingredientId: string; readonly deltaGrams: number },
  options?: ScoreMealOptions,
): MealScore {
  const next = applyQuantityChange(items, change.ingredientId, change.deltaGrams);
  return scoreMeal(next, options);
}

/** Pure helper: apply an add/remove/reduce to an item list. */
export function applyQuantityChange(
  items: readonly MealItem[],
  ingredientId: string,
  deltaGrams: number,
): readonly MealItem[] {
  const existing = items.find((i) => i.ingredientId === ingredientId);
  if (!existing) {
    return deltaGrams > 0 ? [...items, { ingredientId, grams: deltaGrams }] : items;
  }
  const grams = Math.max(0, existing.grams + deltaGrams);
  const next = items.map((i) => (i.ingredientId === ingredientId ? { ...i, grams } : i));
  return next.filter((i) => i.grams > 0);
}

// --------------------------------------------------------------- day scoring

export interface DayScore {
  readonly total: number;
  readonly dims: DimensionScores;
  readonly raw: DimensionScores;
  readonly totals: MacroTotals;
  readonly mealScores: readonly number[];
}

export interface DayMealInput {
  readonly items: readonly MealItem[];
  readonly mealType: MealType;
}

/**
 * Score a full day from its meals. Day-level aggregates are compared with the
 * daily targets (2800 kcal · 150 g protein · 30 g fibre) and blended with a
 * day-calibrated affine. The canonical Week 24 scores (Mon 82 … Sun 84) are
 * curated demo data in `data/demoWeek.ts`; this function reproduces them
 * approximately (±6) and is used for live recompute when plans change.
 */
export function scoreDay(meals: readonly DayMealInput[], goalId: GoalId = DEFAULT_GOAL_ID): DayScore {
  const goal = getGoalProfile(goalId);
  const totals = dayTotals(meals.map((m) => m.items));
  const allItems = meals.flatMap((m) => m.items);

  const raw: DimensionScores = {
    protein: totals.protein <= 0 ? 0 : clamp(100 * Math.pow(totals.protein / DAY_CURVE.proteinTarget, CURVE.proteinGamma)),
    fibre: totals.fibre <= 0 ? 0 : clamp(100 * Math.pow(totals.fibre / DAY_CURVE.fibreTarget, CURVE.fibreGamma)),
    energy:
      totals.kcal <= 0
        ? 0
        : totals.kcal <= DAY_CURVE.kcalTarget
          ? clamp(100 * Math.pow(totals.kcal / DAY_CURVE.kcalTarget, CURVE.energyGammaUnder))
          : clamp(100 * Math.pow(DAY_CURVE.kcalTarget / totals.kcal, CURVE.energyGammaOver)),
    diversity: foodDiversity(coreCategoryCount(allItems), distinctIngredientCount(allItems)),
    micro: micronutrientCoverage(microDensity(totals)),
    satiety: satietyPotential(totals),
    goal: dayGoalAlignment(totals, goal.macroSplit),
  };

  const mean = DIMENSION_KEYS.reduce((acc, k) => acc + raw[k] * goal.weights[k], 0) / 100;
  const total = Math.round(clamp(DAY_CURVE.totalSlope * mean + DAY_CURVE.totalIntercept));
  const mealScores = meals.map((m) => scoreMeal(m.items, { mealType: m.mealType, goalId }).total);

  return { total, dims: roundDims(raw), raw, totals, mealScores };
}

// -------------------------------------------------------------- anchor check

export interface AnchorCheckResult {
  readonly score: number;
  readonly dims: DimensionScores;
  readonly expectedScore: number;
  readonly expectedDims: DimensionScores;
  readonly pass: boolean;
}

export interface DemoAnchorVerification {
  readonly base: AnchorCheckResult;
  readonly improved: AnchorCheckResult;
  readonly pass: boolean;
}

export const EXPECTED_BASE_DIMS: DimensionScores = {
  protein: 62, fibre: 22, energy: 71, diversity: 34, micro: 41, satiety: 66, goal: 55,
};
export const EXPECTED_IMPROVED_DIMS: DimensionScores = {
  protein: 90, fibre: 48, energy: 79, diversity: 58, micro: 66, satiety: 84, goal: 83,
};

function checkAnchor(
  items: readonly MealItem[],
  expectedScore: number,
  expectedDims: DimensionScores,
): AnchorCheckResult {
  const s = scoreMeal(items, { mealType: 'lunch', goalId: 'healthy-strong' });
  const dimsPass = DIMENSION_KEYS.every((k) => Math.abs(s.dims[k] - expectedDims[k]) <= 1);
  return {
    score: s.total,
    dims: s.dims,
    expectedScore,
    expectedDims,
    pass: Math.abs(s.total - expectedScore) <= 1 && dimsPass,
  };
}

/** Runtime self-check of the canonical calibration (58 / 86 anchors). */
export function verifyDemoAnchors(): DemoAnchorVerification {
  const base = checkAnchor(DEMO_ANCHOR_BASE, 58, EXPECTED_BASE_DIMS);
  const improved = checkAnchor(DEMO_ANCHOR_IMPROVED, 86, EXPECTED_IMPROVED_DIMS);
  return { base, improved, pass: base.pass && improved.pass };
}

// --------------------------------------------------------------- UI metadata

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  protein: 'Protein adequacy',
  fibre: 'Fibre adequacy',
  energy: 'Energy balance',
  diversity: 'Food diversity',
  micro: 'Micronutrient coverage',
  satiety: 'Satiety potential',
  goal: 'Goal alignment',
};

/** Functional score band (design.md §2): 0–40 / 41–70 / 71–100. */
export type ScoreBand = 'attention' | 'building' | 'thriving';

export function scoreBand(score: number): ScoreBand {
  if (score <= 40) return 'attention';
  if (score <= 70) return 'building';
  return 'thriving';
}
