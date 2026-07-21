/**
 * Screen 8 — AI Coach (/coach). A conversation that *does things*:
 * living LIFE7 core, editorial AI messages with contextual cards, eight
 * deterministic quick commands via the mock AI service, and a sticky
 * composer. Welcome caption (verbatim, coach.md): "Most apps tell you what
 * you ate. LIFE7 tells you what is missing and what to do next."
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { MagneticButton, useToast } from '@/components/life7'
import { getAIService } from '@/lib/aiService'
import type { CoachReply } from '@/lib/aiService'
import { COACH_SCRIPTS, type CoachAction } from '@/data/coachScripts'
import AiMessage from './coach/AiMessage'
import { Composer, CoachCore, QuickCommands, ThinkingDots } from './coach/chrome'
import type { CoreState } from './coach/chrome'
import { EASE_GLIDE, KineticWords } from './generator/bits'

/* ------------------------------------------------------------------ model */

interface ChatMsg {
  id: number
  role: 'user' | 'ai'
  text: string
  reply?: CoachReply
  typed: boolean
  applied: readonly string[]
}

/** Deterministic toast copy for one-shot apply actions. */
const ACTION_TOASTS: Readonly<Record<string, string>> = {
  'apply-all-swaps': 'All swaps applied, week total now €53.00.',
  'update-wednesday': 'Wednesday updated, zero cooking, prep 6 min.',
  'apply-replacement': 'Friday dinner replaced, €3.50 saved.',
  'keep-salmon': 'Salmon stays. Friday unchanged.',
  'apply-to-week': 'Protein shift applied to the week, +18 g on training days.',
  'training-only': 'Protein shift applied to training days only.',
  'accept-new-plan': 'Today recalculated, snack and dinner rebuilt.',
  'make-portable': 'Friday is portable, oat jars packed.',
  'breakfast-only': 'Friday breakfast is portable; the rest stays cooked.',
  'apply-expiry': 'Expiry order applied, spinach tonight, bananas Saturday.',
  'add-to-today': 'Added to today at 19:30.',
}

/* ------------------------------------------------------------------ page */

export default function Coach() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [thinking, setThinking] = useState(false)
  const [composerFocused, setComposerFocused] = useState(false)
  const [used, setUsed] = useState<ReadonlySet<string>>(new Set())
  const [conversationId, setConversationId] = useState(0)

  const nextId = useRef(1)
  const dinnerStep = useRef(0)
  const busyRef = useRef(false)
  const timers = useRef<number[]>([])
  const endRef = useRef<HTMLDivElement>(null)

  const typing = messages.some((m) => m.role === 'ai' && !m.typed)
  const busy = thinking || typing
  const coreState: CoreState = thinking ? 'thinking' : typing ? 'answering' : composerFocused ? 'listening' : 'rest'

  const later = useCallback((ms: number, fn: () => void) => {
    const t = window.setTimeout(fn, ms)
    timers.current.push(t)
  }, [])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  /* ---------------------------------------------------------- messaging */

  const pushUser = (text: string) => {
    setMessages((prev) => [...prev, { id: nextId.current++, role: 'user', text, typed: true, applied: [] }])
  }

  const pushReply = useCallback(
    (reply: CoachReply) => {
      setThinking(true)
      later(reply.thinkingMs, () => {
        setThinking(false)
        setMessages((prev) => [...prev, { id: nextId.current++, role: 'ai', text: reply.text, reply, typed: false, applied: [] }])
      })
    },
    [later],
  )

  const runCommand = useCallback(
    async (command: string) => {
      if (busyRef.current) return
      busyRef.current = true
      pushUser(command)
      const script = COACH_SCRIPTS.find((s) => s.command === command)
      if (script) setUsed((prev) => new Set(prev).add(script.id))
      const reply = await getAIService().sendCoachMessage(command)
      pushReply(reply)
    },
    [pushReply],
  )

  const cycleDinner = useCallback(async () => {
    if (busyRef.current) return
    busyRef.current = true
    dinnerStep.current += 1
    const reply = await getAIService().cycleQuickDinner(dinnerStep.current)
    pushReply(reply)
  }, [pushReply])

  const handleTyped = useCallback((id: number) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, typed: true } : m)))
    busyRef.current = false
  }, [])

  /* ------------------------------------------------------------ actions */

  const handleAction = useCallback(
    (msgId: number, action: CoachAction) => {
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, applied: [...m.applied, action.id] } : m)))

      switch (action.id) {
        case 'another-option':
          void cycleDinner()
          return
        case 'fix-protein':
          void runCommand('Increase protein without increasing calories.')
          return
        case 'cheaper-week':
          void runCommand('Make the week cheaper.')
          return
        case 'surprise-me':
          void runCommand(COACH_SCRIPTS[Math.floor(Math.random() * COACH_SCRIPTS.length)].command)
          return
        case 'show-expiry-queue':
          void runCommand('Use what expires first.')
          return
        case 'rebuild-today':
          void runCommand('I missed lunch.')
          return
        case 'review-each':
          toast('The three swaps are itemised on the card.', { tone: 'gold' })
          navigate('/shopping')
          return
        case 'pick-myself':
          toast('Wednesday is open in your Week.', { tone: 'gold' })
          navigate('/week')
          return
        case 'adjust-manually':
          toast('Today opened in the Planner.', { tone: 'gold' })
          navigate('/planner')
          return
        case 'show-queue':
          toast('Your expiry queue, in the Pantry.', { tone: 'gold' })
          navigate('/pantry')
          return
        default:
          toast(ACTION_TOASTS[action.id] ?? 'Done.', { tone: 'sage' })
      }
    },
    [cycleDinner, navigate, runCommand, toast],
  )

  /* ----------------------------------------------------- welcome + reset */

  useEffect(() => {
    let alive = true
    busyRef.current = true
    getAIService()
      .getCoachWelcome()
      .then((reply) => {
        if (!alive) return
        setMessages((prev) => [...prev, { id: nextId.current++, role: 'ai', text: reply.text, reply, typed: false, applied: [] }])
      })
    return () => {
      alive = false
    }
  }, [conversationId])

  const newConversation = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
    setMessages([])
    setThinking(false)
    setUsed(new Set())
    dinnerStep.current = 0
    setConversationId((c) => c + 1)
  }

  /* -------------------------------------------------------------- scroll */

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, thinking])

  /* --------------------------------------------------------------- view */

  return (
    <div className="mx-auto max-w-[1280px]">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <motion.span className="t-label block text-gold-deep" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            AI Coach
          </motion.span>
          <h1 className="t-display-lg mt-2 text-ink">
            <KineticWords text="AI Coach" />
          </h1>
          <motion.p
            className="t-serif-quote mt-2 max-w-[62ch] text-ink-soft"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            Most apps tell you what you ate. LIFE7 tells you what is missing and what to do next.
          </motion.p>
        </div>
        <div className="flex items-center gap-3">
          <span className="glass t-ui-sm flex items-center gap-2 rounded-r-pill px-3.5 py-2 text-ink-soft shadow-e-1">
            <span className="animate-gold-pulse h-1.5 w-1.5 rounded-full bg-champagne" />
            Context: Week 24
          </span>
          <MagneticButton variant="ghost" size="md" icon={<RotateCcw size={14} strokeWidth={1.8} />} onClick={newConversation}>
            New conversation
          </MagneticButton>
        </div>
      </header>

      <div className="mx-auto max-w-[760px]">
        {/* Zone A — the living core */}
        <motion.div
          key={`core-${conversationId}`}
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 140, damping: 18, delay: 0.1 }}
          className="mb-8 mt-2"
        >
          <CoachCore state={coreState} />
        </motion.div>

        {/* Zone B — conversation stream */}
        <AnimatePresence mode="wait">
          <motion.div
            key={conversationId}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.3, ease: EASE_GLIDE } }}
            className="flex flex-col gap-4"
          >
            {messages.map((m) =>
              m.role === 'user' ? (
                <motion.div
                  key={m.id}
                  initial={{ y: 12, opacity: 0, scale: 0.96 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, ease: EASE_GLIDE }}
                  className="flex items-end justify-end gap-2 self-end"
                  style={{ maxWidth: '70%' }}
                >
                  <p className="t-ui-md rounded-r-pill rounded-br-[6px] bg-cream px-4 py-2.5 text-ink shadow-e-1">{m.text}</p>
                  <img src="/avatar-alex.png" alt="Alex" className="h-8 w-8 shrink-0 rounded-full border border-champagne/60 object-cover" />
                </motion.div>
              ) : (
                <AiMessage
                  key={m.id}
                  id={m.id}
                  text={m.text}
                  reply={m.reply!}
                  typed={m.typed}
                  applied={m.applied}
                  onTyped={handleTyped}
                  onAction={handleAction}
                  cardHandlers={{ onOpenArchitect: () => navigate('/architect'), onShowWeek: () => navigate('/week') }}
                />
              ),
            )}
            <AnimatePresence>{thinking && <ThinkingDots key="thinking-dots" />}</AnimatePresence>
            <div ref={endRef} className="h-1" />
          </motion.div>
        </AnimatePresence>

        {/* Zones C + D — quick commands & sticky composer */}
        <div className="sticky bottom-3 z-20 -mx-3 space-y-3 px-3 pb-1 pt-6">
          <div className="pointer-events-none absolute inset-x-0 -top-6 h-12 bg-gradient-to-b from-transparent to-ivory/90" aria-hidden="true" />
          <div className="relative space-y-3">
            <QuickCommands used={used} busy={busy} onRun={(c) => void runCommand(c)} />
            <Composer busy={busy} onSend={(t) => void runCommand(t)} onFocusChange={setComposerFocused} />
          </div>
        </div>
      </div>
    </div>
  )
}
