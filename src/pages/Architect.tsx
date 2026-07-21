/**
 * MEAL ARCHITECT (/architect) — the flagship three-zone laboratory.
 *
 * LEFT ingredient library · CENTER living meal canvas · RIGHT LIFE7
 * intelligence. All scoring / nutrition / recommendation math is delegated
 * to the calibrated src/lib modules (base 58 → apply all → 86); this page
 * only orchestrates state, flight choreography and animation cues.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { animate, useMotionValue } from 'framer-motion'
import { useToast } from '@/components/life7'
import type { Life7MarkState } from '@/components/life7'
import { cn } from '@/lib/utils'
import type { Ingredient } from '@/data/ingredients'
import { USER_PROFILE } from '@/data/profile'
import type { Recommendation } from '@/data/recommendationRules'
import { createDemoPantry } from '@/lib/pantry'
import type { MealItem } from '@/lib/nutrition'
import {
  applyQuantityChange,
  DEMO_ANCHOR_BASE,
  DIMENSION_KEYS,
  rescoreMeal,
  scoreMeal,
  type DimensionScores,
  type MealType,
  type ScoreMealOptions,
} from '@/lib/scoring'
import {
  applyRecommendations,
  estimateScoreAfter,
  getRecommendations,
  totalDeltaEstimate,
} from '@/lib/recommendations'
import HeaderBar, { MEAL_CONTEXTS } from './architect/HeaderBar'
import TourOverlay from './architect/TourOverlay'
import IngredientLibrary from './architect/IngredientLibrary'
import type { ConstraintState } from './architect/IngredientLibrary'
import MealCanvas from './architect/MealCanvas'
import IntelligencePanel from './architect/IntelligencePanel'
import FlyingClones from './architect/FlyingClones'
import { ArchSegmented } from './architect/controls'
import {
  EASE_GLIDE,
  plateAnchors,
  prepMinutes,
  satietyOf5,
  slotPosition,
  type Flight,
  type FlightRect,
  type SlotPosition,
} from './architect/model'
import { getIngredient } from '@/data/ingredients'
import { analyzeMealWithGPT, type ArchitectAIAnalysis } from '@/lib/architectAI'

type ZoneTab = 'library' | 'canvas' | 'intel'

const ZONE_TABS = [
  { id: 'library', label: 'Library' },
  { id: 'canvas', label: 'Canvas' },
  { id: 'intel', label: 'Intelligence' },
] as const

const initialSlots = (): Record<string, SlotPosition> => {
  const out: Record<string, SlotPosition> = {}
  DEMO_ANCHOR_BASE.forEach((item, i) => {
    out[item.ingredientId] = slotPosition(i)
  })
  return out
}

export default function Architect() {
  const { toast } = useToast()

  // ------------------------------------------------------------ core state
  const [items, setItems] = useState<MealItem[]>(() => [...DEMO_ANCHOR_BASE])
  const [slots, setSlots] = useState<Record<string, SlotPosition>>(initialSlots)
  const [mealType, setMealType] = useState<MealType>('lunch')
  const [mealName, setMealName] = useState('Thursday Lunch')
  const [constraints, setConstraints] = useState<ConstraintState>({
    restrictions: ['no-shellfish'],
    budgetEur: 6.5,
    maxMinutes: 25,
  })
  const [budgetAlt, setBudgetAlt] = useState(false)
  const [flights, setFlights] = useState<readonly Flight[]>([])
  const [applying, setApplying] = useState<ReadonlySet<string>>(new Set())
  const [markState, setMarkState] = useState<Life7MarkState>('rest')
  const [wave, setWave] = useState<{ key: number; kind: 'gold' | 'sage' }>({ key: 0, kind: 'gold' })
  const [goldRingKey, setGoldRingKey] = useState(0)
  const [dimFlash, setDimFlash] = useState<Partial<Record<keyof DimensionScores, number>>>({})
  const [shuffleOffset, setShuffleOffset] = useState(0)
  const [undoSnapshot, setUndoSnapshot] = useState<MealItem[] | null>(null)
  const [announce, setAnnounce] = useState('')
  const [tourOpen, setTourOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<ZoneTab>('canvas')
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'live' | 'error'>('idle')
  const [aiAnalysis, setAiAnalysis] = useState<ArchitectAIAnalysis | null>(null)
  const [aiError, setAiError] = useState('')
  const [aiFingerprint, setAiFingerprint] = useState('')

  // refs (fresh values inside timers/closures)
  const itemsRef = useRef(items)
  itemsRef.current = items
  const slotsRef = useRef(slots)
  slotsRef.current = slots
  const slotCounter = useRef(DEMO_ANCHOR_BASE.length)
  const flightSeq = useRef(1)
  const plateRef = useRef<HTMLDivElement>(null)
  const applyAllRef = useRef<HTMLDivElement>(null)
  const celebrateNextRef = useRef(false)
  const firstRingAnim = useRef(true)

  // ---------------------------------------------------------- derived math
  const scoreOpts: ScoreMealOptions = useMemo(
    () => ({ mealType, goalId: USER_PROFILE.goalId }),
    [mealType],
  )
  const optsRef = useRef(scoreOpts)
  optsRef.current = scoreOpts

  const score = useMemo(() => scoreMeal(items, scoreOpts), [items, scoreOpts])
  const scoreRef = useRef(score)
  scoreRef.current = score

  const rawRecs = useMemo(() => getRecommendations(items, scoreOpts), [items, scoreOpts])

  // budget alternative: swap the lead card to the eggs variant (Δ +7)
  const recs = useMemo(() => {
    let list: readonly Recommendation[] = rawRecs
    if (budgetAlt && list.length > 0 && list[0].ingredientId !== 'eggs') {
      const eggs = getIngredient('eggs')
      const alt: Recommendation = {
        ...list[0],
        id: `${list[0].id}:budget-eggs`,
        ingredientId: 'eggs',
        ingredientName: eggs.name,
        deltaGrams: 110,
        title: `Add ${eggs.name} — 110 g`,
        deltaEstimate: 7,
        recomputedDelta:
          rescoreMeal(items, { ingredientId: 'eggs', deltaGrams: 110 }, scoreOpts).total - score.total,
        image: eggs.image,
      }
      list = [alt, ...list.slice(1)]
    }
    if (list.length > 1) {
      const off = shuffleOffset % list.length
      list = [...list.slice(off), ...list.slice(0, off)]
    }
    return list
  }, [rawRecs, budgetAlt, shuffleOffset, items, scoreOpts, score.total])

  const currentAiFingerprint = useMemo(
    () => JSON.stringify({ mealName, mealType, constraints, items, recIds: recs.map((rec) => rec.id) }),
    [mealName, mealType, constraints, items, recs],
  )
  const activeAiAnalysis = aiFingerprint === currentAiFingerprint ? aiAnalysis : null

  const displayRecs = useMemo(() => {
    if (!activeAiAnalysis) return recs
    const explanationById = new Map(activeAiAnalysis.recommendations.map((item) => [item.id, item]))
    const recById = new Map(recs.map((rec) => [rec.id, rec]))
    const ordered = activeAiAnalysis.priorityIds
      .map((id) => recById.get(id))
      .filter((rec): rec is Recommendation => Boolean(rec))
    recs.forEach((rec) => {
      if (!ordered.some((item) => item.id === rec.id)) ordered.push(rec)
    })
    return ordered.map((rec) => {
      const explanation = explanationById.get(rec.id)
      return explanation ? { ...rec, why: explanation.rationale } : rec
    })
  }, [activeAiAnalysis, recs])

  const ghostTarget = useMemo(
    () => (items.length > 0 && recs.length > 0 ? estimateScoreAfter(items, recs, scoreOpts) : null),
    [items, recs, scoreOpts],
  )

  const usedToday = useMemo(() => {
    const pantry = createDemoPantry()
    return new Set(
      pantry.items
        .filter((p) => p.plannedUsage.some((u) => u.dayId === 'thu'))
        .map((p) => p.ingredientId),
    )
  }, [])
  const inMeal = useMemo(() => new Set(items.map((i) => i.ingredientId)), [items])

  // ------------------------------------------------------- score ring driver
  const scoreMv = useMotionValue(0)
  useEffect(() => {
    const overshoot = celebrateNextRef.current
    celebrateNextRef.current = false
    const controls = overshoot
      ? animate(scoreMv, [scoreMv.get(), Math.min(100, score.total + 2), score.total], {
          duration: 1.4,
          ease: EASE_GLIDE,
          times: [0, 0.68, 1],
        })
      : animate(scoreMv, score.total, {
          duration: firstRingAnim.current ? 1.15 : 0.55,
          ease: EASE_GLIDE,
        })
    firstRingAnim.current = false
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score.total])

  // -------------------------------------------------------------- helpers
  const flashDimDiff = (prev: DimensionScores, next: DimensionScores) => {
    const patch: Partial<Record<keyof DimensionScores, number>> = {}
    DIMENSION_KEYS.forEach((k) => {
      if (Math.round(prev[k]) !== Math.round(next[k])) patch[k] = Date.now()
    })
    if (Object.keys(patch).length > 0) setDimFlash((f) => ({ ...f, ...patch }))
  }

  /** Flight destination for the token that will sit at `index` of `count` on the plate. */
  const plateTarget = (index: number, count: number): FlightRect => {
    const el = plateRef.current
    const r = el?.getBoundingClientRect()
    const anchor = plateAnchors(count)[index] ?? { fx: 0.5, fy: 0.5 }
    if (!r || r.width === 0) {
      // canvas hidden (tab mode) — aim at viewport center where it will appear
      return { x: window.innerWidth / 2 - 20, y: window.innerHeight / 2 - 60, w: 40, h: 40 }
    }
    return { x: r.left + anchor.fx * r.width - 20, y: r.top + anchor.fy * r.height - 20, w: 40, h: 40 }
  }

  const spawnFlight = (image: string, from: FlightRect, to: FlightRect, durationMs = 720) => {
    const id = flightSeq.current++
    setFlights((f) => [...f, { id, image, from, to, arc: 24, durationMs }])
  }

  const nudge = (kind: 'gold' | 'sage') => setWave((w) => ({ key: w.key + 1, kind }))

  // ------------------------------------------------------ add from library
  const addIngredient = (ing: Ingredient, grams: number, rect: DOMRect) => {
    if (window.innerWidth < 1280) setActiveTab('canvas')
    const newSlots = { ...slotsRef.current }
    if (!newSlots[ing.id]) newSlots[ing.id] = slotPosition(slotCounter.current++)
    // aim at the balanced anchor the token will occupy once it lands
    const cur = itemsRef.current
    const existingIdx = cur.findIndex((i) => i.ingredientId === ing.id)
    const idx = existingIdx >= 0 ? existingIdx : cur.length
    const count = existingIdx >= 0 ? cur.length : cur.length + 1
    spawnFlight(
      ing.image,
      { x: rect.left, y: rect.top, w: rect.width, h: rect.height },
      plateTarget(idx, count),
      620,
    )
    window.setTimeout(() => {
      const next = applyQuantityChange(itemsRef.current, ing.id, grams)
      flashDimDiff(scoreRef.current.dims, scoreMeal(next, optsRef.current).dims)
      setSlots(newSlots)
      setItems([...next])
      setAnnounce(`${ing.name} added. Meal score is now ${scoreMeal(next, optsRef.current).total}.`)
    }, 540)
  }

  // -------------------------------------------------- apply recommendations
  const scheduleApply = (recsToApply: readonly Recommendation[], rect: DOMRect | null) => {
    if (recsToApply.length === 0) return
    setApplying((s) => {
      const n = new Set(s)
      recsToApply.forEach((r) => n.add(r.id))
      return n
    })
    if (window.innerWidth < 1280) setActiveTab('canvas')

    const newSlots = { ...slotsRef.current }
    recsToApply.forEach((rec) => {
      if (!newSlots[rec.ingredientId]) newSlots[rec.ingredientId] = slotPosition(slotCounter.current++)
    })
    const from: FlightRect = rect
      ? { x: rect.left, y: rect.top, w: rect.width, h: rect.height }
      : { x: window.innerWidth - 140, y: window.innerHeight - 220, w: 48, h: 48 }
    // simulate the final plate (existing items + newly appended ingredients in
    // rec order) so every flight glides to the anchor its token will occupy
    const finalIds = itemsRef.current.map((i) => i.ingredientId)
    recsToApply.forEach((r) => {
      if (!finalIds.includes(r.ingredientId)) finalIds.push(r.ingredientId)
    })
    const finalCount = finalIds.length
    recsToApply.forEach((rec, i) => {
      window.setTimeout(
        () => spawnFlight(rec.image, from, plateTarget(finalIds.indexOf(rec.ingredientId), finalCount)),
        i * 120,
      )
    })

    celebrateNextRef.current = true
    const before = scoreRef.current.total
    window.setTimeout(() => {
      const base = itemsRef.current
      const next = applyRecommendations(base, recsToApply)
      const afterScore = scoreMeal(next, optsRef.current)
      setUndoSnapshot([...base])
      flashDimDiff(scoreRef.current.dims, afterScore.dims)
      setSlots(newSlots)
      setItems([...next])
      nudge('gold')
      setGoldRingKey((k) => k + 1)
      setMarkState('celebrate')
      window.setTimeout(() => setMarkState('rest'), 1600)
      setApplying(new Set())
      setBudgetAlt(false)
      toast(`Score improved ${before} → ${afterScore.total}. Beautifully done.`, {
        tone: 'gold',
        action: { label: 'Undo', onClick: () => undoApply() },
        duration: 5200,
      })
      setAnnounce(`Meal score improved to ${afterScore.total}.`)
    }, 620)
  }

  const undoApply = () => {
    const snap = undoSnapshot
    if (!snap) return
    setItems(snap)
    setSlots((s) => {
      const keep: Record<string, SlotPosition> = {}
      snap.forEach((i) => {
        if (s[i.ingredientId]) keep[i.ingredientId] = s[i.ingredientId]
      })
      return keep
    })
    setUndoSnapshot(null)
    nudge('sage')
    setAnnounce(`Change undone. Meal score is now ${scoreMeal(snap, optsRef.current).total}.`)
  }

  // --------------------------------------------------------- canvas edits
  const changeQuantity = (id: string, grams: number) => {
    const next = itemsRef.current.map((i) => (i.ingredientId === id ? { ...i, grams } : i))
    flashDimDiff(scoreRef.current.dims, scoreMeal(next, optsRef.current).dims)
    setItems(next)
  }

  const removeItem = (id: string) => {
    const next = itemsRef.current.filter((i) => i.ingredientId !== id)
    setSlots((s) => {
      const n = { ...s }
      delete n[id]
      return n
    })
    setItems(next)
    setAnnounce(
      next.length === 0
        ? 'Plate cleared. The formula is waiting.'
        : `${getIngredient(id).name} removed. Meal score is now ${scoreMeal(next, optsRef.current).total}.`,
    )
  }

  const replaceItem = (fromId: string, toId: string) => {
    const grams = itemsRef.current.find((i) => i.ingredientId === fromId)?.grams ?? 100
    const next = itemsRef.current.map((i) => (i.ingredientId === fromId ? { ingredientId: toId, grams } : i))
    setSlots((s) => {
      const n = { ...s }
      if (n[fromId]) {
        n[toId] = n[fromId]
        delete n[fromId]
      }
      return n
    })
    flashDimDiff(scoreRef.current.dims, scoreMeal(next, optsRef.current).dims)
    setItems(next)
    setAnnounce(`${getIngredient(fromId).name} replaced with ${getIngredient(toId).name}.`)
  }

  const clearPlate = () => {
    setItems([])
    setSlots({})
    setAnnounce('Plate cleared. The formula is waiting.')
  }

  const saveToDay = () => {
    const label = MEAL_CONTEXTS.find((m) => m.type === mealType)?.label ?? 'Lunch'
    toast(`Saved to Thursday · ${label}`)
  }

  const analyzeWithGPT = async () => {
    if (items.length === 0 || recs.length === 0 || aiStatus === 'loading') return
    const requestedFingerprint = currentAiFingerprint
    setAiStatus('loading')
    setAiError('')
    try {
      const result = await analyzeMealWithGPT({
        mealName,
        mealType,
        goalId: USER_PROFILE.goalId,
        constraints,
        items,
        score,
        projectedScore: ghostTarget,
        recommendations: recs,
      })
      setAiAnalysis(result)
      setAiFingerprint(requestedFingerprint)
      setAiStatus('live')
      setAnnounce('GPT-5.6 analysis complete. LIFE7 calculations remain verified by the nutrition engine.')
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Live analysis is unavailable.')
      setAiStatus('error')
    }
  }

  const switchMealType = (t: MealType) => {
    if (t === mealType) return
    const label = MEAL_CONTEXTS.find((m) => m.type === t)?.label ?? t
    const nextOpts: ScoreMealOptions = { mealType: t, goalId: USER_PROFILE.goalId }
    flashDimDiff(scoreRef.current.dims, scoreMeal(itemsRef.current, nextOpts).dims)
    setMealType(t)
    setMealName(`Thursday ${label}`)
    nudge('sage')
    setAnnounce(`${label} targets loaded. Meal score is now ${scoreMeal(itemsRef.current, nextOpts).total}.`)
  }

  // ------------------------------------------------------- tab swipe (touch)
  const touchX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null || window.innerWidth >= 1280) return
    const dx = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (Math.abs(dx) < 60) return
    const order: ZoneTab[] = ['library', 'canvas', 'intel']
    const idx = order.indexOf(activeTab)
    const nextIdx = dx < 0 ? Math.min(order.length - 1, idx + 1) : Math.max(0, idx - 1)
    setActiveTab(order[nextIdx])
  }

  const zoneCls = (tab: ZoneTab) =>
    cn(activeTab === tab ? 'block' : 'hidden', 'min-[1280px]:block')

  return (
    <div id="arch-main" className="relative" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <HeaderBar mealType={mealType} onMealType={switchMealType} onOpenTour={() => setTourOpen(true)} />

      {/* zone tabs — tablet & mobile */}
      <div className="mb-4 flex justify-center min-[1280px]:hidden">
        <ArchSegmented idPrefix="arch-zones" options={ZONE_TABS} value={activeTab} onChange={setActiveTab} />
      </div>

      <div className="grid grid-cols-1 gap-5 min-[1280px]:grid-cols-[240px_minmax(0,1fr)_300px] min-[1600px]:grid-cols-[300px_minmax(0,1fr)_340px]">
        {/* LEFT — ingredient library */}
        <section
          id="arch-zone-library"
          aria-label="Ingredient library"
          className={cn(zoneCls('library'), 'min-[1280px]:sticky min-[1280px]:top-5 min-[1280px]:h-[calc(100dvh-40px)]')}
        >
          <div className="h-full max-h-[78dvh] min-[1280px]:max-h-none">
            <IngredientLibrary
              constraints={constraints}
              onConstraintsChange={setConstraints}
              onRecomputeNudge={() => nudge('sage')}
              usedToday={usedToday}
              inMeal={inMeal}
              onAdd={addIngredient}
            />
          </div>
        </section>

        {/* CENTER — meal canvas */}
        <section id="arch-zone-canvas" aria-label="Meal canvas" className={zoneCls('canvas')}>
          <MealCanvas
            items={items}
            slots={slots}
            mealName={mealName}
            onMealName={setMealName}
            mealType={mealType}
            onMealType={switchMealType}
            onQuantity={changeQuantity}
            onRemove={removeItem}
            onReplace={replaceItem}
            onClear={clearPlate}
            onSave={saveToDay}
            goldRingKey={goldRingKey}
            plateRef={plateRef}
          />
        </section>

        {/* RIGHT — LIFE7 intelligence */}
        <section
          id="arch-zone-intel"
          aria-label="LIFE7 intelligence"
          className={cn(zoneCls('intel'), 'min-[1280px]:sticky min-[1280px]:top-5 min-[1280px]:h-[calc(100dvh-40px)]')}
        >
          <IntelligencePanel
            hasItems={items.length > 0}
            score={score}
            scoreDriver={scoreMv}
            ghostTarget={ghostTarget}
            recs={displayRecs}
            appliedIds={applying}
            totalDelta={totalDeltaEstimate(recs)}
            onApply={(rec, rect) => scheduleApply([rec], rect)}
            onApplyAll={(rect) => scheduleApply(displayRecs, rect)}
            onShuffle={() => setShuffleOffset((o) => o + 1)}
            markState={markState}
            waveKey={wave.key}
            waveKind={wave.kind}
            prepMin={prepMinutes(items)}
            satiety5={satietyOf5(score.dims.satiety)}
            budgetEur={constraints.budgetEur}
            onBudgetAlternative={() => {
              setBudgetAlt(true)
              nudge('sage')
            }}
            dimFlash={dimFlash}
            applyAllRef={applyAllRef}
            aiStatus={aiStatus === 'live' && aiFingerprint !== currentAiFingerprint ? 'idle' : aiStatus}
            aiSummary={activeAiAnalysis?.summary ?? ''}
            aiSafetyNote={activeAiAnalysis?.safetyNote ?? ''}
            aiModel={activeAiAnalysis?.model ?? ''}
            aiError={aiError}
            onAnalyze={analyzeWithGPT}
          />
        </section>
      </div>

      {/* ghost-flight layer */}
      <FlyingClones flights={flights} onDone={(id) => setFlights((f) => f.filter((x) => x.id !== id))} />

      {/* 3-step tour */}
      <TourOverlay open={tourOpen} onClose={() => setTourOpen(false)} />

      {/* a11y live region — announces score changes */}
      <div aria-live="polite" role="status" className="sr-only">
        {announce}
      </div>
    </div>
  )
}
