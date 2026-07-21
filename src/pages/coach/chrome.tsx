/**
 * AI Coach — the living chrome around the conversation (coach.md):
 * Zone A core with rest/listening/thinking/answering behaviour, the §5.12
 * shimmer thinking dots, quick-command chips, the context pin popover and
 * the sticky glass composer.
 */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Pin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Life7Mark } from '@/components/life7'
import { getAIService } from '@/lib/aiService'
import { COACH_PRESENCE_CAPTION, COACH_SCRIPTS } from '@/data/coachScripts'

const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]

export type CoreState = 'rest' | 'listening' | 'thinking' | 'answering'

/* ------------------------------------------------------------------- core */

export function CoachCore({ state, size = 120 }: { state: CoreState; size?: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* listening halo — expands slowly while the composer is focused */}
        <AnimatePresence>
          {state === 'listening' && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute -inset-4"
              aria-hidden="true"
            >
              <motion.span
                className="absolute inset-0 rounded-full border border-champagne/60"
                animate={{ scale: [1, 1.14, 1], opacity: [0.9, 0.25, 0.9] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.span>
          )}
        </AnimatePresence>
        <motion.div
          animate={state === 'answering' ? { rotate: 360 } : { rotate: 0 }}
          transition={
            state === 'answering'
              ? { duration: 45, repeat: Infinity, ease: 'linear' } // +8°/s
              : { duration: 0.6, ease: EASE_GLIDE }
          }
          style={{
            filter: state === 'listening' ? 'brightness(1.07) saturate(1.1)' : 'none',
            transition: 'filter 0.4s ease',
          }}
        >
          <Life7Mark size={size} state={state === 'thinking' ? 'thinking' : 'rest'} />
        </motion.div>
      </div>
      <p className="t-label mt-4 text-center text-gold-deep">{COACH_PRESENCE_CAPTION}</p>
    </div>
  )
}

/* -------------------------------------------------------- thinking shimmer */

/** Shimmer thinking indicator (design.md §5.12): 3 dots scale 0.6→1, 160ms stagger. */
export function ThinkingDots() {
  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 8, opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE_GLIDE }}
      className="glass inline-flex items-center gap-2 self-start rounded-r-lg px-5 py-4 shadow-e-1"
      role="status"
      aria-label="LIFE7 is thinking"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-sage"
          animate={{ scale: [0.6, 1, 0.6], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.16, ease: 'easeInOut' }}
        />
      ))}
    </motion.div>
  )
}

/* ----------------------------------------------------------- quick commands */

export function QuickCommands({ used, busy, onRun }: { used: ReadonlySet<string>; busy: boolean; onRun: (command: string) => void }) {
  return (
    <div
      className="flex flex-wrap gap-2 max-[1023px]:flex-nowrap max-[1023px]:snap-x max-[1023px]:overflow-x-auto max-[1023px]:pb-1"
      aria-label="Quick commands"
    >
      {COACH_SCRIPTS.map((s, i) => {
        const isUsed = used.has(s.id)
        return (
          <motion.button
            key={s.id}
            type="button"
            disabled={busy}
            onClick={() => onRun(s.command)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isUsed ? 0.5 : 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.04, ease: EASE_GLIDE }}
            whileHover={busy ? undefined : { y: -2 }}
            whileTap={busy ? undefined : { scale: 0.96 }}
            className={cn(
              'glass t-ui-sm shrink-0 rounded-r-pill px-3.5 py-2 text-ink-soft shadow-e-1 transition-shadow duration-300 max-[1023px]:snap-start',
              !busy && 'hover:text-forest hover:shadow-gold-glow',
              busy && 'cursor-default opacity-60',
            )}
          >
            {s.command}
          </motion.button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------- context pin */

function MiniToggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={cn('relative h-[26px] w-11 shrink-0 rounded-full transition-colors duration-200', on ? 'bg-sage' : 'bg-cream')}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={cn('absolute top-[3px] h-5 w-5 rounded-full bg-soft-white shadow-e-1', on ? 'right-[3px]' : 'left-[3px]')}
      />
    </button>
  )
}

export function ContextPin() {
  const [open, setOpen] = useState(false)
  const [chips, setChips] = useState<readonly string[]>([])
  const [excluded, setExcluded] = useState<ReadonlySet<number>>(new Set())
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    getAIService()
      .getContextChips()
      .then((c) => alive && setChips(c))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="What the coach can see"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200',
          open ? 'bg-sunrise text-ink shadow-e-1' : 'text-ink-faint hover:bg-cream hover:text-forest',
        )}
      >
        <Pin size={16} strokeWidth={1.8} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.22, ease: EASE_GLIDE }}
            className="glass-strong absolute bottom-full left-0 z-30 mb-2 w-[300px] rounded-r-lg p-4 shadow-e-3"
          >
            <span className="t-label text-ink-soft">What I can see</span>
            <div className="mt-3 space-y-2.5">
              {chips.map((c, i) => {
                const on = !excluded.has(i)
                return (
                  <div key={c} className="flex items-center justify-between gap-3">
                    <span className={cn('t-ui-sm min-w-0 flex-1 transition-opacity', on ? 'text-ink' : 'text-ink-faint line-through')}>{c}</span>
                    <MiniToggle
                      label={c}
                      on={on}
                      onClick={() =>
                        setExcluded((prev) => {
                          const next = new Set(prev)
                          if (next.has(i)) next.delete(i)
                          else next.add(i)
                          return next
                        })
                      }
                    />
                  </div>
                )
              })}
            </div>
            <p className="mt-3 border-t border-line pt-2.5 font-display text-[13px] italic text-ink-faint">
              Context changes how I reason.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------------------------------------------------------------- composer */

export function Composer({
  busy,
  onSend,
  onFocusChange,
}: {
  busy: boolean
  onSend: (text: string) => void
  onFocusChange: (focused: boolean) => void
}) {
  const [text, setText] = useState('')
  const [sweepKey, setSweepKey] = useState(0)
  const areaRef = useRef<HTMLTextAreaElement>(null)

  const autosize = () => {
    const el = areaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 3 * 26)}px`
  }

  const send = () => {
    const value = text.trim()
    if (!value || busy) return
    onSend(value)
    setText('')
    setSweepKey((k) => k + 1)
    requestAnimationFrame(autosize)
  }

  const canSend = text.trim().length > 0 && !busy

  return (
    <div className="glass relative flex items-end gap-1.5 overflow-hidden rounded-[28px] p-2 pl-1.5 shadow-e-3">
      {/* soft shimmer sweep after send (coach.md Zone D) */}
      {sweepKey > 0 && (
        <span key={sweepKey} className="bg-light-wave animate-wave-sweep pointer-events-none absolute inset-y-0 left-0 w-[35%]" aria-hidden="true" />
      )}
      <ContextPin />
      <textarea
        ref={areaRef}
        value={text}
        rows={1}
        onChange={(e) => {
          setText(e.target.value)
          autosize()
        }}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            send()
          }
        }}
        placeholder="Ask LIFE7 anything…"
        aria-label="Message LIFE7 coach"
        className="t-ui-md max-h-[78px] flex-1 resize-none bg-transparent px-2 py-2.5 text-ink placeholder:text-ink-faint focus:outline-none"
      />
      <motion.button
        type="button"
        onClick={send}
        disabled={!canSend}
        aria-label="Send message"
        whileTap={canSend ? { scale: 0.92 } : undefined}
        className={cn(
          'bg-sunrise-gold flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink shadow-e-1 transition-all duration-200',
          canSend ? 'hover:shadow-gold-glow' : 'opacity-40',
        )}
      >
        <ArrowUp size={17} strokeWidth={2.2} />
      </motion.button>
    </div>
  )
}
