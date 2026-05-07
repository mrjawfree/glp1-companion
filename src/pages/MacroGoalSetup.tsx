import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNutritionGoals } from '../hooks/useNutritionGoals'
import { suggestGoals, type SuggestOutput } from '../lib/nutrition/suggest'
import { supabase } from '../lib/supabase'
import NumericStepper from '../components/NumericStepper'

export default function MacroGoalSetup() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isOnboarding = searchParams.get('onboarding') === '1'
  const { goals, loading: goalsLoading, upsert, skip } = useNutritionGoals()

  const [calories, setCalories] = useState<number | null>(null)
  const [proteinG, setProteinG] = useState<number | null>(null)
  const [waterMl, setWaterMl] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestOutput>({ calories: null, proteinG: null, waterMl: null })
  const [suggestOpen, setSuggestOpen] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileMissing, setProfileMissing] = useState(false)

  useEffect(() => {
    if (goals && !goalsLoading) {
      setCalories(goals.calorie_goal)
      setProteinG(goals.protein_goal_g)
      setWaterMl(goals.water_goal_ml)
    }
  }, [goals, goalsLoading])

  useEffect(() => {
    if (!user) return
    async function loadProfile() {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('current_weight, dose_amount')
        .eq('user_id', user!.id)
        .single()

      if (!settings?.current_weight) {
        setProfileMissing(true)
        return
      }

      const weightKg = settings.current_weight
      const result = suggestGoals({
        weightKg,
        heightCm: null,
        age: null,
        sex: null,
        doseTier: settings.dose_amount ? Math.min(4, Math.ceil(settings.dose_amount / 0.5)) : null,
      })
      setSuggestions(result)

      if (!goals) {
        if (result.calories) setCalories(result.calories)
        if (result.proteinG) setProteinG(result.proteinG)
        if (result.waterMl) setWaterMl(result.waterMl)
      }
    }
    loadProfile()
  }, [user, goals])

  const allValid = calories !== null && calories >= 800 && calories <= 4000
    && proteinG !== null && proteinG >= 20 && proteinG <= 300
    && waterMl !== null && waterMl >= 500 && waterMl <= 6000

  const hasChanged = goals
    ? (calories !== goals.calorie_goal || proteinG !== goals.protein_goal_g || waterMl !== goals.water_goal_ml)
    : (calories !== null || proteinG !== null || waterMl !== null)

  async function handleSave() {
    if (!allValid || !calories || !proteinG || !waterMl) return
    setSaving(true)
    const source = goals ? 'manual' : (
      calories === suggestions.calories && proteinG === suggestions.proteinG && waterMl === suggestions.waterMl
        ? 'suggested' : 'mixed'
    )
    await upsert({
      calorie_goal: calories,
      protein_goal_g: proteinG,
      water_goal_ml: waterMl,
      source,
    })
    setSaving(false)
    if (isOnboarding) {
      navigate('/', { replace: true })
    } else {
      navigate(-1)
    }
  }

  async function handleSkip() {
    await skip()
    navigate('/', { replace: true })
  }

  if (goalsLoading) {
    return (
      <div className="px-4 pt-8 flex items-center justify-center">
        <p className="text-body-md text-slate-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
      <h1 className="text-title-lg text-slate-900 mb-2">
        {isOnboarding ? "Let's set your nutrition goals" : 'Nutrition goals'}
      </h1>
      {isOnboarding && (
        <p className="text-body-md text-slate-500 mb-6">
          GLP-1 makes it easy to under-eat. Set targets so we can nudge you.
        </p>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-body-md font-semibold text-slate-900 mb-2">Daily calories (kcal)</label>
          <NumericStepper
            value={calories}
            onChange={setCalories}
            step={100}
            min={800}
            max={4000}
            placeholder="2,000"
            suffix="kcal"
          />
          {calories !== null && (calories < 800 || calories > 4000) && (
            <p className="text-body-sm text-rose-500 mt-1">Must be between 800 and 4,000 kcal</p>
          )}
        </div>

        <div>
          <label className="block text-body-md font-semibold text-slate-900 mb-2">Daily protein (g)</label>
          <NumericStepper
            value={proteinG}
            onChange={setProteinG}
            step={5}
            min={20}
            max={300}
            placeholder="100"
            suffix="g"
          />
          {proteinG !== null && (proteinG < 20 || proteinG > 300) && (
            <p className="text-body-sm text-rose-500 mt-1">Must be between 20 and 300 g</p>
          )}
        </div>

        <div>
          <label className="block text-body-md font-semibold text-slate-900 mb-2">Daily water (ml)</label>
          <NumericStepper
            value={waterMl}
            onChange={setWaterMl}
            step={250}
            min={500}
            max={6000}
            placeholder="2,000"
            suffix="ml"
          />
          {waterMl !== null && (waterMl < 500 || waterMl > 6000) && (
            <p className="text-body-sm text-rose-500 mt-1">Must be between 500 and 6,000 ml</p>
          )}
        </div>
      </div>

      {(suggestions.calories || suggestions.proteinG || suggestions.waterMl) && (
        <div className="mt-6">
          <button
            onClick={() => setSuggestOpen(!suggestOpen)}
            className="text-body-md font-semibold text-info mb-3 flex items-center gap-1"
          >
            Suggestions {suggestOpen ? '▾' : '▸'}
          </button>
          {suggestOpen && (
            <div className="space-y-3 bg-slate-100 rounded-md p-4">
              {suggestions.proteinG && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-body-md text-slate-700">{suggestions.proteinG}g protein</p>
                    <p className="text-body-sm text-slate-400">Based on 1.6 g/kg to preserve muscle mass during GLP-1 use.</p>
                  </div>
                  <button
                    onClick={() => setProteinG(suggestions.proteinG)}
                    className="text-body-sm text-info bg-white px-3 py-1 rounded-pill font-medium flex-shrink-0"
                  >
                    Apply
                  </button>
                </div>
              )}
              {suggestions.calories && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-body-md text-slate-700">{suggestions.calories} kcal</p>
                    <p className="text-body-sm text-slate-400">Estimated maintenance adjusted for GLP-1.</p>
                  </div>
                  <button
                    onClick={() => setCalories(suggestions.calories)}
                    className="text-body-sm text-info bg-white px-3 py-1 rounded-pill font-medium flex-shrink-0"
                  >
                    Apply
                  </button>
                </div>
              )}
              {suggestions.waterMl && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-body-md text-slate-700">{suggestions.waterMl} ml water</p>
                    <p className="text-body-sm text-slate-400">Based on 33 ml per kg body weight.</p>
                  </div>
                  <button
                    onClick={() => setWaterMl(suggestions.waterMl)}
                    className="text-body-sm text-info bg-white px-3 py-1 rounded-pill font-medium flex-shrink-0"
                  >
                    Apply
                  </button>
                </div>
              )}
              {profileMissing && (
                <p className="text-body-sm text-slate-400">
                  Add your weight in <a href="/settings" className="text-info underline">profile settings</a> to get personalized suggestions.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {profileMissing && !suggestions.calories && (
        <div className="mt-6 bg-slate-100 rounded-md p-4">
          <p className="text-body-sm text-slate-400">
            Add your weight in <a href="/settings" className="text-info underline">profile settings</a> to get personalized suggestions.
          </p>
        </div>
      )}

      <div className="mt-8 space-y-3">
        <button
          onClick={handleSave}
          disabled={!allValid || !hasChanged || saving}
          className="w-full py-4 rounded-md bg-green-600 text-white text-body-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-400 transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {isOnboarding && (
          <button
            onClick={handleSkip}
            className="w-full py-3 text-body-md text-slate-500 font-medium"
          >
            Skip for now
          </button>
        )}
        {!isOnboarding && (
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 text-body-md text-slate-500 font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
