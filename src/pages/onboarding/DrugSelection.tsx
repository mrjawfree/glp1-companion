import { useNavigate } from 'react-router-dom'
import OnboardingShell from '../../components/OnboardingShell'
import { Medication, MEDICATION_INFO } from '../../types'
import { useOnboarding } from '../../hooks/useOnboarding'

const medications: Medication[] = ['ozempic', 'wegovy', 'mounjaro', 'zepbound', 'saxenda', 'other']

export default function DrugSelection() {
  const navigate = useNavigate()
  const { data, update } = useOnboarding()
  const totalSteps = data.medication === 'other' ? 4 : 5

  return (
    <OnboardingShell step={1} totalSteps={totalSteps} onBack={() => navigate('/onboarding')}>
      <h1 className="text-display-lg text-slate-900 mb-2">Which medication are you on?</h1>
      <p className="text-body-lg text-slate-500 mb-6">
        We'll tailor reminders and meal suggestions to your dosing schedule.
      </p>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {medications.map((med) => {
          const info = MEDICATION_INFO[med]
          const selected = data.medication === med
          return (
            <button
              key={med}
              onClick={() => update({ medication: med })}
              className={`p-4 rounded-md text-left transition-all min-h-[56px] ${
                med === 'other'
                  ? selected
                    ? 'border-2 border-slate-700 bg-white shadow-elevation-1'
                    : 'border-2 border-dashed border-slate-300 bg-white'
                  : selected
                    ? 'border-2 border-slate-700 bg-white shadow-elevation-1'
                    : 'border-2 border-slate-200 bg-white'
              }`}
            >
              <span className="block text-body-lg font-semibold text-slate-900">{info.brand}</span>
              {info.generic && (
                <span className="block text-body-sm text-slate-400 italic">{info.generic}</span>
              )}
            </button>
          )
        })}
      </div>
      <div className="mt-auto">
        <button
          onClick={() => {
            if (data.medication === 'other') {
              navigate('/onboarding/goals')
            } else {
              navigate('/onboarding/schedule')
            }
          }}
          disabled={!data.medication}
          className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-900 transition-colors"
        >
          Continue
        </button>
      </div>
    </OnboardingShell>
  )
}
