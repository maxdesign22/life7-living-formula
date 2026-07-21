import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { MagneticButton, useToast } from '@/components/life7'
import {
  getCanonicalShoppingList,
  getSubstitutions,
  optimiseBudget,
  exportListAsText,
  type ShoppingList,
  type ShoppingStoreId,
  type Substitution,
} from '@/lib/shopping'
import { round2 } from '@/lib/nutrition'
import { EASE_GLIDE, KineticWords, TweenMoney, eur } from './shopping/bits'
import { deriveSections, remainingTotal, rowKey, viewProgress, type RowPatch, type RowPatches, type ViewItem } from './shopping/model'
import ShoppingPath, { ShoppingPathRail } from './shopping/ShoppingPath'
import StoreSectionCard from './shopping/StoreSectionCard'
import RightRail from './shopping/RightRail'
import ActionBar from './shopping/ActionBar'
import OrderOnlineDrawer from './shopping/OrderOnlineDrawer'

/** The optimise-budget script applied as row patches (lib exact figures). */
function optimisationPatches(list: ShoppingList): RowPatches {
  const opt = optimiseBudget(list)
  const findRow = (pred: (i: ShoppingList['sections'][number]['items'][number]) => boolean) => {
    for (const s of list.sections) {
      if (s.store === 'pantry') continue
      const found = s.items.find(pred)
      if (found) return { key: rowKey(s.store, found.id), item: found }
    }
    return null
  }
  const salmon = findRow((i) => i.ingredientId === 'salmon-fillet')
  const tomato = findRow((i) => i.ingredientId === 'tomato')
  const spinach = findRow((i) => i.ingredientId === 'spinach')
  const out: Record<string, RowPatch> = {}
  if (salmon) out[salmon.key] = { swapName: 'Chicken 400 g + eggs ×2', priceOverride: round2(salmon.item.priceEur - opt.steps[0].savesEur), swapUsed: true }
  if (tomato) out[tomato.key] = { priceOverride: round2(tomato.item.priceEur - opt.steps[1].savesEur) }
  if (spinach) out[spinach.key] = { priceOverride: round2(spinach.item.priceEur - opt.steps[2].savesEur) }
  return out
}

export default function Shopping() {
  const { toast } = useToast()
  const list = useMemo(() => getCanonicalShoppingList(), [])
  const substitutions = useMemo(() => getSubstitutions(list), [list])
  const optimisation = useMemo(() => optimiseBudget(list), [list])

  const [patches, setPatches] = useState<RowPatches>({})
  const [openStores, setOpenStores] = useState<readonly ShoppingStoreId[]>(['supermarket', 'market'])
  const [flash, setFlash] = useState<{ store: ShoppingStoreId | null; tick: number }>({ store: null, tick: 0 })
  const [flashRows, setFlashRows] = useState<ReadonlySet<string>>(new Set())
  const [optimised, setOptimised] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  const sections = useMemo(() => deriveSections(list, patches), [list, patches])
  const total = remainingTotal(sections)
  const { done, total: totalItems } = viewProgress(sections)
  const onlineItems = sections.find((s) => s.store === 'online')?.items.filter((i) => !i.purchased) ?? []

  /* -------------------------------------------- 100% celebration, once */
  const prevDone = useRef(done)
  useEffect(() => {
    if (done === totalItems && totalItems > 0 && prevDone.current !== done) {
      // Celebration is intentionally edge-triggered when the final row is checked.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCelebrate(true)
      toast('Week fully stocked.', { tone: 'gold' })
      const t = window.setTimeout(() => setCelebrate(false), 1200)
      return () => window.clearTimeout(t)
    }
    prevDone.current = done
    return undefined
  }, [done, totalItems, toast])

  /* ------------------------------------------------------------- actions */

  const patchRow = (id: string, patch: RowPatch) =>
    setPatches((p) => ({ ...p, [id]: { ...p[id], ...patch } }))

  const onPurchased = (key: string, purchased: boolean) => patchRow(key, { purchased })

  const onRemove = (item: ViewItem, key: string) => {
    patchRow(key, { removed: true })
    toast(`Removed ${item.displayName} from the list.`, {
      tone: 'burgundy',
      action: { label: 'Undo', onClick: () => patchRow(key, { removed: false }) },
    })
  }

  const onSwap = (item: ViewItem, sub: Substitution, key: string) => {
    patchRow(key, {
      swapName: sub.replacementLabel,
      priceOverride: round2(item.priceEur - sub.savesEur),
      swapUsed: true,
    })
    toast(`Swap applied — ${sub.replacementLabel}, saves ${eur(sub.savesEur)}.`, { tone: 'gold' })
  }

  const onOptimise = () => {
    if (optimised) return
    const snapshot = patches
    const opt = optimisationPatches(list)
    setPatches((p) => ({ ...p, ...opt }))
    setOptimised(true)
    setFlashRows(new Set(Object.keys(opt)))
    window.setTimeout(() => setFlashRows(new Set()), 1800)
    toast(`Optimised — total ${eur(optimisation.totalAfterEur)}, ${eur(optimisation.savedEur)} saved.`, {
      tone: 'gold',
      action: {
        label: 'Undo',
        onClick: () => {
          setPatches(snapshot)
          setOptimised(false)
        },
      },
    })
  }

  const onOrderPlaced = (ids: readonly string[]) => {
    setPatches((p) => {
      const next = { ...p }
      for (const id of ids) {
        const key = rowKey('online', id)
        next[key] = { ...next[key], purchased: true }
      }
      return next
    })
    toast('Online items marked as purchased.', { tone: 'sage' })
  }

  const currentList = (): ShoppingList => ({
    ...list,
    sections: sections.map((s) => ({
      store: s.store,
      label: s.label,
      subtotalEur: s.store === 'pantry' ? 0 : s.remainingEur,
      items: s.items.map((i) => ({ ...i, name: i.displayName, priceEur: i.displayPrice })),
    })),
    totalEur: total,
    itemCount: totalItems,
  })

  const onExport = () => {
    const blob = new Blob([exportListAsText(currentList())], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'life7-week24-shopping.txt'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast('Exported life7-week24-shopping.txt.', { tone: 'sage' })
  }

  const onShare = () => {
    const text = exportListAsText(currentList())
    const nav = navigator as Navigator & { share?: (d: { title: string; text: string }) => Promise<void> }
    if (typeof nav.share === 'function') {
      nav.share({ title: 'LIFE7 — Week 24 shopping list', text }).catch(() => undefined)
      toast('List shared.', { tone: 'sage' })
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => toast('List copied.', { tone: 'sage' }),
        () => toast('Copy failed — export the list instead.', { tone: 'burgundy' }),
      )
    } else {
      toast('Sharing not available — export the list instead.', { tone: 'burgundy' })
    }
  }

  const onJump = (store: ShoppingStoreId) => {
    setOpenStores((prev) => (prev.includes(store) ? prev : [...prev, store]))
    setFlash((f) => ({ store, tick: f.tick + 1 }))
    window.setTimeout(() => {
      document.getElementById(`store-${store}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  /* ---------------------------------------------------------------- view */

  return (
    <div className="mx-auto max-w-[1280px]">
      {/* header */}
      <header className="mb-6 flex min-w-0 flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <motion.span
            className="t-label block text-gold-deep"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Week 24 · Market morning
          </motion.span>
          <h1 className="t-display-lg mt-2 text-ink">
            <KineticWords text="Shopping" />
          </h1>
          <motion.p
            className="t-serif-quote mt-2 max-w-[62ch] text-ink-soft"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            Walk in with a plan. Walk out under budget.
          </motion.p>
        </div>
        <motion.div
          className="flex w-full items-center gap-2 min-[520px]:w-auto min-[520px]:gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: EASE_GLIDE }}
        >
          <div className="glass min-w-0 flex-1 rounded-r-pill px-3 py-2 shadow-e-1 min-[520px]:flex-none min-[520px]:px-4">
            <TweenMoney value={total} className="t-metric-sm tnum whitespace-nowrap text-ink" />
            <span className="t-ui-sm tnum text-ink-faint"> / {eur(list.budgetEur)}</span>
          </div>
          <MagneticButton
            variant="gold"
            size="sm"
            icon={<Sparkles size={14} strokeWidth={1.5} />}
            onClick={onOptimise}
            disabled={optimised}
          >
            {optimised ? 'Optimised' : 'Optimise'}
          </MagneticButton>
        </motion.div>
      </header>

      {/* Zone A — shopping path (horizontal ≥1024) */}
      <div className="hidden min-[1024px]:block">
        <ShoppingPath sections={sections} onJump={onJump} />
      </div>

      <div className="mt-6 grid items-start gap-6 min-[1024px]:grid-cols-[1fr_320px]">
        {/* Zone B — store sections (+ vertical mini-rail <1024) */}
        <div className="flex min-w-0 items-start gap-4">
          <div className="sticky top-4 hidden min-[768px]:block min-[1024px]:hidden">
            <ShoppingPathRail sections={sections} onJump={onJump} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {sections.map((s, i) => (
              <StoreSectionCard
                key={s.store}
                section={s}
                open={openStores.includes(s.store)}
                onToggle={() =>
                  setOpenStores((prev) =>
                    prev.includes(s.store) ? prev.filter((x) => x !== s.store) : [...prev, s.store],
                  )
                }
                flashTick={flash.store === s.store ? flash.tick : 0}
                flashRows={flashRows}
                substitutions={substitutions}
                onPurchased={onPurchased}
                onRemove={onRemove}
                onSwap={onSwap}
                staggerIndex={i}
              />
            ))}
          </div>
        </div>

        {/* Zone C — right rail */}
        <RightRail
          sections={sections}
          totalEur={total}
          budgetEur={list.budgetEur}
          pantrySavingsEur={list.pantrySavingsEur}
          optimisation={optimisation}
          optimised={optimised}
          onOptimise={onOptimise}
        />
      </div>

      {/* Zone D — sticky action bar */}
      <div className="mt-6 min-w-0">
        <ActionBar
          done={done}
          total={totalItems}
          celebrate={celebrate}
          optimised={optimised}
          onOrderOnline={() => setOrderOpen(true)}
          onExport={onExport}
          onSendPhone={() => toast('Link sent to •••482.', { tone: 'sage' })}
          onShare={onShare}
          onPrint={() => window.print()}
          onOptimise={onOptimise}
        />
      </div>

      <OrderOnlineDrawer
        open={orderOpen}
        items={onlineItems}
        onClose={() => setOrderOpen(false)}
        onPlaced={onOrderPlaced}
      />

      {/* print-only clean list (no chrome) */}
      <div className="life7-print-area" aria-hidden="true">
        <h1>LIFE7 — Week 24 shopping list</h1>
        <p>
          Total {eur(total)} / budget {eur(list.budgetEur)}
        </p>
        {sections.map((s) => (
          <div key={s.store}>
            <h2>
              {s.label} — {eur(s.store === 'pantry' ? 0 : s.remainingEur)}
            </h2>
            <ul>
              {s.items.map((i) => (
                <li key={i.id}>
                  {i.purchased ? '☑' : '☐'} {i.displayName} — {i.quantityLabel}
                  {s.store === 'pantry' ? '' : `  ${eur(i.displayPrice)}`}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <style>{`
        .life7-print-area { display: none; }
        @media print {
          body * { visibility: hidden; }
          .life7-print-area {
            display: block; visibility: visible;
            position: absolute; left: 0; top: 0; width: 100%;
            background: #FAF6EC; color: #2B2620; padding: 32px;
            font-family: Manrope, sans-serif;
          }
          .life7-print-area * { visibility: visible; }
          .life7-print-area h1 { font-family: Fraunces, serif; font-size: 28px; margin-bottom: 4px; }
          .life7-print-area h2 { font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; margin: 18px 0 6px; color: #6E6659; }
          .life7-print-area ul { list-style: none; padding: 0; margin: 0; }
          .life7-print-area li { font-size: 14px; line-height: 1.9; }
        }
      `}</style>
    </div>
  )
}
