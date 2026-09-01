/**
 * HifzTogether - Service Worker for Offline Quran Memorization & Review
 */

const CACHE_STATIC_NAME = 'hifz-static-v2';
const CACHE_QURAN_DATA = 'hifz-quran-data-v2';
const CACHE_QURAN_IMAGES = 'hifz-quran-images-v2';
const CACHE_QURAN_AUDIO = 'hifz-quran-audio-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
];

// Install Event - Precache core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW Precache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_STATIC_NAME, CACHE_QURAN_DATA, CACHE_QURAN_IMAGES, CACHE_QURAN_AUDIO];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Handle offline requests with smart caching strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Skip non-GET requests and chrome-extension / firestore sync
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // 2. Quran API Requests (api.alquran.cloud) -> Cache First with Network Fallback & Update
  if (url.hostname.includes('api.alquran.cloud')) {
    event.respondWith(
      caches.open(CACHE_QURAN_DATA).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          // Return cached response, and silently update in background if online
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
          }).catch(() => {});
          return cachedResponse;
        }

        // Not in cache, fetch from network and cache
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // If offline and not in cache, fallback
          return new Response(JSON.stringify({ code: 503, status: 'offline', message: 'Offline content not cached' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        });
      })
    );
    return;
  }

  // 3. Quran Mushaf Scanned Page Images (android.quran.com / cdn)
  if (url.hostname.includes('android.quran.com') || url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg')) {
    event.respondWith(
      caches.open(CACHE_QURAN_IMAGES).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          return cachedResponse || new Response('Image offline', { status: 404 });
        });
      })
    );
    return;
  }

  // 4. Quran Audio Recitations (cdn.islamic.network)
  if (url.hostname.includes('cdn.islamic.network') && url.pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.open(CACHE_QURAN_AUDIO).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 206)) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          return cachedResponse || new Response('Audio offline', { status: 404 });
        });
      })
    );
    return;
  }

  // 5. Google Fonts & Static CDN assets -> Stale While Revalidate
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CACHE_STATIC_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => cachedResponse);
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 6. Default App Shell Requests (HTML / JS / CSS) -> Network First with Cache Fallback
  event.respondWith(
    fetch(request).then((response) => {
      if (response && response.status === 200) {
        const responseClone = response.clone();
        caches.open(CACHE_STATIC_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      // If requesting navigation/HTML page, fallback to cached index.html
      if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        return caches.match('/index.html') || caches.match('/');
      }
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    })
  );
});

// Message Event - Handle caching batch requests from client for a specific Juz
self.addEventListener('message', async (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'CACHE_JUZ_BATCH') {
    const { urls, juzNumber } = data;
    if (!Array.isArray(urls) || urls.length === 0) return;

    try {
      const dataCache = await caches.open(CACHE_QURAN_DATA);
      let completed = 0;

      for (const url of urls) {
        try {
          const req = new Request(url, { mode: 'cors' });
          const match = await dataCache.match(req);
          if (!match) {
            const res = await fetch(req);
            if (res && res.status === 200) {
              await dataCache.put(req, res);
            }
          }
        } catch (e) {
          // ignore individual failed fetch
        }
        completed++;
        
        // Notify clients about progress
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({
            type: 'JUZ_CACHE_PROGRESS',
            juzNumber,
            progress: Math.round((completed / urls.length) * 100),
            completed,
            total: urls.length,
          });
        });
      }

      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: 'JUZ_CACHE_COMPLETE',
          juzNumber,
          success: true,
        });
      });
    } catch (err) {
      console.warn('Error batch caching Juz in SW:', err);
    }
  }
});
