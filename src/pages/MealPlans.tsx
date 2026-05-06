import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { MealPlansSkeleton } from '../components/Skeleton'

interface MealPlan {
  id: string
  title: string
  description: string
  tags: string[]
  calories_target: number
  protein_target_g: number
  fiber_target_g: number
  is_template: boolean
  user_id: string | null
  week_start_date: string | null
}

interface MealEntry {
  id: string
  plan_id: string
  day_of_week: number
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  meal_name: string
  calories: number
  protein_g: number
  notes: string | null
}

const FILTERS = [
  'Easy on the stomach',
  'High protein',
  '5 ingredients or fewer',
  'Under 20 min',
  'Vegetarian',
  'Make-ahead',
  'Sip-friendly',
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  return d.toISOString().split('T')[0]
}

export default function MealPlans() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [myPlans, setMyPlans] = useState<MealPlan[]>([])
  const [savedPlanIds, setSavedPlanIds] = useState<Set<string>>(new Set())
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [tab, setTab] = useState<'discover' | 'saved' | 'plans'>('discover')
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null)
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null)
  const [entries, setEntries] = useState<MealEntry[]>([])
  const [selectedDay, setSelectedDay] = useState(new Date().getDay())
  const [showAddEntry, setShowAddEntry] = useState(false)
  const [entryName, setEntryName] = useState('')
  const [entryType, setEntryType] = useState<typeof MEAL_TYPES[number]>('lunch')
  const [entryCal, setEntryCal] = useState('')
  const [entryProtein, setEntryProtein] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const templatesP = loadTemplates()
    const plansP = user ? loadMyPlans() : Promise.resolve()
    Promise.all([templatesP, plansP]).finally(() => setLoading(false))
  }, [user])

  async function loadTemplates() {
    const { data } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('is_template', true)
      .order('title')
    if (data) setPlans(data)
  }

  async function loadMyPlans() {
    const { data } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', user!.id)
      .eq('is_template', false)
      .order('week_start_date', { ascending: false })
    if (data) setMyPlans(data)
  }

  async function loadEntries(planId: string) {
    const { data } = await supabase
      .from('meal_entries')
      .select('*')
      .eq('plan_id', planId)
      .order('day_of_week')
      .order('meal_type')
    if (data) setEntries(data)
  }

  async function createWeeklyPlan() {
    setSaving(true)
    const weekStart = getWeekStart()
    const { data } = await supabase
      .from('meal_plans')
      .insert({
        title: `Week of ${new Date(weekStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        description: 'My weekly meal plan',
        tags: [],
        calories_target: 1800,
        protein_target_g: 100,
        fiber_target_g: 25,
        is_template: false,
        user_id: user!.id,
        week_start_date: weekStart,
      })
      .select()
      .single()
    if (data) {
      setActivePlan(data)
      setEntries([])
      await loadMyPlans()
    }
    setSaving(false)
  }

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault()
    if (!activePlan || !entryName.trim()) return
    setSaving(true)
    const { error } = await supabase.from('meal_entries').insert({
      plan_id: activePlan.id,
      day_of_week: selectedDay,
      meal_type: entryType,
      meal_name: entryName.trim(),
      calories: entryCal ? parseInt(entryCal) : 0,
      protein_g: entryProtein ? parseFloat(entryProtein) : 0,
    })
    if (!error) {
      setShowAddEntry(false)
      setEntryName('')
      setEntryCal('')
      setEntryProtein('')
      await loadEntries(activePlan.id)
    }
    setSaving(false)
  }

  function handleSave(plan: MealPlan) {
    setSavedPlanIds(prev => {
      const next = new Set(prev)
      if (next.has(plan.id)) next.delete(plan.id)
      else next.add(plan.id)
      return next
    })
  }

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    )
  }

  const filteredPlans = activeFilters.length === 0
    ? plans
    : plans.filter(p => activeFilters.some(f => p.tags?.some(t => t.toLowerCase().includes(f.toLowerCase()))))

  const savedPlans = plans.filter(p => savedPlanIds.has(p.id))

  const dayEntries = entries.filter(e => e.day_of_week === selectedDay)

  if (loading) return <MealPlansSkeleton />

  if (activePlan) {
    return (
      <div className="px-4 pt-5">
        <button onClick={() => { setActivePlan(null); setEntries([]) }} className="flex items-center gap-2 text-slate-500 mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>

        <h1 className="text-title-lg text-slate-900 mb-1">{activePlan.title}</h1>
        <p className="text-body-sm text-slate-400 mb-4">
          {activePlan.calories_target} kcal · {activePlan.protein_target_g}g protein daily target
        </p>

        <div className="flex gap-1 overflow-x-auto pb-3 -mx-4 px-4 mb-4">
          {DAY_NAMES.map((name, i) => (
            <button key={i} onClick={() => setSelectedDay(i)}
              className={`px-3 py-2 rounded-md text-body-sm whitespace-nowrap transition-colors ${
                selectedDay === i ? 'bg-slate-700 text-white' : 'bg-white border border-slate-200 text-slate-500'
              }`}>
              {name}
            </button>
          ))}
        </div>

        {MEAL_TYPES.map(type => {
          const mealsForType = dayEntries.filter(e => e.meal_type === type)
          return (
            <div key={type} className="mb-4">
              <p className="text-label text-slate-400 uppercase mb-2 capitalize">{type}</p>
              {mealsForType.length === 0 ? (
                <div className="bg-warm-white-2 rounded-md p-3 text-body-sm text-slate-400">No meals planned</div>
              ) : (
                <div className="space-y-2">
                  {mealsForType.map(entry => (
                    <div key={entry.id} className="bg-white rounded-md p-3 shadow-elevation-1 flex justify-between items-center">
                      <p className="text-body-md text-slate-700">{entry.meal_name}</p>
                      <div className="flex gap-3 text-body-sm text-slate-400">
                        {entry.calories > 0 && <span>{entry.calories} cal</span>}
                        {entry.protein_g > 0 && <span>{entry.protein_g}g</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {showAddEntry ? (
          <form onSubmit={handleAddEntry} className="bg-white rounded-md shadow-elevation-1 p-4 space-y-3 mt-4">
            <input type="text" value={entryName} onChange={e => setEntryName(e.target.value)}
              placeholder="Meal name" autoFocus
              className="w-full border-2 border-slate-200 rounded-md px-3 py-2 text-body-md bg-white focus:border-slate-700 focus:outline-none" />
            <div className="flex gap-2">
              {MEAL_TYPES.map(t => (
                <button key={t} type="button" onClick={() => setEntryType(t)}
                  className={`px-2.5 py-1.5 rounded-md text-body-sm capitalize transition-colors ${
                    entryType === t ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <input type="number" value={entryCal} onChange={e => setEntryCal(e.target.value)}
                placeholder="Calories" className="flex-1 border-2 border-slate-200 rounded-md px-3 py-2 text-body-sm bg-white focus:border-slate-700 focus:outline-none" />
              <input type="number" step="0.1" value={entryProtein} onChange={e => setEntryProtein(e.target.value)}
                placeholder="Protein (g)" className="flex-1 border-2 border-slate-200 rounded-md px-3 py-2 text-body-sm bg-white focus:border-slate-700 focus:outline-none" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving || !entryName.trim()}
                className="flex-1 bg-slate-700 text-white py-2.5 rounded-md text-label uppercase disabled:opacity-40 hover:bg-slate-900 transition-colors">
                {saving ? 'Adding...' : 'Add meal'}
              </button>
              <button type="button" onClick={() => setShowAddEntry(false)}
                className="px-4 py-2.5 border-2 border-slate-200 rounded-md text-slate-500 hover:border-slate-400 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowAddEntry(true)}
            className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 rounded-md text-slate-400 text-body-md hover:border-slate-400 transition-colors">
            + Add meal to {DAY_NAMES[selectedDay]}
          </button>
        )}

        <div className="mt-5 bg-green-100 rounded-md p-4">
          <p className="text-body-sm text-green-600 font-medium">
            Day total: {dayEntries.reduce((s, e) => s + e.calories, 0)} cal · {dayEntries.reduce((s, e) => s + e.protein_g, 0).toFixed(0)}g protein
          </p>
        </div>
      </div>
    )
  }

  if (selectedPlan) {
    return (
      <div className="px-4 pt-5">
        <button onClick={() => setSelectedPlan(null)} className="flex items-center gap-2 text-slate-500 mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <div className="w-full h-48 bg-warm-white-2 rounded-md mb-4" />
        <h1 className="text-title-lg text-slate-900 mb-2">{selectedPlan.title}</h1>
        <p className="text-body-md text-slate-500 mb-4">{selectedPlan.description}</p>

        <div className="flex gap-4 mb-5 text-body-sm">
          <span className="text-green-600 font-medium">{selectedPlan.protein_target_g}g protein</span>
          <span className="text-slate-500">{selectedPlan.fiber_target_g}g fiber</span>
          <span className="text-slate-400">{selectedPlan.calories_target} kcal</span>
        </div>

        <div className="bg-green-100 rounded-md p-4 mb-5">
          <button className="flex items-center justify-between w-full text-left">
            <span className="text-body-md font-semibold text-green-600">Why this works for GLP-1</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7.5L10 12.5L15 7.5" stroke="#4A7C5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <ul className="mt-3 space-y-2 text-body-sm text-green-600">
            <li>High in protein to help preserve lean mass during weight loss</li>
            <li>Moderate fiber for digestive comfort without overloading</li>
            <li>Gentle portions that account for reduced appetite</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button onClick={() => handleSave(selectedPlan)}
            className={`flex-1 py-3 rounded-md text-label uppercase transition-colors ${
              savedPlanIds.has(selectedPlan.id)
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-white hover:bg-slate-900'
            }`}>
            {savedPlanIds.has(selectedPlan.id) ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-5">
      <h1 className="text-title-lg text-slate-900 mb-4">Meals</h1>

      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 mb-4">
        {FILTERS.map(filter => (
          <button key={filter} onClick={() => toggleFilter(filter)}
            className={`px-3 py-1.5 rounded-pill text-body-sm whitespace-nowrap transition-colors ${
              activeFilters.includes(filter)
                ? 'bg-slate-700 text-white'
                : 'bg-white border border-slate-200 text-slate-500'
            }`}>
            {filter}
          </button>
        ))}
      </div>

      <div className="flex gap-1 mb-5 bg-slate-100 rounded-md p-1">
        {(['discover', 'saved', 'plans'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-md text-label transition-colors capitalize ${
              tab === t ? 'bg-white text-slate-700 shadow-elevation-1' : 'text-slate-400'
            }`}>
            {t === 'plans' ? 'My plans' : t}
          </button>
        ))}
      </div>

      {tab === 'discover' && (
        <div className="grid grid-cols-2 gap-3">
          {filteredPlans.map(plan => (
            <button key={plan.id} onClick={() => setSelectedPlan(plan)}
              className="bg-white rounded-md shadow-elevation-1 overflow-hidden text-left">
              <div className="w-full h-28 bg-warm-white-2" />
              <div className="p-3">
                <p className="text-body-md font-semibold text-slate-900 mb-1 line-clamp-2">{plan.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-body-sm text-green-600 font-medium">{plan.protein_target_g}g</span>
                  <span className="text-body-sm text-slate-400">{plan.calories_target} kcal</span>
                </div>
                {plan.tags?.[0] && (
                  <span className="inline-block mt-2 text-body-sm bg-green-100 text-green-600 px-2 py-0.5 rounded-pill">
                    {plan.tags[0]}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === 'saved' && (
        savedPlans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-body-lg text-slate-400 mb-2">Bookmark meals you like — they'll show up here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {savedPlans.map(plan => (
              <button key={plan.id} onClick={() => setSelectedPlan(plan)}
                className="bg-white rounded-md shadow-elevation-1 overflow-hidden text-left">
                <div className="w-full h-28 bg-warm-white-2" />
                <div className="p-3">
                  <p className="text-body-md font-semibold text-slate-900 mb-1 line-clamp-2">{plan.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-body-sm text-green-600 font-medium">{plan.protein_target_g}g</span>
                    <span className="text-body-sm text-slate-400">{plan.calories_target} kcal</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )
      )}

      {tab === 'plans' && (
        <div>
          {myPlans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-body-lg text-slate-400 mb-3">Create your first weekly meal plan.</p>
              <button onClick={createWeeklyPlan} disabled={saving}
                className="px-6 py-3 bg-slate-700 text-white text-label rounded-md hover:bg-slate-900 transition-colors disabled:opacity-40">
                {saving ? 'Creating...' : 'New weekly plan'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myPlans.map(plan => (
                <button key={plan.id} onClick={() => { setActivePlan(plan); loadEntries(plan.id) }}
                  className="w-full bg-white rounded-md shadow-elevation-1 p-4 text-left">
                  <p className="text-body-md font-semibold text-slate-900">{plan.title}</p>
                  <p className="text-body-sm text-slate-400 mt-1">
                    {plan.calories_target} kcal · {plan.protein_target_g}g protein target
                  </p>
                </button>
              ))}
              <button onClick={createWeeklyPlan} disabled={saving}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-md text-slate-400 text-body-md hover:border-slate-400 transition-colors">
                + New weekly plan
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'discover' && filteredPlans.length === 0 && (
        <div className="text-center py-12">
          <p className="text-body-lg text-slate-400 mb-2">No matches with these filters</p>
          <button onClick={() => setActiveFilters([])} className="text-info text-body-md">Clear filters</button>
        </div>
      )}
    </div>
  )
}
