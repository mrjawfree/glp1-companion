import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingShell from '../../components/OnboardingShell'
import { useOnboarding } from '../../hooks/useOnboarding'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export default function Profile() {
  const navigate = useNavigate()
  const { data } = useOnboarding()
  const { user, signUp } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleComplete = async () => {
    setSaving(true)
    setError('')

    try {
      let activeUser = user
      if (!activeUser) {
        if (!email || !password) {
          setError('Email and password are required to create your account.')
          setSaving(false)
          return
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.')
          setSaving(false)
          return
        }
        await signUp(email, password)
        const { data: sessionData } = await supabase.auth.getSession()
        activeUser = sessionData.session?.user ?? null
        if (!activeUser) {
          setError('Account created! Check your email to confirm, then tap below again.')
          setSaving(false)
          return
        }
      }

      const medicationName = data.medication === 'other' ? data.medicationOther : data.medication

      const { error: upsertError } = await supabase.from('users').upsert({
        id: activeUser.id,
        email: activeUser.email,
        display_name: activeUser.email?.split('@')[0],
        medication: medicationName,
        current_dose: data.doseAmount,
      })
      if (upsertError) throw upsertError

      const { error: settingsError } = await supabase.from('user_settings').upsert({
        user_id: activeUser.id,
        medication_name: medicationName,
        injection_day: data.injectionDays.length > 0
          ? ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][data.injectionDays[0]]
          : null,
        medication_dose: data.doseAmount?.toString(),
        goal_weight_lbs: data.weightUnit === 'lb' ? data.goalWeight : null,
      })
      if (settingsError) throw settingsError

      localStorage.removeItem('glp1_onboarding_route')
      navigate('/onboarding/notifications')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <OnboardingShell step={7} totalSteps={7} onBack={() => navigate('/onboarding/review')}>
      <h1 className="text-display-lg text-slate-900 mb-2">Create your account</h1>
      <p className="text-body-lg text-slate-500 mb-6">
        {user ? 'Ready to save your settings.' : 'Sign up to save your progress.'}
      </p>

      <div className="space-y-5 mb-8">
        {!user && (
          <>
            <div>
              <label className="text-label text-slate-500 uppercase mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-label text-slate-500 uppercase mb-2 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none"
                required
              />
            </div>
          </>
        )}
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
          {saving ? 'Setting up...' : user ? 'Save & continue' : 'Create account & continue'}
        </button>
      </div>
    </OnboardingShell>
  )
}
