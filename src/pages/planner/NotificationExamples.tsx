/**
 * Zone C — Notification examples (planner.md): the four canonical demo
 * notifications rendered phone-style with the LIFE7 mark mini. They slide in
 * staggered 120 ms on view; hover reveals "Send test" (fires a live clone at
 * the top of the screen with a haptic-style bounce) and "Mute this type"
 * (softly crosses the card, undo via toast).
 */
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { BellOff, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DemoNotification } from '@/data/notifications'
import { Life7Mark } from '@/components/life7'
import { EASE_GLIDE, SectionHeader } from './ui'

function NotificationCard({
  notification,
  index,
  muted,
  onSendTest,
  onMute,
  onUnmute,
}: {
  notification: DemoNotification
  index: number
  muted: boolean
  onSendTest: (n: DemoNotification) => void
  onMute: (n: DemoNotification) => void
  onUnmute: (n: DemoNotification) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <motion.div
      ref={ref}
      className={cn(
        'glass group relative overflow-hidden rounded-r-lg p-3.5 shadow-e-1 transition-shadow duration-220 hover:shadow-e-2',
        muted && 'opacity-60',
      )}
      initial={{ opacity: 0, x: 32 }}
      animate={inView ? { opacity: muted ? 0.6 : 1, x: 0 } : {}}
      transition={{ delay: index * 0.12, duration: 0.5, ease: EASE_GLIDE }}
    >
      {/* soft cross-out when muted */}
      <motion.span
        className="pointer-events-none absolute left-3 right-3 top-1/2 h-px origin-left bg-ink-faint"
        initial={false}
        animate={{ scaleX: muted ? 1 : 0, opacity: muted ? 0.7 : 0 }}
        transition={{ duration: 0.4, ease: EASE_GLIDE }}
      />
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream">
          <Life7Mark size={20} paused />
        </span>
        <div className="min-w-0 flex-1">
          <p className="t-label text-[9px] text-ink-faint">{notification.appLabel}</p>
          <p className="t-ui-sm mt-1 font-medium leading-snug text-ink">{notification.body}</p>
        </div>
        {notification.kind === 'expiry-move' && (
          <img src="/ing-spinach.png" alt="Spinach" className="h-9 w-9 shrink-0 rounded-r-sm bg-cream object-contain p-0.5" />
        )}
      </div>
      {/* hover actions */}
      <div className="mt-2 flex items-center justify-end gap-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {muted ? (
          <button
            type="button"
            onClick={() => onUnmute(notification)}
            className="t-ui-sm inline-flex items-center gap-1 font-semibold text-forest underline-offset-2 hover:underline"
          >
            <Undo2 size={12} strokeWidth={1.5} /> Unmute
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onSendTest(notification)}
              className="t-ui-sm font-semibold text-gold-deep underline-offset-2 hover:underline"
            >
              Send test
            </button>
            <button
              type="button"
              onClick={() => onMute(notification)}
              className="t-ui-sm inline-flex items-center gap-1 font-semibold text-ink-soft underline-offset-2 hover:underline"
            >
              <BellOff size={12} strokeWidth={1.5} /> Mute this type
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}

export default function NotificationExamples({
  notifications,
  mutedIds,
  onSendTest,
  onMute,
  onUnmute,
}: {
  notifications: readonly DemoNotification[]
  mutedIds: ReadonlySet<string>
  onSendTest: (n: DemoNotification) => void
  onMute: (n: DemoNotification) => void
  onUnmute: (n: DemoNotification) => void
}) {
  return (
    <section aria-label="Notification examples">
      <SectionHeader>How LIFE7 speaks</SectionHeader>
      <div className="space-y-3">
        {notifications.map((n, i) => (
          <NotificationCard
            key={n.id}
            notification={n}
            index={i}
            muted={mutedIds.has(n.id)}
            onSendTest={onSendTest}
            onMute={onMute}
            onUnmute={onUnmute}
          />
        ))}
      </div>
    </section>
  )
}
