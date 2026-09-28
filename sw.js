// Service Worker: macht die App offline nutzbar.
// Strategie: zuerst Netz (damit Updates sofort ankommen), sonst Cache.
// Bei neuen Dateien VERSION erhöhen und die Datei in FILES eintragen.

const VERSION = 'rechenblitz-v7';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/main.js',
  './js/state.js',
  './js/db.js',
  './js/util.js',
  './js/profiles.js',
  './js/adaptive.js',
  './js/session.js',
  './js/parent.js',
  './js/gamify.js',
  './js/reward/memory.js',
  './js/reward/common.js',
  './js/reward/games.js',
  './js/reward/maulwurf.js',
  './js/reward/faenger.js',
  './js/reward/nachmacher.js',
  './js/reward/malen.js',
  './js/reward/jumprun.js',
  './js/avatar.js',
  './js/screens/avatar-editor.js',
  './js/screens/sammlung.js',
  './js/tasks/facts.js',
  './js/tasks/modules.js',
  './js/strategies/index.js',
  './js/strategies/kraft5.js',
  './js/strategies/zerlegen.js',
  './js/strategies/ergaenzen10.js',
  './js/strategies/verdoppeln.js',
  './js/strategies/tausch.js',
  './js/strategies/gemischt.js',
  './js/visuals/index.js',
  './js/visuals/zehnerfeld.js',
  './js/visuals/zahlenhaus.js',
  './js/visuals/blitzblick.js',
  './js/reward/spiel.js',
  './js/reward/entspannung.js',
  './js/screens/profiles.js',
  './js/screens/menu.js',
  './js/screens/summary.js',
  './js/ui/numpad.js',
  './js/ui/speech.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
