const CACHE_NAME = "ayaami-pwa-v28";
const APP_SHELL = [
  "./",
  "./index.html",
  "./index.html?app=v28",
  "./island-theme.css?v=28",
  "./island-data.js?v=28",
  "./island-db-bridge.js?v=28",
  "./island-app.js?v=28",
  "./icons/icon-192.png?v=28",
  "./icons/icon-512.png?v=28",
  "./icons/apple-touch-icon.png?v=28",
  "./icons/favicon-32.png?v=28",
  "./icons/favicon-16.png?v=28",
  "./js/db.js",
  "./js/repositories.js",
  "./js/storage.js",
  "./js/export-import.js",
  "./manifest.json?v=28",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html"))),
  );
});
