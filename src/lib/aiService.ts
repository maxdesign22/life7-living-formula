/**
 * LIFE7 — AI service interface + deterministic mock adapter.
 *
 * No external APIs. `MockAIService` pattern-matches coach commands against
 * `data/coachScripts.ts`, returns the exact §10 daily insight, and maps the
 * generator intake form to a full 7-day plan built on the real logic modules
 * (planning, scoring, shopping, pantry). `getAIService()` is the factory the
 * UI uses — swapping in a live backend later touches nothing else.
 */

import {
  COACH_FALLBACK,
  COACH_FALLBACK_THINKING_MS,
  COACH_WELCOME,
  matchCoachScript,
  QUICK_DINNER_ALTERNATES,
  QUICK_DINNER_ALTERNATE_REPLIES,
  type CoachAction,
  type CoachCard,
  type CoachScript,
} from '../data/coachScripts';
import { DEMO_WEEK, type DayPlan, type PlannedMeal, type WeekPlan } from '../data/demoWeek';
import { DAILY_TARGETS, USER_PROFILE } from '../data/profile';
import type { StoreId } from '../data/ingredients';
import { assembleWeek } from './planning';
import { compositeGoal, scoreDay, type GoalId } from './scoring';
import { dayTotals, round2, type ActivityLevel, type Sex } from './nutrition';
import { createDemoPantry, getPantrySummary } from './pantry';
import { aggregatePlanNeeds, buildShoppingList, deductPantry } from './shopping';

// ------------------------------------------------------------------- insight

export interface InsightAction {
  readonly id: string;
  readonly label: string;
  readonly style: 'gold' | 'ghost';
  readonly route: string;
}

export interface DailyInsight {
  /** Exact §10 copy. */
  readonly text: string;
  readonly subline: string;
  readonly energyPctOfTarget: number;
  readonly proteinPctOfTarget: number;
  readonly actions: readonly InsightAction[];
}

export const DAILY_INSIGHT_COPY =
  'You are at 72% of your energy target but only 48% of your protein target. Your next meal should prioritise lean protein and vegetables.';

export const DAILY_INSIGHT_SUBLINE =
  'Suggested adjustment ready in Meal Architect. Adds 32 g protein for +118 kcal.';

// --------------------------------------------------------------------- coach

export interface CoachReply {
  readonly scriptId: string;
  readonly text: string;
  readonly cards: readonly CoachCard[];
  readonly actions: readonly CoachAction[];
  /** Deterministic thinking time for the shimmer theater. */
  readonly thinkingMs: number;
  /** False when the fallback answered. */
  readonly matched: boolean;
}

export interface CoachContext {
  readonly week?: WeekPlan;
  readonly nowMinutes?: number;
}

// ----------------------------------------------------------------- generator

export interface GeneratorIntake {
  readonly age: number;
  readonly sex: Sex;
  readonly heightCm: number;
  readonly weightKg: number;
  readonly activity: ActivityLevel;
  /** Up to two goals (composite shown as e.g. "Healthy & Strong"). */
  readonly goals: readonly GoalId[];
  readonly weeklyBudgetEur: number;
  readonly maxCookingMinutes: number;
  readonly mealsPerDay: number;
  readonly allergies: readonly string[];
  readonly excludedFoods: readonly string[];
  readonly favouriteFoods: readonly string[];
  readonly country: string;
  readonly stores: readonly StoreId[];
}

/** Wizard defaults = Alex's profile (generator.md). */
export const DEFAULT_INTAKE: GeneratorIntake = {
  age: USER_PROFILE.age,
  sex: USER_PROFILE.sex,
  heightCm: USER_PROFILE.heightCm,
  weightKg: USER_PROFILE.weightKg,
  activity: USER_PROFILE.activity,
  goals: ['healthy', 'strong'],
  weeklyBudgetEur: USER_PROFILE.weeklyBudgetEur,
  maxCookingMinutes: USER_PROFILE.maxCookingMinutes,
  mealsPerDay: USER_PROFILE.mealsPerDay,
  allergies: [...USER_PROFILE.allergies],
  excludedFoods: [],
  favouriteFoods: [...USER_PROFILE.favouriteFoods],
  country: USER_PROFILE.country,
  stores: [...USER_PROFILE.stores],
};

export interface GeneratedWeekSummary {
  readonly weekScore: number;
  readonly totalCostEur: number;
  readonly budgetDeltaEur: number;
  readonly avgPrepMinutes: number;
  readonly pantryUsagePct: number;
}

export interface ShoppingPreviewItem {
  readonly name: string;
  readonly quantityLabel: string;
  readonly priceEur: number;
  readonly image: string;
}

export interface GeneratedWeek {
  readonly week: WeekPlan;
  readonly goalLabel: string;
  readonly summary: GeneratedWeekSummary;
  /** The four thinking-state lines (deterministic theater). */
  readonly thinkingLines: readonly string[];
  readonly shoppingPreview: readonly ShoppingPreviewItem[];
  readonly shoppingMoreCount: number;
  readonly pantryChips: readonly string[];
  readonly leftovers: readonly { readonly label: string; readonly destination: string }[];
  readonly expiryNote: string;
  readonly expiryChips: readonly { readonly name: string; readonly dayLabel: string; readonly freshnessPct: number }[];
  readonly prepSchedule: {
    readonly dayLabel: string;
    readonly time: string;
    readonly tasks: string;
    readonly totalMinutes: number;
    readonly savesMinutes: number;
  };
}

// ------------------------------------------------------------------ interface

export interface AIService {
  /** The Today insight card (exact §10 copy). */
  getDailyInsight(): Promise<DailyInsight>;
  /** First-mount coach welcome (verbatim copy + 3 actions). */
  getCoachWelcome(): Promise<CoachReply>;
  /** Pattern-matched coach reply; fallback when unmatched. */
  sendCoachMessage(text: string, context?: CoachContext): Promise<CoachReply>;
  /** "Another option" — cycles the 3 deterministic quick-dinner alternates. */
  cycleQuickDinner(step: number): Promise<CoachReply>;
  /** Intake form → full 7-day plan (deterministic). */
  generateWeek(intake: GeneratorIntake): Promise<GeneratedWeek>;
  /** Context chips for the coach context pin. */
  getContextChips(): Promise<readonly string[]>;
}

// ---------------------------------------------------------------------- mock

function scriptToReply(script: CoachScript): CoachReply {
  return {
    scriptId: script.id,
    text: script.reply,
    cards: script.cards,
    actions: script.actions,
    thinkingMs: script.thinkingMs,
    matched: true,
  };
}

/** Trim/extend a day to the requested meals-per-day (deterministic). */
function adaptMealsPerDay(day: DayPlan, mealsPerDay: number): DayPlan {
  if (mealsPerDay === 4) return day;
  let meals: readonly PlannedMeal[] = day.meals;
  if (mealsPerDay <= 3) {
    meals = meals.filter((m) => m.mealType !== 'snack');
  }
  if (mealsPerDay === 2) {
    meals = meals.filter((m) => m.mealType !== 'breakfast');
  }
  if (mealsPerDay === 5) {
    const snack = day.meals.find((m) => m.mealType === 'snack');
    if (snack) {
      const evening: PlannedMeal = {
        ...snack,
        id: `${day.id}-evening-snack`,
        name: 'Evening Yoghurt Cup',
        time: '21:00',
        items: snack.items.map((i) => ({ ...i, grams: Math.round(i.grams / 2) })),
      };
      meals = [...meals, evening];
    }
  }
  const totals = dayTotals(meals.map((m) => m.items));
  return {
    ...day,
    meals,
    kcal: Math.round(totals.kcal),
    proteinG: Math.round(totals.protein),
    prepMinutes: meals.reduce((a, m) => a + m.prepMinutes, 0),
  };
}

export class MockAIService implements AIService {
  async getDailyInsight(): Promise<DailyInsight> {
    return {
      text: DAILY_INSIGHT_COPY,
      subline: DAILY_INSIGHT_SUBLINE,
      energyPctOfTarget: 72,
      proteinPctOfTarget: 48,
      actions: [
        { id: 'apply-next-meal', label: 'Apply to next meal', style: 'gold', route: '/architect' },
        { id: 'ask-coach', label: 'Ask coach', style: 'ghost', route: '/coach' },
      ],
    };
  }

  async getCoachWelcome(): Promise<CoachReply> {
    return {
      scriptId: 'welcome',
      text: COACH_WELCOME.reply,
      cards: [],
      actions: [...COACH_WELCOME.actions],
      thinkingMs: 0,
      matched: true,
    };
  }

  async sendCoachMessage(text: string, _context?: CoachContext): Promise<CoachReply> {
    const script = matchCoachScript(text);
    if (script) return scriptToReply(script);
    return {
      scriptId: COACH_FALLBACK.id,
      text: COACH_FALLBACK.reply,
      cards: COACH_FALLBACK.cards,
      actions: COACH_FALLBACK.actions,
      thinkingMs: COACH_FALLBACK_THINKING_MS,
      matched: false,
    };
  }

  async cycleQuickDinner(step: number): Promise<CoachReply> {
    const index = ((step % QUICK_DINNER_ALTERNATES.length) + QUICK_DINNER_ALTERNATES.length) % QUICK_DINNER_ALTERNATES.length;
    const base = COACH_SCRIPTS_SAFE.quickDinner;
    return {
      scriptId: 'quick-dinner',
      text: QUICK_DINNER_ALTERNATE_REPLIES[index],
      cards: [QUICK_DINNER_ALTERNATES[index]],
      actions: base.actions,
      thinkingMs: base.thinkingMs,
      matched: true,
    };
  }

  async generateWeek(intake: GeneratorIntake): Promise<GeneratedWeek> {
    const goalId: GoalId =
      intake.goals.length === 2
        ? compositeGoal(intake.goals[0], intake.goals[1]).id
        : intake.goals[0] ?? 'healthy-strong';
    const goal = intake.goals.length === 2 ? compositeGoal(intake.goals[0], intake.goals[1]) : compositeGoal(goalId, goalId);

    // Map intake → days: start from the canonical week, adapt meal count,
    // then re-score every day against the requested goal.
    const days = DEMO_WEEK.days.map((day) => {
      const adapted = adaptMealsPerDay({ ...day, goalId }, intake.mealsPerDay);
      const live = scoreDay(
        adapted.meals.map((m) => ({ items: m.items, mealType: m.mealType })),
        goalId,
      );
      return { ...adapted, score: live.total };
    });
    const week = assembleWeek(days, { goalId, budgetEur: intake.weeklyBudgetEur });

    // Cost & pantry usage from the real modules.
    const pantry = createDemoPantry();
    const list = buildShoppingList(week, pantry, { budgetEur: intake.weeklyBudgetEur });
    const needs = deductPantry(aggregatePlanNeeds(week), pantry);
    const totalG = needs.reduce((a, n) => a + n.neededG + n.coveredG, 0);
    const coveredG = needs.reduce((a, n) => a + n.coveredG, 0);
    // Canonical headline is 71 % for the demo intake (generator.md); other
    // intakes fall back to the gram-share computed from pantry coverage.
    const isDemoIntake =
      intake.mealsPerDay === 4 &&
      intake.goals.length === 2 &&
      intake.goals.includes('healthy') &&
      intake.goals.includes('strong');
    const pantryUsagePct = isDemoIntake
      ? 71
      : totalG > 0
        ? Math.round((coveredG / totalG) * 100)
        : 71;

    const totalCostEur = intake.weeklyBudgetEur >= 70 ? 62.4 : round2(Math.min(62.4, list.totalEur));

    return {
      week,
      goalLabel: goal.label,
      summary: {
        weekScore: 84,
        totalCostEur,
        budgetDeltaEur: round2(intake.weeklyBudgetEur - totalCostEur),
        avgPrepMinutes: 22,
        pantryUsagePct,
      },
      thinkingLines: [
        'Balancing protein across seven days…',
        `Pricing your basket across ${intake.stores.length} stores…`,
        'Sequencing what expires first…',
        'Composing your week.',
      ],
      shoppingPreview: [
        { name: 'Chicken breast', quantityLabel: '800 g', priceEur: 6.8, image: 'ing-chicken.png' },
        { name: 'Greek yoghurt', quantityLabel: '1 kg', priceEur: 5.6, image: 'ing-yoghurt.png' },
        { name: 'Salmon fillet', quantityLabel: '400 g', priceEur: 7.6, image: 'ing-salmon.png' },
        { name: 'Eggs', quantityLabel: '×18', priceEur: 4.5, image: 'ing-eggs.png' },
        { name: 'Broccoli', quantityLabel: '400 g', priceEur: 0.9, image: 'ing-broccoli.png' },
        { name: 'Sourdough', quantityLabel: '1 loaf', priceEur: 4.1, image: 'ing-sourdough.png' },
      ],
      shoppingMoreCount: 12,
      pantryChips: ['rice', 'oats', 'eggs', 'spinach', 'yoghurt', 'olive oil'],
      leftovers: [
        { label: 'Cooked rice +300 g', destination: 'Thursday lunch' },
        { label: 'Roast chicken +120 g', destination: 'Friday bowl' },
      ],
      expiryNote:
        'Spinach lands on Thursday dinner, broccoli by Saturday. Nothing in this plan should be thrown away.',
      expiryChips: [
        { name: 'Spinach', dayLabel: 'Thu', freshnessPct: 82 },
        { name: 'Broccoli', dayLabel: 'Sat', freshnessPct: 88 },
        { name: 'Yoghurt', dayLabel: 'Sun', freshnessPct: 74 },
      ],
      prepSchedule: {
        dayLabel: 'Sunday',
        time: '17:00',
        tasks: 'Cook rice 400 g · roast chicken 2 fillets · wash greens',
        totalMinutes: 35,
        savesMinutes: 52,
      },
    };
  }

  async getContextChips(): Promise<readonly string[]> {
    const pantry = createDemoPantry();
    const summary = getPantrySummary(pantry);
    return [
      `Profile · ${USER_PROFILE.name}, ${USER_PROFILE.age}, Healthy & Strong`,
      `Week 24 · Thursday, day 4 of 7`,
      `Pantry · ${summary.itemCount} items · ${summary.expiringSoon} expiring`,
      `Targets · ${DAILY_TARGETS.kcal} kcal · P ${DAILY_TARGETS.proteinG} g`,
    ];
  }
}

/** Cached quick-dinner script bits for the alternates cycler. */
const COACH_SCRIPTS_SAFE = {
  quickDinner: {
    actions: [
      { id: 'add-to-today', label: 'Add to today', style: 'gold' },
      { id: 'another-option', label: 'Another option', style: 'glass' },
    ] as readonly CoachAction[],
    thinkingMs: 950,
  },
};

let instance: AIService | undefined;

/** Factory: returns the deterministic mock (the only adapter in the demo). */
export function getAIService(): AIService {
  if (!instance) instance = new MockAIService();
  return instance;
}
