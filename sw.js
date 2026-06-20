const CACHE_NAME = 'mathquest-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/reset.css',
  '/css/base.css',
  '/css/components.css',
  '/css/animations.css',
  '/css/partner.css',
  '/css/games.css',
  '/css/shop.css',
  '/js/app.js',
  '/js/router.js',
  '/js/state.js',
  '/js/utils/dom.js',
  '/js/utils/format.js',
  '/js/utils/audio.js',
  '/js/engine/credit-engine.js',
  '/js/engine/achievement.js',
  '/js/components/header.js',
  '/js/components/partner-renderer.js',
  '/js/components/progress-bar.js',
  '/js/components/modal.js',
  '/js/components/toast.js',
  '/js/components/timer.js',
  '/js/pages/landing.js',
  '/js/pages/lessons-hub.js',
  '/js/pages/lesson-viewer.js',
  '/js/pages/games-hub.js',
  '/js/pages/game-quiz.js',
  '/js/pages/game-code.js',
  '/js/pages/game-match.js',
  '/js/pages/partner.js',
  '/js/pages/shop.js',
  '/data/lessons-calculus.json',
  '/data/lessons-python.json',
  '/data/games-config.json',
  '/data/shop-items.json',
  '/data/partner-config.json',
  '/data/achievements.json',
  '/assets/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
