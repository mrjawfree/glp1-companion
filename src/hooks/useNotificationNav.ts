import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useNotificationNav() {
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'notification_action' && event.data.deeplink) {
        navigate(event.data.deeplink)
      }
    }
    navigator.serviceWorker?.addEventListener('message', handler)
    return () => navigator.serviceWorker?.removeEventListener('message', handler)
  }, [navigate])
}
