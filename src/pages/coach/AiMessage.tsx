/**
 * AI Coach — one AI prose message (coach.md Zone B): glass card with a 3px
 * gold spine, Fraunces italic copy typed in at 14 ms/char, then contextual
 * cards and the mandatory action row (every AI response ends with actions).
 */
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MagneticButton } from '@/components/life7'
import type { CoachAction } from '@/data/coachScripts'
import type { CoachReply } from '@/lib/aiService'
import CoachCardView from './cards'
import type { CardHandlers } from './cards'

const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]

export interface AiMessageProps {
  id: number
  text: string
  reply: CoachReply
  typed: boolean
  applied: readonly string[]
  onTyped: (id: number) => void
  onAction: (id: number, action: CoachAction) => void
  cardHandlers: CardHandlers
}

export default function AiMessage({ id, text, reply, typed, applied, onTyped, onAction, cardHandlers }: AiMessageProps) {
  const [shown, setShown] = useState(typed ? text.length : 0)
  const doneRef = useRef(typed)

  useEffect(() => {
    if (doneRef.current) return
    const iv = window.setInterval(() => {
      setShown((s) => {
        if (s >= text.length) {
          window.clearInterval(iv)
          if (!doneRef.current) {
            doneRef.current = true
            onTyped(id)
          }
          return s
        }
        return s + 1
      })
    }, 14)
    return () => window.clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const done = typed || shown >= text.length

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.42, ease: EASE_GLIDE }}
      className="self-start"
    >
      <div className="glass max-w-full rounded-r-lg rounded-bl-[6px] border-l-[3px] border-l-champagne p-5 shadow-e-1">
        <p className="font-display text-[19px] italic leading-[1.5] text-ink">
          {text.slice(0, shown)}
          {!done && <span className="animate-caret-blink not-italic text-champagne">▍</span>}
        </p>

        {done && (
          <>
            {reply.cards.length > 0 && (
              <div className="mt-4 space-y-3">
                {reply.cards.map((card, i) => (
                  <CoachCardView key={`${card.kind}-${i}`} card={card} delay={i * 0.09} handlers={cardHandlers} />
                ))}
              </div>
            )}
            {reply.actions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                {reply.actions.map((action, i) => {
                  const isApplied = applied.includes(action.id)
                  return (
                    <motion.span
                      key={action.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 + i * 0.06, ease: EASE_GLIDE }}
                    >
                      <MagneticButton
                        size="sm"
                        variant={isApplied ? 'glass' : action.style}
                        disabled={isApplied}
                        icon={isApplied ? <Check size={13} strokeWidth={2.5} className="text-green" /> : undefined}
                        onClick={() => onAction(id, action)}
                        className={cn(isApplied && 'text-ink-faint')}
                      >
                        {action.label}
                      </MagneticButton>
                    </motion.span>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
