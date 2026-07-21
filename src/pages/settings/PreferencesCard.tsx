/**
 * Zone B — Preferences (settings.md): meals-per-day stepper, max-cooking-time
 * and weekly-budget sliders, units segmented (metric/imperial with tweened
 * conversions), dietary restriction chips (Vegetarian asks for a gentle
 * confirm), and the AILine footer.
 */
import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import { AILine, Chip, GlassCard, useToast } from '@/components/life7'
import { EASE_GLIDE, SectionHeader, SegmentedControl } from '@/pages/planner/ui'

/* ------------------------------------------------------------------ slider */

function Slider({
  value,
  min,
  max,
  step,
  onChange,
  format,
  ariaLabel,
}: {
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format: (v: number) => string
  ariaLabel: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const pct = ((value - min) / (max - min)) * 100

  const setFromClientX = (clientX: number) => {
    const el = trackRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const raw = min + frac * (max - min)
    onChange(Math.round(raw / step) * step)
  }

  return (
    <div
      ref={trackRef}
      className="relative h-5 w-full cursor-pointer touch-none"
      role="slider"
      aria-label={ariaLabel}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') onChange(Math.min(max, value + step))
        if (e.key === 'ArrowLeft') onChange(Math.max(min, value - step))
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        setDragging(true)
        setFromClientX(e.clientX)
      }}
      onPointerMove={(e) => dragging && setFromClientX(e.clientX)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      {/* track */}
      <span className="absolute inset-x-0 top-1/2 h-[4px] -translate-y-1/2 rounded-full bg-cream" />
      <span
        className="absolute left-0 top-1/2 h-[4px] -translate-y-1/2 rounded-full"
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #F7DFA7, #D9B26A)' }}
      />
      {/* thumb */}
      <span
        className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-champagne bg-soft-white shadow-e-1"
        style={{ left: `${pct}%` }}
      />
      {/* value bubble while dragging */}
      <AnimatePresence>
        {dragging && (
          <motion.span
            className="t-label pointer-events-none absolute -top-4 -translate-x-1/2 rounded-r-pill bg-forest px-2 py-0.5 text-soft-white shadow-e-1"
            style={{ left: `${pct}%` }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.16 }}
          >
            {format(value)}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ stepper */

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  const [ripple, setRipple] = useState(0)
  const bump = (d: number) => {
    onChange(Math.min(max, Math.max(min, value + d)))
    setRipple((n) => n + 1)
  }
  return (
    <div className="relative flex items-center gap-3">
      {ripple > 0 && (
        <motion.span
          key={ripple}
          className="pointer-events-none absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sage"
          initial={{ opacity: 0.8, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 0.5 }}
        />
      )}
      <button
        type="button"
        aria-label="Fewer meals"
        onClick={() => bump(-1)}
        className="glass flex h-7 w-7 items-center justify-center rounded-full text-forest shadow-e-1 transition-shadow hover:shadow-e-2"
      >
        <Minus size={13} strokeWidth={2} />
      </button>
      <motion.span key={value} className="t-metric-sm tnum w-6 text-center text-ink" initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ duration: 0.18 }}>
        {value}
      </motion.span>
      <button
        type="button"
        aria-label="More meals"
        onClick={() => bump(1)}
        className="glass flex h-7 w-7 items-center justify-center rounded-full text-forest shadow-e-1 transition-shadow hover:shadow-e-2"
      >
        <Plus size={13} strokeWidth={2} />
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------- card */

const RESTRICTIONS = ['No shellfish', 'Vegetarian', 'Vegan', 'Gluten-free', 'Nut-free', 'Dairy-free'] as const

export default function PreferencesCard({
  mealsPerDay,
  setMealsPerDay,
  maxCooking,
  setMaxCooking,
  budget,
  setBudget,
  units,
  setUnits,
  restrictions,
  setRestrictions,
}: {
  mealsPerDay: number
  setMealsPerDay: (v: number) => void
  maxCooking: number
  setMaxCooking: (v: number) => void
  budget: number
  setBudget: (v: number) => void
  units: 'metric' | 'imperial'
  setUnits: (u: 'metric' | 'imperial') => void
  restrictions: ReadonlySet<string>
  setRestrictions: (s: ReadonlySet<string>) => void
}) {
  const { toast } = useToast()
  const [confirmVeg, setConfirmVeg] = useState(false)

  const toggleRestriction = (r: string) => {
    const next = new Set(restrictions)
    if (next.has(r)) {
      next.delete(r)
      setRestrictions(next)
      return
    }
    if (r === 'Vegetarian') {
      setConfirmVeg(true)
      return
    }
    next.add(r)
    setRestrictions(next)
  }

  return (
    <GlassCard flat className="p-6">
      <SectionHeader>Preferences</SectionHeader>

      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="t-ui-sm font-bold text-ink">Meals per day</p>
            <p className="t-ui-sm font-medium text-ink-faint">Breakfast to dinner, snacks counted</p>
          </div>
          <Stepper value={mealsPerDay} min={3} max={5} onChange={setMealsPerDay} />
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="t-ui-sm font-bold text-ink">Max cooking time</p>
            <span className="t-metric-sm tnum text-gold-deep">{maxCooking} min</span>
          </div>
          <Slider value={maxCooking} min={10} max={45} step={5} onChange={setMaxCooking} format={(v) => `${v} min`} ariaLabel="Max cooking time in minutes" />
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="t-ui-sm font-bold text-ink">Weekly food budget</p>
            <span className="t-metric-sm tnum text-gold-deep">€{budget}</span>
          </div>
          <Slider value={budget} min={30} max={120} step={5} onChange={setBudget} format={(v) => `€${v}`} ariaLabel="Weekly food budget in euros" />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="t-ui-sm font-bold text-ink">Units</p>
            <p className="t-ui-sm font-medium text-ink-faint">Converts height, weight and measures</p>
          </div>
          <SegmentedControl
            id="units"
            options={[
              { value: 'metric', label: 'Metric' },
              { value: 'imperial', label: 'Imperial' },
            ]}
            value={units}
            onChange={setUnits}
          />
        </div>

        <div className="relative">
          <p className="t-ui-sm font-bold text-ink">Dietary restrictions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {RESTRICTIONS.map((r) => (
              <Chip key={r} variant={r === 'No shellfish' ? 'burgundy-outline' : 'sage'} selected={restrictions.has(r)} onClick={() => toggleRestriction(r)}>
                {r}
              </Chip>
            ))}
          </div>
          {/* gentle vegetarian confirm */}
          <AnimatePresence>
            {confirmVeg && (
              <motion.div
                className="glass-strong mt-3 rounded-r-md p-4 shadow-e-2"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.24, ease: EASE_GLIDE }}
              >
                <p className="t-ui-sm font-medium text-ink">This will regenerate your week.</p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    className="t-ui-sm rounded-r-pill bg-forest px-4 py-1.5 font-semibold text-soft-white"
                    onClick={() => {
                      const next = new Set(restrictions)
                      next.add('Vegetarian')
                      setRestrictions(next)
                      setConfirmVeg(false)
                      toast('Week regenerated — vegetarian plan starts tomorrow.', { tone: 'sage' })
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="t-ui-sm rounded-r-pill px-4 py-1.5 font-semibold text-ink-soft hover:text-ink"
                    onClick={() => setConfirmVeg(false)}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AILine className="text-[15px] text-ink-soft" delay={0.15}>
          Preferences apply from tomorrow&apos;s plan. Today&apos;s meals stay as agreed.
        </AILine>
      </div>
    </GlassCard>
  )
}
