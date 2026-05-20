import { forwardRef } from 'react'

type DayState = 'taken' | 'missed' | 'today-taken' | 'today-missed'

interface DayCircleProps {
  date: Date
  state: DayState
  dayLabel?: string
  className?: string
}

const DayCircle = forwardRef<HTMLDivElement, DayCircleProps>(
  ({ date, state, dayLabel, className = '' }, ref) => {
    const isTaken = state === 'taken' || state === 'today-taken'
    const isToday = state === 'today-taken' || state === 'today-missed'

    const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    const stateStr = isTaken ? 'dose taken' : 'missed'
    const label = `${dateStr}${isToday ? ', today' : ''}, ${stateStr}`

    return (
      <div
        ref={ref}
        role="img"
        aria-label={label}
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          flex: '0 0 auto',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: isTaken ? 'var(--teal-primary)' : 'var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isToday ? '0 0 0 2px var(--ink)' : undefined,
          }}
        >
          {isTaken && (
            <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        {dayLabel && (
          <span style={{ fontSize: 12, lineHeight: '16px', color: 'var(--ink-soft)' }}>
            {dayLabel}
          </span>
        )}
      </div>
    )
  }
)

DayCircle.displayName = 'DayCircle'
export default DayCircle
