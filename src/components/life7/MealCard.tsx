import { motion } from 'framer-motion'
import { Check, Clock, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]

export interface MealCardProps {
  photo: string
  name: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  /** e.g. "12:30" */
  time?: string
  /** e.g. "18 min prep" */
  prep?: string
  status?: 'done' | 'next' | 'planned'
  /** entrance stagger delay (s) */
  delay?: number
  onClick?: () => void
  className?: string
  children?: React.ReactNode
}

/**
 * Meal card (design.md §9): photo left in mask (scales on hover), Fraunces
 * name, macro chips row, time/prep caption, status icon. Staggered entrance.
 */
export default function MealCard({
  photo,
  name,
  kcal,
  protein,
  carbs,
  fat,
  time,
  prep,
  status = 'planned',
  delay = 0,
  onClick,
  className,
  children,
}: MealCardProps) {
  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.56, delay, ease: EASE_GLIDE }}
      onClick={onClick}
      className={cn(
        'glass group flex items-center gap-4 rounded-r-lg p-4 shadow-e-1 transition-shadow duration-220 ease-soft hover:shadow-e-2',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-r-md bg-cream">
        <img
          src={photo}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 ease-glide group-hover:scale-[1.04]"
          loading="lazy"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display truncate text-[20px] font-medium leading-[1.2] tracking-[-0.005em] text-ink">
            {name}
          </h3>
          {status === 'done' && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green text-soft-white">
              <Check size={12} strokeWidth={2.5} />
            </span>
          )}
          {status === 'next' && <span className="t-label shrink-0 text-gold-deep">NEXT</span>}
        </div>
        <div className="t-metric-sm mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-soft">
          <span className="inline-flex items-center gap-1">
            <Flame size={13} className="text-champagne" /> {kcal} kcal
          </span>
          <span>P {protein} g</span>
          <span>C {carbs} g</span>
          <span>F {fat} g</span>
        </div>
        {(time || prep) && (
          <div className="t-ui-sm mt-1 flex items-center gap-1.5 text-ink-faint">
            <Clock size={12} />
            <span>
              {time}
              {time && prep ? ' · ' : ''}
              {prep}
            </span>
          </div>
        )}
        {children}
      </div>
    </motion.div>
  )
}
