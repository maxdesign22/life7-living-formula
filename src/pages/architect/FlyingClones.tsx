/**
 * Ghost-flight layer (meal-architect.md): a scaled-down clone of an
 * ingredient illustration flies along an arc — from a library row into the
 * plate on add, or from a recommendation card into the plate on Apply —
 * so cause/effect is always visible. Fixed overlay, pointer-events none.
 */

import { AnimatePresence, motion } from 'framer-motion'
import type { Flight } from './model'
import { EASE_GLIDE } from './model'

const SIZE = 56

function FlightSprite({ flight, onDone }: { flight: Flight; onDone: (id: number) => void }) {
  const x0 = flight.from.x + flight.from.w / 2 - SIZE / 2
  const y0 = flight.from.y + flight.from.h / 2 - SIZE / 2
  const x1 = flight.to.x + flight.to.w / 2 - SIZE / 2
  const y1 = flight.to.y + flight.to.h / 2 - SIZE / 2
  const midX = (x0 + x1) / 2
  const midY = Math.min(y0, y1) - 96 - flight.arc

  return (
    <motion.div
      className="pointer-events-none fixed z-[100]"
      style={{ width: SIZE, height: SIZE }}
      initial={{ x: x0, y: y0, scale: 0.55, opacity: 0.9, rotate: -8 }}
      animate={{
        x: [x0, midX, x1],
        y: [y0, midY, y1],
        scale: [0.55, 0.9, 1],
        opacity: [0.9, 1, 1],
        rotate: [-8, 4, 0],
      }}
      transition={{
        duration: flight.durationMs / 1000,
        ease: EASE_GLIDE,
        times: [0, 0.55, 1],
      }}
      onAnimationComplete={() => onDone(flight.id)}
    >
      <div
        className="flex h-full w-full items-center justify-center shadow-e-2"
        style={{ borderRadius: '46% 54% 52% 48% / 48% 46% 54% 52%', background: '#F3EBDA' }}
      >
        <img src={`/${flight.image}`} alt="" className="h-[72%] w-[72%] object-contain" draggable={false} />
      </div>
    </motion.div>
  )
}

export default function FlyingClones({
  flights,
  onDone,
}: {
  flights: readonly Flight[]
  onDone: (id: number) => void
}) {
  return (
    <div aria-hidden="true">
      <AnimatePresence>
        {flights.map((f) => (
          <FlightSprite key={f.id} flight={f} onDone={onDone} />
        ))}
      </AnimatePresence>
    </div>
  )
}
