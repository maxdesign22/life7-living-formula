import { ArrowDownUp } from 'lucide-react'
import { Chip } from '@/components/life7'
import { INGREDIENT_CATEGORIES, type IngredientCategory, type StorageLocation } from '@/data/ingredients'
import { CATEGORY_LABELS } from './bits'

export type SortId = 'expiring' | 'name' | 'category' | 'freshness'

const SORTS: readonly { id: SortId; label: string }[] = [
  { id: 'expiring', label: 'Expiring first' },
  { id: 'name', label: 'Name' },
  { id: 'category', label: 'Category' },
  { id: 'freshness', label: 'Freshness' },
]

const LOCATIONS: readonly (StorageLocation | 'all')[] = ['all', 'fridge', 'pantry', 'freezer']
const LOCATION_LABELS: Record<string, string> = { all: 'All', fridge: 'Fridge', pantry: 'Pantry', freezer: 'Freezer' }

/**
 * Zone A — filter rail (pantry.md): category chips · location chips · sort.
 * Sticky under the header; horizontal scroll on narrow screens.
 */
export default function FilterRail({
  category,
  location,
  sort,
  onCategory,
  onLocation,
  onSort,
}: {
  category: IngredientCategory | 'all'
  location: StorageLocation | 'all'
  sort: SortId
  onCategory: (c: IngredientCategory | 'all') => void
  onLocation: (l: StorageLocation | 'all') => void
  onSort: (s: SortId) => void
}) {
  return (
    <div className="glass sticky top-3 z-30 flex items-center gap-2 overflow-x-auto rounded-r-pill px-3 py-2 shadow-e-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Chip variant="sage" selected={category === 'all'} onClick={() => onCategory('all')} className="shrink-0 px-2.5 py-1 text-[12px]">
        All
      </Chip>
      {INGREDIENT_CATEGORIES.map((c) => (
        <Chip
          key={c}
          variant="sage"
          selected={category === c}
          onClick={() => onCategory(category === c ? 'all' : c)}
          className="shrink-0 px-2.5 py-1 text-[12px]"
        >
          {CATEGORY_LABELS[c]}
        </Chip>
      ))}

      <span className="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden="true" />

      {LOCATIONS.map((l) => (
        <Chip
          key={l}
          variant="glass"
          selected={location === l}
          onClick={() => onLocation(l)}
          className="shrink-0 px-2.5 py-1 text-[12px]"
        >
          {LOCATION_LABELS[l]}
        </Chip>
      ))}

      <span className="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden="true" />

      <label className="relative ml-auto flex shrink-0 items-center gap-1.5">
        <ArrowDownUp size={13} strokeWidth={1.5} className="pointer-events-none absolute left-3 text-ink-soft" />
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as SortId)}
          aria-label="Sort pantry"
          className="t-ui-sm h-8 cursor-pointer appearance-none rounded-r-pill border border-transparent bg-cream pl-8 pr-3 font-semibold text-ink focus-visible:outline-2 focus-visible:outline-champagne"
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label === 'Expiring first' ? 'Expiring first ↓' : s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
