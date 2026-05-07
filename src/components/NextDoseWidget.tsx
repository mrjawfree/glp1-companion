import { useNavigate } from 'react-router-dom'
import type { DaysDeltaState } from '../types'

interface NextDoseWidgetProps {
  state: DaysDeltaState
  nextDoseDate: string | null
  daysSinceLastDose: number | null
  onLogDose: () => void
}

const STATE_CONFIG: Record<DaysDeltaState, {
  bg: string
  border: string
  titleColor: string
  label: (props: NextDoseWidgetProps) => string
  cta: string
  ctaStyle: string
  showPulse: boolean
}> = {
  upcoming: {
    bg: 'bg-white',
    border: 'border-slate-200',
    titleColor: 'text-slate-900',
    label: (p) => `Next dose: ${p.nextDoseDate ? new Date(p.nextDoseDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}`,
    cta: 'Log Early',
    ctaStyle: 'bg-white border border-slate-300 text-slate-700',
    showPulse: false,
  },
  tomorrow: {
    bg: 'bg-white',
    border: 'border-slate-200',
    titleColor: 'text-slate-900',
    label: () => 'Next dose tomorrow',
    cta: 'Log Now',
    ctaStyle: 'bg-white border border-slate-300 text-slate-700',
    showPulse: false,
  },
  today: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    titleColor: 'text-slate-900',
    label: () => "Today's dose ready",
    cta: 'Log Dose',
    ctaStyle: 'bg-green-600 text-white',
    showPulse: false,
  },
  overdue: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    titleColor: 'text-amber-700',
    label: (p) => `${p.daysSinceLastDose ?? 1} day${(p.daysSinceLastDose ?? 1) > 1 ? 's' : ''} overdue`,
    cta: 'Log Dose',
    ctaStyle: 'bg-amber-500 text-white',
    showPulse: false,
  },
  'severe-overdue': {
    bg: 'bg-red-50',
    border: 'border-red-300',
    titleColor: 'text-red-700',
    label: (p) => `${p.daysSinceLastDose ?? 5} days overdue`,
    cta: 'Log or Skip',
    ctaStyle: 'bg-red-500 text-white',
    showPulse: true,
  },
  empty: {
    bg: 'bg-white',
    border: 'border-dashed border-slate-300',
    titleColor: 'text-slate-900',
    label: () => 'Start tracking',
    cta: 'Log First Dose',
    ctaStyle: 'bg-green-600 text-white',
    showPulse: false,
  },
}

export default function NextDoseWidget(props: NextDoseWidgetProps) {
  const config = STATE_CONFIG[props.state]
  const navigate = useNavigate()

  return (
    <button
      onClick={() => {
        props.onLogDose()
        navigate('/doses?log=true')
      }}
      className={`w-full rounded-md p-5 mb-5 text-left transition-colors ${config.bg} border ${config.border} relative`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {config.showPulse && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
          )}
          <div>
            <p className={`text-body-lg font-semibold ${config.titleColor}`}>
              {props.state === 'empty' ? 'Add your medication' : 'Dose status'}
            </p>
            <p className="text-body-sm text-slate-500">{config.label(props)}</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-md text-label text-sm font-medium ${config.ctaStyle}`}>
          {config.cta}
        </span>
      </div>
    </button>
  )
}
