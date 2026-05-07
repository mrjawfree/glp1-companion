import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { type DoseLogEntry } from '../types'
import { DoseLogSkeleton } from '../components/Skeleton'
import DoseLogSheet from '../components/DoseLogSheet'
import DoseHistoryList from '../components/DoseHistoryList'

export default function DoseLog() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [doses, setDoses] = useState<DoseLogEntry[]>([])
  const [filter, setFilter] = useState<'all' | '30' | 'year'>('all')
  const [sheetOpen, setSheetOpen] = useState(() => searchParams.get('log') === 'true')
  const [editEntry, setEditEntry] = useState<DoseLogEntry | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const loadDoses = useCallback(async () => {
    if (!user) return
    let query = supabase
      .from('doses')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
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
    if (data) setDoses(data as DoseLogEntry[])
  }, [user, filter])

  useEffect(() => {
    if (user) loadDoses().finally(() => setLoading(false))
  }, [user, loadDoses])

  useEffect(() => {
    if (searchParams.get('log') === 'true') {
      setSheetOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  function handleSaved() {
    loadDoses()
    showToast(editEntry ? 'Dose updated' : 'Dose logged')
    setEditEntry(null)
  }

  function handleEdit(entry: DoseLogEntry) {
    setEditEntry(entry)
    setSheetOpen(true)
  }

  async function handleDelete(entry: DoseLogEntry) {
    await supabase.from('doses').update({ deleted_at: new Date().toISOString() }).eq('id', entry.id)
    loadDoses()
  }

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  if (loading) return <DoseLogSkeleton />

  return (
    <div className="px-4 pt-5 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-title-lg text-slate-900">Dose History</h1>
        <button
          onClick={() => { setEditEntry(null); setSheetOpen(true) }}
          className="px-4 py-2 bg-green-600 text-white text-label rounded-md hover:bg-green-700 transition-colors"
        >
          Log dose
        </button>
      </div>

      <div className="flex gap-2 mb-5" role="tablist" aria-label="Filter by time range">
        {[
          { key: 'all' as const, label: 'Last 90 days' },
          { key: '30' as const, label: 'Last 30 days' },
          { key: 'year' as const, label: 'This year' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            role="tab"
            aria-selected={filter === f.key}
            className={`px-3 py-1.5 rounded-full text-body-sm transition-colors ${
              filter === f.key ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DoseHistoryList
        doses={doses}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {doses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-body-lg text-slate-400 mb-2">Your first logged dose will appear here.</p>
          <button onClick={() => { setEditEntry(null); setSheetOpen(true) }} className="text-green-600 text-body-md font-medium">
            Log your first dose
          </button>
        </div>
      )}

      <DoseLogSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditEntry(null) }}
        onSaved={handleSaved}
        editEntry={editEntry}
      />

      {toast && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-green-600 text-white rounded-md p-4 text-center text-body-md shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
