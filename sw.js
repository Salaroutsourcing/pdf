// sw.js — PDF Toolkit Service Worker
const CACHE_NAME = 'pdftk-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// CDN assets we want available offline
const CDN_CACHE = 'pdftk-cdn-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME && k !== CDN_CACHE)
          .map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Don't intercept cross-origin API calls (none expected, but safe)
  if (url.origin !== self.location.origin && !url.hostname.includes('cdn')) return;

  // CDN assets: stale-while-revalidate
  if (url.hostname.includes('cdnjs') || url.hostname.includes('unpkg') || url.hostname.includes('jsdelivr')) {
    event.respondWith(
      caches.open(CDN_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const fetched = fetch(req).then(res => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fetched;
      })
    );
    return;
  }

  // Same-origin: network-first, fall back to cache
  event.respondWith(
    fetch(req).then(res => {
      if (res.ok && url.origin === self.location.origin) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone));
      }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
  );
});
