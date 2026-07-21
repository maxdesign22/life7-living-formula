import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  CalendarClock,
  Check,
  Leaf,
  LockKeyhole,
  Mic,
  MicOff,
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
import { applyContinuumDemoState, clearContinuumDemoState } from '@/lib/continuumDemo'

const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]

type ShiftId = 'sleep' | 'schedule' | 'budget' | 'expiry'
type Phase = 'idle' | 'composing' | 'ready' | 'applied'
type VoiceState = 'idle' | 'listening' | 'understood' | 'unsupported' | 'error'

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean
  readonly length: number
  readonly [index: number]: { readonly transcript: string }
}

interface SpeechRecognitionEventLike {
  readonly resultIndex: number
  readonly results: {
    readonly length: number
    readonly [index: number]: SpeechRecognitionResultLike
  }
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

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

const PROTECTIONS_BY_SCENARIO: Record<ShiftId, readonly string[]> = {
  sleep: ['Protein floor', 'Budget ceiling', 'Sleep window', 'Friday training'],
  schedule: ['Protein floor', 'Budget ceiling', 'Sleep window', 'Family dinner'],
  budget: ['Protein floor', 'Budget ceiling', 'Complete dinners', 'Prep time'],
  expiry: ['Protein floor', 'Budget ceiling', 'Prep time', 'Tonight’s dinner'],
}

const VOICE_SIGNALS: Record<ShiftId, readonly string[]> = {
  sleep: ['Sleep · 5 hours', 'Recovery risk', 'Protect training'],
  schedule: ['Dinner · 21:00', 'Late meal window', 'Protect sleep'],
  budget: ['Budget · −€15', 'Cost pressure', 'Protect protein'],
  expiry: ['Spinach · 1 day', 'Expiry risk', 'Protect prep time'],
}

function matchVoiceScenario(value: string): ShiftId | null {
  const text = value.toLowerCase()
  if (/spinach|expir|pantry|use it up|go bad/.test(text)) return 'expiry'
  if (/budget|cheaper|money|cost|€|euro|tight/.test(text)) return 'budget'
  if (/dinner|late|21|nine|schedule|calendar/.test(text)) return 'schedule'
  if (/sleep|slept|tired|recovery|five hours|5 hours/.test(text)) return 'sleep'
  return null
}

function VoiceShiftInput({ onRecognised }: { onRecognised: (id: ShiftId) => void }) {
  const [transcript, setTranscript] = useState('')
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [matchedId, setMatchedId] = useState<ShiftId | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => () => recognitionRef.current?.abort(), [])

  const interpret = (value: string) => {
    const clean = value.trim()
    setTranscript(clean)
    const match = matchVoiceScenario(clean)
    setMatchedId(match)
    if (!match) {
      setVoiceState('error')
      return
    }
    setVoiceState('understood')
    onRecognised(match)
  }

  const beginListening = () => {
    const voiceWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }
    const Recognition = voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition
    if (!Recognition) {
      setVoiceState('unsupported')
      return
    }

    if (voiceState === 'listening') {
      recognitionRef.current?.stop()
      return
    }

    const recognition = new Recognition()
    recognitionRef.current = recognition
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.onstart = () => {
      setTranscript('')
      setMatchedId(null)
      setVoiceState('listening')
    }
    recognition.onresult = (event) => {
      let spoken = ''
      let final = false
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        spoken += event.results[index][0]?.transcript ?? ''
        if (event.results[index].isFinal) final = true
      }
      setTranscript(spoken)
      if (final) interpret(spoken)
    }
    recognition.onerror = () => setVoiceState('error')
    recognition.onend = () => setVoiceState((current) => current === 'listening' ? 'idle' : current)
    recognition.start()
  }

  const useDemoPhrase = () => interpret('The spinach expires tomorrow and I only have 20 minutes to cook.')
  const matchedScenario = matchedId ? SCENARIOS.find((item) => item.id === matchedId) : null

  return (
    <section className="mb-6 overflow-hidden rounded-r-xl border border-champagne/35 bg-soft-white/85 shadow-e-2" aria-label="Tell LIFE7 what changed">
      <div className="grid min-[760px]:grid-cols-[220px_minmax(0,1fr)]">
        <div className="relative flex min-h-[180px] flex-col items-center justify-center overflow-hidden bg-forest p-5 text-center">
          <span className="pointer-events-none absolute h-36 w-36 rounded-full border border-champagne/15" />
          <span className="pointer-events-none absolute h-24 w-24 rounded-full border border-champagne/25" />
          <motion.button
            type="button"
            onClick={beginListening}
            aria-label={voiceState === 'listening' ? 'Stop listening' : 'Tell LIFE7 what changed'}
            className={cn(
              'relative z-10 flex h-16 w-16 items-center justify-center rounded-full border shadow-e-2 transition-colors',
              voiceState === 'listening'
                ? 'border-burgundy/60 bg-burgundy text-white'
                : 'border-champagne bg-sunrise text-forest hover:bg-champagne',
            )}
            animate={voiceState === 'listening' ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 1.1, repeat: voiceState === 'listening' ? Infinity : 0 }}
          >
            {voiceState === 'listening' ? <MicOff size={23} /> : <Mic size={23} />}
          </motion.button>
          <div className="relative z-10 mt-4 flex h-4 items-center gap-1" aria-hidden="true">
            {[7, 13, 9, 16, 10, 14, 7].map((height, index) => (
              <motion.span
                key={`${height}-${index}`}
                className="w-0.5 rounded-r-pill bg-champagne"
                animate={voiceState === 'listening' ? { height: [height, Math.max(4, 18 - height), height] } : { height: 4 }}
                transition={{ duration: 0.65, repeat: voiceState === 'listening' ? Infinity : 0, delay: index * 0.06 }}
              />
            ))}
          </div>
          <span className="t-label relative z-10 mt-2 text-champagne">
            {voiceState === 'listening' ? 'Listening… tap to stop' : 'Voice Continuum'}
          </span>
        </div>

        <div className="p-5 min-[760px]:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="t-label text-gold-deep">Speak one real-life change</span>
              <h2 className="t-display-sm mt-1 text-ink">Tell LIFE7 what changed.</h2>
            </div>
            <span className="t-label flex items-center gap-1.5 rounded-r-pill bg-sage-mist px-2.5 py-1.5 text-green">
              <LockKeyhole size={12} /> LIFE7 does not store audio
            </span>
          </div>

          <form
            className="mt-4"
            onSubmit={(event) => {
              event.preventDefault()
              interpret(transcript)
            }}
          >
            <div className="flex flex-col gap-2 min-[620px]:flex-row">
              <label className="sr-only" htmlFor="continuum-voice-transcript">What changed?</label>
              <input
                id="continuum-voice-transcript"
                value={transcript}
                onChange={(event) => {
                  setTranscript(event.target.value)
                  setVoiceState('idle')
                  setMatchedId(null)
                }}
                placeholder="e.g. The spinach expires tomorrow…"
                className="min-h-11 min-w-0 flex-1 rounded-r-pill border border-line bg-white/65 px-4 t-ui-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-champagne"
              />
              <button type="submit" disabled={!transcript.trim()} className="min-h-11 rounded-r-pill bg-forest px-5 t-ui-sm font-bold text-soft-white transition-colors hover:bg-green disabled:cursor-not-allowed disabled:opacity-40">
                Interpret change
              </button>
            </div>
          </form>

          <div className="mt-3" aria-live="polite">
            {voiceState === 'understood' && matchedScenario && matchedId && (
              <div className="rounded-r-lg border border-sage bg-sage-mist/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="t-ui-sm font-bold text-forest"><Check size={14} className="mr-1.5 inline" /> Understood · {matchedScenario.eyebrow}</span>
                  <span className="t-label text-green">Ready to compose</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {VOICE_SIGNALS[matchedId].map((signal) => <span key={signal} className="t-label rounded-r-pill border border-sage bg-soft-white/70 px-2 py-1 text-[8px] text-green">{signal}</span>)}
                </div>
              </div>
            )}
            {voiceState === 'unsupported' && <p className="t-ui-sm text-ink-soft">Voice capture is not available in this browser. Type the change below — Continuum works the same way.</p>}
            {voiceState === 'error' && <p className="t-ui-sm text-burgundy">I need one clearer signal — mention sleep, dinner time, budget or an expiring ingredient.</p>}
            {(voiceState === 'idle' || voiceState === 'unsupported') && !transcript && (
              <button type="button" onClick={useDemoPhrase} className="t-ui-sm font-semibold text-gold-deep underline decoration-champagne underline-offset-4">Try the winning demo phrase</button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

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
  const [protections, setProtections] = useState<ReadonlySet<string>>(new Set(PROTECTIONS_BY_SCENARIO.sleep))
  const [demoKey, setDemoKey] = useState(0)
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
    setProtections(new Set(PROTECTIONS_BY_SCENARIO[id]))
  }

  const recogniseVoiceChange = (id: ShiftId) => choose(id)

  const compose = () => {
    setPhase('composing')
    timerRef.current = window.setTimeout(() => setPhase('ready'), 1350)
  }

  const apply = () => {
    setPhase('applied')
    applyContinuumDemoState({ scenarioId: scenario.id, title: scenario.title, appliedAt: Date.now() })
    toast('Update applied — Today, Week, Shopping and Pantry are now in sync.', { tone: 'gold' })
  }

  const reset = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    setPhase('idle')
    clearContinuumDemoState()
  }

  const restartDemo = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    setSelectedId('sleep')
    setPhase('idle')
    setProtections(new Set(PROTECTIONS_BY_SCENARIO.sleep))
    setDemoKey((current) => current + 1)
    clearContinuumDemoState()
    window.requestAnimationFrame(() => document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }))
    toast('Demo reset — ready for a clean Continuum run.', { tone: 'sage' })
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="t-label text-gold-deep">LIFE7 flagship intelligence</span>
            <span className="t-label rounded-r-pill border border-champagne/30 bg-sunrise/55 px-2.5 py-1 text-[8px] text-gold-deep">Interactive prototype</span>
          </div>
          <h1 className="t-display-lg mt-2 text-ink">Continuum Shift</h1>
          <p className="t-serif-quote mt-2 max-w-[720px] text-ink-soft">One real-life change. Seven days recompose — without breaking what matters.</p>
        </div>
        <button type="button" onClick={restartDemo} className="t-ui-sm flex min-h-10 items-center gap-2 rounded-r-pill border border-line bg-soft-white/70 px-3.5 font-semibold text-ink-soft shadow-e-1 transition-colors hover:border-champagne hover:text-forest">
          <RotateCcw size={14} /> Restart demo
        </button>
      </header>

      <section className="mb-6 rounded-r-xl border border-champagne/35 bg-soft-white/80 p-4 shadow-e-1 min-[760px]:p-5" aria-label="What Continuum does">
        <div className="grid gap-4 min-[900px]:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] min-[900px]:items-center">
          <div>
            <span className="t-label text-gold-deep">What Continuum does</span>
            <h2 className="t-display-sm mt-1 text-ink">Keeps your seven-day plan useful when real life changes.</h2>
            <p className="t-ui-sm mt-2 max-w-[700px] leading-relaxed text-ink-soft">Tell LIFE7 one change. It protects your non-negotiables, finds the smallest safe update, and coordinates Today, Week, Shopping and Pantry together.</p>
          </div>
          <ol className="grid grid-cols-3 gap-2" aria-label="Continuum steps">
            {[
              ['1', 'Tell', 'what changed'],
              ['2', 'Review', 'the update'],
              ['3', 'Apply', 'or undo'],
            ].map(([number, title, detail]) => (
              <li key={number} className="rounded-r-md border border-line bg-cream/55 px-3 py-3">
                <span className="t-label text-gold-deep">{number}</span>
                <span className="t-ui-sm mt-1 block font-bold text-ink">{title}</span>
                <span className="t-ui-sm block text-ink-faint">{detail}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <VoiceShiftInput key={demoKey} onRecognised={recogniseVoiceChange} />

      <div className="grid gap-6 min-[1100px]:grid-cols-[300px_minmax(0,1fr)]">
        <section aria-label="Choose a life change">
          <span className="t-label text-ink-faint">Examples · or choose a change</span>
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
              {PROTECTIONS_BY_SCENARIO[selectedId].map((item) => {
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
                    Preview the coordinated update <Sparkles size={16} />
                  </button>
                )}
                {phase === 'composing' && (
                  <div className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-r-pill border border-champagne/30 bg-champagne/10 px-5 t-ui-sm font-bold text-champagne">
                    <Sparkles size={16} className="animate-spin-slow" /> Rebalancing four systems…
                  </div>
                )}
                {phase === 'ready' && (
                  <button type="button" onClick={apply} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-r-pill bg-champagne px-5 t-ui-sm font-bold text-forest transition-colors hover:bg-gold-light">
                    Apply update to 4 areas <ArrowRight size={16} />
                  </button>
                )}
                {phase === 'applied' && (
                  <div className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-r-pill bg-sage-mist px-5 t-ui-sm font-bold text-forest"><Check size={16} /> Update applied to demo</div>
                )}
                {phase !== 'idle' && phase !== 'composing' && (
                  <button type="button" onClick={reset} aria-label="Reset shift" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-soft-white/65 hover:text-white"><RotateCcw size={16} /></button>
                )}
              </div>
              {phase === 'applied' && (
                <div className="mt-3 rounded-r-lg border border-sage/40 bg-sage-mist/15 p-3">
                  <p className="t-ui-sm font-semibold text-soft-white">Today, Week, Shopping and Pantry are synchronized.</p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    {[
                      ['/today', 'Open Today'],
                      ['/week', 'Open Week'],
                      ['/shopping', 'Open Shopping'],
                      ['/pantry', 'Open Pantry'],
                    ].map(([to, label]) => <Link key={to} to={to} className="t-ui-sm font-semibold text-champagne underline decoration-champagne/50 underline-offset-4">{label}</Link>)}
                  </div>
                </div>
              )}
              <p className="t-label mt-3 text-center text-soft-white/40">Reversible preview · no protected constant is changed</p>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-6" aria-label="Change ledger">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="t-label text-gold-deep">Step 2 · Review the proposed update</span>
            <h2 className="t-display-sm mt-1 text-ink">One change updates four connected areas.</h2>
          </div>
          <span className={cn('t-label rounded-r-pill px-3 py-1.5', phase === 'ready' || phase === 'applied' ? 'bg-sage-mist text-forest' : 'bg-cream text-ink-faint')}>
            {phase === 'ready' || phase === 'applied' ? 'Verified by LIFE7 rules' : 'Preview update to reveal'}
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
