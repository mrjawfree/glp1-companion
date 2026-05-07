const CACHE_NAME = 'glp1-v1'
const STATIC_ASSETS = ['/', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  if (request.url.includes('/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) =>
          cached || fetch(request).then((response) => {
            cache.put(request, response.clone())
            return response
          })
        )
      )
    )
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    )
  }
})

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'GLP-1 Companion'
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || undefined,
    silent: data.silent || false,
    requireInteraction: data.requireInteraction || false,
    data: {
      deeplink: data.data?.deeplink || '/',
      notificationId: data.data?.notificationId || '',
      contextId: data.data?.contextId || '',
    },
  }

  if (data.actions && data.actions.length > 0) {
    options.actions = data.actions.slice(0, 2)
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const deeplink = event.notification.data?.deeplink || '/'
  const action = event.action

  let targetUrl = deeplink
  if (action === 'snooze_1h') {
    targetUrl = '/api/notifications/snooze?id=' + encodeURIComponent(event.notification.data?.notificationId || '')
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (new URL(client.url).origin === self.location.origin) {
          client.postMessage({
            type: 'notification_action',
            action: action || 'tap',
            deeplink: targetUrl,
            notificationId: event.notification.data?.notificationId,
          })
          return client.focus()
        }
      }
      return clients.openWindow(targetUrl)
    })
  )
})
