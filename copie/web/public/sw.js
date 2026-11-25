// Service worker CampusSave : l'application s'ouvre même avec un réseau faible.
// - pages : réseau d'abord, sinon la dernière version gardée (index.html)
// - fichiers du site (JS, CSS, polices, icônes) : cache d'abord
// - API et paiement : jamais mis en cache (données toujours fraîches)
const VERSION = 'campussave-v1'
const COQUILLE = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(COQUILLE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api')) return

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((rep) => { caches.open(VERSION).then((c) => c.put('/index.html', rep.clone())); return rep })
        .catch(() => caches.match('/index.html')),
    )
    return
  }
  if (/\.(js|css|woff2?|png|svg|webmanifest)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((garde) => garde || fetch(req).then((rep) => {
        if (rep.ok) { const copie = rep.clone(); caches.open(VERSION).then((c) => c.put(req, copie)) }
        return rep
      })),
    )
  }
})
