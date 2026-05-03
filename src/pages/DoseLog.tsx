import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface DoseEntry {
  id: string
  medication: string
  dose_amount: string
  logged_at: string
  side_effects: string[] | null
  notes: string | null
}

const medications = ['ozempic', 'wegovy', 'mounjaro', 'other'] as const
const commonSideEffects = ['nausea', 'fatigue', 'headache', 'constipation', 'diarrhea', 'injection site pain']

export default function DoseLog() {
  const { user } = useAuth()
  const [doses, setDoses] = useState<DoseEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [medication, setMedication] = useState<string>('ozempic')
  const [doseAmount, setDoseAmount] = useState('')
  const [sideEffects, setSideEffects] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) loadDoses()
  }, [user])

  async function loadDoses() {
    const { data } = await supabase
      .from('dose_logs')
      .select('*')
      .eq('user_id', user!.id)
      .order('logged_at', { ascending: false })
      .limit(30)
    if (data) setDoses(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('dose_logs').insert({
      user_id: user!.id,
      medication,
      dose_amount: doseAmount,
      logged_at: new Date().toISOString(),
      side_effects: sideEffects.length > 0 ? sideEffects : null,
      notes: notes || null,
    })
    if (!error) {
      setShowForm(false)
      setDoseAmount('')
      setSideEffects([])
      setNotes('')
      loadDoses()
    }
    setSaving(false)
  }

  function toggleSideEffect(effect: string) {
    setSideEffects(prev =>
      prev.includes(effect) ? prev.filter(e => e !== effect) : [...prev, effect]
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Dose Log</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
        >
          + Log Dose
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medication</label>
            <select
              value={medication}
              onChange={e => setMedication(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {medications.map(m => (
                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dose Amount</label>
            <input
              type="text"
              value={doseAmount}
              onChange={e => setDoseAmount(e.target.value)}
              placeholder="e.g. 0.25mg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Side Effects</label>
            <div className="flex flex-wrap gap-2">
              {commonSideEffects.map(effect => (
                <button
                  key={effect}
                  type="button"
                  onClick={() => toggleSideEffect(effect)}
                  className={`px-3 py-1 text-xs rounded-full border ${
                    sideEffects.includes(effect)
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  {effect}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={2}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Dose'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {doses.map(dose => (
          <div key={dose.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-800 capitalize">{dose.medication}</p>
                <p className="text-sm text-gray-500">{dose.dose_amount}</p>
              </div>
              <p className="text-xs text-gray-400">
                {new Date(dose.logged_at).toLocaleDateString()}
              </p>
            </div>
            {dose.side_effects && (
              <div className="mt-2 flex flex-wrap gap-1">
                {dose.side_effects.map(e => (
                  <span key={e} className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{e}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {doses.length === 0 && (
          <p className="text-center text-gray-400 py-8">No doses logged yet. Tap "+ Log Dose" to get started.</p>
        )}
      </div>
    </div>
  )
}
