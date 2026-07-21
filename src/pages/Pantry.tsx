import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, ScanBarcode } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState, MagneticButton, ScoreRing, useToast } from '@/components/life7'
import {
  addPantryItem,
  adjustQuantity,
  createDemoPantry,
  expiringCount,
  expiryLabel,
  getExpiryQueue,
  removePantryItem,
  useSoonItems,
  wasteReductionScore,
  type PantryItem,
  type PantryState,
} from '@/lib/pantry'
import { INGREDIENT_CATEGORIES, type Ingredient, type IngredientCategory, type StorageLocation } from '@/data/ingredients'
import { EASE_GLIDE, ingredientOf, KineticWords, labelFor } from './pantry/bits'
import PantryCard from './pantry/PantryCard'
import FilterRail, { type SortId } from './pantry/FilterRail'
import WastePanel from './pantry/WastePanel'
import AddFoodDrawer from './pantry/AddFoodDrawer'
import ScanDrawer from './pantry/ScanDrawer'
import ItemDetailDrawer from './pantry/ItemDetailDrawer'

/** Keep quantity labels in sync with quantityG after any state change. */
const relabel = (p: PantryState): PantryState => ({
  items: p.items.map((i) => ({ ...i, quantityLabel: labelFor(i, i.quantityG) })),
})

export default function Pantry() {
  const { toast } = useToast()
  const [pantry, setPantry] = useState<PantryState>(() => createDemoPantry())
  const [category, setCategory] = useState<IngredientCategory | 'all'>('all')
  const [location, setLocation] = useState<StorageLocation | 'all'>('all')
  const [sort, setSort] = useState<SortId>('expiring')
  const [useSoon, setUseSoon] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const wasteScore = wasteReductionScore(pantry)
  const expiring = expiringCount(pantry)
  const detailItem = pantry.items.find((i) => i.ingredientId === detailId) ?? null
  // cache the last shown item so the drawer can animate out with content
  const detailCache = useRef<PantryItem | null>(null)
  if (detailItem) detailCache.current = detailItem

  /* ------------------------------------------------- filter + sort (Zone A) */
  const visibleItems = useMemo(() => {
    let items: readonly PantryItem[] = pantry.items
    if (useSoon) {
      const soon = new Set(useSoonItems(pantry, 3).map((i) => i.ingredientId))
      items = items.filter((i) => soon.has(i.ingredientId))
    }
    if (category !== 'all') items = items.filter((i) => ingredientOf(i).category === category)
    if (location !== 'all') items = items.filter((i) => i.location === location)
    switch (sort) {
      case 'name':
        return [...items].sort((a, b) => ingredientOf(a).name.localeCompare(ingredientOf(b).name))
      case 'category':
        return [...items].sort(
          (a, b) =>
            INGREDIENT_CATEGORIES.indexOf(ingredientOf(a).category) -
              INGREDIENT_CATEGORIES.indexOf(ingredientOf(b).category) || a.expiresInDays - b.expiresInDays,
        )
      case 'freshness':
        return [...items].sort((a, b) => b.freshnessPct - a.freshnessPct)
      case 'expiring':
      default: {
        const order = getExpiryQueue({ items }).map((e) => e.item)
        return order
      }
    }
  }, [pantry, useSoon, category, location, sort])

  /* --------------------------------------------------------------- actions */

  const onAdjust = (id: string, deltaG: number) =>
    setPantry((p) => relabel(adjustQuantity(p, id, deltaG)))

  const onRemove = (item: PantryItem, reason: 'removed' | 'used-up') => {
    const index = pantry.items.findIndex((i) => i.ingredientId === item.ingredientId)
    setPantry((p) => removePantryItem(p, item.ingredientId))
    if (detailId === item.ingredientId) setDetailId(null)
    const name = item.ingredientId === 'banana-frozen' ? 'Banana (frozen)' : ingredientOf(item).name
    toast(reason === 'used-up' ? `${name} archived as used up.` : `Removed ${name} from the pantry.`, {
      tone: 'burgundy',
      action: {
        label: 'Undo',
        onClick: () =>
          setPantry((p) => {
            if (p.items.some((i) => i.ingredientId === item.ingredientId)) return p
            const items = [...p.items]
            items.splice(Math.min(Math.max(index, 0), items.length), 0, item)
            return { items }
          }),
      },
    })
  }

  const onAdd = (item: PantryItem, ing: Ingredient) => {
    const exists = pantry.items.some((i) => i.ingredientId === item.ingredientId)
    setPantry((p) => relabel(addPantryItem(p, item)))
    setAddOpen(false)
    toast(
      exists ? `${ing.name} topped up in the pantry.` : `Added ${ing.name} to the pantry.`,
      { tone: 'sage' },
    )
  }

  const onScanDetected = () => {
    const yoghurt: PantryItem = {
      ingredientId: 'greek-yoghurt',
      quantityG: 500,
      quantityLabel: '500 g',
      freshnessPct: 92,
      expiresInDays: 7,
      location: 'fridge',
      plannedUsage: [],
    }
    setPantry((p) => relabel(addPantryItem(p, yoghurt)))
    setScanOpen(false)
    toast('Greek yoghurt 500 g added, scan recognised.', { tone: 'sage' })
  }

  const onFreezeBananas = () => {
    if (pantry.items.some((i) => i.ingredientId === 'banana-frozen')) {
      toast('Two bananas are already frozen for Saturday.', { tone: 'gold' })
      return
    }
    const frozen: PantryItem = {
      ingredientId: 'banana-frozen',
      quantityG: 240,
      quantityLabel: '×2',
      freshnessPct: 100,
      expiresInDays: 90,
      location: 'freezer',
      plannedUsage: [],
    }
    setPantry((p) => relabel(addPantryItem(p, frozen)))
    toast('Two bananas moved to the freezer, Saturday’s oats are safe.', { tone: 'gold' })
  }

  const onUpdate = (id: string, patch: Partial<Pick<PantryItem, 'location' | 'expiresInDays'>>) =>
    setPantry((p) => ({ items: p.items.map((i) => (i.ingredientId === id ? { ...i, ...patch } : i)) }))

  const scrollToWaste = () =>
    document.getElementById('waste-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  /* ------------------------------------------------------------------ view */

  return (
    <div className="mx-auto max-w-[1280px]">
      {/* header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <motion.span className="t-label block text-gold-deep" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            Week 24 · Kitchen stock
          </motion.span>
          <h1 className="t-display-lg mt-2 text-ink">
            <KineticWords text="Pantry" />
          </h1>
          <motion.p
            className="t-serif-quote mt-2 max-w-[62ch] text-ink-soft"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            Nothing forgotten. Nothing wasted.
          </motion.p>
        </div>

        <motion.div
          className="flex flex-wrap items-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: EASE_GLIDE }}
        >
          {/* waste score — click scrolls to Zone C */}
          <button
            type="button"
            onClick={scrollToWaste}
            className="glass flex items-center gap-2.5 rounded-r-lg px-3 py-2 shadow-e-1 transition-shadow duration-300 hover:shadow-gold-glow"
            aria-label={`Waste reduction score ${wasteScore}, jump to details`}
          >
            <ScoreRing value={wasteScore} size={56} strokeWidth={5}>
              {(count) => (
                <span className="t-metric-sm tnum text-ink">
                  <motion.span>{count}</motion.span>
                </span>
              )}
            </ScoreRing>
            <span className="t-label max-w-[64px] text-left text-[9px] leading-snug text-ink-soft">Waste score</span>
          </button>

          {/* use-soon toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={useSoon}
            onClick={() => setUseSoon((v) => !v)}
            className="glass relative flex items-center gap-2.5 rounded-r-pill px-3.5 py-2.5 shadow-e-1"
          >
            <span className={cn('relative h-[26px] w-11 rounded-full transition-colors duration-200', useSoon ? 'bg-sage' : 'bg-cream')}>
              <motion.span
                className="absolute top-[3px] h-5 w-5 rounded-full bg-soft-white shadow-e-1"
                animate={{ left: useSoon ? 22 : 3 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              />
            </span>
            <span className="t-ui-sm font-semibold text-ink">Use soon</span>
            {expiring > 0 && (
              <span className="t-label flex h-4 min-w-4 items-center justify-center rounded-full bg-burgundy px-1 text-[9px] text-soft-white">
                {expiring}
              </span>
            )}
          </button>

          <MagneticButton variant="glass" size="md" icon={<ScanBarcode size={15} strokeWidth={1.5} />} onClick={() => setScanOpen(true)}>
            Scan item
          </MagneticButton>
          <MagneticButton variant="primary" size="md" icon={<Plus size={15} strokeWidth={2} />} onClick={() => setAddOpen(true)}>
            Add food
          </MagneticButton>
        </motion.div>
      </header>

      {/* Zone A — filter rail */}
      <FilterRail category={category} location={location} sort={sort} onCategory={setCategory} onLocation={setLocation} onSort={setSort} />

      {/* Zone B — pantry grid */}
      <div className="mt-5">
        {visibleItems.length === 0 ? (
          <EmptyState
            line="Nothing expiring. Your kitchen is in balance."
            actionLabel="Clear filters"
            onAction={() => {
              setUseSoon(false)
              setCategory('all')
              setLocation('all')
            }}
          />
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-4 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-3 min-[1280px]:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {visibleItems.map((item, i) => (
                <PantryCard
                  key={item.ingredientId}
                  item={item}
                  index={i}
                  onAdjust={onAdjust}
                  onRemove={onRemove}
                  onOpen={(it) => setDetailId(it.ingredientId)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* expiry queue caption strip */}
      <motion.p
        className="t-ui-sm mt-5 text-ink-faint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Next up: {getExpiryQueue(pantry).slice(0, 3).map((e) => `${ingredientOf(e.item).name} (${expiryLabel(e.item.expiresInDays).toLowerCase()})`).join(' · ')}.
      </motion.p>

      {/* Zone C — waste reduction panel */}
      <div id="waste-panel" className="mt-6 scroll-mt-6">
        <WastePanel pantry={pantry} onFreezeBananas={onFreezeBananas} />
      </div>

      {/* drawers */}
      <AddFoodDrawer open={addOpen} onClose={() => setAddOpen(false)} onAdd={onAdd} />
      <ScanDrawer
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onAddManually={() => {
          setScanOpen(false)
          setAddOpen(true)
        }}
        onDetected={onScanDetected}
      />
      <ItemDetailDrawer
        item={detailCache.current}
        open={detailItem !== null}
        onClose={() => setDetailId(null)}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />
    </div>
  )
}
