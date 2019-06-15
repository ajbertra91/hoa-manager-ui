const FILES_TO_CACHE = [
    'offline.html',
];
const CACHE_NAME = "hoa-manager";
const RUNTIME = CACHE_NAME;

// the install handler takes care of precaching the resouces we always need.
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Pre-caching offline page');
                return cache.addAll(FILES_TO_CACHE);
            })
    );
});

// the activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
            })
            .then(cachesToDelete => {
                return Promise.all(cachesToDelete.map(cacheToDelete => {
                    return caches.delete(cacheToDelete);
                }));
            })
            .then(() => self.clients.claim())
    );
});

/**
 * The fetch handler serves responses for same-origin resources from a cache.
 * If no responce is found, it populates the runtime cache with the response
 * from the network before returning it to the page.
 */
self.addEventListener('fetch', event => {
    if (event.request.url.startsWith(self.location.origin)) {
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return caches.open(RUNTIME).then(cache => {
                        return fetch(event.request).then(response => {
                            // Put a copy of the response in the runtime cache
                            return cache.put(event.request, response.clone()).then(() => {
                                return response;
                            });
                        });
                    });
                })
        );
    }
});