/**
 * Screen 7 — PLANNER & REMINDERS (/planner).
 * "The day as a path of sunlight": sunlight orbit timeline (day mode) or 7
 * mini-strips (week mode) + reminder channels, notification examples, quiet
 * hours. Logic lives in src/lib/reminders.ts; this page stays thin.
 */
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Sparkles, Truck } from 'lucide-react'
import { GlassCard, Life7Mark, MagneticButton, useToast } from '@/components/life7'
import {
  DEFAULT_CHANNELS,
  DEFAULT_QUIET_HOURS,
  addEvent,
  buildThursdayTimeline,
  getDemoNotifications,
  markEventDone,
  rescheduleEvent,
  sendTest,
  toggleChannel,
} from '@/lib/reminders'
import type { ChannelId, QuietHours as QuietHoursState, ReminderChannel, TimelineEvent } from '@/lib/reminders'
import type { DemoNotification } from '@/data/notifications'
import { DEMO_NOW, DAY_NAMES_SHORT } from '@/data/profile'
import { DEMO_WEEK } from '@/data/demoWeek'
import type { DayPlan, PlannedMeal } from '@/data/demoWeek'
import { mealTotals } from '@/lib/nutrition'
import { getCanonicalShoppingList } from '@/lib/shopping'
import { readDispatchOrder } from '@/lib/dispatch'
import SunlightTimeline from '@/pages/planner/SunlightTimeline'
import type { TimelineAction } from '@/pages/planner/SunlightTimeline'
import WeekStrips from '@/pages/planner/WeekStrips'
import ReminderChannels, { CHANNEL_TEST_KIND } from '@/pages/planner/ReminderChannels'
import NotificationExamples from '@/pages/planner/NotificationExamples'
import QuietHoursPanel from '@/pages/planner/QuietHours'
import AddEventPopover from '@/pages/planner/AddEventPopover'
import type { NewEventSpec } from '@/pages/planner/AddEventPopover'
import { MealDrawer, CookingOverlay } from '@/pages/planner/MealDrawer'
import { EASE_GLIDE, KineticWords, SegmentedControl } from '@/pages/planner/ui'

/* ---------------------------------------------------- per-day event builder */

/** Build a TimelineEvent-compatible object (mirrors reminders.ts EV helper). */
function makeEvent(
  id: string,
  time: string,
  type: TimelineEvent['type'],
  title: string,
  detail: string,
  extra?: Partial<Pick<TimelineEvent, 'actionLabel' | 'mealId' | 'route' | 'done'>>,
): TimelineEvent {
  const [h, m] = time.split(':').map(Number)
  return { id, time, minutes: h * 60 + m, type, title, detail, done: false, ...extra }
}

/** Generated day timeline for non-Thursday days from the week plan. */
function buildDayEvents(day: DayPlan): TimelineEvent[] {
  const events: TimelineEvent[] = [
    makeEvent(`${day.id}-wake`, '06:30', 'wake', 'Wake up', 'Light exposure 10 min', {
      actionLabel: 'Done',
      done: day.status === 'done',
    }),
    makeEvent(`${day.id}-hydration`, '07:00', 'hydration', 'Water 400 ml', 'Before coffee', {
      actionLabel: '+1 glass',
      done: day.status === 'done',
    }),
  ]
  for (const meal of day.meals) {
    const t = mealTotals(meal.items)
    events.push(
      makeEvent(
        `${day.id}-${meal.mealType}`,
        meal.time,
        'meal',
        `${meal.mealType[0].toUpperCase()}${meal.mealType.slice(1)}, ${meal.name}`,
        `${Math.round(t.kcal)} kcal · P ${Math.round(t.protein)} g`,
        { actionLabel: 'View', mealId: meal.id, done: meal.status === 'eaten' },
      ),
    )
  }
  events.push(
    makeEvent(`${day.id}-sleep`, '23:00', 'sleep', 'Sleep window', 'Target 7 h 45 min'),
  )
  return events.sort((a, b) => a.minutes - b.minutes)
}

const EXPANDED_NOTES: Partial<Record<TimelineEvent['type'], string>> = {
  wake: 'Sunrise alarm fades in over ten minutes. No harsh tone.',
  hydration: 'Glasses today also fill the hydration ring on Today.',
  supplement: 'Take with food. It pairs with breakfast.',
  movement: 'A short walk smooths the post-lunch glucose curve.',
  sleep: 'Quiet hours hold every reminder until morning.',
  prep: "Tomorrow's breakfast is decided tonight.",
  recovery: 'Screens dim automatically from 21:30.',
}

/* ------------------------------------------------------------------ page */

let customId = 1

export default function Planner() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [mode, setMode] = useState<'day' | 'week'>('day')
  const [dayIndex, setDayIndex] = useState(DEMO_NOW.dayIndex)
  const [eventsByDay, setEventsByDay] = useState<Readonly<Record<string, readonly TimelineEvent[]>>>(() => ({
    thu: buildThursdayTimeline(),
  }))
  const [channels, setChannels] = useState<readonly ReminderChannel[]>(DEFAULT_CHANNELS)
  const [quietHours, setQuietHours] = useState<QuietHoursState>(DEFAULT_QUIET_HOURS)
  const [leadMinutes, setLeadMinutes] = useState<number>(20)
  const [mutedIds, setMutedIds] = useState<ReadonlySet<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [shimmer, setShimmer] = useState<{ minutes: number; nonce: number } | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [drawerMeal, setDrawerMeal] = useState<PlannedMeal | null>(null)
  const [cooking, setCooking] = useState<{ meal: PlannedMeal; minutes: number; eventId: string } | null>(null)
  const [clones, setClones] = useState<{ id: number; n: DemoNotification; via?: string }[]>([])

  const day = DEMO_WEEK.days[dayIndex]
  const events = useMemo(() => eventsByDay[day.id] ?? buildDayEvents(day), [eventsByDay, day])
  const setEvents = useCallback(
    (next: readonly TimelineEvent[]) => setEventsByDay((prev) => ({ ...prev, [day.id]: next })),
    [day.id],
  )
  const nowMinutes = day.status === 'today' ? DEMO_NOW.timeMinutes : day.status === 'done' ? 1440 : -1
  const notifications = useMemo(() => getDemoNotifications(), [])
  const dispatchOrder = useMemo(() => readDispatchOrder(), [])

  /* ------------------------------------------------------------- actions */

  const findMeal = useCallback(
    (mealId?: string): PlannedMeal | undefined => day.meals.find((m) => m.id === mealId),
    [day],
  )

  const handleAction = useCallback(
    (a: TimelineAction) => {
      if (a.kind === 'done') {
        const nextDone = !a.event.done
        setEvents(markEventDone(events, a.event.id, nextDone))
        if (nextDone) toast('Logged, nice rhythm.', { tone: 'sage' })
        return
      }
      if (a.kind === 'glass') {
        toast('Glass logged, 400 ml added to today.', { tone: 'sage' })
        return
      }
      if (a.kind === 'view') {
        const meal = findMeal(a.event.mealId)
        if (meal) setDrawerMeal(meal)
        return
      }
      if (a.kind === 'cook') {
        const meal = findMeal(a.event.mealId)
        const match = a.event.actionLabel?.match(/\((\d+)\s*min/)
        const minutes = match ? Number(match[1]) : meal ? meal.prepMinutes + meal.cookMinutes : 15
        if (meal) setCooking({ meal, minutes, eventId: a.event.id })
        return
      }
      if (a.kind === 'route' && a.event.route) navigate(a.event.route)
    },
    [events, findMeal, navigate, setEvents, toast],
  )

  const handleReschedule = useCallback(
    (id: string, minutes: number) => {
      const { events: next, toast: copy } = rescheduleEvent(events, id, minutes)
      setEvents(next)
      if (copy) toast(copy, { tone: 'gold' })
      const nonce = Date.now()
      setShimmer({ minutes, nonce })
      const remaining = next.filter((e) => e.minutes >= minutes).length
      window.setTimeout(() => setShimmer((s) => (s?.nonce === nonce ? null : s)), remaining * 300 + 1100)
    },
    [events, setEvents, toast],
  )

  const handleAddEvent = useCallback(
    (spec: NewEventSpec) => {
      const time = `${String(Math.floor(spec.minutes / 60)).padStart(2, '0')}:${String(spec.minutes % 60).padStart(2, '0')}`
      const ev = makeEvent(`custom-${customId++}`, time, spec.type, spec.title, spec.reminder ? 'Reminder 10 min before' : 'No reminder', {
        actionLabel: 'Done',
      })
      setEvents(addEvent(events, ev))
      toast('Event added, the day re-flowed around it.', { tone: 'gold' })
    },
    [events, setEvents, toast],
  )

  /* -------------------------------------------- channels & notifications */

  const pushClone = useCallback((n: DemoNotification, via?: string) => {
    const id = Date.now() + Math.random()
    setClones((prev) => [...prev.slice(-2), { id, n, via }])
    window.setTimeout(() => setClones((prev) => prev.filter((c) => c.id !== id)), 4000)
  }, [])

  const handleToggleChannel = useCallback(
    (id: ChannelId) => {
      const result = toggleChannel(channels, id)
      if (result.toast) {
        toast(result.toast, { tone: 'gold', icon: <Sparkles size={16} className="text-gold-deep" /> })
        return
      }
      setChannels(result.channels)
    },
    [channels, toast],
  )

  const handleSendTest = useCallback(
    (id: ChannelId) => {
      const res = sendTest(id, CHANNEL_TEST_KIND[id], channels)
      if (res.ok) pushClone(res.notification, channels.find((c) => c.id === id)?.label)
      else toast(res.toast, { tone: 'gold' })
    },
    [channels, pushClone, toast],
  )

  const handleMute = useCallback(
    (n: DemoNotification) => {
      setMutedIds((prev) => new Set(prev).add(n.id))
      toast('This type is muted, future ones arrive silently.', {
        tone: 'sage',
        action: {
          label: 'Undo',
          onClick: () => setMutedIds((prev) => {
            const next = new Set(prev)
            next.delete(n.id)
            return next
          }),
        },
      })
    },
    [toast],
  )

  const handleUnmute = useCallback((n: DemoNotification) => {
    setMutedIds((prev) => {
      const next = new Set(prev)
      next.delete(n.id)
      return next
    })
  }, [])

  /* ----------------------------------------------------- expanded content */

  const renderExpanded = useCallback(
    (event: TimelineEvent) => {
      if (event.type === 'meal') {
        const meal = findMeal(event.mealId)
        if (!meal) return <p className="t-ui-sm text-ink-soft">{event.detail}</p>
        const t = mealTotals(meal.items)
        return (
          <div>
            <div className="flex items-center gap-3">
              <img src={`/${meal.photo}`} alt="" className="h-10 w-10 rounded-r-sm object-cover" />
              <div className="flex flex-wrap gap-1.5">
                <span className="t-label rounded-r-pill bg-cream px-2 py-0.5 text-ink">{Math.round(t.kcal)} kcal</span>
                <span className="t-label rounded-r-pill bg-cream px-2 py-0.5 text-ink">P {Math.round(t.protein)} g</span>
                <span className="t-label rounded-r-pill bg-cream px-2 py-0.5 text-ink">C {Math.round(t.carbs)} g</span>
                <span className="t-label rounded-r-pill bg-cream px-2 py-0.5 text-ink">F {Math.round(t.fat)} g</span>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerMeal(meal)}
                className="t-ui-sm font-semibold text-forest underline-offset-2 decoration-champagne hover:underline"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => navigate('/architect')}
                className="t-ui-sm font-semibold text-gold-deep underline-offset-2 hover:underline"
              >
                Open in Architect
              </button>
            </div>
          </div>
        )
      }
      if (event.type === 'shopping') {
        const market = getCanonicalShoppingList().sections.find((s) => s.store === 'market')
        return (
          <div>
            <ul className="space-y-1.5">
              {market?.items.slice(0, 3).map((item) => (
                <li key={item.id} className="t-ui-sm flex items-center justify-between text-ink">
                  <span className="flex items-center gap-2">
                    <img src={`/${item.image}`} alt="" className="h-5 w-5 rounded-full bg-cream object-contain" />
                    {item.name}
                  </span>
                  <span className="tnum text-ink-soft">€{item.priceEur.toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => navigate('/shopping')}
              className="t-ui-sm mt-2.5 font-semibold text-gold-deep underline-offset-2 hover:underline"
            >
              Open the full list
            </button>
          </div>
        )
      }
      return <p className="t-ui-sm font-medium text-ink-soft">{EXPANDED_NOTES[event.type] ?? event.detail}</p>
    },
    [findMeal, navigate],
  )

  /* --------------------------------------------------------------- render */

  return (
    <div className="mx-auto max-w-[1280px]">
      {/* header */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <motion.span
            className="t-label block text-gold-deep"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Week 24 · Day {dayIndex + 1} of 7 · {DAY_NAMES_SHORT[dayIndex]}
          </motion.span>
          <h1 className="t-display-lg mt-2 text-ink">
            <KineticWords text="Planner" />
          </h1>
          <motion.p
            className="t-serif-quote mt-2 text-ink-soft"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            Your day, already decided kindly.
          </motion.p>
        </div>
        <motion.div
          className="relative mt-1 flex items-center gap-3"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: EASE_GLIDE }}
        >
          <SegmentedControl
            id="planner-mode"
            options={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
            ]}
            value={mode}
            onChange={setMode}
          />
          <MagneticButton size="md" variant="glass" icon={<Plus size={15} strokeWidth={2} />} onClick={() => setAddOpen((o) => !o)}>
            Add event
          </MagneticButton>
          <AddEventPopover open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAddEvent} />
        </motion.div>
      </header>

      {dispatchOrder && (
        <motion.button
          type="button"
          onClick={() => navigate('/dispatch')}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass mb-6 flex w-full items-center gap-3 rounded-r-lg border-champagne/35 p-4 text-left shadow-e-2 transition-shadow hover:shadow-gold-glow"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sunrise text-forest"><Truck size={19} /></span>
          <span className="min-w-0 flex-1">
            <span className="t-label block text-gold-deep">Dispatch · {dispatchOrder.status.replaceAll('-', ' ')}</span>
            <span className="t-ui-md mt-1 block truncate font-bold text-ink">{dispatchOrder.offer.itemLabel}</span>
            <span className="t-ui-sm block text-ink-faint">{dispatchOrder.offer.merchant} · delivery connected to today</span>
          </span>
          <span className="t-ui-sm shrink-0 font-bold text-forest">Track</span>
        </motion.button>
      )}

      <div className="grid grid-cols-1 gap-6 min-[1024px]:grid-cols-[minmax(0,1fr)_360px]">
        {/* Zone A — sunlight timeline / week strips */}
        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            {mode === 'day' ? (
              <motion.div
                key={`day-${day.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE_GLIDE }}
              >
                <SunlightTimeline
                  events={events}
                  nowMinutes={nowMinutes}
                  onAction={handleAction}
                  onReschedule={handleReschedule}
                  shimmerFrom={shimmer}
                  expandedId={expandedId}
                  onToggleExpand={setExpandedId}
                  renderExpanded={renderExpanded}
                />
              </motion.div>
            ) : (
              <motion.div
                key="week"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE_GLIDE }}
              >
                <p className="t-serif-quote mb-6 text-[17px] text-ink-soft">
                  Seven days, one rhythm. Pick a strip to open its sunlight path.
                </p>
                <WeekStrips
                  todayIndex={DEMO_NOW.dayIndex}
                  onPickDay={(i) => {
                    setDayIndex(i)
                    setMode('day')
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* right column — Zones B, C, D */}
        <motion.div
          className="space-y-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: EASE_GLIDE }}
        >
          <GlassCard flat className="p-5">
            <ReminderChannels channels={channels} onToggle={handleToggleChannel} onSendTest={handleSendTest} />
          </GlassCard>
          <GlassCard flat className="p-5">
            <NotificationExamples
              notifications={notifications}
              mutedIds={mutedIds}
              onSendTest={(n) => pushClone(n)}
              onMute={handleMute}
              onUnmute={handleUnmute}
            />
          </GlassCard>
          <GlassCard flat className="p-5">
            <QuietHoursPanel
              quietHours={quietHours}
              onQuietHours={setQuietHours}
              leadMinutes={leadMinutes}
              onLeadMinutes={setLeadMinutes}
            />
          </GlassCard>
        </motion.div>
      </div>

      {/* meal drawer + cooking overlay */}
      <MealDrawer
        meal={drawerMeal}
        onClose={() => setDrawerMeal(null)}
        onMarkEaten={() => {
          if (drawerMeal) {
            const ev = events.find((e) => e.mealId === drawerMeal.id)
            if (ev) setEvents(markEventDone(events, ev.id, true))
            toast('Meal logged, enjoy.', { tone: 'sage' })
          }
          setDrawerMeal(null)
        }}
      />
      <CookingOverlay
        meal={cooking?.meal ?? null}
        totalMinutes={cooking?.minutes ?? 15}
        onClose={() => setCooking(null)}
        onFinish={() => {
          if (cooking) {
            setEvents(markEventDone(events, cooking.eventId, true))
            toast('Cooking finished, the evening re-balanced itself.', { tone: 'sage' })
          }
          setCooking(null)
        }}
      />

      {/* live test-notification clones — top of screen, haptic bounce */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[85] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {clones.map((c) => (
            <motion.div
              key={c.id}
              layout
              className="glass-strong flex w-[min(380px,100%)] items-start gap-3 rounded-r-lg p-3.5 shadow-e-3"
              initial={{ y: -28, scale: 0.88, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: -16, scale: 0.94, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 17 }}
              role="status"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream">
                <Life7Mark size={20} paused />
              </span>
              <div className="min-w-0">
                <p className="t-label text-[9px] text-ink-faint">
                  {c.n.appLabel}
                  {c.via ? ` · via ${c.via}` : ''}
                </p>
                <p className="t-ui-sm mt-0.5 font-medium leading-snug text-ink">{c.n.body}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
