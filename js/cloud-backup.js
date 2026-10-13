// ══════════════════════════════════════════════════════════════════════
// cloud-backup.js — every save kept in the cloud as well as the browser
// ══════════════════════════════════════════════════════════════════════
//
// The saves lived only in the browser. On 2026-10-13 a Firefox update
// refreshed the profile, the move of the old profile stopped partway through
// the alphabet, and yannari.github.io was past where it stopped: ten seasons
// and the Legacy ledger. They came back only because Windows happened to have
// a restore point from the day before. Nothing about that was the user's doing,
// and nothing on the page could have warned them.
//
// So every write to dc_franchise_db is mirrored to the private R2 bucket behind
// the dc-studio Worker (worker/worker-studio.js, savesRoute):
//
//   live/<site>/<store>/<key>.json.gz   each record, a few seconds after it is written
//   prev/…  trash/…                     the copy it replaced; a deleted season
//   snap/<site>/<day>.json.gz           once a day: localStorage and every OTHER
//                                       database (Casting Studio, episode transcripts)
//
// <site> is the page's host, so a localhost test season never lands on top of
// a real one from the published site, but either can be restored into the other.
//
// The password is the studio token (localStorage.studio_api_token), which a
// wiped browser loses too, so the panel asks for it rather than failing quietly.
// A backup that is off or failing says so on the Season menu: silence is the bug.

const API_DEFAULT = 'https://dc-studio.yannari19.workers.dev';
const TOKEN_KEY = 'studio_api_token';
const LAST_OK_KEY = 'cloud_backup_last_ok';
const SNAP_DAY_KEY = 'cloud_backup_snap_day';
const MAIN_DB = 'dc_franchise_db';
const MIRROR_STORES = ['gameState', 'franchiseLedger'];
const FLUSH_DELAY = 4000;
const RETRY_DELAY = 60000;

let _openMain = null;            // savestate's _openDB, handed in by startCloudBackup
const _remoteSha = new Map();    // remote key -> sha of what is there
const _queue = new Map();        // store\nkey -> { store, key, value } | { store, key, del }
let _timer = null;
let _flushing = false;
let _suppress = false;           // a restore writes locally without echoing back up
let _status = { state: 'idle', message: '' };

// ── small helpers ─────────────────────────────────────────────────────

const _ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

export function cloudSite() {
  const host = (typeof location !== 'undefined' && location.host) || '';
  return host.replace(/[^A-Za-z0-9._-]/g, '-') || 'file';
}

function _base() { return (_ls.get('cloud_backup_base') || API_DEFAULT).replace(/\/+$/, ''); }
function _token() { return _ls.get(TOKEN_KEY) || ''; }

function _remoteKey(store, key, site = cloudSite()) {
  return `live/${site}/${store}/${encodeURIComponent(String(key))}.json.gz`;
}

function _parseRemoteKey(rk) {
  const m = /^live\/([^/]+)\/([^/]+)\/(.+)\.json\.gz$/.exec(rk);
  if (!m) return null;
  let key;
  try { key = decodeURIComponent(m[3]); } catch { return null; }
  return { site: m[1], store: m[2], key };
}

function _req(r) {
  return new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
}

async function _sha256(bytes) {
  const d = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function _gzip(bytes) {
  const cs = new CompressionStream('gzip');
  const w = cs.writable.getWriter();
  w.write(bytes); w.close();
  return new Response(cs.readable).arrayBuffer();
}

async function _gunzip(buf) {
  return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
}

function _b64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function _unb64(s) { return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }

// The other databases are the other modules' own; whatever is in them has to
// survive JSON, so the few shapes JSON drops are written out by hand.
function _replacer(_k, v) {
  if (v instanceof ArrayBuffer) return { __cloudBytes: _b64(new Uint8Array(v)) };
  if (ArrayBuffer.isView(v)) return { __cloudBytes: _b64(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)) };
  if (v instanceof Set) return [...v];
  if (v instanceof Map) return [...v.entries()];
  return v;
}
function _reviver(_k, v) {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    if (typeof v.__cloudBytes === 'string') return _unb64(v.__cloudBytes).buffer;
    if (typeof v.__cloudBlob === 'string') return new Blob([_unb64(v.b64)], { type: v.__cloudBlob });
  }
  return v;
}
async function _blobOut(v) {
  if (typeof Blob !== 'undefined' && v instanceof Blob) {
    return { __cloudBlob: v.type || 'application/octet-stream', b64: _b64(new Uint8Array(await v.arrayBuffer())) };
  }
  return v;
}

// ── status ────────────────────────────────────────────────────────────

class CloudOff extends Error {}

function _setStatus(state, message = '') {
  _status = { state, message };
  if (state === 'ok') _ls.set(LAST_OK_KEY, String(Date.now()));
  _paintIndicator();
  _paintPanelStatus();
}

/** { state: 'idle'|'off'|'syncing'|'ok'|'error', message, lastOk } */
export function cloudBackupStatus() {
  return { ..._status, lastOk: Number(_ls.get(LAST_OK_KEY)) || null };
}

// ── the Worker ────────────────────────────────────────────────────────

async function _api(path, opts = {}) {
  const t = _token();
  if (!t) throw new CloudOff('No backup password in this browser.');
  let res;
  try {
    res = await fetch(_base() + path, { ...opts, headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + t } });
  } catch (e) {
    throw new Error('Could not reach the backup server (offline?).');
  }
  if (res.status === 401) throw Object.assign(new Error('The backup password was refused.'), { auth: true });
  if (!res.ok) {
    let msg = 'HTTP ' + res.status;
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error('Backup server: ' + msg);
  }
  return res;
}

async function _listRemote(prefix) {
  const res = await _api('/api/saves/list?prefix=' + encodeURIComponent(prefix));
  return (await res.json()).objects || [];
}

async function _putRecord(store, key, value) {
  const text = JSON.stringify(value);
  if (text === undefined) return false;
  const bytes = new TextEncoder().encode(text);
  const sha = await _sha256(bytes);
  const rk = _remoteKey(store, key);
  if (_remoteSha.get(rk) === sha) return false;
  const gz = await _gzip(bytes);
  await _api(`/api/saves/obj?key=${encodeURIComponent(rk)}&sha=${sha}&raw=${bytes.byteLength}`, {
    method: 'PUT', body: gz, headers: { 'Content-Type': 'application/octet-stream' },
  });
  _remoteSha.set(rk, sha);
  return true;
}

async function _getObject(rk) {
  const res = await _api('/api/saves/obj?key=' + encodeURIComponent(rk));
  return _gunzip(await res.arrayBuffer());
}

// ── the mirror (savestate.js calls these on every write) ─────────────

/** Queue one dc_franchise_db record for upload. */
export function cloudMirror(store, key, value) {
  if (_suppress) return;
  _queue.set(store + '\n' + key, { store, key, value });
  _schedule(FLUSH_DELAY);
}

/** Queue one deletion. The Worker moves it to trash/, except a checkpoint. */
export function cloudMirrorDelete(store, key) {
  if (_suppress) return;
  _queue.set(store + '\n' + key, { store, key, del: true });
  _schedule(FLUSH_DELAY);
}

function _schedule(ms) {
  if (typeof setTimeout === 'undefined' || typeof fetch === 'undefined') return;
  clearTimeout(_timer);
  _timer = setTimeout(_flush, ms);
}

async function _flush() {
  _timer = null;
  if (_flushing) { _schedule(2000); return; }
  if (!_token()) { _queue.clear(); _setStatus('off', 'No backup password in this browser.'); return; }
  _flushing = true;
  try {
    while (_queue.size) {
      const [id, job] = _queue.entries().next().value;
      _queue.delete(id);
      if (_status.state !== 'syncing') _setStatus('syncing');
      try {
        if (job.del) {
          const rk = _remoteKey(job.store, job.key);
          await _api('/api/saves/obj?key=' + encodeURIComponent(rk), { method: 'DELETE' });
          _remoteSha.delete(rk);
        } else {
          await _putRecord(job.store, job.key, job.value);
        }
      } catch (e) {
        if (!_queue.has(id)) _queue.set(id, job);   // a newer write of the same key wins
        throw e;
      }
    }
    _setStatus('ok');
  } catch (e) {
    _report(e);
    if (!e.auth && !(e instanceof CloudOff)) _schedule(RETRY_DELAY);
  } finally {
    _flushing = false;
  }
}

function _report(e) {
  if (e instanceof CloudOff) _setStatus('off', e.message);
  else _setStatus('error', e.message || String(e));
  console.warn('Cloud backup:', e);
}

// ── catching up: everything local that the cloud does not have ──────

async function _reconcile() {
  const objs = await _listRemote(`live/${cloudSite()}/`);
  _remoteSha.clear();
  for (const o of objs) if (o.sha) _remoteSha.set(o.key, o.sha);
  const db = await _openMain();
  let sent = 0;
  for (const store of MIRROR_STORES) {
    if (!db.objectStoreNames.contains(store)) continue;
    const keys = await _req(db.transaction(store).objectStore(store).getAllKeys());
    for (const k of keys) {
      const v = await _req(db.transaction(store).objectStore(store).get(k));
      if (v !== undefined && await _putRecord(store, k, v)) sent++;
    }
  }
  return sent;
}

// ── the daily snapshot of everything else ────────────────────────────

function _openExisting(name) {
  return new Promise(resolve => {
    const r = indexedDB.open(name);
    r.onupgradeneeded = () => { try { r.transaction.abort(); } catch {} };   // never create one
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => resolve(null);
  });
}

async function _snapshot() {
  const day = new Date().toISOString().slice(0, 10);
  const enc = new TextEncoder();
  const cs = new CompressionStream('gzip');
  const w = cs.writable.getWriter();
  const done = new Response(cs.readable).arrayBuffer();
  const line = o => w.write(enc.encode(JSON.stringify(o, _replacer) + '\n'));

  await line({ type: 'dc-cloud-snapshot', v: 1, site: cloudSite(), at: new Date().toISOString() });
  const ls = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k !== TOKEN_KEY) ls[k] = localStorage.getItem(k);   // the password stays out of the bucket
    }
  } catch {}
  await line({ ls });

  const dbs = (indexedDB.databases ? await indexedDB.databases() : []) || [];
  for (const { name } of dbs) {
    if (!name || name === MAIN_DB) continue;                  // the live mirror has that one
    const db = await _openExisting(name);
    if (!db) continue;
    try {
      const stores = [...db.objectStoreNames].map(s => {
        const os = db.transaction(s).objectStore(s);
        return {
          name: s, keyPath: os.keyPath, autoIncrement: os.autoIncrement,
          indexes: [...os.indexNames].map(i => { const ix = os.index(i); return { name: i, keyPath: ix.keyPath, unique: ix.unique, multiEntry: ix.multiEntry }; }),
        };
      });
      await line({ db: name, version: db.version, stores });
      for (const s of stores) {
        const keys = await _req(db.transaction(s.name).objectStore(s.name).getAllKeys());
        for (const k of keys) {
          const v = await _req(db.transaction(s.name).objectStore(s.name).get(k));
          await line({ r: [name, s.name, k, await _blobOut(v)] });
        }
      }
    } finally { db.close(); }
  }
  await w.close();
  const gz = await done;
  const rk = `snap/${cloudSite()}/${day}.json.gz`;
  await _api(`/api/saves/obj?key=${encodeURIComponent(rk)}`, { method: 'PUT', body: gz, headers: { 'Content-Type': 'application/octet-stream' } });
  _ls.set(SNAP_DAY_KEY, day);
}

// ── public: start, back up now ───────────────────────────────────────

/**
 * Called once from main.js. Asks the browser to keep this site's storage
 * (it then will not evict it under disk pressure), uploads whatever the cloud
 * is missing, and takes today's snapshot if there is not one yet.
 */
export function startCloudBackup({ openDb } = {}) {
  _openMain = openDb;
  try { navigator.storage?.persist?.(); } catch {}
  _paintIndicator();
  if (!_token()) { _setStatus('off', 'No backup password in this browser.'); return; }
  setTimeout(() => { cloudBackupNow({ quiet: true }); }, 8000);
}

/** Upload everything that differs, then the daily snapshot if it is due. */
export async function cloudBackupNow({ quiet = false, snapshot = false } = {}) {
  if (!_openMain) return;
  if (_flushing) return;
  _flushing = true;
  try {
    _setStatus('syncing', 'Checking what the cloud has…');
    const sent = await _reconcile();
    const today = new Date().toISOString().slice(0, 10);
    if (snapshot || _ls.get(SNAP_DAY_KEY) !== today) {
      _setStatus('syncing', 'Taking today\'s snapshot…');
      await _snapshot();
    }
    _setStatus('ok', sent ? `${sent} record${sent === 1 ? '' : 's'} uploaded.` : 'Everything was already in the cloud.');
  } catch (e) {
    _report(e);
    if (!quiet) alert('Cloud backup failed: ' + (e.message || e));
  } finally {
    _flushing = false;
    if (_queue.size) _schedule(FLUSH_DELAY);
  }
}

/** Store the password, then catch up straight away. */
export async function cloudBackupSetPassword(pw) {
  pw = String(pw || '').trim();
  if (!pw) return;
  _ls.set(TOKEN_KEY, pw);
  await cloudBackupNow({ quiet: true });
  _renderPanel();
}

// ── public: what is in the cloud, and getting it back ────────────────

/** Every site with saves in the cloud, with what each one holds. */
export async function cloudBackupInventory() {
  const objs = await _listRemote('live/');
  const sites = {};
  for (const o of objs) {
    const p = _parseRemoteKey(o.key);
    if (!p) continue;
    (sites[p.site] ||= []).push({ ...p, size: o.size, raw: o.raw, uploaded: o.uploaded });
  }
  return sites;
}

export async function cloudBackupSnapshots(site = cloudSite()) {
  return (await _listRemote(`snap/${site}/`)).sort((a, b) => b.key.localeCompare(a.key));
}

async function _putLocal(db, store, key, value) {
  await new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Bring records back into this browser. items: [{ store, key }] from one site.
 * A season save also gets its line in season_index, which is rebuilt rather
 * than copied, so restoring one season never drops the others from the list.
 */
export async function cloudBackupRestore(site, items) {
  const db = await _openMain();
  _suppress = true;
  const restoredSeasons = [];
  try {
    for (const it of items) {
      const value = JSON.parse(await _getObject(_remoteKey(it.store, it.key, site)));
      await _putLocal(db, it.store, it.key, value);
      if (it.store === 'gameState' && String(it.key).startsWith('season_') && it.key !== 'season_index') {
        restoredSeasons.push({ name: value?.name || String(it.key).slice('season_'.length), date: value?.date || '', episode: value?.episode || 0 });
      }
    }
    if (restoredSeasons.length) {
      const index = (await _req(db.transaction('gameState').objectStore('gameState').get('season_index'))) || [];
      for (const s of restoredSeasons) {
        const i = index.findIndex(e => e.name === s.name);
        if (i >= 0) index[i] = s; else index.push(s);
      }
      await _putLocal(db, 'gameState', 'season_index', index);
    }
  } finally {
    _suppress = false;
  }
  // What came down is now local, and identical to the cloud, so a catch-up
  // will not send it straight back up.
  return restoredSeasons.length;
}

/** Put a daily snapshot back: localStorage and the other databases. */
export async function cloudBackupRestoreSnapshot(rk) {
  const text = await _getObject(rk);
  const lines = text.split('\n').filter(Boolean);
  const head = JSON.parse(lines[0]);
  if (head.type !== 'dc-cloud-snapshot') throw new Error('Not a snapshot.');
  const open = {};
  try {
    for (const raw of lines.slice(1)) {
      const o = JSON.parse(raw, _reviver);
      if (o.ls) { for (const [k, v] of Object.entries(o.ls)) _ls.set(k, v); continue; }
      if (o.db) { open[o.db] = { db: await _openForRestore(o), stores: o.stores }; continue; }
      if (o.r) {
        const [dbName, storeName, key, value] = o.r;
        const entry = open[dbName];
        if (!entry?.db || !entry.db.objectStoreNames.contains(storeName)) continue;
        const inline = entry.stores.find(s => s.name === storeName)?.keyPath != null;
        await new Promise((resolve, reject) => {
          const tx = entry.db.transaction(storeName, 'readwrite');
          const os = tx.objectStore(storeName);
          if (inline) os.put(value); else os.put(value, key);
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        });
      }
    }
  } finally {
    for (const e of Object.values(open)) try { e.db?.close(); } catch {}
  }
}

// A database the snapshot has but this browser does not is created with the
// snapshot's own version and stores, so its owner opens it later without an
// upgrade that would find nothing to do.
function _openForRestore({ db: name, version, stores }) {
  return new Promise(resolve => {
    const r = indexedDB.open(name, version);
    r.onupgradeneeded = () => {
      const db = r.result;
      for (const s of stores) {
        if (db.objectStoreNames.contains(s.name)) continue;
        const os = db.createObjectStore(s.name, { keyPath: s.keyPath ?? undefined, autoIncrement: !!s.autoIncrement });
        for (const ix of s.indexes || []) os.createIndex(ix.name, ix.keyPath, { unique: ix.unique, multiEntry: ix.multiEntry });
      }
    };
    r.onsuccess = () => resolve(r.result);
    // Already at a newer version here: open it as it is.
    r.onerror = () => { _openExisting(name).then(resolve); };
  });
}

// ── the indicator on the Season menu ─────────────────────────────────

function _paintIndicator() {
  if (typeof document === 'undefined') return;
  const dot = document.getElementById('cloud-backup-dot');
  if (!dot) return;
  const { state, message } = _status;
  const shown = state === 'idle' ? (_token() ? 'syncing' : 'off') : state;
  dot.dataset.state = shown;
  const last = cloudBackupStatus().lastOk;
  dot.title = {
    ok: 'Cloud backup on' + (last ? ' — last backup ' + new Date(last).toLocaleString() : ''),
    syncing: 'Cloud backup: uploading…',
    off: 'Cloud backup is OFF — open Season › Cloud backup and enter the password',
    error: 'Cloud backup FAILED: ' + message,
  }[shown] || '';
}

// ── the panel ────────────────────────────────────────────────────────

const _esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const _mb = n => n == null ? '' : n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
const _when = d => { try { return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); } catch { return ''; } };
let _inventory = null;
let _snaps = null;
let _pickedSite = null;

function _dialog() {
  let d = document.getElementById('cloud-backup-dialog');
  if (d) return d;
  d = document.createElement('dialog');
  d.id = 'cloud-backup-dialog';
  d.className = 'cloud-backup';
  d.addEventListener('click', e => { if (e.target === d) d.close(); });
  document.body.appendChild(d);
  return d;
}

export function openCloudBackup() {
  const d = _dialog();
  _renderPanel();
  if (!d.open) d.showModal();
  if (_token()) cloudBackupLoadInventory();
}

export function closeCloudBackup() { document.getElementById('cloud-backup-dialog')?.close(); }

export async function cloudBackupLoadInventory() {
  const box = document.getElementById('cb-restore');
  if (box) box.innerHTML = '<p class="cb-note">Reading what the cloud has…</p>';
  try {
    _inventory = await cloudBackupInventory();
    _pickedSite = _pickedSite && _inventory[_pickedSite] ? _pickedSite : (_inventory[cloudSite()] ? cloudSite() : Object.keys(_inventory)[0] || null);
    _snaps = _pickedSite ? await cloudBackupSnapshots(_pickedSite) : [];
  } catch (e) {
    _inventory = null;
    if (box) box.innerHTML = `<p class="cb-error">${_esc(e.message || e)}</p>`;
    return;
  }
  _renderRestore();
}

export async function cloudBackupPickSite(site) {
  _pickedSite = site;
  try { _snaps = await cloudBackupSnapshots(site); } catch { _snaps = []; }
  _renderRestore();
}

function _paintPanelStatus() {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('cb-status');
  if (!el) return;
  const st = cloudBackupStatus();
  const label = { ok: 'On', syncing: 'Uploading…', off: 'Off', error: 'Failing', idle: _token() ? 'On' : 'Off' }[st.state];
  el.dataset.state = st.state === 'idle' ? (_token() ? 'ok' : 'off') : st.state;
  el.innerHTML = `<b>${label}</b>${st.message ? ' — ' + _esc(st.message) : ''}${st.lastOk ? `<span class="cb-note">Last successful backup: ${_esc(_when(st.lastOk))}</span>` : ''}`;
}

function _renderPanel() {
  const d = document.getElementById('cloud-backup-dialog');
  if (!d) return;
  const has = !!_token();
  d.innerHTML = `
    <div class="cb-head">
      <h2>Cloud backup</h2>
      <button class="cb-x" aria-label="Close" onclick="closeCloudBackup()">✕</button>
    </div>
    <p class="cb-note">Every season you save, the season you are playing, and your Legacy are copied to your private Cloudflare storage a few seconds after they change. Once a day a snapshot of your settings, Casting Studio and episode transcripts goes up too. A browser update or a cleared history can no longer take them.</p>
    <div id="cb-status" class="cb-status"></div>
    <form class="cb-pw" onsubmit="event.preventDefault();cloudBackupSetPassword(this.pw.value)">
      <label for="cb-pw">${has ? 'Backup password (saved in this browser)' : 'Enter your backup password to turn it on'}</label>
      <div class="cb-row">
        <input id="cb-pw" name="pw" type="password" autocomplete="current-password" placeholder="${has ? '••••••••' : 'the studio password'}">
        <button type="submit" class="btn btn-secondary btn-sm">${has ? 'Change' : 'Turn on'}</button>
      </div>
    </form>
    <div class="cb-row">
      <button class="btn btn-primary btn-sm" ${has ? '' : 'disabled'} onclick="cloudBackupNow({ snapshot: true }).then(cloudBackupLoadInventory)">Back up now</button>
    </div>
    <h3>Restore</h3>
    <div id="cb-restore">${has ? '' : '<p class="cb-note">Turn the backup on to see what is in the cloud.</p>'}</div>`;
  _paintPanelStatus();
  if (has && _inventory) _renderRestore();
}

function _renderRestore() {
  const box = document.getElementById('cb-restore');
  if (!box) return;
  const sites = Object.keys(_inventory || {});
  if (!sites.length) { box.innerHTML = '<p class="cb-note">Nothing in the cloud yet. The first backup runs a few seconds after the page opens.</p>'; return; }
  const recs = (_inventory[_pickedSite] || []);
  const seasons = recs.filter(r => r.store === 'gameState' && r.key.startsWith('season_') && r.key !== 'season_index')
    .sort((a, b) => String(b.uploaded).localeCompare(String(a.uploaded)));
  const gs = recs.find(r => r.store === 'gameState' && r.key === 'gs');
  const ledger = recs.find(r => r.store === 'franchiseLedger' && r.key === 'ledger');
  const row = (r, label) => `<label class="cb-item"><input type="checkbox" data-store="${_esc(r.store)}" data-key="${_esc(r.key)}"><span>${_esc(label)}</span><span class="cb-meta">${_esc(_when(r.uploaded))} · ${_mb(r.raw || r.size)}</span></label>`;
  box.innerHTML = `
    ${sites.length > 1 ? `<div class="cb-row"><label for="cb-site">Saves from</label><select id="cb-site" class="form-select" onchange="cloudBackupPickSite(this.value)">${sites.map(s => `<option value="${_esc(s)}"${s === _pickedSite ? ' selected' : ''}>${_esc(s)}${s === cloudSite() ? ' (this site)' : ''}</option>`).join('')}</select></div>` : ''}
    <div class="cb-list">
      ${seasons.map(r => row(r, r.key.slice('season_'.length))).join('') || '<p class="cb-note">No saved seasons.</p>'}
      ${ledger ? row(ledger, 'Legacy (franchise ledger)') : ''}
      ${gs ? row(gs, 'The season in progress') : ''}
    </div>
    <div class="cb-row">
      <button class="btn btn-secondary btn-sm" onclick="cloudBackupRestoreChecked()">Restore selected</button>
    </div>
    <h3>Daily snapshots</h3>
    <p class="cb-note">Settings, Casting Studio and episode transcripts. The last 14 days are kept.</p>
    <div class="cb-list">
      ${(_snaps || []).map(s => `<div class="cb-item"><span>${_esc(s.key.split('/').pop().replace('.json.gz', ''))}</span><span class="cb-meta">${_mb(s.size)}</span><button class="btn btn-secondary btn-sm" onclick="cloudBackupRestoreSnapshotUi('${_esc(s.key)}')">Restore</button></div>`).join('') || '<p class="cb-note">No snapshots yet.</p>'}
    </div>`;
}

export async function cloudBackupRestoreChecked() {
  const boxes = [...document.querySelectorAll('#cb-restore input[type=checkbox]:checked')];
  if (!boxes.length) { alert('Tick what you want back first.'); return; }
  const items = boxes.map(b => ({ store: b.dataset.store, key: b.dataset.key }));
  // gs and the checkpoints are one thing: restoring the season in progress
  // brings its episode checkpoints with it, and only the ones up to its episode.
  const withGs = items.some(i => i.store === 'gameState' && i.key === 'gs');
  if (withGs) {
    const recs = _inventory[_pickedSite] || [];
    let ep = Infinity;
    try { ep = Number(JSON.parse(await _getObject(_remoteKey('gameState', 'gs', _pickedSite)))?.episode) || 0; } catch {}
    for (const r of recs) {
      const m = /^cp_(\d+)$/.exec(r.key);
      if (r.store === 'gameState' && m && Number(m[1]) <= ep) items.push({ store: 'gameState', key: r.key });
    }
  }
  const replacing = withGs ? '\n\nThis REPLACES the season you are playing now.' : '';
  const ledger = items.some(i => i.store === 'franchiseLedger') ? '\n\nThis REPLACES your current Legacy.' : '';
  if (!confirm(`Restore ${boxes.length} item${boxes.length === 1 ? '' : 's'} from the cloud? A save with the same name here is overwritten.${replacing}${ledger}`)) return;
  try {
    _setStatus('syncing', 'Restoring…');
    await cloudBackupRestore(_pickedSite, items);
    _setStatus('ok', 'Restored. Reloading…');
    location.reload();
  } catch (e) {
    _report(e);
    alert('Restore failed: ' + (e.message || e));
  }
}

export async function cloudBackupRestoreSnapshotUi(rk) {
  if (!confirm('Restore this snapshot? Settings, Casting Studio and episode transcripts with the same keys are overwritten. Your saved seasons are not touched.')) return;
  try {
    _setStatus('syncing', 'Restoring snapshot…');
    await cloudBackupRestoreSnapshot(rk);
    _setStatus('ok', 'Snapshot restored. Reloading…');
    location.reload();
  } catch (e) {
    _report(e);
    alert('Restore failed: ' + (e.message || e));
  }
}
