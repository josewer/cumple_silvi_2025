// Service Worker v38 - Indicador visible de estado P2P en Pinchi, purga de sockets zombis en 4G/5G y heartbeat 3s
const CACHE_NAME = 'msn-pinchi-v38';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './minigames.js',
  './live_chimpi.js',
  // Módulos de minijuegos MSN
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
  './games/quiz.js',
  './games/battleship.js',
  './games/connect4.js',
  './games/buzzduel.js',
  './games/whiteboard.js',
  './games/snowbattle.js',
  './games/tugofwar.js',
  './games/synctest.js',
  './games/rebus.js',
  './games/airhockey.js',
  './games/sharedwheel.js',
  // CDN externa para modo WebRTC
  'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js',
  // Recursos visuales, avatares e interfaz
  './resources/msn_logo.png',
  './resources/msn-icon-zumbido.png',
  './resources/msn-cerdito.ico',
  './resources/msn-angry.jpg',
  './resources/msn-ajustes.png',
  './resources/chispitas.webp',
  './resources/simba.webp',
  './resources/Oompa_Loompa.webp',
  './resources/pinchi.jpg',
  './resources/pinchi_1.png',
  './resources/pinchi_2.jpg',
  './resources/pinchi_3.jpg',
  './resources/chimpi.jpg',
  './resources/chimpi_1.png',
  './resources/chimpi_1.jpg',
  './resources/chimpi_2.jpg',
  './resources/chimpi_3.png',
  './resources/manolo.jpg',
  './resources/serrano.jpeg',
  './resources/principe_bel.jpg',
  './resources/dani_martinez.jpg',
  './resources/pereza.jpg',
  './resources/spice-girls.jpg',
  './resources/nick-carter.jpg',
  './resources/raul_fuentes.jpg',
  './resources/julieta-venegas.jpg',
  // Audios y efectos de sonido principales
  './resources/msn-zumbido.mp3',
  './resources/msn-sound-notification.mp3',
  // Vídeos interactivos
  './resources/msn-pig-dance.mp4',
  './resources/msn-guitarra.mp4',
  './resources/madagascar.mp4',
  // Canciones del concurso musical nostálgico
  './resources/amaral.mp3',
  './resources/avril_avigne.mp3',
  './resources/backstreet _boys.mp3',
  './resources/cascada.mp3',
  './resources/daddy_yankee.mp3',
  './resources/don_omar.mp3',
  './resources/high_school.mp3',
  './resources/juanes.mp3',
  './resources/love_hina.mp3',
  './resources/oreja.mp3',
  './resources/pajararia_transilvania.mp3',
  './resources/rihanna.mp3',
  './resources/safriduo.mp3'
];

// 1. INSTALACIÓN: Precacheo tolerante a fallos de todos los recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Descargamos cada recurso individualmente para asegurar que si uno falla
      // (por ejemplo por timeout puntual de red), todos los demás queden guardados
      await Promise.allSettled(
        CORE_ASSETS.map(async url => {
          try {
            const response = await fetch(url, { cache: 'no-cache' });
            if (response.ok || response.type === 'opaque') {
              await cache.put(url, response);
            }
          } catch (err) {
            console.warn('[SW Precache] Omitido temporalmente:', url, err);
          }
        })
      );
    })
  );
  self.skipWaiting();
});

// 2. ACTIVACIÓN: Limpiar versiones antiguas de la caché y tomar control inmediato
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('[SW] Eliminando caché obsoleta:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper para responder peticiones 'Range' (crítico para audio/video en Safari iOS)
async function returnRangeResponse(request, cachedResponse) {
  const rangeHeader = request.headers.get('range');
  if (!rangeHeader) {
    return cachedResponse;
  }

  const arrayBuffer = await cachedResponse.arrayBuffer();
  const bytes = rangeHeader.replace(/bytes=/, '').split('-');
  const total = arrayBuffer.byteLength;
  const start = parseInt(bytes[0], 10) || 0;
  const end = bytes[1] ? parseInt(bytes[1], 10) : total - 1;

  if (start >= total || end >= total) {
    return new Response('', {
      status: 416,
      headers: {
        'Content-Range': `bytes */${total}`,
        'Accept-Ranges': 'bytes'
      }
    });
  }

  const slicedBuffer = arrayBuffer.slice(start, end + 1);
  const responseHeaders = new Headers(cachedResponse.headers);
  responseHeaders.set('Content-Range', `bytes ${start}-${end}/${total}`);
  responseHeaders.set('Content-Length', slicedBuffer.byteLength.toString());
  responseHeaders.set('Accept-Ranges', 'bytes');

  return new Response(slicedBuffer, {
    status: 206,
    statusText: 'Partial Content',
    headers: responseHeaders
  });
}

// 3. FETCH: Gestión inteligente Offline & Cache-First
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignorar métodos no GET o extensiones del navegador
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // CRÍTICO: Las peticiones de señalización P2P de PeerJS NUNCA deben ser cacheadas
  if (url.hostname.includes('peerjs.com') || url.pathname.includes('/peerjs/')) {
    return;
  }

  // A) NAVEGACIÓN (Página principal / Standalone WebClip en Safari iOS)
  // Si Safari o Android abre la app o refresca la pantalla:
  if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then(c => c.put(request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Si no hay conexión o el servidor falla, servir index.html de la caché
          const cached = await caches.match('./index.html', { ignoreSearch: true }) 
                      || await caches.match('./', { ignoreSearch: true })
                      || await caches.match(request, { ignoreSearch: true });
          if (cached) return cached;
          return new Response('MSN Messenger está disponible sin conexión.', {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
    );
    return;
  }

  // B) RECURSOS CON RANGE (Audio y Vídeo en Safari iOS)
  if (request.headers.get('range')) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then(async cachedResponse => {
        if (cachedResponse) {
          return returnRangeResponse(request, cachedResponse);
        }
        try {
          return await fetch(request);
        } catch (e) {
          // Si falla red y tenemos la respuesta completa en cache sin range
          const fallback = await caches.match(request.url.split('?')[0]);
          if (fallback) return returnRangeResponse(request, fallback);
          return new Response('', { status: 404 });
        }
      })
    );
    return;
  }

  // C) RESTO DE ASSETS (Imágenes, scripts JS, estilos CSS, fuentes)
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Si no está en caché, pedir a la red y guardar dinámicamente
      return fetch(request)
        .then(networkResponse => {
          if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        })
        .catch(async () => {
          // Fallback adicional por si coincide sin query params
          const fallback = await caches.match(url.pathname, { ignoreSearch: true });
          if (fallback) return fallback;
          return new Response('', { status: 404, statusText: 'Offline asset not cached' });
        });
    })
  );
});
