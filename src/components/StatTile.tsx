import { forwardRef } from 'react'

type TileVariant = 'sage' | 'success' | 'coral'

interface StatTileProps {
  label: string
  value: string
  variant?: TileVariant
  className?: string
}

const bgMap: Record<TileVariant, string> = {
  sage: 'var(--sage-soft)',
  success: 'var(--success-soft)',
  coral: 'var(--coral-10)',
}

const StatTile = forwardRef<HTMLDivElement, StatTileProps>(
  ({ label, value, variant = 'sage', className = '' }, ref) => {
    const tileId = `tile-${label.replace(/\s+/g, '-').toLowerCase()}`
    return (
      <div
        ref={ref}
        role="group"
        aria-labelledby={tileId}
        style={{ background: bgMap[variant], borderRadius: 'var(--radius-md)', padding: 12 }}
        className={className}
      >
        <p
          id={tileId}
          style={{ fontSize: 14, lineHeight: '18px', fontWeight: 500, color: 'var(--ink-soft)' }}
        >
          {label}
        </p>
        <p
          style={{ fontSize: 24, lineHeight: '28px', fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}
          aria-label={value === '—' ? 'not enough data yet' : undefined}
        >
          {value}
        </p>
      </div>
    )
  }
)

StatTile.displayName = 'StatTile'
export default StatTile
