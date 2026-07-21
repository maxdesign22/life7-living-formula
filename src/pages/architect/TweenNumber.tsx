import { useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { EASE_GLIDE } from './model'

export interface TweenNumberProps {
  value: number
  /** seconds (design.md §5.3: 900ms count-up, 400ms for stepper changes) */
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

/** Count-tween metric: animates from the previous value on every change, tnum aligned. */
export default function TweenNumber({
  value,
  duration = 0.9,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: TweenNumberProps) {
  const mv = useMotionValue(value)

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: EASE_GLIDE })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  const text = useTransform(mv, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`)
  return <motion.span className={className}>{text}</motion.span>
}
