import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, Printer, Share2, Smartphone, Sparkles, Truck } from 'lucide-react'
import { MagneticButton, ScoreRing } from '@/components/life7'
import { EASE_GLIDE } from './bits'

/** Confetti burst — 12 gold particles when the week is fully stocked. */
function Confetti() {
  const parts = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2
        return {
          x: Math.cos(angle) * (34 + (i % 3) * 14),
          y: Math.sin(angle) * (30 + ((i + 1) % 3) * 12),
          d: 0.7 + (i % 4) * 0.12,
          gold: i % 2 === 0,
        }
      }),
    [],
  )
  return (
    <span className="pointer-events-none absolute left-[22px] top-1/2 z-10" aria-hidden="true">
      {parts.map((p, i) => (
        <motion.span
          key={i}
          className={p.gold ? 'absolute h-1.5 w-1.5 rounded-full bg-champagne' : 'absolute h-1.5 w-1.5 rounded-full bg-sunlight'}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4 }}
          transition={{ duration: p.d, ease: EASE_GLIDE }}
        />
      ))}
    </span>
  )
}

/** Deterministic mock-QR pattern (send-to-phone popover). */
function MockQr() {
  const cells = useMemo(() => {
    const out: boolean[] = []
    let seed = 7
    for (let i = 0; i < 81; i++) {
      seed = (seed * 13 + 5) % 97
      out.push(seed % 3 !== 0)
    }
    return out
  }, [])
  return (
    <span className="mx-auto grid w-[92px] grid-cols-9 gap-[2px] rounded-r-sm bg-soft-white p-2 shadow-e-1" aria-hidden="true">
      {cells.map((on, i) => (
        <span key={i} className={on ? 'h-[7px] w-[7px] rounded-[1px] bg-ink' : 'h-[7px] w-[7px] rounded-[1px] bg-cream'} />
      ))}
    </span>
  )
}

/**
 * Zone D — sticky action bar (shopping.md): purchased progress ring +
 * Order online / Export / Send to phone / Share / Print / Optimise budget.
 */
export default function ActionBar({
  done,
  total,
  celebrate,
  optimised,
  onOrderOnline,
  onExport,
  onSendPhone,
  onShare,
  onPrint,
  onOptimise,
}: {
  done: number
  total: number
  celebrate: boolean
  optimised: boolean
  onOrderOnline: () => void
  onExport: () => void
  onSendPhone: () => void
  onShare: () => void
  onPrint: () => void
  onOptimise: () => void
}) {
  const [phoneOpen, setPhoneOpen] = useState(false)
  const pct = total > 0 ? (done / total) * 100 : 0

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4, ease: EASE_GLIDE }}
      className="sticky bottom-24 z-40 min-w-0 min-[900px]:bottom-4"
    >
      <div className="glass-strong relative flex min-w-0 flex-col gap-3 rounded-r-xl px-3 py-3 shadow-e-3 min-[640px]:flex-row min-[640px]:flex-wrap min-[640px]:items-center min-[640px]:gap-x-4 min-[640px]:gap-y-3 min-[640px]:rounded-r-pill min-[768px]:px-5">
        {/* progress */}
        <div className="relative flex w-full items-center gap-3 min-[640px]:w-auto">
          {celebrate && <Confetti />}
          <ScoreRing value={pct} size={44} strokeWidth={4} animated={false}>
            <span className="t-label text-[8px] text-ink-soft">{Math.round(pct)}%</span>
          </ScoreRing>
          <div className="leading-tight">
            <p className="t-metric-sm tnum whitespace-nowrap text-ink">
              {done}/{total} <span className="text-ink-faint">purchased</span>
            </p>
            <p className="t-label text-[9px] text-ink-faint">Week 24 run</p>
          </div>
        </div>

        <span className="hidden h-8 w-px bg-line min-[768px]:block" />

        {/* actions */}
        <div className="grid w-full grid-cols-2 gap-2 min-[640px]:flex min-[640px]:flex-1 min-[640px]:flex-wrap min-[640px]:items-center min-[640px]:justify-end">
          <MagneticButton variant="primary" size="sm" icon={<Truck size={14} strokeWidth={1.5} />} onClick={onOrderOnline}>
            Order online
          </MagneticButton>
          <MagneticButton variant="glass" size="sm" icon={<Download size={14} strokeWidth={1.5} />} onClick={onExport}>
            Export list
          </MagneticButton>
          <span className="relative">
            <MagneticButton
              variant="glass"
              size="sm"
              icon={<Smartphone size={14} strokeWidth={1.5} />}
              onClick={() => setPhoneOpen((v) => !v)}
            >
              Send to phone
            </MagneticButton>
            <AnimatePresence>
              {phoneOpen && (
                <>
                  <motion.span
                    className="fixed inset-0 z-30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setPhoneOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.2, ease: EASE_GLIDE }}
                    className="glass-strong absolute bottom-full right-0 z-40 mb-2 w-56 rounded-r-md p-4 text-center shadow-e-2"
                  >
                    <MockQr />
                    <p className="t-ui-sm mt-3 text-ink-soft">Scan with the LIFE7 mobile app, or send a link.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneOpen(false)
                        onSendPhone()
                      }}
                      className="t-ui-sm mt-3 h-9 w-full rounded-r-md bg-forest font-bold text-soft-white shadow-e-1 transition-shadow duration-300 hover:shadow-gold-glow"
                    >
                      Send link
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </span>
          <span className="hidden min-[640px]:contents">
            <MagneticButton variant="glass" size="sm" icon={<Share2 size={14} strokeWidth={1.5} />} onClick={onShare}>
              Share
            </MagneticButton>
            <MagneticButton variant="glass" size="sm" icon={<Printer size={14} strokeWidth={1.5} />} onClick={onPrint}>
              Print
            </MagneticButton>
          </span>
          <MagneticButton
            variant="gold"
            size="sm"
            icon={<Sparkles size={14} strokeWidth={1.5} />}
            onClick={onOptimise}
            disabled={optimised}
          >
            {optimised ? 'Optimised' : 'Optimise budget'}
          </MagneticButton>
        </div>
      </div>
    </motion.div>
  )
}
