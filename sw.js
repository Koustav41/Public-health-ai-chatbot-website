/**
 * Mediyogi Public Health AI Platform - Service Worker
 * Version: 1.0.1
 */

const CACHE_NAME = 'mediyogi-cache-v4';

// Critical static assets for offline PWA installation
const STATIC_ASSETS = [
    './',
    'index.html',
    'dashboard.html',
    'ai.html',
    'login.html',
    'profile.html',
    'style.css',
    'login.css',
    'script.js',
    'login.js',
    'manifest.webmanifest',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/White and Blue Illustrative Online Medical Center Logo.jpg'
];

// Install Event - Pre-cache core static resources & activate immediately
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Pre-caching core static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch((err) => console.error('[Service Worker] Install pre-cache error:', err))
    );
});

// Activate Event - Clean up stale cache storage & claim clients immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cache) => {
                        if (cache !== CACHE_NAME) {
                            console.log('[Service Worker] Deleting obsolete cache:', cache);
                            return caches.delete(cache);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch Event - Responsive Offline & Cache Strategy
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    const requestUrl = new URL(event.request.url);

    // HTML Navigation handling (Network first, falling back to cache)
    if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    return caches.match(event.request).then((cachedResponse) => {
                        if (cachedResponse) return cachedResponse;
                        return caches.match('index.html') || caches.match('./index.html');
                    });
                })
        );
        return;
    }

    // Static Assets (Cache first, falling back to network)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Background revalidation
                fetch(event.request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200 && requestUrl.origin === location.origin) {
                            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
                        }
                    })
                    .catch(() => {/* Ignore background network errors */ });

                return cachedResponse;
            }

            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                return networkResponse;
            }).catch((err) => {
                console.warn('[Service Worker] Asset fetch failed:', event.request.url, err);
            });
        })
    );
});
