import { memo, useId } from 'react'
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { Check, Lock } from 'lucide-react'
import type { DayPlan } from '@/data/demoWeek'
import { DAY_NAMES_SHORT } from '@/data/profile'
import { ScoreRing } from '@/components/life7'
import { cn } from '@/lib/utils'
import DayTypeBadge from './DayTypeBadge'
import TweenNumber from './TweenNumber'
import { CELL_CORNER, CELL_R, dayTheme, heroMealOf, roundedHexPath, type CellSlot } from './geometry'

const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]
const HEX = roundedHexPath(CELL_R, CELL_CORNER)
const HEX_HALO = roundedHexPath(CELL_R + 8, CELL_CORNER)

/** Format kcal with a thin thousands separator, matching week.md micro-stats ("2 180 kcal"). */
function fmtKcal(kcal: number): string {
  return String(Math.round(kcal)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export type CellDragState = 'none' | 'source' | 'valid' | 'target'

export interface DayCellProps {
  day: DayPlan
  slot: CellSlot
  hovered: boolean
  /** another cell is hovered — this one dims slightly (relationship focus) */
  dimmed: boolean
  /** traveling pulse is lighting this cell's rim */
  pulseLit: boolean
  /** optimise wave is sweeping the colony */
  shimmer: boolean
  dragState: CellDragState
  reducedMotion: boolean
  onOpen: (dayId: string) => void
  onHover: (dayId: string | null) => void
  registerRef: (dayId: string, el: HTMLElement | null) => void
}

/**
 * One rounded hexagonal cell of the flower of seven (week.md "Cell anatomy"):
 * glass fill + per-day hue identity (rim tint, corner wash, label chip,
 * re-tinted ScoreRing), hero-meal photo medallion pinned to the ring,
 * micro-stats, status corner marks. Colony breathing is phased by
 * slot.breatheIndex (clockwise wave, center last); today carries the gold halo.
 */
function DayCell({
  day,
  slot,
  hovered,
  dimmed,
  pulseLit,
  shimmer,
  dragState,
  reducedMotion,
  onOpen,
  onHover,
  registerRef,
}: DayCellProps) {
  const tintId = useId()
  const shimId = useId()
  const isToday = day.status === 'today'
  const theme = dayTheme(day.id)
  const hero = heroMealOf(day)
  const ringVars = {
    '--day-deep': theme.deep,
    '--day-bright': theme.bright,
    '--day-strong': theme.strong,
  } as CSSProperties

  const breath = reducedMotion
    ? undefined
    : {
        scale: [1, 1.02, 1],
        transition: {
          duration: 6,
          delay: slot.breatheIndex * 0.55,
          repeat: Infinity,
          ease: 'easeInOut' as const,
        },
      }

  const statusLabel =
    day.status === 'done' ? 'done' : day.status === 'today' ? 'today, in progress' : 'planned'

  return (
    <div
      className="absolute"
      style={{
        left: `${(slot.cx / 900) * 100}%`,
        top: `${(slot.cy / 640) * 100}%`,
        width: '21.4%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* today cell is 1.12× (week.md) */}
      <div className="relative" style={isToday ? { transform: 'scale(1.12)' } : undefined}>
        {/* colony breathing — phased wave */}
        <motion.div animate={breath} className="relative">
          <motion.button
            ref={(el) => registerRef(day.id, el)}
            type="button"
            onClick={() => onOpen(day.id)}
            onMouseEnter={() => onHover(day.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(day.id)}
            onBlur={() => onHover(null)}
            whileHover={dragState === 'none' ? { scale: 1.05 } : undefined}
            animate={{ scale: dragState === 'valid' || dragState === 'target' ? 1.04 : 1 }}
            transition={{ type: 'spring', stiffness: 140, damping: 22 }}
            className={cn(
              'relative block w-full cursor-pointer outline-offset-4 transition-opacity duration-200',
              'aspect-[192/166]',
              dimmed && 'opacity-80',
              dragState === 'source' && 'opacity-45',
            )}
            style={{
              filter: hovered
                ? 'drop-shadow(0 2px 6px rgba(59,48,26,0.10)) drop-shadow(0 20px 46px rgba(59,48,26,0.20))'
                : 'drop-shadow(0 1px 2px rgba(59,48,26,0.08)) drop-shadow(0 8px 22px rgba(59,48,26,0.12))',
            }}
            aria-label={`${day.dayName}, LIFE7 score ${day.score} of 100, ${statusLabel}${day.locked ? ', locked' : ''}. Open day details.`}
          >
            {/* breathing gold halo — today only */}
            {isToday && (
              <svg
                viewBox="-100 -90 200 180"
                className={cn('absolute inset-0 h-full w-full overflow-visible', !reducedMotion && 'animate-breathe')}
                aria-hidden="true"
              >
                <path
                  d={HEX_HALO}
                  fill="none"
                  stroke="#D9B26A"
                  strokeWidth="2.25"
                  opacity="0.9"
                  style={{ filter: 'drop-shadow(0 0 12px rgba(217,178,106,0.8))' }}
                />
              </svg>
            )}

            {/* hex body */}
            <svg viewBox="-100 -90 200 180" className="absolute inset-0 h-full w-full" aria-hidden="true">
              <defs>
                {/* soft day-hue wash blooming from the upper-left corner */}
                <radialGradient id={tintId} cx="24%" cy="18%" r="88%">
                  <stop offset="0%" stopColor={theme.strong} stopOpacity="0.20" />
                  <stop offset="55%" stopColor={theme.strong} stopOpacity="0.07" />
                  <stop offset="100%" stopColor={theme.strong} stopOpacity="0" />
                </radialGradient>
              </defs>
              <path d={HEX} fill="rgba(255,253,247,0.94)" stroke={theme.rim} strokeWidth="1.75" />
              <path d={HEX} fill={`url(#${tintId})`} />
              {/* state veil — done days read sage, locked days recede in cream */}
              {day.status === 'done' && <path d={HEX} fill="rgba(201,214,192,0.18)" />}
              {day.locked && <path d={HEX} fill="rgba(243,235,218,0.42)" />}
              {/* today — clear gold rim (week.md signature) */}
              {isToday && (
                <path
                  d={HEX}
                  fill="rgba(242,193,78,0.08)"
                  stroke="#B08A3E"
                  strokeWidth="2.25"
                  opacity="0.95"
                />
              )}
              {/* gold rim — hover brighten */}
              <path
                d={HEX}
                fill="none"
                stroke="#D9B26A"
                strokeWidth="2.25"
                className="transition-opacity duration-200"
                opacity={hovered ? 1 : 0}
              />
              {/* pulse rim — lights as the loop pulse passes */}
              <path
                d={HEX}
                fill="none"
                stroke="#F2C14E"
                strokeWidth="2.5"
                className="transition-opacity duration-300"
                opacity={pulseLit ? 1 : 0}
                style={{ filter: 'drop-shadow(0 0 7px rgba(242,193,78,0.85))' }}
              />
              {/* sage target rim — valid meal-drop cell */}
              {(dragState === 'valid' || dragState === 'target') && (
                <path
                  d={HEX}
                  fill={dragState === 'target' ? 'rgba(201,214,192,0.28)' : 'none'}
                  stroke="#5C7A54"
                  strokeWidth={dragState === 'target' ? 3 : 2}
                  strokeDasharray={dragState === 'target' ? undefined : '6 5'}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(92,122,84,0.5))' }}
                />
              )}
            </svg>

            {/* optimise shimmer — light wave sweeping center-out */}
            {shimmer && (
              <svg
                viewBox="-100 -90 200 180"
                className="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden="true"
              >
                <defs>
                  <motion.linearGradient
                    id={shimId}
                    gradientUnits="userSpaceOnUse"
                    y1={-50}
                    y2={50}
                    initial={{ x1: -260, x2: -170 }}
                    animate={{ x1: 260, x2: 350 }}
                    transition={{ duration: 0.95, delay: slot.centerOutIndex * 0.2, ease: EASE_GLIDE }}
                  >
                    <stop offset="0%" stopColor="rgba(255,233,184,0)" />
                    <stop offset="50%" stopColor="rgba(255,233,184,0.9)" />
                    <stop offset="100%" stopColor="rgba(255,233,184,0)" />
                  </motion.linearGradient>
                </defs>
                <path d={HEX} fill={`url(#${shimId})`} opacity="0.7" />
              </svg>
            )}

            {/* ingredient theme watermark — 14% opacity, bottom-right (drifts on today) */}
            <img
              src={`/${day.themeImage}`}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className={cn(
                'pointer-events-none absolute bottom-[7%] right-[6%] w-[38%] opacity-[0.16]',
                isToday && !reducedMotion && 'week-watermark-drift',
              )}
            />

            {/* status corner marks */}
            <span className="absolute left-[13%] top-[9%]">
              <DayTypeBadge type={day.dayType} compact />
            </span>
            {day.locked && (
              <span
                className="absolute right-[13%] top-[9%] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-cream text-ink shadow-e-1 ring-1 ring-[rgba(46,70,48,0.16)]"
                title="Day locked"
                aria-label="Day locked"
              >
                <Lock size={10} strokeWidth={2} />
              </span>
            )}
            {!day.locked && day.status === 'done' && (
              <span
                className="absolute right-[13%] top-[9%] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-sage text-forest shadow-e-1 ring-1 ring-[rgba(46,70,48,0.14)]"
                title="Day done"
              >
                <Check size={11} strokeWidth={2.5} />
              </span>
            )}

            {/* centered content stack */}
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-[3px]">
              {/* day identity chip — per-day hue, AA deep text on soft tint */}
              <span
                className="t-label flex items-center gap-1 rounded-r-pill px-2 py-[2.5px] text-[9px]"
                style={{
                  backgroundColor: theme.chipBg,
                  color: theme.deep,
                  boxShadow: `inset 0 0 0 1px ${theme.chipRing}`,
                }}
              >
                <span className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: theme.strong }} />
                {DAY_NAMES_SHORT[day.dayIndex]}
              </span>
              {/* score ring with the day's hero-meal medallion pinned to its lower right */}
              <span className="week-ring-day flex items-end justify-center" style={ringVars}>
                <ScoreRing value={day.score} size={64} strokeWidth={6} className="week-ring [&_svg]:overflow-visible">
                  {(count) => (
                    <motion.span className="tnum text-[16px] font-bold leading-none text-ink">
                      {count}
                    </motion.span>
                  )}
                </ScoreRing>
                <motion.img
                  key={hero.photo}
                  src={`/${hero.photo}`}
                  alt={`Hero meal: ${hero.name}`}
                  loading="lazy"
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.82 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: EASE_GLIDE }}
                  className="relative z-10 -ml-[15px] mb-[1px] h-[48px] w-[48px] shrink-0 rounded-full object-cover"
                  style={{
                    boxShadow: `0 0 0 2px #FFFDF7, 0 0 0 3.5px ${theme.medal}, 0 6px 14px rgba(59,48,26,0.24)`,
                  }}
                />
              </span>
              <span className="tnum mt-[2px] text-[11px] font-bold leading-tight text-ink">
                <TweenNumber value={day.kcal} format={fmtKcal} /> kcal · P <TweenNumber value={day.proteinG} /> g
              </span>
              <span className="tnum text-[10px] font-semibold leading-tight text-ink">
                €{day.costEur.toFixed(2)} · {day.prepMinutes} min
              </span>
            </span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

export default memo(DayCell)
