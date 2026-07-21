/**
 * Zone F — About LIFE7 (settings.md): centered composition — the mark at
 * 96 px, wordmark, the tagline typed in on view, version label, credit line.
 * Easter egg: seven clicks on the mark → celebrate + the Joy toast.
 */
import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { GlassCard, Life7Mark, useToast } from '@/components/life7'
import type { Life7MarkState } from '@/components/life7'

const TAGLINE = 'Seven days. One intelligent system. Better living.'

export default function About() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const { toast } = useToast()
  const [typed, setTyped] = useState(0)
  const [clicks, setClicks] = useState(0)
  const [markState, setMarkState] = useState<Life7MarkState>('rest')

  // tagline types in character-by-character (34 ms/char) once visible
  useEffect(() => {
    if (!inView) return
    let t = 0
    const iv = window.setInterval(() => {
      t += 1
      setTyped(t)
      if (t >= TAGLINE.length) window.clearInterval(iv)
    }, 34)
    return () => window.clearInterval(iv)
  }, [inView])

  const handleMarkClick = () => {
    const next = clicks + 1
    setClicks(next)
    if (next >= 7) {
      setClicks(0)
      setMarkState('celebrate')
      toast('You found the seventh segment — Joy.', { tone: 'gold' })
      window.setTimeout(() => setMarkState('rest'), 1600)
    }
  }

  return (
    <GlassCard flat className="p-6">
      <div ref={ref} className="flex flex-col items-center py-4 text-center">
        <motion.button
          type="button"
          onClick={handleMarkClick}
          aria-label="LIFE7 mark"
          className="cursor-pointer rounded-full"
          whileTap={{ scale: 0.94 }}
        >
          <Life7Mark size={96} state={markState} />
        </motion.button>
        <p className="mt-3 font-display text-[22px] tracking-[0.02em] text-ink">LIFE7</p>
        <p className="t-serif-quote mt-2 min-h-[30px] text-[17px] text-ink-soft" aria-label={TAGLINE}>
          {TAGLINE.slice(0, typed)}
          {typed < TAGLINE.length && <span className="animate-caret-blink text-gold-deep">|</span>}
        </p>
        <span className="t-label mt-3 rounded-r-pill bg-cream px-3 py-1 text-[9px] text-ink-soft">
          Version 0.9 · Prototype
        </span>
        <p className="t-ui-sm mt-3 font-medium text-ink-faint">
          Designed as a living system — light, nature, rhythm, and you.
        </p>
      </div>
    </GlassCard>
  )
}
