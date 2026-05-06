import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const array = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) array[i] = raw.charCodeAt(i)
  return array
}

export type PushPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported'

export function usePushNotifications(userId: string | undefined) {
  const [permissionState, setPermissionState] = useState<PushPermissionState>('prompt')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [loading, setLoading] = useState(false)

  const supported = 'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC_KEY

  useEffect(() => {
    if (!supported) {
      setPermissionState('unsupported')
      return
    }
    setPermissionState(Notification.permission as PushPermissionState)

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then(setSubscription)
    })
  }, [supported])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!supported || !userId) return false
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      setPermissionState(permission as PushPermissionState)
      if (permission !== 'granted') return false

      const registration = await navigator.serviceWorker.ready
      let sub = await registration.pushManager.getSubscription()
      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
      }
      setSubscription(sub)

      const subJson = sub.toJSON()
      await supabase.from('notification_subscriptions').upsert(
        {
          user_id: userId,
          endpoint: sub.endpoint,
          p256dh: subJson.keys?.p256dh ?? '',
          auth: subJson.keys?.auth ?? '',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      )

      await supabase
        .from('user_settings')
        .update({ notification_enabled: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)

      return true
    } finally {
      setLoading(false)
    }
  }, [supported, userId])

  const unsubscribe = useCallback(async () => {
    if (!subscription || !userId) return
    setLoading(true)
    try {
      await subscription.unsubscribe()
      await supabase
        .from('notification_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', subscription.endpoint)

      await supabase
        .from('user_settings')
        .update({ notification_enabled: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)

      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }, [subscription, userId])

  return { permissionState, subscription, supported, loading, subscribe, unsubscribe }
}
