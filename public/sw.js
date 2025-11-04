const CACHE_NAME = 'purple-shell-v1';
const SHELL_ASSETS = [
  '/',
  '/styles.css',
  '/js/i18n.js',
  '/js/player.js',
  '/js/nav.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null))).then(() => self.clients.claim())
  );
});

function shouldBypass(url) {
  return /(\.m3u8|\.mpd|\.ts|\.m4s|\.mp4)(\?|$)/i.test(url);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;
  if (request.method !== 'GET' || shouldBypass(url)) return; // دع المشغل يتعامل مع البث

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return resp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

