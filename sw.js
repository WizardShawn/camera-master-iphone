// Offline shell cache. Static files only: /api, /library and build.json (the update check) are never cached (network
// only), /setup is never touched.
// Paths are relative to this file, so the same worker serves the PC ('/') and the PC-free build on a sub-path.
const CACHE = 'cameramaster-v4';
const SHELL = ['./', './manifest.webmanifest', './icons/icon-192.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api') || u.pathname.startsWith('/library') || u.pathname.startsWith('/setup') || u.pathname.endsWith('/build.json')) return;
  if (e.request.mode === 'navigate') {
    // Network first for the page so updates show up; fall back to the cached shell.
    e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put('./', c)); return r; }).catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
    if (r.ok && r.status === 200) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); }
    return r;
  })));
});
