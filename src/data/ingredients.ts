/**
 * LIFE7 — Ingredient library (deterministic local data).
 *
 * Per-100 g macro table from design.md §11 plus plausible extensions for the
 * non-owned "discover" items and spice/drink browsing realism. No external API:
 * every value is part of the shipped demo dataset.
 */

/** The 10 browsing categories used across Architect, Pantry and Shopping. */
export const INGREDIENT_CATEGORIES = [
  'protein',
  'vegetables',
  'fruit',
  'grains',
  'legumes',
  'dairy',
  'nuts-seeds',
  'oils',
  'spices',
  'drinks',
] as const;
export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

/**
 * Categories that count toward the "food diversity" dimension.
 * Oils, nuts & seeds, spices and drinks add variety but are not core groups.
 */
export const CORE_CATEGORIES: readonly IngredientCategory[] = [
  'protein',
  'vegetables',
  'fruit',
  'grains',
  'legumes',
  'dairy',
];

/** Where an ingredient is bought (Shopping store grouping). */
export const STORE_IDS = ['supermarket', 'market', 'pharmacy', 'online'] as const;
export type StoreId = (typeof STORE_IDS)[number];

/** Storage location in the home pantry. */
export const STORAGE_LOCATIONS = ['fridge', 'pantry', 'freezer'] as const;
export type StorageLocation = (typeof STORAGE_LOCATIONS)[number];

/** Macro + fibre content per 100 g of edible portion. */
export interface NutrientsPer100g {
  readonly kcal: number;
  readonly protein: number; // g
  readonly carbs: number; // g
  readonly fat: number; // g
  readonly fibre: number; // g
}

/** How the ingredient is priced. */
export type PriceModel =
  | { readonly kind: 'weight'; readonly perKg: number }
  | { readonly kind: 'piece'; readonly perPiece: number; readonly pieceGrams: number }
  | { readonly kind: 'volume'; readonly perLitre: number; readonly gramsPerLitre: number };

export interface Ingredient {
  readonly id: string;
  readonly name: string;
  readonly category: IngredientCategory;
  /** Macro profile per 100 g as served (rice is per 100 g cooked). */
  readonly per100g: NutrientsPer100g;
  /**
   * Micronutrient density index 0–100 per 100 g (vitamin/mineral heuristic).
   * Feeds the micronutrient-coverage dimension of the score model.
   */
  readonly microIndex: number;
  readonly price: PriceModel;
  /**
   * When 'dry', plan quantities are cooked grams while the price applies to
   * the dry weight (cooked = dry × dryToCookedRatio). Used for rice.
   */
  readonly soldAs?: 'dry';
  readonly dryToCookedRatio?: number;
  /** Default store for replenishment. */
  readonly store: StoreId;
  /** True for the 11 items in Alex's demo pantry (design.md §11). */
  readonly owned: boolean;
  /** Typical shelf life in days (freshness decay baseline). */
  readonly shelfLifeDays: number;
  readonly defaultLocation: StorageLocation;
  /** Asset file name from the design manifest (§17). */
  readonly image: string;
  readonly tags: readonly string[];
}

export const INGREDIENTS: readonly Ingredient[] = [
  // ---------------------------------------------------------------- owned (11)
  {
    id: 'eggs',
    name: 'Eggs',
    category: 'protein',
    per100g: { kcal: 155, protein: 13.0, carbs: 1.1, fat: 11.0, fibre: 0 },
    microIndex: 45,
    price: { kind: 'piece', perPiece: 0.25, pieceGrams: 55 },
    store: 'supermarket',
    owned: true,
    shelfLifeDays: 21,
    defaultLocation: 'fridge',
    image: 'ing-eggs.png',
    tags: ['breakfast', 'quick'],
  },
  {
    id: 'chicken-breast',
    name: 'Chicken breast',
    category: 'protein',
    per100g: { kcal: 165, protein: 31.0, carbs: 0, fat: 3.6, fibre: 0 },
    microIndex: 25,
    price: { kind: 'weight', perKg: 8.5 },
    store: 'supermarket',
    owned: true,
    shelfLifeDays: 5,
    defaultLocation: 'fridge',
    image: 'ing-chicken.png',
    tags: ['lean', 'high-protein'],
  },
  {
    id: 'greek-yoghurt',
    name: 'Greek yoghurt',
    category: 'dairy',
    per100g: { kcal: 97, protein: 9.0, carbs: 3.6, fat: 5.0, fibre: 0 },
    microIndex: 30,
    price: { kind: 'weight', perKg: 5.6 },
    store: 'supermarket',
    owned: true,
    shelfLifeDays: 10,
    defaultLocation: 'fridge',
    image: 'ing-yoghurt.png',
    tags: ['snack', 'high-protein', 'no-cook'],
  },
  {
    id: 'rice',
    name: 'Rice (cooked)',
    category: 'grains',
    per100g: { kcal: 130, protein: 2.7, carbs: 28.0, fat: 0.3, fibre: 0.4 },
    microIndex: 5,
    price: { kind: 'weight', perKg: 1.8 },
    soldAs: 'dry',
    dryToCookedRatio: 3,
    store: 'supermarket',
    owned: true,
    shelfLifeDays: 180,
    defaultLocation: 'pantry',
    image: 'ing-rice.png',
    tags: ['batch-cook'],
  },
  {
    id: 'oats',
    name: 'Oats (dry)',
    category: 'grains',
    per100g: { kcal: 389, protein: 16.9, carbs: 66.0, fat: 6.9, fibre: 10.6 },
    microIndex: 35,
    price: { kind: 'weight', perKg: 2.1 },
    store: 'supermarket',
    owned: true,
    shelfLifeDays: 90,
    defaultLocation: 'pantry',
    image: 'ing-oats.png',
    tags: ['breakfast', 'fibre', 'no-cook'],
  },
  {
    id: 'tomato',
    name: 'Tomato',
    category: 'vegetables',
    per100g: { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fibre: 1.2 },
    microIndex: 60,
    price: { kind: 'weight', perKg: 2.4 },
    store: 'market',
    owned: true,
    shelfLifeDays: 6,
    defaultLocation: 'fridge',
    image: 'ing-tomato.png',
    tags: ['fresh'],
  },
  {
    id: 'spinach',
    name: 'Spinach',
    category: 'vegetables',
    per100g: { kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fibre: 2.2 },
    microIndex: 90,
    price: { kind: 'weight', perKg: 6.0 },
    store: 'supermarket',
    owned: true,
    shelfLifeDays: 4,
    defaultLocation: 'fridge',
    image: 'ing-spinach.png',
    tags: ['fresh', 'use-first'],
  },
  {
    id: 'broccoli',
    name: 'Broccoli',
    category: 'vegetables',
    per100g: { kcal: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fibre: 2.6 },
    microIndex: 85,
    price: { kind: 'weight', perKg: 2.2 },
    store: 'supermarket',
    owned: true,
    shelfLifeDays: 7,
    defaultLocation: 'fridge',
    image: 'ing-broccoli.png',
    tags: ['fresh', 'fibre'],
  },
  {
    id: 'olive-oil',
    name: 'Olive oil',
    category: 'oils',
    per100g: { kcal: 884, protein: 0, carbs: 0, fat: 100, fibre: 0 },
    microIndex: 10,
    price: { kind: 'volume', perLitre: 12.0, gramsPerLitre: 916 },
    store: 'supermarket',
    owned: true,
    shelfLifeDays: 240,
    defaultLocation: 'pantry',
    image: 'ing-oliveoil.png',
    tags: ['cooking'],
  },
  {
    id: 'walnuts',
    name: 'Walnuts',
    category: 'nuts-seeds',
    per100g: { kcal: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fibre: 6.7 },
    microIndex: 40,
    price: { kind: 'weight', perKg: 14.0 },
    store: 'supermarket',
    owned: true,
    shelfLifeDays: 60,
    defaultLocation: 'pantry',
    image: 'ing-walnuts.png',
    tags: ['snack', 'omega-3'],
  },
  {
    id: 'banana',
    name: 'Banana',
    category: 'fruit',
    per100g: { kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fibre: 2.6 },
    microIndex: 30,
    price: { kind: 'weight', perKg: 1.6 },
    store: 'supermarket',
    owned: true,
    shelfLifeDays: 5,
    defaultLocation: 'pantry',
    image: 'ing-banana.png',
    tags: ['snack', 'portable', 'no-cook'],
  },
  // ------------------------------------------------------- discover (non-owned)
  {
    id: 'salmon-fillet',
    name: 'Salmon fillet',
    category: 'protein',
    per100g: { kcal: 208, protein: 20.0, carbs: 0, fat: 13.0, fibre: 0 },
    microIndex: 55,
    price: { kind: 'weight', perKg: 19.0 },
    store: 'online',
    owned: false,
    shelfLifeDays: 3,
    defaultLocation: 'fridge',
    image: 'ing-salmon.png',
    tags: ['omega-3', 'high-protein'],
  },
  {
    id: 'lentils',
    name: 'Lentils',
    category: 'legumes',
    per100g: { kcal: 116, protein: 9.0, carbs: 20.0, fat: 0.4, fibre: 7.9 },
    microIndex: 45,
    price: { kind: 'weight', perKg: 3.2 },
    store: 'online',
    owned: false,
    shelfLifeDays: 365,
    defaultLocation: 'pantry',
    image: 'ing-lentils.png',
    tags: ['fibre', 'budget', 'vegetarian'],
  },
  {
    id: 'feta',
    name: 'Feta',
    category: 'dairy',
    per100g: { kcal: 264, protein: 14.2, carbs: 4.1, fat: 21.3, fibre: 0 },
    microIndex: 20,
    price: { kind: 'weight', perKg: 17.0 },
    store: 'supermarket',
    owned: false,
    shelfLifeDays: 14,
    defaultLocation: 'fridge',
    image: 'ing-feta.png',
    tags: ['salad'],
  },
  {
    id: 'avocado',
    name: 'Avocado',
    category: 'fruit',
    per100g: { kcal: 160, protein: 2.0, carbs: 8.5, fat: 14.7, fibre: 6.7 },
    microIndex: 50,
    price: { kind: 'piece', perPiece: 0.5, pieceGrams: 150 },
    store: 'online',
    owned: false,
    shelfLifeDays: 4,
    defaultLocation: 'pantry',
    image: 'ing-avocado.png',
    tags: ['healthy-fat', 'no-cook'],
  },
  {
    id: 'blueberries',
    name: 'Blueberries',
    category: 'fruit',
    per100g: { kcal: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fibre: 2.4 },
    microIndex: 70,
    price: { kind: 'weight', perKg: 13.6 },
    store: 'market',
    owned: false,
    shelfLifeDays: 5,
    defaultLocation: 'fridge',
    image: 'ing-blueberries.png',
    tags: ['antioxidant', 'snack', 'no-cook'],
  },
  {
    id: 'sourdough',
    name: 'Sourdough',
    category: 'grains',
    per100g: { kcal: 250, protein: 8.0, carbs: 48.0, fat: 1.5, fibre: 2.0 },
    microIndex: 10,
    price: { kind: 'piece', perPiece: 4.1, pieceGrams: 800 },
    store: 'market',
    owned: false,
    shelfLifeDays: 4,
    defaultLocation: 'pantry',
    image: 'ing-sourdough.png',
    tags: ['breakfast'],
  },
  // ---------------------------------------------- extended everyday library
  {
    id: 'turkey-breast', name: 'Turkey breast', category: 'protein',
    per100g: { kcal: 135, protein: 29, carbs: 0, fat: 1.6, fibre: 0 }, microIndex: 28,
    price: { kind: 'weight', perKg: 10.5 }, store: 'supermarket', owned: false,
    shelfLifeDays: 4, defaultLocation: 'fridge', image: 'ing-chicken.png', tags: ['lean', 'high-protein'],
  },
  {
    id: 'tuna', name: 'Tuna (canned)', category: 'protein',
    per100g: { kcal: 116, protein: 26, carbs: 0, fat: 1, fibre: 0 }, microIndex: 42,
    price: { kind: 'weight', perKg: 11 }, store: 'supermarket', owned: false,
    shelfLifeDays: 540, defaultLocation: 'pantry', image: 'ing-salmon.png', tags: ['quick', 'high-protein'],
  },
  {
    id: 'tofu', name: 'Tofu', category: 'protein',
    per100g: { kcal: 144, protein: 17, carbs: 2.8, fat: 8.7, fibre: 2.3 }, microIndex: 44,
    price: { kind: 'weight', perKg: 7.2 }, store: 'supermarket', owned: false,
    shelfLifeDays: 10, defaultLocation: 'fridge', image: 'ing-feta.png', tags: ['vegetarian', 'high-protein'],
  },
  {
    id: 'cottage-cheese', name: 'Cottage cheese', category: 'dairy',
    per100g: { kcal: 98, protein: 11.1, carbs: 3.4, fat: 4.3, fibre: 0 }, microIndex: 32,
    price: { kind: 'weight', perKg: 6.8 }, store: 'supermarket', owned: false,
    shelfLifeDays: 9, defaultLocation: 'fridge', image: 'ing-yoghurt.png', tags: ['breakfast', 'high-protein'],
  },
  {
    id: 'milk', name: 'Milk', category: 'dairy',
    per100g: { kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fibre: 0 }, microIndex: 30,
    price: { kind: 'volume', perLitre: 1.5, gramsPerLitre: 1030 }, store: 'supermarket', owned: false,
    shelfLifeDays: 7, defaultLocation: 'fridge', image: 'ing-yoghurt.png', tags: ['breakfast'],
  },
  {
    id: 'chickpeas', name: 'Chickpeas', category: 'legumes',
    per100g: { kcal: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fibre: 7.6 }, microIndex: 48,
    price: { kind: 'weight', perKg: 2.8 }, store: 'supermarket', owned: false,
    shelfLifeDays: 365, defaultLocation: 'pantry', image: 'ing-lentils.png', tags: ['fibre', 'budget', 'vegetarian'],
  },
  {
    id: 'black-beans', name: 'Black beans', category: 'legumes',
    per100g: { kcal: 132, protein: 8.9, carbs: 23.7, fat: 0.5, fibre: 8.7 }, microIndex: 50,
    price: { kind: 'weight', perKg: 3.4 }, store: 'supermarket', owned: false,
    shelfLifeDays: 365, defaultLocation: 'pantry', image: 'ing-lentils.png', tags: ['fibre', 'budget', 'vegetarian'],
  },
  {
    id: 'quinoa', name: 'Quinoa (cooked)', category: 'grains',
    per100g: { kcal: 120, protein: 4.4, carbs: 21.3, fat: 1.9, fibre: 2.8 }, microIndex: 38,
    price: { kind: 'weight', perKg: 8 }, store: 'supermarket', owned: false,
    shelfLifeDays: 240, defaultLocation: 'pantry', image: 'ing-rice.png', tags: ['batch-cook', 'gluten-free'],
  },
  {
    id: 'wholegrain-pasta', name: 'Wholegrain pasta (cooked)', category: 'grains',
    per100g: { kcal: 149, protein: 6, carbs: 30, fat: 1.7, fibre: 3.9 }, microIndex: 25,
    price: { kind: 'weight', perKg: 2.6 }, store: 'supermarket', owned: false,
    shelfLifeDays: 365, defaultLocation: 'pantry', image: 'ing-rice.png', tags: ['fibre', 'batch-cook'],
  },
  {
    id: 'potato', name: 'Potato', category: 'vegetables',
    per100g: { kcal: 77, protein: 2, carbs: 17.5, fat: 0.1, fibre: 2.2 }, microIndex: 42,
    price: { kind: 'weight', perKg: 1.4 }, store: 'market', owned: false,
    shelfLifeDays: 21, defaultLocation: 'pantry', image: 'ing-banana.png', tags: ['budget', 'versatile'],
  },
  {
    id: 'sweet-potato', name: 'Sweet potato', category: 'vegetables',
    per100g: { kcal: 86, protein: 1.6, carbs: 20.1, fat: 0.1, fibre: 3 }, microIndex: 78,
    price: { kind: 'weight', perKg: 2.5 }, store: 'market', owned: false,
    shelfLifeDays: 18, defaultLocation: 'pantry', image: 'ing-banana.png', tags: ['fibre', 'versatile'],
  },
  {
    id: 'carrot', name: 'Carrot', category: 'vegetables',
    per100g: { kcal: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fibre: 2.8 }, microIndex: 75,
    price: { kind: 'weight', perKg: 1.5 }, store: 'market', owned: false,
    shelfLifeDays: 20, defaultLocation: 'fridge', image: 'ing-tomato.png', tags: ['fibre', 'snack'],
  },
  {
    id: 'bell-pepper', name: 'Bell pepper', category: 'vegetables',
    per100g: { kcal: 31, protein: 1, carbs: 6, fat: 0.3, fibre: 2.1 }, microIndex: 88,
    price: { kind: 'weight', perKg: 4.2 }, store: 'market', owned: false,
    shelfLifeDays: 8, defaultLocation: 'fridge', image: 'ing-tomato.png', tags: ['fresh', 'vitamin-c'],
  },
  {
    id: 'cucumber', name: 'Cucumber', category: 'vegetables',
    per100g: { kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fibre: 0.5 }, microIndex: 35,
    price: { kind: 'weight', perKg: 2.2 }, store: 'market', owned: false,
    shelfLifeDays: 7, defaultLocation: 'fridge', image: 'ing-spinach.png', tags: ['fresh', 'hydration'],
  },
  {
    id: 'onion', name: 'Onion', category: 'vegetables',
    per100g: { kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fibre: 1.7 }, microIndex: 32,
    price: { kind: 'weight', perKg: 1.3 }, store: 'market', owned: false,
    shelfLifeDays: 30, defaultLocation: 'pantry', image: 'ing-tomato.png', tags: ['cooking', 'budget'],
  },
  {
    id: 'apple', name: 'Apple', category: 'fruit',
    per100g: { kcal: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fibre: 2.4 }, microIndex: 42,
    price: { kind: 'weight', perKg: 2.1 }, store: 'market', owned: false,
    shelfLifeDays: 21, defaultLocation: 'fridge', image: 'ing-banana.png', tags: ['snack', 'portable'],
  },
  {
    id: 'orange', name: 'Orange', category: 'fruit',
    per100g: { kcal: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fibre: 2.4 }, microIndex: 72,
    price: { kind: 'weight', perKg: 2.3 }, store: 'market', owned: false,
    shelfLifeDays: 14, defaultLocation: 'fridge', image: 'ing-banana.png', tags: ['vitamin-c', 'snack'],
  },
  {
    id: 'almonds', name: 'Almonds', category: 'nuts-seeds',
    per100g: { kcal: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fibre: 12.5 }, microIndex: 58,
    price: { kind: 'weight', perKg: 15 }, store: 'supermarket', owned: false,
    shelfLifeDays: 120, defaultLocation: 'pantry', image: 'ing-walnuts.png', tags: ['snack', 'healthy-fat'],
  },
  {
    id: 'peanut-butter', name: 'Peanut butter', category: 'nuts-seeds',
    per100g: { kcal: 588, protein: 25, carbs: 20, fat: 50, fibre: 6 }, microIndex: 35,
    price: { kind: 'weight', perKg: 8.5 }, store: 'supermarket', owned: false,
    shelfLifeDays: 180, defaultLocation: 'pantry', image: 'ing-walnuts.png', tags: ['breakfast', 'energy'],
  },
  // ------------------------------------------------- spices & drinks (browsing)
  {
    id: 'black-pepper',
    name: 'Black pepper',
    category: 'spices',
    per100g: { kcal: 251, protein: 10.4, carbs: 64.0, fat: 3.3, fibre: 25.3 },
    microIndex: 15,
    price: { kind: 'weight', perKg: 18.0 },
    store: 'supermarket',
    owned: false,
    shelfLifeDays: 365,
    defaultLocation: 'pantry',
    image: 'ing-walnuts.png', // no dedicated art; reuses a neutral thumb
    tags: ['seasoning'],
  },
  {
    id: 'cinnamon',
    name: 'Cinnamon',
    category: 'spices',
    per100g: { kcal: 247, protein: 4.0, carbs: 80.6, fat: 1.2, fibre: 53.1 },
    microIndex: 12,
    price: { kind: 'weight', perKg: 15.0 },
    store: 'supermarket',
    owned: false,
    shelfLifeDays: 365,
    defaultLocation: 'pantry',
    image: 'ing-oats.png',
    tags: ['seasoning', 'breakfast'],
  },
  {
    id: 'green-tea',
    name: 'Green tea',
    category: 'drinks',
    per100g: { kcal: 1, protein: 0.2, carbs: 0.2, fat: 0, fibre: 0 },
    microIndex: 25,
    price: { kind: 'weight', perKg: 40.0 },
    store: 'pharmacy',
    owned: false,
    shelfLifeDays: 540,
    defaultLocation: 'pantry',
    image: 'ing-spinach.png',
    tags: ['hydration', 'focus'],
  },
  {
    id: 'coffee',
    name: 'Coffee beans',
    category: 'drinks',
    per100g: { kcal: 2, protein: 0.3, carbs: 0.4, fat: 0, fibre: 0 },
    microIndex: 5,
    price: { kind: 'weight', perKg: 22.0 },
    store: 'supermarket',
    owned: false,
    shelfLifeDays: 180,
    defaultLocation: 'pantry',
    image: 'ing-walnuts.png',
    tags: ['morning'],
  },
];

/** Fast lookup by id. */
export const INGREDIENT_BY_ID: ReadonlyMap<string, Ingredient> = new Map(
  INGREDIENTS.map((ing) => [ing.id, ing]),
);

/** Resolve an ingredient id, throwing on unknown ids (data integrity guard). */
export function getIngredient(id: string): Ingredient {
  const ing = INGREDIENT_BY_ID.get(id);
  if (!ing) throw new Error(`Unknown ingredient id: ${id}`);
  return ing;
}

/** The 11 ingredients marked available at home in the demo pantry. */
export const OWNED_INGREDIENTS: readonly Ingredient[] = INGREDIENTS.filter((i) => i.owned);

/** Non-owned ingredients shown in the "Discover" section of the library. */
export const DISCOVER_INGREDIENTS: readonly Ingredient[] = INGREDIENTS.filter((i) => !i.owned);
