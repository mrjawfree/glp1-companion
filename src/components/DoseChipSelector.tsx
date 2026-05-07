import { useRef, useEffect } from 'react'

interface DoseChipSelectorProps {
  amounts: string[]
  selected: string
  onChange: (amount: string) => void
  unit?: string
}

export default function DoseChipSelector({ amounts, selected, onChange, unit = 'mg' }: DoseChipSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [selected])

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide"
      role="radiogroup"
      aria-label="Dose amount"
    >
      {amounts.map((amount) => {
        const isSelected = amount === selected
        return (
          <button
            key={amount}
            ref={isSelected ? selectedRef : undefined}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(amount)}
            className={`
              flex-shrink-0 h-14 px-5 rounded-full text-body-md font-medium snap-center
              transition-all duration-[180ms] ease-out
              ${isSelected
                ? 'bg-green-600 text-white scale-100'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }
              active:scale-[0.96]
              motion-reduce:transition-none
            `}
          >
            {amount} {unit}
          </button>
        )
      })}
    </div>
  )
}
