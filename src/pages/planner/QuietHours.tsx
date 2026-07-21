/**
 * Zone D — Quiet hours & preferences (planner.md): the 22:30–06:30 quiet
 * window rendered as a mini moon arc with two draggable handles (live
 * labels), a prep-reminder lead-time segmented control, and the AILine
 * footer. `QuietHoursArc` is reused by Settings Zone C.
 */
import { useCallback, useRef, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { AILine } from '@/components/life7'
import type { QuietHours as QuietHoursState } from '@/lib/reminders'
import { PREP_LEAD_OPTIONS, PLANNER_FOOTER_LINE } from '@/lib/reminders'
import { SectionHeader, SegmentedControl, fmtTime } from './ui'

const CX = 110
const CY = 104
const R = 74

function polar(deg: number, r = R): [number, number] {
  const a = (deg * Math.PI) / 180
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)]
}

/** minutes since midnight → dial degrees (00:00 at top, clockwise). */
const minToDeg = (m: number) => (m / 1440) * 360 - 90
/** dial degrees → minutes since midnight. */
const degToMin = (deg: number) => {
  const norm = ((deg + 90) % 360 + 360) % 360
  return Math.round((norm / 360) * 1440 / 5) * 5
}

function arcPath(startDeg: number, endDeg: number): string {
  const [x0, y0] = polar(startDeg)
  const [x1, y1] = polar(endDeg)
  const sweep = ((endDeg - startDeg) % 360 + 360) % 360
  const large = sweep > 180 ? 1 : 0
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

export function QuietHoursArc({
  value,
  onChange,
}: {
  value: QuietHoursState
  onChange: (v: QuietHoursState) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null)

  const startDeg = minToDeg(value.startMinutes)
  const endDeg = minToDeg(value.endMinutes)

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number, handle: 'start' | 'end') => {
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const x = ((clientX - rect.left) / rect.width) * 220
      const y = ((clientY - rect.top) / rect.height) * 190
      const deg = (Math.atan2(y - CY, x - CX) * 180) / Math.PI
      const minutes = degToMin(deg)
      if (handle === 'start') {
        // start stays in the evening half (12:00 → 23:55)
        const clamped = minutes < 720 ? 720 : Math.min(1435, minutes)
        onChange({ ...value, startMinutes: clamped })
      } else {
        // end stays in the morning half (00:00 → 11:55)
        const clamped = minutes > 715 && minutes < 720 + 360 ? 0 : Math.min(715, minutes)
        onChange({ ...value, endMinutes: clamped >= 720 ? 0 : clamped })
      }
    },
    [value, onChange],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      updateFromPointer(e.clientX, e.clientY, dragging)
    },
    [dragging, updateFromPointer],
  )

  const [sx, sy] = polar(startDeg)
  const [ex, ey] = polar(endDeg)

  return (
    <div className="select-none">
      <svg
        ref={svgRef}
        viewBox="0 0 220 190"
        className="mx-auto w-full max-w-[240px] touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDragging(null)}
        onPointerLeave={() => setDragging(null)}
        role="slider"
        aria-label={`Quiet hours from ${fmtTime(value.startMinutes)} to ${fmtTime(value.endMinutes)}`}
      >
        <defs>
          <linearGradient id="quiet-arc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#D9B26A" />
            <stop offset="55%" stopColor="#2E4630" />
            <stop offset="100%" stopColor="#D9B26A" />
          </linearGradient>
        </defs>

        {/* full-day track */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#F3EBDA" strokeWidth="6" />
        {/* hour dots at 00 / 06 / 12 / 18 */}
        {[0, 360, 720, 1080].map((m) => {
          const [dx, dy] = polar(minToDeg(m), R)
          return <circle key={m} cx={dx} cy={dy} r="1.6" fill="#A79C8A" />
        })}

        {/* quiet window arc */}
        <path d={arcPath(startDeg, endDeg)} fill="none" stroke="url(#quiet-arc)" strokeWidth="6" strokeLinecap="round" />

        {/* moon at midnight (top), sun at noon (bottom) */}
        <Moon size={13} strokeWidth={1.5} className="text-forest" x={CX - 6.5} y={CY - R - 26} />
        <Sun size={13} strokeWidth={1.5} className="text-gold-deep" x={CX - 6.5} y={CY + R + 12} />

        {/* start handle (evening) */}
        <g
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture?.(e.pointerId)
            setDragging('start')
          }}
          className="cursor-grab active:cursor-grabbing"
        >
          <circle cx={sx} cy={sy} r="11" fill="#FFFDF7" stroke="#D9B26A" strokeWidth="2" />
          <circle cx={sx} cy={sy} r="3" fill="#D9B26A" />
        </g>
        {/* end handle (morning) */}
        <g
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture?.(e.pointerId)
            setDragging('end')
          }}
          className="cursor-grab active:cursor-grabbing"
        >
          <circle cx={ex} cy={ey} r="11" fill="#FFFDF7" stroke="#D9B26A" strokeWidth="2" />
          <circle cx={ex} cy={ey} r="3" fill="#5C7A54" />
        </g>
      </svg>
      <div className="mt-1 flex items-center justify-center gap-4">
        <span className="t-ui-sm text-ink-soft">
          From <span className="tnum font-bold text-ink">{fmtTime(value.startMinutes)}</span>
        </span>
        <span className="h-3 w-px bg-line" />
        <span className="t-ui-sm text-ink-soft">
          To <span className="tnum font-bold text-ink">{fmtTime(value.endMinutes)}</span>
        </span>
      </div>
    </div>
  )
}

export default function QuietHoursPanel({
  quietHours,
  onQuietHours,
  leadMinutes,
  onLeadMinutes,
}: {
  quietHours: QuietHoursState
  onQuietHours: (v: QuietHoursState) => void
  leadMinutes: number
  onLeadMinutes: (m: number) => void
}) {
  return (
    <section aria-label="Quiet hours and preferences">
      <SectionHeader>Quiet hours</SectionHeader>
      <QuietHoursArc value={quietHours} onChange={onQuietHours} />
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="t-ui-sm font-bold text-ink">Prep reminder lead time</span>
        <SegmentedControl
          id="prep-lead"
          options={PREP_LEAD_OPTIONS.map((m) => ({ value: String(m), label: `${m} min` }))}
          value={String(leadMinutes)}
          onChange={(v) => onLeadMinutes(Number(v))}
        />
      </div>
      <AILine className="mt-5 text-[16px] text-ink-soft" delay={0.2}>
        {PLANNER_FOOTER_LINE}
      </AILine>
    </section>
  )
}
