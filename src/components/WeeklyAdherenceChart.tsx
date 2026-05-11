import { useMemo } from 'react'

interface WeeklyAdherenceChartProps {
  doses: { logged_at: string }[]
  scheduledDays: number[]
  weeks?: number
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function WeeklyAdherenceChart({
  doses,
  scheduledDays,
  weeks = 8,
}: WeeklyAdherenceChartProps) {
  const weeklyData = useMemo(() => {
    const now = new Date()
    const result: { weekStart: string; taken: number; scheduled: number }[] = []

    for (let w = weeks - 1; w >= 0; w--) {
      const start = new Date(now)
      start.setDate(start.getDate() - start.getDay() - w * 7)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 7)

      const weekStart = start.toISOString().split('T')[0]

      const daysInWeek = scheduledDays.filter(day => {
        const d = new Date(start)
        d.setDate(d.getDate() + day)
        return d <= now
      })
      const scheduled = daysInWeek.length || (scheduledDays.length === 0 ? 1 : 0)

      const taken = doses.filter(dose => {
        const dt = new Date(dose.logged_at)
        return dt >= start && dt < end
      }).length

      result.push({ weekStart, taken, scheduled })
    }

    return result
  }, [doses, scheduledDays, weeks])

  const maxVal = Math.max(...weeklyData.map(w => Math.max(w.taken, w.scheduled)), 1)

  const chartW = 320
  const chartH = 180
  const padL = 12
  const padR = 12
  const padT = 12
  const padB = 36
  const plotW = chartW - padL - padR
  const plotH = chartH - padT - padB
  const barGroupW = plotW / weeklyData.length
  const barW = barGroupW * 0.3

  const hasData = doses.length > 0

  return (
    <div className="bg-white rounded-lg shadow-elevation-1 p-4">
      <p className="text-body-md font-semibold text-slate-900 mb-1">Weekly adherence</p>
      <p className="text-body-sm text-slate-400 mb-3">Doses taken vs. scheduled</p>

      {!hasData ? (
        <div className="flex flex-col items-center py-8">
          <div className="flex gap-1 mb-3">
            {Array.from({ length: weeks }).map((_, i) => (
              <div key={i} className="w-8 h-16 bg-slate-100 rounded-sm" />
            ))}
          </div>
          <p className="text-body-sm text-slate-400">Log doses to see your adherence trend</p>
        </div>
      ) : (
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ maxHeight: 240 }}>
          {weeklyData.map((w, i) => {
            const cx = padL + barGroupW * i + barGroupW / 2
            const schedH = (w.scheduled / maxVal) * plotH
            const takenH = (w.taken / maxVal) * plotH
            const pct = w.scheduled > 0 ? Math.round((w.taken / w.scheduled) * 100) : 0
            const color = pct >= 100 ? '#3DB87A' : pct >= 50 ? '#F5A623' : '#EF4444'

            return (
              <g key={w.weekStart}>
                <rect
                  x={cx - barW - 1}
                  y={padT + plotH - schedH}
                  width={barW}
                  height={schedH}
                  rx={2}
                  fill="#E2E8F0"
                />
                <rect
                  x={cx + 1}
                  y={padT + plotH - takenH}
                  width={barW}
                  height={takenH}
                  rx={2}
                  fill={color}
                />
                <text
                  x={cx}
                  y={chartH - 18}
                  textAnchor="middle"
                  fontSize="9"
                  className="fill-slate-400"
                >
                  {formatWeekLabel(w.weekStart)}
                </text>
                <text
                  x={cx}
                  y={chartH - 6}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight={600}
                  fill={color}
                >
                  {pct}%
                </text>
              </g>
            )
          })}
        </svg>
      )}

      <div className="flex gap-4 mt-2 text-body-sm text-slate-400 justify-center">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-slate-300" />Scheduled
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-600" />Taken
        </span>
      </div>
    </div>
  )
}
