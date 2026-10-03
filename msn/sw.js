// Service Worker para permitir instalación como App en Android y funcionamiento offline
const CACHE_NAME = 'msn-pinchi-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './minigames.js',
  './games/penguin.js',
  './games/memory.js',
  './games/runner.js',
  './games/catcher.js',
  './games/scratch.js',
  './games/wheel.js',
  './games/tictactoe.js',
  './games/puzzle.js',
  './games/simon.js',
  './games/feedpig.js',
  './games/brick.js',
  './games/hangman.js',
  './games/bubbles.js',
  './games/quiz.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CORE_ASSETS).catch(e => console.log('Precache note:', e));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  // Estrategia cache first con fallback a red
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        return cachedResponse;
      });
    })
  );
});
