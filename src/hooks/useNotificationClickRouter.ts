import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useNotificationClickRouter() {
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK' && event.data.url) {
        const url = event.data.url as string
        if (url.startsWith('/')) {
          navigate(url)
        } else {
          try {
            const parsed = new URL(url)
            if (parsed.origin === window.location.origin) {
              navigate(parsed.pathname + parsed.search + parsed.hash)
            }
          } catch {
            // ignore malformed URLs
          }
        }
      }
    }

    navigator.serviceWorker?.addEventListener('message', handler)
    return () => navigator.serviceWorker?.removeEventListener('message', handler)
  }, [navigate])
}
