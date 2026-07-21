import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GlassCard, EmptyState } from '@/components/life7'

/**
 * Shared placeholder for screens owned by page agents. Keeps the shell,
 * typography and motion language consistent until the real screen lands.
 */
export default function PageStub({ eyebrow, title, caption }: { eyebrow: string; title: string; caption: string }) {
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-[1280px]">
      <header className="mb-8">
        <motion.span
          className="t-label block text-gold-deep"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {eyebrow}
        </motion.span>
        <h1 className="t-display-lg mt-2 text-ink">{title}</h1>
        <motion.p
          className="t-serif-quote mt-2 max-w-[62ch] text-ink-soft"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          {caption}
        </motion.p>
      </header>
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.56, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <GlassCard size="xl" className="min-h-[320px]">
          <EmptyState
            line="This screen is being assembled — the living system takes shape here."
            actionLabel="Back to Today"
            onAction={() => navigate('/today')}
          />
        </GlassCard>
      </motion.div>
    </div>
  )
}
