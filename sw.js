// sw.js — the smart cache: one complete copy of the site per deploy.
//
// The user, 2026-10-13: "why does it take so much time to reload sometimes,
// sometimes i have to refresh after shift ctrl R". Measured that day: a fresh
// load of simulator.html is 1,399 requests, 1,338 of them separate script
// files, 14 MB, eight seconds. And GitHub Pages sends max-age=600, so for ten
// minutes after a push the browser reuses whichever files it already had and
// fetches the rest new -- old and new modules mixed in one page, which is the
// breakage only a hard refresh cleared.
//
// So: every file in a Pages deploy carries the deploy's own Last-Modified (to
// the second -- checked on html, js, css, json and png alike). One HEAD request
// per page load reads it. Same deploy as last time: every file comes out of
// this cache, no network at all. A new deploy: a new, empty cache, filled with
// fresh copies (cache: 'no-cache', so the 600 seconds cannot hand back an old
// one), and the old cache dropped. One deploy's files per page, never two.
//
// Only this site's own files. The Worker, R2 (cloud saves, gallery, audio),
// fonts and anything else cross-origin go straight to the network, as do range
// requests and media. Anything that goes wrong here falls back to the network,
// so a fault in this file costs speed, never the site. main.js does not
// register it on a local server (serve.py's Last-Modified is each file's own
// mtime, so a probe would read nothing), and ?nosw unregisters it anywhere.

const PREFIX = 'dc-site-';
let active = null;   // the cache name for the deploy this worker last saw

const scopePath = () => new URL(self.registration.scope).pathname;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

/** The deploy's stamp: the Last-Modified every file in it shares. */
async function deployStamp() {
  try {
    const probe = new URL('simulator.html', self.registration.scope);
    probe.searchParams.set('deploy-probe', Date.now());
    const r = await fetch(probe, { method: 'HEAD', cache: 'no-store' });
    const lm = r.ok && r.headers.get('last-modified');
    const t = lm ? Date.parse(lm) : NaN;
    return Number.isFinite(t) ? String(t) : null;
  } catch { return null; }   // offline: keep serving the deploy we have
}

async function newestCache() {
  const names = (await caches.keys()).filter(k => k.startsWith(PREFIX)).sort();
  return names[names.length - 1] || null;
}

async function useDeploy(stamp) {
  const name = PREFIX + stamp;
  if (active === name) return;
  active = name;
  await caches.open(name);
  for (const k of await caches.keys()) if (k.startsWith(PREFIX) && k !== name) await caches.delete(k);
}

function cacheable(req) {
  if (req.method !== 'GET' || req.headers.has('range')) return false;
  if (req.destination === 'audio' || req.destination === 'video') return false;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(scopePath())) return false;
  return !url.searchParams.has('deploy-probe') && !url.pathname.endsWith('/sw.js');
}

async function onNavigate(req) {
  try {
    const stamp = await deployStamp();
    if (stamp) await useDeploy(stamp);
    else if (!active) active = await newestCache();
  } catch {}
  try {
    // A page must be this deploy's page, not one the HTTP cache kept.
    const res = await fetch(req.url, { cache: 'no-cache', credentials: 'same-origin', redirect: 'manual' });
    if (res.ok && active && res.type === 'basic') (await caches.open(active)).put(req.url, res.clone()).catch(() => {});
    return res;
  } catch {
    const hit = active && await (await caches.open(active)).match(req.url);
    return hit || fetch(req);
  }
}

async function onAsset(req) {
  try {
    const name = active || (active = await newestCache());
    if (!name) return fetch(req);
    const cache = await caches.open(name);
    const hit = await cache.match(req);
    if (hit) return hit;
    const res = await fetch(req, { cache: 'no-cache' });
    if (res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch {
    return fetch(req);
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.mode === 'navigate' && req.method === 'GET' && new URL(req.url).origin === self.location.origin) {
    e.respondWith(onNavigate(req));
  } else if (cacheable(req)) {
    e.respondWith(onAsset(req));
  }
});
