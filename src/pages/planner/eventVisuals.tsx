/**
 * Event-type iconography + colors for the sunlight timeline (planner.md Zone A).
 * Icons are lucide thin-line shapes re-stroked to 1.5px; colors stay inside
 * the LIFE7 palette (gold / sage / green / forest).
 */
import type { ComponentType } from 'react'
import {
  Sunrise,
  Droplet,
  Sprout,
  Pill,
  Waves,
  Moon,
  ShoppingBasket,
  ChefHat,
  MoonStar,
} from 'lucide-react'
import type { EventType } from '@/lib/reminders'

export interface EventVisual {
  icon: ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string; color?: string }>
  /** hex used for the spine node ring + icon */
  color: string
  label: string
}

export const EVENT_VISUALS: Record<EventType, EventVisual> = {
  wake: { icon: Sunrise, color: '#B08A3E', label: 'Wake' },
  hydration: { icon: Droplet, color: '#5C7A54', label: 'Hydration' },
  meal: { icon: Sprout, color: '#5C7A54', label: 'Meal' },
  supplement: { icon: Pill, color: '#D9B26A', label: 'Supplement' },
  movement: { icon: Waves, color: '#5C7A54', label: 'Movement' },
  sleep: { icon: Moon, color: '#2E4630', label: 'Sleep' },
  shopping: { icon: ShoppingBasket, color: '#B08A3E', label: 'Shopping' },
  prep: { icon: ChefHat, color: '#D9B26A', label: 'Meal prep' },
  recovery: { icon: MoonStar, color: '#2E4630', label: 'Recovery' },
}

/** The 8 types offered in the ＋ Add event picker (planner.md Zone A). */
export const ADDABLE_TYPES: readonly EventType[] = [
  'wake',
  'hydration',
  'meal',
  'supplement',
  'movement',
  'sleep',
  'shopping',
  'prep',
]
