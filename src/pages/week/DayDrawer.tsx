import { memo, useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarDays,
  Check,
  Ellipsis,
  GripVertical,
  Lock,
  LockOpen,
  RefreshCw,
  Target,
  X,
} from 'lucide-react'
import type { DayPlan, DayType, PlannedMeal, WeekPlan } from '@/data/demoWeek'
import { DAILY_TARGETS, USER_PROFILE } from '@/data/profile'
import { GOAL_PROFILES, GOAL_IDS, type GoalId } from '@/lib/scoring'
import type { MealType } from '@/lib/scoring'
import { dayTotals, mealTotals, round1, round2 } from '@/lib/nutrition'
import { Chip, MagneticButton, MetricBar, ScoreRing } from '@/components/life7'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import DayTypeBadge, { DAY_TYPE_META } from './DayTypeBadge'
import { dayTheme } from './geometry'

const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]
const MEAL_TYPE_LABEL: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
}
const DAY_TYPE_CHOICES: readonly DayType[] = ['normal', 'travel', 'rest', 'training', 'social', 'prep']

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const fn = () => setMatches(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [query])
  return matches
}

// ------------------------------------------------------------------ meal row

interface MealRowProps {
  day: DayPlan
  meal: PlannedMeal
  week: WeekPlan
  index: number
  onMoveMeal: (fromDayId: string, toDayId: string, mealType: MealType) => void
  onDragStart: (meal: PlannedMeal, fromDayId: string, x: number, y: number) => void
}

/**
 * Compact drawer meal row (week.md: photo 64px, kcal/P chips, prep, ⋯ menu)
 * with pointer drag-out toward the honeycomb and a click-alternative
 * "Move to…" submenu (design.md §15 a11y rule).
 */
const MealRow = memo(function MealRow({ day, meal, week, index, onMoveMeal, onDragStart }: MealRowProps) {
  const totals = mealTotals(meal.items)
  const press = useRef<{ x: number; y: number; active: boolean } | null>(null)

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    press.current = { x: e.clientX, y: e.clientY, active: false }
    // keep receiving moves even when the pointer leaves the row (fast flicks)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* pointer already released */
    }
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = press.current
    if (!p || p.active) return
    if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 9) {
      p.active = true
      onDragStart(meal, day.id, e.clientX, e.clientY)
    }
  }
  const onPointerUp = () => {
    press.current = null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -18, transition: { duration: 0.22 } }}
      transition={{ duration: 0.5, delay: 0.06 * index, ease: EASE_GLIDE }}
      className="group relative"
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={`Drag ${meal.name} to another day, or open the menu for options`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.querySelector<HTMLButtonElement>('[data-menu]')?.click()
        }}
        className="glass flex cursor-grab touch-none items-center gap-3 rounded-r-md bg-[rgba(255,253,247,0.9)] p-3 shadow-e-1 transition-shadow duration-220 ease-soft hover:shadow-e-2 active:cursor-grabbing"
      >
        <GripVertical size={14} className="shrink-0 text-ink-soft" aria-hidden="true" />
        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-r-sm bg-cream shadow-e-1 ring-1 ring-[rgba(46,70,48,0.14)]">
          <img
            src={`/${meal.photo}`}
            alt={meal.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-glide group-hover:scale-[1.04]"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="t-label text-[9px] text-ink-soft">
              {MEAL_TYPE_LABEL[meal.mealType]} · {meal.time}
            </span>
            {meal.status === 'eaten' && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green text-soft-white">
                <Check size={10} strokeWidth={2.5} />
              </span>
            )}
            {meal.status === 'next' && <span className="t-label text-[9px] text-gold-deep">NEXT</span>}
            {meal.status === 'out' && (
              <span className="t-label rounded-r-pill bg-cream px-1.5 py-0.5 text-[8px] text-ink-soft">OUT</span>
            )}
          </span>
          <span className="font-display block truncate text-[17px] font-medium leading-[1.25] text-ink">
            {meal.name}
          </span>
          <span className="tnum mt-0.5 flex flex-wrap items-center gap-x-2.5 text-[12px] font-bold text-ink-soft">
            <span>{Math.round(totals.kcal)} kcal</span>
            <span>P {Math.round(totals.protein)} g</span>
            <span className="font-semibold text-ink-soft">
              {meal.prepMinutes + meal.cookMinutes > 0 ? `${meal.prepMinutes + meal.cookMinutes} min` : 'no prep'}
            </span>
          </span>
          {meal.note && (
            <span className="font-display mt-0.5 block truncate text-[12px] italic leading-snug text-ink-soft">
              {meal.note}
            </span>
          )}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-menu
              aria-label={`Options for ${meal.name}`}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-cream hover:text-forest"
            >
              <Ellipsis size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-strong rounded-r-md border-line shadow-e-2">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="t-ui-sm gap-2">
                <ArrowRight size={14} className="text-gold-deep" /> Move to…
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="glass-strong rounded-r-md border-line shadow-e-2">
                {week.days
                  .filter((d) => d.id !== day.id)
                  .map((d) => (
                    <DropdownMenuItem
                      key={d.id}
                      className="t-ui-sm"
                      onSelect={() => onMoveMeal(day.id, d.id, meal.mealType)}
                    >
                      {d.dayName}
                      <span className="ml-auto pl-4 text-ink-faint">{d.meals.find((m) => m.mealType === meal.mealType) ? '' : '(free slot)'}</span>
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  )
})

// --------------------------------------------------------------- action grid

interface ActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
  active?: boolean
}

function ActionButton({ icon, label, onClick, disabled, active }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'glass t-ui-sm flex h-[72px] flex-col items-center justify-center gap-1.5 rounded-r-md font-semibold text-forest shadow-e-1 transition-all duration-180 ease-soft hover:-translate-y-[2px] hover:shadow-e-2',
        active && 'bg-sage-mist shadow-none',
        disabled && 'pointer-events-none opacity-45',
      )}
    >
      <span className="text-gold-deep">{icon}</span>
      {label}
    </button>
  )
}

// -------------------------------------------------------------------- drawer

export interface DayDrawerProps {
  day: DayPlan | null
  week: WeekPlan
  onClose: () => void
  onRegenerate: (dayId: string) => void
  onToggleLock: (dayId: string) => void
  onChangeGoal: (dayId: string, goalId: GoalId) => void
  onMarkType: (dayId: string, type: DayType) => void
  onMoveMeal: (fromDayId: string, toDayId: string, mealType: MealType) => void
  onOpenArchitect: (dayId: string) => void
  onMealDragStart: (meal: PlannedMeal, fromDayId: string, x: number, y: number) => void
}

/**
 * Day drawer (week.md "Click → Day Drawer"): right 460px glass panel —
 * header with ScoreRing + DayTypeBadge, 4 meal rows, day totals vs targets,
 * 2×2 actions (regenerate / lock / change goal / mark as…), Architect footer.
 * Full-width bottom sheet below 768px (week.md responsive).
 */
function DayDrawer({
  day,
  week,
  onClose,
  onRegenerate,
  onToggleLock,
  onChangeGoal,
  onMarkType,
  onMoveMeal,
  onOpenArchitect,
  onMealDragStart,
}: DayDrawerProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!day) return undefined
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [day, onClose])

  const totals = day ? dayTotals(day.meals.map((m) => m.items)) : null
  const dayBudget = round2(USER_PROFILE.weeklyBudgetEur / 7)
  const estCost = totals ? round2(totals.costEur) : 0
  const theme = day ? dayTheme(day.id) : null
  const ringVars = theme
    ? ({
        '--day-deep': theme.deep,
        '--day-bright': theme.bright,
        '--day-strong': theme.strong,
      } as CSSProperties)
    : undefined

  return (
    <AnimatePresence>
      {day && totals && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-[rgba(43,38,32,0.18)] backdrop-blur-[2px]"
            aria-hidden="true"
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`${day.dayName} — day details`}
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ duration: 0.42, ease: EASE_GLIDE }}
            className={cn(
              'glass-strong fixed z-[80] flex flex-col overflow-hidden shadow-e-3',
              'max-[767px]:inset-x-0 max-[767px]:bottom-0 max-[767px]:h-[88dvh] max-[767px]:rounded-t-r-xl',
              'min-[768px]:bottom-0 min-[768px]:right-0 min-[768px]:top-0 min-[768px]:w-[460px] min-[768px]:rounded-l-r-xl',
            )}
          >
            {/* header */}
            <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
              <div className="min-w-0">
                <p className="t-label flex items-center gap-1.5 text-gold-deep">
                  <span
                    className="h-[7px] w-[7px] rounded-full"
                    style={{ backgroundColor: theme?.strong, boxShadow: `0 0 0 2.5px ${theme?.chipBg ?? 'transparent'}` }}
                  />
                  Day {day.dayIndex + 1} of 7 · {day.dateLabel}
                </p>
                <h2 className="t-display-md mt-1 text-ink">{day.dayName}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <DayTypeBadge type={day.dayType} />
                  {day.status === 'today' && <Chip variant="gold">Today</Chip>}
                  {day.status === 'done' && <Chip variant="sage">Done</Chip>}
                  {day.locked && (
                    <Chip variant="glass" icon={<Lock size={11} />}>
                      Locked
                    </Chip>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close day details"
                  className="glass flex h-9 w-9 items-center justify-center rounded-full text-ink-soft shadow-e-1 transition-colors hover:text-forest"
                >
                  <X size={16} />
                </button>
                <span className="week-ring-day" style={ringVars}>
                  <ScoreRing value={day.score} size={84} strokeWidth={7} className="week-ring [&_svg]:overflow-visible">
                    {(count) => (
                      <span className="flex flex-col items-center leading-none">
                        <motion.span className="tnum text-[24px] font-bold text-ink">{count}</motion.span>
                        <span className="font-display text-[11px] italic text-ink-faint">/100</span>
                      </span>
                    )}
                  </ScoreRing>
                </span>
              </div>
            </div>

            {/* scrollable body */}
            <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
              {/* meals */}
              <section aria-label={`${day.dayName} meals`}>
                <p className="t-label mb-2.5 text-ink-soft">Meals — drag to another day</p>
                <div className="space-y-2.5">
                  <AnimatePresence initial={false}>
                    {day.meals.map((meal, i) => (
                      <MealRow
                        key={`${meal.id}-v${day.variant ?? 0}-${meal.name}`}
                        day={day}
                        meal={meal}
                        week={week}
                        index={i}
                        onMoveMeal={onMoveMeal}
                        onDragStart={onMealDragStart}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </section>

              {/* day totals vs targets */}
              <section aria-label="Day totals versus targets">
                <div className="mb-2.5 flex items-baseline justify-between">
                  <p className="t-label text-ink-soft">Day totals vs targets</p>
                  <p className="tnum text-[12px] font-bold text-ink-soft">
                    €{estCost.toFixed(2)} / €{dayBudget.toFixed(2)} day · {day.prepMinutes} min prep
                  </p>
                </div>
                <div className="glass space-y-3.5 rounded-r-md bg-[rgba(255,253,247,0.9)] p-4 shadow-e-1">
                  <MetricBar
                    label="Energy"
                    value={`${Math.round(totals.kcal)} / ${DAILY_TARGETS.kcal} kcal`}
                    pct={(totals.kcal / DAILY_TARGETS.kcal) * 100}
                    targetPct={100}
                  />
                  <MetricBar
                    label="Protein"
                    value={`${Math.round(totals.protein)} / ${DAILY_TARGETS.proteinG} g`}
                    pct={(totals.protein / DAILY_TARGETS.proteinG) * 100}
                    targetPct={100}
                  />
                  <MetricBar
                    label="Carbs"
                    value={`${Math.round(totals.carbs)} / ${DAILY_TARGETS.carbsG} g`}
                    pct={(totals.carbs / DAILY_TARGETS.carbsG) * 100}
                    targetPct={100}
                  />
                  <MetricBar
                    label="Fat"
                    value={`${Math.round(totals.fat)} / ${DAILY_TARGETS.fatG} g`}
                    pct={(totals.fat / DAILY_TARGETS.fatG) * 100}
                    targetPct={100}
                  />
                  <MetricBar
                    label="Fibre"
                    value={`${round1(totals.fibre)} / ${DAILY_TARGETS.fibreG} g`}
                    pct={(totals.fibre / DAILY_TARGETS.fibreG) * 100}
                    targetPct={100}
                  />
                </div>
              </section>

              {/* actions 2×2 */}
              <section aria-label="Day actions">
                <p className="t-label mb-2.5 text-ink-soft">Day actions</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <ActionButton
                    icon={<RefreshCw size={18} strokeWidth={1.7} />}
                    label="Regenerate day"
                    disabled={day.locked}
                    onClick={() => onRegenerate(day.id)}
                  />
                  <ActionButton
                    icon={day.locked ? <LockOpen size={18} strokeWidth={1.7} /> : <Lock size={18} strokeWidth={1.7} />}
                    label={day.locked ? 'Unlock day' : 'Lock day'}
                    active={day.locked}
                    onClick={() => onToggleLock(day.id)}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="glass t-ui-sm flex h-[72px] flex-col items-center justify-center gap-1.5 rounded-r-md font-semibold text-forest shadow-e-1 transition-all duration-180 ease-soft hover:-translate-y-[2px] hover:shadow-e-2"
                      >
                        <span className="text-gold-deep">
                          <Target size={18} strokeWidth={1.7} />
                        </span>
                        Change goal
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="glass-strong w-64 rounded-r-md border-line shadow-e-2">
                      <p className="t-label mb-2 text-ink-soft">Goal for {day.dayName} only</p>
                      <div className="flex flex-wrap gap-1.5">
                        {GOAL_IDS.map((g) => (
                          <Chip
                            key={g}
                            variant="gold"
                            selected={g === day.goalId}
                            onClick={() => onChangeGoal(day.id, g)}
                          >
                            {GOAL_PROFILES[g].label}
                          </Chip>
                        ))}
                      </div>
                      <p className="t-ui-sm mt-2.5 text-ink-soft">
                        {GOAL_PROFILES[day.goalId].caption}
                      </p>
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="glass t-ui-sm flex h-[72px] flex-col items-center justify-center gap-1.5 rounded-r-md font-semibold text-forest shadow-e-1 transition-all duration-180 ease-soft hover:-translate-y-[2px] hover:shadow-e-2"
                      >
                        <span className="text-gold-deep">
                          <CalendarDays size={18} strokeWidth={1.7} />
                        </span>
                        Mark as…
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="glass-strong w-64 rounded-r-md border-line shadow-e-2">
                      <p className="t-label mb-2 text-ink-soft">Day type — plan auto-adjusts</p>
                      <div className="space-y-1">
                        {DAY_TYPE_CHOICES.map((t) => {
                          const meta = DAY_TYPE_META[t]
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => onMarkType(day.id, t)}
                              className={cn(
                                't-ui-sm flex w-full items-center gap-2.5 rounded-r-sm px-2.5 py-2 text-left font-semibold text-ink transition-colors hover:bg-sage-mist',
                                t === day.dayType && 'bg-sage-mist text-forest',
                              )}
                            >
                              <meta.Icon size={15} strokeWidth={1.7} className="text-gold-deep" />
                              {meta.label}
                              {t === day.dayType && <Check size={13} className="ml-auto text-green" />}
                            </button>
                          )
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </section>
            </div>

            {/* footer */}
            <div className="border-t border-line px-6 py-4">
              <MagneticButton
                variant="gold"
                size="lg"
                className="w-full"
                icon={<ArrowRight size={16} />}
                onClick={() => onOpenArchitect(day.id)}
              >
                Open day in Architect
              </MagneticButton>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export default memo(DayDrawer)
