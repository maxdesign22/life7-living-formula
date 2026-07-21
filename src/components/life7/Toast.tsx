import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastTone = 'sage' | 'gold' | 'burgundy'

export interface ToastOptions {
  tone?: ToastTone
  action?: { label: string; onClick: () => void }
  icon?: ReactNode
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: number
  message: string
}

interface ToastApi {
  toast: (message: string, opts?: ToastOptions) => void
}

const ToastContext = createContext<ToastApi>({ toast: () => undefined })

export function useToast(): ToastApi {
  return useContext(ToastContext)
}

const TONE_ICON: Record<ToastTone, ReactNode> = {
  sage: <CheckCircle2 size={16} className="text-green" />,
  gold: <Info size={16} className="text-gold-deep" />,
  burgundy: <AlertTriangle size={16} className="text-burgundy" />,
}

function ToastCard({ item, onDone }: { item: ToastItem; onDone: (id: number) => void }) {
  const tone = item.tone ?? 'sage'
  const duration = item.duration ?? 4200
  return (
    <motion.div
      layout
      initial={{ y: 16, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 10, opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="glass-strong pointer-events-auto relative flex max-w-sm items-center gap-3 overflow-hidden rounded-r-pill py-3 pl-4 pr-5 shadow-e-2"
      role="status"
    >
      {item.icon ?? TONE_ICON[tone]}
      <span className="t-ui-sm text-ink">{item.message}</span>
      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick()
            onDone(item.id)
          }}
          className="t-ui-sm ml-1 shrink-0 font-bold text-gold-deep underline-offset-2 hover:underline"
        >
          {item.action.label}
        </button>
      )}
      {/* auto-dismiss progress hairline */}
      <motion.div
        className={cn('absolute bottom-0 left-0 h-[2px]', tone === 'burgundy' ? 'bg-burgundy/70' : 'bg-champagne')}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
    </motion.div>
  )
}

/** Toast provider + viewport (design.md §9 Toast): bottom-center glass pill, 4.2s auto-dismiss. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, opts?: ToastOptions) => {
      const id = nextId.current++
      setItems((prev) => [...prev.slice(-2), { id, message, ...opts }])
      window.setTimeout(() => dismiss(id), opts?.duration ?? 4200)
    },
    [dismiss],
  )

  const api = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 px-4 min-[900px]:bottom-8">
        <AnimatePresence>
          {items.map((item) => (
            <ToastCard key={item.id} item={item} onDone={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
