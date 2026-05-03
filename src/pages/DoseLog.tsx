import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Medication, MEDICATION_INFO } from '../types'

interface DoseEntry {
  id: string
  medication: string
  dose_amount: string
  logged_at: string
  side_effects: string[] | null
  notes: string | null
}

type InjectionSite = 'left_abdomen' | 'right_abdomen' | 'left_thigh' | 'right_thigh'

const SITE_ROTATION: InjectionSite[] = ['left_abdomen', 'right_abdomen', 'left_thigh', 'right_thigh']

const INJECTION_SITES: { value: InjectionSite; label: string }[] = [
  { value: 'left_abdomen', label: 'Left abdomen' },
  { value: 'right_abdomen', label: 'Right abdomen' },
  { value: 'left_thigh', label: 'Left thigh' },
  { value: 'right_thigh', label: 'Right thigh' },
]

const SIDE_EFFECTS = [
  { key: 'nausea', label: 'Nausea', hasSeverity: true },
  { key: 'reflux', label: 'Reflux', hasSeverity: false },
  { key: 'fatigue', label: 'Fatigue', hasSeverity: false },
  { key: 'constipation', label: 'Constipation', hasSeverity: false },
  { key: 'headache', label: 'Headache', hasSeverity: false },
  { key: 'low_appetite', label: 'Low appetite', hasSeverity: false },
  { key: 'feeling_good', label: 'Feeling good', hasSeverity: false },
]

const medications: Medication[] = ['ozempic', 'wegovy', 'mounjaro', 'zepbound', 'saxenda', 'other']

function getSuggestedSite(lastSite: string | null): InjectionSite {
  if (!lastSite) return 'left_abdomen'
  const idx = SITE_ROTATION.indexOf(lastSite as InjectionSite)
  if (idx === -1) return 'left_abdomen'
  return SITE_ROTATION[(idx + 1) % SITE_ROTATION.length]
}

export default function DoseLog() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [doses, setDoses] = useState<DoseEntry[]>([])
  const [view, setView] = useState<'history' | 'log' | 'checkin'>(() =>
    searchParams.get('checkin') === 'true' ? 'checkin' : searchParams.get('log') === 'true' ? 'log' : 'history'
  )
  const [medication, setMedication] = useState<Medication>('ozempic')
  const [doseAmount, setDoseAmount] = useState('')
  const [injectionSite, setInjectionSite] = useState<InjectionSite>('left_abdomen')
  const [suggestedSite, setSuggestedSite] = useState<InjectionSite>('left_abdomen')
  const [sideEffects, setSideEffects] = useState<string[]>([])
  const [energyLevel, setEnergyLevel] = useState(3)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'all' | '30' | 'year'>('all')
  const [doseDateTime, setDoseDateTime] = useState(new Date().toISOString().slice(0, 16))
  const [showDoubleLogConfirm, setShowDoubleLogConfirm] = useState(false)

  const loadDoses = useCallback(async () => {
    if (!user) return
    let query = supabase
      .from('doses')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })

    if (filter === '30') {
      const d = new Date(); d.setDate(d.getDate() - 30)
      query = query.gte('logged_at', d.toISOString())
    } else if (filter === 'year') {
      const d = new Date(); d.setFullYear(d.getFullYear() - 1)
      query = query.gte('logged_at', d.toISOString())
    } else {
      const d = new Date(); d.setDate(d.getDate() - 90)
      query = query.gte('logged_at', d.toISOString())
    }

    const { data } = await query
    if (data) setDoses(data)
  }, [user, filter])

  useEffect(() => {
    if (user) loadDoses()
  }, [user, loadDoses])

  useEffect(() => {
    if (!user) return
    supabase.from('users').select('medication, current_dose').eq('id', user.id).single().then(({ data }) => {
      if (data?.medication) setMedication(data.medication as Medication)
      if (data?.current_dose) setDoseAmount(data.current_dose)
    })
    supabase.from('doses').select('injection_site').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(1).then(({ data }) => {
      const suggested = getSuggestedSite(data?.[0]?.injection_site || null)
      setSuggestedSite(suggested)
      setInjectionSite(suggested)
    })
  }, [user])

  function openLogView() {
    setDoseDateTime(new Date().toISOString().slice(0, 16))
    setView('log')
  }

  async function handleLogDose(e: React.FormEvent) {
    e.preventDefault()
    if (!showDoubleLogConfirm && doses.length > 0) {
      const lastDoseTime = new Date(doses[0].logged_at)
      const hoursSince = (Date.now() - lastDoseTime.getTime()) / (1000 * 60 * 60)
      if (hoursSince < 1) {
        setShowDoubleLogConfirm(true)
        return
      }
    }
    setShowDoubleLogConfirm(false)
    setSaving(true)
    const loggedAt = new Date(doseDateTime).toISOString()
    const { error } = await supabase.from('doses').insert({
      user_id: user!.id,
      medication,
      dose_amount: doseAmount,
      logged_at: loggedAt,
      injection_site: injectionSite,
      side_effects: null,
      notes: notes || null,
    })
    if (!error) {
      setView('checkin')
      loadDoses()
    }
    setSaving(false)
  }

  async function handleCheckin() {
    if (doses[0] && sideEffects.length > 0) {
      const rows = sideEffects.map(symptom => ({
        user_id: user!.id,
        dose_id: doses[0].id,
        symptom,
        severity: symptom === 'nausea' ? 3 : 2,
        energy_level: energyLevel,
      }))
      await supabase.from('side_effects').insert(rows)
      loadDoses()
    }
    setSearchParams({})
    setView('history')
    setSideEffects([])
    setNotes('')
    setDoseAmount('')
  }

  const toggleSideEffect = (effect: string) => {
    setSideEffects(prev =>
      prev.includes(effect) ? prev.filter(e => e !== effect) : [...prev, effect]
    )
  }

  const isBackdated = new Date(doseDateTime).toDateString() !== new Date().toDateString()

  const groupedDoses = doses.reduce<Record<string, DoseEntry[]>>((acc, dose) => {
    const month = new Date(dose.logged_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    if (!acc[month]) acc[month] = []
    acc[month].push(dose)
    return acc
  }, {})

  if (view === 'log') {
    return (
      <div className="px-4 pt-5">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setView('history'); setShowDoubleLogConfirm(false) }} className="text-slate-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h1 className="text-display-lg text-slate-900">Log your dose</h1>
        </div>

        {showDoubleLogConfirm && (
          <div className="bg-amber-100 border border-amber-500 rounded-md p-4 mb-5">
            <p className="text-body-md text-amber-500 font-semibold mb-2">
              You logged a dose at {new Date(doses[0].logged_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}. Add another?
            </p>
            <div className="flex gap-3">
              <button onClick={(e) => { setShowDoubleLogConfirm(false); handleLogDose(e as unknown as React.FormEvent) }}
                className="px-4 py-2 bg-amber-500 text-white rounded-md text-label">Yes, log it</button>
              <button onClick={() => { setShowDoubleLogConfirm(false); setView('history') }}
                className="px-4 py-2 bg-white border border-slate-200 rounded-md text-label text-slate-700">Cancel</button>
            </div>
          </div>
        )}

        <form onSubmit={handleLogDose} className="space-y-5">
          <div>
            <label className="text-label text-slate-500 uppercase mb-2 block">Medication</label>
            <div className="flex gap-2 flex-wrap">
              {medications.map(med => (
                <button key={med} type="button" onClick={() => setMedication(med)}
                  className={`px-4 py-2 rounded-pill text-body-md transition-colors ${
                    medication === med ? 'bg-slate-700 text-white' : 'bg-white border border-slate-200 text-slate-700'
                  }`}>
                  {MEDICATION_INFO[med].brand}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-label text-slate-500 uppercase mb-2 block">Dose (mg)</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setDoseAmount(String(Math.max(0, parseFloat(doseAmount || '0') - 0.25)))}
                className="w-11 h-11 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-title-lg">−</button>
              <input type="number" step="0.25" value={doseAmount} onChange={e => setDoseAmount(e.target.value)}
                placeholder="0.00" className="flex-1 border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg text-center bg-white focus:border-slate-700 focus:outline-none" required />
              <button type="button" onClick={() => setDoseAmount(String(parseFloat(doseAmount || '0') + 0.25))}
                className="w-11 h-11 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-title-lg">+</button>
            </div>
          </div>

          <div>
            <label className="text-label text-slate-500 uppercase mb-2 block">Injection site</label>
            <div className="bg-white rounded-md border-2 border-slate-200 p-4">
              {injectionSite === suggestedSite && (
                <p className="text-body-sm text-green-600 mb-3">Suggested: rotate to {INJECTION_SITES.find(s => s.value === suggestedSite)?.label}</p>
              )}
              <svg viewBox="0 0 200 300" className="w-40 mx-auto mb-3" fill="none">
                <ellipse cx="100" cy="40" rx="20" ry="25" stroke="#C2CCD9" strokeWidth="1.5" />
                <line x1="100" y1="65" x2="100" y2="170" stroke="#C2CCD9" strokeWidth="1.5" />
                <line x1="100" y1="90" x2="60" y2="140" stroke="#C2CCD9" strokeWidth="1.5" />
                <line x1="100" y1="90" x2="140" y2="140" stroke="#C2CCD9" strokeWidth="1.5" />
                <line x1="100" y1="170" x2="75" y2="270" stroke="#C2CCD9" strokeWidth="1.5" />
                <line x1="100" y1="170" x2="125" y2="270" stroke="#C2CCD9" strokeWidth="1.5" />
                <circle cx="80" cy="140" r="14" fill={injectionSite === 'left_abdomen' ? '#4A7C5C' : '#EDF1F6'}
                  stroke={injectionSite === 'left_abdomen' ? '#4A7C5C' : '#C2CCD9'} strokeWidth="1.5" className="cursor-pointer"
                  onClick={() => setInjectionSite('left_abdomen')} />
                <circle cx="120" cy="140" r="14" fill={injectionSite === 'right_abdomen' ? '#4A7C5C' : '#EDF1F6'}
                  stroke={injectionSite === 'right_abdomen' ? '#4A7C5C' : '#C2CCD9'} strokeWidth="1.5" className="cursor-pointer"
                  onClick={() => setInjectionSite('right_abdomen')} />
                <circle cx="80" cy="220" r="12" fill={injectionSite === 'left_thigh' ? '#4A7C5C' : '#EDF1F6'}
                  stroke={injectionSite === 'left_thigh' ? '#4A7C5C' : '#C2CCD9'} strokeWidth="1.5" className="cursor-pointer"
                  onClick={() => setInjectionSite('left_thigh')} />
                <circle cx="120" cy="220" r="12" fill={injectionSite === 'right_thigh' ? '#4A7C5C' : '#EDF1F6'}
                  stroke={injectionSite === 'right_thigh' ? '#4A7C5C' : '#C2CCD9'} strokeWidth="1.5" className="cursor-pointer"
                  onClick={() => setInjectionSite('right_thigh')} />
              </svg>
              <div className="grid grid-cols-2 gap-2">
                {INJECTION_SITES.map(site => (
                  <button key={site.value} type="button" onClick={() => setInjectionSite(site.value)}
                    className={`px-3 py-2 rounded-md text-body-sm transition-colors ${
                      injectionSite === site.value ? 'bg-green-100 text-green-600 font-medium' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {site.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-label text-slate-500 uppercase mb-2 block">Date & time</label>
            <input type="datetime-local" value={doseDateTime} onChange={e => setDoseDateTime(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none" />
            {isBackdated && (
              <p className="text-body-sm text-amber-500 mt-1">Backdated · {Math.round((Date.now() - new Date(doseDateTime).getTime()) / (1000 * 60 * 60 * 24))} days ago</p>
            )}
          </div>

          <div>
            <label className="text-label text-slate-500 uppercase mb-2 block">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none" />
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider disabled:opacity-40 hover:bg-slate-900 transition-colors">
            {saving ? 'Logging...' : 'Log dose'}
          </button>
          <button type="button" onClick={() => setView('history')} className="w-full text-center text-slate-400 text-body-md py-2">
            Skip side-effect check-in
          </button>
        </form>
      </div>
    )
  }

  if (view === 'checkin') {
    return (
      <div className="px-4 pt-5">
        <h1 className="text-display-lg text-slate-900 mb-2">How are you feeling?</h1>
        <p className="text-body-lg text-slate-500 mb-6">This helps us tune meal suggestions. Skip any time.</p>

        <div className="flex flex-wrap gap-3 mb-6">
          {SIDE_EFFECTS.map(effect => (
            <button key={effect.key} onClick={() => toggleSideEffect(effect.key)}
              className={`px-4 py-3 rounded-md text-body-md transition-colors ${
                sideEffects.includes(effect.key)
                  ? effect.key === 'feeling_good' ? 'bg-green-100 text-green-600 border border-green-400' : 'bg-amber-100 text-amber-500 border border-amber-500'
                  : 'bg-white border border-slate-200 text-slate-700'
              }`}>
              {effect.label}
            </button>
          ))}
        </div>

        {sideEffects.includes('nausea') && (
          <div className="bg-warm-white-2 border border-slate-300 rounded-md p-3 mb-4">
            <p className="text-body-sm text-slate-500">
              Nausea is common, especially in the first weeks. If symptoms are severe or persistent,{' '}
              <span className="text-info">talk to your prescriber about adjusting your dose.</span>
            </p>
          </div>
        )}

        <div className="mb-6">
          <label className="text-label text-slate-500 uppercase mb-3 block">Energy level</label>
          <div className="flex items-center gap-4">
            <span className="text-body-sm text-slate-400">Drained</span>
            <input type="range" min="1" max="5" value={energyLevel} onChange={e => setEnergyLevel(parseInt(e.target.value))}
              className="flex-1 accent-slate-700" />
            <span className="text-body-sm text-slate-400">Energized</span>
          </div>
        </div>

        <button onClick={handleCheckin}
          className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider hover:bg-slate-900 transition-colors mb-3">
          Save check-in
        </button>
        <button onClick={() => { setView('history'); setSideEffects([]) }}
          className="w-full text-center text-slate-400 text-body-md py-2">
          Skip
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 pt-5">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-title-lg text-slate-900">Dose History</h1>
        <button onClick={openLogView}
          className="px-4 py-2 bg-slate-700 text-white text-label rounded-md hover:bg-slate-900 transition-colors">
          Log dose
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {[{ key: 'all' as const, label: 'Last 90 days' }, { key: '30' as const, label: 'Last 30 days' }, { key: 'year' as const, label: 'This year' }].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-pill text-body-sm transition-colors ${
              filter === f.key ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {Object.entries(groupedDoses).map(([month, entries]) => (
        <div key={month} className="mb-5">
          <h3 className="text-label text-slate-400 uppercase mb-3 sticky top-0 bg-warm-white py-1 z-10">{month}</h3>
          <div className="space-y-2">
            {entries.map(dose => (
              <div key={dose.id} className="bg-white rounded-md p-4 shadow-elevation-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-body-md font-semibold text-slate-900 capitalize">{dose.medication}</p>
                    <p className="text-body-sm text-slate-500">{dose.dose_amount}mg</p>
                  </div>
                  <p className="text-body-sm text-slate-400">
                    {new Date(dose.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                {dose.side_effects && dose.side_effects.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {dose.side_effects.slice(0, 3).map(e => (
                      <span key={e} className="text-body-sm bg-amber-100 text-amber-500 px-2 py-0.5 rounded-pill">{e}</span>
                    ))}
                    {dose.side_effects.length > 3 && (
                      <span className="text-body-sm text-slate-400">+{dose.side_effects.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {doses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-body-lg text-slate-400 mb-2">Your first logged dose will appear here.</p>
          <button onClick={openLogView} className="text-info text-body-md">Log your first dose</button>
        </div>
      )}
    </div>
  )
}
