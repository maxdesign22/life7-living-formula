import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { EASE_GLIDE } from './bits'

/** Right-side glass drawer (design.md §9 Drawer: 460px, r-xl left corners, scrim). */
export default function DrawerShell({
  open,
  onClose,
  eyebrow,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  eyebrow: string
  title: string
  children: ReactNode
}) {
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
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            className="glass-strong fixed inset-y-0 right-0 z-[80] flex w-full max-w-[460px] flex-col rounded-l-r-xl shadow-e-3"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.42, ease: EASE_GLIDE }}
            role="dialog"
            aria-label={title}
          >
            <header className="flex items-center justify-between border-b border-line px-6 py-5">
              <div>
                <p className="t-label text-gold-deep">{eyebrow}</p>
                <h2 className="t-display-sm mt-1 text-ink">{title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="glass flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:text-ink"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
