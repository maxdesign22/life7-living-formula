/**
 * Zone A — Week mode (planner.md): the spine becomes 7 vertical mini-strips
 * (Mon→Sun), each with its day gradient and up to 6 event dots at correct
 * heights (wake · 4 meals · sleep). Today's strip is elevated with a gold rim.
 * Strips breathe opacity 0.92↔1 staggered; clicking flips back to Day mode.
 */
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DEMO_WEEK, MEAL_TIMES } from '@/data/demoWeek'
import { DAY_NAMES_SHORT } from '@/data/profile'
import { EASE_GLIDE } from './ui'
import { yOf, TIMELINE_HEIGHT } from './SunlightTimeline'

const STRIP_SCALE = 0.42 // week strips are compact echoes of the day spine
const STRIP_H = TIMELINE_HEIGHT * STRIP_SCALE

function dotTimes(): readonly number[] {
  const meals = Object.values(MEAL_TIMES).map((t) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  })
  return [6 * 60 + 30, ...meals, 23 * 60]
}

const DOTS = dotTimes()

export default function WeekStrips({
  todayIndex,
  onPickDay,
}: {
  todayIndex: number
  onPickDay: (dayIndex: number) => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 overflow-x-auto pb-2 min-[1024px]:gap-4">
      {DEMO_WEEK.days.map((day, i) => {
        const isToday = i === todayIndex
        return (
          <motion.button
            key={day.id}
            type="button"
            onClick={() => onPickDay(i)}
            className={cn(
              'group relative flex w-[86px] shrink-0 flex-col items-center gap-2 rounded-r-lg border p-3 transition-all duration-300 ease-soft',
              isToday
                ? 'glass border-champagne shadow-gold-glow -translate-y-1.5'
                : 'glass border-transparent shadow-e-1 hover:-translate-y-0.5 hover:shadow-e-2',
            )}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: isToday ? -6 : 0 }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.5, ease: EASE_GLIDE }}
            aria-label={`Open ${day.dayName} in day mode`}
          >
            <span className={cn('t-label', isToday ? 'text-gold-deep' : 'text-ink-soft')}>
              {DAY_NAMES_SHORT[i]}
            </span>
            <motion.span
              className="relative block overflow-hidden rounded-full"
              style={{ width: 14, height: STRIP_H }}
              animate={{ opacity: [0.92, 1, 0.92] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
            >
              {/* day gradient */}
              <span
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(180deg, #F2C14E 0%, #F7DFA7 45%, #C9D6C0 76%, #2E4630 100%)',
                }}
              />
              {/* event dots at correct heights */}
              {DOTS.map((m, di) => (
                <span
                  key={di}
                  className={cn(
                    'absolute left-1/2 h-[5px] w-[5px] -translate-x-1/2 rounded-full',
                    day.status === 'done' ? 'bg-forest/70' : di === 0 || di === DOTS.length - 1 ? 'bg-soft-white/90' : 'bg-forest/55',
                  )}
                  style={{ top: yOf(m) * STRIP_SCALE - 2.5 }}
                />
              ))}
              {/* score wash at bottom for lived days */}
              {day.status !== 'planned' && (
                <span
                  className="absolute inset-x-0 bottom-0 bg-forest/20"
                  style={{ height: `${(day.score / 100) * 22}%` }}
                />
              )}
            </motion.span>
            <span className={cn('t-metric-sm tnum', isToday ? 'text-gold-deep' : day.status === 'done' ? 'text-ink' : 'text-ink-faint')}>
              {day.score}
            </span>
            {isToday && <span className="t-label text-[8px] text-gold-deep">TODAY</span>}
          </motion.button>
        )
      })}
    </div>
  )
}
