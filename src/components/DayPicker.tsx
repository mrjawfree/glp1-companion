const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_FULL_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface DayPickerProps {
  selected: number[]
  onChange: (days: number[]) => void
}

export default function DayPicker({ selected, onChange }: DayPickerProps) {
  const toggle = (day: number) => {
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day))
    } else {
      onChange([...selected, day])
    }
  }

  return (
    <div className="flex gap-2" role="group" aria-label="Days of the week">
      {DAY_LABELS.map((label, i) => (
        <button
          key={i}
          onClick={() => toggle(i)}
          aria-label={DAY_FULL_NAMES[i]}
          aria-pressed={selected.includes(i)}
          className={`w-11 h-11 rounded-full text-label flex items-center justify-center transition-colors ${
            selected.includes(i)
              ? 'bg-slate-700 text-white'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
