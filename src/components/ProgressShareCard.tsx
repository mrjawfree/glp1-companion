import { useRef } from 'react'

interface ProgressShareCardProps {
  startWeight: number | null
  currentWeight: number | null
  unit: 'lbs' | 'kg'
  weeksOnMedication: number
  onShare: (canvas: HTMLCanvasElement) => void
}

export default function ProgressShareCard({ startWeight, currentWeight, unit, weeksOnMedication, onShare }: ProgressShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const lostWeight = startWeight && currentWeight ? Math.max(0, startWeight - currentWeight) : 0

  function renderAndShare() {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 2
    const W = 390
    const H = 520
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    ctx.fillStyle = '#FBF8F3'
    ctx.beginPath()
    roundRect(ctx, 0, 0, W, H, 20)
    ctx.fill()

    ctx.fillStyle = '#4A7C5C'
    ctx.beginPath()
    roundRect(ctx, 0, 0, W, 180, 20)
    ctx.fill()
    ctx.fillRect(0, 160, W, 20)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = '600 18px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('My GLP-1 Progress', W / 2, 50)

    ctx.font = '400 14px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText(`${weeksOnMedication} week${weeksOnMedication !== 1 ? 's' : ''} on medication`, W / 2, 78)

    if (lostWeight > 0) {
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '600 56px system-ui, -apple-system, sans-serif'
      ctx.fillText(`${lostWeight.toFixed(1)}`, W / 2, 145)
      ctx.font = '500 16px system-ui, -apple-system, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fillText(`${unit} lost`, W / 2, 170)
    }

    const stats = [
      { label: 'Start', value: startWeight ? `${startWeight.toFixed(1)} ${unit}` : '—' },
      { label: 'Current', value: currentWeight ? `${currentWeight.toFixed(1)} ${unit}` : '—' },
      { label: 'Lost', value: lostWeight > 0 ? `${lostWeight.toFixed(1)} ${unit}` : '—' },
    ]

    const cardY = 210
    const cardW = W - 48
    const cardH = 90
    stats.forEach((stat, i) => {
      const y = cardY + i * (cardH + 12)
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      roundRect(ctx, 24, y, cardW, cardH, 12)
      ctx.fill()
      ctx.shadowColor = 'rgba(15,26,43,0.06)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetY = 1
      ctx.fill()
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      ctx.fillStyle = '#8995A8'
      ctx.font = '500 13px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(stat.label.toUpperCase(), 44, y + 35)

      ctx.fillStyle = '#0F1A2B'
      ctx.font = '600 28px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(stat.value, W - 44, y + 62)
    })

    ctx.fillStyle = '#C2CCD9'
    ctx.font = '400 12px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Tracked with GLP-1 Companion', W / 2, H - 20)

    onShare(canvas)
  }

  return (
    <div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="bg-white rounded-md shadow-elevation-2 overflow-hidden">
        <div className="bg-green-600 text-white p-5 text-center">
          <p className="text-label uppercase tracking-wider mb-1">My GLP-1 Progress</p>
          <p className="text-body-sm opacity-85">{weeksOnMedication} week{weeksOnMedication !== 1 ? 's' : ''} on medication</p>
          {lostWeight > 0 && (
            <p className="text-display-xl mt-3">{lostWeight.toFixed(1)} <span className="text-title-md opacity-90">{unit} lost</span></p>
          )}
        </div>
        <div className="p-5 space-y-3">
          {[
            { label: 'Start weight', value: startWeight ? `${startWeight.toFixed(1)} ${unit}` : '—' },
            { label: 'Current weight', value: currentWeight ? `${currentWeight.toFixed(1)} ${unit}` : '—' },
            { label: 'Total lost', value: lostWeight > 0 ? `${lostWeight.toFixed(1)} ${unit}` : '—' },
          ].map(stat => (
            <div key={stat.label} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
              <span className="text-label text-slate-400 uppercase">{stat.label}</span>
              <span className="text-title-md text-slate-900">{stat.value}</span>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5">
          <button
            onClick={renderAndShare}
            className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Share my progress
          </button>
        </div>
      </div>
    </div>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
