// Service Worker — Sci-Spark Student Portal
// Stale-While-Revalidate for static, Network-First for API
const CACHE_NAME = 'scispark-static-v3';
const API_CACHE = 'scispark-api-v2';

// Static assets to pre-cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/admin.html',
  '/scores.html',
  '/scores-admin.html',
  '/css/styles.css',
  '/css/responsive-fix.css',
  '/css/science-decorations.css',
  '/js/config.js',
  '/js/api.js',
  '/js/student.js',
  '/js/admin.js',
  '/js/ambient.js',
  '/js/science-effects.js',
  '/js/cache-layer.js',
  '/js/request-queue.js',
  '/js/toast.js',
  '/manifest.json'
];

// ========================================
// INSTALL — Pre-cache static assets
// ========================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // If some assets fail (e.g. during dev), cache what we can
        return Promise.allSettled(
          STATIC_ASSETS.map(url => cache.add(url).catch(() => {}))
        );
      });
    })
  );
  self.skipWaiting();
});

// ========================================
// ACTIVATE — Clean old caches
// ========================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== API_CACHE)
          .map(k => { console.log('[SW] Deleting old cache:', k); return caches.delete(k); })
      )
    )
  );
  self.clients.claim();
});

// ========================================
// FETCH — Stale-While-Revalidate strategy
// ========================================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // API requests: Let the page handle these directly (CacheLayer handles caching)
  // DO NOT intercept — SW caching GAS redirects causes stale/corrupt responses
  if (url.hostname === 'script.google.com' || url.hostname === 'script.googleusercontent.com') {
    return;
  }

  // Google Fonts: Cache-first (they rarely change)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Static assets: Stale-while-revalidate
  event.respondWith(staleWhileRevalidate(event.request));
});

// ========================================
// STRATEGIES
// ========================================

// Network first, fall back to cache (for API)
async function networkFirstAPI(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request, { redirect: 'follow' });
    // Only cache successful JSON responses
    if (response.ok || response.type === 'opaqueredirect') {
      const clone = response.clone();
      cache.put(request, clone);
    }
    return response;
  } catch (err) {
    console.log('[SW] Network failed, using cached API:', request.url);
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ success: false, error: 'Offline', cached: false }),
      { headers: { 'Content-Type': 'application/json' } });
  }
}

// Cache first (for fonts etc.)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    return new Response('', { status: 408 });
  }
}

// Stale-while-revalidate (for static assets)
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cached || (await fetchPromise) || new Response('Offline', { status: 503 });
}
