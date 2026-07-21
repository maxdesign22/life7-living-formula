import { cn } from '@/lib/utils'
import MagneticButton from './MagneticButton'

export interface EmptyStateProps {
  /** Fraunces italic line */
  line: string
  actionLabel?: string
  onAction?: () => void
  /** watermark image; defaults to the botanical sprig */
  image?: string
  className?: string
}

/** Empty state (design.md §9): botanical watermark + italic line + one ghost action. Never a blank box. */
export default function EmptyState({ line, actionLabel, onAction, image = '/botanical-sprig-1.svg', className }: EmptyStateProps) {
  return (
    <div className={cn('relative flex flex-col items-center justify-center overflow-hidden px-8 py-16 text-center', className)}>
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-8 left-1/2 h-[75%] -translate-x-1/2 opacity-[0.10]"
      />
      <p className="t-serif-quote relative max-w-[38ch] text-ink-soft">{line}</p>
      {actionLabel && onAction && (
        <MagneticButton variant="ghost" size="md" onClick={onAction} className="relative mt-6">
          {actionLabel}
        </MagneticButton>
      )}
    </div>
  )
}
