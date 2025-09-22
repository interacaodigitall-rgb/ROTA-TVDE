// sw.js
const CACHE_NAME = 'rota-tvde-cache-v2';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/icon.svg',
  '/manifest.json',
  '/index.tsx', // Assuming this is how the bundled JS is served in this environment
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore-compat.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Stale-While-Revalidate strategy
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Check if we received a valid response to cache
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          return networkResponse;
        }).catch(err => {
            // Network fetch failed, but we might have a cached response.
            // If not, the promise will reject and the browser will show its offline page.
            console.error('Network fetch failed:', err);
            if (cachedResponse) return cachedResponse;
            throw err;
        });

        // Return cached response immediately if available, and update cache in background.
        // If not in cache, wait for the network response.
        return cachedResponse || fetchPromise;
      })
  );
});