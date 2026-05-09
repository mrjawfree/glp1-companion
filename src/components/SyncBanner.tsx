import { useState, useEffect, useCallback, useRef } from 'react'
import { isOnline, onOnlineChange, getPendingCount, flushPendingDoses } from '../lib/offlineSync'

export default function SyncBanner() {
  const [online, setOnline] = useState(isOnline)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const syncingRef = useRef(false)

  useEffect(() => {
    return onOnlineChange(setOnline)
  }, [])

  useEffect(() => {
    getPendingCount().then(setPendingCount).catch(() => {})
  }, [online])

  const handleSync = useCallback(async () => {
    if (syncingRef.current) return
    syncingRef.current = true
    setSyncing(true)
    try {
      const { synced } = await flushPendingDoses()
      setPendingCount(prev => Math.max(0, prev - synced))
    } finally {
      setSyncing(false)
      syncingRef.current = false
    }
  }, [])

  useEffect(() => {
    if (online && pendingCount > 0) handleSync()
  }, [online, pendingCount, handleSync])

  if (online && pendingCount === 0) return null

  return (
    <div className={`px-4 py-2.5 text-body-sm flex items-center justify-between animate-slideUp motion-reduce:animate-none ${
      online ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
    }`}>
      {!online && (
        <span>You're offline — doses will sync when reconnected</span>
      )}
      {online && pendingCount > 0 && (
        <>
          <span>{syncing ? 'Syncing...' : `${pendingCount} dose${pendingCount > 1 ? 's' : ''} pending`}</span>
          {!syncing && (
            <button onClick={handleSync} className="text-label font-medium underline">
              Sync now
            </button>
          )}
        </>
      )}
    </div>
  )
}
