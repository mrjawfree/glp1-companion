import { useEffect, useState } from 'react'

interface MilestoneCelebrationProps {
  milestone: number
  unit: 'lbs' | 'kg'
  onDismiss: () => void
  onShare: () => void
}

const MESSAGES: Record<number, string> = {
  5: "You're off to a great start!",
  10: "Double digits — keep it going!",
  20: "Incredible dedication!",
  30: "What a transformation!",
  50: "Absolutely amazing progress!",
}

export default function MilestoneCelebration({ milestone, unit, onDismiss, onShare }: MilestoneCelebrationProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  function handleDismiss() {
    setVisible(false)
    setTimeout(onDismiss, 200)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Milestone celebration: ${milestone} ${unit} lost`}
    >
      <div className="absolute inset-0 bg-slate-900/50" onClick={handleDismiss} />
      <div className={`relative bg-warm-white rounded-lg shadow-elevation-3 mx-6 max-w-sm w-full p-8 text-center transition-transform duration-200 ${visible ? 'scale-100' : 'scale-95'}`}>
        <div className="text-[56px] mb-4" aria-hidden="true">🎉</div>
        <h2 className="text-display-lg text-slate-900 mb-2">
          {milestone} {unit} lost!
        </h2>
        <p className="text-body-lg text-slate-500 mb-6">
          {MESSAGES[milestone] || 'What an achievement!'}
        </p>
        <div className="space-y-3">
          <button
            onClick={() => { onShare(); handleDismiss() }}
            className="w-full bg-green-600 text-white py-4 rounded-md text-label uppercase tracking-wider hover:bg-green-600/90 transition-colors flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Share this milestone
          </button>
          <button
            onClick={handleDismiss}
            className="w-full py-3 text-label text-slate-400 hover:text-slate-700 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

const MILESTONES = [5, 10, 20, 30, 50]

export function checkMilestone(startWeight: number, previousWeight: number, newWeight: number): number | null {
  const previousLoss = startWeight - previousWeight
  const currentLoss = startWeight - newWeight
  if (currentLoss <= 0) return null

  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    const m = MILESTONES[i]
    if (currentLoss >= m && previousLoss < m) return m
  }
  return null
}
