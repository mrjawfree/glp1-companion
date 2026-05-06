import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingShell from '../../components/OnboardingShell'
import SegmentedControl from '../../components/SegmentedControl'
import { WeightUnit } from '../../types'
import { useOnboarding } from '../../hooks/useOnboarding'

const WEIGHT_UNITS: { value: WeightUnit; label: string }[] = [
  { value: 'lb', label: 'lb' },
  { value: 'kg', label: 'kg' },
]

function weightRange(unit: WeightUnit) {
  return unit === 'lb' ? { min: 50, max: 700 } : { min: 22, max: 320 }
}

export default function WeightGoal() {
  const navigate = useNavigate()
  const { data, update } = useOnboarding()
  const [warning, setWarning] = useState('')
  const range = weightRange(data.weightUnit)

  const validate = () => {
    if (data.currentWeight !== null && (data.currentWeight < range.min || data.currentWeight > range.max)) return false
    if (data.goalWeight !== null && (data.goalWeight < range.min || data.goalWeight > range.max)) return false
    return true
  }

  const handleContinue = () => {
    if (!validate()) return
    if (data.goalWeight !== null && data.currentWeight !== null && data.goalWeight >= data.currentWeight && !warning) {
      setWarning("Your goal is higher than your current weight — is that right?")
      return
    }
    navigate('/onboarding/review')
  }

  return (
    <OnboardingShell
      step={5}
      totalSteps={7}
      onBack={() => navigate('/onboarding/dose')}
      onSkip={() => {
        update({ currentWeight: null, goalWeight: null })
        navigate('/onboarding/review')
      }}
    >
      <h1 className="text-display-lg text-slate-900 mb-2">Set a weight goal</h1>
      <p className="text-body-lg text-slate-500 mb-6">Optional — you can add this later.</p>

      <div className="mb-6">
        <SegmentedControl
          options={WEIGHT_UNITS}
          selected={data.weightUnit}
          onChange={(unit) => update({ weightUnit: unit })}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="current-weight" className="text-label text-slate-500 uppercase mb-2 block">Current weight</label>
        <input
          id="current-weight"
          type="number"
          inputMode="decimal"
          value={data.currentWeight ?? ''}
          onChange={(e) => {
            setWarning('')
            update({ currentWeight: e.target.value ? parseFloat(e.target.value) : null })
          }}
          placeholder={data.weightUnit === 'lb' ? 'e.g. 180' : 'e.g. 82'}
          className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none transition-colors"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="goal-weight" className="text-label text-slate-500 uppercase mb-2 block">Goal weight</label>
        <input
          id="goal-weight"
          type="number"
          inputMode="decimal"
          value={data.goalWeight ?? ''}
          onChange={(e) => {
            setWarning('')
            update({ goalWeight: e.target.value ? parseFloat(e.target.value) : null })
          }}
          placeholder={data.weightUnit === 'lb' ? 'e.g. 160' : 'e.g. 72'}
          className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none transition-colors"
        />
      </div>

      {warning && (
        <div className="bg-amber-100 border border-amber-500 rounded-md p-3 mb-4">
          <p className="text-body-sm text-amber-500">{warning}</p>
        </div>
      )}

      <p className="text-body-sm text-slate-400 mb-6">
        We'll show progress toward your goal on the dashboard.
      </p>

      <div className="mt-auto flex flex-col gap-3">
        <button
          onClick={handleContinue}
          className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider hover:bg-slate-900 transition-colors"
        >
          Continue
        </button>
        <button
          onClick={() => {
            update({ currentWeight: null, goalWeight: null })
            navigate('/onboarding/review')
          }}
          className="w-full text-slate-400 py-2 text-body-md hover:text-slate-600 transition-colors"
        >
          Skip this step
        </button>
      </div>
    </OnboardingShell>
  )
}
