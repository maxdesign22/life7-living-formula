/**
 * Zone B — Meal Score River (progress.md): a smooth flowing area chart of
 * meal scores across the selected period. Hand-built SVG: gold-deep stroke,
 * sunlight area fill, sage target band 70–90, day separators, min/max
 * annotations, today's breathing dot, and cursor scrub with a glass tooltip.
 */
import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { GlassCard } from '@/components/life7'
import { DEMO_WEEK } from '@/data/demoWeek'
import { DAY_NAMES_SHORT } from '@/data/profile'
import { smoothPath } from './shared'
import type { Period } from './shared'
import { EASE_GLIDE } from '@/pages/planner/ui'

const VB_W = 880
const VB_H = 320
const L = 36
const R = 20
const T = 40
const B = 34
const PLOT_W = VB_W - L - R
const PLOT_H = VB_H - T - B
const SCORE_MIN = 40
const SCORE_MAX = 100

const yOf = (score: number) => T + ((SCORE_MAX - score) / (SCORE_MAX - SCORE_MIN)) * PLOT_H

/* ------------------------------------------------------------- datasets */

const WEEK_SCORES: readonly (readonly number[])[] = [
  [80, 84, 78, 85], // Mon
  [76, 80, 74, 81], // Tue
  [76, 72, 70, 68], // Wed (Social)
  [74, 58, 75, 80], // Thu (today)
  [82, 86, 84, 92], // Fri
  [78, 82, 77, 83], // Sat
  [82, 85, 81, 88], // Sun
]

const MONTH_WOBBLE = [-3, 2, -1, 4, -2, 1, 3] as const
const MONTH_WEEK_AVGS = [74, 76, 77, 78] as const
const QUARTER_WEEK_AVGS = [68, 70, 69, 72, 71, 74, 73, 76, 75, 77, 78, 79] as const

interface RiverPoint {
  score: number
  label: string
  photo?: string
}

function dataset(period: Period): RiverPoint[] {
  if (period === 'week') {
    return WEEK_SCORES.flatMap((dayScores, di) =>
      dayScores.map((score, mi) => ({
        score,
        label: `${DAY_NAMES_SHORT[di]} · ${DEMO_WEEK.days[di].meals[mi].name}`,
        photo: DEMO_WEEK.days[di].meals[mi].photo,
      })),
    )
  }
  if (period === 'month') {
    return MONTH_WEEK_AVGS.flatMap((avg, wi) =>
      MONTH_WOBBLE.map((w, di) => ({
        score: avg + w,
        label: `Week ${21 + wi} · ${DAY_NAMES_SHORT[di]} avg`,
      })),
    )
  }
  return QUARTER_WEEK_AVGS.map((score, wi) => ({ score, label: `Week ${13 + wi} avg` }))
}

/* ---------------------------------------------------------------- chart */

export default function ScoreRiver({ period }: { period: Period }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const [hover, setHover] = useState<number | null>(null)

  const data = useMemo(() => dataset(period), [period])
  const step = PLOT_W / (data.length - 1)
  const pts = useMemo(() => data.map((d, i) => ({ x: L + i * step, y: yOf(d.score) })), [data, step])
  const line = useMemo(() => smoothPath(pts), [pts])
  const baseline = yOf(SCORE_MIN)
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(2)} ${baseline} L ${pts[0].x.toFixed(2)} ${baseline} Z`

  const minIdx = data.reduce((a, d, i) => (d.score < data[a].score ? i : a), 0)
  const maxIdx = data.reduce((a, d, i) => (d.score > data[a].score ? i : a), 0)
  const todayIdx = period === 'week' ? 14 : -1 // Thursday snack — the point the day is moving toward

  const handleMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * VB_W
    const idx = Math.round((x - L) / step)
    setHover(Math.max(0, Math.min(data.length - 1, idx)))
  }

  const annotation = (idx: number, caption: string, above: boolean) => {
    const p = pts[idx]
    const tx = above ? Math.min(p.x + 14, VB_W - 170) : Math.max(p.x - 150, L)
    const ty = above ? p.y - 16 : p.y + 44
    return (
      <motion.g
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 1.7, duration: 0.5 }}
      >
        <line x1={p.x} y1={p.y + (above ? -8 : 8)} x2={above ? tx + 4 : tx + 148} y2={ty + (above ? 8 : -6)} stroke="#A79C8A" strokeWidth="0.8" strokeDasharray="2 3" />
        <text x={tx} y={ty} className="fill-ink" fontFamily="Fraunces, Georgia, serif" fontSize="17" fontStyle="italic">
          {data[idx].score}
        </text>
        <text x={tx} y={ty + 14} className="fill-ink-soft" fontSize="9.5" fontWeight="600" letterSpacing="0.02em">
          {caption}
        </text>
      </motion.g>
    )
  }

  return (
    <GlassCard flat size="xl" className="relative overflow-hidden p-5 min-[768px]:p-6" >
      <div ref={ref}>
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <div>
            <span className="t-label text-gold-deep">Meal score river</span>
            <p className="t-ui-sm mt-1 font-medium text-ink-soft">
              {period === 'week' ? '28 meals across Week 24' : period === 'month' ? 'Daily averages across 4 weeks' : 'Weekly averages across 12 weeks'}
            </p>
          </div>
          <span className="t-label hidden text-ink-faint min-[768px]:block">Target band 70–90</span>
        </div>

        <div className="relative h-[320px]">
          <AnimatePresence initial={false}>
            <motion.div
              key={period}
              className="absolute inset-0"
              initial={{ opacity: 0, filter: 'blur(6px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(6px)' }}
              transition={{ duration: 0.6, ease: EASE_GLIDE }}
            >
              <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="h-full w-full" onMouseLeave={() => setHover(null)}>
                <defs>
                  <linearGradient id="river-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(242,193,78,0.30)" />
                    <stop offset="100%" stopColor="rgba(242,193,78,0)" />
                  </linearGradient>
                </defs>

                {/* target band 70–90 */}
                <motion.rect
                  x={L}
                  y={yOf(90)}
                  width={PLOT_W}
                  height={yOf(70) - yOf(90)}
                  rx="6"
                  fill="rgba(201,214,192,0.22)"
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
                {/* baseline */}
                <line x1={L} y1={baseline} x2={VB_W - R} y2={baseline} stroke="rgba(46,70,48,0.14)" strokeWidth="1" />

                {/* day separators (week) */}
                {period === 'week' &&
                  DAY_NAMES_SHORT.map((d, di) => {
                    const x = L + di * 4 * step
                    return (
                      <g key={d}>
                        {di > 0 && (
                          <line x1={x - step / 2} y1={T - 6} x2={x - step / 2} y2={baseline} stroke="rgba(46,70,48,0.10)" strokeWidth="1" strokeDasharray="2 5" />
                        )}
                        <text x={x + step} y={T - 14} textAnchor="middle" className="fill-ink-faint" fontSize="9.5" fontWeight="700" letterSpacing="0.12em">
                          {d.toUpperCase()}
                        </text>
                      </g>
                    )
                  })}

                {/* area fill fades up */}
                <motion.path
                  d={area}
                  fill="url(#river-fill)"
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.4, duration: 0.8, ease: EASE_GLIDE }}
                />
                {/* the river stroke draws L→R */}
                <motion.path
                  d={line}
                  fill="none"
                  stroke="#B08A3E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={inView ? { pathLength: 1 } : {}}
                  transition={{ duration: 1.6, ease: EASE_GLIDE }}
                />

                {/* points */}
                {pts.map((p, i) => {
                  const isToday = i === todayIdx
                  const isHover = i === hover
                  if (isToday) {
                    return (
                      <g key={i}>
                        <motion.circle
                          cx={p.x}
                          cy={p.y}
                          r="9"
                          fill="rgba(242,193,78,0.35)"
                          animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0.15, 0.6] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <motion.circle
                          cx={p.x}
                          cy={p.y}
                          r={isHover ? 8 : 5.5}
                          fill="#F2C14E"
                          stroke="#FFFDF7"
                          strokeWidth="2"
                          initial={{ scale: 0 }}
                          animate={inView ? { scale: 1 } : {}}
                          transition={{ delay: 1.2, type: 'spring', stiffness: 320, damping: 16 }}
                        />
                      </g>
                    )
                  }
                  return (
                    <motion.circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={isHover ? 5.6 : 3.2}
                      fill="#FFFDF7"
                      stroke="#B08A3E"
                      strokeWidth="1.5"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={inView ? { scale: 1, opacity: 1 } : {}}
                      transition={{ delay: 0.3 + i * 0.02, type: 'spring', stiffness: 380, damping: 18 }}
                    />
                  )
                })}

                {/* hover hairline */}
                {hover != null && (
                  <line
                    x1={pts[hover].x}
                    y1={T - 6}
                    x2={pts[hover].x}
                    y2={baseline}
                    stroke="#B08A3E"
                    strokeWidth="1"
                    strokeOpacity="0.45"
                  />
                )}

                {/* annotations — canonical min & max (week) */}
                {period === 'week' && annotation(minIdx, 'Thursday lunch, before LIFE7 fix', false)}
                {period === 'week' && annotation(maxIdx, 'Friday dinner', true)}

                {/* scrub surface */}
                <rect x={L} y={T - 20} width={PLOT_W} height={PLOT_H + 20} fill="transparent" onMouseMove={handleMove} />
              </svg>

              {/* glass tooltip follows the scrub */}
              {hover != null && (
                <div
                  className="glass-strong pointer-events-none absolute z-10 w-[190px] -translate-x-1/2 rounded-r-md p-3 shadow-e-2"
                  style={{
                    left: `${(pts[hover].x / VB_W) * 100}%`,
                    top: `${Math.max(0, (pts[hover].y / VB_H) * 100 - 2)}%`,
                    transform: `translate(-50%, -100%) translateY(-10px)`,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    {data[hover].photo && (
                      <img src={`/${data[hover].photo}`} alt="" className="h-10 w-10 rounded-r-sm object-cover" />
                    )}
                    <div className="min-w-0">
                      <p className="t-metric-sm tnum text-gold-deep">{data[hover].score}</p>
                      <p className="t-ui-sm truncate font-medium text-ink">{data[hover].label}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </GlassCard>
  )
}
