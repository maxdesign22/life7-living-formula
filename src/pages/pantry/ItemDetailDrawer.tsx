import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChefHat } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Chip, MagneticButton, MetricBar } from '@/components/life7'
import { STORAGE_LOCATIONS, type StorageLocation } from '@/data/ingredients'
import { expiryLabel, type PantryItem } from '@/lib/pantry'
import {
  CATEGORY_TINTS,
  displayName,
  EASE_GLIDE,
  freshnessHistory,
  FreshnessRing,
  ingredientOf,
  LOCATION_META,
  usageSentence,
} from './bits'
import DrawerShell from './DrawerShell'

const EXPIRY_CHIPS = [
  { label: '+2d', days: 2 },
  { label: '+4d', days: 4 },
  { label: '+7d', days: 7 },
  { label: 'Custom', days: 14 },
] as const

/** Freshness history sparkline — 7 days, draws 800ms (pantry.md item drawer). */
function FreshnessSparkline({ item }: { item: PantryItem }) {
  const history = freshnessHistory(item)
  const { d, points } = useMemo(() => {
    const w = 260
    const h = 56
    const pts = history.map((v, i) => ({
      x: (i / (history.length - 1)) * w,
      y: h - (v / 100) * (h - 6) - 3,
      v,
    }))
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    return { d: path, points: pts }
  }, [history])

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="t-label text-ink-soft">Freshness · 7 days</p>
        <p className="t-metric-sm tnum text-ink">{item.freshnessPct}%</p>
      </div>
      <svg viewBox="0 0 260 56" className="mt-2 w-full" role="img" aria-label="Freshness history">
        <motion.path
          key={item.ingredientId}
          d={d}
          fill="none"
          stroke="#5C7A54"
          strokeWidth={2}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: EASE_GLIDE }}
        />
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 3.5 : 2}
            fill={i === points.length - 1 ? '#B08A3E' : '#C9D6C0'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.09 }}
          />
        ))}
      </svg>
      <div className="flex justify-between">
        <span className="t-label text-[8px] text-ink-faint">6 days ago</span>
        <span className="t-label text-[8px] text-ink-faint">today</span>
      </div>
    </div>
  )
}

/**
 * Item detail drawer (pantry.md): hero, per-100 g nutrient block, freshness
 * sparkline, location + expiry editors, usage list, and the three actions.
 */
export default function ItemDetailDrawer({
  item,
  open,
  onClose,
  onUpdate,
  onRemove,
}: {
  /** Cached item — kept non-null during the exit animation. */
  item: PantryItem | null
  open: boolean
  onClose: () => void
  onUpdate: (id: string, patch: Partial<Pick<PantryItem, 'location' | 'expiresInDays'>>) => void
  onRemove: (item: PantryItem, reason: 'removed' | 'used-up') => void
}) {
  const navigate = useNavigate()
  if (!item) return null
  const ing = ingredientOf(item)
  const name = displayName(item)
  const sentence = usageSentence(item)

  return (
    <DrawerShell open={open} onClose={onClose} eyebrow={LOCATION_META[item.location].label} title={name}>
      {/* hero */}
      <div className={cn('blob relative mx-auto flex h-[160px] w-[160px] items-center justify-center', CATEGORY_TINTS[ing.category])}>
        <img src={`/${ing.image}`} alt={name} className="h-36 w-36 object-contain" />
        <span className="absolute -right-2 -top-2 rounded-full bg-soft-white p-1 shadow-e-1">
          <FreshnessRing value={item.freshnessPct} size={44} urgentPulse={item.expiresInDays <= 2} />
        </span>
      </div>
      <p className="t-ui-md mt-3 text-center text-ink-soft">
        {item.quantityLabel} · {expiryLabel(item.expiresInDays).toLowerCase()}
      </p>
      {sentence && <p className="t-serif-quote mt-1 text-center text-[15px] text-ink-soft">Used in {sentence}.</p>}

      {/* nutrients per 100 g */}
      <div className="mt-5 rounded-r-md border border-line p-4">
        <div className="flex items-baseline justify-between">
          <p className="t-label text-ink-soft">Per 100 g</p>
          <p className="t-metric-sm tnum text-ink">{ing.per100g.kcal} kcal</p>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          <MetricBar label="Protein" value={`${ing.per100g.protein} g`} pct={(ing.per100g.protein / 35) * 100} height={5} />
          <MetricBar label="Carbs" value={`${ing.per100g.carbs} g`} pct={(ing.per100g.carbs / 70) * 100} height={5} />
          <MetricBar label="Fat" value={`${ing.per100g.fat} g`} pct={(ing.per100g.fat / 70) * 100} height={5} />
          <MetricBar label="Fibre" value={`${ing.per100g.fibre} g`} pct={(ing.per100g.fibre / 12) * 100} height={5} />
        </div>
      </div>

      {/* freshness sparkline */}
      <div className="mt-4 rounded-r-md border border-line p-4">
        <FreshnessSparkline item={item} />
      </div>

      {/* storage location editor */}
      <div className="mt-4">
        <p className="t-label text-ink-soft">Storage location</p>
        <div className="mt-2 flex rounded-r-pill bg-cream p-1">
          {STORAGE_LOCATIONS.map((l: StorageLocation) => {
            const meta = LOCATION_META[l]
            const Icon = meta.icon
            const active = item.location === l
            return (
              <button
                key={l}
                type="button"
                onClick={() => onUpdate(item.ingredientId, { location: l })}
                className={cn(
                  't-ui-sm flex h-9 flex-1 items-center justify-center gap-1.5 rounded-r-pill font-semibold transition-all duration-200',
                  active ? 'bg-soft-white text-forest shadow-e-1' : 'text-ink-soft hover:text-ink',
                )}
              >
                <Icon size={13} strokeWidth={1.5} />
                {meta.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* expiry editor */}
      <div className="mt-4">
        <p className="t-label text-ink-soft">Expires in</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXPIRY_CHIPS.map((c) => (
            <Chip
              key={c.label}
              variant="gold"
              selected={item.expiresInDays === c.days}
              onClick={() => onUpdate(item.ingredientId, { expiresInDays: c.days })}
              className="px-3 py-1 text-[12px]"
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* usage list */}
      {item.plannedUsage.length > 0 && (
        <div className="mt-4">
          <p className="t-label text-ink-soft">Planned usage</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {item.plannedUsage.map((u) => (
              <li key={`${u.dayId}-${u.mealType}`}>
                <button
                  type="button"
                  onClick={() => navigate('/week')}
                  className="t-ui-sm flex w-full items-center justify-between rounded-r-sm bg-cream/60 px-3 py-2 text-left text-ink transition-colors hover:bg-cream"
                >
                  <span className="font-semibold">{u.label}</span>
                  <span className="tnum text-ink-faint">{u.grams} g</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* actions */}
      <div className="mt-6 flex flex-col gap-2.5">
        <MagneticButton
          variant="primary"
          size="lg"
          className="w-full"
          icon={<ChefHat size={15} strokeWidth={1.5} />}
          onClick={() => navigate('/architect')}
        >
          Use now in Architect
        </MagneticButton>
        <div className="flex gap-2.5">
          <MagneticButton variant="glass" size="md" className="flex-1" onClick={() => onRemove(item, 'used-up')}>
            Mark as used up
          </MagneticButton>
          <MagneticButton variant="ghost" size="md" className="flex-1 !text-burgundy" onClick={() => onRemove(item, 'removed')}>
            Remove
          </MagneticButton>
        </div>
      </div>
    </DrawerShell>
  )
}
