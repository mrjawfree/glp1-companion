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
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    data: {
      deeplink: data.data?.deeplink || data.url || '/',
      notificationId: data.data?.notificationId || null,
      contextId: data.data?.contextId || null,
      key: data.key || null,
    },
    actions: (data.actions || []).slice(0, 2),
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  let url = data.deeplink || '/'

  if (event.action) {
    const actionDef = (event.notification.actions || []).find(
      (a) => a.action === event.action
    )
    if (actionDef && actionDef.url) {
      url = actionDef.url
    }
  }

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
            client.postMessage({ type: 'NOTIFICATION_CLICK', url, data })
            return client.focus()
          }
        }
        return clients.openWindow(url)
      })
  )
})
