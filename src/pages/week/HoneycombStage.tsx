import { memo, useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import type { WeekPlan } from '@/data/demoWeek'
import DayCell, { type CellDragState } from './DayCell'
import {
  CROSS_LINK_PATHS,
  LOOP,
  LOOP_SEGMENTS,
  pointOnLoop,
  slotFor,
} from './geometry'

export interface DragInfo {
  fromDayId: string
  targetDayId: string | null
}

export interface HoneycombStageProps {
  week: WeekPlan
  /** connector surge + cell shimmer while the week rebalances */
  surge: boolean
  shimmer: boolean
  drag: DragInfo | null
  onOpenDay: (dayId: string) => void
  registerCellRef: (dayId: string, el: HTMLElement | null) => void
}

/**
 * The gold pulse that travels Mon→Sun along the chronological loop once per
 * 8 s (2.4 s travel, week.md "Idle life"), lighting each cell rim it passes.
 * Position lives on MotionValues — zero React re-renders per frame.
 */
const LoopPulse = memo(function LoopPulse({
  onPassDay,
  reducedMotion,
}: {
  onPassDay: (dayId: string, lit: boolean) => void
  reducedMotion: boolean
}) {
  const t = useMotionValue(0)
  const cx = useTransform(t, (v) => pointOnLoop(v).x)
  const cy = useTransform(t, (v) => pointOnLoop(v).y)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (reducedMotion) return undefined
    let cancelled = false
    let controls: { stop: () => void } | null = null
    const timers: number[] = []

    const run = () => {
      if (cancelled) return
      setVisible(true)
      // rim lights as the pulse reaches each cell
      for (const [id, frac] of Object.entries(LOOP.nodeFractions)) {
        timers.push(window.setTimeout(() => onPassDay(id, true), frac * 2400))
        timers.push(window.setTimeout(() => onPassDay(id, false), frac * 2400 + 400))
      }
      controls = animate(t, 1, {
        duration: 2.4,
        ease: 'linear',
        onComplete: () => {
          t.set(0)
          setVisible(false)
          timers.push(window.setTimeout(run, 8000))
        },
      })
    }
    timers.push(window.setTimeout(run, 1600))
    return () => {
      cancelled = true
      controls?.stop()
      timers.forEach((id) => window.clearTimeout(id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion])

  if (reducedMotion) return null
  return (
    <motion.g style={{ opacity: visible ? 1 : 0 }} transition={{ duration: 0.25 }}>
      <motion.circle cx={cx} cy={cy} r={10} fill="rgba(242,193,78,0.42)" />
      <motion.circle
        cx={cx}
        cy={cy}
        r={4.5}
        fill="#F2C14E"
        style={{ filter: 'drop-shadow(0 0 6px rgba(242,193,78,0.9))' }}
      />
    </motion.g>
  )
})

/**
 * The honeycomb stage (week.md): connector web underneath (chronological
 * loop + three faint cross-links, gold dash layer flowing clockwise), seven
 * breathing cells, traveling pulse, hover relationship focus.
 */
function HoneycombStage({ week, surge, shimmer, drag, onOpenDay, registerCellRef }: HoneycombStageProps) {
  const reducedMotion = useReducedMotion() ?? false
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [pulseDay, setPulseDay] = useState<string | null>(null)
  const timerRef = useRef<number[]>([])

  useEffect(() => () => timerRef.current.forEach((id) => window.clearTimeout(id)), [])

  const handlePassDay = (dayId: string, lit: boolean) => {
    setPulseDay((cur) => (lit ? dayId : cur === dayId ? null : cur))
  }

  const touchHover = (from: string, to: string) => hoveredId !== null && (from === hoveredId || to === hoveredId)

  return (
    <div className="relative" style={{ width: 900, height: 640 }}>
      {/* connector web — beneath the cells */}
      <svg
        viewBox="0 0 900 640"
        className="absolute inset-0 h-full w-full"
        style={{ opacity: hoveredId ? 0.8 : 1, transition: 'opacity 200ms' }}
        aria-hidden="true"
      >
        {/* faint cross-links through the heart */}
        {CROSS_LINK_PATHS.map((l) => (
          <path
            key={`${l.from}-${l.to}`}
            d={l.path}
            fill="none"
            stroke={surge ? 'rgba(176,138,62,0.62)' : 'rgba(46,70,48,0.18)'}
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transition: 'stroke 300ms' }}
          />
        ))}
        {/* chronological loop — base track */}
        <path
          d={LOOP.path}
          fill="none"
          stroke={surge ? 'rgba(217,178,106,0.55)' : 'rgba(46,70,48,0.22)'}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ transition: 'stroke 300ms' }}
        />
        {/* gold dash overlay — flows clockwise, 9 s linear infinite (surges on optimise) */}
        <path
          d={LOOP.path}
          fill="none"
          stroke={surge ? '#B08A3E' : 'rgba(176,138,62,0.72)'}
          strokeWidth={surge ? 3.5 : 2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="10 14"
          className={reducedMotion ? undefined : 'week-dash-flow'}
          style={{
            transition: 'stroke 300ms',
            animationDuration: surge ? '1.2s' : undefined,
            filter: surge ? 'drop-shadow(0 0 6px rgba(176,138,62,0.8))' : undefined,
          }}
        />
        {/* hover relationship focus — segments touching the hovered day brighten gold */}
        {hoveredId &&
          LOOP_SEGMENTS.filter((s) => touchHover(s.from, s.to)).map((s) => (
            <path
              key={`h-${s.from}-${s.to}`}
              d={s.path}
              fill="none"
              stroke="rgba(176,138,62,0.75)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}
        {hoveredId &&
          CROSS_LINK_PATHS.filter((l) => touchHover(l.from, l.to)).map((l) => (
            <path
              key={`hx-${l.from}-${l.to}`}
              d={l.path}
              fill="none"
              stroke="rgba(176,138,62,0.62)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ))}
        {/* the traveling pulse */}
        <LoopPulse onPassDay={handlePassDay} reducedMotion={reducedMotion} />
      </svg>

      {/* the seven cells */}
      {week.days.map((day) => {
        const slot = slotFor(day.id)
        const dragState: CellDragState = drag
          ? drag.fromDayId === day.id
            ? 'source'
            : drag.targetDayId === day.id
              ? 'target'
              : 'valid'
          : 'none'
        return (
          <DayCell
            key={day.id}
            day={day}
            slot={slot}
            hovered={hoveredId === day.id}
            dimmed={hoveredId !== null && hoveredId !== day.id}
            pulseLit={pulseDay === day.id}
            shimmer={shimmer}
            dragState={dragState}
            reducedMotion={reducedMotion}
            onOpen={onOpenDay}
            onHover={setHoveredId}
            registerRef={registerCellRef}
          />
        )
      })}
    </div>
  )
}

export default memo(HoneycombStage)
