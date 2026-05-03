import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface ProgressEntry {
  id: string
  recorded_at: string
  weight_kg: number | null
  waist_cm: number | null
  energy_level: number | null
  notes: string | null
}

export default function Progress() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<ProgressEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [weightKg, setWeightKg] = useState('')
  const [waistCm, setWaistCm] = useState('')
  const [energyLevel, setEnergyLevel] = useState<number>(3)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) loadEntries()
  }, [user])

  async function loadEntries() {
    const { data } = await supabase
      .from('progress_tracking')
      .select('*')
      .eq('user_id', user!.id)
      .order('recorded_at', { ascending: false })
      .limit(30)
    if (data) setEntries(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('progress_tracking').insert({
      user_id: user!.id,
      recorded_at: new Date().toISOString().split('T')[0],
      weight_kg: weightKg ? parseFloat(weightKg) : null,
      waist_cm: waistCm ? parseFloat(waistCm) : null,
      energy_level: energyLevel,
    })
    if (!error) {
      setShowForm(false)
      setWeightKg('')
      setWaistCm('')
      setEnergyLevel(3)
      loadEntries()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Progress</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
        >
          + Record
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input type="number" step="0.1" value={weightKg} onChange={e => setWeightKg(e.target.value)} placeholder="e.g. 85.0" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Waist (cm)</label>
            <input type="number" step="0.1" value={waistCm} onChange={e => setWaistCm(e.target.value)} placeholder="e.g. 90.0" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Energy Level</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setEnergyLevel(level)}
                  className={`w-10 h-10 rounded-full border ${energyLevel === level ? 'bg-primary-100 border-primary-400 text-primary-700' : 'border-gray-300 text-gray-600'}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={saving} className="w-full py-2 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {entries.map(entry => (
          <div key={entry.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-700">{new Date(entry.recorded_at).toLocaleDateString()}</p>
              <div className="flex gap-3 text-sm text-gray-500">
                {entry.weight_kg && <span>{entry.weight_kg} kg</span>}
                {entry.waist_cm && <span>{entry.waist_cm} cm</span>}
                {entry.energy_level && <span>⚡ {entry.energy_level}/5</span>}
              </div>
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-center text-gray-400 py-8">No progress entries yet.</p>
        )}
      </div>
    </div>
  )
}
