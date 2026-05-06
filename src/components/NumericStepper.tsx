interface NumericStepperProps {
  value: number | null
  onChange: (value: number | null) => void
  step?: number
  min?: number
  max?: number
  placeholder?: string
  suffix?: string
}

export default function NumericStepper({
  value,
  onChange,
  step = 0.25,
  min = 0.25,
  max = 20,
  placeholder = '0.00',
  suffix,
}: NumericStepperProps) {
  const decrement = () => {
    const current = value ?? min
    const next = current - step
    onChange(next >= min ? parseFloat(next.toFixed(2)) : min)
  }

  const increment = () => {
    const current = value ?? 0
    const next = current + step
    onChange(next <= max ? parseFloat(next.toFixed(2)) : max)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={decrement}
        disabled={value !== null && value <= min}
        className="w-11 h-11 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-title-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        −
      </button>
      <div className="flex-1 relative">
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={value ?? ''}
          onChange={(e) => {
            const v = e.target.value
            onChange(v ? parseFloat(v) : null)
          }}
          placeholder={placeholder}
          className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg text-center bg-white focus:border-slate-700 focus:outline-none transition-colors"
        />
        {suffix && value !== null && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-body-md text-slate-400 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      <button
        onClick={increment}
        disabled={value !== null && value >= max}
        className="w-11 h-11 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-title-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        +
      </button>
    </div>
  )
}
