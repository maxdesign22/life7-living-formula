/**
 * Zone B — Reminder channels (planner.md): phone / smartwatch / email /
 * browser + WhatsApp & Telegram placeholders. Toggles animate; the row icon
 * glows gold 400 ms when enabled. Active channels expose a "Send test" link
 * that fires the matching composed notification as a live preview.
 */
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, Watch, Mail, Globe, MessageCircle, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChannelId, ReminderChannel } from '@/lib/reminders'
import type { NotificationKind } from '@/data/notifications'
import { SectionHeader, Toggle } from './ui'

const CHANNEL_ICONS: Record<ChannelId, typeof Phone> = {
  phone: Phone,
  smartwatch: Watch,
  email: Mail,
  browser: Globe,
  whatsapp: MessageCircle,
  telegram: Send,
}

/** Which composed notification each channel's Send-test fires. */
export const CHANNEL_TEST_KIND: Record<ChannelId, NotificationKind> = {
  phone: 'meal-ready',
  smartwatch: 'missed-meal',
  email: 'expiry-move',
  browser: 'protein-adjusted',
  whatsapp: 'meal-ready',
  telegram: 'meal-ready',
}

function ChannelRow({
  channel,
  onToggle,
  onSendTest,
}: {
  channel: ReminderChannel
  onToggle: (id: ChannelId) => void
  onSendTest: (id: ChannelId) => void
}) {
  const Icon = CHANNEL_ICONS[channel.id]
  const [glow, setGlow] = useState(false)
  const first = useRef(true)

  // gold glow on the icon for 400 ms when the channel flips on
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (channel.enabled) {
      setGlow(true)
      const t = window.setTimeout(() => setGlow(false), 400)
      return () => window.clearTimeout(t)
    }
  }, [channel.enabled])

  return (
    <div className="flex items-center gap-3 py-2.5">
      <motion.span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300',
          channel.enabled ? 'bg-sunrise text-gold-deep' : 'bg-cream text-ink-faint',
        )}
        animate={glow ? { boxShadow: ['0 0 0 0 rgba(217,178,106,0)', '0 0 0 6px rgba(217,178,106,0.35)', '0 0 0 0 rgba(217,178,106,0)'] } : {}}
        transition={{ duration: 0.4 }}
      >
        <Icon size={16} strokeWidth={1.5} />
      </motion.span>
      <div className="min-w-0 flex-1">
        <p className="t-ui-sm font-bold text-ink">{channel.label}</p>
        <p className={cn('t-ui-sm truncate font-medium', channel.placeholder ? 'italic text-ink-faint' : 'text-ink-soft')}>
          {channel.caption}
        </p>
      </div>
      {channel.enabled && (
        <button
          type="button"
          onClick={() => onSendTest(channel.id)}
          className="t-ui-sm shrink-0 font-semibold text-gold-deep underline-offset-2 hover:underline"
        >
          Send test
        </button>
      )}
      <Toggle on={channel.enabled} onChange={() => onToggle(channel.id)} label={`${channel.label} reminders`} />
    </div>
  )
}

export default function ReminderChannels({
  channels,
  onToggle,
  onSendTest,
}: {
  channels: readonly ReminderChannel[]
  onToggle: (id: ChannelId) => void
  onSendTest: (id: ChannelId) => void
}) {
  return (
    <section aria-label="Reminder channels">
      <SectionHeader>Deliver reminders to</SectionHeader>
      <div className="divide-y divide-line">
        {channels.map((c) => (
          <ChannelRow key={c.id} channel={c} onToggle={onToggle} onSendTest={onSendTest} />
        ))}
      </div>
    </section>
  )
}
