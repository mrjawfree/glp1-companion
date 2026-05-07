import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import {
  type Medication,
  type InjectionSiteZone,
  type SkipReason,
  type DoseLogEntry,
  MEDICATION_INFO,
  DOSE_AMOUNTS,
  SKIP_REASONS,
  SITE_ROTATION_ORDER,
} from '../types'
import DoseChipSelector from './DoseChipSelector'
import InjectionSitePicker from './InjectionSitePicker'

interface DoseLogSheetProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editEntry?: DoseLogEntry | null
}

type Step = 'date' | 'medication' | 'dose' | 'site' | 'effects' | 'skip'

const SIDE_EFFECTS = [
  { key: 'nausea', label: 'Nausea' },
  { key: 'reflux', label: 'Reflux' },
  { key: 'fatigue', label: 'Fatigue' },
  { key: 'constipation', label: 'Constipation' },
  { key: 'headache', label: 'Headache' },
  { key: 'low_appetite', label: 'Low appetite' },
  { key: 'feeling_good', label: 'Feeling good' },
]

const medications: Medication[] = ['ozempic', 'wegovy', 'mounjaro', 'zepbound', 'saxenda', 'rybelsus', 'other']

export default function DoseLogSheet({ open, onClose, onSaved, editEntry }: DoseLogSheetProps) {
  const { user } = useAuth()
  const sheetRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  const [step, setStep] = useState<Step>('date')
  const [isSkip, setIsSkip] = useState(false)
  const [skipReason, setSkipReason] = useState<SkipReason | null>(null)
  const [doseDate, setDoseDate] = useState(new Date().toISOString().slice(0, 10))
  const [medication, setMedication] = useState<Medication>('ozempic')
  const [doseAmount, setDoseAmount] = useState('')
  const [injectionSite, setInjectionSite] = useState<InjectionSiteZone | null>(null)
  const [suggestedSite, setSuggestedSite] = useState<InjectionSiteZone | null>(null)
  const [lastUsedDaysAgo, setLastUsedDaysAgo] = useState<Record<InjectionSiteZone, number | null>>({
    left_upper_arm: null, right_upper_arm: null, left_abdomen: null,
    right_abdomen: null, left_thigh: null, right_thigh: null,
  })
  const [sideEffects, setSideEffects] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const isEditMode = !!editEntry

  useEffect(() => {
    if (!open) {
      setVisible(false)
      return
    }
    requestAnimationFrame(() => setVisible(true))
  }, [open])

  useEffect(() => {
    if (!open || !user) return

    if (editEntry) {
      setDoseDate(editEntry.logged_at.slice(0, 10))
      setMedication(editEntry.medication)
      setDoseAmount(editEntry.dose_amount)
      setInjectionSite(editEntry.injection_site)
      setSideEffects(editEntry.side_effects ?? [])
      setNotes(editEntry.notes ?? '')
      setIsSkip(editEntry.is_skip)
      setSkipReason(editEntry.skip_reason)
      setStep('date')
      setDirty(false)
    } else {
      setDoseDate(new Date().toISOString().slice(0, 10))
      setDoseAmount('')
      setInjectionSite(null)
      setSideEffects([])
      setNotes('')
      setIsSkip(false)
      setSkipReason(null)
      setStep('date')
      setDirty(false)

      supabase.from('users').select('medication, current_dose').eq('id', user.id).single().then(({ data }) => {
        if (data?.medication) setMedication(data.medication as Medication)
        if (data?.current_dose) setDoseAmount(data.current_dose)
      })
    }

    loadSiteHistory()
  }, [open, user, editEntry])

  const loadSiteHistory = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('doses')
      .select('injection_site, logged_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('logged_at', { ascending: false })
      .limit(20)

    if (!data || data.length === 0) {
      setSuggestedSite(SITE_ROTATION_ORDER[0])
      return
    }

    const now = Date.now()
    const daysMap: Record<InjectionSiteZone, number | null> = {
      left_upper_arm: null, right_upper_arm: null, left_abdomen: null,
      right_abdomen: null, left_thigh: null, right_thigh: null,
    }

    for (const row of data) {
      const site = row.injection_site as InjectionSiteZone
      if (site && daysMap[site] === null) {
        daysMap[site] = Math.floor((now - new Date(row.logged_at).getTime()) / (1000 * 60 * 60 * 24))
      }
    }

    setLastUsedDaysAgo(daysMap)

    const lastSite = data[0]?.injection_site as InjectionSiteZone | null
    if (lastSite) {
      const idx = SITE_ROTATION_ORDER.indexOf(lastSite)
      setSuggestedSite(SITE_ROTATION_ORDER[(idx + 1) % SITE_ROTATION_ORDER.length])
    } else {
      setSuggestedSite(SITE_ROTATION_ORDER[0])
    }
  }, [user])

  function markDirty() {
    if (!dirty) setDirty(true)
  }

  function handleClose() {
    if (dirty && !confirm('Discard unsaved changes?')) return
    setVisible(false)
    setTimeout(onClose, 200)
  }

  const maxDate = new Date().toISOString().slice(0, 10)
  const minDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const isBackdated = doseDate !== new Date().toISOString().slice(0, 10)
  const daysBack = isBackdated ? Math.round((Date.now() - new Date(doseDate).getTime()) / (1000 * 60 * 60 * 24)) : 0

  const chipAmounts = DOSE_AMOUNTS[medication as keyof typeof DOSE_AMOUNTS] ?? []

  async function handleSave() {
    if (!user) return
    setSaving(true)

    const payload = {
      user_id: user.id,
      medication,
      dose_amount: isSkip ? '0' : doseAmount,
      logged_at: new Date(doseDate + 'T12:00:00').toISOString(),
      injection_site: isSkip ? null : injectionSite,
      side_effects: sideEffects.length > 0 ? sideEffects : null,
      notes: notes || null,
      is_skip: isSkip,
      skip_reason: isSkip ? skipReason : null,
    }

    let error: unknown = null
    if (isEditMode && editEntry) {
      const result = await supabase.from('doses').update(payload).eq('id', editEntry.id)
      error = result.error
    } else {
      const result = await supabase.from('doses').insert(payload)
      error = result.error
    }

    setSaving(false)
    if (!error) {
      setDirty(false)
      setVisible(false)
      setTimeout(() => {
        onSaved()
        onClose()
      }, 200)
    }
  }

  const steps: Step[] = isSkip ? ['date', 'skip'] : ['date', 'medication', 'dose', 'site', 'effects']
  const stepIdx = steps.indexOf(step)
  const isFirst = stepIdx === 0
  const isLast = stepIdx === steps.length - 1

  function next() {
    if (isLast) {
      handleSave()
    } else {
      setStep(steps[stepIdx + 1])
    }
  }

  function back() {
    if (!isFirst) setStep(steps[stepIdx - 1])
  }

  function canAdvance(): boolean {
    switch (step) {
      case 'date': return !!doseDate
      case 'medication': return !!medication
      case 'dose': return !!doseAmount && parseFloat(doseAmount) > 0
      case 'site': return true
      case 'effects': return true
      case 'skip': return !!skipReason
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-200 ${visible ? 'opacity-40' : 'opacity-0'}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={isEditMode ? 'Edit dose' : 'Log dose'}
        className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto
          transition-transform duration-200 ease-out
          ${visible ? 'translate-y-0' : 'translate-y-full'}
          motion-reduce:transition-none
        `}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <h2 className="text-title-lg text-slate-900">
            {isEditMode ? 'Edit dose' : isSkip ? 'Skip this week' : 'Log your dose'}
          </h2>
          <button onClick={handleClose} className="text-slate-400 p-1" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 px-5 mb-5">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= stepIdx ? 'bg-green-600' : 'bg-slate-200'}`} />
          ))}
        </div>

        <div className="px-5 pb-8">
          {/* Skip toggle (on first step) */}
          {step === 'date' && !isEditMode && (
            <div className="mb-5">
              <button
                type="button"
                onClick={() => { setIsSkip(!isSkip); markDirty() }}
                className={`w-full py-3 px-4 rounded-md text-left text-body-md transition-colors ${
                  isSkip ? 'bg-amber-50 border border-amber-300 text-amber-700' : 'bg-slate-50 border border-slate-200 text-slate-600'
                }`}
              >
                {isSkip ? 'Skipping this week — tap to log instead' : 'Need to skip this week?'}
              </button>
            </div>
          )}

          {/* DATE step */}
          {step === 'date' && (
            <div>
              <label htmlFor="dose-date" className="text-label text-slate-500 uppercase mb-2 block">Date</label>
              <input
                id="dose-date"
                type="date"
                value={doseDate}
                min={minDate}
                max={maxDate}
                onChange={e => { setDoseDate(e.target.value); markDirty() }}
                className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-green-600 focus:outline-none"
              />
              {isBackdated && daysBack > 0 && (
                <p className="text-body-sm text-amber-600 mt-2">Late logging — {daysBack} day{daysBack > 1 ? 's' : ''} ago</p>
              )}
            </div>
          )}

          {/* SKIP step */}
          {step === 'skip' && (
            <div>
              <label className="text-label text-slate-500 uppercase mb-3 block">Why are you skipping?</label>
              <div className="space-y-2">
                {SKIP_REASONS.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => { setSkipReason(r.value); markDirty() }}
                    className={`w-full py-3 px-4 rounded-md text-left text-body-md transition-colors ${
                      skipReason === r.value
                        ? 'bg-amber-100 border-2 border-amber-400 text-amber-700 font-medium'
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <label htmlFor="skip-notes" className="text-label text-slate-500 uppercase mt-5 mb-2 block">Notes (optional)</label>
              <textarea
                id="skip-notes"
                value={notes}
                onChange={e => { setNotes(e.target.value); markDirty() }}
                rows={2}
                className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-green-600 focus:outline-none"
              />
            </div>
          )}

          {/* MEDICATION step */}
          {step === 'medication' && (
            <div>
              <label className="text-label text-slate-500 uppercase mb-3 block">Medication</label>
              <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Medication">
                {medications.map(med => (
                  <button
                    key={med}
                    type="button"
                    role="radio"
                    aria-checked={medication === med}
                    onClick={() => { setMedication(med); markDirty() }}
                    className={`px-4 py-2 rounded-full text-body-md transition-colors ${
                      medication === med ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    {MEDICATION_INFO[med].brand}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DOSE step */}
          {step === 'dose' && (
            <div>
              <label className="text-label text-slate-500 uppercase mb-3 block">Dose (mg)</label>
              {chipAmounts.length > 0 && (
                <div className="mb-4">
                  <DoseChipSelector
                    amounts={chipAmounts}
                    selected={doseAmount}
                    onChange={v => { setDoseAmount(v); markDirty() }}
                  />
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setDoseAmount(String(Math.max(0, parseFloat(doseAmount || '0') - 0.25))); markDirty() }}
                  aria-label="Decrease dose"
                  className="w-11 h-11 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-title-lg"
                >−</button>
                <input
                  type="number"
                  step="0.25"
                  value={doseAmount}
                  onChange={e => { setDoseAmount(e.target.value); markDirty() }}
                  placeholder="0.00"
                  className="flex-1 border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg text-center bg-white focus:border-green-600 focus:outline-none"
                  aria-label="Dose amount in milligrams"
                />
                <button
                  type="button"
                  onClick={() => { setDoseAmount(String(parseFloat(doseAmount || '0') + 0.25)); markDirty() }}
                  aria-label="Increase dose"
                  className="w-11 h-11 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-title-lg"
                >+</button>
              </div>
            </div>
          )}

          {/* SITE step */}
          {step === 'site' && (
            <div>
              <label className="text-label text-slate-500 uppercase mb-3 block">Injection site</label>
              <InjectionSitePicker
                selected={injectionSite}
                suggested={suggestedSite}
                lastUsedDaysAgo={lastUsedDaysAgo}
                onChange={z => { setInjectionSite(z); markDirty() }}
              />
            </div>
          )}

          {/* EFFECTS step */}
          {step === 'effects' && (
            <div>
              <label className="text-label text-slate-500 uppercase mb-3 block">Side effects (optional)</label>
              <div className="flex flex-wrap gap-2 mb-5">
                {SIDE_EFFECTS.map(effect => (
                  <button
                    key={effect.key}
                    type="button"
                    aria-pressed={sideEffects.includes(effect.key)}
                    onClick={() => {
                      setSideEffects(prev => prev.includes(effect.key) ? prev.filter(e => e !== effect.key) : [...prev, effect.key])
                      markDirty()
                    }}
                    className={`px-4 py-2.5 rounded-full text-body-md transition-colors ${
                      sideEffects.includes(effect.key)
                        ? effect.key === 'feeling_good' ? 'bg-green-100 text-green-700 border border-green-400' : 'bg-amber-100 text-amber-700 border border-amber-400'
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    {effect.label}
                  </button>
                ))}
              </div>

              <label htmlFor="dose-notes" className="text-label text-slate-500 uppercase mb-2 block">Notes (optional)</label>
              <textarea
                id="dose-notes"
                value={notes}
                onChange={e => { setNotes(e.target.value); markDirty() }}
                rows={2}
                className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-green-600 focus:outline-none"
              />
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            {!isFirst && (
              <button
                type="button"
                onClick={back}
                className="px-6 py-3.5 rounded-md border border-slate-200 text-label text-slate-700 uppercase tracking-wider"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              disabled={saving || !canAdvance()}
              className="flex-1 py-3.5 rounded-md text-label uppercase tracking-wider transition-colors
                bg-green-600 text-white hover:bg-green-700 disabled:opacity-40
              "
            >
              {saving ? 'Saving...' : isLast ? (isEditMode ? 'Save changes' : isSkip ? 'Log skip' : 'Log dose') : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
