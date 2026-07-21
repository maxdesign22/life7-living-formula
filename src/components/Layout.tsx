import { useEffect, useRef } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import AmbientLife from '@/components/AmbientLife'
import Navbar from '@/components/Navbar'

const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]
const EASE_SOFT = [0.4, 0, 0.2, 1] as [number, number, number, number]

/**
 * App shell (design.md §4/§6/§8): persistent Ambient Life System background,
 * floating nav rail / bottom dock, and the content column with the matching
 * left offset (pages never compensate for the nav).
 * Route transitions: liquid fade per §5.1.
 *
 * Scrolling is 100% native: the main column is a plain `overflow-y-auto`
 * scroller. Lenis was removed because its wheel interception (preventDefault
 * + JS-driven scroll against a self-measured content limit) is exactly what
 * left pages dead to the mouse wheel: nested scrollers (drawers, dropdowns)
 * never received wheel events, and any stale limit clamped page scroll so
 * only dragging the native scrollbar still worked. Native scrolling wheels
 * everywhere, always — smoothness for anchor jumps still comes from
 * `scroll-behavior: smooth` (html, and the scroller below).
 */
export default function Layout() {
  const location = useLocation()
  const outlet = useOutlet()
  const scrollRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)

  // Back to top on navigation. `behavior: 'instant'` overrides the scroller's
  // CSS `scroll-behavior: smooth` so route changes never animate a long
  // scroll-up; in-page anchor jumps (scrollIntoView smooth) stay glidy.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.pathname])

  // Safety net for the transition blur: drop any residual inline `filter`
  // shortly after the entrance settles (0.26s exit + 0.48s entrance). This
  // also covers the very first render where AnimatePresence initial={false}
  // skips the entrance and onAnimationComplete never fires. While framer-motion
  // is still animating it re-asserts the filter every frame, so clearing early
  // is a no-op; afterwards it guarantees the page can never stay blurred and
  // fixed overlays are never trapped by a non-none filter containing block.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const el = pageRef.current
      if (el) el.style.filter = ''
    }, 800)
    return () => window.clearTimeout(t)
  }, [location.pathname])

  return (
    // h-[100dvh] + overflow-hidden on the shell pins the document to exactly
    // one viewport: the window itself can never grow a second scrollbar —
    // the content column below is the app's single scroller.
    <div className="h-[100dvh] overflow-hidden bg-ivory text-ink">
      <AmbientLife />
      <Navbar />
      <main
        ref={scrollRef}
        data-app-scroll
        aria-label="LIFE7 content"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'End') {
            event.preventDefault()
            event.currentTarget.scrollTo({ top: event.currentTarget.scrollHeight, behavior: 'auto' })
          } else if (event.key === 'Home') {
            event.preventDefault()
            event.currentTarget.scrollTo({ top: 0, behavior: 'auto' })
          }
        }}
        className="relative z-10 h-[100dvh] touch-pan-y overflow-x-hidden overflow-y-auto overscroll-y-contain outline-none [-webkit-overflow-scrolling:touch] [scroll-behavior:smooth] min-[900px]:ml-[108px] min-[900px]:[scrollbar-gutter:stable] min-[1200px]:ml-[280px]"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            ref={pageRef}
            initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -14, transition: { duration: 0.26, ease: EASE_SOFT } }}
            transition={{ duration: 0.48, ease: EASE_GLIDE }}
            onAnimationComplete={() => {
              // Un-stuck-proof the transition blur: once the entrance has
              // fully reached blur(0px), drop the residual inline filter.
              // A leftover `filter: blur(0px)` is still a non-none filter —
              // it creates a containing block that traps fixed overlays
              // (drawers, cooking mode) inside this padded column — and any
              // interrupted mid-value would leave the page visibly blurred.
              const el = pageRef.current
              if (el) el.style.filter = ''
            }}
            className="mx-auto min-h-full max-w-[1440px] px-4 pb-[calc(9rem+env(safe-area-inset-bottom))] pt-6 min-[768px]:px-6 min-[900px]:pb-16 min-[1024px]:px-10 min-[1024px]:pt-10"
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
