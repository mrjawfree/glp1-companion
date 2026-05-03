import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface MealPlan {
  id: string
  title: string
  description: string
  tags: string[]
  calories_target: number
  protein_target_g: number
  fiber_target_g: number
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

export default function MealPlans() {
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [tab, setTab] = useState<'discover' | 'saved' | 'plans'>('discover')
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null)

  useEffect(() => {
    loadPlans()
  }, [])

  async function loadPlans() {
    const { data } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('is_template', true)
      .order('title')
    if (data) setPlans(data)
  }

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    )
  }

  const filteredPlans = activeFilters.length === 0
    ? plans
    : plans.filter(p => activeFilters.some(f => p.tags?.some(t => t.toLowerCase().includes(f.toLowerCase()))))

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
          <button className="flex-1 bg-slate-700 text-white py-3 rounded-md text-label uppercase hover:bg-slate-900 transition-colors">
            Add to plan
          </button>
          <button className="px-4 py-3 border-2 border-slate-200 rounded-md text-slate-700 hover:border-slate-400 transition-colors">
            Save
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
        <div className="text-center py-12">
          <p className="text-body-lg text-slate-400 mb-2">Bookmark meals you like — they'll show up here.</p>
        </div>
      )}

      {tab === 'plans' && (
        <div className="text-center py-12">
          <p className="text-body-lg text-slate-400 mb-2">Add meals to your weekly plan to see them here.</p>
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
