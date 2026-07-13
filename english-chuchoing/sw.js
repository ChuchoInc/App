/* English ChuchoIng — Service Worker (offline first)
   Estrategia: precache del app shell + cache-first con actualización en
   segundo plano (stale-while-revalidate) para todo lo del mismo origen. */

var CACHE = "chuchoing-v1";

var PRECACHE = [
  "./",
  "index.html",
  "manifest.json",
  "css/styles.css",
  "js/app.js",
  "data/lessons.json",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(function (cached) {
      var actualizar = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copia = res.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(req, copia);
          });
        }
        return res;
      }).catch(function () {
        // Sin red: para navegaciones devolvemos el shell cacheado.
        if (req.mode === "navigate") {
          return caches.match("index.html");
        }
        return cached;
      });

      return cached || actualizar;
    })
  );
});
