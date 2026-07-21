/**
 * Zone E — Nutrient Diversity Orbit (progress.md): 12 nutrients placed on a
 * circle around the diversity index (8.4/10). Each nutrient is an arc
 * segment sized by coverage % (sage→green; champagne when under-covered),
 * drifting ±3° on a 20 s sine — a living orbit echoing the logo. Hover draws
 * a connector to center + tooltip; click toasts the top food sources.
 */
import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { GlassCard, useToast } from '@/components/life7'
import { CountUp, mixHex } from './shared'
import { EASE_GLIDE } from '@/pages/planner/ui'

const C = 170
const R = 100
const SLOT = 30 // 360 / 12
const GAP = 4

interface Nutrient {
  name: string
  pct: number
  sources: string
}

const NUTRIENTS: readonly Nutrient[] = [
  { name: 'Vit C', pct: 92, sources: 'tomato ×6, broccoli ×4' },
  { name: 'Folate', pct: 78, sources: 'broccoli ×4, spinach ×3' },
  { name: 'Iron', pct: 71, sources: 'spinach ×4, eggs ×5' },
  { name: 'Magnesium', pct: 64, sources: 'walnuts ×5, oats ×4' },
  { name: 'Omega-3', pct: 45, sources: 'salmon ×2, walnuts ×5' },
  { name: 'Zinc', pct: 68, sources: 'eggs ×5, chicken ×5' },
  { name: 'B12', pct: 82, sources: 'eggs ×6, yoghurt ×5' },
  { name: 'D', pct: 38, sources: 'salmon ×2, D3 supplement daily' },
  { name: 'Calcium', pct: 74, sources: 'yoghurt ×6, feta ×3' },
  { name: 'Potassium', pct: 88, sources: 'banana ×6, tomato ×5' },
  { name: 'Fibre', pct: 64, sources: 'oats ×4, broccoli ×4' },
  { name: 'Polyphenols', pct: 57, sources: 'blueberries ×1, olive oil ×7' },
]

const polar = (deg: number, r: number): [number, number] => {
  const a = (deg * Math.PI) / 180
  return [C + r * Math.cos(a), C + r * Math.sin(a)]
}

function arcPath(start: number, end: number, r: number): string {
  const [x0, y0] = polar(start, r)
  const [x1, y1] = polar(end, r)
  const large = end - start > 180 ? 1 : 0
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

export default function DiversityOrbit() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const [hover, setHover] = useState<number | null>(null)
  const { toast } = useToast()

  return (
    <GlassCard flat size="xl" className="flex h-full flex-col p-5 min-[768px]:p-6">
      <div ref={ref} className="flex flex-1 flex-col">
        <span className="t-label text-gold-deep">Nutrient diversity</span>
        <p className="t-ui-sm mt-1 font-medium text-ink-soft">12 nutrients tracked across the week</p>

        <div className="relative mx-auto mt-1 w-full max-w-[330px] flex-1">
          <motion.svg
            viewBox="0 0 340 340"
            className="h-auto w-full"
            animate={{ rotate: [-3, 3] }}
            transition={{ duration: 20, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            style={{ transformOrigin: '170px 170px' }}
          >
            {NUTRIENTS.map((n, i) => {
              const a0 = -90 + i * SLOT + GAP / 2
              const slotLen = SLOT - GAP
              const fillLen = (n.pct / 100) * slotLen
              const mid = a0 + slotLen / 2
              const under = n.pct < 50
              const color = under ? '#D9B26A' : mixHex('#C9D6C0', '#5C7A54', n.pct / 100)
              const hovered = hover === i
              const [lx, ly] = polar(mid, R + 26)
              const anchor = Math.abs(((mid % 360) + 360) % 360 - 180) < 12 ? 'middle' : Math.cos((mid * Math.PI) / 180) > 0 ? 'start' : 'end'
              return (
                <g
                  key={n.name}
                  className="cursor-pointer"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => toast(`Top sources, ${n.name}: ${n.sources}.`, { tone: 'gold' })}
                >
                  {/* slot track */}
                  <path d={arcPath(a0, a0 + slotLen, R)} fill="none" stroke="#F3EBDA" strokeWidth="13" strokeLinecap="round" />
                  {/* coverage segment blooms outward */}
                  <motion.path
                    d={arcPath(a0, a0 + fillLen, R)}
                    fill="none"
                    stroke={color}
                    strokeWidth={hovered ? 17 : 13}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                    transition={{ delay: 0.25 + i * 0.05, duration: 0.7, ease: EASE_GLIDE }}
                    style={{ transition: 'stroke-width 0.2s' }}
                  />
                  {/* connector to center on hover */}
                  {hovered && (
                    <motion.line
                      x1={polar(mid, R - 12)[0]}
                      y1={polar(mid, R - 12)[1]}
                      x2={C}
                      y2={C}
                      stroke="#B08A3E"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  <text
                    x={lx}
                    y={ly}
                    textAnchor={anchor}
                    dominantBaseline="middle"
                    fontSize="9"
                    fontWeight="700"
                    letterSpacing="0.04em"
                    className={hovered ? 'fill-gold-deep' : 'fill-ink-soft'}
                  >
                    {n.name}
                  </text>
                </g>
              )
            })}
          </motion.svg>

          {/* center numeral */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="font-display text-[40px] leading-none text-ink">
              <CountUp value={8.4} decimals={1} active={inView} duration={1.1} />
              <span className="font-display italic text-[20px] text-ink-faint">/10</span>
            </p>
            <p className="t-label mt-1 text-ink-faint">Diversity index</p>
          </div>

          {/* hover tooltip */}
          {hover != null && (
            <div className="glass-strong pointer-events-none absolute left-1/2 top-1 z-10 w-[220px] -translate-x-1/2 rounded-r-md p-3 text-center shadow-e-2">
              <p className="t-ui-sm font-bold text-ink">
                {NUTRIENTS[hover].name} <span className="tnum text-gold-deep">{NUTRIENTS[hover].pct}%</span>
              </p>
              <p className="t-ui-sm mt-0.5 font-medium text-ink-soft">{NUTRIENTS[hover].sources} this week</p>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
