'use strict';

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `optifi-static-${CACHE_VERSION}`;
const DATA_CACHE = `optifi-data-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  './manifest.webmanifest',
  './client/dashboard.html',
  './client/consents.html',
  './client/index.html',
  './client/theme-styles.css',
  './banker/index.html',
  './banker/monitoring.html',
  './banker/clients.html',
  './banker/consents.html',
  './banker/products.html',
  './banker/teams.html',
  './developer.html'
];

const DEFAULT_ICON = './assets/icons/icon-192.png';
const DEFAULT_BADGE = './assets/icons/icon-96.png';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('optifi-') && key !== STATIC_CACHE && key !== DATA_CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // For API requests use network-first strategy with fallback to cache
  if (request.url.includes('/api/') || request.url.includes('/auth/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

self.addEventListener('push', event => {
  if (!event.data) {
    return;
  }

  let payload = {};

  try {
    payload = event.data.json();
  } catch (error) {
    payload = { title: 'OptiFi', body: event.data.text() };
  }

  const title = payload.title || 'OptiFi уведомление';
  const body = payload.body || 'У вас новое уведомление.';
  const icon = payload.icon || DEFAULT_ICON;
  const badge = payload.badge || DEFAULT_BADGE;
  const data = payload.data || {};
  const actions = payload.actions || [
    { action: 'open-dashboard', title: 'Открыть дашборд' }
  ];

  const options = {
    body,
    icon,
    badge,
    lang: 'ru-RU',
    dir: 'ltr',
    data,
    actions,
    vibrate: payload.vibrate || [100, 50, 100],
    requireInteraction: payload.requireInteraction || false,
    tag: payload.tag || `optifi-${Date.now()}`,
    renotify: payload.renotify || false
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || './client/dashboard.html';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
      const focusedClient = clientsArr.find(client => client.url.includes(targetUrl));

      if (focusedClient) {
        focusedClient.focus();
        focusedClient.postMessage({ type: 'NOTIFICATION_CLICKED', data: event.notification.data });
        return;
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('message', event => {
  const { type } = event.data || {};

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil(
    broadcastMessage({ type: 'PUSH_SUBSCRIPTION_EXPIRED' })
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  const cache = await caches.open(STATIC_CACHE);
  cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(DATA_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(response => {
    cache.put(request, response.clone());
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

function broadcastMessage(data) {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
    clientsArr.forEach(client => client.postMessage(data));
  });
}
