/**
 * Zone C — Notifications summary (settings.md): a condensed mirror of the
 * Planner channels (6 toggles, same toggle logic), the quiet-hours chip
 * opening the same moon-arc editor, and a ghost link into /planner.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Phone, Watch, Mail, Globe, MessageCircle, Send, Moon } from 'lucide-react'
import { Sparkles } from 'lucide-react'
import { GlassCard, useToast } from '@/components/life7'
import {
  DEFAULT_CHANNELS,
  DEFAULT_QUIET_HOURS,
  toggleChannel,
} from '@/lib/reminders'
import type { ChannelId, QuietHours as QuietHoursState, ReminderChannel } from '@/lib/reminders'
import { QuietHoursArc } from '@/pages/planner/QuietHours'
import { EASE_GLIDE, SectionHeader, Toggle, fmtTime } from '@/pages/planner/ui'

const CHANNEL_ICONS: Record<ChannelId, typeof Phone> = {
  phone: Phone,
  smartwatch: Watch,
  email: Mail,
  browser: Globe,
  whatsapp: MessageCircle,
  telegram: Send,
}

export default function NotificationsCard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [channels, setChannels] = useState<readonly ReminderChannel[]>(DEFAULT_CHANNELS)
  const [quiet, setQuiet] = useState<QuietHoursState>(DEFAULT_QUIET_HOURS)
  const [arcOpen, setArcOpen] = useState(false)

  const handleToggle = (id: ChannelId) => {
    const result = toggleChannel(channels, id)
    if (result.toast) {
      toast(result.toast, { tone: 'gold', icon: <Sparkles size={16} className="text-gold-deep" /> })
      return
    }
    setChannels(result.channels)
  }

  return (
    <GlassCard flat className="p-6">
      <SectionHeader
        right={
          <button
            type="button"
            onClick={() => navigate('/planner')}
            className="t-ui-sm shrink-0 font-semibold text-forest underline-offset-4 decoration-champagne decoration-[1.5px] hover:underline"
          >
            Open planner
          </button>
        }
      >
        Notifications
      </SectionHeader>

      <div className="divide-y divide-line">
        {channels.map((c) => {
          const Icon = CHANNEL_ICONS[c.id]
          return (
            <div key={c.id} className="flex items-center gap-3 py-2">
              <span className={c.enabled ? 'flex h-7 w-7 items-center justify-center rounded-full bg-sunrise text-gold-deep' : 'flex h-7 w-7 items-center justify-center rounded-full bg-cream text-ink-faint'}>
                <Icon size={13} strokeWidth={1.5} />
              </span>
              <span className="t-ui-sm flex-1 font-bold text-ink">{c.label}</span>
              <span className="t-ui-sm hidden font-medium text-ink-faint min-[520px]:block">{c.caption}</span>
              <Toggle on={c.enabled} onChange={() => handleToggle(c.id)} label={`${c.label} notifications`} />
            </div>
          )
        })}
      </div>

      {/* quiet hours chip + arc editor popover */}
      <div className="relative mt-4">
        <button
          type="button"
          onClick={() => setArcOpen((o) => !o)}
          className="t-ui-sm inline-flex items-center gap-2 rounded-r-pill bg-cream px-3.5 py-2 font-bold text-forest transition-colors hover:bg-sand"
        >
          <Moon size={13} strokeWidth={1.5} className="text-gold-deep" />
          Quiet hours · {fmtTime(quiet.startMinutes)}–{fmtTime(quiet.endMinutes)}
        </button>
        <AnimatePresence>
          {arcOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setArcOpen(false)} aria-hidden="true" />
              <motion.div
                className="glass-strong absolute left-0 top-[calc(100%+8px)] z-40 w-[280px] rounded-r-lg p-4 shadow-e-3"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.24, ease: EASE_GLIDE }}
              >
                <QuietHoursArc value={quiet} onChange={setQuiet} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  )
}
