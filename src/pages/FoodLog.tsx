import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface FoodEntry {
  id: string
  meal_type: string
  food_name: string
  calories: number
  protein_g: number
  fiber_g: number
  logged_at: string
}

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const

export default function FoodLog() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [mealType, setMealType] = useState<string>('lunch')
  const [foodName, setFoodName] = useState('')
  const [calories, setCalories] = useState('')
  const [proteinG, setProteinG] = useState('')
  const [fiberG, setFiberG] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) loadEntries()
  }, [user])

  async function loadEntries() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', user!.id)
      .gte('logged_at', today)
      .order('logged_at', { ascending: false })
    if (data) setEntries(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('food_entries').insert({
      user_id: user!.id,
      meal_type: mealType,
      food_name: foodName,
      calories: parseInt(calories) || 0,
      protein_g: parseFloat(proteinG) || 0,
      fiber_g: parseFloat(fiberG) || 0,
      logged_at: new Date().toISOString(),
      source: 'manual',
    })
    if (!error) {
      setShowForm(false)
      setFoodName('')
      setCalories('')
      setProteinG('')
      setFiberG('')
      loadEntries()
    }
    setSaving(false)
  }

  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0)
  const totalProtein = entries.reduce((sum, e) => sum + e.protein_g, 0)
  const totalFiber = entries.reduce((sum, e) => sum + e.fiber_g, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Food Log</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
        >
          + Add Food
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
          <p className="text-lg font-bold text-gray-800">{totalCalories}</p>
          <p className="text-xs text-gray-500">Calories</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
          <p className="text-lg font-bold text-green-600">{totalProtein.toFixed(0)}g</p>
          <p className="text-xs text-gray-500">Protein</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
          <p className="text-lg font-bold text-amber-600">{totalFiber.toFixed(0)}g</p>
          <p className="text-xs text-gray-500">Fiber</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
          <select
            value={mealType}
            onChange={e => setMealType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            {mealTypes.map(m => (
              <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
            ))}
          </select>
          <input
            type="text"
            value={foodName}
            onChange={e => setFoodName(e.target.value)}
            placeholder="Food name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required
          />
          <div className="grid grid-cols-3 gap-2">
            <input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="Cal" className="px-3 py-2 border border-gray-300 rounded-lg" />
            <input type="number" value={proteinG} onChange={e => setProteinG(e.target.value)} placeholder="Protein g" className="px-3 py-2 border border-gray-300 rounded-lg" />
            <input type="number" value={fiberG} onChange={e => setFiberG(e.target.value)} placeholder="Fiber g" className="px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <button type="submit" disabled={saving} className="w-full py-2 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {entries.map(entry => (
          <div key={entry.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-800">{entry.food_name}</p>
              <p className="text-xs text-gray-400 capitalize">{entry.meal_type}</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-gray-700">{entry.calories} cal</p>
              <p className="text-xs text-gray-400">{entry.protein_g}g P / {entry.fiber_g}g F</p>
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-center text-gray-400 py-8">No food logged today.</p>
        )}
      </div>
    </div>
  )
}
