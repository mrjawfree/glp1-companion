import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingShell from '../../components/OnboardingShell'
import { Medication, MEDICATION_INFO } from '../../types'
import { useOnboarding } from '../../hooks/useOnboarding'

const MEDICATIONS: Medication[] = ['ozempic', 'wegovy', 'mounjaro', 'zepbound', 'saxenda', 'other']

export default function MedicationSelect() {
  const navigate = useNavigate()
  const { data, update } = useOnboarding()
  const [otherError, setOtherError] = useState('')
  const otherInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (data.medication === 'other') {
      otherInputRef.current?.focus()
    }
  }, [data.medication])

  const handleContinue = () => {
    if (data.medication === 'other') {
      const trimmed = (data.medicationOther || '').trim()
      if (trimmed.length < 2 || trimmed.length > 60) {
        setOtherError('Please enter a medication name')
        return
      }
      update({ medicationOther: trimmed })
    }
    navigate('/onboarding/injection-days')
  }

  const handleSelect = (med: Medication) => {
    setOtherError('')
    if (med === 'other') {
      update({ medication: 'other' })
    } else {
      update({ medication: med, medicationOther: null })
    }
  }

  const canContinue = data.medication !== null && (data.medication !== 'other' || (data.medicationOther || '').trim().length >= 2)

  return (
    <OnboardingShell
      step={1}
      totalSteps={7}
      onBack={() => navigate('/onboarding')}
      onSkip={() => {
        update({ medication: null, medicationOther: null })
        navigate('/onboarding/injection-days')
      }}
    >
      <h1 className="text-display-lg text-slate-900 mb-2">What medication are you taking?</h1>
      <p className="text-body-lg text-slate-500 mb-6">You can change this anytime in Settings.</p>

      <div className="flex flex-col gap-3 mb-6">
        {MEDICATIONS.map((med) => {
          const info = MEDICATION_INFO[med]
          const selected = data.medication === med
          return (
            <button
              key={med}
              onClick={() => handleSelect(med)}
              className={`p-4 rounded-md text-left transition-all ${
                selected
                  ? 'border-2 border-slate-700 bg-white shadow-elevation-1'
                  : med === 'other'
                    ? 'border-2 border-dashed border-slate-300 bg-white'
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

      {data.medication === 'other' && (
        <div className="mb-6 transition-all duration-220">
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
            <p className="text-body-sm text-rose-500 mt-1.5 transition-opacity duration-150">{otherError}</p>
          )}
        </div>
      )}

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
