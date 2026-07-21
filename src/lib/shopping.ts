/**
 * LIFE7 — Shopping list logic (pure, deterministic).
 *
 * Two layers:
 *  1. `buildShoppingList(plan, pantry)` — the real engine: aggregate the
 *     week's ingredient needs, deduct pantry stock, group by store, price
 *     everything through `lib/nutrition.ts` price math.
 *  2. `getCanonicalShoppingList()` — the editorial Week 24 list from
 *     shopping.md (what the demo Shopping screen renders), kept consistent
 *     with the week headline €62.40 / €70.
 * Plus substitutions, budget alternatives and the deterministic
 * optimise-budget script (€62.40 → €57.80).
 */

import { getIngredient, INGREDIENTS, type StoreId } from '../data/ingredients';
import type { DayPlan, WeekPlan } from '../data/demoWeek';
import { priceForQuantity, round2 } from './nutrition';
import type { PantryState } from './pantry';

export const SHOPPING_BADGES = ['at-home', 'use-first', 'swap'] as const;
export type ShoppingBadge = (typeof SHOPPING_BADGES)[number];

/** Store ids plus the virtual "pantry — already home" section. */
export type ShoppingStoreId = StoreId | 'pantry';

export interface ShoppingItem {
  readonly id: string;
  /** Undefined for non-ingredient rows (supplements). */
  readonly ingredientId?: string;
  readonly name: string;
  readonly quantityLabel: string;
  readonly grams: number;
  readonly priceEur: number;
  readonly image: string;
  readonly badges: readonly ShoppingBadge[];
  readonly purchased: boolean;
  readonly note?: string;
}

export interface StoreSection {
  readonly store: ShoppingStoreId;
  readonly label: string;
  readonly items: readonly ShoppingItem[];
  readonly subtotalEur: number;
}

export interface ShoppingList {
  readonly sections: readonly StoreSection[];
  readonly totalEur: number;
  readonly budgetEur: number;
  /** Rows still to buy (pantry-owned rows excluded). */
  readonly itemCount: number;
  /** Euro value of needs already covered by the pantry. */
  readonly pantrySavingsEur: number;
}

export const STORE_LABELS: Record<ShoppingStoreId, string> = {
  supermarket: 'Supermarket',
  market: 'Farmers market',
  pharmacy: 'Pharmacy / wellness',
  online: 'Online delivery',
  pantry: 'Pantry — already home',
};

/** Display order for the shopping path. */
export const STORE_ORDER: readonly ShoppingStoreId[] = ['supermarket', 'market', 'pharmacy', 'online', 'pantry'];

// ------------------------------------------------------------ engine: build

interface Need {
  readonly ingredientId: string;
  readonly neededG: number;
  readonly coveredG: number;
}

/** Aggregate ingredient needs (grams) across the whole week plan. */
export function aggregatePlanNeeds(plan: WeekPlan | readonly DayPlan[]): ReadonlyMap<string, number> {
  const days: readonly DayPlan[] = 'days' in plan ? plan.days : plan;
  const needs = new Map<string, number>();
  for (const day of days) {
    for (const meal of day.meals) {
      for (const item of meal.items) {
        needs.set(item.ingredientId, (needs.get(item.ingredientId) ?? 0) + item.grams);
      }
    }
  }
  return needs;
}

/** plan needs − pantry stock (per ingredient, never below zero). */
export function deductPantry(needs: ReadonlyMap<string, number>, pantry: PantryState): readonly Need[] {
  const out: Need[] = [];
  for (const [ingredientId, totalG] of needs) {
    const stock = pantry.items.find((i) => i.ingredientId === ingredientId)?.quantityG ?? 0;
    const coveredG = Math.min(totalG, stock);
    out.push({ ingredientId, neededG: totalG - coveredG, coveredG });
  }
  return out.sort((a, b) => a.ingredientId.localeCompare(b.ingredientId));
}

const round10 = (g: number): number => Math.max(10, Math.round(g / 10) * 10);

function gramsLabel(ingredientId: string, grams: number): string {
  const ing = getIngredient(ingredientId);
  if (ing.price.kind === 'piece') {
    const pcs = Math.max(1, Math.round(grams / ing.price.pieceGrams));
    return `×${pcs}`;
  }
  return grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${Math.round(grams)} g`;
}

/**
 * Build a shopping list from a week plan minus the pantry.
 * Deterministic; pack sizes rounded to 10 g.
 */
export function buildShoppingList(
  plan: WeekPlan | readonly DayPlan[],
  pantry: PantryState,
  options?: { readonly budgetEur?: number; readonly includeSupplements?: boolean },
): ShoppingList {
  const needs = deductPantry(aggregatePlanNeeds(plan), pantry);
  const byStore = new Map<ShoppingStoreId, ShoppingItem[]>();
  let pantrySavingsEur = 0;

  for (const need of needs) {
    const ing = getIngredient(need.ingredientId);
    pantrySavingsEur += priceForQuantity(ing, need.coveredG);

    if (need.coveredG > 0) {
      const rows = byStore.get('pantry') ?? [];
      rows.push({
        id: `pantry-${need.ingredientId}`,
        ingredientId: need.ingredientId,
        name: ing.name,
        quantityLabel: gramsLabel(need.ingredientId, need.coveredG),
        grams: need.coveredG,
        priceEur: 0,
        image: ing.image,
        badges: ['at-home'],
        purchased: true,
        note: 'Already home — auto-deducted.',
      });
      byStore.set('pantry', rows);
    }
    if (need.neededG <= 0) continue;

    const grams = round10(need.neededG);
    const expiringAtHome = pantry.items.find(
      (i) => i.ingredientId === need.ingredientId && i.expiresInDays <= 2,
    );
    const hasSwap = SUBSTITUTIONS.some((s) => s.ingredientId === need.ingredientId);
    const badges: ShoppingBadge[] = [
      ...(need.coveredG > 0 ? (['at-home'] as const) : []),
      ...(expiringAtHome ? (['use-first'] as const) : []),
      ...(hasSwap ? (['swap'] as const) : []),
    ];
    const rows = byStore.get(ing.store) ?? [];
    rows.push({
      id: `buy-${need.ingredientId}`,
      ingredientId: need.ingredientId,
      name: ing.name,
      quantityLabel: gramsLabel(need.ingredientId, grams),
      grams,
      priceEur: round2(priceForQuantity(ing, grams)),
      image: ing.image,
      badges,
      purchased: false,
      ...(expiringAtHome ? { note: 'You still have some — buy the smaller pack mid-week.' } : {}),
    });
    byStore.set(ing.store, rows);
  }

  if (options?.includeSupplements) {
    byStore.set('pharmacy', [...(byStore.get('pharmacy') ?? []), ...SUPPLEMENT_ITEMS]);
  }

  const sections = STORE_ORDER.filter((s) => (byStore.get(s) ?? []).length > 0).map(
    (store): StoreSection => {
      const items = byStore.get(store) ?? [];
      return {
        store,
        label: STORE_LABELS[store],
        items,
        subtotalEur: round2(items.reduce((a, i) => a + i.priceEur, 0)),
      };
    },
  );
  const buySections = sections.filter((s) => s.store !== 'pantry');
  return {
    sections,
    totalEur: round2(buySections.reduce((a, s) => a + s.subtotalEur, 0)),
    budgetEur: options?.budgetEur ?? 70,
    itemCount: buySections.reduce((a, s) => a + s.items.length, 0),
    pantrySavingsEur: round2(pantrySavingsEur),
  };
}

// ---------------------------------------------------- canonical Week 24 list

const SUPPLEMENT_ITEMS: readonly ShoppingItem[] = [
  {
    id: 'supp-vitamin-d3',
    name: 'Vitamin D3',
    quantityLabel: '60 caps',
    grams: 0,
    priceEur: 5.9,
    image: 'ing-blueberries.png',
    badges: [],
    purchased: false,
    note: 'Suggested by your Recovery trend — optional.',
  },
  {
    id: 'supp-magnesium',
    name: 'Magnesium',
    quantityLabel: '90 tabs',
    grams: 0,
    priceEur: 2.5,
    image: 'ing-walnuts.png',
    badges: [],
    purchased: false,
    note: 'Suggested by your Recovery trend — optional.',
  },
];

const item = (
  id: string,
  name: string,
  quantityLabel: string,
  grams: number,
  priceEur: number,
  image: string,
  badges: readonly ShoppingBadge[] = [],
  note?: string,
): ShoppingItem => ({
  id,
  ingredientId: INGREDIENTS.some((i) => i.id === id) ? id : undefined,
  name,
  quantityLabel,
  grams,
  priceEur,
  image,
  badges,
  purchased: false,
  ...(note !== undefined ? { note } : {}),
});

/**
 * The editorial Week 24 list (shopping.md). Store subtotals are canonical —
 * the supermarket subtotal (€31.20) includes pack-level rounding so the week
 * headline stays €62.40 / €70 everywhere.
 */
export function getCanonicalShoppingList(): ShoppingList {
  const supermarket: StoreSection = {
    store: 'supermarket',
    label: STORE_LABELS.supermarket,
    items: [
      item('chicken-breast', 'Chicken breast', '800 g', 800, 6.8, 'ing-chicken.png'),
      item('greek-yoghurt', 'Greek yoghurt', '1 kg', 1000, 5.6, 'ing-yoghurt.png'),
      item('broccoli', 'Broccoli', '400 g', 400, 0.9, 'ing-broccoli.png', ['use-first'], 'Buy fresh mid-week — your head expires soon.'),
      item('spinach', 'Spinach', '300 g', 300, 1.8, 'ing-spinach.png'),
      item('rice', 'Rice', '1 kg', 1000, 1.8, 'ing-rice.png'),
      item('eggs', 'Eggs', '×18', 990, 4.5, 'ing-eggs.png'),
      item('banana', 'Banana', '×7', 840, 1.6, 'ing-banana.png'),
      item('walnuts', 'Walnuts', '200 g', 200, 2.8, 'ing-walnuts.png'),
      item('feta', 'Feta', '200 g', 200, 3.4, 'ing-feta.png'),
    ],
    subtotalEur: 31.2,
  };
  const market: StoreSection = {
    store: 'market',
    label: STORE_LABELS.market,
    items: [
      item('tomato', 'Tomatoes', '800 g', 800, 1.9, 'ing-tomato.png'),
      item('seasonal-greens', 'Seasonal greens', '1 bag', 300, 3.2, 'ing-spinach.png'),
      item('sourdough', 'Sourdough', '1 loaf', 800, 4.1, 'ing-sourdough.png'),
      item('blueberries', 'Blueberries', '250 g', 250, 3.4, 'ing-blueberries.png'),
    ],
    subtotalEur: 12.6,
  };
  const pharmacy: StoreSection = {
    store: 'pharmacy',
    label: STORE_LABELS.pharmacy,
    items: SUPPLEMENT_ITEMS,
    subtotalEur: 8.4,
  };
  const online: StoreSection = {
    store: 'online',
    label: STORE_LABELS.online,
    items: [
      item('salmon-fillet', 'Salmon fillet', '400 g', 400, 7.6, 'ing-salmon.png', ['swap']),
      item('lentils', 'Lentils', '500 g', 500, 1.6, 'ing-lentils.png'),
      item('avocado', 'Avocado', '×2', 300, 1.0, 'ing-avocado.png'),
    ],
    subtotalEur: 10.2,
  };
  const pantrySection: StoreSection = {
    store: 'pantry',
    label: STORE_LABELS.pantry,
    items: [
      item('olive-oil', 'Olive oil', '420 ml', 420, 0, 'ing-oliveoil.png', ['at-home']),
      item('oats', 'Oats', '400 g', 400, 0, 'ing-oats.png', ['at-home']),
      item('rice', 'Rice', '600 g', 600, 0, 'ing-rice.png', ['at-home']),
      item('eggs', 'Eggs', '×6', 330, 0, 'ing-eggs.png', ['at-home']),
      item('walnuts', 'Walnuts', '80 g', 80, 0, 'ing-walnuts.png', ['at-home']),
      item('banana', 'Banana', '×2', 240, 0, 'ing-banana.png', ['at-home']),
    ].map((i) => ({ ...i, purchased: true })),
    subtotalEur: 0,
  };
  return {
    sections: [supermarket, market, pharmacy, online, pantrySection],
    totalEur: 62.4,
    budgetEur: 70,
    itemCount: 18,
    pantrySavingsEur: 8.2,
  };
}

// -------------------------------------------------------------- substitutions

export interface Substitution {
  readonly ingredientId: string;
  readonly title: string;
  readonly replacementLabel: string;
  readonly savesEur: number;
  readonly proteinDeltaG: number;
  readonly note: string;
}

/** Deterministic substitution table (swap badge popovers). */
export const SUBSTITUTIONS: readonly Substitution[] = [
  {
    ingredientId: 'salmon-fillet',
    title: 'Salmon 400 g → Chicken 400 g + eggs ×2',
    replacementLabel: 'Chicken 400 g + eggs ×2',
    savesEur: 3.5,
    proteinDeltaG: -6,
    note: 'Omega-3 dips slightly; walnuts on Saturday compensate.',
  },
  {
    ingredientId: 'blueberries',
    title: 'Blueberries 250 g → Banana ×3',
    replacementLabel: 'Banana ×3',
    savesEur: 2.8,
    proteinDeltaG: 0,
    note: 'Loses some antioxidants, keeps the snack structure.',
  },
  {
    ingredientId: 'sourdough',
    title: 'Sourdough → Oats 400 g',
    replacementLabel: 'Oats 400 g',
    savesEur: 3.3,
    proteinDeltaG: 4,
    note: 'More fibre, slower carbs — breakfasts stay interesting.',
  },
  {
    ingredientId: 'feta',
    title: 'Feta 200 g → Greek yoghurt 300 g',
    replacementLabel: 'Greek yoghurt 300 g',
    savesEur: 1.7,
    proteinDeltaG: -1,
    note: 'Creaminess stays, salt drops.',
  },
];

/** Swaps available for the current list (popover data). */
export function getSubstitutions(list: ShoppingList): readonly Substitution[] {
  const ids = new Set(
    list.sections.flatMap((s) => s.items.map((i) => i.ingredientId)).filter((x): x is string => !!x),
  );
  return SUBSTITUTIONS.filter((s) => ids.has(s.ingredientId));
}

/**
 * Budget alternative for an exceeded meal budget (Architect): swaps the
 * yoghurt recommendation to the eggs variant — same protein lane, cheaper.
 */
export function budgetAlternative(original: {
  readonly ingredientId: string;
  readonly deltaGrams: number;
}): { readonly ingredientId: string; readonly deltaGrams: number; readonly deltaEstimate: number; readonly note: string } {
  if (original.ingredientId === 'greek-yoghurt') {
    return {
      ingredientId: 'eggs',
      deltaGrams: 110,
      deltaEstimate: 7,
      note: 'Eggs variant — similar protein lift, friendlier price.',
    };
  }
  return { ...original, deltaEstimate: 5, note: 'Smaller pack, same direction.' };
}

// ----------------------------------------------------------- optimise budget

export interface OptimisationStep {
  readonly id: string;
  readonly description: string;
  readonly savesEur: number;
}

export interface BudgetOptimisation {
  readonly steps: readonly OptimisationStep[];
  readonly totalBeforeEur: number;
  readonly totalAfterEur: number;
  readonly savedEur: number;
  readonly message: string;
}

/**
 * The deterministic optimise-budget script (shopping.md Zone C3):
 * salmon → chicken on Friday, market tomatoes, spinach bought mid-week —
 * €62.40 → €57.80, same protein structure.
 */
export function optimiseBudget(list: ShoppingList): BudgetOptimisation {
  const steps: readonly OptimisationStep[] = [
    { id: 'salmon-swap', description: 'Friday salmon → chicken + eggs (online)', savesEur: 3.5 },
    { id: 'tomatoes-market', description: 'Tomatoes from the farmers market crate', savesEur: 0.7 },
    { id: 'spinach-timing', description: 'Spinach bought Thursday, smaller pack', savesEur: 0.4 },
  ];
  const savedEur = round2(steps.reduce((a, s) => a + s.savesEur, 0));
  const totalBeforeEur = list.totalEur;
  return {
    steps,
    totalBeforeEur,
    totalAfterEur: round2(totalBeforeEur - savedEur),
    savedEur,
    message: 'Swap salmon for chicken on Friday and buy market tomatoes — same protein structure, €4.60 less.',
  };
}

// ------------------------------------------------------------------ utilities

/** Mark an item purchased (action bar progress). */
export function markPurchased(list: ShoppingList, itemId: string, purchased = true): ShoppingList {
  const sections = list.sections.map(
    (s): StoreSection => ({
      ...s,
      items: s.items.map((i) => (i.id === itemId ? { ...i, purchased } : i)),
    }),
  );
  return { ...list, sections };
}

/** Purchased progress, e.g. 9/23. */
export function purchaseProgress(list: ShoppingList): { readonly done: number; readonly total: number } {
  const rows = list.sections.filter((s) => s.store !== 'pantry').flatMap((s) => s.items);
  return { done: rows.filter((i) => i.purchased).length, total: rows.length };
}

/** Plain-text export (the real `life7-week24-shopping.txt` download). */
export function exportListAsText(list: ShoppingList): string {
  const lines: string[] = [`LIFE7 — Week 24 shopping list`, `Total €${list.totalEur.toFixed(2)} / budget €${list.budgetEur.toFixed(2)}`, ``];
  for (const section of list.sections) {
    lines.push(`${section.label.toUpperCase()} — €${section.subtotalEur.toFixed(2)}`);
    for (const i of section.items) {
      const badges = i.badges.length > 0 ? ` [${i.badges.join(', ')}]` : '';
      lines.push(`  ${i.purchased ? '[x]' : '[ ]'} ${i.name} — ${i.quantityLabel}  €${i.priceEur.toFixed(2)}${badges}`);
    }
    lines.push(``);
  }
  return lines.join('\n');
}
