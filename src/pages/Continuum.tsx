import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  CalendarClock,
  Check,
  Leaf,
  MoonStar,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Utensils,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/life7'

const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]

type ShiftId = 'sleep' | 'schedule' | 'budget' | 'expiry'
type Phase = 'idle' | 'composing' | 'ready' | 'applied'

interface ShiftChange {
  system: 'Today' | 'Week' | 'Shopping' | 'Pantry'
  title: string
  detail: string
  impact: string
}

interface ShiftScenario {
  id: ShiftId
  icon: LucideIcon
  eyebrow: string
  title: string
  signal: string
  before: number
  after: number
  protected: string
  changes: readonly ShiftChange[]
}

const SCENARIOS: readonly ShiftScenario[] = [
  {
    id: 'sleep',
    icon: MoonStar,
    eyebrow: 'Recovery signal',
    title: 'I slept only 5 hours',
    signal: 'Sleep −2 h 45 min · recovery confidence 46%',
    before: 71,
    after: 79,
    protected: 'Friday training fuel and the €70 weekly ceiling',
    changes: [
      { system: 'Today', title: 'Breakfast steadied', detail: 'Oats stay; walnuts and yoghurt move forward for slower energy release.', impact: '+8 recovery' },
      { system: 'Week', title: 'Training load softened', detail: 'Today becomes mobility. Strength moves to Friday without losing weekly volume.', impact: 'volume kept' },
      { system: 'Shopping', title: 'No extra purchase', detail: 'The adjustment uses yoghurt and walnuts already on the list.', impact: '€0 added' },
      { system: 'Pantry', title: 'Spinach still protected', detail: 'Dinner keeps the expiring spinach while reducing preparation effort.', impact: 'waste held' },
    ],
  },
  {
    id: 'schedule',
    icon: CalendarClock,
    eyebrow: 'Calendar signal',
    title: 'Dinner moved to 21:00',
    signal: 'Meal window shifted +90 min · sleep target remains 23:00',
    before: 74,
    after: 82,
    protected: 'The 23:00 sleep window and tonight’s family dinner',
    changes: [
      { system: 'Today', title: 'Snack becomes a bridge', detail: 'Yoghurt moves to 17:45 so dinner can stay lighter and later.', impact: 'energy stable' },
      { system: 'Week', title: 'Tomorrow starts gently', detail: 'Friday breakfast shifts 30 minutes later; training fuel remains intact.', impact: 'sleep kept' },
      { system: 'Shopping', title: 'List stays unchanged', detail: 'Every adjustment comes from food already planned this week.', impact: '0 new items' },
      { system: 'Pantry', title: 'Spinach joins lunch', detail: 'The expiring portion moves earlier instead of being lost at late dinner.', impact: '300 g saved' },
    ],
  },
  {
    id: 'budget',
    icon: WalletCards,
    eyebrow: 'Budget signal',
    title: 'This week is €15 tighter',
    signal: 'Weekly ceiling €70 → €55 · nutrition floor stays fixed',
    before: 68,
    after: 81,
    protected: 'Protein adequacy and four complete dinners',
    changes: [
      { system: 'Today', title: 'No compromise today', detail: 'Meals already prepared remain exactly as agreed.', impact: 'day untouched' },
      { system: 'Week', title: 'Two dinners recomposed', detail: 'Salmon becomes herb chicken and lentils; protein structure stays equivalent.', impact: '−€8.40' },
      { system: 'Shopping', title: 'Market route rewritten', detail: 'Three swaps and one pantry deduction bring the run below the new ceiling.', impact: '€54.70' },
      { system: 'Pantry', title: 'Staples do more work', detail: 'Rice, eggs and olive oil absorb cost without flattening variety.', impact: '3 items used' },
    ],
  },
  {
    id: 'expiry',
    icon: Leaf,
    eyebrow: 'Pantry signal',
    title: 'Spinach expires tomorrow',
    signal: 'Freshness 18% · 300 g at risk · planned use too late',
    before: 63,
    after: 86,
    protected: 'Tonight’s cooking time and Thursday’s protein target',
    changes: [
      { system: 'Today', title: 'Dinner resolves the risk', detail: 'Spinach moves into the omelette with no extra preparation step.', impact: '+300 g used' },
      { system: 'Week', title: 'Saturday gains variety', detail: 'The displaced greens slot becomes broccoli instead of repeating spinach.', impact: '+1 plant' },
      { system: 'Shopping', title: 'One line disappears', detail: 'A replacement spinach bag is removed from the market list.', impact: '−€1.80' },
      { system: 'Pantry', title: 'Waste score recovers', detail: 'The expiry queue clears and the month’s saved-food total increases.', impact: '86 waste score' },
    ],
  },
]

const SYSTEM_ICONS: Record<ShiftChange['system'], LucideIcon> = {
  Today: Activity,
  Week: CalendarClock,
  Shopping: ShoppingBasket,
  Pantry: PackageCheck,
}

const PROTECTIONS = ['Protein floor', 'Budget ceiling', 'Sleep window', 'Family dinner'] as const

function ContinuumCore({ phase }: { phase: Phase }) {
  const active = phase === 'composing' || phase === 'ready' || phase === 'applied'
  return (
    <div className="relative mx-auto flex h-[190px] w-[190px] items-center justify-center" aria-hidden="true">
      {[170, 132, 96].map((size, index) => (
        <motion.span
          key={size}
          className="absolute rounded-full border border-champagne/35"
          style={{ width: size, height: size }}
          animate={active ? { rotate: index % 2 ? -360 : 360, scale: [1, 1.035, 1] } : { rotate: 0 }}
          transition={{ rotate: { duration: 16 + index * 5, repeat: Infinity, ease: 'linear' }, scale: { duration: 3, repeat: Infinity } }}
        >
          <span className="absolute left-1/2 top-[-4px] h-2 w-2 -translate-x-1/2 rounded-full bg-champagne" />
        </motion.span>
      ))}
      <motion.span
        className={cn(
          'relative flex h-20 w-20 items-center justify-center rounded-full border shadow-e-2',
          phase === 'applied' ? 'border-sage bg-forest text-soft-white' : 'border-champagne bg-sunrise text-forest',
        )}
        animate={phase === 'composing' ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={{ duration: 1.1, repeat: phase === 'composing' ? Infinity : 0 }}
      >
        {phase === 'applied' ? <Check size={28} /> : <Sparkles size={28} />}
      </motion.span>
    </div>
  )
}

export default function Continuum() {
  const [selectedId, setSelectedId] = useState<ShiftId>('sleep')
  const [phase, setPhase] = useState<Phase>('idle')
  const [protections, setProtections] = useState<ReadonlySet<string>>(new Set(PROTECTIONS))
  const timerRef = useRef<number | null>(null)
  const { toast } = useToast()
  const scenario = useMemo(() => SCENARIOS.find((item) => item.id === selectedId) ?? SCENARIOS[0], [selectedId])

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
  }, [])

  const choose = (id: ShiftId) => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    setSelectedId(id)
    setPhase('idle')
  }

  const compose = () => {
    setPhase('composing')
    timerRef.current = window.setTimeout(() => setPhase('ready'), 1350)
  }

  const apply = () => {
    setPhase('applied')
    toast('Continuum Shift applied — four systems moved as one.', { tone: 'gold' })
  }

  const reset = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    setPhase('idle')
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <header className="mb-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="t-label text-gold-deep">LIFE7 flagship intelligence</span>
          <span className="t-label rounded-r-pill border border-champagne/30 bg-sunrise/55 px-2.5 py-1 text-[8px] text-gold-deep">Interactive prototype</span>
        </div>
        <h1 className="t-display-lg mt-2 text-ink">Continuum Shift</h1>
        <p className="t-serif-quote mt-2 max-w-[720px] text-ink-soft">One real-life change. Seven days recompose — without breaking what matters.</p>
      </header>

      <div className="grid gap-6 min-[1100px]:grid-cols-[300px_minmax(0,1fr)]">
        <section aria-label="Choose a life change">
          <span className="t-label text-ink-faint">01 · What changed?</span>
          <div className="mt-3 grid gap-2 min-[640px]:grid-cols-2 min-[1100px]:grid-cols-1">
            {SCENARIOS.map((item) => {
              const Icon = item.icon
              const selected = item.id === selectedId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => choose(item.id)}
                  aria-pressed={selected}
                  className={cn(
                    'group flex min-h-[82px] items-center gap-3 rounded-r-lg border p-3.5 text-left transition-all',
                    selected
                      ? 'border-champagne bg-soft-white shadow-gold-glow'
                      : 'border-line bg-soft-white/65 shadow-e-1 hover:border-champagne/45 hover:bg-soft-white',
                  )}
                >
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', selected ? 'bg-sunrise text-gold-deep' : 'bg-sage-mist/70 text-forest')}>
                    <Icon size={18} strokeWidth={1.6} />
                  </span>
                  <span className="min-w-0">
                    <span className="t-label block text-[8px] text-gold-deep">{item.eyebrow}</span>
                    <span className="t-ui-sm mt-1 block font-bold leading-snug text-ink">{item.title}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-5 rounded-r-lg border border-line bg-soft-white/75 p-4 shadow-e-1">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-green" />
              <span className="t-label text-ink-soft">Protected constants</span>
            </div>
            <p className="t-ui-sm mt-2 text-ink-faint">Continuum may move the plan, never these promises.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {PROTECTIONS.map((item) => {
                const active = protections.has(item)
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setProtections((current) => {
                      const next = new Set(current)
                      if (next.has(item)) next.delete(item)
                      else next.add(item)
                      return next
                    })}
                    className={cn('t-ui-sm rounded-r-pill border px-2.5 py-1.5 font-semibold transition-colors', active ? 'border-sage bg-sage-mist text-forest' : 'border-line bg-white/45 text-ink-faint')}
                  >
                    {active && <Check size={11} className="mr-1 inline" />} {item}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <section className="forest-glass relative overflow-hidden rounded-r-xl p-5 shadow-e-3 min-[720px]:p-7" aria-label="Continuum composition">
          <span className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-champagne/10 blur-3xl" />
          <div className="relative grid items-center gap-6 min-[760px]:grid-cols-[220px_minmax(0,1fr)]">
            <div className="text-center">
              <ContinuumCore phase={phase} />
              <p className="t-label text-champagne">Sense · interpret · protect · compose</p>
            </div>

            <div>
              <span className="t-label text-champagne">Signal captured</span>
              <h2 className="t-display-sm mt-1 text-soft-white">{scenario.title}</h2>
              <p className="t-ui-sm mt-2 font-medium leading-relaxed text-soft-white/65">{scenario.signal}</p>

              <div className="mt-5 rounded-r-lg border border-white/10 bg-white/[0.06] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="t-label text-soft-white/55">Continuum score</span>
                  <span className="flex items-baseline gap-2">
                    <span className="t-metric-sm tnum text-soft-white/45 line-through">{scenario.before}</span>
                    <ArrowRight size={14} className="text-champagne" />
                    <motion.span key={`${scenario.id}-${phase}`} className="t-metric-lg tnum text-champagne">{phase === 'idle' || phase === 'composing' ? '—' : scenario.after}</motion.span>
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-r-pill bg-white/10">
                  <motion.div
                    className="h-full rounded-r-pill bg-gradient-to-r from-sage to-champagne"
                    initial={false}
                    animate={{ width: phase === 'idle' ? `${scenario.before}%` : phase === 'composing' ? '74%' : `${scenario.after}%` }}
                    transition={{ duration: 0.9, ease: EASE_GLIDE }}
                  />
                </div>
                <p className="t-ui-sm mt-3 text-soft-white/55"><ShieldCheck size={13} className="mr-1 inline text-champagne" /> Protecting {scenario.protected}.</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {phase === 'idle' && (
                  <button type="button" onClick={compose} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-r-pill bg-champagne px-5 t-ui-sm font-bold text-forest transition-colors hover:bg-gold-light">
                    Compose the shift <Sparkles size={16} />
                  </button>
                )}
                {phase === 'composing' && (
                  <div className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-r-pill border border-champagne/30 bg-champagne/10 px-5 t-ui-sm font-bold text-champagne">
                    <Sparkles size={16} className="animate-spin-slow" /> Rebalancing four systems…
                  </div>
                )}
                {phase === 'ready' && (
                  <button type="button" onClick={apply} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-r-pill bg-champagne px-5 t-ui-sm font-bold text-forest transition-colors hover:bg-gold-light">
                    Apply 4 coordinated changes <ArrowRight size={16} />
                  </button>
                )}
                {phase === 'applied' && (
                  <div className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-r-pill bg-sage-mist px-5 t-ui-sm font-bold text-forest"><Check size={16} /> Shift applied</div>
                )}
                {phase !== 'idle' && phase !== 'composing' && (
                  <button type="button" onClick={reset} aria-label="Reset shift" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-soft-white/65 hover:text-white"><RotateCcw size={16} /></button>
                )}
              </div>
              <p className="t-label mt-3 text-center text-soft-white/40">Reversible preview · no protected constant is changed</p>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-6" aria-label="Change ledger">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="t-label text-gold-deep">02 · Change ledger</span>
            <h2 className="t-display-sm mt-1 text-ink">One signal, four coordinated decisions.</h2>
          </div>
          <span className={cn('t-label rounded-r-pill px-3 py-1.5', phase === 'ready' || phase === 'applied' ? 'bg-sage-mist text-forest' : 'bg-cream text-ink-faint')}>
            {phase === 'ready' || phase === 'applied' ? 'Verified by LIFE7 rules' : 'Compose to reveal'}
          </span>
        </div>

        <div className="grid gap-3 min-[680px]:grid-cols-2 min-[1100px]:grid-cols-4">
          {scenario.changes.map((change, index) => {
            const Icon = SYSTEM_ICONS[change.system]
            const revealed = phase === 'ready' || phase === 'applied'
            return (
              <motion.article
                key={`${scenario.id}-${change.system}`}
                className={cn('relative overflow-hidden rounded-r-lg border p-4 shadow-e-1 transition-colors', revealed ? 'border-champagne/35 bg-soft-white' : 'border-line bg-soft-white/55')}
                animate={{ opacity: phase === 'composing' ? 0.6 : 1, y: revealed ? 0 : 4 }}
                transition={{ delay: revealed ? index * 0.08 : 0, duration: 0.35 }}
              >
                {phase === 'composing' && <motion.span className="absolute inset-y-0 w-[35%] bg-light-wave" animate={{ x: ['-140%', '420%'] }} transition={{ duration: 1.1, repeat: Infinity, delay: index * 0.12 }} />}
                <div className="relative flex items-center justify-between gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-mist text-forest"><Icon size={16} /></span>
                  <span className="t-label text-gold-deep">{change.system}</span>
                </div>
                <h3 className="t-ui-md relative mt-3 font-bold text-ink">{revealed ? change.title : 'Waiting for composition'}</h3>
                <p className="t-ui-sm relative mt-1.5 min-h-[58px] leading-relaxed text-ink-soft">{revealed ? change.detail : 'Continuum is checking this system against your protected constants.'}</p>
                <span className={cn('t-label relative mt-3 inline-flex rounded-r-pill px-2.5 py-1', revealed ? 'bg-sunrise text-gold-deep' : 'bg-cream text-ink-faint')}>{revealed ? change.impact : 'pending'}</span>
              </motion.article>
            )
          })}
        </div>
      </section>

      <div className="mt-5 flex items-start gap-3 rounded-r-lg border border-sage bg-sage-mist/65 p-4">
        <Utensils size={18} className="mt-0.5 shrink-0 text-green" />
        <p className="t-ui-sm font-medium leading-relaxed text-forest">LIFE7 does not generate a new life from scratch. It preserves your commitments, then changes the smallest connected set of decisions needed to restore the week.</p>
      </div>
    </div>
  )
}
