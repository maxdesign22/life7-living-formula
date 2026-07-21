/**
 * AI Week Generator — the intake wizard (generator.md LEFT column).
 * Three steps on a gold-filling progress spine: You · Your kitchen ·
 * Your tastes. Prefilled with Alex's profile; all edits flow back to the page.
 */
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Armchair,
  Bike,
  Carrot,
  Check,
  ChevronLeft,
  Footprints,
  Pill,
  Sparkles,
  Store,
  Trophy,
  Truck,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard, MagneticButton } from '@/components/life7'
import type { GeneratorIntake } from '@/lib/aiService'
import type { ActivityLevel, Sex } from '@/lib/nutrition'
import { GOAL_PROFILES, type GoalId } from '@/lib/scoring'
import type { StoreId } from '@/data/ingredients'
import {
  ChipInput,
  EASE_GLIDE,
  EASE_SOFT,
  EASE_SPRING,
  FieldLabel,
  LifeSlider,
  NumberField,
  SegmentedControl,
  Shake,
  SunArcMeals,
} from './bits'

/* -------------------------------------------------------------- constants */

const STEPS = ['You', 'Your kitchen', 'Your tastes'] as const

const ACTIVITIES: readonly { id: ActivityLevel; label: string; caption: string; icon: typeof Zap }[] = [
  { id: 'sedentary', label: 'Sedentary', caption: 'Desk days, little training', icon: Armchair },
  { id: 'light', label: 'Light', caption: '1–2 sessions / week', icon: Footprints },
  { id: 'moderate', label: 'Moderate', caption: '3–4 sessions / week', icon: Bike },
  { id: 'high', label: 'High', caption: '5–6 sessions / week', icon: Zap },
  { id: 'athlete', label: 'Athlete', caption: 'Daily training blocks', icon: Trophy },
]

/** The 10 wizard goals (composite "healthy-strong" is derived, not selectable). */
const WIZARD_GOALS: readonly GoalId[] = [
  'healthy',
  'strong',
  'lean',
  'muscle-gain',
  'stable-energy',
  'mental-focus',
  'longevity',
  'athlete',
  'budget-health',
  'simple-living',
]

const COUNTRIES = ['Finland', 'Sweden', 'Germany', 'Netherlands', 'United Kingdom', 'France', 'Spain'] as const

const STORES: readonly { id: StoreId; label: string; icon: typeof Store }[] = [
  { id: 'supermarket', label: 'Supermarket', icon: Store },
  { id: 'market', label: 'Farmers market', icon: Carrot },
  { id: 'pharmacy', label: 'Pharmacy / wellness', icon: Pill },
  { id: 'online', label: 'Online delivery', icon: Truck },
]

const FAVOURITE_SUGGESTIONS = ['chicken', 'oats', 'banana'] as const

/* ------------------------------------------------------------------ spine */

function Spine({ step }: { step: number }) {
  return (
    <div className="mb-8 flex items-center" aria-label={`Step ${step + 1} of 3 — ${STEPS[step]}`}>
      {STEPS.map((name, i) => (
        <div key={name} className={cn('flex items-center', i < STEPS.length - 1 && 'flex-1')}>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              {i === step && (
                <motion.span
                  className="absolute -inset-1.5 rounded-full border border-champagne"
                  animate={{ opacity: [1, 0.35, 1], scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold transition-colors duration-380',
                  i < step
                    ? 'bg-gold-deep text-soft-white'
                    : i === step
                      ? 'bg-sunrise-gold text-ink shadow-e-1'
                      : 'bg-cream text-ink-faint',
                )}
              >
                {i < step ? (
                  <motion.svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <motion.path
                      d="M2 6.2 4.8 9 10 3.2"
                      stroke="#FFFDF7"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3, ease: EASE_GLIDE }}
                    />
                  </motion.svg>
                ) : (
                  i + 1
                )}
              </div>
            </div>
            <span className={cn('t-ui-sm whitespace-nowrap', i === step ? 'text-ink' : 'text-ink-faint')}>{name}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="relative mx-2 h-[2px] flex-1 overflow-hidden rounded-full bg-cream min-[480px]:mx-3">
              <motion.div
                className="bg-sunrise-gold absolute inset-y-0 left-0 rounded-full"
                initial={false}
                animate={{ width: step > i ? '100%' : '0%' }}
                transition={{ duration: 0.6, ease: EASE_GLIDE }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ----------------------------------------------------------------- wizard */

export interface IntakeWizardProps {
  intake: GeneratorIntake
  onPatch: (patch: Partial<GeneratorIntake>) => void
  step: number
  direction: 1 | -1
  onStep: (next: number) => void
  onGenerate: () => void
  generating: boolean
}

export default function IntakeWizard({ intake, onPatch, step, direction, onStep, onGenerate, generating }: IntakeWizardProps) {
  const [shake, setShake] = useState<Record<string, number>>({})
  const shakeField = (key: string) => setShake((s) => ({ ...s, [key]: (s[key] ?? 0) + 1 }))

  const goalsValid = intake.goals.length >= 1
  const bodyValid = intake.age > 0 && intake.heightCm > 0 && intake.weightKg > 0
  const step1Valid = goalsValid && bodyValid
  const storesValid = intake.stores.length >= 1

  const tryContinue = () => {
    if (!step1Valid) {
      if (!bodyValid) shakeField('body')
      if (!goalsValid) shakeField('goals')
      return
    }
    onStep(step + 1)
  }

  const toggleGoal = (goal: GoalId) => {
    const has = intake.goals.includes(goal)
    if (has) {
      onPatch({ goals: intake.goals.filter((g) => g !== goal) })
    } else if (intake.goals.length < 2) {
      onPatch({ goals: [...intake.goals, goal] })
    } else {
      onPatch({ goals: [intake.goals[1], goal] })
    }
  }

  const toggleStore = (store: StoreId) => {
    const has = intake.stores.includes(store)
    onPatch({ stores: has ? intake.stores.filter((s) => s !== store) : [...intake.stores, store] })
  }

  const favourites = intake.favouriteFoods
  const suggestions = FAVOURITE_SUGGESTIONS.filter((s) => !favourites.some((f) => f.toLowerCase() === s))

  const fields = [
    /* ------------------------------------------------------------ STEP 1 */
    <div key="s1" className="space-y-6">
      <Shake tick={shake.body ?? 0}>
        {/* auto-fit ≥160px tracks: 2×2 on the 480px column, stacks on narrow phones — no clipping */}
        <div className="grid gap-x-4 gap-y-5 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
          <NumberField label="Age" unit="yrs" value={intake.age} min={16} max={100} onChange={(age) => onPatch({ age })} />
          <div className="min-w-0">
            <FieldLabel>Sex</FieldLabel>
            <SegmentedControl<Sex>
              ariaLabel="Sex"
              value={intake.sex}
              onChange={(sex) => onPatch({ sex })}
              options={[
                { value: 'male', label: 'M' },
                { value: 'female', label: 'F' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>
          <NumberField label="Height" unit="cm" value={intake.heightCm} min={120} max={230} onChange={(heightCm) => onPatch({ heightCm })} />
          <NumberField label="Weight" unit="kg" value={intake.weightKg} min={35} max={250} onChange={(weightKg) => onPatch({ weightKg })} />
        </div>
      </Shake>

      <div>
        <FieldLabel>Activity</FieldLabel>
        {/* 5-across only when the card is full-width (640–1024px); 3-across inside the 480px desktop column */}
        <div className="grid grid-cols-2 gap-2 min-[560px]:grid-cols-3 min-[640px]:grid-cols-5 min-[1024px]:grid-cols-3">
          {ACTIVITIES.map((a, i) => {
            const Icon = a.icon
            const selected = intake.activity === a.id
            return (
              <motion.button
                key={a.id}
                type="button"
                onClick={() => onPatch({ activity: a.id })}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...EASE_SPRING, delay: i * 0.06 }}
                className={cn(
                  'flex min-h-[104px] h-full flex-col items-start gap-1.5 rounded-r-md border p-3 text-left transition-colors duration-180',
                  selected
                    ? 'border-forest bg-forest text-soft-white shadow-e-1 ring-1 ring-forest/20'
                    : 'glass border-sand/70 hover:border-champagne hover:bg-sunrise/35',
                )}
                aria-pressed={selected}
              >
                <Icon size={17} strokeWidth={1.7} className={selected ? 'text-champagne' : 'text-ink-soft'} />
                <span className={cn('t-ui-sm', selected ? 'text-soft-white' : 'text-ink')}>{a.label}</span>
                <span className={cn('text-[11px] leading-[1.35]', selected ? 'text-soft-white/75' : 'text-ink-faint')}>{a.caption}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      <Shake tick={shake.goals ?? 0}>
        <div>
          <FieldLabel hint="up to 2 — they blend">Goal</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {WIZARD_GOALS.map((g) => {
              const selected = intake.goals.includes(g)
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGoal(g)}
                  aria-pressed={selected}
                  className={cn(
                    't-ui-sm flex items-center justify-between gap-2 rounded-r-pill border px-3.5 py-2 text-left transition-all duration-180',
                    selected
                      ? 'border-champagne bg-sunrise text-ink shadow-e-1'
                      : 'glass text-ink-soft hover:text-forest',
                  )}
                >
                  {GOAL_PROFILES[g].label}
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {selected && (
                      <motion.svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <motion.path
                          d="M2.2 6.8 5.2 9.8 11 3.2"
                          stroke="#B08A3E"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.3, ease: EASE_GLIDE }}
                        />
                      </motion.svg>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </Shake>

      <div className="flex justify-end pt-1">
        <MagneticButton variant="primary" size="md" onClick={tryContinue} className={cn(!step1Valid && 'opacity-60')}>
          Continue
        </MagneticButton>
      </div>
    </div>,

    /* ------------------------------------------------------------ STEP 2 */
    <div key="s2" className="space-y-6">
      <LifeSlider
        label="Weekly food budget"
        min={30}
        max={150}
        step={5}
        value={intake.weeklyBudgetEur}
        onChange={(weeklyBudgetEur) => onPatch({ weeklyBudgetEur })}
        format={(v) => `€${v}`}
        caption={`≈ €${(intake.weeklyBudgetEur / 7).toFixed(2)} / day`}
      />
      <LifeSlider
        label="Cooking time per meal"
        min={5}
        max={60}
        step={5}
        value={intake.maxCookingMinutes}
        onChange={(maxCookingMinutes) => onPatch({ maxCookingMinutes })}
        format={(v) => `${v} min`}
        caption="LIFE7 keeps prep under this."
      />
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <NumberField
          label="Meals per day"
          unit="/ day"
          value={intake.mealsPerDay}
          min={2}
          max={5}
          onChange={(mealsPerDay) => onPatch({ mealsPerDay })}
        />
        <SunArcMeals count={intake.mealsPerDay} />
      </div>
      <div>
        <FieldLabel>Allergies</FieldLabel>
        <ChipInput
          ariaLabel="Add allergy"
          values={intake.allergies}
          variant="burgundy-outline"
          placeholder="e.g. peanuts"
          onAdd={(v) => onPatch({ allergies: [...intake.allergies, v] })}
          onRemove={(v) => onPatch({ allergies: intake.allergies.filter((a) => a !== v) })}
        />
      </div>
      <div>
        <FieldLabel>Excluded foods</FieldLabel>
        <ChipInput
          ariaLabel="Add excluded food"
          values={intake.excludedFoods}
          variant="sage"
          placeholder="e.g. coriander"
          onAdd={(v) => onPatch({ excludedFoods: [...intake.excludedFoods, v] })}
          onRemove={(v) => onPatch({ excludedFoods: intake.excludedFoods.filter((a) => a !== v) })}
        />
      </div>
      <div className="flex items-center justify-between pt-1">
        <MagneticButton variant="ghost" size="md" icon={<ChevronLeft size={15} />} onClick={() => onStep(step - 1)}>
          Back
        </MagneticButton>
        <MagneticButton variant="primary" size="md" onClick={() => onStep(step + 1)}>
          Continue
        </MagneticButton>
      </div>
    </div>,

    /* ------------------------------------------------------------ STEP 3 */
    <div key="s3" className="space-y-6">
      <div>
        <FieldLabel>Favourite foods</FieldLabel>
        <ChipInput
          ariaLabel="Add favourite food"
          values={favourites}
          variant="gold"
          placeholder="e.g. rye bread"
          onAdd={(v) => onPatch({ favouriteFoods: [...favourites, v] })}
          onRemove={(v) => onPatch({ favouriteFoods: favourites.filter((a) => a !== v) })}
        />
        {suggestions.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="t-label text-ink-faint">Add:</span>
            <AnimatePresence initial={false}>
              {suggestions.map((s) => (
                <motion.button
                  key={s}
                  type="button"
                  layout
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={EASE_SPRING}
                  onClick={() => onPatch({ favouriteFoods: [...favourites, s] })}
                  className="t-ui-sm rounded-r-pill border border-dashed border-champagne/70 px-3 py-1 text-gold-deep transition-colors hover:bg-sunrise/60"
                >
                  + {s}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div>
        <FieldLabel>Country</FieldLabel>
        <div className="relative">
          <select
            value={intake.country}
            aria-label="Country"
            onChange={(e) => onPatch({ country: e.target.value })}
            className="glass t-ui-md h-11 w-full appearance-none rounded-r-md px-4 text-ink shadow-e-1 outline-none focus:shadow-e-2"
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronLeft size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 -rotate-90 text-ink-faint" />
        </div>
      </div>

      <Shake tick={shake.stores ?? 0}>
        <div>
          <FieldLabel>Available stores</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {STORES.map((s) => {
              const Icon = s.icon
              const selected = intake.stores.includes(s.id)
              return (
                <motion.button
                  key={s.id}
                  type="button"
                  onClick={() => toggleStore(s.id)}
                  aria-pressed={selected}
                  animate={{ scale: selected ? 1.02 : 1 }}
                  transition={EASE_SPRING}
                  className={cn(
                    'flex items-center gap-2.5 rounded-r-md border p-3 text-left transition-colors duration-180',
                    selected ? 'border-champagne bg-sage/60 ring-1 ring-champagne' : 'glass hover:border-sand',
                  )}
                >
                  <Icon size={16} strokeWidth={1.5} className={selected ? 'text-gold-deep' : 'text-ink-soft'} />
                  <span className="t-ui-sm flex-1 text-ink">{s.label}</span>
                  {selected && <Check size={14} strokeWidth={2.5} className="text-gold-deep" />}
                </motion.button>
              )
            })}
          </div>
        </div>
      </Shake>

      <div className="flex items-center justify-between pt-1">
        <MagneticButton variant="ghost" size="md" icon={<ChevronLeft size={15} />} onClick={() => onStep(step - 1)}>
          Back
        </MagneticButton>
        <MagneticButton
          variant="gold"
          size="lg"
          disabled={generating}
          icon={<Sparkles size={16} strokeWidth={1.8} />}
          onClick={() => {
            if (!storesValid) {
              shakeField('stores')
              return
            }
            onGenerate()
          }}
        >
          Generate my week
        </MagneticButton>
      </div>
    </div>,
  ]

  return (
    <GlassCard size="xl" flat className="p-6 min-[640px]:p-8">
      <Spine step={step} />
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ x: 24 * direction, opacity: 0 }}
            animate={{ x: 0, opacity: 1, transition: { duration: 0.42, ease: EASE_GLIDE } }}
            exit={{ x: -24 * direction, opacity: 0, transition: { duration: 0.26, ease: EASE_SOFT } }}
          >
            {fields[step]}
          </motion.div>
        </AnimatePresence>
      </div>
    </GlassCard>
  )
}
