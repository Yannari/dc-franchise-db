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
// Every file in a Pages deploy carries the deploy's own Last-Modified (to the
// second -- checked on html, js, css, json and png alike), so one HEAD request
// per page load says which deploy is live.
//
// THE FIRST VERSION OF THIS waited for a new deploy: an empty cache, filled
// while the page loaded. Correct, and no faster than before on the load that
// mattered, because this repo deploys every few minutes (several sessions push
// to it) -- "smart cache doesnt seem to work same issue". So now a new deploy
// never costs a load: the page opens from the last COMPLETE copy, instantly
// and all of a piece; the new deploy downloads behind it into a cache of its
// own; when every file is in, the page is told ("New version ready -- reload")
// and the next load opens the new copy. Two deploys never meet in one page.
//
// Only this site's own files. The Worker, R2 (cloud saves, gallery, audio),
// fonts and anything cross-origin go straight to the network, as do range
// requests and media. Any fault here falls back to the network, so a bug in
// this file costs speed, never the site. main.js does not register it on a
// local server (serve.py's Last-Modified is each file's own mtime), and ?nosw
// unregisters it anywhere.

const PREFIX = 'dc-site-';
const DONE = '/__complete__';      // marker entry: this copy holds a whole deploy
const PARALLEL = 8;
let serving = null;                // cache name pages are being served from
const updating = new Map();        // stamp -> promise of its background download

const scopeUrl = p => new URL(p, self.registration.scope).href;
const scopePath = () => new URL(self.registration.scope).pathname;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

/** The live deploy's stamp: the Last-Modified every file in it shares. */
async function deployStamp() {
  try {
    const probe = new URL('simulator.html', self.registration.scope);
    probe.searchParams.set('deploy-probe', Date.now());
    const r = await fetch(probe, { method: 'HEAD', cache: 'no-store' });
    const lm = r.ok && r.headers.get('last-modified');
    const t = lm ? Date.parse(lm) : NaN;
    return Number.isFinite(t) ? String(t) : null;
  } catch { return null; }   // offline: keep serving the copy we have
}

/** The newest copy that holds a whole deploy, or null. */
async function newestComplete() {
  const names = (await caches.keys()).filter(k => k.startsWith(PREFIX)).sort().reverse();
  for (const n of names) if (await (await caches.open(n)).match(scopeUrl(DONE))) return n;
  return null;
}

async function markComplete(name) {
  await (await caches.open(name)).put(scopeUrl(DONE), new Response(String(Date.now())));
}

async function dropAllBut(keep) {
  for (const k of await caches.keys()) {
    if (k.startsWith(PREFIX) && k !== keep && !updating.has(k.slice(PREFIX.length))) await caches.delete(k);
  }
}

/**
 * Download a new deploy behind the open page: every file the current copy
 * holds, fresh, into the new deploy's own cache. Marked complete only when
 * all of it is in; then every open page is told.
 */
function downloadDeploy(stamp, from) {
  if (updating.has(stamp)) return updating.get(stamp);
  const job = (async () => {
    const name = PREFIX + stamp;
    const target = await caches.open(name);
    const urls = (await (await caches.open(from)).keys()).map(r => r.url).filter(u => !u.endsWith(DONE));
    let i = 0, failed = 0;
    const worker = async () => {
      while (i < urls.length) {
        const url = urls[i++];
        try {
          const res = await fetch(url, { cache: 'no-cache', credentials: 'same-origin' });
          if (res.ok && res.type === 'basic') await target.put(url, res);
          else if (res.status !== 404) failed++;     // a deleted file is not a failure
        } catch { failed++; }
      }
    };
    await Promise.all(Array.from({ length: PARALLEL }, worker));
    if (failed) { await caches.delete(name); return false; }   // try again on a later load
    await markComplete(name);
    for (const c of await self.clients.matchAll({ type: 'window' })) c.postMessage({ type: 'dc-site-update-ready' });
    return true;
  })().finally(() => updating.delete(stamp));
  updating.set(stamp, job);
  return job;
}

function cacheable(req) {
  if (req.method !== 'GET' || req.headers.has('range')) return false;
  if (req.destination === 'audio' || req.destination === 'video') return false;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(scopePath())) return false;
  return !url.searchParams.has('deploy-probe') && !url.pathname.endsWith('/sw.js');
}

async function onNavigate(e) {
  const req = e.request;
  try {
    const [stamp, complete] = await Promise.all([deployStamp(), newestComplete()]);
    const live = stamp && PREFIX + stamp;
    if (complete && (!live || complete === live)) {
      serving = complete;                                   // up to date, or offline
      e.waitUntil(dropAllBut(complete));
    } else if (complete) {
      serving = complete;                                   // open the last whole copy now,
      e.waitUntil(downloadDeploy(stamp, complete));         // and fetch the new one behind it
    } else if (live) {
      serving = live;                                       // first visit: fill as we go
      await caches.open(live);
      e.waitUntil(markComplete(live).then(() => dropAllBut(live)));
    }
    if (serving) {
      const hit = await (await caches.open(serving)).match(req.url);
      if (hit) return hit;
    }
  } catch {}
  try {
    const res = await fetch(req.url, { cache: 'no-cache', credentials: 'same-origin', redirect: 'manual' });
    if (res.ok && serving && res.type === 'basic') (await caches.open(serving)).put(req.url, res.clone()).catch(() => {});
    return res;
  } catch {
    return fetch(req);
  }
}

async function onAsset(req) {
  try {
    const name = serving || (serving = await newestComplete());
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
    e.respondWith(onNavigate(e));
  } else if (cacheable(req)) {
    e.respondWith(onAsset(req));
  }
});
