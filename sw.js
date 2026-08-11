// Bump this whenever chirps-data.js changes (new/removed audio files) or any
// core asset changes, so clients pick up a fresh cache.
var CACHE_VERSION = "v3";
var CACHE_NAME = "chirps-cache-" + CACHE_VERSION;

importScripts("chirps-data.js"); // defines CHIRPS

var CORE_ASSETS = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "chirps-data.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-180.png"
];

var AUDIO_ASSETS = []
  .concat((CHIRPS.short || []).map(function (f) { return "chirps/short/" + f; }))
  .concat((CHIRPS.long || []).map(function (f) { return "chirps/long/" + f; }));

var ALL_ASSETS = CORE_ASSETS.concat(AUDIO_ASSETS);

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // addAll fails atomically if any single request fails, so fall back to
      // best-effort per-file caching in case one asset 404s.
      return Promise.all(
        ALL_ASSETS.map(function (url) {
          return cache.add(url).catch(function (err) {
            console.error("Failed to precache " + url, err);
          });
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        if (response && response.ok) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return response;
      }).catch(function () {
        return cached; // undefined -> browser shows its own offline error
      });
    })
  );
});
