/**
 * RIGHT zone — LIFE7 Intelligence (meal-architect.md):
 * animated Meal Score ring (with rotating dashed ghost target), the 7
 * dimension bars, animated totals grid, and the recommendation stack with
 * the before/after "money moment" choreography (light wave, gold flashes,
 * celebrate state). All math comes from src/lib — this panel is thin.
 */

import { useId } from 'react'
import { AnimatePresence, motion, useTransform } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import { Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { AILine, Life7Mark, MagneticButton, MetricBar, ScoreRing } from '@/components/life7'
import type { Life7MarkState } from '@/components/life7'
import { cn } from '@/lib/utils'
import type { Recommendation } from '@/data/recommendationRules'
import {
  DIMENSION_KEYS,
  DIMENSION_LABELS,
  type DimensionKey,
  type MealScore,
} from '@/lib/scoring'
import RecommendationCard from './RecommendationCard'
import TweenNumber from './TweenNumber'
import { EASE_GLIDE } from './model'

// ---------------------------------------------------------------- satiety

/** One seed icon, partially filled left→right (satiety 0–5 scale). */
function Seed({ fill }: { fill: number }) {
  const id = useId()
  const d = 'M8 1.6 C 11.6 5.1, 12.9 8.6, 8 14.4 C 3.1 8.6, 4.4 5.1, 8 1.6 Z'
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <rect x="0" y="0" width={16 * Math.max(0, Math.min(1, fill))} height="16" />
        </clipPath>
      </defs>
      <path d={d} fill="#E4ECDD" stroke="#C9D6C0" strokeWidth="0.8" />
      <g clipPath={`url(#${id})`}>
        <path d={d} fill="#5C7A54" />
      </g>
    </svg>
  )
}

// --------------------------------------------------------------- totals grid

function TotalCell({
  label,
  children,
  alert,
}: {
  label: string
  children: React.ReactNode
  alert?: boolean
}) {
  return (
    <div className={cn('rounded-r-sm bg-soft-white/70 px-2.5 py-2', alert && 'bg-burgundy/5')}>
      <p className="t-label text-[8.5px] text-ink-faint">{label}</p>
      <div className={cn('t-metric-sm tnum mt-0.5 text-[14px]', alert ? 'text-burgundy' : 'text-ink')}>
        {children}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------- panel

export interface IntelligencePanelProps {
  hasItems: boolean
  score: MealScore
  scoreDriver: MotionValue<number>
  ghostTarget: number | null
  recs: readonly Recommendation[]
  appliedIds: ReadonlySet<string>
  totalDelta: number
  onApply: (rec: Recommendation, rect: DOMRect) => void
  onApplyAll: (rect: DOMRect) => void
  onShuffle: () => void
  markState: Life7MarkState
  waveKey: number
  waveKind: 'gold' | 'sage'
  prepMin: number
  satiety5: number
  budgetEur: number
  onBudgetAlternative: () => void
  dimFlash: Partial<Record<DimensionKey, number>>
  applyAllRef: React.RefObject<HTMLDivElement | null>
  aiStatus: 'idle' | 'loading' | 'live' | 'error'
  aiSummary: string
  aiSafetyNote: string
  aiModel: string
  aiError: string
  onAnalyze: () => void
}

const RING = { size: 200, stroke: 10 }

export default function IntelligencePanel({
  hasItems,
  score,
  scoreDriver,
  ghostTarget,
  recs,
  appliedIds,
  totalDelta,
  onApply,
  onApplyAll,
  onShuffle,
  markState,
  waveKey,
  waveKind,
  prepMin,
  satiety5,
  budgetEur,
  onBudgetAlternative,
  dimFlash,
  applyAllRef,
  aiStatus,
  aiSummary,
  aiSafetyNote,
  aiModel,
  aiError,
  onAnalyze,
}: IntelligencePanelProps) {
  const t = score.totals
  const ghostR = (RING.size - RING.stroke) / 2 - 4
  const ghostC = 2 * Math.PI * ghostR
  const ghostOpacity = useTransform(scoreDriver, (v) =>
    ghostTarget != null && v >= ghostTarget - 0.5 ? 0 : 0.4,
  )
  const overBudget = hasItems && t.costEur > budgetEur

  return (
    <div className="glass relative flex h-full flex-col overflow-hidden rounded-r-xl shadow-e-1">
      {/* light wave sweep (apply) / sage shimmer (recompute) */}
      <AnimatePresence>
        {waveKey > 0 && (
          <motion.div
            key={waveKey}
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-y-0 left-0 z-30 w-[35%]',
              waveKind === 'gold' ? 'bg-light-wave' : 'bg-sage-wave',
            )}
            initial={{ x: '-120%' }}
            animate={{ x: '380%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: waveKind === 'gold' ? 0.95 : 0.3, ease: EASE_GLIDE }}
          />
        )}
      </AnimatePresence>

      {/* data-lenis-prevent: hover + wheel must natively scroll this panel —
          Lenis on the outer wrapper would otherwise swallow the gesture */}
      <div data-lenis-prevent className="flex-1 overflow-y-auto p-4 min-[1600px]:p-5">
        {/* header */}
        <div className="flex items-center gap-3">
          <Life7Mark size={64} state={markState} />
          <div className="min-w-0 flex-1">
            <p className="t-label text-ink-soft">LIFE7 Intelligence</p>
            <p className="t-serif-quote mt-1 text-[14px] leading-snug text-ink-faint">
              The smallest useful adjustment, computed live.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={!hasItems || recs.length === 0 || aiStatus === 'loading'}
          className="t-ui-sm mt-3 flex w-full items-center justify-center gap-2 rounded-r-md border border-gold/30 bg-sunrise/55 px-3 py-2 text-ink transition-colors hover:bg-sunrise disabled:cursor-not-allowed disabled:opacity-45"
        >
          {aiStatus === 'loading' ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles size={14} strokeWidth={1.8} aria-hidden="true" />
          )}
          {aiStatus === 'loading' ? 'Analyzing live…' : aiStatus === 'live' ? 'Refresh GPT-5.6 analysis' : 'Analyze with GPT-5.6'}
        </button>

        <AnimatePresence mode="wait">
          {aiStatus === 'live' && aiSummary && (
            <motion.div
              key="ai-live"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-3 rounded-r-md border border-sage/25 bg-sage-wash/60 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="t-label text-[8.5px] text-sage-deep">Live intelligence</span>
                <span className="t-label rounded-r-pill bg-soft-white/70 px-2 py-1 text-[7.5px] text-ink-faint">
                  {aiModel || 'GPT-5.6'} · LIFE7 verified
                </span>
              </div>
              <p className="t-ui-sm mt-2 leading-relaxed text-ink">{aiSummary}</p>
              {aiSafetyNote && <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">{aiSafetyNote}</p>}
            </motion.div>
          )}
          {aiStatus === 'error' && (
            <motion.p
              key="ai-error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="t-ui-sm mt-3 rounded-r-md bg-burgundy/5 px-3 py-2 text-burgundy"
            >
              {aiError || 'Live analysis is unavailable.'} LIFE7 recommendations remain active.
            </motion.p>
          )}
        </AnimatePresence>

        {/* ------------------------------------------------ Block 1 — score */}
        <div className="mt-4 flex flex-col items-center">
          {hasItems ? (
            <div className="relative">
              <ScoreRing
                value={score.total}
                size={RING.size}
                strokeWidth={RING.stroke}
                driver={scoreDriver}
                animated={false}
              >
                {(count) => (
                  <div className="flex flex-col items-center">
                    <motion.span className="t-display-lg tnum leading-none text-ink">{count}</motion.span>
                    <span className="t-label mt-1 text-[9px] text-ink-faint">Meal score</span>
                  </div>
                )}
              </ScoreRing>

              {/* rotating dashed ghost target ring */}
              {ghostTarget != null && (
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{ opacity: ghostOpacity }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                >
                  <svg width={RING.size} height={RING.size} viewBox={`0 0 ${RING.size} ${RING.size}`} fill="none">
                    <circle
                      cx={RING.size / 2}
                      cy={RING.size / 2}
                      r={ghostR}
                      stroke="#B08A3E"
                      strokeWidth="2"
                      strokeDasharray="3 7"
                      strokeLinecap="round"
                      strokeDashoffset={ghostC * (1 - ghostTarget / 100)}
                      transform={`rotate(-90 ${RING.size / 2} ${RING.size / 2})`}
                    />
                  </svg>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="relative flex h-[200px] w-[200px] items-center justify-center">
              <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                <circle
                  cx="100"
                  cy="100"
                  r={ghostR}
                  stroke="#A79C8A"
                  strokeOpacity="0.45"
                  strokeWidth="2"
                  strokeDasharray="3 7"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="t-display-lg leading-none text-ink-faint">…</span>
                <span className="t-label mt-1 text-[9px] text-ink-faint">Meal score</span>
              </div>
            </div>
          )}

          {/* before/after delta line */}
          <AnimatePresence>
            {ghostTarget != null && hasItems && ghostTarget > score.total && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.4, ease: EASE_GLIDE }}
                className="t-ui-sm mt-2 text-ink-soft"
              >
                {score.total} → possible{' '}
                <span className="t-metric-sm tnum text-gold-deep">{ghostTarget}</span>
              </motion.p>
            )}
          </AnimatePresence>
          {!hasItems && (
            <p className="t-serif-quote mt-2 text-[15px] text-ink-faint">The formula is waiting.</p>
          )}
        </div>

        {/* dimension bars */}
        <div className="mt-4 space-y-2.5">
          {DIMENSION_KEYS.map((k, i) => (
            <motion.div
              key={k}
              className="relative"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 + i * 0.06, ease: EASE_GLIDE }}
            >
              <MetricBar label={DIMENSION_LABELS[k]} value={hasItems ? `${score.dims[k]}` : '…'} pct={score.dims[k]} />
              <AnimatePresence>
                {dimFlash[k] != null && dimFlash[k]! > 0 && (
                  <motion.span
                    key={dimFlash[k]}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-r-sm bg-sunrise/50"
                    initial={{ opacity: 0.75 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: EASE_GLIDE }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* ----------------------------------------------- Block 2 — totals */}
        <p className="t-label mb-2 mt-5 text-ink-soft">Meal totals</p>
        <div className="grid grid-cols-2 gap-2">
          <TotalCell label="Total calories">
            <TweenNumber value={Math.round(t.kcal)} duration={0.9} suffix=" kcal" />
          </TotalCell>
          <TotalCell label="Protein">
            <TweenNumber value={Math.round(t.protein)} duration={0.9} suffix=" g" />
          </TotalCell>
          <TotalCell label="Carbohydrates">
            <TweenNumber value={Math.round(t.carbs)} duration={0.9} suffix=" g" />
          </TotalCell>
          <TotalCell label="Fats">
            <TweenNumber value={Math.round(t.fat)} duration={0.9} suffix=" g" />
          </TotalCell>
          <TotalCell label="Fibre">
            <TweenNumber value={Math.round(t.fibre)} duration={0.9} suffix=" g" />
          </TotalCell>
          <TotalCell label="Micronutrients">
            <TweenNumber value={score.dims.micro} duration={0.9} suffix="%" />
          </TotalCell>
          <TotalCell label="Estimated cost" alert={overBudget}>
            <TweenNumber value={t.costEur} duration={0.9} decimals={2} prefix="€" />
          </TotalCell>
          <TotalCell label="Preparation">
            <TweenNumber value={prepMin} duration={0.9} suffix=" min" />
          </TotalCell>
          <TotalCell label="Meal weight">
            <TweenNumber value={Math.round(t.weightG)} duration={0.9} suffix=" g" />
          </TotalCell>
          <TotalCell label="Satiety estimate">
            <span className="flex items-center gap-[3px] pt-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Seed key={i} fill={satiety5 - i} />
              ))}
              <span className="t-metric-sm tnum ml-1 text-[12px] text-ink-soft">{satiety5.toFixed(1)}</span>
            </span>
          </TotalCell>
        </div>
        {overBudget && (
          <button
            type="button"
            onClick={onBudgetAlternative}
            className="t-ui-sm mt-2 text-left text-burgundy underline-offset-2 hover:underline"
          >
            €{(t.costEur - budgetEur).toFixed(2)} over your meal budget, see budget alternatives
          </button>
        )}

        {/* ---------------------------------------- Block 3 — LIFE7 recs */}
        <div className="mb-2 mt-5 flex items-center justify-between">
          <p className="t-label text-ink-soft">Smallest useful adjustments</p>
          <button
            type="button"
            aria-label="Re-roll recommendations"
            onClick={onShuffle}
            className="flex h-6 w-6 items-center justify-center rounded-full text-ink-faint transition-colors duration-180 hover:bg-cream hover:text-gold-deep"
          >
            <RefreshCw size={13} strokeWidth={1.8} />
          </button>
        </div>

        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {recs.map((rec, i) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                index={i}
                applied={appliedIds.has(rec.id)}
                onApply={onApply}
              />
            ))}
          </AnimatePresence>
          {recs.length === 0 && (
            <AILine className="px-1 py-2 text-[15px]" delay={0.2}>
              This formula is balanced, nothing to adjust right now.
            </AILine>
          )}
        </div>

        {recs.length > 1 && (
          <div ref={applyAllRef} className="mt-4 flex items-center justify-between gap-3">
            <span className="t-label rounded-r-pill bg-sunrise px-2.5 py-1 text-[10px] text-ink">
              Δ +{totalDelta}
            </span>
            <MagneticButton
              variant="gold"
              size="md"
              className="flex-1"
              icon={<Sparkles size={15} strokeWidth={1.8} />}
              onClick={() => {
                const rect = applyAllRef.current?.getBoundingClientRect()
                if (rect) onApplyAll(rect)
              }}
            >
              Apply all
            </MagneticButton>
          </div>
        )}
      </div>
    </div>
  )
}
