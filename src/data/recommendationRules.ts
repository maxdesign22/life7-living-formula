/**
 * LIFE7 — Recommendation script library (design.md §11).
 *
 * Deterministic rules over the demo pantry. Each rule emits
 * { ingredient, qty, why, affectedDims, deltaEstimate } — exactly the payload
 * the Meal Architect cards render. Types live here so both the data and the
 * engine (`lib/recommendations.ts`) share them without cycles.
 */

import type { DimensionKey } from '../lib/scoring';

/** One dimension chip on a recommendation card, e.g. `Protein +28`. */
export interface AffectedDim {
  readonly dim: DimensionKey;
  readonly delta: number;
}

/** Conditions evaluated against a meal/day analysis. */
export type RuleCondition =
  /** Meal dimension below threshold (e.g. protein dim < 70). */
  | { readonly kind: 'dim-below'; readonly dim: DimensionKey; readonly threshold: number }
  /** Consumed % of the day target below threshold (protein < 60 %, fibre < 40 %). */
  | { readonly kind: 'target-below'; readonly metric: 'protein' | 'fibre'; readonly pct: number }
  /** Energy above % of target (energy > 110 %). */
  | { readonly kind: 'energy-above'; readonly pct: number }
  /** Oil-heavy meal with energy-balance headroom (the canonical third card). */
  | { readonly kind: 'oil-trim'; readonly minOilGrams: number; readonly energyDimBelow: number }
  /** Fewer than N core food categories in the meal. */
  | { readonly kind: 'diversity-below'; readonly categories: number }
  /** A pantry item expires within N hours (use-first). */
  | { readonly kind: 'expiry-within'; readonly hours: number };

/** A candidate change a rule can emit (first applicable candidate wins). */
export interface RuleCandidate {
  readonly ingredientId: string;
  /** + to add, − to reduce. */
  readonly deltaGrams: number;
}

export interface RecommendationRule {
  readonly id: string;
  readonly condition: RuleCondition;
  readonly candidates: readonly RuleCandidate[];
  /** Editorial "why it helps" copy (Fraunces italic on the card). */
  readonly why: string;
  readonly affectedDims: readonly AffectedDim[];
  /** Canonical Δ score shown on the card (Σ of the demo trio = +28). */
  readonly deltaEstimate: number;
  /** Evaluation order (ascending). */
  readonly priority: number;
}

/** A concrete, scored suggestion produced by the engine. */
export interface Recommendation {
  readonly id: string;
  readonly ruleId: string;
  readonly ingredientId: string;
  readonly ingredientName: string;
  readonly deltaGrams: number;
  /** Card title, e.g. "Add Greek yoghurt — 120 g". */
  readonly title: string;
  readonly why: string;
  readonly affectedDims: readonly AffectedDim[];
  readonly deltaEstimate: number;
  /** Live re-score delta of applying only this change (what-if). */
  readonly recomputedDelta: number;
  readonly image: string;
}

/**
 * The script library. The first three rules reproduce the canonical Meal
 * Architect cards verbatim for the Thursday Lunch demo meal.
 */
export const RECOMMENDATION_RULES: readonly RecommendationRule[] = [
  {
    id: 'protein-boost',
    condition: { kind: 'dim-below', dim: 'protein', threshold: 70 },
    candidates: [
      { ingredientId: 'greek-yoghurt', deltaGrams: 120 },
      { ingredientId: 'eggs', deltaGrams: 110 },
      { ingredientId: 'chicken-breast', deltaGrams: 100 },
    ],
    why: 'Lifts protein past your strength target and deepens satiety.',
    affectedDims: [
      { dim: 'protein', delta: 28 },
      { dim: 'satiety', delta: 14 },
    ],
    deltaEstimate: 11,
    priority: 10,
  },
  {
    id: 'fibre-boost',
    condition: { kind: 'dim-below', dim: 'fibre', threshold: 40 },
    candidates: [
      { ingredientId: 'broccoli', deltaGrams: 80 },
      { ingredientId: 'spinach', deltaGrams: 100 },
      { ingredientId: 'oats', deltaGrams: 40 },
    ],
    why: 'Fibre, folate and colour. Your diversity gap closes.',
    affectedDims: [
      { dim: 'fibre', delta: 26 },
      { dim: 'micro', delta: 19 },
      { dim: 'diversity', delta: 18 },
    ],
    deltaEstimate: 9,
    priority: 20,
  },
  {
    id: 'energy-trim',
    condition: { kind: 'oil-trim', minOilGrams: 10, energyDimBelow: 85 },
    candidates: [{ ingredientId: 'olive-oil', deltaGrams: -8 }],
    why: 'Same pleasure, cleaner energy balance.',
    affectedDims: [{ dim: 'energy', delta: 12 }],
    deltaEstimate: 8,
    priority: 30,
  },
  {
    id: 'diversity-boost',
    condition: { kind: 'diversity-below', categories: 3 },
    candidates: [
      { ingredientId: 'tomato', deltaGrams: 120 },
      { ingredientId: 'banana', deltaGrams: 120 },
    ],
    why: 'Two more colours on the plate. Diversity is the cheapest score.',
    affectedDims: [
      { dim: 'diversity', delta: 20 },
      { dim: 'micro', delta: 8 },
    ],
    deltaEstimate: 7,
    priority: 40,
  },
  {
    id: 'energy-reduce',
    condition: { kind: 'energy-above', pct: 110 },
    candidates: [{ ingredientId: 'olive-oil', deltaGrams: -10 }],
    why: 'Energy is running hot. Trim the oil first and keep the flavour.',
    affectedDims: [{ dim: 'energy', delta: 10 }],
    deltaEstimate: 6,
    priority: 50,
  },
  {
    id: 'expiry-use-first',
    condition: { kind: 'expiry-within', hours: 48 },
    candidates: [
      { ingredientId: 'spinach', deltaGrams: 80 },
      { ingredientId: 'banana', deltaGrams: 120 },
    ],
    why: 'Expires within 48 hours. Use it first and waste nothing.',
    affectedDims: [{ dim: 'micro', delta: 6 }],
    deltaEstimate: 4,
    priority: 60,
  },
];

/**
 * Day-level rules (design.md §11 verbatim): evaluated against consumption vs
 * the daily targets — used by Today insight and Coach flows.
 */
export const DAY_RULES: readonly RecommendationRule[] = [
  {
    id: 'day-protein-low',
    condition: { kind: 'target-below', metric: 'protein', pct: 60 },
    candidates: [
      { ingredientId: 'greek-yoghurt', deltaGrams: 150 },
      { ingredientId: 'eggs', deltaGrams: 110 },
      { ingredientId: 'chicken-breast', deltaGrams: 120 },
    ],
    why: 'Protein is behind pace for your strength goal.',
    affectedDims: [{ dim: 'protein', delta: 18 }],
    deltaEstimate: 8,
    priority: 10,
  },
  {
    id: 'day-fibre-low',
    condition: { kind: 'target-below', metric: 'fibre', pct: 40 },
    candidates: [
      { ingredientId: 'broccoli', deltaGrams: 120 },
      { ingredientId: 'spinach', deltaGrams: 100 },
      { ingredientId: 'oats', deltaGrams: 60 },
    ],
    why: 'Fibre is under 40% of target. Plants come first at the next meal.',
    affectedDims: [{ dim: 'fibre', delta: 22 }],
    deltaEstimate: 6,
    priority: 20,
  },
  {
    id: 'day-energy-high',
    condition: { kind: 'energy-above', pct: 110 },
    candidates: [{ ingredientId: 'olive-oil', deltaGrams: -10 }],
    why: 'Energy is past 110% of target. Trim added fat, not protein.',
    affectedDims: [{ dim: 'energy', delta: 12 }],
    deltaEstimate: 5,
    priority: 30,
  },
  {
    id: 'day-diversity-low',
    condition: { kind: 'diversity-below', categories: 3 },
    candidates: [
      { ingredientId: 'tomato', deltaGrams: 120 },
      { ingredientId: 'banana', deltaGrams: 120 },
    ],
    why: 'Fewer than three food groups so far. Add colour.',
    affectedDims: [{ dim: 'diversity', delta: 16 }],
    deltaEstimate: 5,
    priority: 40,
  },
  {
    id: 'day-expiry',
    condition: { kind: 'expiry-within', hours: 48 },
    candidates: [{ ingredientId: 'spinach', deltaGrams: 100 }],
    why: 'Spinach expires soon. Tonight’s dinner takes it.',
    affectedDims: [{ dim: 'micro', delta: 8 }],
    deltaEstimate: 4,
    priority: 50,
  },
];
