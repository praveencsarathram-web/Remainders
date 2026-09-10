// Reminders App — offline shell caching.
// Lets the page itself load even with no internet connection, once it has
// been visited at least once while online. Data sync with Drive still needs
// a real connection — this only covers the app loading at all.

const CACHE_NAME = 'reminders-app-shell-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([
      self.registration.scope,
      'manifest.json',
      'icon-192.png',
      'icon-512.png'
    ]).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only intercept navigations (loading the page itself). Everything else
  // (Google sign-in, Drive API, fonts) passes straight through to the
  // network as normal, since those genuinely need a live connection.
  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match(self.registration.scope))
      )
  );
});
