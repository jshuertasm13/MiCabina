/* Mi Cabina: guarda la app y las plantillas en el equipo para que funcione sin internet.
   Cambia VERSION cada vez que subas una versión nueva. */
var VERSION = "micabina-v9";
var TPL = "micabina-plantillas-3";   /* cámbialo cuando cambien las plantillas */
var CORE = ["./", "index.html", "qr.js", "logo.png", "manifest.webmanifest", "apple-touch-icon.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { if (k !== VERSION && k !== TPL) return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request; if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.hostname.indexOf("imgbb") >= 0 || url.hostname.indexOf("emailjs") >= 0) return;
  var isTemplate = url.origin === location.origin && /\/(tira|una|horiz|unah)\/[^/]+\.jpg$/.test(url.pathname);
  var isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  var isPage = req.mode === "navigate" || (url.origin === location.origin && /\/(index\.html)?$/.test(url.pathname));
  if (isPage) {
    e.respondWith(fetch(req).then(function (res) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put("index.html", copy); }); return res; })
      .catch(function () { return caches.match("index.html"); }));
    return;
  }
  if (isTemplate || isFont || url.origin === location.origin) {
    var bucket = isTemplate ? TPL : VERSION;
    e.respondWith(caches.open(bucket).then(function (c) {
      return c.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) { if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone()); return res; });
      });
    }));
  }
});
