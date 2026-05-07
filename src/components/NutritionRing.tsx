const SIZES = { sm: 80, md: 120, lg: 160 } as const
const STROKES = { sm: 7, md: 10, lg: 12 } as const

type RingSize = keyof typeof SIZES

function getStrokeColor(value: number, goal: number): string {
  if (value === 0) return '#EDF1F6'
  const ratio = value / goal
  if (ratio > 1.1) return '#6B7280'
  if (ratio >= 0.9) return '#3DB87A'
  return '#F5A623'
}

function getStatusLabel(value: number, goal: number): string {
  if (value === 0) return ''
  const ratio = value / goal
  if (ratio > 1.1) return 'Over goal'
  if (ratio >= 0.9) return 'On track'
  return 'Under goal'
}

interface NutritionRingProps {
  label: string
  value: number
  goal: number
  unit: string
  size?: RingSize
  onPress?: () => void
}

export default function NutritionRing({
  label,
  value,
  goal,
  unit,
  size = 'md',
  onPress,
}: NutritionRingProps) {
  const diameter = SIZES[size]
  const strokeWidth = STROKES[size]
  const radius = (diameter - strokeWidth) / 2
  const cx = diameter / 2
  const cy = diameter / 2
  const circumference = 2 * Math.PI * radius
  const fraction = goal > 0 ? Math.min(value / goal, 1) : 0
  const offset = circumference * (1 - fraction)
  const strokeColor = getStrokeColor(value, goal)
  const overPercent = goal > 0 && value / goal > 1.1
    ? `+${Math.round((value / goal - 1) * 100)}%`
    : null
  const pct = goal > 0 ? Math.round((value / goal) * 100) : 0

  const Wrapper = onPress ? 'button' : 'div'
  const wrapperProps = onPress ? { onClick: onPress, type: 'button' as const } : {}

  return (
    <Wrapper
      {...wrapperProps}
      className="flex flex-col items-center"
      style={{ minWidth: diameter }}
    >
      <svg
        width={diameter}
        height={diameter}
        viewBox={`0 0 ${diameter} ${diameter}`}
        role="progressbar"
        aria-label={`${label}: ${value} of ${goal} ${unit}`}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={goal}
      >
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none" stroke="#EDF1F6" strokeWidth={strokeWidth}
        />
        {fraction > 0 && (
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none" stroke={strokeColor} strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            className="transition-all duration-400 ease-out"
          />
        )}
        {overPercent && (
          <text
            x={cx} y={cy - (size === 'sm' ? 20 : size === 'md' ? 28 : 36)}
            textAnchor="middle"
            className="fill-slate-500"
            fontSize={size === 'sm' ? 9 : 11}
          >
            {overPercent}
          </text>
        )}
        <text
          x={cx} y={cy - (size === 'sm' ? 2 : 4)}
          textAnchor="middle"
          className="fill-slate-900 font-semibold"
          fontSize={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
        >
          {value.toLocaleString()}
        </text>
        <text
          x={cx} y={cy + (size === 'sm' ? 12 : 14)}
          textAnchor="middle"
          className="fill-slate-500"
          fontSize={size === 'sm' ? 10 : 12}
        >
          {unit}
        </text>
      </svg>
      <p className="text-body-md font-semibold text-slate-900 mt-1">{label}</p>
      <p className="text-body-sm text-slate-400">
        {value.toLocaleString()} / {goal.toLocaleString()} {unit}
      </p>
      {size !== 'sm' && (
        <p className="text-body-sm text-slate-400">{pct}%</p>
      )}
      {size !== 'sm' && getStatusLabel(value, goal) && (
        <p className={`text-body-sm ${
          value / goal >= 0.9 && value / goal <= 1.1 ? 'text-green-600' :
          value / goal > 1.1 ? 'text-slate-500' : 'text-amber-500'
        }`}>
          {getStatusLabel(value, goal)}
        </p>
      )}
    </Wrapper>
  )
}
