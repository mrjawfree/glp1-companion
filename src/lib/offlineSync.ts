import { supabase } from './supabase'

const DB_NAME = 'glp1_offline'
const DB_VERSION = 1
const STORE_NAME = 'pending_doses'

interface PendingDose {
  id: string
  payload: Record<string, unknown>
  operation: 'insert' | 'update' | 'delete'
  createdAt: string
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function queueOfflineDose(dose: PendingDose): Promise<void> {
  try {
    const db = await openDB()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(dose)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.error('[offlineSync] Failed to queue dose:', err)
    throw err
  }
}

export async function getPendingCount(): Promise<number> {
  try {
    const db = await openDB()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).count()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.error('[offlineSync] Failed to get pending count:', err)
    return 0
  }
}

export async function flushPendingDoses(): Promise<{ synced: number; failed: number }> {
  const db = await openDB()
  const items: PendingDose[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

  let synced = 0
  let failed = 0

  for (const item of items) {
    let error: unknown = null

    if (item.operation === 'insert') {
      const result = await supabase.from('doses').insert(item.payload)
      error = result.error
    } else if (item.operation === 'update') {
      const { id, ...rest } = item.payload as { id: string;[k: string]: unknown }
      const result = await supabase.from('doses').update(rest).eq('id', id)
      error = result.error
    } else if (item.operation === 'delete') {
      const result = await supabase.from('doses').update({ deleted_at: new Date().toISOString() }).eq('id', item.payload.id as string)
      error = result.error
    }

    if (!error) {
      synced++
      try {
        const delTx = db.transaction(STORE_NAME, 'readwrite')
        delTx.objectStore(STORE_NAME).delete(item.id)
      } catch (delErr) {
        console.error('[offlineSync] Failed to remove synced item:', delErr)
      }
    } else {
      console.warn('[offlineSync] Failed to sync dose:', item.id, error)
      failed++
    }
  }

  return { synced, failed }
}

export function isOnline(): boolean {
  return navigator.onLine
}

export function onOnlineChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
