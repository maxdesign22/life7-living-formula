/**
 * Screen 4 — AI Week Generator (/generator).
 * Intake wizard → deterministic thinking theater → complete seven-day plan.
 * Intro line (verbatim, generator.md): "LIFE7 does not just track food.
 * It organises the decisions around it."
 */
import { useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Life7Mark, useToast } from '@/components/life7'
import { DEFAULT_INTAKE, getAIService } from '@/lib/aiService'
import type { GeneratedWeek, GeneratorIntake } from '@/lib/aiService'
import IntakeWizard from './generator/IntakeWizard'
import ResultsStage from './generator/ResultsStage'
import type { StageStatus } from './generator/ResultsStage'
import { EASE_GLIDE, KineticWords } from './generator/bits'

function cloneIntake(i: GeneratorIntake): GeneratorIntake {
  return {
    ...i,
    goals: [...i.goals],
    allergies: [...i.allergies],
    excludedFoods: [...i.excludedFoods],
    favouriteFoods: [...i.favouriteFoods],
    stores: [...i.stores],
  }
}

export default function Generator() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [intake, setIntake] = useState<GeneratorIntake>(() => cloneIntake(DEFAULT_INTAKE))
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [status, setStatus] = useState<StageStatus>('empty')
  const [plan, setPlan] = useState<GeneratedWeek | null>(null)
  const [snapshot, setSnapshot] = useState<string | null>(null)
  const [fly, setFly] = useState<{ x: number; y: number } | null>(null)

  const stageRef = useRef<HTMLDivElement | null>(null)
  const flyTimer = useRef<number | undefined>(undefined)

  const patch = (p: Partial<GeneratorIntake>) => setIntake((prev) => ({ ...prev, ...p }))

  const goToStep = (next: number) => {
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  const runGeneration = async () => {
    const intakeCopy = cloneIntake(intake)
    setSnapshot(JSON.stringify(intakeCopy))
    const result = await getAIService().generateWeek(intakeCopy)
    setPlan(result)
    setStatus('thinking')
    if (window.innerWidth < 1024) {
      window.setTimeout(() => stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350)
    }
  }

  const handleStartOver = () => {
    setDirection(-1)
    setStep(0)
    setIntake(cloneIntake(DEFAULT_INTAKE))
    setPlan(null)
    setSnapshot(null)
    setStatus('empty')
  }

  const handleSendToWeek = (e: ReactMouseEvent) => {
    if (fly) return
    setFly({ x: e.clientX, y: e.clientY })
    window.clearTimeout(flyTimer.current)
    flyTimer.current = window.setTimeout(() => {
      setFly(null)
      toast(`Week ${plan?.week.weekNumber ?? 24} is live`, { tone: 'gold' })
      navigate('/week')
    }, 620)
  }

  const inputsChanged = status === 'plan' && snapshot !== null && snapshot !== JSON.stringify(intake)

  return (
    <div className="mx-auto max-w-[1280px]">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <motion.span className="t-label block text-gold-deep" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            AI Week Generator
          </motion.span>
          <h1 className="t-display-lg mt-2 text-ink">
            <KineticWords text="AI Week Generator" />
          </h1>
          <motion.p
            className="t-serif-quote mt-2 max-w-[62ch] text-ink-soft"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            LIFE7 does not just track food. It organises the decisions around it.
          </motion.p>
        </div>
        {/* global recompute indicator (design.md §8) */}
        <AnimatePresence>
          {status === 'thinking' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: EASE_GLIDE }}
              className="glass flex h-10 w-10 items-center justify-center rounded-full shadow-e-1"
              aria-label="LIFE7 is composing your week"
            >
              <Life7Mark size={26} state="thinking" paused={false} />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 min-[1024px]:grid-cols-[480px_minmax(0,1fr)]">
        <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.56, delay: 0.15, ease: EASE_GLIDE }}>
          <IntakeWizard
            intake={intake}
            onPatch={patch}
            step={step}
            direction={direction}
            onStep={goToStep}
            onGenerate={runGeneration}
            generating={status === 'thinking'}
          />
        </motion.div>
        <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.56, delay: 0.22, ease: EASE_GLIDE }}>
          <ResultsStage
            status={status}
            plan={plan}
            stageRef={stageRef}
            inputsChanged={inputsChanged}
            onTheaterDone={() => setStatus('plan')}
            onRegenerate={runGeneration}
            onSendToWeek={handleSendToWeek}
            onOpenShopping={() => navigate('/shopping')}
            onStartOver={handleStartOver}
          />
        </motion.div>
      </div>

      {/* mini honeycomb cell flying toward the nav (Send plan to Week) */}
      <AnimatePresence>
        {fly && (
          <motion.div
            className="pointer-events-none fixed z-[100]"
            style={{ left: fly.x - 8, top: fly.y - 8 }}
            initial={{ x: 0, y: 0, scale: 0.6, opacity: 0 }}
            animate={{ x: 72 - fly.x, y: window.innerHeight * 0.42 - fly.y, scale: [0.6, 1.15, 0.5], opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE_GLIDE }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1 14 4.5v7L8 15l-6-3.5v-7L8 1Z"
                fill="url(#fly-hex)"
                stroke="#B08A3E"
                strokeWidth="1"
              />
              <defs>
                <linearGradient id="fly-hex" x1="0" y1="0" x2="16" y2="16">
                  <stop offset="0%" stopColor="#F7DFA7" />
                  <stop offset="100%" stopColor="#D9B26A" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
