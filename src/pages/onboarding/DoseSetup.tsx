import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingShell from '../../components/OnboardingShell'
import NumericStepper from '../../components/NumericStepper'
import SegmentedControl from '../../components/SegmentedControl'
import { DoseUnit } from '../../types'
import { useOnboarding } from '../../hooks/useOnboarding'

const DOSE_UNITS: { value: DoseUnit; label: string }[] = [
  { value: 'mg', label: 'mg' },
  { value: 'mL', label: 'mL' },
  { value: 'units', label: 'units' },
]

export default function DoseSetup() {
  const navigate = useNavigate()
  const { data, update } = useOnboarding()
  const [error, setError] = useState('')

  const handleContinue = () => {
    if (data.doseAmount !== null && (data.doseAmount < 0.25 || data.doseAmount > 20)) {
      setError('Enter a dose between 0.25 and 20')
      return
    }
    navigate('/onboarding/weight-goal')
  }

  return (
    <OnboardingShell
      step={3}
      totalSteps={4}
      onBack={() => navigate('/onboarding/injection-days')}
      onSkip={() => {
        update({ doseAmount: null, doseUnit: 'mg' })
        navigate('/onboarding/weight-goal')
      }}
    >
      <h1 className="text-display-lg text-slate-900 mb-2">What's your current dose?</h1>
      <p className="text-body-lg text-slate-500 mb-6">
        We'll track this over time as your dose changes.
      </p>

      <div className="mb-4">
        <label className="text-label text-slate-500 uppercase mb-3 block">Dose</label>
        <NumericStepper
          value={data.doseAmount}
          onChange={(v) => {
            setError('')
            update({ doseAmount: v })
          }}
          step={0.25}
          min={0.25}
          max={20}
          suffix={data.doseUnit}
        />
        {error && (
          <p className="text-body-sm text-rose-500 mt-1.5">{error}</p>
        )}
      </div>

      <div className="mb-6">
        <label className="text-label text-slate-500 uppercase mb-3 block">Unit</label>
        <SegmentedControl
          options={DOSE_UNITS}
          selected={data.doseUnit}
          onChange={(unit) => update({ doseUnit: unit })}
        />
      </div>

      <p className="text-body-sm text-slate-400 mb-6">
        Check the label on your pen if you're unsure.
      </p>

      <div className="mt-auto">
        <button
          onClick={handleContinue}
          className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider hover:bg-slate-900 transition-colors"
        >
          Continue
        </button>
      </div>
    </OnboardingShell>
  )
}
