import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, MoreHorizontal, Plus, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Chip, GlassCard, useToast } from '@/components/life7'
import { expiryLabel, type PantryItem } from '@/lib/pantry'
import {
  CATEGORY_TINTS,
  displayName,
  EASE_GLIDE,
  FreshnessRing,
  ingredientOf,
  LOCATION_META,
  stepFor,
  usageSentence,
} from './bits'

/**
 * Pantry grid card (pantry.md Zone B): illustration on a per-category tinted
 * blob, freshness ring, quantity stepper, expiry line, location chip,
 * planned-usage chips, footer remove. Spinach carries the signature
 * breathing burgundy aura.
 */
export default function PantryCard({
  item,
  index,
  onAdjust,
  onRemove,
  onOpen,
}: {
  item: PantryItem
  index: number
  onAdjust: (id: string, deltaG: number) => void
  onRemove: (item: PantryItem, reason: 'removed' | 'used-up') => void
  onOpen: (item: PantryItem) => void
}) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const ing = ingredientOf(item)
  const name = displayName(item)
  const loc = LOCATION_META[item.location]
  const LocIcon = loc.icon
  const urgent = item.expiresInDays <= 2
  const soon = item.expiresInDays > 2 && item.expiresInDays <= 5
  const sentence = usageSentence(item)
  const step = stepFor(item)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25 } }}
      transition={{
        layout: { type: 'spring', stiffness: 300, damping: 32 },
        opacity: { duration: 0.48, delay: Math.min(index, 12) * 0.045 },
        y: { duration: 0.48, delay: Math.min(index, 12) * 0.045, ease: EASE_GLIDE },
      }}
      className="relative"
    >
      {/* signature burgundy aura — spinach (expires < 48h) breathes */}
      {item.ingredientId === 'spinach' && (
        <motion.span
          className="pointer-events-none absolute -inset-[3px] rounded-r-xl border-2 border-burgundy/30"
          animate={{ opacity: [0.35, 0.8, 0.35], scale: [1, 1.012, 1] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        />
      )}
      <GlassCard className="group relative h-full p-5">
        {/* top row: illustration + freshness ring */}
        <div className="flex items-start justify-between">
          <span
            className={cn(
              'blob flex h-[72px] w-[72px] items-center justify-center overflow-hidden transition-transform duration-300 ease-soft group-hover:scale-[1.06]',
              CATEGORY_TINTS[ing.category],
            )}
          >
            <img src={`/${ing.image}`} alt={name} className="h-16 w-16 object-contain" loading="lazy" />
          </span>
          <span className="transition-[filter] duration-300 group-hover:brightness-110">
            <FreshnessRing value={item.freshnessPct} urgentPulse={urgent} />
          </span>
        </div>

        {/* name + quantity stepper */}
        <button type="button" onClick={() => onOpen(item)} className="mt-3 block w-full text-left">
          <span className="t-ui-md block font-bold text-ink">{name}</span>
        </button>
        <div className="mt-1.5 flex items-center gap-2">
          <button
            type="button"
            aria-label={`Decrease ${name} quantity`}
            onClick={() => onAdjust(item.ingredientId, -step)}
            className="glass flex h-7 w-7 items-center justify-center rounded-full text-ink-soft transition-colors hover:text-forest"
          >
            <Minus size={13} strokeWidth={1.5} />
          </button>
          <span className="t-metric-sm tnum min-w-[64px] text-center text-ink">{item.quantityLabel}</span>
          <button
            type="button"
            aria-label={`Increase ${name} quantity`}
            onClick={() => onAdjust(item.ingredientId, step)}
            className="glass flex h-7 w-7 items-center justify-center rounded-full text-ink-soft transition-colors hover:text-forest"
          >
            <Plus size={13} strokeWidth={1.5} />
          </button>
        </div>

        {/* expiry line */}
        <p
          className={cn(
            't-ui-sm mt-2.5 flex items-center gap-1.5',
            urgent ? 'font-bold text-burgundy' : soon ? 'text-gold-deep' : 'text-ink-soft',
          )}
        >
          {urgent && (
            <motion.span
              className="inline-block h-1.5 w-1.5 rounded-full bg-burgundy"
              animate={{ opacity: [1, 0.25, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            />
          )}
          {expiryLabel(item.expiresInDays)}
        </p>

        {/* location chip */}
        <div className="mt-2">
          <Chip variant="glass" icon={<LocIcon size={12} strokeWidth={1.5} />} className="px-2 py-0.5 text-[11px]">
            {loc.label}
          </Chip>
        </div>

        {/* planned usage */}
        <div className="mt-3 min-h-[30px]">
          {item.plannedUsage.length > 0 ? (
            <div className="flex flex-wrap gap-1.5" title={sentence ? `Used in ${sentence}.` : undefined}>
              {item.plannedUsage.map((u) => (
                <motion.span key={`${u.dayId}-${u.mealType}`} whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                  <Chip variant="sage" onClick={() => navigate('/week')} className="px-2 py-0.5 text-[11px]">
                    {u.label}
                  </Chip>
                </motion.span>
              ))}
            </div>
          ) : (
            <p className="t-ui-sm flex items-center gap-1.5 text-gold-deep">
              <Sparkles size={12} strokeWidth={1.5} />
              Not planned —
              <button
                type="button"
                className="font-bold underline-offset-2 hover:underline"
                onClick={() =>
                  toast('Add to Saturday omelette?', {
                    tone: 'gold',
                    action: { label: 'Add', onClick: () => toast(`${name} pencilled into Saturday breakfast.`, { tone: 'sage' }) },
                  })
                }
              >
                Find a use
              </button>
            </p>
          )}
        </div>

        {/* footer hairline + remove */}
        <div className="mt-3 flex items-center justify-end border-t border-line pt-2.5">
          <span className="relative">
            <button
              type="button"
              aria-label={`More actions for ${name}`}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-cream hover:text-ink"
            >
              <MoreHorizontal size={16} strokeWidth={1.5} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.span
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: EASE_GLIDE }}
                  className="glass-strong absolute bottom-full right-0 z-40 mb-1 block w-32 rounded-r-md p-1.5 shadow-e-2"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onRemove(item, 'removed')
                    }}
                    className="t-ui-sm flex w-full items-center gap-2 rounded-r-sm px-3 py-2 text-left text-burgundy transition-colors hover:bg-burgundy/5"
                  >
                    <X size={14} strokeWidth={1.5} /> Remove
                  </button>
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </div>
      </GlassCard>
    </motion.div>
  )
}
