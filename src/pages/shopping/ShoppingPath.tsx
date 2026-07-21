import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ShoppingStoreId } from '@/lib/shopping'
import { eur, EASE_GLIDE, StoreIcon } from './bits'
import type { ViewSection } from './model'

/**
 * Zone A — Shopping path (shopping.md): five store nodes on an animated
 * route. Path draws L→R 1.1s on mount, nodes pop stagger 90ms, flowing gold
 * dash overlay (8s), courier dot bobs at the first incomplete node and
 * travels along the path (1.2s ease-glide) as sections complete.
 */
export default function ShoppingPath({
  sections,
  onJump,
}: {
  sections: readonly ViewSection[]
  onJump: (store: ShoppingStoreId) => void
}) {
  const incompleteIdx = sections.findIndex((s) => !s.complete)
  const firstIncomplete = incompleteIdx === -1 ? sections.length - 1 : incompleteIdx

  return (
    <div className="glass relative h-[150px] overflow-hidden rounded-r-xl shadow-e-1">
      {/* route line through the node centers (pt-24px + 28px radius → y=52) */}
      <svg
        className="absolute left-0 top-[38px] h-[28px] w-full"
        viewBox="0 0 1000 28"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <motion.path
          d="M 60 14 L 940 14"
          stroke="rgba(46,70,48,0.14)"
          strokeWidth={2}
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: EASE_GLIDE }}
        />
        <motion.path
          d="M 60 14 L 940 14"
          stroke="#D9B26A"
          strokeWidth={2}
          strokeDasharray="6 12"
          strokeLinecap="round"
          fill="none"
          className="animate-dash-drift"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: EASE_GLIDE, delay: 0.15 }}
        />
      </svg>

      {/* courier dot — bobbing above the first incomplete node */}
      <motion.div
        className="pointer-events-none absolute top-[12px] z-10"
        initial={false}
        animate={{ left: `${(firstIncomplete + 0.5) * (100 / sections.length)}%` }}
        transition={{ duration: 1.2, ease: EASE_GLIDE }}
        aria-hidden="true"
      >
        <motion.span
          className="relative block h-3 w-3 -translate-x-1/2 rounded-full bg-gold-deep shadow-gold-glow"
          animate={{ y: [3, -3, 3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="absolute inset-0 animate-halo-ping rounded-full bg-champagne" />
        </motion.span>
      </motion.div>

      {/* nodes */}
      <div className="relative grid h-full" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
        {sections.map((s, i) => (
          <motion.button
            key={s.store}
            type="button"
            onClick={() => onJump(s.store)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.35 + i * 0.09 }}
            className="group flex flex-col items-center pt-[24px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne"
            aria-label={`Jump to ${s.label}`}
          >
            <span
              className={cn(
                'glass relative flex h-14 w-14 items-center justify-center rounded-full text-forest shadow-e-1 transition-all duration-300 ease-soft group-hover:shadow-gold-glow',
                s.complete && 'border-transparent bg-sage text-forest',
              )}
            >
              <StoreIcon store={s.store} size={22} />
              {s.complete && (
                <motion.span
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green text-soft-white shadow-e-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                >
                  <motion.svg
                    width={11}
                    height={11}
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      d="M2 6.5 5 9.5 10 2.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, ease: EASE_GLIDE }}
                    />
                  </motion.svg>
                </motion.span>
              )}
            </span>
            <span className="t-ui-sm mt-2 text-ink">{s.label}</span>
            <span className="mt-1 flex items-center gap-1.5">
              <span className="t-label rounded-r-pill bg-cream px-2 py-0.5 text-[9px] text-ink-soft">
                {s.items.length} {s.items.length === 1 ? 'item' : 'items'}
              </span>
              <span className="t-metric-sm tnum whitespace-nowrap text-[12px] text-gold-deep">
                {s.store === 'pantry' ? '€0.00' : eur(s.canonicalSubtotalEur)}
              </span>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

/** Compact vertical mini-rail for <1024px (shopping.md responsive note). */
export function ShoppingPathRail({
  sections,
  onJump,
}: {
  sections: readonly ViewSection[]
  onJump: (store: ShoppingStoreId) => void
}) {
  return (
    <div className="flex flex-col items-center gap-1 pt-1" aria-hidden={false}>
      {sections.map((s, i) => (
        <div key={s.store} className="flex flex-col items-center">
          {i > 0 && <span className="h-5 w-[2px] bg-line" />}
          <button
            type="button"
            onClick={() => onJump(s.store)}
            aria-label={`Jump to ${s.label}`}
            className={cn(
              'glass relative flex h-10 w-10 items-center justify-center rounded-full text-forest shadow-e-1 transition-shadow duration-300 hover:shadow-gold-glow',
              s.complete && 'border-transparent bg-sage',
            )}
          >
            <StoreIcon store={s.store} size={16} />
            {s.complete && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green text-soft-white">
                <Check size={9} strokeWidth={3} />
              </span>
            )}
          </button>
        </div>
      ))}
    </div>
  )
}
