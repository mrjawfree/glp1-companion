import { type InjectionSiteZone, INJECTION_SITE_ZONES } from '../types'

interface InjectionSitePickerProps {
  selected: InjectionSiteZone | null
  suggested: InjectionSiteZone | null
  lastUsedDaysAgo: Record<InjectionSiteZone, number | null>
  onChange: (zone: InjectionSiteZone) => void
  onWhySuggested?: () => void
}

const ZONE_POSITIONS: Record<InjectionSiteZone, { cx: number; cy: number; rx: number; ry: number }> = {
  left_upper_arm:  { cx: 52,  cy: 105, rx: 12, ry: 16 },
  right_upper_arm: { cx: 148, cy: 105, rx: 12, ry: 16 },
  left_abdomen:    { cx: 80,  cy: 155, rx: 16, ry: 14 },
  right_abdomen:   { cx: 120, cy: 155, rx: 16, ry: 14 },
  left_thigh:      { cx: 82,  cy: 230, rx: 13, ry: 18 },
  right_thigh:     { cx: 118, cy: 230, rx: 13, ry: 18 },
}

function getZoneStyle(
  zone: InjectionSiteZone,
  selected: InjectionSiteZone | null,
  suggested: InjectionSiteZone | null,
  lastUsedDaysAgo: Record<InjectionSiteZone, number | null>,
) {
  if (zone === selected) return { fill: '#4A7C5C', stroke: '#2D5A3C', strokeWidth: 2, strokeDasharray: undefined }
  const daysAgo = lastUsedDaysAgo[zone]
  if (daysAgo !== null && daysAgo < 7) return { fill: '#F5F7FA', stroke: '#8995A8', strokeWidth: 1.5, strokeDasharray: '4 3' }
  if (zone === suggested) return { fill: '#E8F0E8', stroke: '#4A7C5C', strokeWidth: 2, strokeDasharray: undefined }
  return { fill: '#F9FAFB', stroke: '#C2CCD9', strokeWidth: 1.5, strokeDasharray: undefined }
}

function getCaptionText(
  selected: InjectionSiteZone | null,
  suggested: InjectionSiteZone | null,
  lastUsedDaysAgo: Record<InjectionSiteZone, number | null>,
) {
  if (!selected && suggested) {
    const label = INJECTION_SITE_ZONES.find(z => z.value === suggested)?.label ?? suggested
    const days = lastUsedDaysAgo[suggested]
    return `Suggested: ${label}${days !== null ? ` — last used ${days} days ago` : ''}`
  }
  if (!selected) return 'Tap a zone to select injection site'
  const label = INJECTION_SITE_ZONES.find(z => z.value === selected)?.label ?? selected
  if (selected === suggested) return `${label} ✓`
  const days = lastUsedDaysAgo[selected]
  if (days !== null && days < 7) return `Selected: ${label} — used ${days} days ago. Consider rotating to reduce irritation.`
  return `Selected: ${label} — different from suggestion`
}

export default function InjectionSitePicker({
  selected,
  suggested,
  lastUsedDaysAgo,
  onChange,
  onWhySuggested,
}: InjectionSitePickerProps) {
  const captionText = getCaptionText(selected, suggested, lastUsedDaysAgo)
  const showRecentWarning = selected && lastUsedDaysAgo[selected] !== null && lastUsedDaysAgo[selected]! < 7
  const showWhyLink = selected && selected !== suggested && onWhySuggested

  const handleKeyDown = (e: React.KeyboardEvent, zones: InjectionSiteZone[], currentIdx: number) => {
    let nextIdx = currentIdx
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      nextIdx = (currentIdx + 1) % zones.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      nextIdx = (currentIdx - 1 + zones.length) % zones.length
    }
    if (nextIdx !== currentIdx) onChange(zones[nextIdx])
  }

  const zoneOrder: InjectionSiteZone[] = ['left_upper_arm', 'right_upper_arm', 'left_abdomen', 'right_abdomen', 'left_thigh', 'right_thigh']

  return (
    <div>
      <svg
        viewBox="0 0 200 300"
        className="w-full max-w-[280px] mx-auto"
        role="radiogroup"
        aria-label="Injection site"
      >
        {/* Body outline */}
        <ellipse cx="100" cy="40" rx="18" ry="22" fill="none" stroke="#C2CCD9" strokeWidth="1.5" />
        <path d="M100 62 L100 180" stroke="#C2CCD9" strokeWidth="1.5" />
        <path d="M100 80 Q85 85 55 130" stroke="#C2CCD9" strokeWidth="1.5" fill="none" />
        <path d="M100 80 Q115 85 145 130" stroke="#C2CCD9" strokeWidth="1.5" fill="none" />
        <path d="M100 180 Q90 200 78 270" stroke="#C2CCD9" strokeWidth="1.5" fill="none" />
        <path d="M100 180 Q110 200 122 270" stroke="#C2CCD9" strokeWidth="1.5" fill="none" />

        {/* Injection zones */}
        {zoneOrder.map((zone, idx) => {
          const pos = ZONE_POSITIONS[zone]
          const style = getZoneStyle(zone, selected, suggested, lastUsedDaysAgo)
          const zoneLabel = INJECTION_SITE_ZONES.find(z => z.value === zone)?.label ?? zone
          const days = lastUsedDaysAgo[zone]
          const ariaLabel = `${zoneLabel}${zone === suggested ? ', suggested' : ''}${days !== null ? `, last used ${days} days ago` : ''}`

          return (
            <g key={zone}>
              {zone === suggested && zone !== selected && (
                <ellipse
                  cx={pos.cx} cy={pos.cy} rx={pos.rx + 2} ry={pos.ry + 2}
                  fill={style.fill} stroke="none"
                  className="animate-pulse motion-reduce:animate-none"
                  opacity="0.5"
                />
              )}
              <ellipse
                cx={pos.cx} cy={pos.cy} rx={pos.rx} ry={pos.ry}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={style.strokeWidth}
                strokeDasharray={style.strokeDasharray}
                className="cursor-pointer transition-all duration-[180ms] ease-out motion-reduce:transition-none"
                role="radio"
                aria-checked={selected === zone}
                aria-label={ariaLabel}
                tabIndex={selected === zone || (!selected && idx === 0) ? 0 : -1}
                onClick={() => onChange(zone)}
                onKeyDown={(e) => handleKeyDown(e, zoneOrder, idx)}
              />
              {zone === selected && (
                <ellipse
                  cx={pos.cx} cy={pos.cy} rx={pos.rx} ry={pos.ry}
                  fill="none" stroke="#4A7C5C" strokeWidth="3"
                  className="pointer-events-none"
                  opacity="0.3"
                />
              )}
            </g>
          )
        })}

        {/* Suggested badge */}
        {suggested && suggested !== selected && (() => {
          const pos = ZONE_POSITIONS[suggested]
          return (
            <g className="pointer-events-none">
              <rect x={pos.cx - 28} y={pos.cy - pos.ry - 18} width="56" height="16" rx="8" fill="#4A7C5C" />
              <text x={pos.cx} y={pos.cy - pos.ry - 7} textAnchor="middle" fill="white" fontSize="9" fontWeight="600">
                Suggested
              </text>
            </g>
          )
        })()}
      </svg>

      <p className={`text-body-sm mt-3 text-center ${showRecentWarning ? 'text-amber-600' : 'text-slate-500'}`}>
        {captionText}
      </p>

      {showWhyLink && (
        <button
          type="button"
          onClick={onWhySuggested}
          className="block mx-auto mt-1 text-body-sm text-green-600 underline"
        >
          Why suggest {INJECTION_SITE_ZONES.find(z => z.value === suggested)?.label}?
        </button>
      )}

      {/* Fallback grid for screen readers / reduced motion */}
      <div className="sr-only">
        <div role="radiogroup" aria-label="Injection site (list fallback)">
          {INJECTION_SITE_ZONES.map((zone) => (
            <label key={zone.value}>
              <input
                type="radio"
                name="injection-site-fallback"
                checked={selected === zone.value}
                onChange={() => onChange(zone.value)}
              />
              {zone.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
