import { forwardRef } from 'react'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  className?: string
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, max = 100, label = 'Progress toward goal', className = '' }, ref) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100))

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={className}
        style={{
          width: '100%',
          height: 8,
          borderRadius: 'var(--radius-sm)',
          background: 'var(--border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--teal-primary)',
            ['--fill-width' as string]: `${pct}%`,
            animation: 'progress-fill 800ms var(--ease-out) 200ms both',
          }}
        />
      </div>
    )
  }
)

ProgressBar.displayName = 'ProgressBar'
export default ProgressBar
