/*
 * Fretistry service worker — makes the installed app open instantly and work
 * offline. Pages are fetched from the network first (so updates arrive right
 * away) and fall back to the cached copy when offline. Build assets, whose
 * file names change with every release, are served from the cache.
 */
// One cache per release (the page registers "sw.js?v=<release>"); activating a new release
// deletes the older caches, so old build files don't pile up in visitors' browsers.
const CACHE = `fretistry-${new URL(self.location.href).searchParams.get("v") || "v1"}`;
const SHELL = self.registration.scope; // e.g. https://example.com/ or https://example.github.io/fretistry/

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(SHELL))
      .catch(() => undefined),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Pages: network first, cached app shell when offline (any ?root=…&scale=… link works offline).
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(SHELL, copy));
          }
          return response;
        } catch {
          return (await caches.match(SHELL)) || (await caches.match(request)) || Response.error();
        }
      })(),
    );
    return;
  }

  // Versioned build files never change: cache first.
  if (url.pathname.includes("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Everything else (icons, manifest…): serve from cache, refresh in the background.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => hit);
      return hit || network;
    })(),
  );
});
