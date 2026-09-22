const CACHE = 'pdftk-static-v2';
const CORE = ['/', '/index.html', '/manifest.json', '/vendor/pdf-lib.min.js', '/vendor/pdf.mjs', '/vendor/pdf.worker.mjs', '/vendor/jszip.min.js', '/vendor/html2pdf.bundle.min.js', '/vendor/tesseract.min.js', '/icon/web-app-manifest-192x192.png', '/icon/web-app-manifest-512x512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('pdftk-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  // Cache public, same-origin static resources only. Never intercept document data or external requests.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.search) return;
  const known = CORE.includes(url.pathname) || /^\/vendor\/[a-zA-Z0-9/_.-]+$/.test(url.pathname);
  if (!known) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try { const response = await fetch(request); if(response.ok) await cache.put(request,response.clone()); return response; }
    catch { return (await cache.match(request)) || Response.error(); }
  })());
});
