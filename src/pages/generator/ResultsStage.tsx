/**
 * AI Week Generator — results stage (generator.md RIGHT column).
 * Three states: empty (sprig + resting mark) → thinking (160px thinking mark,
 * cycling status lines, seven day-dots that arc in, pull into a honeycomb and
 * burst) → the generated plan: summary band + five collapsible sections.
 */
import { useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, ReactNode, RefObject } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarCheck2, ChevronDown, ListChecks, PackageOpen, RotateCcw, ShoppingBasket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AILine, Chip, GlassCard, Life7Mark, MagneticButton, MealCard, ScoreRing } from '@/components/life7'
import type { GeneratedWeek } from '@/lib/aiService'
import { mealTotals } from '@/lib/nutrition'
import type { DayPlan } from '@/data/demoWeek'
import { AnimatedNumber, EASE_GLIDE, EASE_SPRING, eur, itemsLine } from './bits'

export type StageStatus = 'empty' | 'thinking' | 'plan'

/* ----------------------------------------------------------------- empty */

function EmptyStage() {
  return (
    <div className="relative flex min-h-[440px] flex-col items-center justify-center overflow-hidden rounded-r-xl px-8 text-center min-[640px]:min-h-[560px]">
      <img
        src="/botanical-sprig-2.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 top-1/2 h-[130%] -translate-y-1/2 opacity-30"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: [1, 1.025, 1] }}
        transition={{ opacity: { duration: 0.6 }, scale: { duration: 5.8, repeat: Infinity, ease: 'easeInOut' } }}
        className="relative flex h-40 w-40 items-center justify-center rounded-full border border-champagne/45 bg-[radial-gradient(circle,rgba(247,223,167,0.82)_0%,rgba(255,253,247,0.72)_58%,rgba(255,253,247,0)_74%)] shadow-gold-glow"
      >
        <span className="absolute inset-3 rounded-full border border-gold-deep/15" aria-hidden="true" />
        <Life7Mark size={126} state="rest" />
        <span className="t-label absolute -bottom-3 rounded-r-pill bg-soft-white/90 px-3 py-1 text-[8px] text-gold-deep shadow-e-1">
          LIFE7 composition
        </span>
      </motion.div>
      <motion.p
        className="t-serif-quote relative mt-8 max-w-[30ch] text-ink-soft"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25, ease: EASE_GLIDE }}
      >
        Tell me about you. I will compose your seven days.
      </motion.p>
    </div>
  )
}

/* --------------------------------------------------------------- thinking */

const LINE_CADENCE_MS = 800
const HIVE_AT_MS = 2300
const BURST_AT_MS = 3000
const DONE_AT_MS = 3200

/** Honeycomb pull-in targets (3 + 4 cells), relative to mark center. */
const HIVE_POS = [
  { x: -13, y: -11 },
  { x: 0, y: -11 },
  { x: 13, y: -11 },
  { x: -19.5, y: 0 },
  { x: -6.5, y: 0 },
  { x: 6.5, y: 0 },
  { x: 19.5, y: 0 },
]

function ThinkingStage({ lines, onDone }: { lines: readonly string[]; onDone: () => void }) {
  const [lineIndex, setLineIndex] = useState(0)
  const [phase, setPhase] = useState<'arc' | 'hive' | 'burst'>('arc')
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase('hive'), HIVE_AT_MS),
      window.setTimeout(() => setPhase('burst'), BURST_AT_MS),
      window.setTimeout(() => doneRef.current(), DONE_AT_MS),
    ]
    const iv = window.setInterval(() => setLineIndex((i) => Math.min(i + 1, lines.length - 1)), LINE_CADENCE_MS)
    return () => {
      timers.forEach((t) => window.clearTimeout(t))
      window.clearInterval(iv)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative flex min-h-[560px] flex-col items-center justify-center overflow-hidden rounded-r-xl px-8">
      <div className="relative" style={{ width: 220, height: 220 }}>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Life7Mark size={160} state="thinking" />
        </div>
        {/* the seven days forming around the mark */}
        {Array.from({ length: 7 }, (_, i) => {
          const angle = (-90 + i * (360 / 7)) * (Math.PI / 180)
          const arc = { x: 110 + 92 * Math.cos(angle), y: 110 + 92 * Math.sin(angle) }
          const hive = { x: 110 + HIVE_POS[i].x, y: 110 + HIVE_POS[i].y }
          const burst = { x: 110 + 150 * Math.cos(angle), y: 110 + 150 * Math.sin(angle) }
          const target = phase === 'arc' ? arc : phase === 'hive' ? hive : burst
          return (
            <motion.span
              key={i}
              className="bg-sun-core absolute h-2.5 w-2.5 rounded-full shadow-e-1"
              initial={{ x: arc.x, y: arc.y, scale: 0, opacity: 0 }}
              animate={{
                x: target.x,
                y: target.y,
                scale: phase === 'burst' ? 1.7 : 1,
                opacity: phase === 'burst' ? 0 : 1,
              }}
              transition={
                phase === 'arc'
                  ? { ...EASE_SPRING, delay: 0.2 + i * 0.2 }
                  : phase === 'hive'
                    ? { duration: 0.55, ease: EASE_GLIDE, delay: i * 0.03 }
                    : { duration: 0.35, ease: 'easeIn', delay: i * 0.02 }
              }
              style={{ marginLeft: -5, marginTop: -5 }}
            />
          )
        })}
      </div>
      <div className="relative mt-8 h-10 w-full text-center">
        <AnimatePresence mode="popLayout">
          <motion.p
            key={lineIndex}
            className="t-serif-quote absolute inset-x-0 text-[18px] text-ink-soft"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE_GLIDE }}
          >
            {lines[lineIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- section */

function Section({
  title,
  delay,
  defaultOpen = true,
  children,
}: {
  title: string
  delay: number
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.56, delay, ease: EASE_GLIDE }}>
      <GlassCard flat className="overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-4 p-5 text-left"
        >
          <h3 className="t-display-sm text-ink">{title}</h3>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3, ease: EASE_GLIDE }} className="text-ink-faint">
            <ChevronDown size={18} strokeWidth={1.8} />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.38, ease: EASE_GLIDE }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  )
}

/* --------------------------------------------------------------- day rows */

function DayRow({ day, expanded, onToggle }: { day: DayPlan; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-r-md border border-line bg-soft-white/60">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <ScoreRing value={day.score} size={36} strokeWidth={4}>
          {(count) => <motion.span className="text-[10px] font-bold text-ink tnum">{count}</motion.span>}
        </ScoreRing>
        <div className="w-[86px] shrink-0">
          <div className="t-ui-sm text-ink">{day.dayName}</div>
          <div className="text-[11px] text-ink-faint">{day.dateLabel}</div>
        </div>
        <div className="t-ui-sm hidden min-w-0 flex-1 truncate font-medium text-ink-soft min-[640px]:block">
          {day.meals.map((m) => m.name).join(' · ')}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-3 text-right min-[640px]:ml-0">
          <span className="t-metric-sm whitespace-nowrap text-ink">{day.kcal} kcal · P {day.proteinG} g</span>
          <span className="t-metric-sm hidden text-ink-soft min-[840px]:inline">{eur(day.costEur)}</span>
          <span className="t-ui-sm hidden text-ink-faint min-[840px]:inline">{day.prepMinutes} min</span>
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }} className="text-ink-faint">
            <ChevronDown size={15} strokeWidth={1.8} />
          </motion.span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: EASE_GLIDE }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 px-3 pb-3">
              {day.meals.map((meal, i) => {
                const totals = mealTotals(meal.items)
                return (
                  <MealCard
                    key={meal.id}
                    delay={i * 0.05}
                    photo={`/${meal.photo}`}
                    name={meal.name}
                    kcal={Math.round(totals.kcal)}
                    protein={Math.round(totals.protein)}
                    carbs={Math.round(totals.carbs)}
                    fat={Math.round(totals.fat)}
                    time={meal.time}
                    prep={`${meal.prepMinutes + meal.cookMinutes} min`}
                  >
                    <p className="t-ui-sm mt-1 font-medium text-ink-faint">{itemsLine(meal.items)}</p>
                    {meal.note && <p className="mt-0.5 font-display text-[13px] italic text-gold-deep">{meal.note}</p>}
                  </MealCard>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------- plan stage */

function PlanStage({
  plan,
  inputsChanged,
  onRegenerate,
  onSendToWeek,
  onOpenShopping,
  onStartOver,
}: {
  plan: GeneratedWeek
  inputsChanged: boolean
  onRegenerate: () => void
  onSendToWeek: (e: ReactMouseEvent) => void
  onOpenShopping: () => void
  onStartOver: () => void
}) {
  const todayId = plan.week.days.find((d) => d.status === 'today')?.id ?? plan.week.days[0]?.id
  const [expandedDay, setExpandedDay] = useState<string | null>(todayId)
  const { summary } = plan
  const underBudget = summary.budgetDeltaEur >= 0

  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.7, ease: EASE_GLIDE }}
      className="space-y-4"
    >
      {/* summary band */}
      <div className="grid grid-cols-2 gap-3 min-[840px]:grid-cols-4">
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease: EASE_GLIDE }}>
          <GlassCard flat className="flex h-full flex-col items-center gap-1.5 p-4 text-center">
            <ScoreRing value={summary.weekScore} size={72} strokeWidth={7}>
              {(count) => <motion.span className="t-metric-lg text-[26px] text-ink">{count}</motion.span>}
            </ScoreRing>
            <span className="t-label text-ink-soft">Week score</span>
          </GlassCard>
        </motion.div>
        {[
          {
            label: 'Total cost',
            value: <AnimatedNumber value={summary.totalCostEur} delay={0.08} format={(n) => eur(n)} className="t-metric-lg text-[26px] text-ink" />,
            caption: underBudget ? `${eur(summary.budgetDeltaEur)} under budget` : `${eur(Math.abs(summary.budgetDeltaEur))} over budget`,
            captionClass: underBudget ? 'text-green' : 'text-burgundy',
          },
          {
            label: 'Prep avg',
            value: <AnimatedNumber value={summary.avgPrepMinutes} delay={0.16} format={(n) => `${Math.round(n)} min`} className="t-metric-lg text-[26px] text-ink" />,
            caption: 'per day, all meals',
            captionClass: 'text-ink-faint',
          },
          {
            label: 'Pantry usage',
            value: <AnimatedNumber value={summary.pantryUsagePct} delay={0.24} format={(n) => `${Math.round(n)}%`} className="t-metric-lg text-[26px] text-ink" />,
            caption: "you'll use what you have",
            captionClass: 'text-ink-faint',
          },
        ].map((cell, i) => (
          <motion.div
            key={cell.label}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.08 * (i + 1), ease: EASE_GLIDE }}
          >
            <GlassCard flat className="flex h-full flex-col items-center justify-center gap-1.5 p-4 text-center">
              {cell.value}
              <span className="t-label text-ink-soft">{cell.label}</span>
              <span className={cn('t-ui-sm font-medium', cell.captionClass)}>{cell.caption}</span>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* 1 — your seven days */}
      <Section title="Your seven days" delay={0.3}>
        <div className="space-y-2">
          {plan.week.days.map((day) => (
            <DayRow key={day.id} day={day} expanded={expandedDay === day.id} onToggle={() => setExpandedDay((d) => (d === day.id ? null : day.id))} />
          ))}
        </div>
      </Section>

      {/* 2 — shopping list preview */}
      <Section title="Shopping list preview" delay={0.39}>
        <div className="grid grid-cols-2 gap-2.5 min-[640px]:grid-cols-3">
          {plan.shoppingPreview.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.42, delay: i * 0.05, ease: EASE_GLIDE }}
              className="flex items-center gap-3 rounded-r-md border border-line bg-soft-white/70 p-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-r-sm bg-cream">
                <img src={`/${item.image}`} alt="" className="h-8 w-8 object-contain" loading="lazy" />
              </span>
              <span className="min-w-0">
                <span className="t-ui-sm block truncate text-ink">{item.name}</span>
                <span className="tnum block text-[12px] font-semibold text-ink-faint">
                  {item.quantityLabel} · {eur(item.priceEur)}
                </span>
              </span>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="t-ui-sm text-ink-faint">+{plan.shoppingMoreCount} more on the full list</span>
          <MagneticButton variant="gold" size="sm" icon={<ShoppingBasket size={14} />} onClick={onOpenShopping}>
            Open full list
          </MagneticButton>
        </div>
      </Section>

      {/* 3 — pantry & leftovers */}
      <Section title="Pantry & leftovers" delay={0.48}>
        <div className="grid gap-4 min-[640px]:grid-cols-2">
          <div className="rounded-r-md border border-line bg-soft-white/60 p-4">
            <span className="t-label text-ink-soft">From your pantry</span>
            <div className="mt-3 flex items-center gap-4">
              <ScoreRing value={summary.pantryUsagePct} size={64} strokeWidth={6}>
                {(count) => (
                  <span className="tnum text-[15px] font-bold text-ink">
                    <motion.span>{count}</motion.span>%
                  </span>
                )}
              </ScoreRing>
              <div className="flex flex-wrap gap-1.5">
                {plan.pantryChips.map((c) => (
                  <Chip key={c} variant="sage" className="px-2.5 py-1 text-[12px]">
                    {c}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-r-md border border-line bg-soft-white/60 p-4">
            <span className="t-label text-ink-soft">Expected leftovers</span>
            <ul className="mt-3 space-y-2.5">
              {plan.leftovers.map((l) => (
                <li key={l.label} className="t-ui-sm flex items-baseline justify-between gap-3">
                  <span className="text-ink">{l.label}</span>
                  <span className="shrink-0 text-gold-deep">→ {l.destination}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 font-display text-[13px] italic leading-snug text-ink-faint">
              Cooked once on Sunday, eaten twice.
            </p>
          </div>
        </div>
      </Section>

      {/* 4 — expiry optimisation */}
      <Section title="Expiry optimisation" delay={0.57}>
        <AILine>{plan.expiryNote}</AILine>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {plan.expiryChips.map((c) => (
            <div key={c.name} className="min-w-[132px] rounded-r-md border border-line bg-soft-white/70 px-3 py-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="t-ui-sm text-ink">{c.name}</span>
                <span className="t-label text-gold-deep">{c.dayLabel}</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-cream">
                <motion.div
                  className={cn('h-full rounded-full', c.freshnessPct >= 75 ? 'bg-green' : c.freshnessPct >= 50 ? 'bg-champagne' : 'bg-burgundy')}
                  initial={{ width: 0 }}
                  animate={{ width: `${c.freshnessPct}%` }}
                  transition={{ duration: 0.8, ease: EASE_GLIDE }}
                />
              </div>
              <span className="tnum mt-1.5 block text-[11px] font-semibold text-ink-faint">{c.freshnessPct}% fresh</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 5 — meal prep schedule */}
      <Section title="Meal prep schedule" delay={0.66}>
        <div className="rounded-r-md border-l-[3px] border-champagne bg-soft-white/70 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="t-label text-gold-deep">
              {plan.prepSchedule.dayLabel} · {plan.prepSchedule.time}
            </span>
            <span className="tnum text-[12px] font-bold text-green">saves {plan.prepSchedule.savesMinutes} min</span>
          </div>
          <p className="t-ui-md mt-2 text-ink">
            {plan.prepSchedule.tasks} · {plan.prepSchedule.totalMinutes} min total, saves {plan.prepSchedule.savesMinutes} min across the week.
          </p>
          {/* reuse arcs Sun → Wed */}
          <div className="mt-4">
            <svg viewBox="0 0 300 26" className="h-6 w-full" fill="none" aria-hidden="true">
              {[110, 190, 270].map((x, i) => (
                <path
                  key={x}
                  d={`M 30 22 Q ${(30 + x) / 2} ${-6 - i * 2} ${x} 22`}
                  stroke="#D9B26A"
                  strokeWidth="1.5"
                  strokeDasharray="3 4"
                  strokeLinecap="round"
                  className="animate-dash-drift"
                />
              ))}
            </svg>
            <div className="grid grid-cols-4 items-end gap-2">
              {[
                { d: 'Sun', h: 100, label: '35 min' },
                { d: 'Mon', h: 26, label: '8 min' },
                { d: 'Tue', h: 30, label: '10 min' },
                { d: 'Wed', h: 20, label: '6 min' },
              ].map((b, i) => (
                <div key={b.d} className="flex flex-col items-center gap-1">
                  <span className="tnum text-[11px] font-semibold text-ink-faint">{b.label}</span>
                  <div className="flex h-14 w-full items-end rounded-t-[6px] bg-sage-mist/70">
                    <motion.div
                      className={cn('w-full rounded-t-[6px]', i === 0 ? 'bg-sunrise-gold' : 'bg-green/80')}
                      initial={{ height: 0 }}
                      animate={{ height: `${b.h}%` }}
                      transition={{ duration: 0.7, delay: 0.1 + i * 0.06, ease: EASE_GLIDE }}
                    />
                  </div>
                  <span className="t-label text-ink-soft">{b.d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* footer actions */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.75, ease: EASE_GLIDE }}
        className="flex flex-wrap items-center gap-3 pt-2"
      >
        <span role="presentation" onClick={onSendToWeek}>
          <MagneticButton variant="primary" size="lg" icon={<CalendarCheck2 size={16} strokeWidth={1.8} />}>
            Send plan to Week
          </MagneticButton>
        </span>
        <MagneticButton variant="glass" size="md" icon={<ListChecks size={15} strokeWidth={1.8} />} onClick={onOpenShopping}>
          Build shopping list
        </MagneticButton>
        <MagneticButton variant="ghost" size="md" icon={<RotateCcw size={14} strokeWidth={1.8} />} onClick={onStartOver}>
          Start over
        </MagneticButton>
      </motion.div>

      {/* inputs changed → regenerate */}
      <AnimatePresence>
        {inputsChanged && (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={EASE_SPRING}
            className="glass-strong sticky bottom-4 z-20 mx-auto flex w-fit items-center gap-3 rounded-r-pill py-2.5 pl-5 pr-3 shadow-e-3"
          >
            <motion.span
              className="h-2 w-2 rounded-full bg-champagne"
              animate={{ opacity: [1, 0.35, 1], scale: [1, 0.8, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="t-ui-sm text-ink">Inputs changed</span>
            <MagneticButton variant="gold" size="sm" icon={<PackageOpen size={14} />} onClick={onRegenerate}>
              Regenerate
            </MagneticButton>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ----------------------------------------------------------------- stage */

export interface ResultsStageProps {
  status: StageStatus
  plan: GeneratedWeek | null
  stageRef: RefObject<HTMLDivElement | null>
  inputsChanged: boolean
  onTheaterDone: () => void
  onRegenerate: () => void
  onSendToWeek: (e: ReactMouseEvent) => void
  onOpenShopping: () => void
  onStartOver: () => void
}

export default function ResultsStage({
  status,
  plan,
  stageRef,
  inputsChanged,
  onTheaterDone,
  onRegenerate,
  onSendToWeek,
  onOpenShopping,
  onStartOver,
}: ResultsStageProps) {
  return (
    <div ref={stageRef} className="min-w-0">
      {status === 'empty' && (
        <GlassCard size="xl" flat className="h-full">
          <EmptyStage />
        </GlassCard>
      )}
      {status === 'thinking' && (
        <GlassCard size="xl" flat>
          <ThinkingStage lines={plan?.thinkingLines ?? []} onDone={onTheaterDone} />
        </GlassCard>
      )}
      {status === 'plan' && plan && (
        <PlanStage
          plan={plan}
          inputsChanged={inputsChanged}
          onRegenerate={onRegenerate}
          onSendToWeek={onSendToWeek}
          onOpenShopping={onOpenShopping}
          onStartOver={onStartOver}
        />
      )}
    </div>
  )
}
