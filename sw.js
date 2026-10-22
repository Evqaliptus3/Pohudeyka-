// Офлайн-кэш. При изменении файлов увеличивай версию.
const VERSION = 'v5';
const CACHE = 'pohudeyka-' + VERSION;
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/store.js',
  './js/calc.js',
  './js/foods.js',
  './js/workouts.js',
  './js/motivation.js',
  './js/ui.js',
  './js/actions.js',
  './js/photo.js',
  './js/health.js',
  './js/views/health.js',
  './js/vendor/anthropic-sdk.js',
  './js/views/onboarding.js',
  './js/views/today.js',
  './js/views/food.js',
  './js/views/train.js',
  './js/views/hoops.js',
  './js/hoops.js',
  './js/views/weight.js',
  './js/views/profile.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

// Сначала сеть (чтобы получать обновления), при офлайне — кэш
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))),
  );
});
