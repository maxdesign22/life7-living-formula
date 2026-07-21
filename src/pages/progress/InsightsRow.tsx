/**
 * Zone G — Insights row (progress.md): 3 AI cards with a gold spine, exact
 * editorial copies, actions that route or confirm via toast. The insight
 * footer line follows verbatim: "Less thinking. Better living."
 */
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { GlassCard, useToast } from '@/components/life7'
import { EASE_GLIDE } from '@/pages/planner/ui'

interface Insight {
  copy: string
  action: string
  run: 'habit' | 'planner' | 'sources'
}

const INSIGHTS: readonly Insight[] = [
  {
    copy: 'Your protein is most fragile on social Wednesdays. One boiled egg at breakfast fixes the curve.',
    action: 'Apply habit',
    run: 'habit',
  },
  {
    copy: 'Cooking time fell 4 minutes since you started Sunday prep. Keep the ritual.',
    action: 'View prep plan',
    run: 'planner',
  },
  {
    copy: 'Fibre is your fastest-improving dimension — +9% per week. Broccoli deserves the credit.',
    action: 'See sources',
    run: 'sources',
  },
]

export default function InsightsRow() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const navigate = useNavigate()
  const { toast } = useToast()

  const run = (kind: Insight['run']) => {
    if (kind === 'habit') toast('Habit applied — Wednesday breakfast now starts with a boiled egg.', { tone: 'sage' })
    else if (kind === 'planner') navigate('/planner')
    else toast('Top fibre sources this week: broccoli ×4, oats ×4, spinach ×3.', { tone: 'gold' })
  }

  return (
    <div ref={ref}>
      <div className="grid grid-cols-1 gap-4 min-[1024px]:grid-cols-3">
        {INSIGHTS.map((insight, i) => (
          <motion.div
            key={insight.action}
            initial={{ opacity: 0, y: 22 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.5, ease: EASE_GLIDE }}
          >
            <GlassCard flat className="relative h-full overflow-hidden p-5 pl-6">
              <span className="absolute inset-y-0 left-0 w-[3px] bg-champagne" aria-hidden="true" />
              <p className="t-serif-quote text-[17px] leading-relaxed text-ink">{insight.copy}</p>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => run(insight.run)}
                  className="t-ui-sm font-semibold text-forest underline-offset-4 decoration-champagne decoration-[1.5px] transition-colors hover:text-gold-deep hover:underline"
                >
                  {insight.action}
                </button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* insight footer — verbatim */}
      <motion.p
        className="t-serif-quote mt-10 flex items-center justify-center gap-3 text-center text-ink-soft"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <span className="inline-block h-1.5 w-1.5 rotate-45 bg-champagne" aria-hidden="true" />
        Less thinking. Better living.
      </motion.p>
    </div>
  )
}
