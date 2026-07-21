/**
 * LIFE7 — AI Coach scripted flows (coach.md).
 *
 * Eight deterministic command flows (pattern-matched mock AI — no external
 * API), each with the exact reply copy, contextual cards and action buttons.
 * Every reply ends with actions — that is the product rule.
 */

import type { MealType } from '../lib/scoring';

export interface CoachAction {
  readonly id: string;
  readonly label: string;
  readonly style: 'primary' | 'gold' | 'glass' | 'ghost';
}

export type CoachCard =
  | {
      readonly kind: 'meal-preview';
      readonly mealId: string;
      readonly mealType: MealType;
      readonly name: string;
      readonly photo: string;
      readonly kcal: number;
      readonly proteinG: number;
      readonly prepMinutes: number;
      readonly note?: string;
    }
  | {
      readonly kind: 'replacement';
      readonly beforeLabel: string;
      readonly afterLabel: string;
      readonly proteinDeltaG: number;
      readonly savesEur: number;
      readonly note: string;
    }
  | {
      readonly kind: 'goal-adjustment';
      readonly currentLabel: string;
      readonly proposedLabel: string;
      readonly proteinDeltaG: number;
      readonly kcalDelta: number;
    }
  | {
      readonly kind: 'week-insight';
      readonly finding: string;
      readonly dayScores: readonly number[];
    }
  | {
      readonly kind: 'recalculation';
      readonly changes: readonly { readonly label: string; readonly before: string; readonly after: string }[];
    }
  | {
      readonly kind: 'savings';
      readonly beforeEur: number;
      readonly afterEur: number;
      readonly steps: readonly { readonly label: string; readonly savesEur: number }[];
    }
  | {
      readonly kind: 'day-diff';
      readonly dayId: string;
      readonly summary: string;
      readonly changes: readonly { readonly label: string; readonly before: string; readonly after: string }[];
    }
  | {
      readonly kind: 'expiry-plan';
      readonly entries: readonly {
        readonly ingredientId: string;
        readonly name: string;
        readonly freshnessPct: number;
        readonly useLabel: string;
      }[];
    };

export interface CoachScript {
  readonly id: string;
  /** Verbatim quick-command chip. */
  readonly command: string;
  /** Lowercase substrings used for free-text matching (first match wins). */
  readonly matchPatterns: readonly string[];
  /** Deterministic thinking time (900–1400 ms). */
  readonly thinkingMs: number;
  /** Exact reply copy from the design. */
  readonly reply: string;
  readonly cards: readonly CoachCard[];
  readonly actions: readonly CoachAction[];
}

const ACT = (id: string, label: string, style: CoachAction['style']): CoachAction => ({ id, label, style });

export const COACH_SCRIPTS: readonly CoachScript[] = [
  {
    id: 'cheaper-week',
    command: 'Make the week cheaper.',
    matchPatterns: ['cheaper', 'cheap', 'save money', 'budget', 'less money'],
    thinkingMs: 1100,
    reply: 'I found €9.40 without touching your protein. Three swaps, one store change.',
    cards: [
      {
        kind: 'savings',
        beforeEur: 62.4,
        afterEur: 53.0,
        steps: [
          { label: 'Friday salmon → chicken + eggs', savesEur: 3.5 },
          { label: 'Market crate instead of supermarket veg', savesEur: 3.3 },
          { label: 'Store change: online order → market stall', savesEur: 2.6 },
        ],
      },
    ],
    actions: [ACT('apply-all-swaps', 'Apply all swaps', 'gold'), ACT('review-each', 'Review each', 'glass')],
  },
  {
    id: 'no-cook-wednesday',
    command: 'I will not cook on Wednesday.',
    matchPatterns: ['not cook', 'no cook', "won't cook", 'no-cook', 'lazy wednesday'],
    thinkingMs: 1000,
    reply:
      'Wednesday becomes assembly-only: overnight oats, yoghurt plate, and a market bowl. Zero cooking, prep 6 min.',
    cards: [
      {
        kind: 'day-diff',
        dayId: 'wed',
        summary: 'Assembly-only Wednesday',
        changes: [
          { label: 'Cooking', before: '14 min', after: '0 min' },
          { label: 'Meals', before: 'Oats · Tomato eggs · Yoghurt · Bistro', after: 'Overnight oats · Yoghurt plate · Market bowl' },
          { label: 'Score', before: '74', after: '72' },
        ],
      },
    ],
    actions: [ACT('update-wednesday', 'Update Wednesday', 'gold'), ACT('pick-myself', 'Pick meals myself', 'glass')],
  },
  {
    id: 'fish-to-vegetarian',
    command: 'Replace fish with a vegetarian option.',
    matchPatterns: ['vegetarian', 'replace fish', 'no fish', 'without fish', 'veggie'],
    thinkingMs: 1200,
    reply:
      'Friday’s salmon → eggs, feta and lentils. Omega-3 dips slightly; walnuts on Saturday compensate.',
    cards: [
      {
        kind: 'replacement',
        beforeLabel: 'Salmon 150 g',
        afterLabel: 'Eggs ×2 + feta 40 g + lentils 80 g',
        proteinDeltaG: 2,
        savesEur: 3.5,
        note: 'Omega-3 dips slightly; walnuts on Saturday compensate.',
      },
    ],
    actions: [ACT('apply-replacement', 'Apply replacement', 'gold'), ACT('keep-salmon', 'Keep salmon', 'glass')],
  },
  {
    id: 'protein-up-calories-flat',
    command: 'Increase protein without increasing calories.',
    matchPatterns: ['more protein', 'increase protein', 'protein up', 'extra protein', 'protein without'],
    thinkingMs: 1050,
    reply: 'Shift 40 g rice to 120 g extra chicken on training days. +18 g protein, −12 kcal.',
    cards: [
      {
        kind: 'goal-adjustment',
        currentLabel: 'Rice 200 g · Chicken 120 g',
        proposedLabel: 'Rice 160 g · Chicken 240 g',
        proteinDeltaG: 18,
        kcalDelta: -12,
      },
    ],
    actions: [ACT('apply-to-week', 'Apply to week', 'gold'), ACT('training-only', 'Training days only', 'glass')],
  },
  {
    id: 'missed-lunch',
    command: 'I missed lunch.',
    matchPatterns: ['missed lunch', 'skipped lunch', 'no lunch', 'missed a meal', 'missed meal'],
    thinkingMs: 950,
    reply:
      'No problem. I moved 30 g protein to your snack and rebuilt dinner. Spinach still gets used tonight.',
    cards: [
      {
        kind: 'recalculation',
        changes: [
          { label: 'Lunch 12:30', before: 'Herb Chicken & Rice Bowl', after: 'missed, struck through' },
          { label: 'Snack 16:00', before: 'Yoghurt & walnuts', after: 'Yoghurt 250 g + walnuts 30 g (+30 g protein)' },
          { label: 'Dinner 19:30', before: 'Spinach omelette', after: 'Rebuilt, spinach still used' },
        ],
      },
    ],
    actions: [ACT('accept-new-plan', 'Accept new plan', 'gold'), ACT('adjust-manually', 'Adjust manually', 'glass')],
  },
  {
    id: 'travelling-tomorrow',
    command: 'I am travelling tomorrow.',
    matchPatterns: ['travelling', 'traveling', 'travel', 'trip', 'away tomorrow', 'on the road'],
    thinkingMs: 1150,
    reply:
      'Friday becomes portable: oat jars ×2, yoghurt, fruit. Everything else redistributes; no expiry risk.',
    cards: [
      {
        kind: 'day-diff',
        dayId: 'fri',
        summary: 'Portable Friday',
        changes: [
          { label: 'Format', before: '4 cooked meals', after: 'Oat jars ×2 · yoghurt · fruit' },
          { label: 'Expiry risk', before: 'none', after: 'none' },
          { label: 'Score', before: '86', after: '82' },
        ],
      },
    ],
    actions: [ACT('make-portable', 'Make it portable', 'gold'), ACT('breakfast-only', 'Only breakfast portable', 'glass')],
  },
  {
    id: 'use-expiring-first',
    command: 'Use what expires first.',
    matchPatterns: ['expires', 'expiring', 'expiry', 'use first', 'waste', 'going bad'],
    thinkingMs: 900,
    reply:
      'Spinach and bananas lead the queue. Tonight’s dinner and Saturday breakfast now take them.',
    cards: [
      {
        kind: 'expiry-plan',
        entries: [
          { ingredientId: 'spinach', name: 'Spinach', freshnessPct: 82, useLabel: 'Tonight’s dinner' },
          { ingredientId: 'banana', name: 'Bananas', freshnessPct: 68, useLabel: 'Saturday breakfast' },
        ],
      },
    ],
    actions: [ACT('apply-expiry', 'Apply', 'gold'), ACT('show-queue', 'Show queue', 'glass')],
  },
  {
    id: 'quick-dinner',
    command: 'Give me a 15-minute dinner.',
    matchPatterns: ['15-minute', '15 minute', 'quick dinner', 'fast dinner', 'quick meal', 'dinner idea'],
    thinkingMs: 950,
    reply: 'Spinach tomato omelette, 12 minutes, 36 g protein, uses tomorrow’s spinach.',
    cards: [
      {
        kind: 'meal-preview',
        mealId: 'thu-dinner',
        mealType: 'dinner',
        name: 'Spinach Tomato Omelette',
        photo: 'meal-omelette.jpg',
        kcal: 540,
        proteinG: 36,
        prepMinutes: 12,
        note: 'Uses tomorrow’s spinach.',
      },
    ],
    actions: [ACT('add-to-today', 'Add to today', 'gold'), ACT('another-option', 'Another option', 'glass')],
  },
];

/** "Another option" cycles these three deterministic dinner alternates. */
export const QUICK_DINNER_ALTERNATES: readonly CoachCard[] = [
  {
    kind: 'meal-preview',
    mealId: 'thu-dinner',
    mealType: 'dinner',
    name: 'Spinach Tomato Omelette',
    photo: 'meal-omelette.jpg',
    kcal: 540,
    proteinG: 36,
    prepMinutes: 12,
    note: 'Uses tomorrow’s spinach.',
  },
  {
    kind: 'meal-preview',
    mealId: 'thu-dinner',
    mealType: 'dinner',
    name: 'Greek Yoghurt Bowl, Walnuts & Banana',
    photo: 'meal-yoghurt-snack.jpg',
    kcal: 430,
    proteinG: 24,
    prepMinutes: 4,
    note: 'Zero cooking.',
  },
  {
    kind: 'meal-preview',
    mealId: 'thu-dinner',
    mealType: 'dinner',
    name: 'Chicken Rice Jar',
    photo: 'meal-chicken-bowl.jpg',
    kcal: 560,
    proteinG: 41,
    prepMinutes: 9,
    note: 'If the rice is prepped from Sunday.',
  },
];

export const QUICK_DINNER_ALTERNATE_REPLIES: readonly string[] = [
  'Spinach tomato omelette, 12 minutes, 36 g protein, uses tomorrow’s spinach.',
  'Greek yoghurt bowl, 4 minutes, 24 g protein, zero cooking.',
  'Chicken rice jar, 9 minutes with prepped rice, 41 g protein.',
];

/** Free-text fallback (unmatched input). */
export const COACH_FALLBACK: Omit<CoachScript, 'command' | 'matchPatterns' | 'thinkingMs'> = {
  id: 'fallback',
  reply:
    'I can adjust meals, days, budget, protein and timing. Try one of the commands below, or ask about any ingredient in your pantry.',
  cards: [],
  actions: [ACT('show-expiry-queue', 'Show my expiry queue', 'glass'), ACT('rebuild-today', 'Rebuild today', 'gold')],
};

export const COACH_FALLBACK_THINKING_MS = 800;

/** First-mount welcome message (verbatim from coach.md). */
export const COACH_WELCOME = {
  reply:
    'Good afternoon, Alex. Thursday is a strong 71. Your spinach wants to be dinner tonight, and Friday’s training day is already fuelled. What shall we improve?',
  actions: [
    ACT('fix-protein', 'Fix tonight’s protein', 'gold'),
    ACT('cheaper-week', 'Make week cheaper', 'glass'),
    ACT('surprise-me', 'Surprise me', 'ghost'),
  ],
} as const;

/** Presence caption under the core. */
export const COACH_PRESENCE_CAPTION = 'YOUR WEEK · YOUR PANTRY · YOUR GOALS · I REMEMBER';

/** Match free text to a script (deterministic, first pattern hit wins). */
export function matchCoachScript(text: string): CoachScript | undefined {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return undefined;
  return COACH_SCRIPTS.find((script) => script.matchPatterns.some((p) => normalized.includes(p)));
}
