/**
 * LIFE7 — Demo week data (Week 24; today = Thursday).
 *
 * Seven days × four meals (Breakfast 08:00 · Lunch 12:30 · Snack 16:00 ·
 * Dinner 19:30) with full ingredient breakdowns. Canonical day scores and
 * editorial totals come from design.md §11 / week.md; per-meal nutrition is
 * computed from `data/ingredients.ts` via `lib/nutrition.ts` helpers.
 *
 * Canonical: Mon 82 · Tue 78 · Wed 74 (Social) · Thu 71 (today, in progress)
 * · Fri 86 (Training) · Sat 80 (Rest) · Sun 84 (Prep day).
 * Week avg 79 · est. cost €62.40 · avg prep 22 min.
 */

import type { MealItem } from '../lib/nutrition';
import type { GoalId, MealType } from '../lib/scoring';
import { DAY_NAMES } from './profile';

export const DAY_TYPES = ['normal', 'travel', 'rest', 'training', 'social', 'prep'] as const;
export type DayType = (typeof DAY_TYPES)[number];

export const DAY_STATUSES = ['done', 'today', 'planned'] as const;
export type DayStatus = (typeof DAY_STATUSES)[number];

export const MEAL_STATUSES = ['eaten', 'next', 'planned', 'out'] as const;
export type MealStatus = (typeof MEAL_STATUSES)[number];

export interface PlannedMeal {
  readonly id: string;
  readonly mealType: MealType;
  readonly name: string;
  /** Local time, 'HH:MM'. */
  readonly time: string;
  readonly items: readonly MealItem[];
  /** Active prep minutes (per-meal values sum to the day's canonical prep). */
  readonly prepMinutes: number;
  /** Passive cooking minutes (prep + cook = "Start cooking (N min)"). */
  readonly cookMinutes: number;
  readonly photo: string;
  readonly status: MealStatus;
  readonly note?: string;
  /** True when a Travel day-type converts the meal to a portable format. */
  readonly portable?: boolean;
}

export interface DayPlan {
  readonly id: string;
  /** 0 = Monday … 6 = Sunday. */
  readonly dayIndex: number;
  readonly dayName: string;
  readonly dateLabel: string;
  readonly dayType: DayType;
  readonly status: DayStatus;
  readonly locked: boolean;
  readonly goalId: GoalId;
  /** Regeneration cycle position: 0 = canonical (undefined), 1–2 = alternates. */
  readonly variant?: number;
  /** Canonical score from the demo dataset. */
  readonly score: number;
  /** Canonical editorial totals (week.md). */
  readonly kcal: number;
  readonly proteinG: number;
  readonly costEur: number;
  readonly prepMinutes: number;
  /** Ingredient theme watermark for the honeycomb cell. */
  readonly themeImage: string;
  readonly meals: readonly PlannedMeal[];
}

export interface WeekPlan {
  readonly weekNumber: number;
  readonly goalId: GoalId;
  readonly days: readonly DayPlan[];
  readonly avgScore: number;
  readonly estimatedCostEur: number;
  readonly avgPrepMinutes: number;
  readonly budgetEur: number;
}

/** Standard demo meal slots. */
export const MEAL_TIMES: Record<MealType, string> = {
  breakfast: '08:00',
  lunch: '12:30',
  snack: '16:00',
  dinner: '19:30',
};

type MealSpec = readonly [
  mealType: MealType,
  name: string,
  items: readonly MealItem[],
  prep: number,
  cook: number,
  photo: string,
  status: MealStatus,
  note?: string,
];

function buildMeals(dayId: string, specs: readonly MealSpec[]): readonly PlannedMeal[] {
  return specs.map(([mealType, name, items, prepMinutes, cookMinutes, photo, status, note]) => ({
    id: `${dayId}-${mealType}`,
    mealType,
    name,
    time: MEAL_TIMES[mealType],
    items,
    prepMinutes,
    cookMinutes,
    photo,
    status,
    ...(note !== undefined ? { note } : {}),
  }));
}

interface DaySpec {
  readonly dayType: DayType;
  readonly status: DayStatus;
  readonly score: number;
  readonly kcal: number;
  readonly proteinG: number;
  readonly costEur: number;
  readonly prepMinutes: number;
  readonly themeImage: string;
  readonly meals: readonly MealSpec[];
}

const D = (
  dayType: DayType,
  status: DayStatus,
  score: number,
  kcal: number,
  proteinG: number,
  costEur: number,
  prepMinutes: number,
  themeImage: string,
  meals: readonly MealSpec[],
): DaySpec => ({ dayType, status, score, kcal, proteinG, costEur, prepMinutes, themeImage, meals });

const PHOTO = {
  oats: 'meal-oats-breakfast.jpg',
  chicken: 'meal-chicken-bowl.jpg',
  yoghurt: 'meal-yoghurt-snack.jpg',
  omelette: 'meal-omelette.jpg',
  salmon: 'meal-salmon-greens.jpg',
  bananaBar: 'meal-banana-oat-bar.jpg',
} as const;

/* eslint-disable @typescript-eslint/no-magic-numbers -- demo dataset */
const DAY_SPECS: readonly DaySpec[] = [
  // ---------------------------------------------------------------- Monday 82
  D('normal', 'done', 82, 2140, 132, 8.6, 24, 'ing-oats.png', [
    ['breakfast', 'Morning Oats Bowl',
      [{ ingredientId: 'oats', grams: 60 }, { ingredientId: 'banana', grams: 120 }, { ingredientId: 'walnuts', grams: 20 }, { ingredientId: 'greek-yoghurt', grams: 150 }],
      5, 0, PHOTO.oats, 'eaten'],
    ['lunch', 'Herb Chicken & Rice Bowl',
      [{ ingredientId: 'chicken-breast', grams: 140 }, { ingredientId: 'rice', grams: 180 }, { ingredientId: 'tomato', grams: 120 }, { ingredientId: 'olive-oil', grams: 14 }],
      10, 9, PHOTO.chicken, 'eaten'],
    ['snack', 'Greek Yoghurt & Walnuts',
      [{ ingredientId: 'greek-yoghurt', grams: 200 }, { ingredientId: 'walnuts', grams: 20 }],
      2, 0, PHOTO.yoghurt, 'eaten'],
    ['dinner', 'Spinach Tomato Omelette',
      [{ ingredientId: 'eggs', grams: 165 }, { ingredientId: 'spinach', grams: 80 }, { ingredientId: 'tomato', grams: 100 }, { ingredientId: 'olive-oil', grams: 10 }, { ingredientId: 'feta', grams: 30 }],
      7, 6, PHOTO.omelette, 'eaten'],
  ]),
  // --------------------------------------------------------------- Tuesday 78
  D('normal', 'done', 78, 2210, 138, 9.8, 25, 'ing-chicken.png', [
    ['breakfast', 'Tomato Spinach Omelette',
      [{ ingredientId: 'eggs', grams: 165 }, { ingredientId: 'tomato', grams: 100 }, { ingredientId: 'spinach', grams: 60 }, { ingredientId: 'olive-oil', grams: 8 }, { ingredientId: 'feta', grams: 30 }],
      6, 6, PHOTO.omelette, 'eaten'],
    ['lunch', 'Chicken Rice & Broccoli',
      [{ ingredientId: 'chicken-breast', grams: 150 }, { ingredientId: 'rice', grams: 200 }, { ingredientId: 'broccoli', grams: 100 }, { ingredientId: 'olive-oil', grams: 12 }],
      9, 10, PHOTO.chicken, 'eaten'],
    ['snack', 'Banana Yoghurt Snack',
      [{ ingredientId: 'banana', grams: 120 }, { ingredientId: 'greek-yoghurt', grams: 150 }, { ingredientId: 'walnuts', grams: 15 }],
      2, 0, PHOTO.bananaBar, 'eaten'],
    ['dinner', 'Salmon Greens',
      [{ ingredientId: 'salmon-fillet', grams: 150 }, { ingredientId: 'spinach', grams: 100 }, { ingredientId: 'broccoli', grams: 100 }, { ingredientId: 'olive-oil', grams: 10 }],
      8, 8, PHOTO.salmon, 'eaten'],
  ]),
  // ---------------------------------------------------- Wednesday 74 · Social
  D('social', 'done', 74, 1980, 108, 7.2, 14, 'ing-tomato.png', [
    ['breakfast', 'Morning Oats Bowl',
      [{ ingredientId: 'oats', grams: 60 }, { ingredientId: 'banana', grams: 120 }, { ingredientId: 'walnuts', grams: 20 }, { ingredientId: 'greek-yoghurt', grams: 150 }],
      5, 0, PHOTO.oats, 'eaten'],
    ['lunch', 'Tomato Eggs',
      [{ ingredientId: 'eggs', grams: 165 }, { ingredientId: 'tomato', grams: 150 }, { ingredientId: 'spinach', grams: 50 }, { ingredientId: 'olive-oil', grams: 10 }],
      6, 5, PHOTO.omelette, 'eaten'],
    ['snack', 'Greek Yoghurt & Walnuts',
      [{ ingredientId: 'greek-yoghurt', grams: 200 }, { ingredientId: 'walnuts', grams: 15 }],
      2, 0, PHOTO.yoghurt, 'eaten'],
    ['dinner', 'Dinner out, market bistro (est.)',
      [{ ingredientId: 'chicken-breast', grams: 120 }, { ingredientId: 'rice', grams: 150 }, { ingredientId: 'tomato', grams: 80 }, { ingredientId: 'olive-oil', grams: 20 }, { ingredientId: 'feta', grams: 40 }],
      1, 0, PHOTO.chicken, 'out', 'Social evening, estimated from the menu.'],
  ]),
  // ------------------------------------------------ Thursday 71 · today
  D('normal', 'today', 71, 2060, 118, 8.9, 21, 'ing-spinach.png', [
    ['breakfast', 'Banana Walnut Oats',
      [{ ingredientId: 'oats', grams: 50 }, { ingredientId: 'banana', grams: 120 }, { ingredientId: 'walnuts', grams: 15 }, { ingredientId: 'greek-yoghurt', grams: 120 }],
      5, 0, PHOTO.oats, 'eaten'],
    ['lunch', 'Herb Chicken & Rice Bowl',
      [{ ingredientId: 'chicken-breast', grams: 140 }, { ingredientId: 'rice', grams: 180 }, { ingredientId: 'tomato', grams: 120 }, { ingredientId: 'olive-oil', grams: 14 }],
      9, 9, PHOTO.chicken, 'next'],
    ['snack', 'Greek Yoghurt & Walnuts',
      [{ ingredientId: 'greek-yoghurt', grams: 170 }, { ingredientId: 'walnuts', grams: 20 }],
      2, 0, PHOTO.yoghurt, 'planned'],
    ['dinner', 'Spinach Tomato Omelette',
      [{ ingredientId: 'eggs', grams: 220 }, { ingredientId: 'spinach', grams: 100 }, { ingredientId: 'tomato', grams: 100 }, { ingredientId: 'feta', grams: 40 }, { ingredientId: 'olive-oil', grams: 8 }],
      5, 7, PHOTO.omelette, 'planned', 'Uses the spinach that expires tomorrow.'],
  ]),
  // ------------------------------------------------- Friday 86 · Training
  D('training', 'planned', 86, 2280, 146, 10.4, 25, 'ing-salmon.png', [
    ['breakfast', 'Eggs & Sourdough',
      [{ ingredientId: 'eggs', grams: 165 }, { ingredientId: 'sourdough', grams: 80 }, { ingredientId: 'spinach', grams: 60 }, { ingredientId: 'olive-oil', grams: 6 }],
      6, 5, PHOTO.omelette, 'planned'],
    ['lunch', 'Salmon Rice Bowl',
      [{ ingredientId: 'salmon-fillet', grams: 150 }, { ingredientId: 'rice', grams: 150 }, { ingredientId: 'broccoli', grams: 120 }, { ingredientId: 'olive-oil', grams: 10 }],
      9, 9, PHOTO.salmon, 'planned'],
    ['snack', 'Greek Yoghurt & Blueberries',
      [{ ingredientId: 'greek-yoghurt', grams: 200 }, { ingredientId: 'walnuts', grams: 20 }, { ingredientId: 'blueberries', grams: 50 }],
      2, 0, PHOTO.yoghurt, 'planned'],
    ['dinner', 'Chicken Rice',
      [{ ingredientId: 'chicken-breast', grams: 160 }, { ingredientId: 'rice', grams: 200 }, { ingredientId: 'spinach', grams: 100 }, { ingredientId: 'tomato', grams: 100 }, { ingredientId: 'olive-oil', grams: 12 }],
      8, 9, PHOTO.chicken, 'planned'],
  ]),
  // ------------------------------------------------------ Saturday 80 · Rest
  D('rest', 'planned', 80, 1890, 104, 7.8, 16, 'ing-banana.png', [
    ['breakfast', 'Morning Oats',
      [{ ingredientId: 'oats', grams: 55 }, { ingredientId: 'banana', grams: 120 }, { ingredientId: 'walnuts', grams: 15 }, { ingredientId: 'greek-yoghurt', grams: 120 }],
      5, 0, PHOTO.oats, 'planned'],
    ['lunch', 'Feta Tomato Omelette',
      [{ ingredientId: 'eggs', grams: 110 }, { ingredientId: 'tomato', grams: 100 }, { ingredientId: 'spinach', grams: 80 }, { ingredientId: 'feta', grams: 30 }, { ingredientId: 'olive-oil', grams: 8 }],
      6, 5, PHOTO.omelette, 'planned'],
    ['snack', 'Banana & Walnuts',
      [{ ingredientId: 'banana', grams: 120 }, { ingredientId: 'walnuts', grams: 25 }, { ingredientId: 'greek-yoghurt', grams: 100 }],
      2, 0, PHOTO.bananaBar, 'planned'],
    ['dinner', 'Chicken Avocado Salad Bowl',
      [{ ingredientId: 'chicken-breast', grams: 120 }, { ingredientId: 'tomato', grams: 150 }, { ingredientId: 'spinach', grams: 100 }, { ingredientId: 'avocado', grams: 80 }, { ingredientId: 'olive-oil', grams: 10 }, { ingredientId: 'feta', grams: 30 }],
      3, 0, PHOTO.chicken, 'planned', 'Rest day, assembly only.'],
  ]),
  // --------------------------------------------------- Sunday 84 · Prep day
  D('prep', 'planned', 84, 2180, 136, 9.7, 22, 'ing-eggs.png', [
    ['breakfast', 'Spinach Omelette',
      [{ ingredientId: 'eggs', grams: 165 }, { ingredientId: 'spinach', grams: 80 }, { ingredientId: 'tomato', grams: 100 }, { ingredientId: 'feta', grams: 30 }, { ingredientId: 'olive-oil', grams: 8 }],
      6, 6, PHOTO.omelette, 'planned'],
    ['lunch', 'Chicken Bowl',
      [{ ingredientId: 'chicken-breast', grams: 150 }, { ingredientId: 'rice', grams: 180 }, { ingredientId: 'broccoli', grams: 100 }, { ingredientId: 'olive-oil', grams: 12 }],
      9, 10, PHOTO.chicken, 'planned'],
    ['snack', 'Greek Yoghurt & Banana',
      [{ ingredientId: 'greek-yoghurt', grams: 180 }, { ingredientId: 'walnuts', grams: 20 }, { ingredientId: 'banana', grams: 120 }],
      2, 0, PHOTO.yoghurt, 'planned'],
    ['dinner', 'Salmon Greens',
      [{ ingredientId: 'salmon-fillet', grams: 140 }, { ingredientId: 'spinach', grams: 100 }, { ingredientId: 'broccoli', grams: 100 }, { ingredientId: 'olive-oil', grams: 10 }],
      5, 8, PHOTO.salmon, 'planned', 'Prep day, rice and chicken batch-cooked at 17:00.'],
  ]),
];
/* eslint-enable @typescript-eslint/no-magic-numbers */

const DAY_IDS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_DATES = ['9 June', '10 June', '11 June', '12 June', '13 June', '14 June', '15 June'] as const;

function buildDay(index: number, spec: DaySpec): DayPlan {
  const id = DAY_IDS[index];
  return {
    id,
    dayIndex: index,
    dayName: DAY_NAMES[index],
    dateLabel: DAY_DATES[index],
    dayType: spec.dayType,
    status: spec.status,
    locked: false,
    goalId: 'healthy-strong',
    score: spec.score,
    kcal: spec.kcal,
    proteinG: spec.proteinG,
    costEur: spec.costEur,
    prepMinutes: spec.prepMinutes,
    themeImage: spec.themeImage,
    meals: buildMeals(id, spec.meals),
  };
}

/** The canonical Week 24 demo week. */
export const DEMO_WEEK: WeekPlan = {
  weekNumber: 24,
  goalId: 'healthy-strong',
  days: DAY_SPECS.map((spec, i) => buildDay(i, spec)),
  avgScore: 79,
  estimatedCostEur: 62.4,
  avgPrepMinutes: 22,
  budgetEur: 70,
};

/** Today (Thursday) — the in-progress day. */
export const TODAY_DAY: DayPlan = DEMO_WEEK.days[3];

/** Thursday Lunch — the canonical Meal Architect starting composition. */
export const ARCHITECT_START_MEAL: PlannedMeal = TODAY_DAY.meals[1];

/** Look up a day by id ('mon' … 'sun'). */
export function getDay(dayId: string): DayPlan {
  const day = DEMO_WEEK.days.find((d) => d.id === dayId);
  if (!day) throw new Error(`Unknown day id: ${dayId}`);
  return day;
}
