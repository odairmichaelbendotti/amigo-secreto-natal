const CACHE_NAME = "secret-santa-v3";

const APP_SHELL = [
  "/",
  "/manifest.json",
];

// Install — cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k.startsWith("secret-santa-") && k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Only cache static assets and full page navigations.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Next.js data, RSC payloads and HMR must always come from the server.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/") ||
    url.pathname.startsWith("/_next/webpack-hmr") ||
    request.headers.get("RSC") === "1" ||
    url.searchParams.has("_rsc")
  ) return;

  // Cache-first for static assets
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|css|js)$/)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => cache.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            // Development chunks reuse URLs; only immutable Next.js assets are safe to cache.
            if (response.ok && (
              !url.pathname.startsWith("/_next/") ||
              response.headers.get("cache-control")?.includes("immutable")
            )) {
              event.waitUntil(cache.put(request, response.clone()));
            }
            return response;
          })
      ))
    );
    return;
  }

  if (request.mode !== "navigate") return;

  // Network-first for full page navigations, with a fallback for the same page.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone())));
        }
        return response;
      })
      .catch(async (error) => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) return cached;
        throw error;
      })
  );
});
