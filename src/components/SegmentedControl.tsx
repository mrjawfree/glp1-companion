interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[]
  selected: T
  onChange: (value: T) => void
}

export default function SegmentedControl<T extends string>({ options, selected, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="flex bg-slate-100 rounded-md p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2.5 rounded-sm text-label text-center transition-all ${
            selected === opt.value
              ? 'bg-white text-slate-900 shadow-elevation-1'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
