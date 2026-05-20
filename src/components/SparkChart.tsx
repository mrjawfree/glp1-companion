import { forwardRef, useRef, useEffect, useState } from 'react'

interface DataPoint {
  date: string
  value: number
}

interface SparkChartProps {
  data: DataPoint[]
  width?: number
  height?: number
  className?: string
  ariaLabel?: string
}

const SparkChart = forwardRef<SVGSVGElement, SparkChartProps>(
  ({ data, width = 200, height = 64, className, ariaLabel }, ref) => {
    const pathRef = useRef<SVGPathElement>(null)
    const [pathLength, setPathLength] = useState(0)

    useEffect(() => {
      if (pathRef.current) {
        setPathLength(pathRef.current.getTotalLength())
      }
    }, [data])

    if (data.length < 2) return null

    const pad = { top: 6, bottom: 6, left: 4, right: 4 }
    const chartW = width - pad.left - pad.right
    const chartH = height - pad.top - pad.bottom

    const values = data.map(d => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    const points = data.map((d, i) => ({
      x: pad.left + (i / (data.length - 1)) * chartW,
      y: pad.top + chartH - ((d.value - min) / range) * chartH,
    }))

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
    const fillPath = `${linePath} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`

    const weeklyDots = data.length > 7
      ? [
          points[0],
          points[Math.floor(data.length * 0.33)],
          points[Math.floor(data.length * 0.66)],
          points[data.length - 1],
        ]
      : points.filter((_, i) => i === 0 || i === data.length - 1)

    const first = data[0].value
    const last = data[data.length - 1].value
    const diff = last - first
    const direction = Math.abs(diff) < 0.5 ? 'steady' : diff < 0 ? 'down' : 'up'

    const defaultLabel = `Weight trend, last ${data.length} days. Started at ${first}, ended at ${last}. Trending ${direction}.`

    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={ariaLabel || defaultLabel}
        className={className}
        style={{ width: '100%', maxWidth: width }}
      >
        <title>{`${data.length}-day weight trend`}</title>
        <desc>{`Weight ${direction === 'down' ? 'decreased' : direction === 'up' ? 'increased' : 'stayed steady'} by ${Math.abs(diff).toFixed(1)} over ${data.length} days.`}</desc>

        <path
          d={fillPath}
          fill="var(--sage-soft)"
          opacity={1}
          style={{ animation: 'spark-fill-in 400ms var(--ease-out) 200ms both' }}
        />

        <path
          ref={pathRef}
          d={linePath}
          fill="none"
          stroke="var(--teal-primary)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={pathLength > 0 ? {
            strokeDasharray: pathLength,
            strokeDashoffset: pathLength,
            animation: `spark-draw 600ms var(--ease-out) forwards`,
            ['--path-length' as string]: pathLength,
          } : undefined}
        />

        {weeklyDots.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="var(--teal-primary)"
            stroke="var(--cream)"
            strokeWidth={1}
            style={{
              transformOrigin: `${p.x}px ${p.y}px`,
              animation: `spark-dot 200ms var(--ease-out) ${600 + i * 80}ms both`,
            }}
          />
        ))}
      </svg>
    )
  }
)

SparkChart.displayName = 'SparkChart'
export default SparkChart
