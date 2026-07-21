import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useInView } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AILine, GlassCard, ScoreRing, useToast } from '@/components/life7'
import type { PantryState } from '@/lib/pantry'
import { getWasteStats } from '@/lib/pantry'
import { EASE_GLIDE } from './bits'

function CountUp({ value, decimals = 0, prefix = '', suffix = '' }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState('0')
  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, {
      duration: 0.9,
      ease: EASE_GLIDE,
      onUpdate: (v) => setDisplay(v.toFixed(decimals)),
    })
    return () => controls.stop()
  }, [inView, value, decimals])
  return (
    <span ref={ref} className="tnum whitespace-nowrap">
      {prefix}
      {display}
      {suffix}
    </span>
  )
}

/**
 * Zone C — waste reduction panel (pantry.md): 86 ring + quote, three
 * count-up stats, and the rotating AI tip with a real "Do it" action.
 */
export default function WastePanel({
  pantry,
  onFreezeBananas,
}: {
  pantry: PantryState
  onFreezeBananas: () => void
}) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const stats = getWasteStats(pantry)
  const [tipIndex, setTipIndex] = useState(0)

  const tips = [
    { text: stats.tip, action: stats.tipAction, run: onFreezeBananas },
    { text: 'Spinach is at 82%. Tonight’s dinner already uses 100 g of it.', action: 'View plan', run: () => navigate('/week') },
    { text: 'Oats, rice and olive oil are at 100%. Beautifully stocked.', action: 'Nice', run: () => toast('Nothing to do. Calm kitchen.', { tone: 'sage' }) },
  ]

  useEffect(() => {
    const t = window.setInterval(() => setTipIndex((i) => (i + 1) % tips.length), 10000)
    return () => window.clearInterval(t)
  }, [tips.length])

  const tip = tips[tipIndex]

  return (
    <GlassCard className="border-transparent bg-sage-mist/60 p-6 min-[768px]:p-7">
      <div className="grid items-center gap-7 min-[768px]:grid-cols-2 min-[1500px]:grid-cols-[minmax(360px,auto)_minmax(270px,1fr)_minmax(300px,1.2fr)]">
        {/* left: score */}
        <div className="flex items-center gap-5 min-[768px]:col-span-2 min-[1500px]:col-span-1">
          <ScoreRing value={stats.score} size={120} strokeWidth={9}>
            {(count) => (
              <span className="t-metric-lg tnum text-[30px] text-ink">
                <motion.span>{count}</motion.span>
              </span>
            )}
          </ScoreRing>
          <div>
            <p className="t-label text-forest">Waste reduction score</p>
            <p className="t-serif-quote mt-2 max-w-[30ch] text-[16px] leading-snug text-ink-soft">{stats.quote}</p>
          </div>
        </div>

        {/* middle: stats */}
        <div className="grid min-w-0 grid-cols-3 gap-2 min-[480px]:gap-3">
          <div className="min-w-0 rounded-r-md bg-soft-white/70 px-2 py-3.5 text-center shadow-e-1 min-[480px]:px-3">
            <p className="t-metric-lg text-[clamp(18px,1.55vw,25px)] leading-none text-forest">
              <CountUp value={stats.foodSavedKg} decimals={1} suffix=" kg" />
            </p>
            <p className="t-label mt-1 text-[9px] text-ink-soft">Food saved this month</p>
          </div>
          <div className="min-w-0 rounded-r-md bg-soft-white/70 px-2 py-3.5 text-center shadow-e-1 min-[480px]:px-3">
            <p className="t-metric-lg text-[clamp(18px,1.55vw,25px)] leading-none text-forest">
              <CountUp value={stats.moneySavedEur} decimals={2} prefix="€" />
            </p>
            <p className="t-label mt-1 text-[9px] text-ink-soft">Money saved</p>
          </div>
          <div className="min-w-0 rounded-r-md bg-soft-white/70 px-2 py-3.5 text-center shadow-e-1 min-[480px]:px-3">
            <p className="t-metric-lg text-[clamp(18px,1.55vw,25px)] leading-none text-forest">
              <CountUp value={stats.useFirstWins} />
            </p>
            <p className="t-label mt-1 text-[9px] text-ink-soft">Use-first wins</p>
          </div>
        </div>

        {/* right: rotating tip */}
        <div className="rounded-r-md bg-soft-white/70 p-4 shadow-e-1">
          <p className="t-label text-gold-deep">LIFE7 tip</p>
          <div className="mt-2 min-h-[64px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={tipIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: EASE_GLIDE }}
              >
                <AILine className="text-[16px] leading-snug">{tip.text}</AILine>
              </motion.div>
            </AnimatePresence>
          </div>
          <button
            type="button"
            onClick={tip.run}
            className="t-ui-sm mt-2 h-8 rounded-r-pill bg-forest px-4 font-bold text-soft-white shadow-e-1 transition-shadow duration-300 hover:shadow-gold-glow"
          >
            {tip.action}
          </button>
        </div>
      </div>
    </GlassCard>
  )
}
