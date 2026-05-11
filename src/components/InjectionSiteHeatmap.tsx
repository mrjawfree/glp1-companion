import { useMemo } from 'react'

type InjectionSite = 'left_abdomen' | 'right_abdomen' | 'left_thigh' | 'right_thigh'

interface InjectionSiteHeatmapProps {
  doses: { injection_site: string | null; logged_at: string }[]
}

const SITE_LABELS: Record<InjectionSite, string> = {
  left_abdomen: 'L. Abdomen',
  right_abdomen: 'R. Abdomen',
  left_thigh: 'L. Thigh',
  right_thigh: 'R. Thigh',
}

const SITE_POSITIONS: Record<InjectionSite, { cx: number; cy: number; r: number }> = {
  left_abdomen: { cx: 80, cy: 140, r: 18 },
  right_abdomen: { cx: 120, cy: 140, r: 18 },
  left_thigh: { cx: 80, cy: 225, r: 16 },
  right_thigh: { cx: 120, cy: 225, r: 16 },
}

function heatColor(ratio: number): string {
  if (ratio === 0) return '#EDF1F6'
  if (ratio <= 0.25) return '#D1FAE5'
  if (ratio <= 0.5) return '#6EE7B7'
  if (ratio <= 0.75) return '#34D399'
  return '#059669'
}

function daysSinceLabel(lastUsed: Date | null): string {
  if (!lastUsed) return 'Never used'
  const days = Math.floor((Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

export default function InjectionSiteHeatmap({ doses }: InjectionSiteHeatmapProps) {
  const siteStats = useMemo(() => {
    const counts: Record<InjectionSite, number> = {
      left_abdomen: 0,
      right_abdomen: 0,
      left_thigh: 0,
      right_thigh: 0,
    }
    const lastUsed: Record<InjectionSite, Date | null> = {
      left_abdomen: null,
      right_abdomen: null,
      left_thigh: null,
      right_thigh: null,
    }

    for (const dose of doses) {
      const site = dose.injection_site as InjectionSite | null
      if (site && site in counts) {
        counts[site]++
        const dt = new Date(dose.logged_at)
        if (!lastUsed[site] || dt > lastUsed[site]!) {
          lastUsed[site] = dt
        }
      }
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    const max = Math.max(...Object.values(counts), 1)

    return (Object.keys(counts) as InjectionSite[]).map(site => ({
      site,
      count: counts[site],
      ratio: counts[site] / max,
      pct: total > 0 ? Math.round((counts[site] / total) * 100) : 0,
      lastUsed: lastUsed[site],
    }))
  }, [doses])

  const hasData = siteStats.some(s => s.count > 0)

  return (
    <div className="bg-white rounded-lg shadow-elevation-1 p-4">
      <p className="text-body-md font-semibold text-slate-900 mb-1">Injection site rotation</p>
      <p className="text-body-sm text-slate-400 mb-3">
        {hasData ? 'Balanced rotation reduces tissue buildup' : 'Start logging doses to track rotation'}
      </p>

      <div className="flex gap-4 items-start">
        <svg viewBox="0 0 200 300" className="w-36 flex-shrink-0" fill="none">
          <ellipse cx="100" cy="40" rx="20" ry="25" stroke="#C2CCD9" strokeWidth="1.5" />
          <line x1="100" y1="65" x2="100" y2="170" stroke="#C2CCD9" strokeWidth="1.5" />
          <line x1="100" y1="90" x2="60" y2="140" stroke="#C2CCD9" strokeWidth="1.5" />
          <line x1="100" y1="90" x2="140" y2="140" stroke="#C2CCD9" strokeWidth="1.5" />
          <line x1="100" y1="170" x2="75" y2="270" stroke="#C2CCD9" strokeWidth="1.5" />
          <line x1="100" y1="170" x2="125" y2="270" stroke="#C2CCD9" strokeWidth="1.5" />
          {siteStats.map(s => {
            const pos = SITE_POSITIONS[s.site]
            return (
              <g key={s.site}>
                <circle
                  cx={pos.cx}
                  cy={pos.cy}
                  r={pos.r}
                  fill={heatColor(s.ratio)}
                  stroke={s.ratio > 0 ? '#059669' : '#C2CCD9'}
                  strokeWidth="1.5"
                  opacity={0.9}
                />
                {s.count > 0 && (
                  <text
                    x={pos.cx}
                    y={pos.cy + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={600}
                    fill="#064E3B"
                  >
                    {s.count}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        <div className="flex-1 space-y-2 pt-1">
          {siteStats.map(s => (
            <div key={s.site} className="flex items-center justify-between">
              <div>
                <p className="text-body-sm font-medium text-slate-700">{SITE_LABELS[s.site]}</p>
                <p className="text-body-sm text-slate-400">{daysSinceLabel(s.lastUsed)}</p>
              </div>
              <div className="text-right">
                <p className="text-body-sm font-semibold text-slate-900">{s.count}</p>
                <p className="text-body-sm text-slate-400">{s.pct}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {hasData && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1 text-body-sm text-slate-400">
            <span>Less</span>
            {[0, 0.25, 0.5, 0.75, 1].map(r => (
              <span
                key={r}
                className="w-4 h-4 rounded-sm inline-block"
                style={{ backgroundColor: heatColor(r) }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      )}
    </div>
  )
}
