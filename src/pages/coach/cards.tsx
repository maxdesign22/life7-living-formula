/**
 * AI Coach — contextual cards embedded in the conversation stream
 * (coach.md Zone B): meal preview, replacement, goal adjustment, week
 * insight, recalculation, savings, day diff and expiry plan.
 * Each enters y 20→0 spring with a one-time gold rim flash.
 */
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Chip, MealCard, MetricBar } from '@/components/life7'
import type { CoachCard } from '@/data/coachScripts'
import { getIngredient } from '@/data/ingredients'

const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]

export interface CardHandlers {
  onOpenArchitect: () => void
  onShowWeek: () => void
}

/* ------------------------------------------------------------------ shell */

function CardShell({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0, scale: 0.98, boxShadow: '0 0 0 1.5px rgba(217,178,106,0.75)' }}
      animate={{ y: 0, opacity: 1, scale: 1, boxShadow: '0 0 0 0px rgba(217,178,106,0)' }}
      transition={{ type: 'spring', stiffness: 140, damping: 22, delay, boxShadow: { duration: 0.9, delay: delay + 0.15 } }}
      className={cn('rounded-r-md border border-line bg-soft-white/80 p-4', className)}
    >
      {children}
    </motion.div>
  )
}

function CardEyebrow({ children }: { children: React.ReactNode }) {
  return <span className="t-label text-gold-deep">{children}</span>
}

/* ------------------------------------------------------------ meal preview */

/** Display carbs/fat consistent with each scripted card's kcal + protein (4/4/9). */
const PREVIEW_MACROS: Readonly<Record<string, { carbs: number; fat: number }>> = {
  'Spinach Tomato Omelette': { carbs: 12, fat: 39 },
  'Greek Yoghurt Bowl, Walnuts & Banana': { carbs: 40, fat: 19 },
  'Chicken Rice Jar': { carbs: 55, fat: 20 },
}

function MealPreviewCard({ card, delay, handlers }: { card: Extract<CoachCard, { kind: 'meal-preview' }>; delay: number; handlers: CardHandlers }) {
  const fallback = (() => {
    const fat = Math.round(((card.kcal - card.proteinG * 4) * 0.35) / 9)
    const carbs = Math.round((card.kcal - card.proteinG * 4 - fat * 9) / 4)
    return { carbs, fat }
  })()
  const macros = PREVIEW_MACROS[card.name] ?? fallback
  return (
    <CardShell delay={delay} className="p-0">
      <MealCard
        photo={`/${card.photo}`}
        name={card.name}
        kcal={card.kcal}
        protein={card.proteinG}
        carbs={macros.carbs}
        fat={macros.fat}
        prep={`${card.prepMinutes} min prep`}
      >
        {card.note && <p className="mt-0.5 font-display text-[13px] italic text-gold-deep">{card.note}</p>}
        <button
          type="button"
          onClick={handlers.onOpenArchitect}
          className="t-ui-sm mt-1.5 inline-flex items-center gap-1 font-bold text-forest underline-offset-2 hover:underline"
        >
          Open in Architect <ArrowUpRight size={12} />
        </button>
      </MealCard>
    </CardShell>
  )
}

/* -------------------------------------------------------------- diff rows */

function DiffRow({ before, after, label, strike }: { before: string; after: string; label: string; strike?: boolean }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <span className="t-label w-[86px] shrink-0 pt-px text-ink-faint">{label}</span>
      <span className={cn('t-ui-sm min-w-0 flex-1 font-medium', strike ? 'text-ink-faint line-through' : 'text-ink-faint')}>{before}</span>
      <ArrowRight size={12} className="shrink-0 self-center text-champagne" />
      <span className="t-ui-sm min-w-0 flex-1 font-bold text-gold-deep">{after}</span>
    </div>
  )
}

/* ----------------------------------------------------------------- pieces */

function ReplacementCard({ card, delay }: { card: Extract<CoachCard, { kind: 'replacement' }>; delay: number }) {
  return (
    <CardShell delay={delay}>
      <CardEyebrow>Replacement suggestion</CardEyebrow>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
        <div className="rounded-r-sm bg-cream/70 p-3">
          <span className="t-label block text-ink-faint">Before</span>
          <span className="t-ui-sm mt-1 block font-bold text-ink">{card.beforeLabel}</span>
        </div>
        <span className="flex items-center text-champagne">
          <ArrowRight size={16} />
        </span>
        <div className="rounded-r-sm bg-sage-mist/80 p-3">
          <span className="t-label block text-ink-faint">After</span>
          <span className="t-ui-sm mt-1 block font-bold text-forest">{card.afterLabel}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip variant="gold" className="px-2.5 py-1 text-[12px]">
          {card.proteinDeltaG >= 0 ? '+' : '−'}{Math.abs(card.proteinDeltaG)} g protein
        </Chip>
        <Chip variant="sage" className="px-2.5 py-1 text-[12px]">
          −€{card.savesEur.toFixed(2)} saved
        </Chip>
      </div>
      <p className="mt-2.5 font-display text-[14px] italic leading-snug text-ink-soft">{card.note}</p>
    </CardShell>
  )
}

function GoalAdjustmentCard({ card, delay }: { card: Extract<CoachCard, { kind: 'goal-adjustment' }>; delay: number }) {
  // Deterministic demo math: protein target 150 g, energy target 2 800 kcal.
  const currentProtein = 150 - card.proteinDeltaG
  const currentKcal = 2060
  const proposedKcal = currentKcal + card.kcalDelta
  return (
    <CardShell delay={delay}>
      <CardEyebrow>Goal adjustment, training days</CardEyebrow>
      <div className="mt-3 space-y-3">
        <div className="grid gap-3 min-[520px]:grid-cols-2">
          <div className="rounded-r-sm bg-cream/60 p-3">
            <span className="t-label block text-ink-faint">Current</span>
            <span className="t-ui-sm mt-1 block font-bold text-ink">{card.currentLabel}</span>
          </div>
          <div className="rounded-r-sm bg-sage-mist/80 p-3">
            <span className="t-label block text-ink-faint">Proposed</span>
            <span className="t-ui-sm mt-1 block font-bold text-forest">{card.proposedLabel}</span>
          </div>
        </div>
        <MetricBar label="Protein, current" value={`${currentProtein} g`} pct={(currentProtein / 150) * 100} />
        <MetricBar label="Protein, proposed" value="150 g" pct={100} targetPct={(currentProtein / 150) * 100} />
        <MetricBar label="Energy, current" value={`${currentKcal.toLocaleString('en-US')} kcal`} pct={(currentKcal / 2800) * 100} />
        <MetricBar label="Energy, proposed" value={`${proposedKcal.toLocaleString('en-US')} kcal`} pct={(proposedKcal / 2800) * 100} targetPct={(currentKcal / 2800) * 100} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip variant="gold" className="px-2.5 py-1 text-[12px]">
          +{card.proteinDeltaG} g protein
        </Chip>
        <Chip variant="sage" className="px-2.5 py-1 text-[12px]">
          {card.kcalDelta} kcal
        </Chip>
      </div>
    </CardShell>
  )
}

function WeekInsightCard({ card, delay, handlers }: { card: Extract<CoachCard, { kind: 'week-insight' }>; delay: number; handlers: CardHandlers }) {
  return (
    <CardShell delay={delay}>
      <CardEyebrow>Week insight</CardEyebrow>
      <div className="mt-3 flex items-end gap-1.5" aria-hidden="true">
        {card.dayScores.map((s, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.1 + i * 0.05, type: 'spring', stiffness: 260, damping: 18 }}
            className={cn('h-3 w-3', i % 2 === 1 && '-translate-y-1', s <= 40 ? 'bg-burgundy' : s <= 70 ? 'bg-champagne' : 'bg-green')}
            style={{ clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)' }}
          />
        ))}
      </div>
      <p className="t-ui-md mt-3 text-ink">{card.finding}</p>
      <button
        type="button"
        onClick={handlers.onShowWeek}
        className="t-ui-sm mt-2.5 inline-flex items-center gap-1 font-bold text-forest underline-offset-2 hover:underline"
      >
        Show in Week <ArrowUpRight size={12} />
      </button>
    </CardShell>
  )
}

function RecalculationCard({ card, delay }: { card: Extract<CoachCard, { kind: 'recalculation' }>; delay: number }) {
  return (
    <CardShell delay={delay}>
      <CardEyebrow>Today, recalculated</CardEyebrow>
      <div className="mt-3 space-y-2.5">
        {card.changes.map((c) => (
          <DiffRow key={c.label} label={c.label} before={c.before} after={c.after} strike />
        ))}
      </div>
    </CardShell>
  )
}

function SavingsCard({ card, delay }: { card: Extract<CoachCard, { kind: 'savings' }>; delay: number }) {
  const afterPct = (card.afterEur / card.beforeEur) * 100
  const totalSaved = card.beforeEur - card.afterEur
  return (
    <CardShell delay={delay}>
      <div className="flex items-baseline justify-between gap-3">
        <CardEyebrow>Savings breakdown</CardEyebrow>
        <span className="t-metric-sm text-green">−€{totalSaved.toFixed(2)} / week</span>
      </div>
      <div className="mt-3 space-y-2.5">
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="t-label text-ink-faint">Now</span>
            <span className="t-metric-sm text-ink">€{card.beforeEur.toFixed(2)}</span>
          </div>
          <div className="h-[6px] w-full rounded-r-pill bg-sand/80" />
        </div>
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="t-label text-ink-faint">After swaps</span>
            <span className="t-metric-sm text-forest">€{card.afterEur.toFixed(2)}</span>
          </div>
          <div className="h-[6px] w-full rounded-r-pill bg-cream">
            <motion.div
              className="bg-metric-fill h-full rounded-r-pill"
              initial={{ width: 0 }}
              animate={{ width: `${afterPct}%` }}
              transition={{ duration: 0.8, delay: delay + 0.15, ease: EASE_GLIDE }}
            />
          </div>
        </div>
      </div>
      <ul className="mt-3 space-y-2 border-t border-line pt-3">
        {card.steps.map((s) => (
          <li key={s.label} className="t-ui-sm flex items-baseline justify-between gap-3">
            <span className="flex items-center gap-2 text-ink">
              <Check size={13} className="shrink-0 text-green" />
              {s.label}
            </span>
            <span className="tnum shrink-0 font-bold text-gold-deep">−€{s.savesEur.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </CardShell>
  )
}

function DayDiffCard({ card, delay }: { card: Extract<CoachCard, { kind: 'day-diff' }>; delay: number }) {
  return (
    <CardShell delay={delay}>
      <CardEyebrow>{card.summary}</CardEyebrow>
      <div className="mt-3 space-y-2.5">
        {card.changes.map((c) => (
          <DiffRow key={c.label} label={c.label} before={c.before} after={c.after} />
        ))}
      </div>
    </CardShell>
  )
}

function ExpiryPlanCard({ card, delay }: { card: Extract<CoachCard, { kind: 'expiry-plan' }>; delay: number }) {
  return (
    <CardShell delay={delay}>
      <CardEyebrow>Expiry plan</CardEyebrow>
      <div className="mt-3 space-y-2.5">
        {card.entries.map((e) => {
          const tone = e.freshnessPct >= 75 ? 'bg-green' : e.freshnessPct >= 50 ? 'bg-champagne' : 'bg-burgundy'
          return (
            <div key={e.ingredientId} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-r-sm bg-cream">
                <img src={`/${getIngredient(e.ingredientId).image}`} alt="" className="h-7 w-7 object-contain" loading="lazy" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="t-ui-sm text-ink">{e.name}</span>
                  <span className="tnum text-[11px] font-bold text-ink-faint">{e.freshnessPct}%</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-cream">
                  <motion.div
                    className={cn('h-full rounded-full', tone)}
                    initial={{ width: 0 }}
                    animate={{ width: `${e.freshnessPct}%` }}
                    transition={{ duration: 0.8, delay: delay + 0.15, ease: EASE_GLIDE }}
                  />
                </div>
              </div>
              <span className="t-ui-sm w-[128px] shrink-0 text-right font-bold text-gold-deep">{e.useLabel}</span>
            </div>
          )
        })}
      </div>
    </CardShell>
  )
}

/* ------------------------------------------------------------------ view */

export default function CoachCardView({ card, delay = 0, handlers }: { card: CoachCard; delay?: number; handlers: CardHandlers }) {
  switch (card.kind) {
    case 'meal-preview':
      return <MealPreviewCard card={card} delay={delay} handlers={handlers} />
    case 'replacement':
      return <ReplacementCard card={card} delay={delay} />
    case 'goal-adjustment':
      return <GoalAdjustmentCard card={card} delay={delay} />
    case 'week-insight':
      return <WeekInsightCard card={card} delay={delay} handlers={handlers} />
    case 'recalculation':
      return <RecalculationCard card={card} delay={delay} />
    case 'savings':
      return <SavingsCard card={card} delay={delay} />
    case 'day-diff':
      return <DayDiffCard card={card} delay={delay} />
    case 'expiry-plan':
      return <ExpiryPlanCard card={card} delay={delay} />
    default:
      return null
  }
}
