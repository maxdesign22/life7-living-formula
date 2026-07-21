import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, ScanBarcode, ShieldCheck, ShoppingBasket } from 'lucide-react'
import { MagneticButton } from '@/components/life7'
import { EASE_GLIDE } from './bits'
import DrawerShell from './DrawerShell'

/**
 * Scan item placeholder drawer (pantry.md header): dark scan frame with a
 * sweeping laser line (1.8s loop); after 2.6s the mock recognition fires —
 * "Spinach 300 g detected" → add to Pantry and hand the expiry signal to
 * Continuum, where the user reviews the coordinated change before applying it.
 */
export default function ScanDrawer({
  open,
  onClose,
  onAddManually,
  onDetected,
}: {
  open: boolean
  onClose: () => void
  onAddManually: () => void
  onDetected: () => void
}) {
  const [recognised, setRecognised] = useState(false)

  useEffect(() => {
    if (!open) {
      setRecognised(false)
      return
    }
    const t = window.setTimeout(() => setRecognised(true), 2600)
    return () => window.clearTimeout(t)
  }, [open])

  return (
    <DrawerShell open={open} onClose={onClose} eyebrow="Scan item" title="Camera recognition">
      {/* scan frame */}
      <div className="relative h-64 overflow-hidden rounded-r-lg bg-forest shadow-e-1">
        {/* corner marks */}
        {['left-3 top-3 border-l-2 border-t-2', 'right-3 top-3 border-r-2 border-t-2', 'bottom-3 left-3 border-b-2 border-l-2', 'bottom-3 right-3 border-b-2 border-r-2'].map(
          (pos) => (
            <span key={pos} className={`absolute h-7 w-7 border-champagne/80 ${pos}`} aria-hidden="true" />
          ),
        )}
        {/* laser line — 1.8s sweep loop */}
        {!recognised && (
          <motion.span
            className="absolute left-4 right-4 h-[2px] rounded-full bg-sunlight shadow-[0_0_14px_rgba(242,193,78,0.9)]"
            animate={{ top: ['12%', '88%', '12%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {recognised ? (
              <motion.div
                key="found"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: EASE_GLIDE }}
                className="glass mx-6 flex w-full items-center gap-3 rounded-r-md p-3.5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-r-sm bg-cream">
                  <img src="/ing-spinach.png" alt="" className="h-11 w-11 object-contain" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="t-ui-md block font-bold text-ink">Spinach · 300 g detected</span>
                  <span className="t-ui-sm text-ink-soft">Fridge · use by tomorrow</span>
                </span>
                <Check size={18} strokeWidth={2} className="shrink-0 text-green" />
              </motion.div>
            ) : (
              <motion.span key="scanning" exit={{ opacity: 0 }} className="flex flex-col items-center gap-2 text-soft-white/70">
                <ScanBarcode size={26} strokeWidth={1.5} />
                <span className="t-label text-[9px] tracking-[0.2em]">Scanning…</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {recognised ? (
        <div className="mt-4 grid gap-2 min-[420px]:grid-cols-2" aria-label="Detected system impact">
          <div className="rounded-r-md border border-sage bg-sage-mist/65 p-3">
            <ShieldCheck size={15} className="text-green" />
            <span className="t-label mt-2 block text-green">Expiry signal</span>
            <span className="t-ui-sm mt-1 block font-semibold text-forest">300 g protected for tomorrow</span>
          </div>
          <div className="rounded-r-md border border-champagne/45 bg-sunrise/45 p-3">
            <ShoppingBasket size={15} className="text-gold-deep" />
            <span className="t-label mt-2 block text-gold-deep">Shopping impact</span>
            <span className="t-ui-sm mt-1 block font-semibold text-ink">Duplicate purchase −€1.80</span>
          </div>
        </div>
      ) : (
        <p className="t-serif-quote mt-4 text-[17px] text-ink-soft">
          LIFE7 reads the food, quantity and use-by label, then checks the whole week before changing anything.
        </p>
      )}

      <div className="mt-5 flex flex-col gap-2.5">
        {recognised && (
          <MagneticButton variant="primary" size="lg" className="w-full" onClick={onDetected} icon={<ArrowRight size={16} />}>
            Add & coordinate the week
          </MagneticButton>
        )}
        <MagneticButton variant="glass" size="md" className="w-full" onClick={onAddManually}>
          Add manually
        </MagneticButton>
      </div>
    </DrawerShell>
  )
}
