/**
 * Planner meal preview drawer (right-side glass panel, planner.md Zone A
 * "View → drawer meal preview") + the cooking overlay started from
 * "Start cooking (N min)" actions.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Check, Timer } from 'lucide-react'
import { mealTotals } from '@/lib/nutrition'
import { getIngredient } from '@/data/ingredients'
import type { PlannedMeal } from '@/data/demoWeek'
import { MagneticButton } from '@/components/life7'
import { EASE_GLIDE } from './ui'

function MacroChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="t-metric-sm tnum rounded-r-pill bg-cream px-2.5 py-1 text-ink">
      {label} <span className="text-ink-soft">{value}</span>
    </span>
  )
}

export function MealDrawer({
  meal,
  onClose,
  onMarkEaten,
}: {
  meal: PlannedMeal | null
  onClose: () => void
  onMarkEaten: () => void
}) {
  const navigate = useNavigate()
  return (
    <AnimatePresence>
      {meal && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-[rgba(43,38,32,0.2)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <motion.aside
            className="glass-strong fixed bottom-0 right-0 top-0 z-[71] flex w-full max-w-[420px] flex-col overflow-y-auto rounded-l-r-xl p-6 shadow-e-3"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.42, ease: EASE_GLIDE }}
            role="dialog"
            aria-label={`${meal.name} preview`}
          >
            <div className="flex items-start justify-between">
              <span className="t-label text-gold-deep">{meal.mealType} · {meal.time}</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="glass flex h-8 w-8 items-center justify-center rounded-full text-ink-soft shadow-e-1 hover:text-forest"
              >
                <X size={15} strokeWidth={1.5} />
              </button>
            </div>
            <div className="mt-4 overflow-hidden rounded-r-md">
              <img src={`/${meal.photo}`} alt={meal.name} className="aspect-[4/3] w-full object-cover" />
            </div>
            <h3 className="t-display-sm mt-4 text-ink">{meal.name}</h3>
            {(() => {
              const t = mealTotals(meal.items)
              return (
                <div className="mt-3 flex flex-wrap gap-2">
                  <MacroChip label="kcal" value={String(Math.round(t.kcal))} />
                  <MacroChip label="P" value={`${Math.round(t.protein)} g`} />
                  <MacroChip label="C" value={`${Math.round(t.carbs)} g`} />
                  <MacroChip label="F" value={`${Math.round(t.fat)} g`} />
                  <MacroChip label="Fibre" value={`${Math.round(t.fibre)} g`} />
                </div>
              )
            })()}
            <p className="t-ui-sm mt-3 text-ink-soft">
              Prep {meal.prepMinutes} min{meal.cookMinutes > 0 ? ` · cook ${meal.cookMinutes} min` : ''}
            </p>
            {meal.note && <p className="t-serif-quote mt-3 text-[16px] text-ink-soft">{meal.note}</p>}
            <div className="mt-5 border-t border-line pt-4">
              <span className="t-label text-ink-faint">Ingredients</span>
              <ul className="mt-2 space-y-1.5">
                {meal.items.map((item) => {
                  const ing = getIngredient(item.ingredientId)
                  return (
                    <li key={item.ingredientId} className="t-ui-sm flex items-center justify-between text-ink">
                      <span className="flex items-center gap-2">
                        <img src={`/${ing.image}`} alt="" className="h-6 w-6 rounded-full bg-cream object-contain" />
                        {ing.name}
                      </span>
                      <span className="tnum text-ink-soft">{item.grams} g</span>
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="mt-auto flex items-center gap-3 pt-6">
              <MagneticButton size="sm" onClick={() => navigate('/architect')}>
                Open in Architect
              </MagneticButton>
              <MagneticButton size="sm" variant="ghost" onClick={onMarkEaten}>
                Mark eaten
              </MagneticButton>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

const COOK_STEPS = ['Prepare ingredients', 'Cook with heat', 'Plate & serve']

export function CookingOverlay({
  meal,
  totalMinutes,
  onFinish,
  onClose,
}: {
  meal: PlannedMeal | null
  totalMinutes: number
  onFinish: () => void
  onClose: () => void
}) {
  // accelerated demo clock: 1 real second = 1 cooking minute
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!meal) return
    setElapsed(0)
    const iv = window.setInterval(() => setElapsed((e) => Math.min(totalMinutes, e + 1)), 1000)
    return () => window.clearInterval(iv)
  }, [meal, totalMinutes])

  const pct = totalMinutes > 0 ? Math.min(100, (elapsed / totalMinutes) * 100) : 0
  const stepIndex = Math.min(COOK_STEPS.length - 1, Math.floor((pct / 100) * COOK_STEPS.length))

  return (
    <AnimatePresence>
      {meal && (
        <>
          <motion.div
            className="fixed inset-0 z-[72] bg-[rgba(43,38,32,0.22)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="glass-strong fixed left-1/2 top-1/2 z-[73] w-[min(440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-r-xl p-6 shadow-e-3"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.38, ease: EASE_GLIDE }}
            role="dialog"
            aria-label={`Cooking ${meal.name}`}
          >
            <div className="flex items-start justify-between">
              <span className="t-label text-gold-deep">Cooking mode</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="glass flex h-8 w-8 items-center justify-center rounded-full text-ink-soft shadow-e-1 hover:text-forest"
              >
                <X size={15} strokeWidth={1.5} />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <img src={`/${meal.photo}`} alt="" className="h-16 w-16 rounded-r-md object-cover" />
              <div>
                <h3 className="t-display-sm text-ink">{meal.name}</h3>
                <p className="t-ui-sm mt-0.5 flex items-center gap-1.5 text-ink-soft">
                  <Timer size={13} strokeWidth={1.5} className="text-gold-deep" />
                  {Math.max(0, totalMinutes - elapsed)} of {totalMinutes} min left
                </p>
              </div>
            </div>
            {/* progress ring bar */}
            <div className="mt-5 h-2 overflow-hidden rounded-r-pill bg-cream">
              <motion.div
                className="bg-metric-fill h-full rounded-r-pill"
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: EASE_GLIDE }}
              />
            </div>
            <ul className="mt-5 space-y-2.5">
              {COOK_STEPS.map((step, i) => {
                const state = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'todo'
                return (
                  <li key={step} className="flex items-center gap-3">
                    <span
                      className={
                        state === 'done'
                          ? 'flex h-6 w-6 items-center justify-center rounded-full bg-green text-soft-white'
                          : state === 'active'
                            ? 'flex h-6 w-6 items-center justify-center rounded-full bg-sunrise-gold text-ink'
                            : 'flex h-6 w-6 items-center justify-center rounded-full bg-cream text-ink-faint'
                      }
                    >
                      {state === 'done' ? <Check size={12} strokeWidth={2.5} /> : <span className="t-label text-[9px]">{i + 1}</span>}
                    </span>
                    <span className={state === 'active' ? 't-ui-sm font-bold text-ink' : 't-ui-sm text-ink-soft'}>{step}</span>
                  </li>
                )
              })}
            </ul>
            <div className="mt-6 flex justify-end gap-3">
              <MagneticButton size="sm" variant="ghost" onClick={onClose}>
                Close
              </MagneticButton>
              <MagneticButton size="sm" onClick={onFinish}>
                Finish cooking
              </MagneticButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
