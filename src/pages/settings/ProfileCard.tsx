/**
 * Zone A — Profile (settings.md): edit-in-place profile card. Avatar with
 * gold ring + Change photo (file picker, crossfade + ring flash). Field grid:
 * age, sex, height, weight, goal (popover), country. Edits toast
 * "Profile updated — targets recalculated" with a shimmer over the goal row;
 * weight edits show the energy-target caption. Units convert with tweens.
 */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GOAL_PROFILES, GOAL_IDS } from '@/lib/scoring'
import type { GoalId } from '@/lib/scoring'
import { GlassCard, useToast } from '@/components/life7'
import { CountUp } from '@/pages/progress/shared'
import { EASE_GLIDE, SectionHeader } from '@/pages/planner/ui'

export interface ProfileState {
  age: number
  sex: string
  heightCm: number
  weightKg: number
  goalId: GoalId
  country: string
}

const SEXES = ['Male', 'Female', 'Other'] as const
const COUNTRIES = ['Finland', 'Sweden', 'Germany', 'Netherlands', 'France'] as const

export const kgToLb = (kg: number) => kg * 2.20462
export const cmToFtIn = (cm: number) => {
  const inches = cm / 2.54
  const ft = Math.floor(inches / 12)
  return `${ft}'${Math.round(inches - ft * 12)}"`
}

/* ------------------------------------------------------------------ fields */

function EditableNumber({
  label,
  value,
  onCommit,
  suffix,
  decimals = 0,
  min,
  max,
}: {
  label: string
  value: number
  onCommit: (v: number) => void
  suffix?: string
  decimals?: number
  min: number
  max: number
}) {
  const [text, setText] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  return (
    <label className="group relative block cursor-text rounded-r-sm bg-cream/50 px-3 py-2.5">
      <span className="t-label block text-[9px] text-ink-faint">{label}</span>
      <span className="mt-0.5 flex items-baseline gap-1">
        {focused || text !== null ? (
          <input
            autoFocus={focused}
            value={text ?? String(value)}
            onChange={(e) => setText(e.target.value.replace(/[^0-9.]/g, ''))}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false)
              const parsed = Number(text)
              setText(null)
              if (Number.isFinite(parsed) && text !== null && text !== '') {
                onCommit(Math.min(max, Math.max(min, parsed)))
              }
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="t-ui-sm w-full bg-transparent font-bold text-ink outline-none tnum"
            aria-label={label}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setText(String(value))
              setFocused(true)
            }}
            className="t-ui-sm font-bold text-ink tnum"
          >
            {value.toFixed(decimals)}
          </button>
        )}
        {suffix && <span className="t-ui-sm text-ink-faint">{suffix}</span>}
      </span>
      {/* gold underline focus animation */}
      <motion.span
        className="absolute inset-x-3 bottom-1.5 h-[1.5px] origin-left bg-gold-deep"
        animate={{ scaleX: focused ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      <span className="absolute inset-x-3 bottom-1.5 h-px bg-sand" />
    </label>
  )
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
  right,
}: {
  label: string
  value: string
  options: readonly string[]
  onChange: (v: string) => void
  right?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group relative block w-full rounded-r-sm bg-cream/50 px-3 py-2.5 text-left"
      >
        <span className="t-label block text-[9px] text-ink-faint">{label}</span>
        <span className="mt-0.5 flex items-center justify-between gap-1">
          <span className="t-ui-sm flex items-center gap-1.5 font-bold text-ink">
            {value}
            {right}
          </span>
          <ChevronDown size={13} strokeWidth={1.5} className={cn('text-ink-faint transition-transform duration-200', open && 'rotate-180')} />
        </span>
        <motion.span
          className="absolute inset-x-3 bottom-1.5 h-[1.5px] origin-left bg-gold-deep"
          animate={{ scaleX: open ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
        <span className="absolute inset-x-3 bottom-1.5 h-px bg-sand" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.div
              className="glass-strong absolute inset-x-0 top-[calc(100%+6px)] z-40 max-h-56 overflow-y-auto rounded-r-md p-1.5 shadow-e-2"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: EASE_GLIDE }}
            >
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt)
                    setOpen(false)
                  }}
                  className={cn(
                    't-ui-sm flex w-full items-center justify-between rounded-r-sm px-2.5 py-2 text-left transition-colors',
                    opt === value ? 'bg-sunrise font-bold text-ink' : 'text-ink-soft hover:bg-cream hover:text-ink',
                  )}
                >
                  {opt}
                  {opt === value && <Check size={12} strokeWidth={2} className="text-gold-deep" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/* -------------------------------------------------------------------- card */

/**
 * One soft champagne shimmer that sweeps the goal row once per trigger bump,
 * then unmounts — low opacity, diagonal, guaranteed gone (the previous
 * `animate-wave-sweep` beam parked across the field after its first pass).
 * Scoped CSS animation ending `forwards` off-field + `animationend` unmount
 * (timeout-backed), so it plays even under heavy rAF throttling.
 */
function GoalSheen({ trigger }: { trigger: number }) {
  const [done, setDone] = useState(0)
  useEffect(() => {
    if (trigger === 0 || trigger === done) return
    const t = window.setTimeout(() => setDone(trigger), 1250)
    return () => window.clearTimeout(t)
  }, [trigger, done])
  if (trigger === 0 || trigger === done) return null
  return (
    <>
      <style>{`@keyframes goal-sheen-sweep { from { transform: translateX(-180%); } to { transform: translateX(580%); } }
.goal-sheen { animation: goal-sheen-sweep 1.1s cubic-bezier(0.45, 0, 0.25, 1) 1 forwards; }`}</style>
      <span
        key={trigger}
        className="goal-sheen pointer-events-none absolute -inset-y-3 left-0 z-10 w-[26%]"
        onAnimationEnd={() => setDone(trigger)}
        aria-hidden="true"
      >
        <span
          className="block h-full w-full -skew-x-12 rounded-r-sm"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(176,138,62,0.08) 28%, rgba(176,138,62,0.2) 50%, rgba(176,138,62,0.08) 72%, transparent)',
          }}
        />
      </span>
    </>
  )
}

export default function ProfileCard({
  profile,
  onChange,
  units,
  boostActive,
}: {
  profile: ProfileState
  onChange: (p: ProfileState) => void
  units: 'metric' | 'imperial'
  boostActive: boolean
}) {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar] = useState('/avatar-alex.png')
  const [ringFlash, setRingFlash] = useState(0)
  const [goalShimmer, setGoalShimmer] = useState(0)
  const [weightCaption, setWeightCaption] = useState(false)

  const commit = (patch: Partial<ProfileState>, weightChanged = false) => {
    onChange({ ...profile, ...patch })
    toast('Profile updated — targets recalculated', { tone: 'gold' })
    setGoalShimmer((n) => n + 1)
    if (weightChanged) {
      setWeightCaption(true)
      window.setTimeout(() => setWeightCaption(false), 5000)
    }
  }

  const goalLabel = GOAL_PROFILES[profile.goalId].label
  const imperial = units === 'imperial'

  return (
    <GlassCard flat className="relative overflow-hidden p-6">
      <SectionHeader>Profile</SectionHeader>

      {/* identity row */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <motion.img
            key={avatar}
            src={avatar}
            alt="Alex"
            className="h-16 w-16 rounded-full border-[1.5px] border-champagne object-cover"
            initial={{ opacity: 0.4, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          />
          {ringFlash > 0 && (
            <motion.span
              key={ringFlash}
              className="pointer-events-none absolute -inset-1.5 rounded-full border-2 border-champagne"
              initial={{ opacity: 0.9, scale: 0.9 }}
              animate={{ opacity: 0, scale: 1.25 }}
              transition={{ duration: 0.8 }}
            />
          )}
        </div>
        <div>
          <h2 className="t-display-sm text-ink">Alex</h2>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="t-ui-sm mt-0.5 inline-flex items-center gap-1.5 font-semibold text-forest underline-offset-4 decoration-champagne decoration-[1.5px] hover:underline"
          >
            <Camera size={13} strokeWidth={1.5} /> Change photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const url = URL.createObjectURL(file)
              setAvatar(url)
              setRingFlash((n) => n + 1)
              toast('Photo updated — looking well, Alex.', { tone: 'sage' })
            }}
          />
        </div>
      </div>

      {/* field grid */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <EditableNumber label="Age" value={profile.age} min={16} max={99} onCommit={(v) => commit({ age: v })} />
        <FieldSelect label="Sex" value={profile.sex} options={SEXES} onChange={(v) => commit({ sex: v })} />
        {imperial ? (
          <div className="relative rounded-r-sm bg-cream/50 px-3 py-2.5">
            <span className="t-label block text-[9px] text-ink-faint">Height</span>
            <span className="t-ui-sm mt-0.5 block font-bold text-ink tnum">{cmToFtIn(profile.heightCm)}</span>
            <span className="absolute inset-x-3 bottom-1.5 h-px bg-sand" />
          </div>
        ) : (
          <EditableNumber label="Height" value={profile.heightCm} suffix="cm" min={120} max={230} onCommit={(v) => commit({ heightCm: v })} />
        )}
        {imperial ? (
          <EditableNumber
            label="Weight"
            value={Math.round(kgToLb(profile.weightKg))}
            suffix="lb"
            min={90}
            max={500}
            onCommit={(v) => commit({ weightKg: Math.round(v / 2.20462) }, true)}
          />
        ) : (
          <EditableNumber label="Weight" value={profile.weightKg} suffix="kg" min={40} max={220} onCommit={(v) => commit({ weightKg: v }, true)} />
        )}
        <div className="relative col-span-2 rounded-r-sm">
          {/* one soft champagne shimmer over the goal row after any edit —
              sweeps once, then unmounts (the old `animate-wave-sweep` beam
              snapped back to translateX(0) at the end and parked over the
              field forever: `animation-fill-mode` is `none`) */}
          <GoalSheen trigger={goalShimmer} />
          <FieldSelect
            label="Goal"
            value={goalLabel}
            options={GOAL_IDS.map((id) => GOAL_PROFILES[id].label)}
            onChange={(label) => {
              const id = GOAL_IDS.find((g) => GOAL_PROFILES[g].label === label)
              if (id) commit({ goalId: id })
            }}
            right={
              boostActive ? (
                <motion.span
                  className="t-label rounded-r-pill bg-sunrise-gold px-2 py-0.5 text-[8px] text-ink shadow-e-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 16 }}
                >
                  Boost
                </motion.span>
              ) : undefined
            }
          />
          <AnimatePresence>
            {weightCaption && (
              <motion.p
                className="t-ui-sm mt-2 font-medium text-gold-deep"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                Energy target moved 2 240 → 2 210 kcal.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div className="col-span-2">
          <FieldSelect label="Country" value={profile.country} options={COUNTRIES} onChange={(v) => commit({ country: v })} />
        </div>
      </div>

      {/* unit conversion note (imperial converts demo values with count-tweens) */}
      <p className="t-ui-sm mt-3 font-medium text-ink-faint">
        {imperial ? (
          <>
            Showing imperial —{' '}
            <CountUp value={Math.round(kgToLb(profile.weightKg))} className="font-bold text-ink" /> lb ·{' '}
            {cmToFtIn(profile.heightCm)}
          </>
        ) : (
          <>
            36 · 182 cm ·{' '}
            <CountUp value={profile.weightKg} className="font-bold text-ink" /> kg · Healthy &amp; Strong
          </>
        )}
      </p>
    </GlassCard>
  )
}
