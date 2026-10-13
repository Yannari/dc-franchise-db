// @vitest-environment node
// cloud-backup.test.js — the saves in the cloud (js/cloud-backup.js, and
// savesRoute in worker/worker-studio.js).
//
// 2026-10-13: a Firefox update refreshed the profile, its move of the old one
// stopped partway, and every season saved on yannari.github.io went with it.
// These run the real browser module against the real Worker, with an
// in-memory bucket and an in-memory IndexedDB, end to end.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import worker from '../worker/worker-studio.js';

function bucket() {
  const m = new Map();
  return {
    m,
    async get(k) { const o = m.get(k); return o ? { body: new Blob([o.body]).stream(), arrayBuffer: async () => o.body, size: o.body.byteLength, customMetadata: o.customMetadata || {} } : null; },
    async put(k, body, opts = {}) { m.set(k, { body: body instanceof ArrayBuffer ? body : await new Response(body).arrayBuffer(), customMetadata: opts.customMetadata, uploaded: new Date() }); },
    async delete(k) { m.delete(k); },
    async list({ prefix = '' } = {}) {
      return { objects: [...m.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key, size: m.get(key).body.byteLength, uploaded: m.get(key).uploaded, customMetadata: m.get(key).customMetadata || {} })), truncated: false };
    },
  };
}

// Just what cloud-backup.js asks of a database: getAllKeys, get, put.
function fakeDb(stores) {
  return {
    objectStoreNames: { contains: n => n in stores },
    transaction(name) {
      const tx = {};
      const req = fn => { const r = {}; queueMicrotask(() => { r.result = fn(); r.onsuccess?.(); }); return r; };
      tx.objectStore = () => ({
        getAllKeys: () => req(() => [...stores[name].keys()]),
        get: k => req(() => structuredClone(stores[name].get(k))),
        put: (v, k) => { stores[name].set(k, structuredClone(v)); queueMicrotask(() => tx.oncomplete?.()); },
      });
      return tx;
    },
  };
}

const SITE = 'yannari.github.io';
let env, cb;

beforeEach(async () => {
  vi.resetModules();
  env = { STUDIO_TOKEN: 'secret', ALLOWED_ORIGIN: '*', SAVES: bucket() };
  const store = new Map([['studio_api_token', 'secret']]);
  vi.stubGlobal('localStorage', {
    getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k), key: i => [...store.keys()][i], get length() { return store.size; },
  });
  vi.stubGlobal('location', { host: SITE, reload() {} });
  vi.stubGlobal('indexedDB', { databases: async () => [] });
  vi.stubGlobal('fetch', (url, opts) => worker.fetch(new Request(url, opts), env));
  cb = await import('../js/cloud-backup.js');
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

const live = (store, key) => `live/${SITE}/${store}/${encodeURIComponent(key)}.json.gz`;
const until = async (fn, ms = 3000) => { const t = Date.now(); while (!fn()) { if (Date.now() - t > ms) throw new Error('timed out'); await new Promise(r => setTimeout(r, 10)); } };

describe('the Worker keeps saves private', () => {
  const req = (method, path, token) => new Request('https://w.example' + path, { method, headers: token ? { Authorization: 'Bearer ' + token } : {}, body: method === 'PUT' ? new Uint8Array([1, 2, 3]) : undefined });

  it('refuses every method without the token, reads included', async () => {
    for (const [m, p] of [['GET', '/api/saves/list?prefix=live/'], ['GET', '/api/saves/obj?key=live/a/gameState/x.json.gz'], ['PUT', '/api/saves/obj?key=live/a/gameState/x.json.gz']]) {
      expect((await worker.fetch(req(m, p), env)).status, m + p).toBe(401);
    }
  });

  it('is shut, not open, when no token is configured at all', async () => {
    const res = await worker.fetch(req('GET', '/api/saves/list?prefix=live/', 'anything'), { SAVES: bucket() });
    expect(res.status).toBe(401);
  });

  it('refuses keys outside its four folders', async () => {
    for (const key of ['other/a/b.json.gz', 'live/a/../b.json.gz', 'live/a', 'live/a/b/c/d/e.json.gz', 'prev/a/gameState/x.json.gz']) {
      const res = await worker.fetch(req('PUT', '/api/saves/obj?key=' + encodeURIComponent(key), 'secret'), env);
      expect(res.status, key).toBe(400);
    }
    expect(env.SAVES.m.size).toBe(0);
  });

  it('keeps fourteen days of snapshots', async () => {
    for (let d = 1; d <= 16; d++) {
      const key = `snap/${SITE}/2026-10-${String(d).padStart(2, '0')}.json.gz`;
      await worker.fetch(req('PUT', '/api/saves/obj?key=' + encodeURIComponent(key), 'secret'), env);
    }
    const kept = [...env.SAVES.m.keys()].sort();
    expect(kept.length).toBe(14);
    expect(kept[0]).toContain('2026-10-03');
  });
});

describe('the simulator mirrors its saves', () => {
  it('uploads everything the cloud is missing, once, and a snapshot', async () => {
    const stores = {
      gameState: new Map([['season_Doom Island (Ep 3)', { name: 'Doom Island (Ep 3)', episode: 3, gs: { a: 1 } }], ['season_index', [{ name: 'Doom Island (Ep 3)' }]], ['gs', { episode: 4 }], ['cp_1', { episode: 1 }]]),
      franchiseLedger: new Map([['ledger', { v: 2, franchises: { main: { seasons: { 'bb-1': {} } } } }]]),
    };
    cb.startCloudBackup({ openDb: async () => fakeDb(stores) });
    await cb.cloudBackupNow({ quiet: true });
    const keys = [...env.SAVES.m.keys()];
    expect(keys).toContain(live('gameState', 'season_Doom Island (Ep 3)'));
    expect(keys).toContain(live('franchiseLedger', 'ledger'));
    expect(keys).toContain(live('gameState', 'cp_1'));
    expect(keys.some(k => k.startsWith(`snap/${SITE}/`))).toBe(true);
    expect(env.SAVES.m.get(live('gameState', 'gs')).customMetadata.sha).toMatch(/^[a-f0-9]{64}$/);
    expect(localStorage.getItem('cloud_backup_last_ok')).toBeTruthy();

    // Nothing changed: nothing is sent again.
    const before = env.SAVES.m.get(live('gameState', 'gs')).uploaded;
    await cb.cloudBackupNow({ quiet: true });
    expect(env.SAVES.m.get(live('gameState', 'gs')).uploaded).toBe(before);
    expect(cb.cloudBackupStatus().message).toMatch(/already/);
  });

  it('sends a write a few seconds after it happens, and keeps the copy it replaced', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    cb.cloudMirror('gameState', 'season_Rivals', { name: 'Rivals', episode: 1 });
    await vi.advanceTimersByTimeAsync(4100);
    vi.useRealTimers();
    await until(() => env.SAVES.m.has(live('gameState', 'season_Rivals')));
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    cb.cloudMirror('gameState', 'season_Rivals', { name: 'Rivals', episode: 2 });
    await vi.advanceTimersByTimeAsync(4100);
    vi.useRealTimers();
    await until(() => env.SAVES.m.has(`prev/${SITE}/gameState/season_Rivals.json.gz`));
  });

  it('a deleted season goes to the trash; a rewound checkpoint is simply gone', async () => {
    env.SAVES.m.set(live('gameState', 'season_Gone'), { body: new ArrayBuffer(4) });
    env.SAVES.m.set(live('gameState', 'cp_7'), { body: new ArrayBuffer(4) });
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    cb.cloudMirrorDelete('gameState', 'season_Gone');
    cb.cloudMirrorDelete('gameState', 'cp_7');
    await vi.advanceTimersByTimeAsync(4100);
    vi.useRealTimers();
    await until(() => !env.SAVES.m.has(live('gameState', 'cp_7')) && !env.SAVES.m.has(live('gameState', 'season_Gone')));
    expect(env.SAVES.m.has(`trash/${SITE}/gameState/season_Gone.json.gz`)).toBe(true);
    expect([...env.SAVES.m.keys()].some(k => k.includes('cp_7'))).toBe(false);
  });

  it('a test season stays in the browser (user: "test season shouldnt be ... in a cloud backup")', async () => {
    const stores = {
      gameState: new Map([['season_Real', { name: 'Real', config: { format: 'drag-race' } }], ['season_Trial', { name: 'Trial', config: { testSeason: true } }]]),
      franchiseLedger: new Map(),
    };
    cb.startCloudBackup({ openDb: async () => fakeDb(stores),
      shouldBackUp: (store, key, value) => !(String(key).startsWith('season_') && value?.config?.testSeason) });
    await cb.cloudBackupNow({ quiet: true });
    expect(env.SAVES.m.has(live('gameState', 'season_Real'))).toBe(true);
    expect(env.SAVES.m.has(live('gameState', 'season_Trial'))).toBe(false);
    cb.cloudMirror('gameState', 'season_Trial2', { name: 'Trial2', config: { testSeason: true } });
    await new Promise(r => setTimeout(r, 50));
    expect(env.SAVES.m.has(live('gameState', 'season_Trial2'))).toBe(false);
  });

  it('with no password it says it is off rather than failing quietly', async () => {
    localStorage.removeItem('studio_api_token');
    cb.startCloudBackup({ openDb: async () => fakeDb({ gameState: new Map(), franchiseLedger: new Map() }) });
    expect(cb.cloudBackupStatus().state).toBe('off');
  });
});

describe('getting them back', () => {
  it('restores a season into an empty browser and lists it in the season index', async () => {
    const original = { gameState: new Map([['season_Généra & tions', { name: 'Généra & tions', date: '2026-10-01', episode: 12, gs: { x: [1, 2] } }]]), franchiseLedger: new Map() };
    cb.startCloudBackup({ openDb: async () => fakeDb(original) });
    await cb.cloudBackupNow({ quiet: true });

    const inv = await cb.cloudBackupInventory();
    expect(inv[SITE].map(r => r.key)).toContain('season_Généra & tions');

    const wiped = { gameState: new Map([['season_index', [{ name: 'Other' }]]]), franchiseLedger: new Map() };
    cb.startCloudBackup({ openDb: async () => fakeDb(wiped) });
    const n = await cb.cloudBackupRestore(SITE, [{ store: 'gameState', key: 'season_Généra & tions' }]);
    expect(n).toBe(1);
    expect(wiped.gameState.get('season_Généra & tions').gs.x).toEqual([1, 2]);
    expect(wiped.gameState.get('season_index').map(e => e.name)).toEqual(['Other', 'Généra & tions']);
  });

  it('a snapshot brings localStorage back, without the password', async () => {
    localStorage.setItem('simulator_config', '{"name":"S15"}');
    cb.startCloudBackup({ openDb: async () => fakeDb({ gameState: new Map(), franchiseLedger: new Map() }) });
    await cb.cloudBackupNow({ quiet: true, snapshot: true });
    const [snap] = await cb.cloudBackupSnapshots();
    const body = env.SAVES.m.get(snap.key).body;
    const text = await new Response(new Blob([body]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    expect(text).toContain('simulator_config');
    expect(text).not.toContain('secret');

    localStorage.removeItem('simulator_config');
    await cb.cloudBackupRestoreSnapshot(snap.key);
    expect(localStorage.getItem('simulator_config')).toBe('{"name":"S15"}');
  });
});
