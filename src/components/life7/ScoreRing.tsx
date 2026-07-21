import { useEffect, useId, useMemo } from 'react'
import type { ReactNode } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import type { MotionValue } from 'framer-motion'

const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]

export interface ScoreRingProps {
  /** 0–100 */
  value: number
  size?: number
  strokeWidth?: number
  /** auto tone by score scale; 'burgundy' forces alert tone */
  tone?: 'auto' | 'burgundy' | 'gradient'
  /** dashed target ring value (e.g. 85) — fades in on hover */
  ghost?: number
  /** animate fill 0→value on mount (design.md §5.2) */
  animated?: boolean
  /** center slot: node, or render-prop receiving the animated count MotionValue */
  children?: ReactNode | ((count: MotionValue<number>) => ReactNode)
  className?: string
  /** external motion value to drive the ring (0–100). Overrides internal animation. */
  driver?: MotionValue<number>
  /** called when animated value changes (integer) — keep usage rare */
  onValueChange?: (v: number) => void
}

/**
 * SVG score ring (design.md §9): gradient stroke, tick marks every 10 points,
 * optional dashed ghost target ring, animated fill + synced count-up.
 */
export default function ScoreRing({
  value,
  size = 160,
  strokeWidth = 10,
  tone = 'auto',
  ghost,
  animated = true,
  children,
  className = '',
  driver,
  onValueChange,
}: ScoreRingProps) {
  const gid = useId()
  const mv = useMotionValue(animated ? 0 : value)
  const active = driver ?? mv

  useEffect(() => {
    if (driver) return
    const controls = animate(mv, value, {
      duration: animated ? 1.45 : 0,
      ease: EASE_GLIDE,
      onUpdate: (v) => onValueChange?.(Math.round(v)),
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, animated, driver])

  const count = useTransform(active, (v) => Math.round(v))

  const geom = useMemo(() => {
    const r = (size - strokeWidth) / 2 - 4
    const c = 2 * Math.PI * r
    return { r, c, cx: size / 2, cy: size / 2 }
  }, [size, strokeWidth])

  const dashOffset = useTransform(active, (v) => geom.c * (1 - Math.max(0, Math.min(100, v)) / 100))

  // leading end-cap that travels with the fill (premium "knob" finish)
  const capX = useTransform(active, (v) => {
    const a = (Math.max(0, Math.min(100, v)) / 100) * Math.PI * 2 - Math.PI / 2
    return geom.cx + geom.r * Math.cos(a)
  })
  const capY = useTransform(active, (v) => {
    const a = (Math.max(0, Math.min(100, v)) / 100) * Math.PI * 2 - Math.PI / 2
    return geom.cy + geom.r * Math.sin(a)
  })
  const capOpacity = useTransform(active, [0, 3], [0, 1])
  const ghostOffset = useMemo(
    () => (ghost != null ? geom.c * (1 - ghost / 100) : 0),
    [ghost, geom.c],
  )

  const resolvedTone = tone === 'auto' ? (value <= 40 ? 'burgundy' : 'gradient') : tone
  const stroke = resolvedTone === 'burgundy' ? '#7E3B46' : `url(#${gid})`

  // tick marks every 10 points
  const ticks = useMemo(() => {
    const arr: { x1: number; y1: number; x2: number; y2: number }[] = []
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2
      const r1 = geom.r + strokeWidth / 2 + 3
      const r2 = r1 + 5
      arr.push({
        x1: geom.cx + r1 * Math.cos(a),
        y1: geom.cy + r1 * Math.sin(a),
        x2: geom.cx + r2 * Math.cos(a),
        y2: geom.cy + r2 * Math.sin(a),
      })
    }
    return arr
  }, [geom, strokeWidth])

  return (
    <div className={`group/score relative inline-block ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B08A3E" />
            <stop offset="52%" stopColor="#F2C14E" />
            <stop offset="100%" stopColor="#5C7A54" />
          </linearGradient>
        </defs>

        {/* track */}
        <circle cx={geom.cx} cy={geom.cy} r={geom.r} stroke="rgba(46,70,48,0.08)" strokeWidth={strokeWidth} />

        {/* ghost target ring (dashed) — fades in on hover */}
        {ghost != null && (
          <circle
            cx={geom.cx}
            cy={geom.cy}
            r={geom.r}
            stroke="#B08A3E"
            strokeOpacity="0.55"
            strokeWidth={2}
            strokeDasharray="3 7"
            strokeLinecap="round"
            strokeDashoffset={ghostOffset}
            transform={`rotate(-90 ${geom.cx} ${geom.cy})`}
            className="opacity-0 transition-opacity duration-500 ease-glide group-hover/score:opacity-100"
          />
        )}

        {/* animated fill */}
        <motion.circle
          cx={geom.cx}
          cy={geom.cy}
          r={geom.r}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={geom.c}
          style={{ strokeDashoffset: dashOffset }}
          transform={`rotate(-90 ${geom.cx} ${geom.cy})`}
        />

        {/* travelling end-cap on the fill's leading edge */}
        <motion.g style={{ x: capX, y: capY, opacity: capOpacity }}>
          <circle
            r={strokeWidth / 2 + 1.5}
            fill={resolvedTone === 'burgundy' ? '#7E3B46' : '#D9A84E'}
            stroke="#FFFDF7"
            strokeWidth={1.5}
          />
        </motion.g>

        {/* tick marks — brighten on hover */}
        <g className="opacity-60 transition-opacity duration-500 ease-glide group-hover/score:opacity-100">
          {ticks.map((t, i) => (
            <line key={i} {...t} stroke="#A79C8A" strokeWidth="0.8" strokeLinecap="round" />
          ))}
        </g>
      </svg>

      {/* center slot */}
      <div className="absolute inset-0 flex items-center justify-center">
        {typeof children === 'function' ? children(count) : children}
      </div>
    </div>
  )
}
