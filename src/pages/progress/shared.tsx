/**
 * Progress page shared helpers: period type, count-up numerals, in-view
 * gating (charts animate on scroll into view, 20% threshold, once).
 */
import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EASE_GLIDE } from '@/pages/planner/ui'

export type Period = 'week' | 'month' | 'quarter'

export const PERIOD_OPTIONS = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
] as const

/** Animated metric numeral with tnum alignment (design.md §5.3). */
export function CountUp({
  value,
  decimals = 0,
  duration = 0.9,
  delay = 0,
  active = true,
  prefix = '',
  suffix = '',
  className,
}: {
  value: number
  decimals?: number
  duration?: number
  delay?: number
  active?: boolean
  prefix?: string
  suffix?: string
  className?: string
}) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    if (!active) return
    const from = prev.current
    const controls = animate(from, value, {
      duration,
      delay,
      ease: EASE_GLIDE,
      onUpdate: (v) => setDisplay(v),
    })
    prev.current = value
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, active])
  return (
    <span className={cn('tnum', className)}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}

/** Catmull-Rom → cubic bezier smooth path through points. */
export function smoothPath(pts: readonly { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

/** Mix two hex colors (t 0→1). */
export function mixHex(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  const m = pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.max(0, Math.min(1, t))))
  return `#${m.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
