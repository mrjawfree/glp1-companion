import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { supabase } from '../lib/supabase'

export function useCapacitorPush(userId: string | undefined) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !userId) return

    let cleanup: (() => void) | undefined

    async function setup() {
      const { PushNotifications } = await import('@capacitor/push-notifications')

      const regListener = await PushNotifications.addListener('registration', async (token) => {
        const platform = Capacitor.getPlatform() as 'ios' | 'android'
        await supabase.from('notification_subscriptions').upsert(
          {
            user_id: userId,
            endpoint: `${platform}:${token.value}`,
            p256dh: '',
            auth: '',
            platform,
            device_id: token.value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'endpoint' }
        )
      })

      const actionListener = await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification) => {
          const data = notification.notification.data
          const deeplink = data?.deeplink || '/'
          const action = notification.actionId

          logNotificationEvent(userId, data?.key, 'action', action)
          navigate(deeplink)
        }
      )

      const receivedListener = await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification) => {
          const data = notification.data
          logNotificationEvent(userId, data?.key, 'delivered')
        }
      )

      cleanup = () => {
        regListener.remove()
        actionListener.remove()
        receivedListener.remove()
      }
    }

    setup()
    return () => cleanup?.()
  }, [userId, navigate])
}

async function logNotificationEvent(
  userId: string,
  notificationKey: string | undefined,
  eventType: string,
  actionTaken?: string,
) {
  if (!notificationKey) return
  await supabase.from('notification_events').insert({
    user_id: userId,
    notification_key: notificationKey,
    event_type: eventType,
    ...(eventType === 'delivered' ? { delivered_at: new Date().toISOString() } : {}),
    ...(eventType === 'action' ? { opened_at: new Date().toISOString(), action_taken: actionTaken } : {}),
  })
}
