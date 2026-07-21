import { motion } from 'framer-motion'
import { Sparkles, CalendarDays } from 'lucide-react'
import { AILine, Chip, GlassCard, MagneticButton, MetricBar } from '@/components/life7'
import type { BudgetOptimisation } from '@/lib/shopping'
import { DAY_NAMES_SHORT } from '@/data/profile'
import { eur, EASE_GLIDE, TweenMoney } from './bits'
import type { ViewSection } from './model'

/**
 * Zone C — right rail (shopping.md): basket summary with proportional store
 * bars + gold budget bar, pantry savings card, budget optimiser (gold spine),
 * and the quiet expiry-timing note.
 */
export default function RightRail({
  sections,
  totalEur,
  budgetEur,
  pantrySavingsEur,
  optimisation,
  optimised,
  onOptimise,
}: {
  sections: readonly ViewSection[]
  totalEur: number
  budgetEur: number
  pantrySavingsEur: number
  optimisation: BudgetOptimisation
  optimised: boolean
  onOptimise: () => void
}) {
  const headroom = Math.max(0, budgetEur - totalEur)
  const canonicalTotal = Math.max(
    sections.reduce((a, s) => a + s.canonicalSubtotalEur, 0),
    1,
  )
  return (
    <div className="flex flex-col gap-5 lg:sticky lg:top-4">
      {/* 1 · basket summary */}
      <GlassCard className="p-5">
        <p className="t-label text-gold-deep">Basket summary</p>
        <div className="mt-4 flex flex-col gap-3">
          {sections.map((s) => (
            <MetricBar
              key={s.store}
              label={s.label}
              value={eur(s.remainingEur)}
              pct={(s.canonicalSubtotalEur / canonicalTotal) * 100}
              height={5}
            />
          ))}
        </div>
        <div className="my-4 h-px bg-line" />
        <div className="flex items-baseline justify-between">
          <span className="t-ui-md text-ink-soft">Total remaining</span>
          <TweenMoney value={totalEur} className="t-metric-lg tnum whitespace-nowrap text-ink" />
        </div>
        {/* budget bar — gold fill animates 900ms */}
        <div className="mt-3">
          <div className="relative h-2 w-full overflow-hidden rounded-r-pill bg-cream">
            <motion.div
              className="bg-sunrise-gold h-full rounded-r-pill"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (totalEur / budgetEur) * 100)}%` }}
              transition={{ duration: 0.9, ease: EASE_GLIDE }}
            />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="t-ui-sm text-ink-faint">
              <TweenMoney value={totalEur} className="tnum" /> / {eur(budgetEur)}
            </span>
            <span className="t-ui-sm font-bold text-gold-deep">{eur(headroom)} headroom</span>
          </div>
        </div>
      </GlassCard>

      {/* 2 · pantry savings (sage tint) */}
      <GlassCard className="border-transparent bg-sage-mist/80 p-5">
        <p className="t-label text-forest">Pantry did the work</p>
        <p className="t-ui-md mt-2 text-ink">
          Using your pantry saved <span className="tnum font-bold text-forest">{eur(pantrySavingsEur)}</span> this week.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip variant="sage" className="bg-soft-white/70 px-2 py-0.5 text-[11px]">Oats −€1.30</Chip>
          <Chip variant="sage" className="bg-soft-white/70 px-2 py-0.5 text-[11px]">Rice −€1.10</Chip>
          <Chip variant="sage" className="bg-soft-white/70 px-2 py-0.5 text-[11px]">Olive oil −€2.40</Chip>
        </div>
      </GlassCard>

      {/* 3 · budget optimiser (gold spine) */}
      <GlassCard glow="gold" className="relative overflow-hidden p-5 pl-6">
        <span className="absolute inset-y-0 left-0 w-[3px] bg-champagne" aria-hidden="true" />
        <p className="t-label flex items-center gap-1.5 text-gold-deep">
          <Sparkles size={13} strokeWidth={1.5} /> Budget optimiser
        </p>
        <AILine className="mt-3 text-[17px] leading-snug">{optimisation.message}</AILine>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="t-metric-sm tnum text-ink-faint line-through">{eur(optimisation.totalBeforeEur)}</span>
          <span className="t-metric-sm tnum text-lg text-forest">{eur(optimisation.totalAfterEur)}</span>
          <span className="t-ui-sm font-bold text-gold-deep">save {eur(optimisation.savedEur)}</span>
        </div>
        <MagneticButton
          variant="gold"
          size="sm"
          className="mt-4 w-full"
          onClick={onOptimise}
          disabled={optimised}
        >
          {optimised ? 'Optimisation applied' : 'Apply optimisation'}
        </MagneticButton>
      </GlassCard>

      {/* 4 · expiry timing note */}
      <GlassCard flat className="p-5">
        <p className="t-label flex items-center gap-1.5 text-ink-soft">
          <CalendarDays size={13} strokeWidth={1.5} /> Expiry timing
        </p>
        <p className="t-ui-md mt-2 text-ink">Buy spinach and broccoli no earlier than Thursday.</p>
        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {DAY_NAMES_SHORT.map((d, i) => (
            <span
              key={d}
              className={
                i === 3
                  ? 'flex h-7 flex-1 items-center justify-center rounded-full bg-green text-[10px] font-bold text-soft-white shadow-e-1'
                  : 'flex h-7 flex-1 items-center justify-center rounded-full bg-cream text-[10px] font-semibold text-ink-faint'
              }
            >
              {d[0]}
            </span>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
