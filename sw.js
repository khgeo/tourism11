// Offline support: pages and scripts are fetched fresh when online and served from cache when offline.
const CACHE = "t11-v3";
const OFFC = "t11-offline"; // lessons saved by the "📥" button (photos + student PDF); kept across updates
const CORE = ["./", "index.html", "css/style.css", "js/data.js", "js/plans.js", "js/readings.js", "js/bank.js", "js/tools.js", "js/app.js"];
const LIBS = /cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/;
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== OFFC).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  const same = url.origin === location.origin;
  if (/(^|\.)wikimedia\.org$/.test(url.host)) { // lesson photos: saved copy first, else network
    e.respondWith(caches.match(req, { ignoreVary: true }).then(hit => hit || fetch(req)));
    return;
  }
  if (!same && !LIBS.test(url.host)) return;
  if (same && /\.(pptx|pdf|docx)$/i.test(url.pathname)) { // big files: only the ones saved with "📥"
    e.respondWith(fetch(req).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || Response.error())));
    return;
  }
  if (!same) { // libraries & fonts: cache first (versioned URLs)
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok || res.type === "opaque") { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return res; })));
    return;
  }
  e.respondWith(fetch(req).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return res; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match("index.html"))));
});
