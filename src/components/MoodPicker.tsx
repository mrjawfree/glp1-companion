import { forwardRef, useRef } from 'react'

const moods = [
  { emoji: '😔', label: 'Low' },
  { emoji: '😐', label: 'Flat' },
  { emoji: '🙂', label: 'Okay' },
  { emoji: '😊', label: 'Good' },
  { emoji: '😁', label: 'Great' },
] as const

interface MoodPickerProps {
  value: number | null
  onChange: (index: number) => void
  className?: string
}

const MoodPicker = forwardRef<HTMLDivElement, MoodPickerProps>(
  ({ value, onChange, className = '' }, ref) => {
    const buttonsRef = useRef<(HTMLButtonElement | null)[]>([])

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
      let next = index
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        next = (index + 1) % moods.length
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        next = (index - 1 + moods.length) % moods.length
      } else if (e.key === 'Home') {
        e.preventDefault()
        next = 0
      } else if (e.key === 'End') {
        e.preventDefault()
        next = moods.length - 1
      } else if (e.key === ' ') {
        e.preventDefault()
        onChange(index)
        return
      } else {
        return
      }
      onChange(next)
      buttonsRef.current[next]?.focus()
    }

    return (
      <div className={className}>
        <p
          id="mood-label"
          style={{ fontSize: 12, lineHeight: '16px', color: 'var(--ink-soft)' }}
        >
          How you felt this week
        </p>
        <div
          ref={ref}
          role="radiogroup"
          aria-labelledby="mood-label"
          style={{
            display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 8,
          }}
        >
          {moods.map((mood, i) => {
            const selected = value === i
            return (
              <button
                key={i}
                ref={el => { buttonsRef.current[i] = el }}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={mood.label}
                tabIndex={selected || (value === null && i === 0) ? 0 : -1}
                onClick={() => onChange(i)}
                onKeyDown={e => handleKeyDown(e, i)}
                style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'var(--cream)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, cursor: 'pointer',
                  transform: selected ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: selected ? '0 0 0 2px var(--teal-primary)' : 'none',
                  transition: 'transform 180ms var(--ease-out), box-shadow 180ms var(--ease-out)',
                  transformOrigin: 'center',
                }}
              >
                {mood.emoji}
              </button>
            )
          })}
        </div>
        {value === null && (
          <p style={{ fontSize: 12, lineHeight: '16px', color: 'var(--ink-soft)', marginTop: 8 }}>
            Tap to log how this week felt.
          </p>
        )}
      </div>
    )
  }
)

MoodPicker.displayName = 'MoodPicker'
export default MoodPicker
