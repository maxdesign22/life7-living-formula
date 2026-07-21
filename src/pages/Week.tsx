import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValue, useReducedMotion } from 'framer-motion'
import { Check, ChevronDown, Lock, Sparkles, Target, Waves } from 'lucide-react'
import type { DayType, PlannedMeal, WeekPlan } from '@/data/demoWeek'
import { DEMO_NOW } from '@/data/profile'
import {
  applyDayType,
  assembleWeek,
  computeDayScore,
  getDemoWeek,
  lockDay,
  moveMeal,
  optimiseWeek,
  regenerateDay,
} from '@/lib/planning'
import { GOAL_PROFILES, scoreDay, type GoalId, type MealType } from '@/lib/scoring'
import { Chip, MagneticButton, ScoreRing, useToast } from '@/components/life7'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import HoneycombStage from './week/HoneycombStage'
import DayDrawer from './week/DayDrawer'
import WeekChainMobile from './week/WeekChainMobile'
import TweenNumber from './week/TweenNumber'
import { DAY_TYPE_META } from './week/DayTypeBadge'
import { CENTER_OUT_ORDER } from './week/geometry'

const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]

/** Page-local keyframes: gold dash flow (9s, week.md) + today's watermark drift (14s). */
const WEEK_CSS = `
@keyframes week-dash-flow { to { stroke-dashoffset: -96; } }
@keyframes week-watermark-drift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(6px, -6px); }
}
.week-dash-flow { animation: week-dash-flow 9s linear infinite; }
.week-watermark-drift { animation: week-watermark-drift 14s ease-in-out infinite; }
/* contrast-tuned ScoreRings on the week screen, firmer track + ticks (ScoreRing is shared) */
.week-ring svg > circle:first-of-type { stroke: rgba(46,70,48,0.16); }
.week-ring svg > g { opacity: 0.9; }
/* per-day score-ring identity, re-tints the shared ScoreRing gradient stops
   and travelling cap through CSS vars set by the week cells (ScoreRing is shared) */
.week-ring-day svg defs stop:nth-child(1) { stop-color: var(--day-deep, #B08A3E); }
.week-ring-day svg defs stop:nth-child(2) { stop-color: var(--day-bright, #F2C14E); }
.week-ring-day svg defs stop:nth-child(3) { stop-color: var(--day-strong, #5C7A54); }
.week-ring-day svg > g circle { fill: var(--day-strong, #D9A84E); }
`

/** Footer goal selector options (week.md "Goal selector"). */
const WEEK_GOALS: readonly GoalId[] = [
  'healthy-strong',
  'lean',
  'muscle-gain',
  'stable-energy',
  'mental-focus',
  'longevity',
]

interface DragState {
  meal: PlannedMeal
  fromDayId: string
  targetDayId: string | null
}

interface FlyState {
  fromX: number
  fromY: number
  toX: number
  toY: number
  photo: string
  onDone: () => void
}

function hitTestCells(cells: Map<string, HTMLElement>, x: number, y: number): string | null {
  const pad = 14
  for (const [id, el] of cells) {
    const r = el.getBoundingClientRect()
    if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) return id
  }
  return null
}

/**
 * LIFE7 Week — the signature seven-day honeycomb (week.md). UI stays thin:
 * all week state flows from src/lib/planning.ts operations over getDemoWeek().
 */
export default function Week() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const reducedMotion = useReducedMotion() ?? false

  const [week, setWeek] = useState<WeekPlan>(() => getDemoWeek())
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [surge, setSurge] = useState(false)
  const [shimmer, setShimmer] = useState(false)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [fly, setFly] = useState<FlyState | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const weekRef = useRef(week)
  weekRef.current = week
  const dragRef = useRef(drag)
  dragRef.current = drag
  const cellRefs = useRef(new Map<string, HTMLElement>())
  const timers = useRef<number[]>([])
  const gx = useMotionValue(0)
  const gy = useMotionValue(0)

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id))
    },
    [],
  )

  const registerCellRef = useCallback((dayId: string, el: HTMLElement | null) => {
    if (el) cellRefs.current.set(dayId, el)
    else cellRefs.current.delete(dayId)
  }, [])

  const announce = useCallback((msg: string) => setAnnouncement(msg), [])

  // ------------------------------------------------------------- operations

  const undoable = useCallback(
    (prev: WeekPlan) => ({ label: 'Undo', onClick: () => setWeek(prev) }),
    [],
  )

  const handleOptimise = useCallback(() => {
    const prev = weekRef.current
    const res = optimiseWeek(prev)
    if (res.changes.length === 0) {
      toast('Week is already balanced. Every unlocked day is at its best.', { tone: 'gold' })
      return
    }
    setWeek(res.week)
    setShimmer(true)
    setSurge(true)
    later(() => setSurge(false), 1600)
    later(() => setShimmer(false), 2000)
    toast(res.message, { tone: 'gold', action: undoable(prev) })
    announce(`Week rebalanced. Average score improved from ${res.avgBefore} to ${res.avgAfter}.`)
  }, [toast, later, undoable, announce])

  const handleRegenerateUnlocked = useCallback(() => {
    const prev = weekRef.current
    let w = prev
    let changed = 0
    let lockedCount = 0
    for (const d of prev.days) {
      if (d.locked) {
        lockedCount++
        continue
      }
      const r = regenerateDay(w, d.id)
      w = r.week
      changed++
    }
    if (changed === 0) {
      toast(`All ${lockedCount} days are locked. Nothing to regenerate.`, { tone: 'gold' })
      return
    }
    setWeek(w)
    toast(`Regenerated ${changed} unlocked ${changed === 1 ? 'day' : 'days'}, meals reshuffled around the week.`, {
      action: undoable(prev),
    })
    announce('Unlocked days regenerated.')
  }, [toast, undoable, announce])

  const handleRegenerateDay = useCallback(
    (dayId: string) => {
      const prev = weekRef.current
      const day = prev.days.find((d) => d.id === dayId)
      if (!day) return
      if (day.locked) {
        toast(`${day.dayName} is locked. Unlock it to regenerate.`, { tone: 'gold' })
        return
      }
      const res = regenerateDay(prev, dayId)
      setWeek(res.week)
      toast(`${day.dayName} regenerated, score ${res.scoreBefore} → ${res.scoreAfter}.`, {
        action: undoable(prev),
      })
      announce(`Meal score for ${day.dayName} changed to ${res.scoreAfter}.`)
    },
    [toast, undoable, announce],
  )

  const handleToggleLock = useCallback(
    (dayId: string) => {
      const prev = weekRef.current
      const day = prev.days.find((d) => d.id === dayId)
      if (!day) return
      setWeek(lockDay(prev, dayId, !day.locked))
      toast(
        day.locked
          ? `${day.dayName} unlocked, back in the system.`
          : `${day.dayName} locked, excluded from optimise and regenerate.`,
      )
    },
    [toast],
  )

  const handleChangeDayGoal = useCallback(
    (dayId: string, goalId: GoalId) => {
      const prev = weekRef.current
      const day = prev.days.find((d) => d.id === dayId)
      if (!day) return
      const days = prev.days.map((d) => {
        if (d.id !== dayId) return d
        const nd = { ...d, goalId }
        return { ...nd, score: computeDayScore(nd) }
      })
      setWeek(
        assembleWeek(days, { weekNumber: prev.weekNumber, goalId: prev.goalId, budgetEur: prev.budgetEur }),
      )
      toast(`${day.dayName} goal set to ${GOAL_PROFILES[goalId].label}. Score re-tuned.`)
      announce(`${day.dayName} score updated after goal change.`)
    },
    [toast, announce],
  )

  const handleMarkType = useCallback(
    (dayId: string, type: DayType) => {
      const res = applyDayType(weekRef.current, dayId, type)
      setWeek(res.week)
      toast(res.summary, { tone: 'sage' })
    },
    [toast],
  )

  const commitMove = useCallback(
    (fromDayId: string, toDayId: string, mealType: MealType) => {
      const prev = weekRef.current
      const to = prev.days.find((d) => d.id === toDayId)
      if (!to) return
      if (!to.meals.some((m) => m.mealType === mealType)) {
        toast(`${to.dayName} has no ${mealType} slot. Move cancelled.`, { tone: 'gold' })
        return
      }
      try {
        const res = moveMeal(prev, fromDayId, toDayId, mealType)
        setWeek(res.week)
        const delta = Math.round(res.targetProteinDeltaG)
        toast(
          `Moved ${res.mealName} to ${to.dayName}, ${to.dayName} protein ${delta >= 0 ? '+' : '−'}${Math.abs(delta)} g.`,
          { tone: 'sage', action: undoable(prev) },
        )
        announce(`Moved ${res.mealName} to ${to.dayName}.`)
      } catch {
        toast('That meal cannot be moved right now.', { tone: 'gold' })
      }
    },
    [toast, undoable, announce],
  )

  const handleWeekGoal = useCallback(
    (goalId: GoalId) => {
      const prev = weekRef.current
      if (goalId === prev.goalId) return
      // recompute every unlocked day under the new goal, then apply center-out (80ms stagger)
      const finalDays = prev.days.map((d) => {
        if (d.locked) return d
        const nd = { ...d, goalId }
        return {
          ...nd,
          score: scoreDay(
            nd.meals.map((m) => ({ items: m.items, mealType: m.mealType })),
            goalId,
          ).total,
        }
      })
      CENTER_OUT_ORDER.forEach((id, i) => {
        later(() => {
          setWeek((cur) =>
            assembleWeek(
              cur.days.map((d) => (d.id === id ? (finalDays.find((f) => f.id === id) ?? d) : d)),
              { weekNumber: cur.weekNumber, goalId, budgetEur: cur.budgetEur },
            ),
          )
        }, i * 80)
      })
      toast(`Goal set to ${GOAL_PROFILES[goalId].label}. The whole week re-tunes.`, { tone: 'gold' })
      announce(`Week goal changed to ${GOAL_PROFILES[goalId].label}.`)
    },
    [toast, later, announce],
  )

  // ----------------------------------------------------------- drag & drop

  const handleMealDragStart = useCallback(
    (meal: PlannedMeal, fromDayId: string, x: number, y: number) => {
      setSelectedDayId(null) // reveal the honeycomb as the drop field
      setDrag({ meal, fromDayId, targetDayId: null })
      gx.set(x)
      gy.set(y)
    },
    [gx, gy],
  )

  const draggingActive = drag !== null
  useEffect(() => {
    if (!draggingActive) return undefined
    const onMove = (e: PointerEvent) => {
      gx.set(e.clientX)
      gy.set(e.clientY)
      const found = hitTestCells(cellRefs.current, e.clientX, e.clientY)
      setDrag((d) => (d && d.targetDayId !== found ? { ...d, targetDayId: found } : d))
    }
    const onUp = (e: PointerEvent) => {
      const d = dragRef.current
      const found = hitTestCells(cellRefs.current, e.clientX, e.clientY)
      if (d && found && found !== d.fromDayId) {
        const el = cellRefs.current.get(found)
        const r = el?.getBoundingClientRect()
        const toX = r ? r.left + r.width / 2 : e.clientX
        const toY = r ? r.top + r.height / 2 : e.clientY
        setFly({
          fromX: gx.get(),
          fromY: gy.get(),
          toX,
          toY,
          photo: d.meal.photo,
          onDone: () => {
            commitMove(d.fromDayId, found, d.meal.mealType)
            setDrag(null)
            setFly(null)
          },
        })
      } else {
        setDrag(null)
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingActive])

  // -------------------------------------------------------------- selections

  const selectedDay = selectedDayId ? (week.days.find((d) => d.id === selectedDayId) ?? null) : null

  const openArchitect = useCallback(
    (dayId: string) => navigate('/architect', { state: { dayId } }),
    [navigate],
  )

  // center the tablet snap-scroll on today (stage center) on mount
  const stageScrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = stageScrollRef.current
    if (!el) return
    if (window.innerWidth >= 768 && window.innerWidth < 1024) {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
    }
  }, [])

  const titleWords = ['LIFE7', 'Week']

  return (
    <div>
      <style>{WEEK_CSS}</style>

      {/* live region — announces score changes (design.md §15) */}
      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>

      {/* ---------------------------------------------------------- header */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5">
        <div className="max-w-[560px]">
          <p className="t-label text-gold-deep">{DEMO_NOW.dayOfWeekLabel}</p>
          <h1 className="t-display-lg mt-1.5 text-ink">
            {titleWords.map((w, i) => (
              <span key={w} className="inline-block overflow-hidden pb-1 align-top">
                <motion.span
                  className="inline-block"
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.64, delay: i * 0.055, ease: EASE_GLIDE }}
                >
                  {w}
                  {i < titleWords.length - 1 ? ' ' : ''}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: EASE_GLIDE }}
            className="t-serif-quote mt-2 text-ink-soft"
          >
            Seven days are not seven separate plans. They are one connected system.
          </motion.p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* week summary chips */}
          <span className="glass flex items-center gap-2.5 rounded-r-pill py-1.5 pl-1.5 pr-4 shadow-e-1">
            <ScoreRing
              value={week.avgScore}
              size={36}
              strokeWidth={3.5}
              animated={!reducedMotion}
              className="week-ring [&_svg]:overflow-visible"
            >
              <span />
            </ScoreRing>
            <span className="flex flex-col leading-none">
              <span className="t-label text-[9px] text-ink-soft">Week avg</span>
              <TweenNumber value={week.avgScore} className="tnum text-[16px] font-bold text-ink" />
            </span>
          </span>
          <Chip variant="glass" className="tnum">
            Est. €{week.estimatedCostEur.toFixed(2)}
          </Chip>
          <Chip variant="glass" className="tnum">
            Prep avg {week.avgPrepMinutes} min
          </Chip>
          <MagneticButton variant="primary" size="md" icon={<Sparkles size={15} />} onClick={handleOptimise}>
            Optimise week
          </MagneticButton>
          <MagneticButton variant="glass" size="md" icon={<Waves size={15} />} onClick={handleRegenerateUnlocked}>
            Regenerate unlocked
          </MagneticButton>
        </div>
      </header>

      {/* ------------------------------------------- honeycomb (≥768px) */}
      <div className="mt-4 hidden min-[768px]:block">
        <div
          ref={stageScrollRef}
          className="snap-x snap-mandatory overflow-x-auto min-[1024px]:snap-none min-[1024px]:overflow-visible"
        >
          <div className="mx-auto flex w-fit min-w-full snap-center justify-center">
            <div className="origin-top scale-[0.75] max-[1023px]:-mb-[160px] min-[1024px]:scale-[0.85] min-[1024px]:max-[1439px]:-mb-[96px] min-[1440px]:scale-100">
              <HoneycombStage
                week={week}
                surge={surge}
                shimmer={shimmer}
                drag={drag ? { fromDayId: drag.fromDayId, targetDayId: drag.targetDayId } : null}
                onOpenDay={setSelectedDayId}
                registerCellRef={registerCellRef}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------- vertical chain (<768px) */}
      <div className="mt-6 min-[768px]:hidden">
        <WeekChainMobile week={week} onOpenDay={setSelectedDayId} />
      </div>

      {/* ------------------------------------------------------ footer row */}
      <footer className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-line pt-5">
        {/* legend */}
        <div className="t-ui-sm flex flex-wrap items-center gap-x-4 gap-y-2 text-ink-soft">
          <span className="flex items-center gap-1.5">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-sage">
              <Check size={9} strokeWidth={3} className="text-forest" />
            </span>
            done
          </span>
          <span className="flex items-center gap-1.5">
            <span className={cn('h-3 w-3 rounded-full bg-sunlight/40 ring-2 ring-champagne', !reducedMotion && 'animate-gold-pulse')} />
            today
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border-[1.5px] border-ink-soft" />
            planned
          </span>
          <span className="flex items-center gap-1.5">
            <Lock size={12} className="text-ink-soft" />
            locked
          </span>
          <span className="hidden h-4 w-px bg-sand min-[520px]:block" aria-hidden="true" />
          {(['travel', 'rest', 'training', 'social'] as const).map((t) => {
            const meta = DAY_TYPE_META[t]
            return (
              <span key={t} className="flex items-center gap-1.5">
                <meta.Icon size={12} strokeWidth={1.8} className="text-gold-deep" />
                {meta.label}
              </span>
            )
          })}
        </div>

        {/* goal selector */}
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={week.goalId}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="t-ui-sm hidden text-ink-soft min-[520px]:block"
            >
              {GOAL_PROFILES[week.goalId].caption}
            </motion.span>
          </AnimatePresence>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="glass t-ui-sm flex items-center gap-2 rounded-r-pill px-4 py-2 font-semibold text-forest shadow-e-1 transition-shadow duration-220 ease-soft hover:shadow-e-2"
              >
                <Target size={14} className="text-gold-deep" />
                Goal: {GOAL_PROFILES[week.goalId].label}
                <ChevronDown size={13} className="text-ink-faint" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="glass-strong w-64 rounded-r-md border-line shadow-e-2">
              <p className="t-label mb-2 text-ink-soft">Week goal · re-tunes every day</p>
              <div className="flex flex-wrap gap-1.5">
                {WEEK_GOALS.map((g) => (
                  <Chip key={g} variant="gold" selected={g === week.goalId} onClick={() => handleWeekGoal(g)}>
                    {GOAL_PROFILES[g].label}
                  </Chip>
                ))}
              </div>
              <p className="t-ui-sm mt-2.5 text-ink-soft">{GOAL_PROFILES[week.goalId].caption}</p>
            </PopoverContent>
          </Popover>
        </div>
      </footer>

      {/* ------------------------------------------------------ day drawer */}
      <DayDrawer
        day={selectedDay}
        week={week}
        onClose={() => setSelectedDayId(null)}
        onRegenerate={handleRegenerateDay}
        onToggleLock={handleToggleLock}
        onChangeGoal={handleChangeDayGoal}
        onMarkType={handleMarkType}
        onMoveMeal={commitMove}
        onOpenArchitect={openArchitect}
        onMealDragStart={handleMealDragStart}
      />

      {/* ------------------------------------------------------ drag ghost */}
      <AnimatePresence>
        {drag && !fly && (
          <motion.div
            key="drag-ghost"
            className="pointer-events-none fixed left-0 top-0 z-[95]"
            style={{ x: gx, y: gy }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1.03 }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.16 } }}
            transition={{ duration: 0.18 }}
          >
            <div className="glass-strong flex -translate-x-1/2 -translate-y-[70%] items-center gap-2.5 rounded-r-md p-2.5 pr-4 shadow-e-3">
              <img
                src={`/${drag.meal.photo}`}
                alt=""
                className="h-10 w-10 rounded-r-sm object-cover"
              />
              <div>
                <p className="t-ui-sm max-w-[190px] truncate font-bold text-ink">{drag.meal.name}</p>
                <p className="t-label text-[9px] text-ink-soft">
                  {drag.targetDayId && drag.targetDayId !== drag.fromDayId
                    ? `Drop on ${week.days.find((d) => d.id === drag.targetDayId)?.dayName ?? ''}`
                    : 'Drag to a day'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
        {fly && (
          <motion.div
            key="fly-ghost"
            className="pointer-events-none fixed left-0 top-0 z-[95]"
            initial={{ x: fly.fromX, y: fly.fromY, scale: 1, opacity: 1 }}
            animate={{ x: fly.toX, y: fly.toY, scale: 0.3, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_GLIDE }}
            onAnimationComplete={fly.onDone}
          >
            <img
              src={`/${fly.photo}`}
              alt=""
              className="h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full object-cover shadow-e-2 ring-2 ring-soft-white"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
