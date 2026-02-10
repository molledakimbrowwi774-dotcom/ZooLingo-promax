const CACHE_NAME = 'zoolingo-v13-final-check';

// Initial assets to cache immediately
const PRE_CACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  // Force this new service worker to become the active one immediately
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHE_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Take control of the page immediately
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            // Delete old caches to prevent serving broken files
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. Return cached response immediately if available (Offline First)
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Network Fetch & Cache
      return fetch(event.request).then((networkResponse) => {
        // Validation
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // 3. Cache Logic: Only cache requests from our own origin (Local files)
        if (url.origin === self.location.origin) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
             cache.put(event.request, responseToCache);
          });
        }

        return networkResponse;
      }).catch(() => {
        // Offline fallback
      });
    })
  );
});