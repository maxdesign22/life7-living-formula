import { memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, Lock } from 'lucide-react'
import type { WeekPlan } from '@/data/demoWeek'
import { DAY_NAMES_SHORT } from '@/data/profile'
import { cn } from '@/lib/utils'
import DayTypeBadge from './DayTypeBadge'
import TweenNumber from './TweenNumber'
import { dayTheme, heroMealOf, roundedDiamondPath } from './geometry'

const DIAMOND = roundedDiamondPath(38, 10)

export interface WeekChainMobileProps {
  week: WeekPlan
  onOpenDay: (dayId: string) => void
}

/**
 * <768px layout (week.md responsive): the flower becomes a vertical
 * connected chain — 84px rounded diamonds in one column, joined by the same
 * flowing gold line. Breathing continues; tap opens the sheet drawer.
 */
function WeekChainMobile({ week, onOpenDay }: WeekChainMobileProps) {
  const reducedMotion = useReducedMotion() ?? false

  return (
    <div className="relative" aria-label="Week at a glance">
      {/* flowing connector line down the chain */}
      <svg
        className="absolute bottom-6 left-[41px] top-6 h-[calc(100%-48px)] w-[4px] overflow-visible"
        aria-hidden="true"
      >
        <line x1="2" y1="0" x2="2" y2="100%" stroke="rgba(46,70,48,0.22)" strokeWidth="2" />
        <line
          x1="2"
          y1="0"
          x2="2"
          y2="100%"
          stroke="rgba(176,138,62,0.7)"
          strokeWidth="2.5"
          strokeDasharray="8 12"
          className={reducedMotion ? undefined : 'week-dash-flow'}
        />
      </svg>

      <div className="space-y-3">
        {week.days.map((day, i) => {
          const isToday = day.status === 'today'
          const theme = dayTheme(day.id)
          const hero = heroMealOf(day)
          const breath = reducedMotion
            ? undefined
            : {
                scale: [1, 1.025, 1],
                transition: { duration: 6, delay: i * 0.55, repeat: Infinity, ease: 'easeInOut' as const },
              }
          return (
            <motion.button
              key={day.id}
              type="button"
              onClick={() => onOpenDay(day.id)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="relative flex w-full items-center gap-4 text-left"
              aria-label={`${day.dayName}, score ${day.score}. Open day details.`}
            >
              {/* diamond cell */}
              <motion.span animate={breath} className="relative z-10 block h-[84px] w-[84px] shrink-0">
                {isToday && (
                  <svg
                    viewBox="-46 -46 92 92"
                    className={cn('absolute inset-0 h-full w-full overflow-visible', !reducedMotion && 'animate-breathe')}
                    aria-hidden="true"
                  >
                    <path
                      d={roundedDiamondPath(43, 11)}
                      fill="none"
                      stroke="#D9B26A"
                      strokeWidth="1.8"
                      opacity="0.8"
                      style={{ filter: 'drop-shadow(0 0 7px rgba(217,178,106,0.6))' }}
                    />
                  </svg>
                )}
                <svg viewBox="-46 -46 92 92" className="absolute inset-0 h-full w-full" aria-hidden="true">
                  <path
                    d={DIAMOND}
                    fill="rgba(255,253,247,0.94)"
                    stroke={isToday ? '#B08A3E' : theme.medal}
                    strokeWidth={isToday ? 2 : 1.75}
                  />
                  <path d={DIAMOND} fill={theme.strong} opacity="0.13" />
                </svg>
                <span className="absolute inset-0 flex flex-col items-center justify-center">
                  <TweenNumber value={day.score} className="tnum text-[20px] font-bold leading-none text-ink" />
                  <span className="t-label mt-1 text-[8px]" style={{ color: theme.deep }}>
                    {DAY_NAMES_SHORT[day.dayIndex]}
                  </span>
                </span>
                {day.locked && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cream text-ink-soft shadow-e-1">
                    <Lock size={10} />
                  </span>
                )}
                {!day.locked && day.status === 'done' && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-sage text-forest shadow-e-1">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                )}
              </motion.span>

              {/* summary card */}
              <span className="glass min-w-0 flex-1 rounded-r-md bg-[rgba(255,253,247,0.9)] p-3 shadow-e-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: theme.strong, boxShadow: `0 0 0 2.5px ${theme.chipBg}` }}
                    />
                    <span className="font-display truncate text-[17px] font-medium text-ink">{day.dayName}</span>
                  </span>
                  <DayTypeBadge type={day.dayType} compact={false} />
                </span>
                <span className="tnum mt-1 block text-[12px] font-bold text-ink">
                  {day.kcal.toLocaleString('en-US').replace(',', ' ')} kcal · P {day.proteinG} g · €
                  {day.costEur.toFixed(2)} · {day.prepMinutes} min
                </span>
                {/* hero-meal medallion — clearly visible day visual (replaces the tiny chip row) */}
                <span className="mt-2 flex items-center gap-2.5">
                  <img
                    src={`/${hero.photo}`}
                    alt={hero.name}
                    loading="lazy"
                    className="h-[40px] w-[40px] shrink-0 rounded-full object-cover"
                    style={{
                      boxShadow: `0 0 0 2px #FFFDF7, 0 0 0 3px ${theme.medal}, 0 4px 10px rgba(59,48,26,0.20)`,
                    }}
                  />
                  <span className="min-w-0">
                    <span className="t-label block text-[8px]" style={{ color: theme.deep }}>
                      Hero meal
                    </span>
                    <span className="font-display block truncate text-[13px] italic leading-snug text-ink">
                      {hero.name}
                    </span>
                  </span>
                </span>
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export default memo(WeekChainMobile)
