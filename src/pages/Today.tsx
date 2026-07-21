import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'
import {
  Sun,
  Sprout,
  Droplets,
  Moon,
  ShoppingBasket,
  Leaf,
  Check,
  Plus,
  X,
  ChefHat,
  Clock3,
  Sparkles,
  Watch,
  Flag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Life7Mark,
  ScoreRing,
  MetricBar,
  GlassCard,
  MagneticButton,
  Chip,
  useToast,
} from '@/components/life7'
import type { Life7MarkState } from '@/components/life7'

const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]

const INSIGHT =
  'You are at 72% of your energy target but only 48% of your protein target. Your next meal should prioritise lean protein and vegetables.'

const WEEK = [
  { day: 'Mon', score: 82, state: 'done', meal: 'Oats & banana' },
  { day: 'Tue', score: 78, state: 'done', meal: 'Herb chicken bowl' },
  { day: 'Wed', score: 74, state: 'done', meal: 'Salmon & greens · Social' },
  { day: 'Thu', score: 71, state: 'today', meal: 'Herb chicken & rice bowl' },
  { day: 'Fri', score: 86, state: 'future', meal: 'Salmon & greens · Training' },
  { day: 'Sat', score: 80, state: 'future', meal: 'Spinach omelette · Rest' },
  { day: 'Sun', score: 84, state: 'future', meal: 'Yoghurt & walnuts · Prep day' },
] as const

const COOKING_STEPS = [
  { label: 'Rinse & cook the rice', mins: 10 },
  { label: 'Sear the herb chicken', mins: 6 },
  { label: 'Steam broccoli, wilt the spinach', mins: 4 },
  { label: 'Assemble, season, serve', mins: 2 },
]

/* ---------------------------------- bits ---------------------------------- */

/** Kinetic title: words rise inside overflow masks, stagger 55ms (design.md §5.11) */
function KineticWords({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split(' ').map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.64, delay: 0.05 + i * 0.055, ease: EASE_GLIDE }}
          >
            {w}
            {i < text.split(' ').length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

interface StatChipDef {
  id: 'energy' | 'protein' | 'hydration' | 'recovery'
  name: string
  icon: typeof Sun
  attention?: boolean
}

function StatChip({
  def,
  display,
  pct,
  delay,
  active,
  onToggle,
  popoverSide = 'down',
  popoverAlign = 'center',
  className,
  children,
}: {
  def: StatChipDef
  display: string
  pct: number
  delay: number
  active: boolean
  onToggle: () => void
  /** which way the detail popover opens (keeps it clear of captions / card edges) */
  popoverSide?: 'up' | 'down'
  popoverAlign?: 'start' | 'center' | 'end'
  className?: string
  children?: React.ReactNode
}) {
  const Icon = def.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 170, damping: 22, delay }}
      className={cn('relative', active ? 'z-40' : 'z-20', className)}
    >
      <motion.button
        type="button"
        onClick={onToggle}
        whileTap={{ scale: 0.985 }}
        transition={{ duration: 0.2, ease: EASE_GLIDE }}
        className={cn(
          'w-full rounded-r-md border border-line bg-soft-white/45 p-3.5 text-left transition-colors duration-220 hover:bg-soft-white/75',
          def.attention && 'border-gold-deep/30 bg-gradient-to-br from-sunrise/65 via-soft-white/75 to-soft-white/55 shadow-[0_8px_22px_-14px_rgba(176,138,62,0.7)] hover:border-gold-deep/45',
          active && 'border-champagne/60 bg-soft-white/80',
        )}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage-mist/70',
                def.attention && 'bg-sunrise/70',
              )}
            >
              {def.attention && (
                <>
                  <span className="animate-halo-ping absolute inset-0 rounded-full border border-burgundy/40" aria-hidden="true" />
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-burgundy ring-2 ring-soft-white" aria-hidden="true" />
                </>
              )}
              <Icon size={14} strokeWidth={1.6} className={def.attention ? 'text-gold-deep' : 'text-forest'} />
            </span>
            <span className={cn('t-label truncate text-[9px] text-ink-faint', def.attention && 'text-gold-deep')}>{def.name}</span>
          </span>
          <span
            className={cn(
              'tnum whitespace-nowrap text-[20px] font-semibold leading-none tracking-[-0.025em]',
              def.attention ? 'text-gold-deep' : 'text-ink',
            )}
          >
            {display}
          </span>
        </span>
        <MetricBar label="" value="" pct={pct} compact height={3} animated={false} className="mt-3" />
      </motion.button>
      {/* popover */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: popoverSide === 'down' ? -6 : 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: popoverSide === 'down' ? -6 : 6 }}
            transition={{ duration: 0.24, ease: EASE_GLIDE }}
            style={{ x: popoverAlign === 'center' ? '-50%' : 0 }}
            className={cn(
              'glass-strong absolute z-40 w-56 rounded-r-md p-4 shadow-e-2',
              popoverSide === 'down' ? 'top-full mt-2' : 'bottom-full mb-2',
              popoverAlign === 'center' ? 'left-1/2' : popoverAlign === 'start' ? 'left-0' : 'right-0',
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/** A compact, literal mobility scene: stretch, time and daylight in one glance. */
function MobilityScene() {
  return (
    <div className="relative h-[112px] w-[126px] shrink-0 overflow-hidden rounded-r-lg border border-champagne/25 bg-gradient-to-br from-sunrise/55 via-ivory to-sage-mist/65" aria-label="Mobility stretch illustration">
      <motion.span
        className="absolute right-3 top-3 h-6 w-6 rounded-full bg-sunlight/75 shadow-[0_0_22px_rgba(242,193,78,0.45)]"
        animate={{ opacity: [0.7, 1, 0.7], scale: [0.96, 1.04, 0.96] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <svg viewBox="0 0 126 112" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
        <path d="M12 91C38 84 88 86 116 92" stroke="#C9D6C0" strokeWidth="2" strokeLinecap="round" />
        <path d="M78 36C86 31 93 27 101 22" stroke="#D9B26A" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 5" />
        <circle cx="58" cy="37" r="7" fill="#2E4630" />
        <motion.g
          animate={{ rotate: [-1.5, 2, -1.5] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '58px 47px' }}
          stroke="#2E4630"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M57 48L62 68" />
          <path d="M60 55L79 45" />
          <path d="M59 55L43 66" />
          <path d="M62 68L78 84" />
          <path d="M62 68L48 87" />
        </motion.g>
        <path d="M35 56C39 48 44 43 50 40" stroke="#B08A3E" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M31 62C35 51 42 44 49 38" stroke="#B08A3E" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      </svg>
      <span className="t-label absolute bottom-2.5 left-3 flex items-center gap-1 text-[8px] text-forest/70">
        <Clock3 size={10} /> daylight window
      </span>
    </div>
  )
}

/** mini concentric-ring node for the week rhythm strip */
function WeekNode({
  day,
  score,
  state,
  meal,
  delay,
  onOpen,
}: {
  day: string
  score: number
  state: 'done' | 'today' | 'future'
  meal: string
  delay: number
  onOpen: () => void
}) {
  const r = 16
  const c = 2 * Math.PI * r
  const stroke = state === 'done' ? '#5C7A54' : state === 'today' ? '#D9B26A' : '#A79C8A'
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay }}
      className="group relative flex w-12 shrink-0 snap-center flex-col items-center gap-1.5"
    >
      {/* tooltip */}
      <span className="glass-strong pointer-events-none absolute -top-14 left-1/2 z-30 w-36 -translate-x-1/2 translate-y-1 rounded-r-sm p-2 text-center opacity-0 shadow-e-2 transition-all duration-160 group-hover:translate-y-0 group-hover:opacity-100">
        <span className="t-metric-sm tnum block text-ink">{score}</span>
        <span className="t-ui-sm block text-[11px] text-ink-soft">{meal}</span>
      </span>
      <span className="relative flex h-10 w-10 items-center justify-center">
        {state === 'today' && (
          <span className="animate-breathe absolute inset-[-5px] rounded-full border border-champagne/50" />
        )}
        <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
          <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(46,70,48,0.10)" strokeWidth="3" />
          <circle
            cx="20"
            cy="20"
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - score / 100)}
            strokeOpacity={state === 'future' ? 0.45 : 1}
          />
        </svg>
        <span
          className={cn(
            'tnum absolute text-[11px] font-bold',
            state === 'today' ? 'text-gold-deep' : state === 'done' ? 'text-green' : 'text-ink-faint',
          )}
        >
          {score}
        </span>
      </span>
      <span className={cn('t-label text-[9px]', state === 'today' ? 'text-gold-deep' : 'text-ink-faint')}>{day}</span>
    </motion.button>
  )
}

/** cooking mode overlay (Zone B primary action) */
function CookingOverlay({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [pct, setPct] = useState(0)
  const done = step >= COOKING_STEPS.length

  useEffect(() => {
    if (done) return
    // demo speed: one displayed "minute" cooks in ~1.2s
    const total = COOKING_STEPS[step].mins * 1200
    const iv = window.setInterval(() => {
      setPct((p) => {
        const next = p + 200 / total
        if (next >= 1) {
          window.clearInterval(iv)
          window.setTimeout(() => {
            setStep((s) => s + 1)
            setPct(0)
          }, 320)
          return 1
        }
        return next
      })
    }, 200)
    return () => window.clearInterval(iv)
  }, [step, done])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(43,38,32,0.25)] p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 32, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.42, ease: EASE_GLIDE }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong w-[min(560px,94vw)] rounded-r-xl p-8 shadow-e-3"
        role="dialog"
        aria-label="Cooking mode"
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <span className="t-label text-gold-deep">Cooking mode · 18 min total</span>
            <h3 className="t-display-md mt-1 text-ink">Herb Chicken & Rice Bowl</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cooking mode"
            className="glass flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:text-forest"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <ol className="flex flex-col gap-4">
          {COOKING_STEPS.map((s, i) => {
            const state = i < step ? 'done' : i === step && !done ? 'active' : 'next'
            return (
              <li key={s.label} className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[12px] font-bold tnum',
                    state === 'done' && 'border-green bg-green text-soft-white',
                    state === 'active' && 'border-champagne bg-sunrise text-ink',
                    state === 'next' && 'border-sand text-ink-faint',
                  )}
                >
                  {state === 'done' ? <Check size={14} strokeWidth={2.5} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={cn('t-ui-md', state === 'next' ? 'text-ink-faint' : 'text-ink')}>{s.label}</span>
                    <span className="t-metric-sm tnum text-ink-soft">{s.mins} min</span>
                  </div>
                  {state === 'active' && (
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-r-pill bg-cream">
                      <motion.div
                        className="h-full rounded-r-pill bg-champagne"
                        style={{ width: `${Math.round(pct * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>

        <div className="mt-8 flex items-center justify-between">
          <span className="t-ui-sm text-ink-faint">
            {done ? 'Plated. Enjoy your lunch.' : `Step ${Math.min(step + 1, COOKING_STEPS.length)} of ${COOKING_STEPS.length}`}
          </span>
          <div className="flex gap-2">
            {!done && (
              <MagneticButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep((s) => s + 1)
                  setPct(0)
                }}
              >
                Skip step
              </MagneticButton>
            )}
            <MagneticButton variant={done ? 'primary' : 'glass'} size="sm" onClick={onClose}>
              {done ? 'Finish' : 'Pause & close'}
            </MagneticButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* --------------------------------- screen --------------------------------- */

export default function Today() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [score, setScore] = useState(74)
  const [markState, setMarkState] = useState<Life7MarkState>('rest')
  const [coreState, setCoreState] = useState<Life7MarkState>('thinking')
  const [openChip, setOpenChip] = useState<string | null>(null)
  const [waterMl, setWaterMl] = useState(1400)
  const [mins, setMins] = useState(42)
  const [eaten, setEaten] = useState(false)
  const [typed, setTyped] = useState(0)
  const [diamondRot, setDiamondRot] = useState(0)
  const [cooking, setCooking] = useState(false)
  const [dinnerOpen, setDinnerOpen] = useState(false)
  const [activityTime, setActivityTime] = useState('18:00')
  const [reschedOpen, setReschedOpen] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const spx = useSpring(px, { stiffness: 120, damping: 20 })
  const spy = useSpring(py, { stiffness: 120, damping: 20 })

  // AI core: thinking for 2s on mount, then rest
  useEffect(() => {
    const t = window.setTimeout(() => setCoreState('rest'), 2000)
    return () => window.clearTimeout(t)
  }, [])

  // live lunch countdown (ticks each minute)
  useEffect(() => {
    const iv = window.setInterval(() => setMins((m) => Math.max(0, m - 1)), 60000)
    return () => window.clearInterval(iv)
  }, [])

  // insight typewriter (18ms/char, starts after card entrance)
  useEffect(() => {
    const start = window.setTimeout(() => {
      const iv = window.setInterval(() => {
        setTyped((t) => {
          if (t >= INSIGHT.length) {
            window.clearInterval(iv)
            return t
          }
          return t + 1
        })
      }, 18)
    }, 1000)
    return () => window.clearTimeout(start)
  }, [])

  // insight diamond rotates 180° every 20s
  useEffect(() => {
    const iv = window.setInterval(() => setDiamondRot((r) => r + 180), 20000)
    return () => window.clearInterval(iv)
  }, [])

  const hour = new Date().getHours()
  const daypart = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'

  const logWater = () => {
    setWaterMl((w) => Math.min(2400, w + 250))
    toast('Logged 250 ml')
  }

  const markEaten = () => {
    if (eaten) return
    setEaten(true)
    toast('Lunch logged, nice balance')
    window.setTimeout(() => {
      setScore(76)
      setMarkState('celebrate')
      window.setTimeout(() => setMarkState('rest'), 1500)
    }, 600)
  }

  const chipDefs: StatChipDef[] = [
    { id: 'energy', name: 'Energy', icon: Sun },
    { id: 'protein', name: 'Protein', icon: Sprout, attention: true },
    { id: 'hydration', name: 'Hydration', icon: Droplets },
    { id: 'recovery', name: 'Recovery', icon: Moon },
  ]
  const chipDisplay: Record<string, string> = {
    energy: '72%',
    protein: '48%',
    hydration: `${(waterMl / 1000).toFixed(1)} / 2.4 L`,
    recovery: '81',
  }
  const chipPct: Record<string, number> = {
    energy: 72,
    protein: 48,
    hydration: (waterMl / 2400) * 100,
    recovery: 81,
  }

  const renderChip = (
    def: StatChipDef,
    i: number,
    opts?: { side?: 'up' | 'down'; align?: 'start' | 'center' | 'end'; className?: string },
  ) => (
    <StatChip
      key={def.id}
      def={def}
      display={chipDisplay[def.id]}
      pct={chipPct[def.id]}
      delay={0.55 + i * 0.09}
      active={openChip === def.id}
      onToggle={() => setOpenChip((c) => (c === def.id ? null : def.id))}
      popoverSide={opts?.side}
      popoverAlign={opts?.align}
      className={opts?.className}
    >
      {def.id === 'hydration' && (
        <div>
          <span className="t-label text-ink-soft">Hydration · today</span>
          <div className="mt-2 flex items-end gap-1">
            {[0, 1, 2, 3, 4].map((g) => (
              <div key={g} className="w-6 overflow-hidden rounded-sm bg-cream" style={{ height: 34 + (g % 3) * 8 }}>
                <motion.div
                  className="w-full bg-gradient-to-t from-champagne/70 to-sunrise"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.min(100, (waterMl / 2400) * 100)}%` }}
                  transition={{ duration: 0.6, ease: EASE_GLIDE }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="t-ui-sm text-ink-soft tnum">{(waterMl / 1000).toFixed(2)} L of 2.4 L</span>
            <MagneticButton
              variant="gold"
              size="sm"
              icon={<Plus size={14} />}
              onClick={logWater}
              className="h-8 px-3"
            >
              Glass
            </MagneticButton>
          </div>
        </div>
      )}
      {def.id === 'energy' && (
        <div>
          <span className="t-label text-ink-soft">Energy · today</span>
          <p className="t-ui-sm mt-2 text-ink-soft">
            1,840 of 2,550 kcal target. Lunch adds 612 kcal, you land at <b className="text-ink">96%</b>.
          </p>
        </div>
      )}
      {def.id === 'protein' && (
        <div>
          <span className="t-label text-gold-deep">Protein · attention</span>
          <p className="t-ui-sm mt-2 text-ink-soft">
            62 of 130 g. The suggested adjustment adds <b className="text-ink">32 g</b> at dinner.
          </p>
        </div>
      )}
      {def.id === 'recovery' && (
        <div>
          <span className="t-label text-ink-soft">Recovery · last night</span>
          <p className="t-ui-sm mt-2 text-ink-soft">
            7 h 12 min asleep, deep 1 h 40 min. Sleep window tonight: <b className="text-ink">23:00</b>.
          </p>
        </div>
      )}
    </StatChip>
  )

  return (
    <div className="mx-auto max-w-[1280px]">
      {/* ------------------------------- Header ------------------------------- */}
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <motion.span
            className="t-label block text-gold-deep"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Today · Week 24 · Day 4 of 7
          </motion.span>
          <h1 className="t-display-lg mt-2 text-ink">
            <KineticWords text={`Good ${daypart}, Alex.`} />
          </h1>
          <motion.span
            className="t-ui-sm mt-1 block text-ink-faint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            Thursday, 12 June
          </motion.span>
          <motion.p
            className="t-serif-quote mt-2 text-ink-soft"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            Your system has already made 3 decisions for you today.
          </motion.p>
        </div>
        <motion.button
          type="button"
          onClick={() => navigate('/coach')}
          aria-label="Open AI Coach"
          className="glass group relative mt-1 flex h-11 shrink-0 items-center gap-2 rounded-r-pill border border-champagne/35 px-2.5 shadow-e-1 transition-all hover:border-champagne/70 hover:shadow-gold-glow min-[480px]:px-3"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.2 }}
        >
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-sunrise/65 text-gold-deep">
            {coreState === 'thinking' && <span className="animate-halo-ping absolute inset-0 rounded-full border border-champagne" aria-hidden="true" />}
            <Sparkles size={15} strokeWidth={1.8} />
          </span>
          <span className="t-label text-[8px] text-gold-deep min-[480px]:hidden">AI</span>
          <span className="hidden text-left min-[480px]:block">
            <span className="t-label block text-[8px] text-gold-deep">Ask LIFE7</span>
            <span className="t-ui-sm block font-bold leading-tight text-forest">AI Coach</span>
          </span>
        </motion.button>
      </header>

      {/* ---------------------------- A + B + C grid ---------------------------- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Zone A — LIFE7 score hero */}
        <motion.section
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.65, delay: 0.1, ease: EASE_GLIDE }}
          className="glass relative rounded-r-xl p-6 shadow-e-2 min-[1024px]:p-10 lg:col-span-7"
          aria-label="LIFE7 score"
        >
          {/* sage wave sweep on meal logged (clipped to the panel shape) */}
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-r-xl">
            <AnimatePresence>
              {eaten && (
                <motion.div
                  key="wave"
                  initial={{ x: '-120%' }}
                  animate={{ x: '320%' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.95, ease: EASE_GLIDE }}
                  className="bg-sage-wave absolute inset-y-0 left-0 w-[35%]"
                />
              )}
            </AnimatePresence>
          </div>

          <div className="grid items-center gap-8 lg:grid-cols-[minmax(260px,0.9fr)_minmax(280px,1.1fr)]">
            <div className="flex flex-col items-center">
              <ScoreRing value={score} size={280} strokeWidth={11} ghost={85}>
                {(count) => (
                  <div className="flex flex-col items-center">
                    <Life7Mark size={150} state={markState} showLabels={false} />
                    <span className="t-label mt-1 text-ink-faint">LIFE7 score</span>
                    <span className="mt-1 flex items-baseline gap-1">
                      <motion.span className="tnum font-display text-[52px] leading-none text-ink">{count}</motion.span>
                      <span className="text-[13px] font-semibold text-ink-faint">/ 100</span>
                    </span>
                  </div>
                )}
              </ScoreRing>
              <span className="mt-3 inline-flex items-center gap-2 rounded-r-pill bg-sage-mist/60 px-3 py-1.5 text-[11px] font-semibold text-forest">
                <span className="h-1.5 w-1.5 rounded-full bg-green" />
                11 points from weekly target
              </span>
            </div>

            <div className="w-full">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <span className="t-label text-ink-faint">Today’s signals</span>
                  <p className="t-ui-sm mt-1 text-ink-soft">Four numbers. One priority.</p>
                </div>
                <span className="relative inline-flex items-center gap-2 rounded-r-pill border border-gold-deep/20 bg-sunrise px-3 py-1.5 text-[10px] font-bold text-gold-deep shadow-[0_6px_18px_-12px_rgba(176,138,62,0.8)]">
                  <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-burgundy/10 text-burgundy">
                    <span className="animate-halo-ping absolute inset-0 rounded-full border border-burgundy/45" />
                    <Flag size={11} fill="currentColor" strokeWidth={1.5} />
                  </span>
                  Protein needs attention
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {chipDefs.map((def, i) => renderChip(def, i, {
                  side: i < 2 ? 'down' : 'up',
                  align: i % 2 === 0 ? 'start' : 'end',
                }))}
              </div>
              <div className="mt-4 grid grid-cols-3 divide-x divide-line border-t border-line pt-4 text-center">
                <span className="t-ui-sm text-ink-faint">Meals <b className="tnum block text-ink">2 / 4</b></span>
                <span className="t-ui-sm text-ink-faint">Movement <b className="tnum block text-ink">20 min</b></span>
                <span className="t-ui-sm text-ink-faint">Sleep <b className="tnum block text-ink">23:00</b></span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Right column — Zone B + Zone C */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* Zone B — next meal */}
          <motion.section
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.62, delay: 0.25, ease: EASE_GLIDE }}
            className={cn(
              'glass relative overflow-hidden rounded-r-xl p-5 shadow-e-1 transition-colors duration-500 hover:shadow-gold-glow',
              eaten && 'bg-sage-mist/50',
            )}
            ref={cardRef}
            onMouseMove={(e) => {
              const r = cardRef.current?.getBoundingClientRect()
              if (!r) return
              px.set(((e.clientX - r.left) / r.width - 0.5) * 16)
              py.set(((e.clientY - r.top) / r.height - 0.5) * 16)
            }}
            onMouseLeave={() => {
              px.set(0)
              py.set(0)
            }}
            aria-label="Next meal"
          >
            <AnimatePresence>
              {eaten && (
                <motion.div
                  key="mealwave"
                  initial={{ x: '-120%' }}
                  animate={{ x: '320%' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.95, ease: EASE_GLIDE }}
                  className="bg-sage-wave pointer-events-none absolute inset-y-0 left-0 z-10 w-[35%]"
                />
              )}
            </AnimatePresence>

            <div className="mb-4 flex items-center justify-between">
              <span className="t-label text-gold-deep">
                Next meal ·{' '}
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={mins}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -8, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="inline-block tnum"
                  >
                    Lunch in {mins} min
                  </motion.span>
                </AnimatePresence>
              </span>
              {eaten && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green text-soft-white">
                  <Check size={14} strokeWidth={2.5} />
                </span>
              )}
            </div>

            <div className="flex flex-col gap-5 min-[520px]:flex-row">
              <div className="h-[180px] w-full shrink-0 overflow-hidden rounded-r-md bg-cream min-[520px]:w-[200px]">
                <motion.div className="h-full w-full" style={{ x: spx, y: spy }}>
                  <img
                    src="/meal-chicken-bowl.jpg"
                    alt="Herb Chicken & Rice Bowl"
                    className="animate-kenburns h-full w-full scale-[1.08] object-cover"
                  />
                </motion.div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="t-display-sm text-ink">Herb Chicken & Rice Bowl</h2>
                <div className="t-metric-sm tnum mt-2 flex flex-wrap gap-x-3 gap-y-1 text-ink-soft">
                  <span>612 kcal</span>
                  <span>P 44 g</span>
                  <span>C 58 g</span>
                  <span>F 18 g</span>
                  <span>Fibre 7 g</span>
                </div>
                <p className="t-ui-sm mt-2 flex items-center gap-1.5 text-ink-soft">
                  <span className="h-1.5 w-1.5 rounded-full bg-burgundy" />
                  Uses spinach, expires tomorrow.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {!eaten ? (
                    <>
                      <MagneticButton
                        variant="primary"
                        size="sm"
                        icon={<ChefHat size={15} strokeWidth={1.5} />}
                        onClick={() => setCooking(true)}
                      >
                        Start cooking (18 min)
                      </MagneticButton>
                      <MagneticButton variant="glass" size="sm" onClick={() => navigate('/architect')}>
                        View in Architect
                      </MagneticButton>
                      <MagneticButton variant="ghost" size="sm" onClick={markEaten}>
                        Mark as eaten
                      </MagneticButton>
                    </>
                  ) : (
                    <Chip variant="sage" icon={<Check size={13} />}>
                      Logged · 12:34
                    </Chip>
                  )}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Zone C — AI insight */}
          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.56, delay: 0.4, ease: EASE_GLIDE }}
            className="glass relative overflow-hidden rounded-r-lg p-6 shadow-e-1"
            aria-label="LIFE7 insight"
          >
            <motion.span
              aria-hidden="true"
              className="absolute bottom-0 left-0 top-0 w-[3px] origin-top bg-champagne"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.5, ease: EASE_GLIDE }}
            />
            <div className="mb-3 flex items-center gap-2">
              <motion.span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 bg-champagne"
                initial={{ rotate: 45 }}
                animate={{ rotate: 45 + diamondRot }}
                transition={{ duration: 0.8, ease: EASE_GLIDE }}
              />
              <span className="t-label text-gold-deep">LIFE7 Insight</span>
            </div>
            <p className="t-serif-quote min-h-[116px] text-ink">
              {INSIGHT.slice(0, typed)}
              <motion.span
                aria-hidden="true"
                className="ml-0.5 inline-block h-[18px] w-[2px] translate-y-[3px] bg-champagne"
                animate={{ opacity: typed >= INSIGHT.length ? 0 : [1, 0, 1] }}
                transition={typed >= INSIGHT.length ? { duration: 0.5, delay: 0.8 } : { duration: 0.85, repeat: Infinity }}
              />
            </p>
            <p className="t-ui-sm mt-3 text-ink-soft">
              Suggested adjustment ready in Meal Architect. Adds <b className="tnum">32 g</b> protein for{' '}
              <b className="tnum">+118 kcal</b>.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <MagneticButton
                variant="gold"
                size="sm"
                onClick={() => {
                  toast('Adjustment ready in Meal Architect', { tone: 'gold' })
                  navigate('/architect')
                }}
              >
                Apply to next meal
              </MagneticButton>
              <MagneticButton variant="ghost" size="sm" onClick={() => navigate('/coach')}>
                Ask coach
              </MagneticButton>
            </div>
          </motion.section>
        </div>
      </div>

      {/* ------------------------- Zone D — attention row ------------------------- */}
      <motion.section
        initial={{ y: 24, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ amount: 0.15, once: true }}
        transition={{ duration: 0.56, ease: EASE_GLIDE }}
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible"
        aria-label="Needs attention"
      >
        {/* Shopping */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ amount: 0.15, once: true }}
          transition={{ duration: 0.56, delay: 0.0, ease: EASE_GLIDE }}
          className="w-[82vw] max-w-[340px] shrink-0 snap-start lg:w-auto lg:max-w-none"
        >
          <GlassCard className="flex h-full flex-col p-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="t-label text-ink-soft">Shopping</span>
              <ShoppingBasket size={20} strokeWidth={1.5} className="animate-swing text-forest" />
            </div>
            <p className="t-ui-lg text-ink">Market list ready, 6 items, ≈ €18.40.</p>
            <p className="t-ui-sm mt-1 text-ink-faint">Best before Saturday</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <Chip variant="sage">6 items</Chip>
              <MagneticButton variant="glass" size="sm" onClick={() => navigate('/shopping')}>
                Open list
              </MagneticButton>
            </div>
          </GlassCard>
        </motion.div>

        {/* Expiry */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ amount: 0.15, once: true }}
          transition={{ duration: 0.56, delay: 0.09, ease: EASE_GLIDE }}
          className="w-[82vw] max-w-[340px] shrink-0 snap-start lg:w-auto lg:max-w-none"
        >
          <GlassCard className="flex h-full flex-col p-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="t-label text-burgundy">Use soon</span>
              {/* freshness mini ring — amber, pulses (expiry < 48h) */}
              <span className="relative flex h-8 w-8 items-center justify-center">
                <span className="animate-gold-pulse absolute inset-0 rounded-full border border-champagne/60" />
                <svg width="32" height="32" viewBox="0 0 32 32" className="-rotate-90">
                  <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(46,70,48,0.10)" strokeWidth="3" />
                  <circle
                    cx="16"
                    cy="16"
                    r="13"
                    fill="none"
                    stroke="#D9B26A"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 13}
                    strokeDashoffset={2 * Math.PI * 13 * (1 - 0.82)}
                  />
                </svg>
                <Leaf size={12} strokeWidth={1.5} className="absolute text-gold-deep" />
              </span>
            </div>
            <div className="flex items-center gap-3">
              <img src="/ing-spinach.png" alt="Spinach" className="h-11 w-11 rounded-r-sm object-cover" />
              <div>
                <p className="t-ui-lg text-ink">Spinach expires tomorrow.</p>
                <p className="t-ui-sm mt-0.5 text-ink-faint">Moved into tonight's dinner</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <MagneticButton variant="gold" size="sm" onClick={() => setDinnerOpen(true)}>
                See change
              </MagneticButton>
            </div>
          </GlassCard>
        </motion.div>

        {/* Activity */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ amount: 0.15, once: true }}
          transition={{ duration: 0.56, delay: 0.18, ease: EASE_GLIDE }}
          className="w-[82vw] max-w-[340px] shrink-0 snap-start lg:w-auto lg:max-w-none"
        >
          <GlassCard className="relative flex h-full flex-col overflow-hidden p-5">
            <span className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-sunrise/35 blur-2xl" aria-hidden="true" />
            <div className="relative mb-3 flex items-center justify-between gap-2">
              <span className="t-label text-ink-soft">Next activity</span>
              <span className="t-label flex items-center gap-1 rounded-r-pill bg-sage-mist/70 px-2.5 py-1 text-[8px] text-forest">
                <Watch size={11} /> Watch synced
              </span>
            </div>

            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="t-label text-gold-deep">Mobility reset</span>
                <p className="t-display-sm mt-1 text-[24px] text-ink"><b className="tnum">{activityTime}</b></p>
                <p className="t-ui-sm mt-1 font-medium text-ink-soft">20 min · hips, spine, shoulders</p>
                <p className="t-ui-sm mt-2 leading-snug text-ink-faint">Timed before the evening energy drop.</p>
              </div>
              <MobilityScene />
            </div>

            <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
              <span className="t-ui-sm flex items-center gap-1.5 font-semibold text-forest">
                <Clock3 size={14} className="text-gold-deep" /> Next in 3 h 10 min
              </span>
              <MagneticButton variant="ghost" size="sm" onClick={() => setReschedOpen((v) => !v)}>
                Reschedule
              </MagneticButton>
              <AnimatePresence>
                {reschedOpen && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: -4 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: EASE_GLIDE }}
                    className="glass-strong absolute bottom-full right-0 z-30 mb-2 flex gap-1.5 rounded-r-md p-2 shadow-e-2"
                  >
                    {['17:30', '18:00', '19:00'].map((t) => (
                      <Chip
                        key={t}
                        variant="glass"
                        selected={activityTime === t}
                        onClick={() => {
                          setActivityTime(t)
                          setReschedOpen(false)
                          toast(`Mobility moved to ${t}, Planner updated`)
                        }}
                      >
                        <span className="tnum">{t}</span>
                      </Chip>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </motion.div>
      </motion.section>

      {/* --------------------- Zone E — week rhythm + main CTA --------------------- */}
      <motion.section
        initial={{ y: 24, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ amount: 0.15, once: true }}
        transition={{ duration: 0.56, ease: EASE_GLIDE }}
        className="glass mt-6 rounded-r-xl p-6 shadow-e-1 min-[1024px]:px-10"
        aria-label="Week rhythm"
      >
        <div className="flex flex-col items-stretch gap-6 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
          <div className="relative flex-1 overflow-x-auto pb-1 min-[900px]:overflow-visible">
            <div className="relative flex min-w-[560px] items-start justify-between px-1">
              {/* flowing connector line */}
              <svg className="absolute left-6 right-6 top-5 h-[2px] w-[calc(100%-48px)]" preserveAspectRatio="none">
                <motion.line
                  x1="0"
                  y1="1"
                  x2="100%"
                  y2="1"
                  stroke="rgba(217,178,106,0.35)"
                  strokeWidth="2"
                  strokeDasharray="7 9"
                  className="animate-dash-drift"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: EASE_GLIDE }}
                />
              </svg>
              {WEEK.map((d, i) => (
                <WeekNode
                  key={d.day}
                  day={d.day}
                  score={d.score}
                  state={d.state as 'done' | 'today' | 'future'}
                  meal={d.meal}
                  delay={0.15 + i * 0.07}
                  onOpen={() => navigate('/week')}
                />
              ))}
            </div>
          </div>
          <MagneticButton
            variant="primary"
            size="lg"
            onClick={() => navigate('/planner')}
            className="shrink-0 self-center"
          >
            Complete my day
          </MagneticButton>
        </div>
      </motion.section>

      {/* ------------------------------ overlays ------------------------------ */}
      <AnimatePresence>{cooking && <CookingOverlay onClose={() => setCooking(false)} />}</AnimatePresence>

      {/* dinner preview drawer (expiry "See change") */}
      <AnimatePresence>
        {dinnerOpen && (
          <motion.aside
            initial={{ y: 24, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.38, ease: EASE_GLIDE }}
            className="glass-strong fixed bottom-24 right-4 z-[75] w-[320px] rounded-r-lg p-4 shadow-e-3 min-[900px]:bottom-8 min-[900px]:right-8"
            role="dialog"
            aria-label="Tonight's dinner change"
          >
            <div className="mb-3 flex items-start justify-between">
              <span className="t-label text-gold-deep">Tonight · 19:30</span>
              <button
                type="button"
                onClick={() => setDinnerOpen(false)}
                aria-label="Close"
                className="glass flex h-7 w-7 items-center justify-center rounded-full text-ink-soft"
              >
                <X size={13} strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <img src="/meal-omelette.jpg" alt="Spinach omelette" className="h-16 w-16 rounded-r-md object-cover" />
              <div>
                <p className="t-display-sm text-[18px] text-ink">Spinach Omelette & Tomatoes</p>
                <p className="t-ui-sm mt-0.5 text-ink-soft">Spinach added, nothing wasted.</p>
              </div>
            </div>
            <div className="t-metric-sm tnum mt-3 flex gap-3 text-ink-soft">
              <span>486 kcal</span>
              <span>P 31 g</span>
              <span>F 34 g</span>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
