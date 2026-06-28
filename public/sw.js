// // [CHANGE 3] Zero-Data-Loss Service Worker Versioned Cache Strategy (Version kmf-v3)
const CACHE_NAME = 'kmf-v3';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/auth.js',
  './js/db.js',
  './js/supabase-config.js',
  './js/ui.js',
  './js/utils.js',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/lucide/dist/umd/lucide.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/html5-qrcode/html5-qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js'
];

// Install Event
self.addEventListener('install', (e) => {
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    self.skipWaiting();
    return;
  }
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(ASSETS).catch(err => {
        console.warn('[Service Worker] Failed to cache some assets during install:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Zero-Data-Loss PWA Cache Eviction
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network-First for APIs, Cache-First for Static Assets
self.addEventListener('fetch', (e) => {
  // Bypass service worker entirely for localhost development to avoid Vite dev server clashes
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    return;
  }

  // Only intercept GET requests
  if (e.request.method !== 'GET') {
    return;
  }

  // // [CHANGE 3] Bypass non-local and extension requests (chrome-extension, edge, firestore, etc.)
  const isLocalOrCdn = e.request.url.startsWith(self.location.origin) || 
                       e.request.url.includes('cdn') || 
                       e.request.url.includes('cdnjs');
  if (!isLocalOrCdn) {
    return;
  }

  // // [CHANGE 3] Bypass Vite local development scripts and hot reloads to prevent dev clashes
  const isViteDev = e.request.url.includes('vite') || 
                     e.request.url.includes('node_modules') || 
                     e.request.url.includes('__vite');
  if (isViteDev) {
    return;
  }

  // Determine if it is a Supabase database API or auth endpoint
  const isApiCall = e.request.url.includes('supabase.co') || 
                    e.request.url.includes('/rest/v1/') || 
                    e.request.url.includes('/auth/v1/');

  if (isApiCall) {
    // // [CHANGE 3] Network-first, cache-fallback for API requests
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(e.request);
        })
    );
  } else {
    // // [CHANGE 3] Cache-first, network-fallback for static local assets
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
          }
          return networkResponse;
        });
      })
    );
  }
});
