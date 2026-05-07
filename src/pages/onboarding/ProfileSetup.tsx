import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingShell from '../../components/OnboardingShell'
import DayPicker from '../../components/DayPicker'
import NumericStepper from '../../components/NumericStepper'
import SegmentedControl from '../../components/SegmentedControl'
import { Medication, MEDICATION_INFO, WeightUnit, DoseUnit } from '../../types'
import { useOnboarding } from '../../hooks/useOnboarding'

const MEDICATIONS: Medication[] = ['ozempic', 'wegovy', 'mounjaro', 'zepbound', 'saxenda', 'other']

const WEIGHT_UNITS: { value: WeightUnit; label: string }[] = [
  { value: 'lb', label: 'lb' },
  { value: 'kg', label: 'kg' },
]

const DOSE_UNITS: { value: DoseUnit; label: string }[] = [
  { value: 'mg', label: 'mg' },
  { value: 'mL', label: 'mL' },
  { value: 'units', label: 'units' },
]

function getDefaultDose(med: Medication | null): number {
  if (med === 'mounjaro' || med === 'zepbound') return 2.5
  return 0.25
}

export default function ProfileSetup() {
  const navigate = useNavigate()
  const { data, update } = useOnboarding()
  const [otherError, setOtherError] = useState('')
  const [nameError, setNameError] = useState('')
  const [weightWarning, setWeightWarning] = useState('')
  const otherInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (data.medication === 'other') {
      otherInputRef.current?.focus()
    }
  }, [data.medication])

  const handleSelect = (med: Medication) => {
    setOtherError('')
    if (med === 'other') {
      update({ medication: 'other' })
    } else {
      update({
        medication: med,
        medicationOther: null,
        doseAmount: data.doseAmount ?? getDefaultDose(med),
      })
    }
  }

  const handleContinue = () => {
    const trimmedName = data.displayName.trim()
    if (trimmedName.length < 1) {
      setNameError('Please enter your name')
      return
    }

    if (data.medication === 'other') {
      const trimmed = (data.medicationOther || '').trim()
      if (trimmed.length < 2 || trimmed.length > 60) {
        setOtherError('Please enter a medication name')
        return
      }
      update({ medicationOther: trimmed })
    }

    if (data.goalWeight !== null && data.currentWeight !== null && data.goalWeight >= data.currentWeight && !weightWarning) {
      setWeightWarning("Your goal is higher than your current weight — is that right?")
      return
    }

    update({ displayName: trimmedName })
    navigate('/onboarding/notifications')
  }

  const canContinue = data.displayName.trim().length > 0 &&
    data.medication !== null &&
    (data.medication !== 'other' || (data.medicationOther || '').trim().length >= 2) &&
    data.injectionDays.length > 0

  return (
    <OnboardingShell
      step={1}
      totalSteps={4}
      onBack={() => navigate('/onboarding')}
      onSkip={() => {
        update({ medication: null, medicationOther: null, injectionDays: [], currentWeight: null, goalWeight: null })
        navigate('/onboarding/notifications')
      }}
    >
      <h1 className="text-display-lg text-slate-900 mb-2">Tell us about yourself</h1>
      <p className="text-body-lg text-slate-500 mb-6">We'll personalize your experience.</p>

      <div className="mb-5">
        <label htmlFor="display-name" className="text-label text-slate-500 uppercase mb-2 block">Your name</label>
        <input
          id="display-name"
          type="text"
          value={data.displayName}
          onChange={(e) => {
            setNameError('')
            update({ displayName: e.target.value })
          }}
          placeholder="First name or nickname"
          maxLength={40}
          className={`w-full border-2 rounded-md px-4 py-3 text-body-lg bg-white focus:outline-none transition-colors ${
            nameError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-slate-700'
          }`}
        />
        {nameError && (
          <p className="text-body-sm text-rose-500 mt-1.5" role="alert" aria-live="polite">{nameError}</p>
        )}
      </div>

      <div className="mb-5">
        <label className="text-label text-slate-500 uppercase mb-2 block">Medication</label>
        <div className="flex flex-col gap-2">
          {MEDICATIONS.map((med) => {
            const info = MEDICATION_INFO[med]
            const selected = data.medication === med
            return (
              <button
                key={med}
                onClick={() => handleSelect(med)}
                className={`p-3 rounded-md text-left transition-all ${
                  selected
                    ? 'border-2 border-slate-700 bg-white shadow-elevation-1'
                    : med === 'other'
                      ? 'border-2 border-dashed border-slate-300 bg-white'
                      : 'border-2 border-slate-200 bg-white'
                }`}
              >
                <span className="block text-body-md font-semibold text-slate-900">{info.brand}</span>
                {info.generic && (
                  <span className="block text-body-sm text-slate-400 italic">{info.generic}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {data.medication === 'other' && (
        <div className="mb-5 transition-all duration-220">
          <input
            ref={otherInputRef}
            type="text"
            value={data.medicationOther || ''}
            onChange={(e) => {
              setOtherError('')
              update({ medicationOther: e.target.value })
            }}
            placeholder="Enter medication name"
            maxLength={60}
            className={`w-full border-2 rounded-md px-4 py-3 text-body-lg bg-white focus:outline-none transition-colors ${
              otherError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-slate-700'
            }`}
          />
          {otherError && (
            <p className="text-body-sm text-rose-500 mt-1.5" role="alert" aria-live="polite">{otherError}</p>
          )}
        </div>
      )}

      <div className="mb-5">
        <label className="text-label text-slate-500 uppercase mb-2 block">Dose</label>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <NumericStepper
              value={data.doseAmount ?? getDefaultDose(data.medication)}
              onChange={(val) => update({ doseAmount: val })}
              min={0.25}
              max={20}
              step={0.25}
            />
          </div>
          <div className="flex-1">
            <SegmentedControl
              options={DOSE_UNITS}
              selected={data.doseUnit}
              onChange={(unit) => update({ doseUnit: unit })}
            />
          </div>
        </div>
      </div>

      <div className="mb-5">
        <label className="text-label text-slate-500 uppercase mb-2 block">Injection day(s)</label>
        <DayPicker
          selected={data.injectionDays}
          onChange={(days) => update({ injectionDays: days })}
        />
        <p className="text-body-sm text-slate-400 mt-2">Most people inject once a week.</p>
        {data.injectionDays.length > 2 && (
          <div className="bg-amber-100 border border-amber-500 rounded-md p-3 mt-2">
            <p className="text-body-sm text-amber-500">
              That's a lot — double-check with your provider.
            </p>
          </div>
        )}
      </div>

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
                setWeightWarning('')
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
                setWeightWarning('')
                update({ goalWeight: e.target.value ? parseFloat(e.target.value) : null })
              }}
              placeholder={data.weightUnit === 'lb' ? '160' : '72'}
              className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none transition-colors"
            />
          </div>
        </div>
        {weightWarning && (
          <div className="bg-amber-100 border border-amber-500 rounded-md p-3 mt-2">
            <p className="text-body-sm text-amber-500">{weightWarning}</p>
          </div>
        )}
      </div>

      <div className="mt-auto">
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-900 transition-colors"
        >
          Continue
        </button>
      </div>
    </OnboardingShell>
  )
}
