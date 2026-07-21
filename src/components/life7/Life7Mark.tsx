import { memo, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

export type Life7MarkState = 'rest' | 'thinking' | 'celebrate'

const SEG_NAMES = ['Nutrition', 'Hydration', 'Recovery', 'Movement', 'Stress', 'Focus', 'Joy'] as const
const SEG_RINGS = [40, 52, 64, 40, 52, 64, 40] as const
const SEG_OPACITY = [1, 0.85, 0.8, 0.75, 0.7, 0.62, 0.55] as const
const SEG_SWEEP = 34
const SEG_GAP = 122 / 7
const RING_SPINS = ['animate-orbit-24', 'animate-orbit-36', 'animate-orbit-48'] as const
const RING_RADII = [40, 52, 64] as const

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

function segStart(i: number) {
  return -90 + i * (SEG_SWEEP + SEG_GAP)
}

function arcPath(cx: number, cy: number, r: number, start: number, sweep: number) {
  const [x0, y0] = polar(cx, cy, r, start)
  const [x1, y1] = polar(cx, cy, r, start + sweep)
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

export interface Life7MarkProps {
  size?: number
  state?: Life7MarkState
  showLabels?: boolean
  className?: string
  paused?: boolean
}

/**
 * The LIFE7 living mark (design.md section 7): breathing sun disc with a
 * beating seed-heart, seven orbit segments on three counter-rotating rings.
 */
function Life7MarkInner({ size = 64, state = 'rest', showLabels, className = '', paused = false }: Life7MarkProps) {
  const hero = size >= 150
  const labels = showLabels ?? hero
  const [shimmer, setShimmer] = useState<number | null>(null)

  useEffect(() => {
    if (paused || state !== 'rest') return
    let alive = true
    const tick = () => {
      if (!alive) return
      setShimmer(Math.floor(Math.random() * 7))
      window.setTimeout(() => alive && setShimmer(null), 1200)
    }
    const first = window.setTimeout(tick, 4000)
    const iv = window.setInterval(tick, 12000)
    return () => {
      alive = false
      window.clearTimeout(first)
      window.clearInterval(iv)
    }
  }, [paused, state])

  const segments = useMemo(
    () =>
      SEG_RINGS.map((r, i) => {
        const start = segStart(i)
        const mid = start + SEG_SWEEP / 2
        const [bx, by] = polar(0, 0, 8, mid)
        return { i, r, start, mid, d: arcPath(80, 80, r, start, SEG_SWEEP), bx, by }
      }),
    [],
  )

  return (
    <div
      className={`group/mark relative inline-block select-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <motion.div
        className="h-full w-full"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={paused ? { opacity: 1, scale: 1 } : { opacity: 1, scale: [1, 1.018, 1] }}
        transition={{
          opacity: { duration: 0.5, ease: 'easeOut' },
          scale: paused
            ? { duration: 0.5, ease: 'easeOut' }
            : { duration: 5.8, repeat: Infinity, ease: 'easeInOut', times: [0, 0.5, 1] },
        }}
      >
        <svg viewBox="0 0 160 160" width={size} height={size} fill="none" className="overflow-visible">
          <defs>
            <radialGradient id="life7-sun-core" cx="38%" cy="34%" r="72%">
              <stop offset="0%" stopColor="#FFE9B8" />
              <stop offset="55%" stopColor="#F2C14E" />
              <stop offset="100%" stopColor="#D9A84E" />
            </radialGradient>
            <filter id="life7-halo" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
          </defs>

          {RING_RADII.map((r) => (
            <circle key={r} cx="80" cy="80" r={r} stroke="#2E4630" strokeOpacity="0.1" strokeWidth="1" />
          ))}

          <g className={paused ? undefined : 'animate-heartbeat'} style={{ transformOrigin: '80px 80px' }}>
            <circle cx="80" cy="80" r="33" fill="#F2C14E" opacity="0.3" filter="url(#life7-halo)" />
            <circle cx="80" cy="80" r="28" fill="url(#life7-sun-core)" />
            {!paused && (
              <circle
                cx="80"
                cy="80"
                r="30"
                stroke="#F2C14E"
                strokeWidth="1.5"
                fill="none"
                className="animate-halo-ping"
                style={{ transformOrigin: '80px 80px' }}
              />
            )}
            <path
              d="M80 90 C 74 84, 68.5 79.5, 68.5 74 C 68.5 69.8, 71.2 67.2, 74.4 67.2 C 76.6 67.2, 78.9 68.6, 80 70.6 C 81.1 68.6, 83.4 67.2, 85.6 67.2 C 88.8 67.2, 91.5 69.8, 91.5 74 C 91.5 79.5, 86 84, 80 90 Z M80 90 C 80 94.5, 80 97.5, 80 100 M80 96.5 C 77.6 95.4, 75.9 93.6, 75.4 91.2 M80 98.5 C 82.6 97.4, 84.4 95.6, 85 93.2"
              stroke="#FFFDF7"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>

          {[0, 1, 2].map((ring) => (
            <g key={ring} className={paused ? undefined : RING_SPINS[ring]} style={{ transformOrigin: '80px 80px' }}>
              {segments
                .filter((s) => s.r === RING_RADII[ring])
                .map((s) => (
                  <motion.g
                    key={s.i}
                    animate={state === 'celebrate' ? { x: [0, s.bx, 0], y: [0, s.by, 0] } : { x: 0, y: 0 }}
                    transition={
                      state === 'celebrate'
                        ? { duration: 1.0, times: [0, 0.35, 1], ease: [0.22, 1, 0.36, 1] }
                        : { type: 'spring', stiffness: 120, damping: 20 }
                    }
                  >
                    <motion.path
                      d={s.d}
                      stroke={s.i === 0 ? '#D9A84E' : '#D9B26A'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      fill="none"
                      initial={false}
                      animate={
                        state === 'thinking'
                          ? { opacity: [SEG_OPACITY[s.i] * 0.4, 1, SEG_OPACITY[s.i] * 0.4] }
                          : shimmer === s.i
                            ? { opacity: [SEG_OPACITY[s.i], 1, SEG_OPACITY[s.i]] }
                            : { opacity: SEG_OPACITY[s.i] }
                      }
                      transition={
                        state === 'thinking'
                          ? { duration: 1.9, repeat: 1, delay: s.i * 0.16, ease: 'easeInOut', times: [0, 0.5, 1] }
                          : shimmer === s.i
                            ? { duration: 1.4, ease: 'easeInOut' }
                            : { duration: 0.5 }
                      }
                    />
                  </motion.g>
                ))}
            </g>
          ))}

          {state === 'celebrate' && (
            <motion.circle
              cx="80"
              cy="80"
              r="66"
              stroke="#F2C14E"
              strokeWidth="2"
              fill="none"
              initial={{ opacity: 0.8, scale: 0.9 }}
              animate={{ opacity: 0, scale: 1.22 }}
              transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: '80px 80px' }}
            />
          )}
        </svg>
      </motion.div>

      {/* segment names — revealed on mark hover only (design.md §7):
          pages that need always-readable orbit labels render their own layer */}
      {labels && (
        <div className="pointer-events-none absolute inset-0">
          {SEG_NAMES.map((name, i) => {
            const [x, y] = polar(0, 0, size * 0.64, segments[i].mid)
            return (
              <span
                key={name}
                className="t-label absolute whitespace-nowrap text-[10px] text-gold-deep opacity-0 transition-all duration-500 ease-glide group-hover/mark:opacity-90"
                style={{
                  left: size / 2 + x,
                  top: size / 2 + y,
                  transform: 'translate(-50%, -50%)',
                  transitionDelay: `${i * 40}ms`,
                }}
              >
                {name}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

const Life7Mark = memo(Life7MarkInner)
export default Life7Mark
