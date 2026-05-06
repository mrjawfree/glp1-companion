import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingShell from '../../components/OnboardingShell'
import SegmentedControl from '../../components/SegmentedControl'
import { WeightUnit, TrackingPreference, TRACKING_OPTIONS } from '../../types'
import { useOnboarding } from '../../hooks/useOnboarding'

const WEIGHT_UNITS: { value: WeightUnit; label: string }[] = [
  { value: 'lb', label: 'lb' },
  { value: 'kg', label: 'kg' },
]

export default function GoalSetting() {
  const navigate = useNavigate()
  const { data, update } = useOnboarding()
  const [warning, setWarning] = useState('')

  const togglePreference = (pref: TrackingPreference) => {
    const current = data.trackingPreferences
    if (current.includes(pref)) {
      update({ trackingPreferences: current.filter((p) => p !== pref) })
    } else {
      update({ trackingPreferences: [...current, pref] })
    }
  }

  const handleContinue = () => {
    if (data.goalWeight !== null && data.currentWeight !== null && data.goalWeight >= data.currentWeight && !warning) {
      setWarning("Your goal is higher than your current weight — is that right?")
      return
    }
    navigate('/onboarding/notifications')
  }

  return (
    <OnboardingShell
      step={2}
      totalSteps={4}
      onBack={() => navigate('/onboarding/profile-setup')}
      onSkip={() => {
        update({ currentWeight: null, goalWeight: null, trackingPreferences: [] })
        navigate('/onboarding/notifications')
      }}
    >
      <h1 className="text-display-lg text-slate-900 mb-2">Set your goals</h1>
      <p className="text-body-lg text-slate-500 mb-6">Optional — you can always change these later.</p>

      <div className="mb-5">
        <label className="text-label text-slate-500 uppercase mb-2 block">Weight goal</label>
        <div className="mb-3">
          <SegmentedControl
            options={WEIGHT_UNITS}
            selected={data.weightUnit}
            onChange={(unit) => update({ weightUnit: unit })}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="current-weight" className="text-body-sm text-slate-400 mb-1 block">Current</label>
            <input
              id="current-weight"
              type="number"
              inputMode="decimal"
              value={data.currentWeight ?? ''}
              onChange={(e) => {
                setWarning('')
                update({ currentWeight: e.target.value ? parseFloat(e.target.value) : null })
              }}
              placeholder={data.weightUnit === 'lb' ? '180' : '82'}
              className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none transition-colors"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="goal-weight" className="text-body-sm text-slate-400 mb-1 block">Goal</label>
            <input
              id="goal-weight"
              type="number"
              inputMode="decimal"
              value={data.goalWeight ?? ''}
              onChange={(e) => {
                setWarning('')
                update({ goalWeight: e.target.value ? parseFloat(e.target.value) : null })
              }}
              placeholder={data.weightUnit === 'lb' ? '160' : '72'}
              className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none transition-colors"
            />
          </div>
        </div>
        {warning && (
          <div className="bg-amber-100 border border-amber-500 rounded-md p-3 mt-2">
            <p className="text-body-sm text-amber-500">{warning}</p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <label className="text-label text-slate-500 uppercase mb-2 block">What do you want to track?</label>
        <div className="flex flex-col gap-2">
          {TRACKING_OPTIONS.map((opt) => {
            const selected = data.trackingPreferences.includes(opt.value)
            return (
              <button
                key={opt.value}
                onClick={() => togglePreference(opt.value)}
                aria-pressed={selected}
                className={`p-3 rounded-md text-left transition-all ${
                  selected
                    ? 'border-2 border-slate-700 bg-white shadow-elevation-1'
                    : 'border-2 border-slate-200 bg-white'
                }`}
              >
                <span className="block text-body-md font-semibold text-slate-900">{opt.label}</span>
                <span className="block text-body-sm text-slate-400">{opt.description}</span>
              </button>
            )
          })}
        </div>
      </div>

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
