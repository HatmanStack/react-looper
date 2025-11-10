/**
 * Service Worker for Looper PWA
 * Provides offline support and asset caching
 */

const CACHE_NAME = 'looper-v1.0.0';
const RUNTIME_CACHE = 'looper-runtime-v1.0.0';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install event');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Precaching app shell');
      return cache.addAll(PRECACHE_ASSETS.map(url => new Request(url, { credentials: 'same-origin' })));
    }).catch((error) => {
      console.error('[ServiceWorker] Precache failed:', error);
    })
  );

  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate event');

  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => !currentCaches.includes(cacheName))
          .map((cacheName) => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[ServiceWorker] Serving from cache:', event.request.url);
        return cachedResponse;
      }

      // Clone the request because it can only be used once
      return fetch(event.request.clone()).then((response) => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response because it can only be used once
        const responseToCache = response.clone();

        // Cache runtime assets
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch((error) => {
        console.error('[ServiceWorker] Fetch failed:', error);

        // Offline fallback
        return caches.match('/offline.html') || new Response('Offline - Please check your connection', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      });
    })
  );
});

// Message event - allow clients to skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
