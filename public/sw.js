// Minimal, conservative service worker for PWA installability.
// Strategy: cache-first for immutable static assets only. Navigations and API
// calls always go to the network so we never serve stale authenticated pages.

const CACHE = "dylm-static-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/icon.svg"])));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Only cache build-immutable static assets + the app icon.
  const isStatic =
    url.pathname.startsWith("/_next/static/") || url.pathname === "/icon.svg";
  if (!isStatic) return; // navigations / data / API -> default network handling

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const res = await fetch(request);
      if (res.ok) cache.put(request, res.clone());
      return res;
    }),
  );
});
