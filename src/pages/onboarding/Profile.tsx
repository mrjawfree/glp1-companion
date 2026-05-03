import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingShell from '../../components/OnboardingShell'
import { useOnboarding } from '../../hooks/useOnboarding'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export default function Profile() {
  const navigate = useNavigate()
  const { data, update } = useOnboarding()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleComplete = async () => {
    if (!user) return
    setSaving(true)
    setError('')

    try {
      const { error: upsertError } = await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
        display_name: data.displayName || user.email?.split('@')[0],
        medication: data.medication,
        current_dose: data.currentDoseMg,
        start_date: data.lastDoseDate,
      })
      if (upsertError) throw upsertError
      navigate('/')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <OnboardingShell step={4} totalSteps={5} onBack={() => navigate('/onboarding/goals')}>
      <h1 className="text-display-lg text-slate-900 mb-2">Almost there</h1>
      <p className="text-body-lg text-slate-500 mb-6">
        A few basics so we can personalize your experience.
      </p>

      <div className="space-y-5 mb-8">
        <div>
          <label className="text-label text-slate-500 uppercase mb-2 block">Display name</label>
          <input
            type="text"
            value={data.displayName}
            onChange={(e) => update({ displayName: e.target.value })}
            placeholder="Sam"
            className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-label text-slate-500 uppercase mb-2 block">
            Sex assigned at birth
            <span className="normal-case text-body-sm text-slate-400 ml-2">for nutrition calculations only</span>
          </label>
          <div className="flex gap-3">
            {(['male', 'female', 'other'] as const).map((s) => (
              <button
                key={s}
                onClick={() => update({ sex: s })}
                className={`flex-1 py-3 rounded-md text-body-md capitalize transition-colors ${
                  data.sex === s
                    ? 'bg-slate-700 text-white'
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-label text-slate-500 uppercase mb-2 block">Height (cm)</label>
            <input
              type="number"
              value={data.heightCm ?? ''}
              onChange={(e) => update({ heightCm: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="170"
              className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-label text-slate-500 uppercase mb-2 block">Birth year</label>
            <input
              type="number"
              value={data.birthYear ?? ''}
              onChange={(e) => update({ birthYear: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="1988"
              className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-label text-slate-500 uppercase">Weight (kg)</label>
            <label className="flex items-center gap-2 text-body-sm text-slate-400 cursor-pointer">
              <span>Prefer not to say</span>
              <input
                type="checkbox"
                checked={data.weightDeclined}
                onChange={(e) => update({ weightDeclined: e.target.checked, weightKg: e.target.checked ? null : data.weightKg })}
                className="w-5 h-5 rounded accent-slate-700"
              />
            </label>
          </div>
          {!data.weightDeclined && (
            <input
              type="number"
              value={data.weightKg ?? ''}
              onChange={(e) => update({ weightKg: e.target.value ? parseFloat(e.target.value) : null })}
              placeholder="75"
              className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none"
            />
          )}
        </div>
      </div>

      {error && (
        <p className="text-rose-500 text-body-sm mb-4">{error}</p>
      )}

      <div className="mt-auto">
        <button
          onClick={handleComplete}
          disabled={saving}
          className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider disabled:opacity-40 hover:bg-slate-900 transition-colors"
        >
          {saving ? 'Setting up...' : "You're set up"}
        </button>
      </div>
    </OnboardingShell>
  )
}
