import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { ProgressSkeleton } from '../components/Skeleton'

interface ProgressEntry {
  id: string
  recorded_at: string
  weight_kg: number | null
  weight_lbs: number | null
  waist_cm: number | null
  energy_level: number | null
  measurements: Record<string, number> | null
  notes: string | null
}

type Tab = 'weight' | 'body' | 'energy' | 'doses'
type Range = '30' | '90' | '365'
type WeightUnit = 'lbs' | 'kg'

function TrendChart({ entries, accessor, range }: {
  entries: ProgressEntry[]; accessor: (e: ProgressEntry) => number | null; range: Range
}) {
  const daysAgo = parseInt(range)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysAgo)

  const filtered = entries
    .filter(e => new Date(e.recorded_at) >= cutoff && accessor(e) !== null)
    .reverse()

  if (filtered.length < 2) {
    return (
      <div className="bg-warm-white-2 rounded-md p-8 text-center">
        <p className="text-body-lg text-slate-400">Log a few entries to see your trend.</p>
      </div>
    )
  }

  const values = filtered.map(e => accessor(e)!)
  const min = Math.min(...values) - 1
  const max = Math.max(...values) + 1
  const h = 120
  const w = 300

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / (max - min)) * h
    return `${x},${y}`
  }).join(' ')

  const latest = values[values.length - 1]
  const prev = values.length >= 7 ? values[values.length - 7] : values[0]
  const diff = latest - prev
  const trend = Math.abs(diff) < 0.3 ? 'Trending steady' : diff < 0 ? 'Trending down gently' : 'Trending up slightly'

  return (
    <div>
      <svg viewBox={`-10 -10 ${w + 20} ${h + 20}`} className="w-full h-32">
        <polyline points={points} fill="none" stroke="#4A7C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((v, i) => {
          const x = (i / (values.length - 1)) * w
          const y = h - ((v - min) / (max - min)) * h
          return <circle key={i} cx={x} cy={y} r="3" fill="#4A7C5C" />
        })}
      </svg>
      <p className="text-body-sm text-slate-500 mt-2">{trend}</p>
    </div>
  )
}

const KG_TO_LBS = 2.20462

export default function Progress() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<ProgressEntry[]>([])
  const [tab, setTab] = useState<Tab>('weight')
  const [range, setRange] = useState<Range>('30')
  const [showForm, setShowForm] = useState(false)
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lbs')
  const [weightValue, setWeightValue] = useState('')
  const [waistCm, setWaistCm] = useState('')
  const [energyLevel, setEnergyLevel] = useState(3)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) loadEntries().finally(() => setLoading(false))
  }, [user])

  async function loadEntries() {
    const { data } = await supabase
      .from('progress_tracking')
      .select('*')
      .eq('user_id', user!.id)
      .order('recorded_at', { ascending: false })
      .limit(365)
    if (data) setEntries(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const parsed = weightValue ? parseFloat(weightValue) : null
    const weightKg = parsed !== null ? (weightUnit === 'lbs' ? parsed / KG_TO_LBS : parsed) : null
    const weightLbs = parsed !== null ? (weightUnit === 'lbs' ? parsed : parsed * KG_TO_LBS) : null

    const { error } = await supabase.from('progress_tracking').insert({
      user_id: user!.id,
      recorded_at: new Date().toISOString().split('T')[0],
      weight_kg: weightKg ? parseFloat(weightKg.toFixed(1)) : null,
      weight_lbs: weightLbs ? parseFloat(weightLbs.toFixed(1)) : null,
      waist_cm: waistCm ? parseFloat(waistCm) : null,
      energy_level: energyLevel,
    })
    if (!error) {
      setShowForm(false)
      setWeightValue('')
      setWaistCm('')
      setEnergyLevel(3)
      loadEntries()
    }
    setSaving(false)
  }

  const getWeight = (entry: ProgressEntry): number | null => {
    if (weightUnit === 'lbs') {
      return entry.weight_lbs ?? (entry.weight_kg ? parseFloat((entry.weight_kg * KG_TO_LBS).toFixed(1)) : null)
    }
    return entry.weight_kg
  }

  const latestWeight = entries.find(e => getWeight(e) !== null)
  const latestWeightVal = latestWeight ? getWeight(latestWeight) : null

  const weekEntries = entries.filter(e => {
    const d = new Date(e.recorded_at)
    const now = new Date()
    return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000
  })
  const weekWeights = weekEntries.filter(e => getWeight(e) !== null)
  const weekAvg = weekWeights.length > 0
    ? weekWeights.reduce((s, e) => s + getWeight(e)!, 0) / weekWeights.length
    : null

  if (loading) return <ProgressSkeleton />

  return (
    <div className="px-4 pt-5">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-title-lg text-slate-900">Progress</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-slate-700 text-white text-label rounded-md hover:bg-slate-900 transition-colors">
          {tab === 'weight' ? 'Log weight' : '+ Record'}
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-md p-1 mb-5">
        {(['weight', 'body', 'energy', 'doses'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-md text-label transition-colors capitalize ${
              tab === t ? 'bg-white text-slate-700 shadow-elevation-1' : 'text-slate-400'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-md shadow-elevation-1 p-5 mb-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-label text-slate-500 uppercase">Weight</label>
              <div className="flex gap-1 bg-slate-100 rounded-md p-0.5">
                {(['lbs', 'kg'] as WeightUnit[]).map(u => (
                  <button key={u} type="button" onClick={() => setWeightUnit(u)}
                    className={`px-2.5 py-1 rounded text-body-sm transition-colors ${
                      weightUnit === u ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'
                    }`}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <input type="number" step="0.1" value={weightValue} onChange={e => setWeightValue(e.target.value)}
              placeholder={latestWeightVal ? String(latestWeightVal) : weightUnit === 'lbs' ? '165.0' : '75.0'}
              className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none" />
          </div>
          <div>
            <label className="text-label text-slate-500 uppercase mb-2 block">Waist (cm)</label>
            <input type="number" step="0.1" value={waistCm} onChange={e => setWaistCm(e.target.value)}
              placeholder="90.0"
              className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none" />
          </div>
          <div>
            <label className="text-label text-slate-500 uppercase mb-2 block">Energy level</label>
            <div className="flex items-center gap-4">
              <span className="text-body-sm text-slate-400">Drained</span>
              <div className="flex gap-2 flex-1 justify-center">
                {[1, 2, 3, 4, 5].map(level => (
                  <button key={level} type="button" onClick={() => setEnergyLevel(level)}
                    className={`w-11 h-11 rounded-full text-label transition-colors ${
                      energyLevel === level
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}>
                    {level}
                  </button>
                ))}
              </div>
              <span className="text-body-sm text-slate-400">Energized</span>
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider disabled:opacity-40 hover:bg-slate-900 transition-colors">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      )}

      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          {(['30', '90', '365'] as Range[]).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-pill text-body-sm transition-colors ${
                range === r ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
              {r === '30' ? '30 days' : r === '90' ? '90 days' : '1 year'}
            </button>
          ))}
        </div>
        {tab === 'weight' && (
          <div className="flex gap-1 bg-slate-100 rounded-md p-0.5">
            {(['lbs', 'kg'] as WeightUnit[]).map(u => (
              <button key={u} onClick={() => setWeightUnit(u)}
                className={`px-2 py-1 rounded text-body-sm transition-colors ${
                  weightUnit === u ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'
                }`}>
                {u}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'weight' && (
        <div className="bg-white rounded-md shadow-elevation-1 p-5 mb-5">
          <TrendChart entries={entries} accessor={getWeight} range={range} />
          {weekAvg && (
            <p className="text-body-sm text-slate-500 mt-3">
              This week avg: {weekAvg.toFixed(1)} {weightUnit}
            </p>
          )}
        </div>
      )}

      {tab === 'body' && (
        <div className="bg-white rounded-md shadow-elevation-1 p-5 mb-5">
          <TrendChart entries={entries} accessor={e => e.waist_cm} range={range} />
          <p className="text-body-sm text-slate-400 mt-3">Waist circumference (cm)</p>
        </div>
      )}

      {tab === 'energy' && (
        <div className="bg-white rounded-md shadow-elevation-1 p-5 mb-5">
          <TrendChart entries={entries} accessor={e => e.energy_level} range={range} />
          <p className="text-body-sm text-slate-400 mt-3">Energy level (1-5 scale)</p>
        </div>
      )}

      {tab === 'doses' && (
        <div className="bg-white rounded-md shadow-elevation-1 p-5 mb-5 text-center">
          <p className="text-body-lg text-slate-400">Dose adherence tracking coming soon.</p>
        </div>
      )}

      <div className="space-y-2 mt-5">
        <h3 className="text-label text-slate-400 uppercase mb-3">History</h3>
        {entries.slice(0, 20).map(entry => (
          <div key={entry.id} className="bg-white rounded-md p-4 shadow-elevation-1 flex justify-between items-center">
            <p className="text-body-md text-slate-700">
              {new Date(entry.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
            <div className="flex gap-4 text-body-sm text-slate-500">
              {getWeight(entry) !== null && <span>{getWeight(entry)} {weightUnit}</span>}
              {entry.waist_cm && <span>{entry.waist_cm} cm</span>}
              {entry.energy_level && (
                <span className={`px-2 py-0.5 rounded-pill ${
                  entry.energy_level >= 4 ? 'bg-green-100 text-green-600' :
                  entry.energy_level <= 2 ? 'bg-amber-100 text-amber-500' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  Energy {entry.energy_level}/5
                </span>
              )}
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-body-lg text-slate-400">No progress entries yet. Tap the button above to start tracking.</p>
          </div>
        )}
      </div>
    </div>
  )
}
