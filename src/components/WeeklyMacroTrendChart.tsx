interface DayData {
  date: string
  calories: number
  protein: number
}

interface WeeklyMacroTrendChartProps {
  days: DayData[]
  calorieGoal: number
  proteinGoal: number
  onDayPress?: (date: string) => void
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function WeeklyMacroTrendChart({
  days,
  calorieGoal,
  proteinGoal,
  onDayPress,
}: WeeklyMacroTrendChartProps) {
  const today = new Date().toISOString().split('T')[0]
  const hasData = days.some(d => d.calories > 0 || d.protein > 0)
  const maxCal = Math.max(calorieGoal, ...days.map(d => d.calories)) * 1.1
  const maxPro = Math.max(proteinGoal, ...days.map(d => d.protein)) * 1.1

  const chartW = 320
  const chartH = 160
  const padL = 8
  const padR = 8
  const padT = 16
  const padB = 28
  const plotW = chartW - padL - padR
  const plotH = chartH - padT - padB
  const barW = plotW / days.length
  const innerBarW = barW * 0.5

  const calGoalY = padT + plotH * (1 - calorieGoal / maxCal)

  const proteinPoints = days
    .map((d, i) => {
      if (d.protein === 0) return null
      const x = padL + barW * i + barW / 2
      const y = padT + plotH * (1 - d.protein / maxPro)
      return { x, y }
    })

  const proteinGoalY = padT + plotH * (1 - proteinGoal / maxPro)

  return (
    <div className="bg-white rounded-lg shadow-elevation-1 p-4">
      <p className="text-body-md font-semibold text-slate-900 mb-3">Weekly trend</p>

      {!hasData ? (
        <div className="flex flex-col items-center py-8">
          <div className="flex gap-1 mb-3">
            {days.map((_, i) => (
              <div key={i} className="w-8 h-16 bg-slate-100 rounded-sm" />
            ))}
          </div>
          <p className="text-body-sm text-slate-400">Log meals to see your weekly trend</p>
        </div>
      ) : (
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ maxHeight: 220 }}>
          <line
            x1={padL} x2={chartW - padR}
            y1={calGoalY} y2={calGoalY}
            stroke="#6B7280" strokeWidth="1" strokeDasharray="4 3" opacity={0.4}
          />
          <line
            x1={padL} x2={chartW - padR}
            y1={proteinGoalY} y2={proteinGoalY}
            stroke="#F5A623" strokeWidth="1" strokeDasharray="4 3" opacity={0.4}
          />

          {days.map((d, i) => {
            const x = padL + barW * i + (barW - innerBarW) / 2
            const barH = d.calories > 0 ? (d.calories / maxCal) * plotH : 0
            const y = padT + plotH - barH
            return (
              <g key={d.date} onClick={() => onDayPress?.(d.date)} className="cursor-pointer">
                <rect
                  x={x} y={y}
                  width={innerBarW} height={barH}
                  rx={3}
                  fill="#3DB87A" opacity={0.6}
                />
                <text
                  x={padL + barW * i + barW / 2}
                  y={chartH - 6}
                  textAnchor="middle"
                  className={d.date === today ? 'fill-slate-900' : 'fill-slate-400'}
                  fontSize="11"
                  fontWeight={d.date === today ? 600 : 400}
                >
                  {DAY_LABELS[new Date(d.date + 'T00:00:00').getDay()]}
                </text>
                {d.calories === 0 && (
                  <text
                    x={padL + barW * i + barW / 2}
                    y={padT + plotH - 4}
                    textAnchor="middle"
                    className="fill-slate-300"
                    fontSize="10"
                  >
                    —
                  </text>
                )}
              </g>
            )
          })}

          {proteinPoints.filter(Boolean).length > 1 && (
            <polyline
              points={proteinPoints
                .filter((p): p is { x: number; y: number } => p !== null)
                .map(p => `${p.x},${p.y}`)
                .join(' ')}
              fill="none"
              stroke="#F5A623"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {proteinPoints.map((p, i) =>
            p ? (
              <circle
                key={i}
                cx={p.x} cy={p.y} r={3}
                fill="#F5A623"
              />
            ) : null
          )}
        </svg>
      )}

      <div className="flex gap-4 mt-2 text-body-sm text-slate-400 justify-center">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-600 opacity-60" />Calories
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />Protein
        </span>
      </div>
    </div>
  )
}
