import { INGREDIENT_BY_ID } from '@/data/ingredients'
import { addPantryItem, type PantryState } from './pantry'

export interface VisionItem {
  ingredientId: string
  name: string
  estimatedGrams: number
  confidence: 'high' | 'medium' | 'low'
  evidence: string
}

export interface KitchenVisionResult {
  sceneSummary: string
  overallConfidence: 'high' | 'medium' | 'low'
  items: VisionItem[]
  recipe: {
    title: string
    servings: number
    prepMinutes: number
    cookMinutes: number
    usedIngredientIds: string[]
    optionalStaples: string[]
    steps: string[]
    nutritionEstimate: { kcal: number; proteinG: number; fibreG: number; vegetablesG: number }
    foodSafety: string
  }
  model: string
  responseId: string
}

const STORAGE_KEY = 'life7-kitchen-vision-v1'

export async function analyzeKitchenImage(image: string) {
  const response = await fetch('/api/kitchen/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ image }),
  })
  const data = await response.json() as KitchenVisionResult & { error?: string }
  if (!response.ok) throw new Error(data.error ?? 'Kitchen Vision is temporarily unavailable.')
  return data
}

export function saveKitchenVision(result: KitchenVisionResult) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ result, savedAt: new Date().toISOString() }))
}

export function readKitchenVision(): KitchenVisionResult | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as { result: KitchenVisionResult }).result : null
  } catch { return null }
}

export function applyKitchenVisionToPantry(pantry: PantryState, result = readKitchenVision()): PantryState {
  if (!result) return pantry
  return result.items.reduce((state, item) => {
    const ingredient = INGREDIENT_BY_ID.get(item.ingredientId)
    if (!ingredient) return state
    return addPantryItem(state, {
      ingredientId: ingredient.id,
      quantityG: Math.round(item.estimatedGrams),
      quantityLabel: `${Math.round(item.estimatedGrams)} g`,
      freshnessPct: 82,
      expiresInDays: Math.max(2, Math.round(ingredient.shelfLifeDays * 0.65)),
      location: ingredient.defaultLocation,
      plannedUsage: [],
    })
  }, pantry)
}
