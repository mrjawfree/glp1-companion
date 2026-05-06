import { useNavigate } from 'react-router-dom'
import OnboardingShell from '../../components/OnboardingShell'
import DayPicker from '../../components/DayPicker'
import { useOnboarding } from '../../hooks/useOnboarding'

export default function InjectionDays() {
  const navigate = useNavigate()
  const { data, update } = useOnboarding()

  return (
    <OnboardingShell
      step={2}
      totalSteps={4}
      onBack={() => navigate('/onboarding/medication')}
      onSkip={() => {
        update({ injectionDays: [] })
        navigate('/onboarding/dose')
      }}
    >
      <h1 className="text-display-lg text-slate-900 mb-2">When do you inject?</h1>
      <p className="text-body-lg text-slate-500 mb-6">
        Pick the day(s) of the week. You'll get reminders on these days.
      </p>

      <div className="mb-4">
        <DayPicker
          selected={data.injectionDays}
          onChange={(days) => update({ injectionDays: days })}
        />
      </div>

      <p className="text-body-sm text-slate-400 mb-6">Most people inject once a week.</p>

      {data.injectionDays.length > 2 && (
        <div className="bg-amber-100 border border-amber-500 rounded-md p-3 mb-6">
          <p className="text-body-sm text-amber-500">
            That's a lot — double-check with your provider.
          </p>
        </div>
      )}

      <div className="mt-auto">
        <button
          onClick={() => navigate('/onboarding/dose')}
          disabled={data.injectionDays.length === 0}
          className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-900 transition-colors"
        >
          Continue
        </button>
      </div>
    </OnboardingShell>
  )
}
