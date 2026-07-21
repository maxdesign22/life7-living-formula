import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Truck, X } from 'lucide-react'
import { MagneticButton } from '@/components/life7'
import { eur, EASE_GLIDE } from './bits'
import type { ViewItem } from './model'

type Flow = 'cart' | 'processing' | 'success'

/**
 * Order online drawer (shopping.md Zone D): online items pre-grouped, mock
 * checkout summary, 1.2s processing shimmer, then success ("Delivery
 * Thursday 17:00–19:00") and the online rows auto-mark purchased.
 */
export default function OrderOnlineDrawer({
  open,
  items,
  onClose,
  onPlaced,
}: {
  open: boolean
  items: readonly ViewItem[]
  onClose: () => void
  onPlaced: (itemIds: readonly string[]) => void
}) {
  const [flow, setFlow] = useState<Flow>('cart')
  const subtotal = Math.round(items.reduce((a, i) => a + i.displayPrice, 0) * 100) / 100

  useEffect(() => {
    if (open) setFlow('cart')
  }, [open])

  const placeOrder = () => {
    setFlow('processing')
    window.setTimeout(() => {
      setFlow('success')
      onPlaced(items.map((i) => i.id))
    }, 1200)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-[70] bg-[rgba(43,38,32,0.2)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={flow === 'processing' ? undefined : onClose}
          />
          <motion.aside
            key="drawer"
            className="glass-strong fixed inset-y-0 right-0 z-[80] flex w-full max-w-[460px] flex-col rounded-l-r-xl shadow-e-3"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.42, ease: EASE_GLIDE }}
            role="dialog"
            aria-label="Order online"
          >
            <header className="flex items-center justify-between border-b border-line px-6 py-5">
              <div>
                <p className="t-label text-gold-deep">Online delivery</p>
                <h2 className="t-display-sm mt-1 text-ink">Mock checkout</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={flow === 'processing'}
                aria-label="Close"
                className="glass flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {flow === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE_GLIDE }}
                  className="flex h-full flex-col items-center justify-center text-center"
                >
                  <motion.span
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-sage text-forest shadow-e-1"
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 16 }}
                  >
                    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <motion.path
                        d="M4 12.5 10 18.5 20 5.5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, ease: EASE_GLIDE, delay: 0.15 }}
                      />
                    </svg>
                  </motion.span>
                  <p className="t-display-sm mt-5 text-ink">Order placed</p>
                  <p className="t-ui-md mt-2 flex items-center gap-2 text-ink-soft">
                    <Truck size={16} strokeWidth={1.5} className="text-gold-deep" />
                    Delivery Thursday 17:00–19:00
                  </p>
                  <p className="t-ui-sm mt-3 text-ink-faint">
                    These items were marked as purchased on your list.
                  </p>
                </motion.div>
              ) : (
                <>
                  <ul className="flex flex-col gap-2">
                    {items.map((i) => (
                      <li key={i.id} className="flex items-center gap-3 rounded-r-md bg-cream/50 px-3 py-2.5">
                        <span className="flex h-10 w-10 items-center justify-center rounded-r-sm bg-soft-white">
                          <img src={`/${i.image}`} alt="" className="h-9 w-9 object-contain" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="t-ui-md block truncate font-semibold text-ink">{i.displayName}</span>
                          <span className="t-ui-sm text-ink-faint">{i.quantityLabel}</span>
                        </span>
                        <span className="t-metric-sm tnum whitespace-nowrap text-ink">{eur(i.displayPrice)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 rounded-r-md border border-line p-4">
                    <div className="flex justify-between">
                      <span className="t-ui-md text-ink-soft">Items</span>
                      <span className="t-metric-sm tnum text-ink">{eur(subtotal)}</span>
                    </div>
                    <div className="mt-1.5 flex justify-between">
                      <span className="t-ui-md text-ink-soft">Delivery</span>
                      <span className="t-metric-sm tnum text-green">Free</span>
                    </div>
                    <div className="my-2.5 h-px bg-line" />
                    <div className="flex justify-between">
                      <span className="t-ui-md font-bold text-ink">Total</span>
                      <span className="t-metric-sm tnum text-lg text-ink">{eur(subtotal)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <footer className="border-t border-line px-6 py-5">
              {flow === 'cart' && (
                <MagneticButton variant="primary" size="lg" className="w-full" onClick={placeOrder} disabled={items.length === 0}>
                  Place order · {eur(subtotal)}
                </MagneticButton>
              )}
              {flow === 'processing' && (
                <div className="relative h-[52px] overflow-hidden rounded-r-pill bg-forest/90">
                  <motion.div
                    className="bg-light-wave absolute inset-y-0 w-[35%]"
                    animate={{ x: ['-120%', '320%'] }}
                    transition={{ duration: 0.95, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <span className="t-ui-sm absolute inset-0 flex items-center justify-center font-bold text-soft-white">
                    Processing your order…
                  </span>
                </div>
              )}
              {flow === 'success' && (
                <MagneticButton variant="gold" size="lg" className="w-full" onClick={onClose}>
                  Done
                </MagneticButton>
              )}
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
