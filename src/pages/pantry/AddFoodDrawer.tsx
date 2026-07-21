import { useMemo, useState } from 'react'
import { Minus, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Chip, MagneticButton } from '@/components/life7'
import { INGREDIENTS, STORAGE_LOCATIONS, type Ingredient, type StorageLocation } from '@/data/ingredients'
import { freshnessAt, type PantryItem } from '@/lib/pantry'
import { CATEGORY_TINTS, CATEGORY_LABELS, LOCATION_META, newItemLabel } from './bits'
import DrawerShell from './DrawerShell'

const EXPIRY_CHIPS = [
  { id: '2', label: '+2d', days: 2 },
  { id: '4', label: '+4d', days: 4 },
  { id: '7', label: '+7d', days: 7 },
  { id: 'custom', label: 'Custom', days: 14 },
] as const

/**
 * Add food drawer (pantry.md header): search + library pick grid, quantity
 * stepper, storage location segmented control, expiry quick chips → Add.
 */
export default function AddFoodDrawer({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (item: PantryItem, ing: Ingredient) => void
}) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [grams, setGrams] = useState(200)
  const [location, setLocation] = useState<StorageLocation>('fridge')
  const [days, setDays] = useState(4)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return INGREDIENTS.filter((i) => !q || i.name.toLowerCase().includes(q))
  }, [query])

  const selected = INGREDIENTS.find((i) => i.id === selectedId) ?? null

  const pick = (ing: Ingredient) => {
    setSelectedId(ing.id)
    setLocation(ing.defaultLocation)
    setGrams(ing.price.kind === 'piece' ? ing.price.pieceGrams * 4 : 200)
  }

  const step = selected?.price.kind === 'piece' ? selected.price.pieceGrams : 50

  const add = () => {
    if (!selected) return
    const shelf = selected.shelfLifeDays
    const item: PantryItem = {
      ingredientId: selected.id,
      quantityG: grams,
      quantityLabel: newItemLabel(selected, grams),
      freshnessPct: freshnessAt(Math.max(0, shelf - days), shelf),
      expiresInDays: days,
      location,
      plannedUsage: [],
    }
    onAdd(item, selected)
    setSelectedId(null)
    setQuery('')
    setGrams(200)
    setDays(4)
  }

  return (
    <DrawerShell open={open} onClose={onClose} eyebrow="Pantry" title="Add food">
      {/* search */}
      <label className="relative block">
        <Search size={15} strokeWidth={1.5} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the ingredient library…"
          className="t-ui-md h-11 w-full rounded-r-md border border-line bg-soft-white pl-10 pr-3 text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-champagne"
        />
      </label>

      {/* pick grid */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {results.map((ing) => (
          <button
            key={ing.id}
            type="button"
            onClick={() => pick(ing)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-r-md border p-2.5 transition-all duration-200',
              selectedId === ing.id
                ? 'border-champagne bg-sunrise/40 shadow-gold-glow'
                : 'border-line bg-soft-white/60 hover:border-champagne/60',
            )}
          >
            <span className={cn('blob flex h-11 w-11 items-center justify-center', CATEGORY_TINTS[ing.category])}>
              <img src={`/${ing.image}`} alt="" className="h-10 w-10 object-contain" loading="lazy" />
            </span>
            <span className="t-ui-sm w-full truncate text-center text-[11px] text-ink">{ing.name}</span>
            <span className="t-label text-[8px] text-ink-faint">{CATEGORY_LABELS[ing.category]}</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-5 flex flex-col gap-4 rounded-r-md border border-line bg-cream/40 p-4">
          {/* quantity stepper */}
          <div>
            <p className="t-label text-ink-soft">Quantity</p>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setGrams((g) => Math.max(step, g - step))}
                className="glass flex h-9 w-9 items-center justify-center rounded-full text-ink"
              >
                <Minus size={14} strokeWidth={1.5} />
              </button>
              <span className="t-metric-sm tnum min-w-[88px] text-center text-lg text-ink">
                {newItemLabel(selected, grams)}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setGrams((g) => g + step)}
                className="glass flex h-9 w-9 items-center justify-center rounded-full text-ink"
              >
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* location segmented */}
          <div>
            <p className="t-label text-ink-soft">Storage location</p>
            <div className="mt-2 flex rounded-r-pill bg-cream p-1">
              {STORAGE_LOCATIONS.map((l) => {
                const meta = LOCATION_META[l]
                const Icon = meta.icon
                const active = location === l
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLocation(l)}
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

          {/* expiry chips */}
          <div>
            <p className="t-label text-ink-soft">Expires in</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {EXPIRY_CHIPS.map((c) => (
                <Chip key={c.id} variant="gold" selected={days === c.days} onClick={() => setDays(c.days)} className="px-3 py-1 text-[12px]">
                  {c.label}
                </Chip>
              ))}
            </div>
          </div>

          <MagneticButton variant="primary" size="lg" className="mt-1 w-full" onClick={add}>
            Add {selected.name}
          </MagneticButton>
        </div>
      )}
    </DrawerShell>
  )
}
