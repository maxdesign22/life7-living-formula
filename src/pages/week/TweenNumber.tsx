import { memo, useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'

const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]

export interface TweenNumberProps {
  value: number
  /** decimals to render (default 0) */
  decimals?: number
  /** custom formatter (overrides decimals), receives the raw animated value */
  format?: (v: number) => string
  duration?: number
  delay?: number
  className?: string
}

/**
 * Count-up metric (design.md §5.3): tweens from the previous value with
 * tnum alignment. MotionValue-rendered — no React re-render per frame.
 */
function TweenNumber({ value, decimals = 0, format, duration = 0.9, delay = 0, className }: TweenNumberProps) {
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => (format ? format(v) : v.toFixed(decimals)))

  useEffect(() => {
    const controls = animate(mv, value, { duration, delay, ease: EASE_GLIDE })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, delay])

  return (
    <motion.span className={className} style={{ fontFeatureSettings: '"tnum" 1' }}>
      {text}
    </motion.span>
  )
}

export default memo(TweenNumber)
