/**
 * LIFE7 — Demo user profile (design.md §11) and the fixed demo "now".
 *
 * Alex · 36 · male · 182 cm · 84 kg · goal Healthy & Strong (composite of
 * Healthy + Strong) · €70/week food budget · ≤ 25 min cooking · 4 meals/day ·
 * no shellfish · shops at supermarket, farmers market and online.
 */

import { estimateTdee, mifflinStJeorBmr, type ActivityLevel, type Sex } from '../lib/nutrition';
import type { GoalId } from '../lib/scoring';
import type { StoreId } from './ingredients';

export interface UserProfile {
  readonly id: string;
  readonly name: string;
  readonly avatar: string;
  readonly age: number;
  readonly sex: Sex;
  readonly heightCm: number;
  readonly weightKg: number;
  readonly activity: ActivityLevel;
  /** Composite goal applied across the week. */
  readonly goalId: GoalId;
  /** Up to two goals selected in the intake wizard. */
  readonly selectedGoals: readonly GoalId[];
  readonly weeklyBudgetEur: number;
  readonly maxCookingMinutes: number;
  readonly mealsPerDay: number;
  readonly allergies: readonly string[];
  readonly excludedFoods: readonly string[];
  readonly favouriteFoods: readonly string[];
  readonly country: string;
  readonly stores: readonly StoreId[];
  readonly subscription: 'life7-core' | 'life7-boost';
}

/** Daily nutrient targets derived from the profile + goal. */
export interface DailyTargets {
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly fibreG: number;
  readonly waterMl: number;
}

export const USER_PROFILE: UserProfile = {
  id: 'alex',
  name: 'Alex',
  avatar: 'avatar-alex.png',
  age: 36,
  sex: 'male',
  heightCm: 182,
  weightKg: 84,
  activity: 'moderate',
  goalId: 'healthy-strong',
  selectedGoals: ['healthy', 'strong'],
  weeklyBudgetEur: 70,
  maxCookingMinutes: 25,
  mealsPerDay: 4,
  allergies: ['shellfish'],
  excludedFoods: [],
  favouriteFoods: ['chicken', 'oats', 'banana'],
  country: 'Finland',
  stores: ['supermarket', 'market', 'online'],
  subscription: 'life7-core',
};

const BMR = mifflinStJeorBmr(USER_PROFILE.sex, USER_PROFILE.weightKg, USER_PROFILE.heightCm, USER_PROFILE.age); // 1802.5
const TDEE = estimateTdee(BMR, USER_PROFILE.activity); // ≈ 2794

/**
 * Daily targets. Energy from Mifflin–St Jeor × 1.55 (moderate), rounded.
 * Protein 1.8 g/kg for the strength component; fibre 30 g; macro split follows
 * the Healthy & Strong goal profile (P 35 / C 40 / F 25).
 */
export const DAILY_TARGETS: DailyTargets = {
  kcal: Math.round(TDEE / 100) * 100, // 2800
  proteinG: Math.round((1.8 * USER_PROFILE.weightKg) / 10) * 10, // 150
  carbsG: 280,
  fatG: 78,
  fibreG: 30,
  waterMl: 2400,
};
/** Exposed for screens that show the underlying energy math. */
export const ENERGY_ESTIMATES = { bmrKcal: BMR, tdeeKcal: Math.round(TDEE) } as const;

/** The deterministic demo clock: Thursday of Week 24, 14:20. */
export interface DemoNow {
  readonly dateLabel: string;
  readonly weekNumber: number;
  /** 0 = Monday … 6 = Sunday. */
  readonly dayIndex: number;
  readonly dayName: string;
  /** Minutes since midnight (14:20 → 860). */
  readonly timeMinutes: number;
  readonly dayOfWeekLabel: string;
}

export const DEMO_NOW: DemoNow = {
  dateLabel: 'Thursday, 12 June',
  weekNumber: 24,
  dayIndex: 3,
  dayName: 'Thursday',
  timeMinutes: 14 * 60 + 20,
  dayOfWeekLabel: 'Week 24 · Day 4 of 7',
};

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
