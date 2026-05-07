import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingShell from '../../components/OnboardingShell'
import { useOnboarding } from '../../hooks/useOnboarding'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { MealType } from '../../types'

const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'lunch', label: 'Lunch', icon: '☀️' },
  { value: 'dinner', label: 'Dinner', icon: '🌙' },
  { value: 'snack', label: 'Snack', icon: '🍎' },
]

interface CoachMark {
  target: string
  text: string
}

const COACH_MARKS: CoachMark[] = [
  { target: 'meal-type', text: 'Start by picking the meal you just had or are planning.' },
  { target: 'meal-description', text: 'Describe what you ate in your own words — no need to be precise.' },
  { target: 'meal-notes', text: 'Optionally note how you felt. This helps spot patterns with your medication.' },
]

export default function FirstMealEntry() {
  const navigate = useNavigate()
  const { data, reset } = useOnboarding()
  const { user, signUp } = useAuth()
  const [mealType, setMealType] = useState<MealType | null>(null)
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [coachStep, setCoachStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const showCoach = coachStep < COACH_MARKS.length
  const currentCoach = COACH_MARKS[coachStep]

  const dismissCoach = () => {
    if (coachStep < COACH_MARKS.length) {
      setCoachStep(coachStep + 1)
    }
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

      if (mealType && description.trim()) {
        await supabase.from('food_entries').insert({
          user_id: activeUser.id,
          meal_type: mealType,
          food_name: description.trim(),
          notes: notes.trim() || null,
          source: 'manual',
          logged_at: new Date().toISOString(),
        })
      }

      localStorage.removeItem('glp1_onboarding_route')
      reset()

      navigate('/onboarding/success', { replace: true })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <OnboardingShell
      step={3}
      totalSteps={4}
      onBack={() => navigate('/onboarding/notifications')}
      onSkip={() => handleComplete()}
    >
      <h1 className="text-display-lg text-slate-900 mb-2">Log your first meal</h1>
      <p className="text-body-lg text-slate-500 mb-6">
        Try it out — you can always edit or delete this later.
      </p>

      <div className="relative mb-5" data-coach="meal-type">
        <label className="text-label text-slate-500 uppercase mb-2 block">What meal?</label>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map((mt) => (
            <button
              key={mt.value}
              onClick={() => {
                setMealType(mt.value)
                if (showCoach && currentCoach?.target === 'meal-type') dismissCoach()
              }}
              className={`p-3 rounded-md text-center transition-all ${
                mealType === mt.value
                  ? 'border-2 border-slate-700 bg-white shadow-elevation-1'
                  : 'border-2 border-slate-200 bg-white'
              }`}
            >
              <span className="block text-xl mb-1" aria-hidden="true">{mt.icon}</span>
              <span className="block text-body-sm text-slate-700">{mt.label}</span>
            </button>
          ))}
        </div>
        {showCoach && currentCoach?.target === 'meal-type' && (
          <div className="absolute -bottom-12 left-0 right-0 bg-slate-700 text-white text-body-sm rounded-md px-3 py-2 shadow-elevation-2 z-10" role="tooltip">
            {currentCoach.text}
            <button onClick={dismissCoach} className="ml-2 underline text-slate-300">Got it</button>
          </div>
        )}
      </div>

      <div className="relative mb-5" data-coach="meal-description">
        <label htmlFor="meal-desc" className="text-label text-slate-500 uppercase mb-2 block">What did you eat?</label>
        <input
          id="meal-desc"
          type="text"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            if (showCoach && currentCoach?.target === 'meal-description') dismissCoach()
          }}
          placeholder="e.g. Grilled chicken with rice and veggies"
          maxLength={200}
          className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none transition-colors"
        />
        {showCoach && currentCoach?.target === 'meal-description' && (
          <div className="absolute -bottom-12 left-0 right-0 bg-slate-700 text-white text-body-sm rounded-md px-3 py-2 shadow-elevation-2 z-10" role="tooltip">
            {currentCoach.text}
            <button onClick={dismissCoach} className="ml-2 underline text-slate-300">Got it</button>
          </div>
        )}
      </div>

      <div className="relative mb-5" data-coach="meal-notes">
        <label htmlFor="meal-notes" className="text-label text-slate-500 uppercase mb-2 block">How did you feel?</label>
        <textarea
          id="meal-notes"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value)
            if (showCoach && currentCoach?.target === 'meal-notes') dismissCoach()
          }}
          placeholder="Any nausea, fullness, energy levels..."
          maxLength={500}
          rows={2}
          className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none transition-colors resize-none"
        />
        {showCoach && currentCoach?.target === 'meal-notes' && (
          <div className="absolute -bottom-12 left-0 right-0 bg-slate-700 text-white text-body-sm rounded-md px-3 py-2 shadow-elevation-2 z-10" role="tooltip">
            {currentCoach.text}
            <button onClick={dismissCoach} className="ml-2 underline text-slate-300">Got it</button>
          </div>
        )}
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
          disabled={saving}
          className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-900 transition-colors"
        >
          {saving ? 'Saving...' : user ? 'Save & finish' : 'Create account & finish'}
        </button>
      </div>
    </OnboardingShell>
  )
}
