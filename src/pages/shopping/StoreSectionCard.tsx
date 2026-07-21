import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, MoreHorizontal, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Chip, GlassCard } from '@/components/life7'
import type { ShoppingStoreId, Substitution } from '@/lib/shopping'
import { eur, EASE_GLIDE, StoreIcon, TweenMoney } from './bits'
import { mealsUsing, rowKey, type ViewItem, type ViewSection } from './model'

interface SectionProps {
  section: ViewSection
  open: boolean
  onToggle: () => void
  /** increments to flash the header gold once (path node click) */
  flashTick: number
  /** rows highlighted by the budget optimisation sequence */
  flashRows: ReadonlySet<string>
  substitutions: readonly Substitution[]
  onPurchased: (key: string, purchased: boolean) => void
  onRemove: (item: ViewItem, key: string) => void
  onSwap: (item: ViewItem, sub: Substitution, key: string) => void
  staggerIndex: number
}

/** Zone B — one store's accordion card with checkable item rows. */
export default function StoreSectionCard({
  section,
  open,
  onToggle,
  flashTick,
  flashRows,
  substitutions,
  onPurchased,
  onRemove,
  onSwap,
  staggerIndex,
}: SectionProps) {
  const isPantry = section.store === 'pantry'
  return (
    <motion.div
      id={`store-${section.store}`}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.56, delay: 0.1 + staggerIndex * 0.07, ease: EASE_GLIDE }}
      className="scroll-mt-24"
    >
      <GlassCard flat className="min-w-0 overflow-visible">
        {/* header */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="relative flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-t-r-lg px-3 py-3.5 text-left min-[640px]:gap-3 min-[640px]:px-5 min-[640px]:py-4"
        >
          {/* gold flash on path-node jump */}
          <motion.span
            key={flashTick}
            className="pointer-events-none absolute inset-0 bg-champagne/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: flashTick > 0 ? [0, 1, 0] : 0 }}
            transition={{ duration: 0.9, ease: EASE_GLIDE }}
            aria-hidden="true"
          />
          <span className="glass flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-forest shadow-e-1">
            <StoreIcon store={section.store} size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="t-ui-md block truncate font-bold text-ink">{section.label}</span>
            <span className="t-ui-sm block text-ink-faint">
              {section.items.length} {section.items.length === 1 ? 'item' : 'items'}
            </span>
          </span>
          <TweenMoney
            value={section.remainingEur}
            className="t-metric-sm tnum whitespace-nowrap text-ink"
          />
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25, ease: EASE_GLIDE }}
            className="text-ink-soft"
          >
            <ChevronDown size={18} strokeWidth={1.5} />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.38, ease: EASE_GLIDE }}
              className="overflow-hidden"
            >
              <ul className="flex min-w-0 flex-col gap-1 px-1.5 pb-3 min-[640px]:px-3 min-[640px]:pb-4">
                <AnimatePresence initial={false}>
                  {section.items.map((item, i) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      store={section.store}
                      index={i}
                      isPantry={isPantry}
                      flash={flashRows.has(rowKey(section.store, item.id))}
                      substitution={substitutions.find((s) => s.ingredientId === item.ingredientId)}
                      onPurchased={onPurchased}
                      onRemove={onRemove}
                      onSwap={onSwap}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ row */

function ItemRow({
  item,
  store,
  index,
  isPantry,
  flash,
  substitution,
  onPurchased,
  onRemove,
  onSwap,
}: {
  item: ViewItem
  store: ShoppingStoreId
  index: number
  isPantry: boolean
  flash: boolean
  substitution: Substitution | undefined
  onPurchased: (key: string, purchased: boolean) => void
  onRemove: (item: ViewItem, key: string) => void
  onSwap: (item: ViewItem, sub: Substitution, key: string) => void
}) {
  const navigate = useNavigate()
  const [detailOpen, setDetailOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [swapOpen, setSwapOpen] = useState(false)
  const usage = mealsUsing(item.ingredientId)
  const key = rowKey(store, item.id)

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0, overflow: 'hidden' }}
      transition={{
        layout: { type: 'spring', stiffness: 300, damping: 34 },
        opacity: { duration: 0.3, delay: index * 0.035 },
        y: { duration: 0.3, delay: index * 0.035 },
      }}
      className="relative"
    >
      {/* optimisation highlight */}
      <motion.span
        className="pointer-events-none absolute inset-0 rounded-r-md bg-champagne/25"
        initial={{ opacity: 0 }}
        animate={{ opacity: flash ? [0, 1, 0.35] : 0 }}
        transition={{ duration: 1.2, ease: EASE_GLIDE }}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative grid min-w-0 grid-cols-[28px_40px_minmax(0,1fr)_auto_auto] items-center gap-2 rounded-r-md px-1.5 py-2 transition-colors duration-200 hover:bg-cream/50 min-[640px]:flex min-[640px]:gap-3 min-[640px]:px-2',
          isPantry && 'opacity-60',
        )}
      >
        {/* checkbox */}
        {isPantry ? (
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage text-forest"
            title="Already home — auto-deducted"
          >
            <Check size={14} strokeWidth={2.5} />
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onPurchased(key, !item.purchased)}
            aria-pressed={item.purchased}
            aria-label={`Mark ${item.displayName} as purchased`}
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-200',
              item.purchased
                ? 'border-transparent bg-sunrise-gold text-ink shadow-e-1'
                : 'border-sand bg-soft-white text-transparent hover:border-champagne',
            )}
          >
            <svg width={13} height={13} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <motion.path
                d="M2 6.5 5 9.5 10 2.5"
                initial={false}
                animate={{ pathLength: item.purchased ? 1 : 0 }}
                transition={{ duration: 0.3, ease: EASE_GLIDE }}
              />
            </svg>
          </button>
        )}

        {/* illustration */}
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-r-sm bg-cream min-[640px]:h-11 min-[640px]:w-11">
          <img src={`/${item.image}`} alt="" className="h-9 w-9 object-contain min-[640px]:h-10 min-[640px]:w-10" loading="lazy" />
        </span>

        {/* name + quantity (+ strikethrough) */}
        <motion.button
          type="button"
          onClick={() => {
            setDetailOpen((v) => !v)
            setMenuOpen(false)
            setSwapOpen(false)
          }}
          className="min-w-0 flex-1 text-left"
          animate={{ x: item.purchased && !isPantry ? 8 : 0, opacity: item.purchased && !isPantry ? 0.55 : 1 }}
          transition={{ duration: 0.3, ease: EASE_GLIDE }}
        >
          <span className="relative inline-block max-w-full">
            <span className="t-ui-md block truncate font-semibold text-ink">
              {item.displayName} — {item.quantityLabel}
            </span>
            {!isPantry && (
              <motion.span
                className="absolute left-0 top-1/2 h-[1.5px] w-full origin-left bg-ink-soft"
                initial={false}
                animate={{ scaleX: item.purchased ? 1 : 0 }}
                transition={{ duration: 0.3, ease: EASE_GLIDE }}
                aria-hidden="true"
              />
            )}
          </span>
          {item.note && store === 'pharmacy' && (
            <span className="t-ui-sm block text-ink-faint">{item.note}</span>
          )}
          {item.note && item.badges.includes('use-first') && (
            <span className="t-ui-sm block text-burgundy/80">{item.note}</span>
          )}
          <span className="mt-1 flex flex-wrap gap-1 min-[640px]:hidden">
            {item.badges.includes('use-first') && <span className="rounded-r-pill bg-burgundy/10 px-1.5 py-0.5 text-[9px] font-bold text-burgundy">use first</span>}
            {item.badges.includes('swap') && substitution && <span className="rounded-r-pill bg-sunrise px-1.5 py-0.5 text-[9px] font-bold text-gold-deep">swap available</span>}
          </span>
        </motion.button>

        {/* badges */}
        <span className="hidden shrink-0 items-center gap-1.5 min-[640px]:flex">
          {item.badges.includes('at-home') && !isPantry && (
            <Chip variant="sage" className="px-2 py-0.5 text-[11px]">at home</Chip>
          )}
          {item.badges.includes('use-first') && (
            <Chip variant="burgundy-outline" className="px-2 py-0.5 text-[11px]">use first</Chip>
          )}
          {item.badges.includes('swap') && substitution && (
            <span className="relative">
              <Chip
                variant="gold"
                icon={<Sparkles size={12} strokeWidth={1.5} />}
                className="px-2 py-0.5 text-[11px]"
                onClick={() => {
                  setSwapOpen((v) => !v)
                  setDetailOpen(false)
                  setMenuOpen(false)
                }}
              >
                swap
              </Chip>
              <AnimatePresence>
                {swapOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.2, ease: EASE_GLIDE }}
                    className="glass-strong absolute right-0 top-full z-40 mt-2 w-72 rounded-r-md p-4 shadow-e-2"
                  >
                    <p className="t-label text-gold-deep">Substitution</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="t-ui-sm text-ink-soft line-through">
                        {item.name} {item.quantityLabel} · {eur(item.priceEur)}
                      </span>
                      <span className="t-ui-sm font-bold text-ink">
                        {substitution.replacementLabel} · {eur(item.priceEur - substitution.savesEur)}
                      </span>
                    </div>
                    <p className="t-ui-sm mt-2 text-ink-soft">
                      saves {eur(substitution.savesEur)} · protein {substitution.proteinDeltaG > 0 ? '+' : ''}
                      {substitution.proteinDeltaG} g
                    </p>
                    <p className="t-serif-quote mt-2 text-[15px] text-ink-soft">{substitution.note}</p>
                    <button
                      type="button"
                      onClick={() => {
                        onSwap(item, substitution, key)
                        setSwapOpen(false)
                      }}
                      className="t-ui-sm mt-3 h-9 w-full rounded-r-md bg-sunrise-gold font-bold text-ink shadow-e-1 transition-shadow duration-300 hover:shadow-gold-glow"
                    >
                      Apply swap
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </span>
          )}
        </span>

        {/* price */}
        <span className="t-metric-sm tnum w-auto shrink-0 whitespace-nowrap text-right text-[13px] text-ink min-[640px]:w-16 min-[640px]:text-[15px]">
          {isPantry ? '—' : eur(item.displayPrice)}
        </span>

        {/* pharmacy: ghost remove; others: ⋯ menu */}
        {store === 'pharmacy' ? (
          <button
            type="button"
            onClick={() => onRemove(item, key)}
            className="t-ui-sm shrink-0 font-semibold text-ink-faint underline-offset-4 transition-colors hover:text-burgundy hover:underline"
          >
            Remove
          </button>
        ) : (
          !isPantry && (
            <span className="relative shrink-0">
              <button
                type="button"
                aria-label={`More actions for ${item.displayName}`}
                onClick={() => {
                  setMenuOpen((v) => !v)
                  setDetailOpen(false)
                  setSwapOpen(false)
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-cream hover:text-ink"
              >
                <MoreHorizontal size={16} strokeWidth={1.5} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: EASE_GLIDE }}
                    className="glass-strong absolute right-0 top-full z-40 mt-1 w-36 rounded-r-md p-1.5 shadow-e-2"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onRemove(item, key)
                        setMenuOpen(false)
                      }}
                      className="t-ui-sm flex w-full items-center gap-2 rounded-r-sm px-3 py-2 text-left text-burgundy transition-colors hover:bg-burgundy/5"
                    >
                      <X size={14} strokeWidth={1.5} /> Remove
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </span>
          )
        )}
      </div>

      {/* detail popover: which meals use it */}
      <AnimatePresence>
        {detailOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: EASE_GLIDE }}
            className="overflow-hidden"
          >
            <div className="mx-2 mb-2 rounded-r-md bg-cream/60 p-3">
              {usage.length > 0 ? (
                <>
                  <p className="t-label text-ink-soft">Used in</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {usage.map((u) => (
                      <Chip key={`${u.dayId}-${u.chip}`} variant="glass" onClick={() => navigate('/week')} className="px-2 py-0.5 text-[11px]">
                        {u.chip}
                      </Chip>
                    ))}
                  </div>
                </>
              ) : (
                <p className="t-ui-sm text-ink-faint">Not tied to a specific meal — stocked staple.</p>
              )}
              <p className="t-ui-sm mt-1.5 text-ink-faint">
                {item.note ?? `Store note: restocked weekly at the ${store === 'pantry' ? 'pantry' : store}.`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}
