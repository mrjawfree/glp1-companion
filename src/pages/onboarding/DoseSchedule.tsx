import { useNavigate } from 'react-router-dom'
import OnboardingShell from '../../components/OnboardingShell'
import { MEDICATION_INFO } from '../../types'
import { useOnboarding } from '../../hooks/useOnboarding'

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function DoseSchedule() {
  const navigate = useNavigate()
  const { data, update } = useOnboarding()
  const cadence = data.medication ? MEDICATION_INFO[data.medication].cadence : 'weekly'

  return (
    <OnboardingShell step={2} totalSteps={5} onBack={() => navigate('/onboarding/drug')}>
      <h1 className="text-display-lg text-slate-900 mb-2">When do you take it?</h1>
      <p className="text-body-lg text-slate-500 mb-6">
        {cadence === 'weekly' ? 'Pick your injection day and preferred time.' : 'Set your daily dose time.'}
      </p>

      {cadence === 'weekly' && (
        <div className="mb-6">
          <label className="text-label text-slate-500 uppercase mb-3 block">Injection day</label>
          <div className="flex gap-2">
            {DAYS.map((day, i) => (
              <button
                key={i}
                onClick={() => update({ doseDay: i })}
                className={`w-11 h-11 rounded-full text-label flex items-center justify-center transition-colors ${
                  data.doseDay === i
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="text-label text-slate-500 uppercase mb-3 block">Time of day</label>
        <input
          type="time"
          value={data.doseTime || '08:00'}
          onChange={(e) => update({ doseTime: e.target.value })}
          className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none transition-colors"
        />
      </div>

      <div className="mb-6">
        <label className="text-label text-slate-500 uppercase mb-3 block">Current dose (mg) — optional</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => update({ currentDoseMg: Math.max(0, (data.currentDoseMg || 0) - 0.25) })}
            className="w-11 h-11 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-title-lg hover:bg-slate-200"
          >
            −
          </button>
          <input
            type="number"
            step="0.25"
            min="0"
            value={data.currentDoseMg ?? ''}
            onChange={(e) => update({ currentDoseMg: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="0.00"
            className="flex-1 border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg text-center bg-white focus:border-slate-700 focus:outline-none"
          />
          <button
            onClick={() => update({ currentDoseMg: (data.currentDoseMg || 0) + 0.25 })}
            className="w-11 h-11 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-title-lg hover:bg-slate-200"
          >
            +
          </button>
        </div>
      </div>

      <div className="mb-6">
        <label className="text-label text-slate-500 uppercase mb-3 block">Date of last dose</label>
        <input
          type="date"
          value={data.lastDoseDate || ''}
          onChange={(e) => update({ lastDoseDate: e.target.value })}
          className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none transition-colors"
        />
      </div>

      <div className="bg-warm-white-2 border border-slate-300 rounded-md p-4 mb-6">
        <p className="text-body-sm text-slate-500">
          We use this to send a gentle reminder and to time your meal suggestions around peak appetite suppression (typically 24–72h post-dose).
        </p>
      </div>

      <div className="mt-auto">
        <button
          onClick={() => navigate('/onboarding/goals')}
          className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider hover:bg-slate-900 transition-colors"
        >
          Continue
        </button>
      </div>
    </OnboardingShell>
  )
}
