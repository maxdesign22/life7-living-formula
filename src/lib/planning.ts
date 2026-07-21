/**
 * LIFE7 — Week planning (pure, deterministic).
 *
 * Seven-day plan assembly, day-type modifiers (travel / rest / training /
 * social / prep), regenerate-day (cycles two deterministic alternates),
 * lock-day, optimise-week and meal moves. All transforms are immutable:
 * inputs are never mutated, a new WeekPlan is returned.
 */

import {
  DEMO_WEEK,
  type DayPlan,
  type DayType,
  type PlannedMeal,
  type WeekPlan,
} from '../data/demoWeek';
import { scoreDay, type GoalId } from './scoring';
import { dayTotals, round1, round2, type MealItem } from './nutrition';

// ------------------------------------------------------------------ assembly

export interface WeekAggregates {
  readonly avgScore: number;
  readonly estimatedCostEur: number;
  readonly avgPrepMinutes: number;
}

/** Compute week-level aggregates from the days (canonical fields). */
export function weekAggregates(days: readonly DayPlan[]): WeekAggregates {
  if (days.length === 0) return { avgScore: 0, estimatedCostEur: 0, avgPrepMinutes: 0 };
  const avgScore = Math.round(days.reduce((a, d) => a + d.score, 0) / days.length);
  const estimatedCostEur = round2(days.reduce((a, d) => a + d.costEur, 0));
  const avgPrepMinutes = Math.round(days.reduce((a, d) => a + d.prepMinutes, 0) / days.length);
  return { avgScore, estimatedCostEur, avgPrepMinutes };
}

/** Assemble a WeekPlan from days (+ goal/budget), deriving the aggregates. */
export function assembleWeek(
  days: readonly DayPlan[],
  options?: { readonly weekNumber?: number; readonly goalId?: GoalId; readonly budgetEur?: number },
): WeekPlan {
  return {
    weekNumber: options?.weekNumber ?? DEMO_WEEK.weekNumber,
    goalId: options?.goalId ?? DEMO_WEEK.goalId,
    days,
    ...weekAggregates(days),
    budgetEur: options?.budgetEur ?? DEMO_WEEK.budgetEur,
  };
}

/** The canonical Week 24 plan (already assembled). */
export function getDemoWeek(): WeekPlan {
  return DEMO_WEEK;
}

function replaceDay(week: WeekPlan, next: DayPlan): WeekPlan {
  return assembleWeek(
    week.days.map((d) => (d.id === next.id ? next : d)),
    { weekNumber: week.weekNumber, goalId: week.goalId, budgetEur: week.budgetEur },
  );
}

function getDayOrThrow(week: WeekPlan, dayId: string): DayPlan {
  const day = week.days.find((d) => d.id === dayId);
  if (!day) throw new Error(`Unknown day id: ${dayId}`);
  return day;
}

// ----------------------------------------------------------- day-type marking

export interface DayTypeChange {
  readonly week: WeekPlan;
  readonly dayId: string;
  readonly dayType: DayType;
  /** Human summary, e.g. "Friday becomes portable: 2 meals converted." */
  readonly summary: string;
}

function patchMeal(meal: PlannedMeal, patch: Partial<PlannedMeal>): PlannedMeal {
  return { ...meal, ...patch };
}

/**
 * Apply a day-type modifier. Deterministic effects:
 * - travel:   breakfast + lunch become portable jars (caption attached)
 * - rest:     dinner lightened (−6 g olive oil), assembly note
 * - training: snack yoghurt +30 g for extra protein
 * - social:   dinner becomes an estimated "out" meal
 * - prep:     dinner gains the 17:00 batch-cook note
 * - normal:   clears modifiers back to the canonical day
 */
export function applyDayType(week: WeekPlan, dayId: string, dayType: DayType): DayTypeChange {
  const day = getDayOrThrow(week, dayId);
  const canonical = DEMO_WEEK.days.find((d) => d.id === dayId);
  const baseMeals = (canonical?.meals ?? day.meals) as readonly PlannedMeal[];

  let meals = baseMeals.map((m) => ({ ...m }));
  let summary = `${day.dayName} set to ${dayType}.`;

  switch (dayType) {
    case 'travel': {
      let converted = 0;
      meals = meals.map((m) =>
        m.mealType === 'breakfast' || m.mealType === 'lunch'
          ? (converted++,
            patchMeal(m, {
              name: `${m.name} — portable jar`,
              portable: true,
              note: 'Portable — assembled the night before, eats cold.',
            }))
          : m,
      );
      summary = `${day.dayName} becomes portable: ${converted} meals converted, no expiry risk.`;
      break;
    }
    case 'rest': {
      meals = meals.map((m) =>
        m.mealType === 'dinner'
          ? patchMeal(m, {
              items: m.items.map((it): MealItem =>
                it.ingredientId === 'olive-oil' ? { ...it, grams: Math.max(0, it.grams - 6) } : it,
              ),
              note: 'Rest day — lighter finish, assembly only.',
            })
          : m,
      );
      summary = `${day.dayName} slows down: dinner lightened, prep stays under 20 minutes.`;
      break;
    }
    case 'training': {
      meals = meals.map((m) =>
        m.mealType === 'snack'
          ? patchMeal(m, {
              items: m.items.map((it): MealItem =>
                it.ingredientId === 'greek-yoghurt' ? { ...it, grams: it.grams + 30 } : it,
              ),
              note: 'Training day — extra protein around the session.',
            })
          : m,
      );
      summary = `${day.dayName} is fuelled: +30 g yoghurt around training.`;
      break;
    }
    case 'social': {
      meals = meals.map((m) =>
        m.mealType === 'dinner'
          ? patchMeal(m, {
              name: 'Dinner out — market bistro (est.)',
              status: day.status === 'planned' ? 'planned' : m.status,
              prepMinutes: 1,
              cookMinutes: 0,
              note: 'Social evening — estimated from the menu, macros held.',
            })
          : m,
      );
      summary = `${day.dayName} goes social: dinner out, the rest of the day holds the macros.`;
      break;
    }
    case 'prep': {
      meals = meals.map((m) =>
        m.mealType === 'dinner'
          ? patchMeal(m, { note: 'Prep day — rice and chicken batch-cooked at 17:00.' })
          : m,
      );
      summary = `${day.dayName} becomes prep day: 35 minutes at 17:00 saves 52 across the week.`;
      break;
    }
    case 'normal': {
      summary = `${day.dayName} is back to the standard rhythm.`;
      break;
    }
  }

  const totals = dayTotals(meals.map((m) => m.items));
  const next: DayPlan = {
    ...day,
    dayType,
    meals,
    kcal: Math.round(totals.kcal),
    proteinG: Math.round(totals.protein),
    prepMinutes: meals.reduce((a, m) => a + m.prepMinutes, 0),
  };
  return { week: replaceDay(week, next), dayId, dayType, summary };
}

// ------------------------------------------------------------- regenerate day

/** Deterministic rotation offsets (per meal type) for the two alternates. */
const REGEN_VARIANTS: readonly (readonly number[])[] = [
  [2, 3, 1, 4], // variant 1: breakfast +2 days, lunch +3, snack +1, dinner +4
  [4, 5, 2, 1], // variant 2
];

export interface RegenerateResult {
  readonly week: WeekPlan;
  readonly dayId: string;
  /** 0 = canonical, 1 or 2 = alternate set. */
  readonly variant: number;
  readonly scoreBefore: number;
  readonly scoreAfter: number;
}

/**
 * Regenerate a day by cycling canonical → alternate 1 → alternate 2 →
 * canonical. Alternates rotate same-type meals from other days of the week
 * (deterministic, no randomness). Locked days are returned unchanged.
 */
export function regenerateDay(week: WeekPlan, dayId: string): RegenerateResult {
  const day = getDayOrThrow(week, dayId);
  if (day.locked) {
    return { week, dayId, variant: day.variant ?? 0, scoreBefore: day.score, scoreAfter: day.score };
  }
  const currentVariant = day.variant ?? 0;
  const nextVariant = (currentVariant + 1) % 3;

  let meals: readonly PlannedMeal[];
  if (nextVariant === 0) {
    meals = DEMO_WEEK.days[day.dayIndex].meals.map((m) => ({ ...m }));
  } else {
    const offsets = REGEN_VARIANTS[nextVariant - 1];
    meals = day.meals.map((meal, i) => {
      const sourceDay = DEMO_WEEK.days[(day.dayIndex + offsets[i]) % 7];
      const source = sourceDay.meals[i];
      return {
        ...source,
        id: `${day.id}-${meal.mealType}`,
        status: meal.status,
        time: meal.time,
      };
    });
  }

  const live = scoreDay(
    meals.map((m) => ({ items: m.items, mealType: m.mealType })),
    day.goalId,
  );
  const totals = dayTotals(meals.map((m) => m.items));
  const next: DayPlan = {
    ...day,
    variant: nextVariant,
    meals,
    score: nextVariant === 0 ? (DEMO_WEEK.days[day.dayIndex].score) : live.total,
    kcal: Math.round(totals.kcal),
    proteinG: Math.round(totals.protein),
    prepMinutes: meals.reduce((a, m) => a + m.prepMinutes, 0),
  };
  return {
    week: replaceDay(week, next),
    dayId,
    variant: nextVariant,
    scoreBefore: day.score,
    scoreAfter: next.score,
  };
}

// ------------------------------------------------------------------- lock day

/** Lock or unlock a day. Locked days are excluded from optimise/regenerate. */
export function lockDay(week: WeekPlan, dayId: string, locked = true): WeekPlan {
  const day = getDayOrThrow(week, dayId);
  return replaceDay(week, { ...day, locked });
}

// -------------------------------------------------------------- optimise week

/** Deterministic optimise-week patches (week.md: Thu 71→74, Wed 74→77, Sat 80→82). */
const OPTIMISE_PATCHES: Readonly<Record<string, { readonly to: number; readonly tweak: string }>> = {
  thu: { to: 74, tweak: 'Greek yoghurt +30 g at snack — protein evens out.' },
  wed: { to: 77, tweak: 'Tomato eggs gain spinach — fibre up on the social day.' },
  sat: { to: 82, tweak: 'Rest-day dinner adds broccoli — micro coverage closes.' },
};

export interface OptimiseChange {
  readonly dayId: string;
  readonly dayName: string;
  readonly from: number;
  readonly to: number;
  readonly tweak: string;
}

export interface OptimiseResult {
  readonly week: WeekPlan;
  readonly changes: readonly OptimiseChange[];
  readonly skippedLocked: readonly string[];
  readonly message: string;
  readonly avgBefore: number;
  readonly avgAfter: number;
}

/**
 * Rebalance the week: deterministic protein/fibre evening across unlocked
 * days. Matches the week.md money moment (Thu 71→74, Wed 74→77, Sat 80→82,
 * toast "Week rebalanced — protein evened across 7 days.").
 */
export function optimiseWeek(week: WeekPlan): OptimiseResult {
  const changes: OptimiseChange[] = [];
  const skippedLocked: string[] = [];
  const days = week.days.map((day) => {
    const patch = OPTIMISE_PATCHES[day.id];
    if (!patch || day.score >= patch.to) return day;
    if (day.locked) {
      skippedLocked.push(day.id);
      return day;
    }
    changes.push({ dayId: day.id, dayName: day.dayName, from: day.score, to: patch.to, tweak: patch.tweak });
    return { ...day, score: patch.to };
  });
  const next = assembleWeek(days, { weekNumber: week.weekNumber, goalId: week.goalId, budgetEur: week.budgetEur });
  return {
    week: next,
    changes,
    skippedLocked,
    message: 'Week rebalanced — protein evened across 7 days.',
    avgBefore: week.avgScore,
    avgAfter: next.avgScore,
  };
}

// ------------------------------------------------------------------ move meal

export interface MoveMealResult {
  readonly week: WeekPlan;
  readonly mealName: string;
  readonly fromDayId: string;
  readonly toDayId: string;
  /** Protein change of the target day, for the toast ("Friday protein +24 g"). */
  readonly targetProteinDeltaG: number;
}

/** Move one meal to another day (replacing the same meal type there). */
export function moveMeal(week: WeekPlan, fromDayId: string, toDayId: string, mealType: PlannedMeal['mealType']): MoveMealResult {
  const from = getDayOrThrow(week, fromDayId);
  const to = getDayOrThrow(week, toDayId);
  const meal = from.meals.find((m) => m.mealType === mealType);
  if (!meal) throw new Error(`Day ${fromDayId} has no ${mealType} meal`);

  const toBefore = dayTotals(to.meals.map((m) => m.items));
  const fromMeals = from.meals.filter((m) => m.mealType !== mealType);
  const toMeals = to.meals.map((m) =>
    m.mealType === mealType ? { ...meal, id: `${to.id}-${mealType}`, status: m.status, time: m.time } : m,
  );
  const toAfter = dayTotals(toMeals.map((m) => m.items));

  const nextFrom: DayPlan = {
    ...from,
    meals: fromMeals,
    kcal: Math.round(dayTotals(fromMeals.map((m) => m.items)).kcal),
    proteinG: Math.round(dayTotals(fromMeals.map((m) => m.items)).protein),
  };
  const nextTo: DayPlan = {
    ...to,
    meals: toMeals,
    kcal: Math.round(toAfter.kcal),
    proteinG: Math.round(toAfter.protein),
  };
  const days = week.days.map((d) => (d.id === fromDayId ? nextFrom : d.id === toDayId ? nextTo : d));
  return {
    week: assembleWeek(days, { weekNumber: week.weekNumber, goalId: week.goalId, budgetEur: week.budgetEur }),
    mealName: meal.name,
    fromDayId,
    toDayId,
    targetProteinDeltaG: round1(toAfter.protein - toBefore.protein),
  };
}

/** Live (recomputed) score for a day from its current meals. */
export function computeDayScore(day: DayPlan): number {
  return scoreDay(
    day.meals.map((m) => ({ items: m.items, mealType: m.mealType })),
    day.goalId,
  ).total;
}
