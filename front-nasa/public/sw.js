/*
 * AgroField service worker: lets the app open and keep working in the field with poor or no signal.
 *  - On install it stores the app shell, the saved NASA POWER / SoilGrids files AND every built
 *    JS/CSS file (list injected at build time by vite.config.ts), so the app opens offline even
 *    after a single visit. Install fails (and is retried on the next visit) if any of them is missing.
 *  - Each deploy gets its own cache version, so an update never mixes old and new files.
 *  - NASA POWER, SoilGrids, SRTM terrain tiles, CMR and fonts: network first; when the network fails,
 *    the last answer stored on this device is served, marked with the header `x-fs-cached-on: <date>`
 *    so the app can say it is a saved copy instead of a live answer.
 *  - Map imagery tiles (opaque cross-origin images) are not stored: they would fill the device's quota.
 */
// Both replaced at build time (vite.config.ts → precacheServiceWorker). In dev the SW is not registered.
const VERSION = 'fs-dev';
const BUILD_FILES = [];
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const API = `${VERSION}-api`;
const SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/brand/agrofield-logo.svg',
  '/brand/agrofield-logo-negativo-animado.svg',
  '/data/power-sde-2011-2025.json',
  '/data/power-anatuya-2011-2025.json',
  '/data/soilgrids-anatuya-example.json',
  '/data/ecostress-anatuya-example-2026-09.json',
];
const API_HOSTS = [
  /^https:\/\/power\.larc\.nasa\.gov\//,
  /^https:\/\/rest\.isric\.org\//,
  /^https:\/\/s3\.amazonaws\.com\/elevation-tiles-prod\//,
  /^https:\/\/cmr\.earthdata\.nasa\.gov\//,
  /^https:\/\/api\.open-meteo\.com\//,
  /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
];
const API_MAX_ENTRIES = 400;
// Module scripts are requested with an Origin header and stored without one; a server that answers
// `Vary: Origin` would make them miss the cache offline. File names are hashed, so ignoring Vary is safe.
const MATCH = { ignoreVary: true };

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll([...SHELL_FILES, ...BUILD_FILES])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function networkFirstMarked(request) {
  const cache = await caches.open(API);
  try {
    const response = await fetch(request);
    if (response.ok && response.type !== 'opaque') {
      const headers = new Headers(response.headers);
      headers.set('x-fs-cached-on', new Date().toISOString().slice(0, 10));
      const body = await response.clone().blob();
      await cache.put(request, new Response(body, { status: response.status, statusText: response.statusText, headers }));
      trim(API, API_MAX_ENTRIES);
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request, MATCH);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, MATCH);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(RUNTIME)).put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request, MATCH);
  const network = fetch(request)
    .then(async (response) => {
      if (response.ok) (await caches.open(RUNTIME)).put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

async function navigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(SHELL)).put('/index.html', response.clone());
    return response;
  } catch {
    return (await caches.match('/index.html')) || (await caches.match('/')) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (request.mode === 'navigate') {
    event.respondWith(navigation(request));
    return;
  }
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/api/')) return; // backend: always live
    if (url.pathname.startsWith('/data/')) event.respondWith(staleWhileRevalidate(request));
    else event.respondWith(cacheFirst(request)); // hashed assets, icons, brand, manifest
    return;
  }
  if (API_HOSTS.some((re) => re.test(request.url))) event.respondWith(networkFirstMarked(request));
});
