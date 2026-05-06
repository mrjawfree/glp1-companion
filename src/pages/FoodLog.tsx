import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { FoodLogSkeleton } from '../components/Skeleton'

interface FoodEntry {
  id: string
  meal_type: string
  food_name: string
  calories: number
  protein_g: number
  fiber_g: number
  fat_g: number | null
  carbs_g: number | null
  logged_at: string
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

const STARTER_FOODS = [
  { name: 'Greek yogurt', protein: 18, fiber: 0, calories: 130, fat: 4, carbs: 8 },
  { name: 'Eggs (2)', protein: 12, fiber: 0, calories: 140, fat: 10, carbs: 1 },
  { name: 'Cottage cheese', protein: 14, fiber: 0, calories: 110, fat: 5, carbs: 4 },
  { name: 'Bone broth', protein: 10, fiber: 0, calories: 50, fat: 1, carbs: 1 },
  { name: 'Banana', protein: 1, fiber: 3, calories: 105, fat: 0, carbs: 27 },
  { name: 'Oatmeal', protein: 5, fiber: 4, calories: 150, fat: 3, carbs: 27 },
]

function getMealSlotByTime(): string {
  const h = new Date().getHours()
  if (h < 10) return 'breakfast'
  if (h < 14) return 'lunch'
  if (h < 17) return 'snack'
  return 'dinner'
}

function MacroBar({ protein, fat, carbs }: { protein: number; fat: number; carbs: number }) {
  const total = protein + fat + carbs
  if (total === 0) return null
  return (
    <div className="flex h-2 rounded-pill overflow-hidden bg-slate-100">
      <div className="bg-green-600 transition-all" style={{ width: `${(protein / total) * 100}%` }} />
      <div className="bg-amber-500 transition-all" style={{ width: `${(fat / total) * 100}%` }} />
      <div className="bg-slate-400 transition-all" style={{ width: `${(carbs / total) * 100}%` }} />
    </div>
  )
}

export default function FoodLog() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [view, setView] = useState<'daily' | 'add' | 'log'>('daily')
  const [searchQuery, setSearchQuery] = useState('')
  const [mealType, setMealType] = useState(getMealSlotByTime())
  const [foodName, setFoodName] = useState('')
  const [calories, setCalories] = useState('')
  const [proteinG, setProteinG] = useState('')
  const [fiberG, setFiberG] = useState('')
  const [fatG, setFatG] = useState('')
  const [carbsG, setCarbsG] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [hydration, setHydration] = useState(0)

  useEffect(() => {
    if (user) loadEntries().finally(() => setLoading(false))
  }, [user, selectedDate])

  async function loadEntries() {
    const nextDay = new Date(selectedDate)
    nextDay.setDate(nextDay.getDate() + 1)
    const { data } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user!.id)
      .gte('logged_at', selectedDate)
      .lt('logged_at', nextDay.toISOString().split('T')[0])
      .order('logged_at', { ascending: false })
    if (data) setEntries(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('meals').insert({
      user_id: user!.id,
      meal_type: mealType,
      food_name: foodName,
      calories: parseInt(calories) || 0,
      protein_g: parseFloat(proteinG) || 0,
      fiber_g: parseFloat(fiberG) || 0,
      fat_g: parseFloat(fatG) || 0,
      carbs_g: parseFloat(carbsG) || 0,
      logged_at: new Date().toISOString(),
      source: 'manual',
    })
    if (!error) {
      setView('daily')
      setFoodName('')
      setCalories('')
      setProteinG('')
      setFiberG('')
      setFatG('')
      setCarbsG('')
      loadEntries()
    }
    setSaving(false)
  }

  function quickLog(food: typeof STARTER_FOODS[0]) {
    setFoodName(food.name)
    setProteinG(String(food.protein))
    setFiberG(String(food.fiber))
    setCalories(String(food.calories))
    setFatG(String(food.fat))
    setCarbsG(String(food.carbs))
    setView('log')
  }

  const totalCalories = entries.reduce((s, e) => s + e.calories, 0)
  const totalProtein = entries.reduce((s, e) => s + e.protein_g, 0)
  const totalFiber = entries.reduce((s, e) => s + e.fiber_g, 0)

  const groupedByMeal = entries.reduce<Record<string, FoodEntry[]>>((acc, entry) => {
    if (!acc[entry.meal_type]) acc[entry.meal_type] = []
    acc[entry.meal_type].push(entry)
    return acc
  }, {})

  if (loading && view === 'daily') return <FoodLogSkeleton />

  if (view === 'add') {
    const filtered = STARTER_FOODS.filter(f =>
      !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    return (
      <div className="px-4 pt-5">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setView('daily')} className="text-slate-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search food..."
            autoFocus
            className="flex-1 border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none"
          />
        </div>

        <div className="mb-5">
          <h3 className="text-label text-slate-400 uppercase mb-3">
            {searchQuery ? 'Results' : 'Quick picks'}
          </h3>
          <div className="space-y-1">
            {filtered.map(food => (
              <button key={food.name} onClick={() => quickLog(food)}
                className="w-full flex items-center justify-between bg-white rounded-md p-3 shadow-elevation-1 text-left">
                <div>
                  <p className="text-body-md font-medium text-slate-900">{food.name}</p>
                  <p className="text-body-sm text-slate-400">
                    {food.protein}g P · {food.fat}g F · {food.carbs}g C · {food.calories} kcal
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-body-lg font-semibold">
                  +
                </div>
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => { setFoodName(''); setView('log') }}
          className="w-full border-2 border-dashed border-slate-300 rounded-md p-4 text-center text-slate-500 text-body-md">
          Add custom food
        </button>
      </div>
    )
  }

  if (view === 'log') {
    return (
      <div className="px-4 pt-5">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setView('add')} className="text-slate-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h1 className="text-title-lg text-slate-900">Log food</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-label text-slate-500 uppercase mb-2 block">Food name</label>
            <input type="text" value={foodName} onChange={e => setFoodName(e.target.value)}
              placeholder="What did you eat?" required
              className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none" />
          </div>

          <div>
            <label className="text-label text-slate-500 uppercase mb-2 block">Meal</label>
            <div className="flex gap-1 bg-slate-100 rounded-md p-1">
              {MEAL_TYPES.map(m => (
                <button key={m} type="button" onClick={() => setMealType(m)}
                  className={`flex-1 py-2 rounded-md text-label transition-colors capitalize ${
                    mealType === m ? 'bg-white text-slate-700 shadow-elevation-1' : 'text-slate-400'
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-label text-slate-500 uppercase mb-2 block">Macros</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-body-sm text-slate-400 mb-1 block">Protein (g)</span>
                <input type="number" value={proteinG} onChange={e => setProteinG(e.target.value)}
                  placeholder="0" className="w-full border-2 border-slate-200 rounded-md px-3 py-2 text-body-lg bg-white focus:border-slate-700 focus:outline-none" />
              </div>
              <div>
                <span className="text-body-sm text-slate-400 mb-1 block">Fiber (g)</span>
                <input type="number" value={fiberG} onChange={e => setFiberG(e.target.value)}
                  placeholder="0" className="w-full border-2 border-slate-200 rounded-md px-3 py-2 text-body-lg bg-white focus:border-slate-700 focus:outline-none" />
              </div>
              <div>
                <span className="text-body-sm text-slate-400 mb-1 block">Fat (g)</span>
                <input type="number" value={fatG} onChange={e => setFatG(e.target.value)}
                  placeholder="0" className="w-full border-2 border-slate-200 rounded-md px-3 py-2 text-body-lg bg-white focus:border-slate-700 focus:outline-none" />
              </div>
              <div>
                <span className="text-body-sm text-slate-400 mb-1 block">Carbs (g)</span>
                <input type="number" value={carbsG} onChange={e => setCarbsG(e.target.value)}
                  placeholder="0" className="w-full border-2 border-slate-200 rounded-md px-3 py-2 text-body-lg bg-white focus:border-slate-700 focus:outline-none" />
              </div>
            </div>
            {(parseFloat(proteinG) || 0) + (parseFloat(fatG) || 0) + (parseFloat(carbsG) || 0) > 0 && (
              <div className="mt-3">
                <MacroBar protein={parseFloat(proteinG) || 0} fat={parseFloat(fatG) || 0} carbs={parseFloat(carbsG) || 0} />
                <div className="flex gap-3 mt-1 text-body-sm text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-600" />Protein</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Fat</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400" />Carbs</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <span className="text-body-sm text-slate-400 mb-1 block">Calories (auto-calculated or override)</span>
            <input type="number" value={calories} onChange={e => setCalories(e.target.value)}
              placeholder={String(Math.round((parseFloat(proteinG) || 0) * 4 + (parseFloat(fatG) || 0) * 9 + (parseFloat(carbsG) || 0) * 4))}
              className="w-full border-2 border-slate-200 rounded-md px-3 py-2 text-body-lg bg-white focus:border-slate-700 focus:outline-none text-slate-500" />
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider disabled:opacity-40 hover:bg-slate-900 transition-colors">
            {saving ? 'Logging...' : 'Log'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="px-4 pt-5">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-title-lg text-slate-900">Food Log</h1>
        <button onClick={() => { setSearchQuery(''); setView('add') }}
          className="px-4 py-2 bg-slate-700 text-white text-label rounded-md hover:bg-slate-900 transition-colors">
          + Add food
        </button>
      </div>

      <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
        className="w-full border-2 border-slate-200 rounded-md px-4 py-2 text-body-md bg-white mb-5 focus:border-slate-700 focus:outline-none" />

      <div className="bg-white rounded-md shadow-elevation-1 p-5 mb-5">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-body-sm text-slate-400">Protein</p>
            <p className="text-title-lg text-green-600">{totalProtein.toFixed(0)}g <span className="text-body-sm text-slate-400">/ 90g</span></p>
          </div>
          <div className="text-right">
            <p className="text-body-sm text-slate-400">Fiber</p>
            <p className="text-body-lg text-slate-700">{totalFiber.toFixed(0)}g <span className="text-body-sm text-slate-400">/ 25g</span></p>
          </div>
        </div>
        <div className="flex gap-4 text-body-sm text-slate-400">
          <span>{totalCalories} kcal logged</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <span className="text-body-sm text-slate-500">Hydration</span>
        <div className="flex gap-1">
          {Array.from({ length: 8 }, (_, i) => (
            <button key={i} onClick={() => setHydration(i < hydration ? i : i + 1)}
              className={`w-7 h-7 rounded-full text-body-sm transition-colors ${
                i < hydration ? 'bg-info text-white' : 'bg-slate-100 text-slate-300'
              }`}>
              💧
            </button>
          ))}
        </div>
      </div>

      {MEAL_TYPES.map(meal => {
        const mealEntries = groupedByMeal[meal]
        if (!mealEntries?.length) return null
        return (
          <div key={meal} className="mb-4">
            <h3 className="text-label text-slate-400 uppercase mb-2 capitalize">{meal}</h3>
            <div className="space-y-1">
              {mealEntries.map(entry => (
                <div key={entry.id} className="bg-white rounded-md p-3 shadow-elevation-1 flex justify-between items-center">
                  <div>
                    <p className="text-body-md font-medium text-slate-900">{entry.food_name}</p>
                    <MacroBar protein={entry.protein_g} fat={entry.fat_g || 0} carbs={entry.carbs_g || 0} />
                  </div>
                  <div className="text-right text-body-sm">
                    <p className="text-green-600 font-medium">{entry.protein_g}g P</p>
                    <p className="text-slate-400">{entry.calories} kcal</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {entries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-body-lg text-slate-400 mb-2">Log your first meal</p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {STARTER_FOODS.slice(0, 6).map(food => (
              <button key={food.name} onClick={() => quickLog(food)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-pill text-body-sm text-slate-700">
                {food.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
