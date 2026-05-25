const CACHE_NAME = 'acs-hybrid-v1';
const ASSETS = [
  './', './index.html', './awareness-v5.html', './css/style.css',
  './js/cards-db.js', './js/local-analyzer.js', './js/ai-client.js', './js/app.js',
  './manifest.json', './assets/icon.svg'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.pathname.includes('/api/analyze')) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
