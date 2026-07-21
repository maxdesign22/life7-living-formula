/**
 * Zone E — Data & privacy (settings.md): export my data (real JSON
 * download), import demo data (file input, parses, toasts), reset prototype
 * (confirm → session cleared, soft reload into the splash).
 */
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Upload, RotateCcw } from 'lucide-react'
import { GlassCard, useToast } from '@/components/life7'
import { USER_PROFILE, DAILY_TARGETS } from '@/data/profile'
import { DEMO_WEEK } from '@/data/demoWeek'
import { createDemoPantry, getPantrySummary } from '@/lib/pantry'
import { SectionHeader } from '@/pages/planner/ui'

export default function DataPrivacy() {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const exportData = () => {
    const pantry = createDemoPantry()
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: USER_PROFILE,
      dailyTargets: DAILY_TARGETS,
      week: DEMO_WEEK,
      pantry: getPantrySummary(pantry),
      scores: DEMO_WEEK.days.map((d) => ({ day: d.dayName, score: d.score })),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'life7-alex-data.json'
    a.click()
    URL.revokeObjectURL(url)
    toast('Exported life7-alex-data.json. Everything is in your hands.', { tone: 'sage' })
  }

  const importData = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as { profile?: { id?: string }; week?: unknown }
        if (parsed?.profile?.id === 'alex' && parsed.week) {
          toast('Demo data imported. Week refreshed from file.', { tone: 'sage' })
        } else {
          toast('That file is not a LIFE7 export.', { tone: 'burgundy' })
        }
      } catch {
        toast('That file is not a LIFE7 export.', { tone: 'burgundy' })
      }
    }
    reader.readAsText(file)
  }

  return (
    <GlassCard flat className="p-6">
      <SectionHeader>Data &amp; privacy</SectionHeader>
      <div className="space-y-1">
        <button
          type="button"
          onClick={exportData}
          className="t-ui-sm flex w-full items-center gap-3 rounded-r-sm px-2 py-2.5 text-left font-semibold text-forest transition-colors hover:bg-cream/60"
        >
          <Download size={15} strokeWidth={1.5} className="text-gold-deep" />
          Export my data
          <span className="t-ui-sm ml-auto font-medium text-ink-faint">life7-alex-data.json</span>
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="t-ui-sm flex w-full items-center gap-3 rounded-r-sm px-2 py-2.5 text-left font-semibold text-forest transition-colors hover:bg-cream/60"
        >
          <Upload size={15} strokeWidth={1.5} className="text-gold-deep" />
          Import demo data
          <span className="t-ui-sm ml-auto font-medium text-ink-faint">.json</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importData(f)
            e.target.value = ''
          }}
        />
        <div className="px-2 py-2.5">
          {confirmReset ? (
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <span className="t-ui-sm font-semibold text-burgundy">Reset everything to the seed state?</span>
              <button
                type="button"
                className="t-ui-sm font-bold text-burgundy underline-offset-2 hover:underline"
                onClick={() => {
                  sessionStorage.clear()
                  toast('Prototype reset. Back to the first morning.', { tone: 'sage' })
                  window.setTimeout(() => window.location.reload(), 900)
                }}
              >
                Confirm reset
              </button>
              <button type="button" className="t-ui-sm font-semibold text-ink-soft hover:text-ink" onClick={() => setConfirmReset(false)}>
                Keep
              </button>
            </motion.div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="t-ui-sm inline-flex items-center gap-3 font-semibold text-burgundy/85 transition-colors hover:text-burgundy"
            >
              <RotateCcw size={15} strokeWidth={1.5} />
              Reset prototype
            </button>
          )}
        </div>
      </div>
      <p className="t-ui-sm mt-3 border-t border-line pt-3 font-medium text-ink-faint">
        Your data stays on your device in this prototype.
      </p>
    </GlassCard>
  )
}
