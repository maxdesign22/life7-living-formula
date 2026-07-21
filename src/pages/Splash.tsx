import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]
const TAGLINE = 'Seven days. One intelligent system. Better living.'
const SEG_RINGS = [40, 52, 64, 40, 52, 64, 40] as const
const SEG_OPACITY = [1, 0.85, 0.8, 0.75, 0.7, 0.62, 0.55] as const
const SEG_SWEEP = 34
const SEG_GAP = 122 / 7

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

function arcPath(cx: number, cy: number, r: number, start: number, sweep: number) {
  const [x0, y0] = polar(cx, cy, r, start)
  const [x1, y1] = polar(cx, cy, r, start + sweep)
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

/**
 * First-run splash (design.md §13): the mark assembles — segments fly in
 * from radius, 900ms, stagger 60ms — the tagline types character by
 * character (34ms/char), then dissolves into /today. Skippable on click.
 */
export default function Splash() {
  const navigate = useNavigate()
  const [typed, setTyped] = useState(0)
  const [leaving, setLeaving] = useState(false)

  const segments = useMemo(
    () =>
      SEG_RINGS.map((r, i) => ({
        i,
        d: arcPath(80, 80, r, -90 + i * (SEG_SWEEP + SEG_GAP), SEG_SWEEP),
      })),
    [],
  )

  // typewriter
  useEffect(() => {
    const start = window.setTimeout(() => {
      const iv = window.setInterval(() => {
        setTyped((t) => {
          if (t >= TAGLINE.length) {
            window.clearInterval(iv)
            return t
          }
          return t + 1
        })
      }, 34)
    }, 950)
    return () => window.clearTimeout(start)
  }, [])

  const finish = () => {
    if (leaving) return
    setLeaving(true)
    sessionStorage.setItem('life7-splash-seen', '1')
    window.setTimeout(() => navigate('/today', { replace: true }), 520)
  }

  // auto-advance after the tagline completes
  useEffect(() => {
    if (typed < TAGLINE.length) return
    const t = window.setTimeout(finish, 1100)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed])

  return (
    <motion.div
      onClick={finish}
      className="bg-sunlight-field fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center"
      animate={leaving ? { opacity: 0, filter: 'blur(8px)' } : { opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: EASE_GLIDE }}
      role="button"
      aria-label="Skip intro"
    >
      {/* assembling mark */}
      <div className="relative" style={{ width: 220, height: 220 }}>
        <svg viewBox="0 0 160 160" width="220" height="220" fill="none" className="overflow-visible">
          <defs>
            <radialGradient id="splash-sun" cx="38%" cy="34%" r="72%">
              <stop offset="0%" stopColor="#FFE9B8" />
              <stop offset="55%" stopColor="#F2C14E" />
              <stop offset="100%" stopColor="#D9A84E" />
            </radialGradient>
          </defs>
          {[40, 52, 64].map((r) => (
            <circle key={r} cx="80" cy="80" r={r} stroke="#2E4630" strokeOpacity="0.1" strokeWidth="1" />
          ))}
          <motion.circle
            cx="80"
            cy="80"
            r="28"
            fill="url(#splash-sun)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE_GLIDE }}
            style={{ transformOrigin: '80px 80px' }}
          />
          <motion.path
            d="M80 90 C 74 84, 68.5 79.5, 68.5 74 C 68.5 69.8, 71.2 67.2, 74.4 67.2 C 76.6 67.2, 78.9 68.6, 80 70.6 C 81.1 68.6, 83.4 67.2, 85.6 67.2 C 88.8 67.2, 91.5 69.8, 91.5 74 C 91.5 79.5, 86 84, 80 90 Z M80 90 C 80 94.5, 80 97.5, 80 100 M80 96.5 C 77.6 95.4, 75.9 93.6, 75.4 91.2 M80 98.5 C 82.6 97.4, 84.4 95.6, 85 93.2"
            stroke="#FFFDF7"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          />
          {segments.map((s) => (
            <motion.path
              key={s.i}
              d={s.d}
              stroke={s.i === 0 ? '#D9A84E' : '#D9B26A'}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              initial={{ opacity: 0, scale: 1.55, rotate: -26 }}
              animate={{ opacity: SEG_OPACITY[s.i], scale: 1, rotate: 0 }}
              transition={{ delay: 0.3 + s.i * 0.06, duration: 0.9, ease: EASE_GLIDE }}
              style={{ transformOrigin: '80px 80px' }}
            />
          ))}
        </svg>
      </div>

      <motion.h1
        className="font-display mt-6 text-[28px] tracking-[0.02em] text-ink"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5, ease: EASE_GLIDE }}
      >
        LIFE7
      </motion.h1>

      {/* typewriter tagline */}
      <p className="t-serif-quote mt-3 flex h-8 items-center text-ink-soft">
        <span>{TAGLINE.slice(0, typed)}</span>
        <motion.span
          className="ml-0.5 inline-block h-5 w-[2px] bg-champagne"
          animate={{ opacity: typed >= TAGLINE.length ? 0 : [1, 0, 1] }}
          transition={typed >= TAGLINE.length ? { duration: 0.4 } : { duration: 0.9, repeat: Infinity }}
        />
      </p>

      <motion.span
        className="t-label mt-10 text-ink-faint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
      >
        Tap anywhere to begin
      </motion.span>
    </motion.div>
  )
}
