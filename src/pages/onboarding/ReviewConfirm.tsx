import { useNavigate } from 'react-router-dom'
import OnboardingShell from '../../components/OnboardingShell'
import { useOnboarding } from '../../hooks/useOnboarding'
import { MEDICATION_INFO } from '../../types'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function SummaryRow({ label, value, onEdit }: { label: string; value: string | null; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
      <div>
        <span className="text-label text-slate-400 uppercase block text-xs">{label}</span>
        <span className="text-body-lg text-slate-900">{value || 'Not set'}</span>
      </div>
      <button onClick={onEdit} className="text-info text-body-sm hover:underline">
        Edit
      </button>
    </div>
  )
}

export default function ReviewConfirm() {
  const navigate = useNavigate()
  const { data } = useOnboarding()

  const medicationDisplay = data.medication
    ? data.medication === 'other'
      ? data.medicationOther || 'Other'
      : MEDICATION_INFO[data.medication].brand
    : null

  const daysDisplay = data.injectionDays.length > 0
    ? data.injectionDays.map((d) => DAY_LABELS[d]).join(', ')
    : null

  const doseDisplay = data.doseAmount !== null
    ? `${data.doseAmount} ${data.doseUnit}`
    : null

  const weightDisplay = data.currentWeight !== null
    ? `${data.currentWeight} ${data.weightUnit}`
    : null

  const goalDisplay = data.goalWeight !== null
    ? `${data.goalWeight} ${data.weightUnit}`
    : null

  return (
    <OnboardingShell
      step={6}
      totalSteps={7}
      onBack={() => navigate('/onboarding/weight-goal')}
    >
      <h1 className="text-display-lg text-slate-900 mb-2">Review your setup</h1>
      <p className="text-body-lg text-slate-500 mb-6">
        Everything look right? You can change any of this in Settings later.
      </p>

      <div className="bg-white rounded-lg border border-slate-200 px-4 mb-8">
        <SummaryRow label="Medication" value={medicationDisplay} onEdit={() => navigate('/onboarding/medication')} />
        <SummaryRow label="Injection days" value={daysDisplay} onEdit={() => navigate('/onboarding/injection-days')} />
        <SummaryRow label="Current dose" value={doseDisplay} onEdit={() => navigate('/onboarding/dose')} />
        <SummaryRow label="Current weight" value={weightDisplay} onEdit={() => navigate('/onboarding/weight-goal')} />
        <SummaryRow label="Goal weight" value={goalDisplay} onEdit={() => navigate('/onboarding/weight-goal')} />
      </div>

      <div className="mt-auto">
        <button
          onClick={() => navigate('/onboarding/profile')}
          className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider hover:bg-slate-900 transition-colors"
        >
          Looks good — continue
        </button>
      </div>
    </OnboardingShell>
  )
}
