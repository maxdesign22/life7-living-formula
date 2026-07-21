import { useEffect, useRef } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import type { ShoppingStoreId } from '@/lib/shopping'

export const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]
export const EASE_SOFT = [0.4, 0, 0.2, 1] as [number, number, number, number]
export const SPRING_ROW = { type: 'spring', stiffness: 320, damping: 32 } as const

export const eur = (n: number): string => `€${n.toFixed(2)}`

/** Kinetic title: words rise inside overflow masks, stagger 55ms (design.md §5.11). */
export function KineticWords({ text, className }: { text: string; className?: string }) {
  const words = text.split(' ')
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.64, delay: 0.05 + i * 0.055, ease: EASE_GLIDE }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/** Money figure that tweens between values (design.md §5.3 count-up, tnum). */
export function TweenMoney({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(value)
  const first = useRef(true)
  useEffect(() => {
    const controls = animate(mv, value, {
      duration: first.current ? 0 : 0.9,
      ease: EASE_GLIDE,
    })
    first.current = false
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  const text = useTransform(mv, (v) => `€${v.toFixed(2)}`)
  return <motion.span className={className}>{text}</motion.span>
}

/* ---------------------------------------------------------------- icons */
/* Custom thin-line store icons (shopping.md Zone A): basket, market stall,
   cross-leaf, box, home-jar. 24×24, 1.5px stroke, currentColor. */

function IconShell({ children, size = 20 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function StoreIcon({ store, size = 20 }: { store: ShoppingStoreId; size?: number }) {
  switch (store) {
    case 'supermarket':
      return (
        <IconShell size={size}>
          <path d="M4.5 9.5h15l-1.6 8.2a2 2 0 0 1-2 1.6H8.1a2 2 0 0 1-2-1.6L4.5 9.5Z" />
          <path d="M8 9.5 11 4m5 5.5L13 4" />
          <path d="M9.5 13v3m5-3v3" />
        </IconShell>
      )
    case 'market':
      return (
        <IconShell size={size}>
          <path d="M4 10h16" />
          <path d="M5 10v8.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V10" />
          <path d="M4 10 6 4.5h12L20 10" />
          <path d="M4 10a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
        </IconShell>
      )
    case 'pharmacy':
      return (
        <IconShell size={size}>
          <path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5V4Z" />
          <path d="M12 12.5c1.8-1.6 3.4-1.7 4.6-1.2-.3 1.5-1.2 3.2-3 4.1" />
        </IconShell>
      )
    case 'online':
      return (
        <IconShell size={size}>
          <path d="M4 8.5 12 4l8 4.5v9L12 22l-8-4.5v-9Z" />
          <path d="M4 8.5 12 13l8-4.5M12 13v9" />
        </IconShell>
      )
    case 'pantry':
      return (
        <IconShell size={size}>
          <path d="M8 7.5h8v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-11Z" />
          <path d="M9 4.5h6v3H9z" />
          <path d="M8 12.5c1.4-1.3 3-2 4-2s2.6.7 4 2" />
        </IconShell>
      )
  }
}
