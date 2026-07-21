import type { Recommendation } from '@/data/recommendationRules'
import type { GoalId, MealScore, MealType } from '@/lib/scoring'
import type { MealItem } from '@/lib/nutrition'
import { getGoalProfile } from '@/lib/scoring'
import { getIngredient } from '@/data/ingredients'

export interface ArchitectConstraints {
  restrictions: readonly string[]
  budgetEur: number
  maxMinutes: number
}

export interface ArchitectAIRecommendation {
  id: string
  rationale: string
  tradeoff: string
}

export interface ArchitectAIAnalysis {
  summary: string
  priorityIds: readonly string[]
  recommendations: readonly ArchitectAIRecommendation[]
  safetyNote: string
  model: string
  responseId: string
  verifiedBy: string
}

interface AnalyzeMealInput {
  mealName: string
  mealType: MealType
  goalId: GoalId
  constraints: ArchitectConstraints
  items: readonly MealItem[]
  score: MealScore
  projectedScore: number | null
  recommendations: readonly Recommendation[]
}

export async function analyzeMealWithGPT(input: AnalyzeMealInput): Promise<ArchitectAIAnalysis> {
  const response = await fetch('/api/architect/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      mealName: input.mealName,
      mealType: input.mealType,
      goal: getGoalProfile(input.goalId).label,
      constraints: input.constraints,
      ingredients: input.items.map((item) => ({
        id: item.ingredientId,
        name: getIngredient(item.ingredientId).name,
        grams: item.grams,
      })),
      score: {
        total: input.score.total,
        projected: input.projectedScore,
        dimensions: input.score.dims,
        totals: {
          kcal: input.score.totals.kcal,
          proteinG: input.score.totals.protein,
          carbsG: input.score.totals.carbs,
          fatG: input.score.totals.fat,
          fibreG: input.score.totals.fibre,
          costEur: input.score.totals.costEur,
        },
      },
      recommendations: input.recommendations.map((rec) => ({
        id: rec.id,
        title: rec.title,
        deterministicWhy: rec.why,
        scoreDelta: rec.deltaEstimate,
        affectedDimensions: rec.affectedDims.map((dim) => dim.dim),
      })),
    }),
  })

  const payload = await response.json().catch(() => null) as (ArchitectAIAnalysis & { error?: string }) | null
  if (!response.ok || !payload) throw new Error(payload?.error ?? 'Live analysis is unavailable.')
  return payload
}
