import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingShell from '../../components/OnboardingShell'
import { useOnboarding } from '../../hooks/useOnboarding'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { FirstActionChoice } from '../../types'

export default function FirstAction() {
  const navigate = useNavigate()
  const { data, update, reset } = useOnboarding()
  const { user, signUp } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSelect = (choice: FirstActionChoice) => {
    update({ firstAction: choice })
  }

  const handleComplete = async () => {
    setSaving(true)
    setError('')

    try {
      let activeUser = user
      if (!activeUser) {
        if (!email || !password) {
          setError('Email and password are required to save your progress.')
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
        display_name: data.displayName || activeUser.email?.split('@')[0],
        medication: medicationName,
        current_dose: data.doseAmount,
      })
      if (upsertError) throw upsertError

      const { error: settingsError } = await supabase.from('user_settings').upsert({
        user_id: activeUser.id,
        medication_name: medicationName,
        medication_other: data.medication === 'other' ? data.medicationOther : null,
        injection_days: data.injectionDays,
        injection_day: data.injectionDays.length > 0
          ? ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][data.injectionDays[0]]
          : null,
        dose_amount: data.doseAmount,
        dose_unit: data.doseUnit,
        medication_dose: data.doseAmount?.toString(),
        current_weight: data.currentWeight,
        goal_weight: data.goalWeight,
        weight_unit: data.weightUnit,
        goal_weight_lbs: data.weightUnit === 'lb' ? data.goalWeight : null,
        display_name: data.displayName || null,
        tracking_preferences: data.trackingPreferences,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      if (settingsError) throw settingsError

      localStorage.removeItem('glp1_onboarding_route')
      reset()

      if (data.firstAction === 'log_injection') {
        navigate('/doses', { replace: true })
      } else if (data.firstAction === 'meal_plan') {
        navigate('/meals', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <OnboardingShell
      step={4}
      totalSteps={4}
      onBack={() => navigate('/onboarding/notifications')}
      onSkip={() => {
        update({ firstAction: null })
        handleComplete()
      }}
    >
      <h1 className="text-display-lg text-slate-900 mb-2">Your first step</h1>
      <p className="text-body-lg text-slate-500 mb-6">
        Pick an action to get started right away.
      </p>

      <div className="flex flex-col gap-3 mb-6">
        <button
          onClick={() => handleSelect('log_injection')}
          className={`p-4 rounded-md text-left transition-all ${
            data.firstAction === 'log_injection'
              ? 'border-2 border-slate-700 bg-white shadow-elevation-1'
              : 'border-2 border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4V16M4 10H16" stroke="#4A7C5C" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <span className="block text-body-lg font-semibold text-slate-900">Log my first injection</span>
              <span className="block text-body-sm text-slate-400">Start your dose tracking today</span>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleSelect('meal_plan')}
          className={`p-4 rounded-md text-left transition-all ${
            data.firstAction === 'meal_plan'
              ? 'border-2 border-slate-700 bg-white shadow-elevation-1'
              : 'border-2 border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5H17M3 10H17M3 15H12" stroke="#4A7C5C" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <span className="block text-body-lg font-semibold text-slate-900">Set up a meal plan</span>
              <span className="block text-body-sm text-slate-400">Plan meals that support your medication</span>
            </div>
          </div>
        </button>
      </div>

      {!user && (
        <div className="space-y-4 mb-6">
          <p className="text-body-sm text-slate-400">Create an account to save your progress.</p>
          <div>
            <label htmlFor="onboarding-email" className="text-label text-slate-500 uppercase mb-2 block">Email</label>
            <input
              id="onboarding-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="onboarding-password" className="text-label text-slate-500 uppercase mb-2 block">Password</label>
            <input
              id="onboarding-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none"
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-rose-500 text-body-sm mb-4" role="alert" aria-live="polite">{error}</p>
      )}

      <div className="mt-auto">
        <button
          onClick={handleComplete}
          disabled={saving || data.firstAction === null}
          className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-900 transition-colors"
        >
          {saving ? 'Setting up...' : user ? "Let's go" : 'Create account & start'}
        </button>
      </div>
    </OnboardingShell>
  )
}
