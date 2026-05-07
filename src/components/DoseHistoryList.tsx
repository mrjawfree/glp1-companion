import { useState, useRef, useCallback } from 'react'
import type { DoseLogEntry, Medication } from '../types'
import { MEDICATION_INFO } from '../types'

interface DoseHistoryListProps {
  doses: DoseLogEntry[]
  onEdit: (entry: DoseLogEntry) => void
  onDelete: (entry: DoseLogEntry) => void
}

interface UndoState {
  entry: DoseLogEntry
  timeoutId: number
}

export default function DoseHistoryList({ doses, onEdit, onDelete }: DoseHistoryListProps) {
  const [swipedId, setSwipedId] = useState<string | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [undoEntry, setUndoEntry] = useState<UndoState | null>(null)
  const touchStartX = useRef(0)
  const touchCurrentX = useRef(0)
  const swipeRef = useRef<HTMLDivElement | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent, id: string) => {
    touchStartX.current = e.touches[0].clientX
    touchCurrentX.current = e.touches[0].clientX
    if (swipedId && swipedId !== id) setSwipedId(null)
  }, [swipedId])

  const handleTouchMove = useCallback((e: React.TouchEvent, el: HTMLDivElement | null) => {
    touchCurrentX.current = e.touches[0].clientX
    const dx = touchStartX.current - touchCurrentX.current
    if (el && dx > 0) {
      el.style.transform = `translateX(${-Math.min(dx, 140)}px)`
    }
  }, [])

  const handleTouchEnd = useCallback((id: string, el: HTMLDivElement | null) => {
    const dx = touchStartX.current - touchCurrentX.current
    if (el) {
      if (dx > 80) {
        el.style.transform = 'translateX(-140px)'
        setSwipedId(id)
      } else {
        el.style.transform = 'translateX(0)'
        setSwipedId(null)
      }
      el.style.transition = 'transform 200ms ease-out'
      setTimeout(() => { if (el) el.style.transition = '' }, 200)
    }
  }, [])

  function handleDelete(entry: DoseLogEntry) {
    setSwipedId(null)
    const timeoutId = window.setTimeout(() => {
      onDelete(entry)
      setUndoEntry(null)
    }, 10000)
    setUndoEntry({ entry, timeoutId })
  }

  function handleUndo() {
    if (undoEntry) {
      clearTimeout(undoEntry.timeoutId)
      setUndoEntry(null)
    }
  }

  const groupedDoses = doses
    .filter(d => !d.deleted_at && (!undoEntry || undoEntry.entry.id !== d.id))
    .reduce<Record<string, DoseLogEntry[]>>((acc, dose) => {
      const month = new Date(dose.logged_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      if (!acc[month]) acc[month] = []
      acc[month].push(dose)
      return acc
    }, {})

  return (
    <div>
      {undoEntry && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-slate-800 text-white rounded-md p-4 flex items-center justify-between shadow-xl animate-slideUp motion-reduce:animate-none">
          <span className="text-body-md">Dose deleted</span>
          <button onClick={handleUndo} className="text-green-400 text-label font-medium uppercase tracking-wider">
            Undo
          </button>
        </div>
      )}

      {Object.entries(groupedDoses).map(([month, entries]) => (
        <div key={month} className="mb-5">
          <h3 className="text-label text-slate-400 uppercase mb-3 sticky top-0 bg-warm-white py-1 z-10">{month}</h3>
          <div className="space-y-2">
            {entries.map(dose => (
              <div key={dose.id} className="relative overflow-hidden rounded-md">
                {/* Action buttons behind */}
                <div className="absolute inset-y-0 right-0 flex">
                  <button
                    onClick={() => { setSwipedId(null); onEdit(dose) }}
                    className="w-[70px] bg-blue-500 text-white flex items-center justify-center text-label"
                    aria-label="Edit dose"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(dose)}
                    className="w-[70px] bg-red-500 text-white flex items-center justify-center text-label"
                    aria-label="Delete dose"
                  >
                    Delete
                  </button>
                </div>

                {/* Swipeable card */}
                <div
                  ref={dose.id === swipedId ? swipeRef : undefined}
                  onTouchStart={e => handleTouchStart(e, dose.id)}
                  onTouchMove={e => handleTouchMove(e, e.currentTarget as HTMLDivElement)}
                  onTouchEnd={e => handleTouchEnd(dose.id, e.currentTarget as HTMLDivElement)}
                  className="relative bg-white p-4 shadow-elevation-1 z-10"
                  style={{ transform: swipedId === dose.id ? 'translateX(-140px)' : 'translateX(0)' }}
                  tabIndex={0}
                  role="group"
                  aria-label={`${dose.is_skip ? 'Skipped' : (MEDICATION_INFO[dose.medication as Medication]?.brand ?? dose.medication)} — ${new Date(dose.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setMenuId(menuId === dose.id ? null : dose.id)
                    } else if (e.key === 'Escape') {
                      setMenuId(null)
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-body-md font-semibold text-slate-900">
                        {dose.is_skip ? (
                          <span className="text-amber-600">Skipped</span>
                        ) : (
                          <span className="capitalize">
                            {MEDICATION_INFO[dose.medication as Medication]?.brand ?? dose.medication}
                          </span>
                        )}
                      </p>
                      {!dose.is_skip && (
                        <p className="text-body-sm text-slate-500">{dose.dose_amount}mg</p>
                      )}
                      {dose.is_skip && dose.skip_reason && (
                        <p className="text-body-sm text-slate-500 capitalize">{dose.skip_reason.replace('_', ' ')}</p>
                      )}
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-right">
                        <p className="text-body-sm text-slate-400">
                          {new Date(dose.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        {dose.injection_site && (
                          <p className="text-body-sm text-slate-400 capitalize">{dose.injection_site.replace(/_/g, ' ')}</p>
                        )}
                      </div>
                      {/* Kebab menu for keyboard/desktop users */}
                      <button
                        onClick={e => { e.stopPropagation(); setMenuId(menuId === dose.id ? null : dose.id) }}
                        className="p-1 -mr-1 text-slate-400 hover:text-slate-600 hidden sm:block"
                        aria-label="Dose actions"
                        aria-expanded={menuId === dose.id}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                          <circle cx="8" cy="3" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="13" r="1.5"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  {dose.side_effects && dose.side_effects.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {dose.side_effects.slice(0, 3).map(e => (
                        <span key={e} className="text-body-sm bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">{e}</span>
                      ))}
                      {dose.side_effects.length > 3 && (
                        <span className="text-body-sm text-slate-400">+{dose.side_effects.length - 3}</span>
                      )}
                    </div>
                  )}
                  {!dose.synced_at && (
                    <span className="inline-block mt-1 text-body-sm text-slate-400 italic">Pending sync</span>
                  )}
                  {/* Keyboard-accessible action menu */}
                  {menuId === dose.id && (
                    <div className="mt-2 flex gap-2 pt-2 border-t border-slate-100 animate-slideUp motion-reduce:animate-none">
                      <button
                        onClick={() => { setMenuId(null); onEdit(dose) }}
                        className="flex-1 py-2 rounded-md bg-slate-100 text-slate-700 text-label hover:bg-slate-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => { setMenuId(null); handleDelete(dose) }}
                        className="flex-1 py-2 rounded-md bg-red-50 text-red-600 text-label hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(groupedDoses).length === 0 && !undoEntry && (
        <div className="text-center py-12">
          <p className="text-body-lg text-slate-400 mb-2">Your first logged dose will appear here.</p>
        </div>
      )}
    </div>
  )
}
