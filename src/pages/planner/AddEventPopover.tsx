/**
 * ＋ Add event popover (planner.md Zone A): 8-type icon picker, title input,
 * time stepper (15-min steps), reminder toggle. Inserts with a spring.
 */
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventType } from '@/lib/reminders'
import { MagneticButton } from '@/components/life7'
import { EASE_GLIDE, Toggle, fmtTime } from './ui'
import { ADDABLE_TYPES, EVENT_VISUALS } from './eventVisuals'

export interface NewEventSpec {
  type: EventType
  title: string
  minutes: number
  reminder: boolean
}

export default function AddEventPopover({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (spec: NewEventSpec) => void
}) {
  const [type, setType] = useState<EventType>('movement')
  const [title, setTitle] = useState('')
  const [minutes, setMinutes] = useState(15 * 60)
  const [reminder, setReminder] = useState(true)

  const submit = () => {
    const trimmed = title.trim() || EVENT_VISUALS[type].label
    onAdd({ type, title: trimmed, minutes, reminder })
    setTitle('')
    setMinutes(15 * 60)
    setReminder(true)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={onClose} aria-hidden="true" />
          <motion.div
            className="glass-strong fixed inset-x-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[61] max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-r-xl p-4 shadow-e-3 min-[640px]:absolute min-[640px]:inset-x-auto min-[640px]:bottom-auto min-[640px]:right-0 min-[640px]:top-[calc(100%+10px)] min-[640px]:w-[320px] min-[640px]:rounded-r-lg"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.24, ease: EASE_GLIDE }}
            role="dialog"
            aria-label="Add event"
          >
            <span className="t-label text-gold-deep">New event</span>
            {/* type picker — 8 icons */}
            <div className="mt-3 grid grid-cols-8 gap-1">
              {ADDABLE_TYPES.map((t) => {
                const visual = EVENT_VISUALS[t]
                const Icon = visual.icon
                const active = type === t
                return (
                  <button
                    key={t}
                    type="button"
                    title={visual.label}
                    aria-label={visual.label}
                    onClick={() => setType(t)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-r-sm transition-all duration-180',
                      active ? 'bg-sunrise shadow-e-1' : 'bg-cream hover:bg-sand',
                    )}
                  >
                    <Icon size={14} strokeWidth={1.5} color={active ? '#B08A3E' : visual.color} />
                  </button>
                )
              })}
            </div>
            {/* title */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={EVENT_VISUALS[type].label}
              className="t-ui-sm mt-3 w-full rounded-r-sm border border-sand bg-soft-white px-3 py-2 text-ink placeholder:text-ink-faint focus:border-champagne focus:outline-none"
              aria-label="Event title"
            />
            {/* time stepper */}
            <div className="mt-3 flex items-center justify-between">
              <span className="t-ui-sm font-bold text-ink">Time</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="15 minutes earlier"
                  onClick={() => setMinutes((m) => Math.max(390, m - 15))}
                  className="glass flex h-7 w-7 items-center justify-center rounded-full text-forest shadow-e-1"
                >
                  <Minus size={12} strokeWidth={2} />
                </button>
                <span className="t-metric-sm tnum w-12 text-center text-ink">{fmtTime(minutes)}</span>
                <button
                  type="button"
                  aria-label="15 minutes later"
                  onClick={() => setMinutes((m) => Math.min(1380, m + 15))}
                  className="glass flex h-7 w-7 items-center justify-center rounded-full text-forest shadow-e-1"
                >
                  <Plus size={12} strokeWidth={2} />
                </button>
              </div>
            </div>
            {/* reminder toggle */}
            <div className="mt-3 flex items-center justify-between">
              <span className="t-ui-sm font-bold text-ink">Remind 10 min before</span>
              <Toggle on={reminder} onChange={() => setReminder((r) => !r)} label="Remind 10 minutes before" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <MagneticButton size="sm" variant="ghost" onClick={onClose}>
                Cancel
              </MagneticButton>
              <MagneticButton size="sm" onClick={submit}>
                Add to day
              </MagneticButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
