/* eslint-disable react-refresh/only-export-components -- timeline geometry is shared with Planner interactions */
/**
 * Zone A — the Sunlight Timeline (planner.md): a vertical spine rendered as a
 * gradient of daylight (sunrise gold → champagne midday → sage dusk → forest
 * night), a breathing sun dot at "now" (14:20 demo time) creeping in real
 * time, and event nodes alternating sides on 24px curved stems.
 *
 * Nodes drag vertically to reschedule (5-min snap + recalculation shimmer),
 * tap to expand in place, and expose their per-type actions.
 */
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import { Check, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import type { TimelineEvent } from '@/lib/reminders'
import { isPast } from '@/lib/reminders'
import { EASE_GLIDE, fmtTime } from './ui'
import { EVENT_VISUALS } from './eventVisuals'

export const START_MIN = 6 * 60 + 30 // 06:30
export const END_MIN = 23 * 60 // 23:00
export const PX_PER_MIN = 1.25
export const TIMELINE_HEIGHT = (END_MIN - START_MIN) * PX_PER_MIN

const HOUR_TICKS = [7, 9, 11, 13, 15, 17, 19, 21, 23]

export function yOf(minutes: number): number {
  return (minutes - START_MIN) * PX_PER_MIN
}

const snap5 = (v: number) => Math.round(v / 5) * 5

export interface TimelineAction {
  kind: 'done' | 'glass' | 'view' | 'cook' | 'route'
  event: TimelineEvent
}

interface RowProps {
  mobile?: boolean
  event: TimelineEvent
  side: 'left' | 'right'
  nowMinutes: number
  entranceDelay: number
  expanded: boolean
  shimmerNonce: number
  shimmerIndex: number
  onToggleExpand: () => void
  onAction: (a: TimelineAction) => void
  onDragPreview: (id: string, minutes: number) => void
  onDragSettle: (id: string, minutes: number) => void
  renderExpanded?: (event: TimelineEvent) => ReactNode
}

function EventRow({
  mobile = false,
  event,
  side,
  nowMinutes,
  entranceDelay,
  expanded,
  shimmerNonce,
  shimmerIndex,
  onToggleExpand,
  onAction,
  onDragPreview,
  onDragSettle,
  renderExpanded,
}: RowProps) {
  const [dragging, setDragging] = useState(false)
  const visual = EVENT_VISUALS[event.type]
  const Icon = visual.icon
  const past = isPast(event, nowMinutes)
  const done = event.done

  const handleDrag = (_: unknown, info: PanInfo) => {
    const minutes = Math.min(END_MIN - 5, Math.max(START_MIN, snap5(event.minutes + info.offset.y / PX_PER_MIN)))
    onDragPreview(event.id, minutes)
  }
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setDragging(false)
    const minutes = Math.min(END_MIN - 5, Math.max(START_MIN, snap5(event.minutes + info.offset.y / PX_PER_MIN)))
    onDragSettle(event.id, minutes)
  }

  const actionButton = (() => {
    const label = event.actionLabel
    if (!label) return null
    if (label === 'Done') {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAction({ kind: 'done', event })
          }}
          className="t-ui-sm rounded-r-pill px-3 py-1.5 font-semibold text-forest underline-offset-4 decoration-champagne decoration-[1.5px] hover:underline"
        >
          {done ? 'Done ✓' : 'Done'}
        </button>
      )
    }
    if (label === '+1 glass') {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAction({ kind: 'glass', event })
          }}
          className="t-ui-sm rounded-r-pill bg-sage-mist px-3 py-1.5 font-semibold text-forest transition-colors hover:bg-sage"
        >
          +1 glass
        </button>
      )
    }
    if (label === 'View') {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAction({ kind: 'view', event })
          }}
          className="t-ui-sm rounded-r-pill bg-cream px-3 py-1.5 font-semibold text-forest transition-colors hover:bg-sand"
        >
          View
        </button>
      )
    }
    if (label === 'Mark taken') {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAction({ kind: 'done', event })
          }}
          className={cn(
            't-ui-sm rounded-r-pill px-3 py-1.5 font-semibold transition-colors',
            done ? 'bg-sage-mist text-forest' : 'bg-cream text-forest hover:bg-sand',
          )}
        >
          {done ? 'Taken ✓' : 'Mark taken'}
        </button>
      )
    }
    if (label.startsWith('Start cooking')) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAction({ kind: 'cook', event })
          }}
          className="t-ui-sm bg-sunrise-gold rounded-r-pill px-3 py-1.5 font-semibold text-ink shadow-e-1 transition-shadow hover:shadow-gold-glow"
        >
          {label}
        </button>
      )
    }
    if (label === 'Open list') {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAction({ kind: 'route', event })
          }}
          className="t-ui-sm rounded-r-pill bg-cream px-3 py-1.5 font-semibold text-forest transition-colors hover:bg-sand"
        >
          Open list
        </button>
      )
    }
    return null
  })()

  return (
    <div
      className={cn(
        'left-0 w-full transition-[top] duration-500 ease-glide',
        mobile ? 'relative mb-3 pl-11' : 'absolute',
      )}
      style={{ top: mobile ? undefined : yOf(event.minutes), zIndex: dragging ? 40 : 10 }}
    >
      {/* node ring on the spine */}
      <motion.div
        className={cn(
          'absolute flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 bg-soft-white shadow-e-1 transition-colors duration-300',
          mobile ? 'left-4 top-7 -translate-x-1/2 -translate-y-1/2' : 'left-1/2 -translate-x-1/2 -translate-y-1/2',
          done && 'border-sage bg-sage-mist',
        )}
        style={{ borderColor: done ? '#C9D6C0' : visual.color }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: entranceDelay, type: 'spring', stiffness: 300, damping: 20 }}
      >
        {done ? <Check size={10} strokeWidth={2.5} className="text-green" /> : <Icon size={10} strokeWidth={2} className="" color={visual.color} />}
      </motion.div>

      {/* 24px curved stem from ring to card */}
      {!mobile && <svg
        className={cn('absolute top-[-9px] h-[18px] w-[36px]', side === 'right' ? 'left-[calc(50%+10px)]' : 'right-[calc(50%+10px)]')}
        viewBox="0 0 36 18"
        fill="none"
        aria-hidden="true"
      >
        <motion.path
          d={side === 'right' ? 'M2 9 C 14 9 20 3 34 3' : 'M34 9 C 22 9 16 3 2 3'}
          stroke={visual.color}
          strokeOpacity="0.45"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: entranceDelay + 0.1, duration: 0.4, ease: EASE_GLIDE }}
        />
      </svg>}

      {/* event card */}
      <motion.div
        className={cn(
          mobile ? 'relative w-full' : 'absolute w-[min(300px,calc(50%-52px))]',
          !mobile && (side === 'right' ? 'left-[calc(50%+46px)]' : 'right-[calc(50%+46px)]'),
        )}
        style={{ top: mobile ? 0 : -30 }}
        initial={{ opacity: 0, scale: 0.82, y: 10 }}
        animate={{ opacity: mobile ? (past && !done ? 0.9 : done ? 0.96 : 1) : past && !done ? 0.45 : done ? 0.85 : 1, scale: 1, y: 0 }}
        transition={{ delay: entranceDelay, duration: 0.5, ease: EASE_GLIDE }}
      >
        <motion.div
          drag={mobile ? false : 'y'}
          dragMomentum={false}
          dragSnapToOrigin
          onDragStart={() => setDragging(true)}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onTap={onToggleExpand}
          whileDrag={{ scale: 1.03 }}
          className={cn(
            'glass relative select-none overflow-hidden rounded-r-lg border p-4 shadow-e-1 transition-shadow duration-220 ease-soft hover:shadow-e-2',
            mobile ? 'cursor-pointer border-line bg-soft-white/90' : 'cursor-grab border-transparent active:cursor-grabbing',
            done && (mobile ? 'border-sage/70 bg-sage-mist/85' : 'bg-sage-mist/60'),
            dragging && 'shadow-e-2',
          )}
        >
          {/* recalculation shimmer cascade */}
          {shimmerNonce > 0 && (
            <span
              key={shimmerNonce}
              className="bg-light-wave animate-wave-sweep pointer-events-none absolute inset-y-0 left-0 w-[35%]"
              style={{ animationDelay: `${shimmerIndex * 0.3}s` }}
            />
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="t-label text-gold-deep">{event.time}</span>
            <GripVertical size={14} strokeWidth={1.5} className="text-ink-faint" aria-hidden="true" />
          </div>
          <p className="t-ui-sm mt-1 font-bold text-ink">{event.title}</p>
          <p className="t-ui-sm mt-0.5 font-medium text-ink-soft">{event.detail}</p>
          {actionButton && (
            <div className="mt-2.5 flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
              {actionButton}
            </div>
          )}
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.38, ease: EASE_GLIDE }}
                className="overflow-hidden"
              >
                <div className="mt-3 border-t border-line pt-3">{renderExpanded?.(event)}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  )
}

export interface SunlightTimelineProps {
  events: readonly TimelineEvent[]
  nowMinutes: number
  onAction: (a: TimelineAction) => void
  onReschedule: (id: string, minutes: number) => void
  shimmerFrom: { minutes: number; nonce: number } | null
  expandedId: string | null
  onToggleExpand: (id: string | null) => void
  renderExpanded?: (event: TimelineEvent) => ReactNode
}

export default function SunlightTimeline({
  events,
  nowMinutes,
  onAction,
  onReschedule,
  shimmerFrom,
  expandedId,
  onToggleExpand,
  renderExpanded,
}: SunlightTimelineProps) {
  const isMobile = useIsMobile()
  const [dragPreview, setDragPreview] = useState<{ id: string; minutes: number } | null>(null)
  // the sun creeps in real time — +1 minute every 60 s
  const [creep, setCreep] = useState(0)
  useEffect(() => {
    const iv = window.setInterval(() => setCreep((c) => c + 1), 60_000)
    return () => window.clearInterval(iv)
  }, [])

  const now = nowMinutes + creep
  const sunY = yOf(now)

  const handleDragPreview = (id: string, minutes: number) => setDragPreview({ id, minutes })
  const handleDragSettle = (id: string, minutes: number) => {
    setDragPreview(null)
    if (minutes !== events.find((e) => e.id === id)?.minutes) onReschedule(id, minutes)
  }

  const rows = useMemo(
    () =>
      events.map((event, i) => {
        const fraction = yOf(event.minutes) / TIMELINE_HEIGHT
        return {
          event,
          side: (i % 2 === 0 ? 'left' : 'right') as 'left' | 'right',
          delay: 0.25 + fraction * 1.0,
          shimmerIndex: shimmerFrom ? Math.max(0, events.filter((e) => e.minutes >= shimmerFrom.minutes && e.minutes < event.minutes).length) : 0,
        }
      }),
    [events, shimmerFrom],
  )

  if (isMobile) {
    const completed = events.filter((event) => event.done).length
    return (
      <div className="relative mx-auto w-full max-w-[520px]">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-r-lg border border-champagne/25 bg-soft-white/90 px-4 py-3 shadow-e-1">
          <div>
            <span className="t-label text-gold-deep">Today’s living timeline</span>
            <p className="t-ui-sm mt-1 font-semibold text-ink">{completed} complete · {events.length - completed} still ahead</p>
          </div>
          <span className="t-label tnum rounded-r-pill bg-forest px-3 py-1.5 text-soft-white">Now {fmtTime(now)}</span>
        </div>
        <div className="relative">
          <span className="absolute bottom-5 left-[15px] top-4 w-[2px] rounded-r-pill bg-gradient-to-b from-sunlight via-champagne to-forest/70" aria-hidden="true" />
          {rows.map(({ event, side, delay, shimmerIndex }) => (
            <EventRow
              key={event.id}
              mobile
              event={event}
              side={side}
              nowMinutes={now}
              entranceDelay={delay * 0.45}
              expanded={expandedId === event.id}
              shimmerNonce={shimmerFrom && event.minutes >= shimmerFrom.minutes ? shimmerFrom.nonce : 0}
              shimmerIndex={shimmerIndex}
              onToggleExpand={() => onToggleExpand(expandedId === event.id ? null : event.id)}
              onAction={onAction}
              onDragPreview={handleDragPreview}
              onDragSettle={handleDragSettle}
              renderExpanded={renderExpanded}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative mx-auto w-full max-w-[680px]" style={{ height: TIMELINE_HEIGHT + 40 }}>
      {/* spine — gradient of daylight, draws top → bottom */}
      <svg
        className="absolute left-1/2 top-0 -translate-x-1/2"
        width="24"
        height={TIMELINE_HEIGHT}
        viewBox={`0 0 24 ${TIMELINE_HEIGHT}`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="daylight-spine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F2C14E" />
            <stop offset="45%" stopColor="#F7DFA7" />
            <stop offset="76%" stopColor="#C9D6C0" />
            <stop offset="100%" stopColor="#2E4630" />
          </linearGradient>
        </defs>
        <motion.rect
          x="10.5"
          y="0"
          width="3"
          height={TIMELINE_HEIGHT}
          rx="1.5"
          fill="url(#daylight-spine)"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          style={{ transformOrigin: 'center top' }}
          transition={{ duration: 1.2, ease: EASE_GLIDE }}
        />
      </svg>

      {/* hour ticks every 2 h, labels alternating sides */}
      {HOUR_TICKS.map((h, i) => {
        const y = yOf(h * 60)
        const leftSide = i % 2 === 0
        return (
          <motion.div
            key={h}
            className="absolute left-1/2 flex items-center"
            style={{ top: y }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + (y / TIMELINE_HEIGHT) * 1.0, duration: 0.4 }}
          >
            <span className="absolute h-px w-[26px] -translate-x-1/2 bg-ink-faint/50" />
            <span
              className={cn(
                't-label absolute whitespace-nowrap text-ink-faint',
                leftSide ? 'right-[calc(100%+14px)]' : 'left-[calc(100%+14px)]',
              )}
            >
              {fmtTime(h * 60)}
            </span>
          </motion.div>
        )
      })}

      {/* sun dot — 18px glowing orb, breathing halo, faint ray, creeps in real time */}
      <motion.div
        className="absolute left-1/2 z-30"
        style={{ top: sunY, transition: 'top 60s linear' }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.3, type: 'spring', stiffness: 260, damping: 16 }}
      >
        <div className="relative -translate-x-1/2 -translate-y-1/2">
          {/* halo ping on entrance + breathing halo */}
          <motion.span
            className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sunlight/35"
            animate={{ scale: [1, 1.3, 1], opacity: [0.55, 0.18, 0.55] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="bg-sun-core relative block h-[18px] w-[18px] rounded-full shadow-gold-glow" />
          {/* faint horizontal ray */}
          <span className="absolute left-1/2 top-1/2 h-px w-[130px] -translate-x-1/2 bg-gradient-to-r from-transparent via-sunlight/60 to-transparent" />
          <span className="t-label absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-r-pill bg-soft-white/85 px-2 py-0.5 text-gold-deep shadow-e-1">
            {fmtTime(now)}
          </span>
        </div>
      </motion.div>

      {/* live drag time chip */}
      <AnimatePresence>
        {dragPreview && (
          <motion.div
            key="drag-chip"
            className="absolute left-1/2 z-40"
            style={{ top: yOf(dragPreview.minutes) }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.18 }}
          >
            <span className="t-metric-sm tnum absolute left-[calc(100%+14px)] -translate-y-1/2 whitespace-nowrap rounded-r-pill bg-forest px-2.5 py-1 text-soft-white shadow-e-2">
              {fmtTime(dragPreview.minutes)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* event rows */}
      {rows.map(({ event, side, delay, shimmerIndex }) => (
        <EventRow
          key={event.id}
          event={event}
          side={side}
          nowMinutes={now}
          entranceDelay={delay}
          expanded={expandedId === event.id}
          shimmerNonce={shimmerFrom && event.minutes >= shimmerFrom.minutes ? shimmerFrom.nonce : 0}
          shimmerIndex={shimmerIndex}
          onToggleExpand={() => onToggleExpand(expandedId === event.id ? null : event.id)}
          onAction={onAction}
          onDragPreview={handleDragPreview}
          onDragSettle={handleDragSettle}
          renderExpanded={renderExpanded}
        />
      ))}
    </div>
  )
}
