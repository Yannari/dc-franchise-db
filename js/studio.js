// Casting Studio — CREATE mode for the Cast tab.
//
// Authors franchise characters (identity, avatar, 9 stats, archetype, voice) and
// projects them into the SAME roster the Cast Builder drafts from, so a created
// character is immediately draggable in CAST mode. Rich fields (age, orientation,
// voice text, avatar data URI) live in an IndexedDB store (dc_studio); the minimal
// roster slice (name/slug/gender/sexuality/archetype/stats) is mirrored into
// localStorage['simulator_franchise_roster'] for instant availability.
//
// When serve.py is running, Save also writes the real repo files
// (franchise_roster.json + voice-profiles.json + assets/avatars/<slug>.png) via
// POST /api/character. Otherwise it stays browser-only and the sim shows the
// avatar from a data-URI fallback (window.__studioAvatars) until you commit.
//
// Self-contained: mounts a [ Build Cast | Create Character ] toggle into #tab-cast
// and owns a #studio-panel. It never edits cast-room.js / cast-ui.js internals.

const STAT_KEYS = ['physical','endurance','mental','social','strategic','loyalty','boldness','intuition','temperament'];
const STAT_ABBR = { physical:'PHY', endurance:'END', mental:'MEN', social:'SOC', strategic:'STR', loyalty:'LOY', boldness:'BLD', intuition:'INT', temperament:'TMP' };

const ARCHETYPES = ['mastermind','schemer','hothead','challenge-beast','social-butterfly','loyal-soldier','wildcard','chaos-agent','floater','underdog','hero','villain','goat','perceptive-player','showmancer'];

const ARCH_COLOR = {
  mastermind:'#e5484d', schemer:'#e5484d', villain:'#c81e5b', hothead:'#f97316',
  'challenge-beast':'#f97316', 'social-butterfly':'#06b6d4', 'loyal-soldier':'#14b8a6',
  wildcard:'#a855f7', 'chaos-agent':'#a855f7', floater:'#64748b', underdog:'#eab308',
  hero:'#f4b23e', goat:'#94a3b8', 'perceptive-player':'#8b5cf6', showmancer:'#ec4899',
};

// Heuristic stat seeds per archetype (1–10, only the 9 valid keys).
const ARCH_PRESET = {
  mastermind:        {physical:5,endurance:5,mental:8,social:8,strategic:10,loyalty:3,boldness:6,intuition:9,temperament:7},
  schemer:           {physical:6,endurance:6,mental:6,social:7,strategic:10,loyalty:2,boldness:9,intuition:7,temperament:4},
  hothead:           {physical:8,endurance:7,mental:5,social:5,strategic:5,loyalty:5,boldness:8,intuition:5,temperament:2},
  'challenge-beast': {physical:10,endurance:9,mental:4,social:6,strategic:5,loyalty:6,boldness:7,intuition:5,temperament:6},
  'social-butterfly':{physical:5,endurance:5,mental:5,social:10,strategic:4,loyalty:7,boldness:5,intuition:7,temperament:7},
  'loyal-soldier':   {physical:6,endurance:6,mental:4,social:5,strategic:3,loyalty:10,boldness:3,intuition:5,temperament:8},
  wildcard:          {physical:7,endurance:7,mental:3,social:6,strategic:3,loyalty:5,boldness:9,intuition:4,temperament:4},
  'chaos-agent':     {physical:5,endurance:5,mental:7,social:8,strategic:7,loyalty:2,boldness:9,intuition:7,temperament:3},
  floater:           {physical:4,endurance:4,mental:5,social:7,strategic:4,loyalty:5,boldness:5,intuition:6,temperament:7},
  underdog:          {physical:3,endurance:5,mental:8,social:5,strategic:6,loyalty:8,boldness:4,intuition:7,temperament:6},
  hero:              {physical:7,endurance:7,mental:5,social:8,strategic:4,loyalty:9,boldness:6,intuition:7,temperament:8},
  villain:           {physical:5,endurance:5,mental:7,social:9,strategic:9,loyalty:2,boldness:8,intuition:8,temperament:4},
  goat:              {physical:4,endurance:4,mental:3,social:5,strategic:2,loyalty:7,boldness:3,intuition:4,temperament:8},
  'perceptive-player':{physical:5,endurance:5,mental:8,social:8,strategic:6,loyalty:6,boldness:5,intuition:10,temperament:7},
  showmancer:        {physical:6,endurance:6,mental:5,social:9,strategic:4,loyalty:7,boldness:7,intuition:7,temperament:7},
};

const SEXES = ['straight','gay','bi','lesbian','queer','asexual'];
const GENDERS = [['m','♂ He/Him'],['f','♀ She/Her'],['nb','⚧ They/Them']];

// ── Studio API endpoint ─────────────────────────────────────────────────
// Local dev (serve.py) is same-origin, so the base is ''. On the deployed
// static site (GitHub Pages), point at the Cloudflare Worker that commits to
// the repo. After deploying the Worker, paste its URL into STUDIO_API_PROD
// below (or override at runtime with localStorage['studio_api_base']). The
// write token is stored in localStorage['studio_api_token'] — never in source.
const STUDIO_API_PROD = 'https://dc-studio.yannari19.workers.dev';
const _isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0', ''].includes(location.hostname);
function _lsGet(k) { try { return localStorage.getItem(k) || ''; } catch { return ''; } }
function _apiBase() {
  const override = _lsGet('studio_api_base');
  if (override) return override.replace(/\/+$/, '');
  if (_isLocalHost) return '';                    // same-origin serve.py
  return STUDIO_API_PROD.replace(/\/+$/, '');     // deployed Worker (or '' => browser-only)
}
function _apiUrl(path) { return _apiBase() + path; }
function _apiHeaders(extra) {
  const h = { ...(extra || {}) };
  const t = _lsGet('studio_api_token');
  if (t) h['Authorization'] = 'Bearer ' + t;
  return h;
}
// Can this context reach a write backend at all? (local serve.py, or a configured Worker)
function _canWrite() { return _isLocalHost || !!_apiBase(); }

// ── state ───────────────────────────────────────────────────────────────
let _draft = null;          // the character currently in the editor
let _serverUp = false;      // serve.py reachable?
let _avatarList = [];       // library slugs
let _casts = [];            // named collections {id,name,slugs[]}
let _activeCast = null;     // id of the cast currently being composed
const _statOf = k => (_draft && _draft.stats[k]) || 5;

// ── IndexedDB (rich store) ──────────────────────────────────────────────
let _dbP = null;
function _db() {
  if (_dbP) return _dbP;
  _dbP = new Promise((res, rej) => {
    const rq = indexedDB.open('dc_studio', 1);
    rq.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('characters')) db.createObjectStore('characters', { keyPath: 'slug' });
      if (!db.objectStoreNames.contains('casts')) db.createObjectStore('casts', { keyPath: 'id' });
    };
    rq.onsuccess = e => res(e.target.result);
    rq.onerror = () => rej(rq.error);
  });
  return _dbP;
}
async function _idbPut(store, val) { const db = await _db(); return new Promise((res, rej) => { const tx = db.transaction(store, 'readwrite'); tx.objectStore(store).put(val); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
async function _idbGet(store, key) { const db = await _db(); return new Promise((res) => { const tx = db.transaction(store, 'readonly'); const r = tx.objectStore(store).get(key); r.onsuccess = () => res(r.result || null); r.onerror = () => res(null); }); }
async function _idbAll(store) { const db = await _db(); return new Promise((res) => { const tx = db.transaction(store, 'readonly'); const r = tx.objectStore(store).getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => res([]); }); }
async function _idbDel(store, key) { const db = await _db(); return new Promise((res) => { const tx = db.transaction(store, 'readwrite'); tx.objectStore(store).delete(key); tx.oncomplete = res; tx.onerror = res; }); }

// ── roster helpers (via window; cast-ui owns FRANCHISE_ROSTER) ───────────
function _roster() { return (typeof window !== 'undefined' && window.FRANCHISE_ROSTER) || []; }
function _persistRoster(arr) {
  try { window.setFRANCHISE_ROSTER && window.setFRANCHISE_ROSTER(arr); } catch {}
  try { localStorage.setItem('simulator_franchise_roster', JSON.stringify(arr)); } catch {}
}

// ── small utils ─────────────────────────────────────────────────────────
const _esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
function _slugify(name) { return String(name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function _statHue(v) { v = Math.max(1, Math.min(10, v)); let h; if (v <= 5.5) h = 4 + ((v - 1) / 4.5) * 38; else h = 42 + ((v - 5.5) / 4.5) * 108; return `hsl(${h.toFixed(0)} 70% 50%)`; }
function _avatarSrc(slug) { return (window.__studioAvatars && window.__studioAvatars[slug]) || `assets/avatars/${slug}.png`; }
function _blankChar() { return { name:'', slug:'', age:'', gender:'nb', sexuality:'straight', archetype:'', origin:'', voice:'', avatarDataUri:'', stats: Object.fromEntries(STAT_KEYS.map(k => [k, 5])) }; }

// image → square-cropped, downscaled PNG data URI. `size` is a ceiling, never a
// target: upscaling a small source here would only soften it.
function _imgToAvatar(src, size = 512) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      const out = Math.min(size, s);
      const sx = (img.width - s) / 2, sy = (img.height - s) / 2;
      const c = document.createElement('canvas'); c.width = c.height = out;
      c.getContext('2d').drawImage(img, sx, sy, s, s, 0, 0, out, out);
      try { res(c.toDataURL('image/png')); } catch (e) { rej(e); }
    };
    img.onerror = rej;
    img.src = src;
  });
}

function _toast(msg, kind = 'ok') {
  let t = document.getElementById('studio-toast');
  if (!t) { t = document.createElement('div'); t.id = 'studio-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'st-toast st-' + kind + ' show';
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 3200);
}

// ═══════════════════════════════════════════════════════════════════════
// INIT + MOUNT
// ═══════════════════════════════════════════════════════════════════════
export async function studioInit() {
  if (typeof document === 'undefined') return;
  const tab = document.getElementById('tab-cast');
  if (!tab) { setTimeout(studioInit, 400); return; }        // wait for DOM
  if (tab._studioReady) return;
  tab._studioReady = true;

  _injectCSS();
  _installAvatarFallback();

  // hydrate avatar overrides from IndexedDB so studio faces render before commit
  window.__studioAvatars = window.__studioAvatars || {};
  try {
    const all = await _idbAll('characters');
    all.forEach(c => { if (c.avatarDataUri) window.__studioAvatars[c.slug] = c.avatarDataUri; });
  } catch {}
  try { _casts = await _idbAll('casts'); } catch { _casts = []; }

  // toggle bar
  const bar = document.createElement('div');
  bar.id = 'studio-bar';
  bar.innerHTML =
    `<div class="st-seg" role="group" aria-label="Cast mode">
       <button type="button" data-mode="cast" class="active">Build Cast</button>
       <button type="button" data-mode="create">＋ Create Character</button>
     </div>
     <span class="st-server" id="st-server" title="Repo write status"></span>`;
  tab.insertBefore(bar, tab.firstChild);
  bar.querySelector('[data-mode="cast"]').addEventListener('click', studioExit);
  bar.querySelector('[data-mode="create"]').addEventListener('click', studioEnter);

  // studio panel (built lazily on first enter)
  const panel = document.createElement('div');
  panel.id = 'studio-panel';
  tab.appendChild(panel);

  _pingServer();
  _restoreMode();
}

// Where you were is remembered across reloads. Refreshing while building a
// character used to drop you back on Build Cast, which is jarring when you are
// going back and forth between the two.
const _MODE_KEY = 'studio_cast_mode';
function _saveMode(create) { try { localStorage.setItem(_MODE_KEY, create ? 'create' : 'cast'); } catch {} }

function _setMode(create) {
  const tab = document.getElementById('tab-cast');
  if (!tab) return;
  tab.classList.toggle('studio-active', create);
  const bar = document.getElementById('studio-bar');
  if (bar) bar.querySelectorAll('.st-seg button').forEach(b => b.classList.toggle('active', (b.dataset.mode === 'create') === create));
}

export function studioEnter() { _saveMode(true); _setMode(true); renderStudio(); }
export function studioExit() {
  _saveMode(false);
  _setMode(false);
  try { window.renderCastRoom && window.renderCastRoom(); } catch {}
}

/** Restore the mode saved by the last visit. Called once, after the bar exists. */
function _restoreMode() {
  let saved = '';
  try { saved = localStorage.getItem(_MODE_KEY) || ''; } catch {}
  if (saved !== 'create') return;          // 'cast' is already the default
  _setMode(true);
  renderStudio();
}

async function _pingServer() {
  const el = document.getElementById('st-server');
  if (_canWrite()) {
    try {
      const r = await fetch(_apiUrl('/api/ping'), { cache: 'no-store', headers: _apiHeaders() });
      const j = await r.json();
      _serverUp = !!j.ok;
      if (j.avatars) _avatarList = j.avatars;
    } catch { _serverUp = false; }
  } else {
    _serverUp = false; // deployed site with no Worker configured — browser-only
  }
  if (!_avatarList.length) {
    try { const r = await fetch(_apiUrl('/api/avatars'), { cache: 'no-store', headers: _apiHeaders() }); _avatarList = (await r.json()).avatars || []; } catch {}
  }
  if (el) {
    el.textContent = _serverUp ? '● writes to repo' : '● browser-only (export later)';
    el.className = 'st-server ' + (_serverUp ? 'up' : 'down');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// D1 ROSTER SYNC — the character pool lives in Cloudflare D1 now.
//
// D1 is the source of truth; franchise_roster.json is a published snapshot.
// Saves and deletes hit D1 immediately (fast, no commit, visible on every
// device). Pressing "Publish to site" regenerates the JSON and commits it.
// If the Worker is unreachable we fall back to the old browser-only behaviour,
// so the Studio never becomes unusable.
// ═══════════════════════════════════════════════════════════════════════
let _d1Up = false;          // did the last roster pull succeed?
let _d1Dirty = false;       // unpublished D1 changes exist
let _seasonCounts = new Map();   // slug -> seasons played (from D1)
// Pool filters live in state, not in the DOM. renderStudio() rebuilds the whole
// panel (clicking a character does exactly that), so anything held only as a
// class or an input value is silently lost while the filter itself stays on.
let _rosterFilter = 'all';       // all | never  (never = no season history)
let _rosterQuery = '';           // the search box text
let _archFilter = (() => {       // one archetype, or '' for all
  try { return localStorage.getItem('studio_arch_filter') || ''; } catch { return ''; }
})();

// Hosts live in the roster but never compete, so they'd always look "never
// played". Keep them out of that filter so a cleanup sweep can't bin them.
const RESERVED_CHARACTERS = new Set(['chef', 'chef-hatchet', 'chris', 'chris-mclean']);

/** Pull the roster from D1 into the in-memory pool. Returns true on success. */
async function _rosterPull() {
  if (!_apiBase()) return false;
  try {
    const r = await fetch(_apiUrl('/api/roster'), { cache: 'no-store' });
    const j = await r.json();
    if (!j.ok || !Array.isArray(j.players)) throw new Error(j.error || 'bad response');
    // Keep season counts on the side: the simulator's roster shape must stay
    // exactly what it expects, but the Studio wants to know who never played.
    _seasonCounts = new Map(j.players.map(p => [p.slug, p.seasonCount || 0]));
    // Strip the DB-only fields the simulator doesn't expect.
    _persistRoster(j.players.map(({ voice, retired, updatedAt, seasonCount, ...p }) => p));
    _d1Up = true;
    return true;
  } catch (e) {
    _d1Up = false;
    console.warn('[studio] roster pull from D1 failed, using local pool:', e.message);
    return false;
  }
}

/** Upsert one character into D1. Throws on failure so callers can report it.
 *  The error carries the HTTP status — a silent failure here once caused a
 *  character to be published away, so make it diagnosable. */
async function _rosterPush(entry, voiceText) {
  let r, body;
  try {
    r = await fetch(_apiUrl('/api/roster'), {
      method: 'POST', headers: _apiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ ...entry, voice: voiceText || '' }),
    });
  } catch (netErr) {
    throw new Error(`network error reaching /api/roster (${netErr.message})`);
  }
  try { body = await r.json(); } catch { body = null; }
  if (!r.ok || !body || !body.ok) {
    throw new Error(`${r.status} ${(body && body.error) || r.statusText || 'roster write failed'}`);
  }
  _d1Dirty = true;
  _updatePublishBtn();
  return body;
}

/** Publish D1 -> franchise_roster.json + voice-profiles.json (a git commit). */
async function _rosterPublish() {
  const btn = document.getElementById('st-publish');
  if (!_apiBase()) return _toast('No backend configured — nothing to publish to', 'err');
  if (!confirm('Publish the roster to the live site?\n\nThis rewrites franchise_roster.json and voice-profiles.json in your repo and triggers a Pages rebuild (~1 min).')) return;
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Publishing…'; }
  try {
    const r = await fetch(_apiUrl('/api/roster/publish'), {
      method: 'POST', headers: _apiHeaders({ 'Content-Type': 'application/json' }), body: '{}',
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'publish failed');
    _d1Dirty = false;
    _toast(`Published ${j.published} characters + ${j.voices} voices — site rebuilds in ~1 min`, 'ok');
  } catch (e) {
    _toast('Publish failed: ' + e.message, 'err');
  } finally {
    if (btn) btn.disabled = false;
    _updatePublishBtn();
  }
}

/** How many characters have never played? null when D1 hasn't answered yet. */
function _neverPlayedCount() {
  if (!_seasonCounts.size) return null;
  return _roster().filter(p =>
    !RESERVED_CHARACTERS.has(p.slug) && (_seasonCounts.get(p.slug) || 0) === 0).length;
}

/** Paint the Never-played button from state. Must run after every render. */
function _updateNeverBtn() {
  const btn = document.getElementById('st-never');
  if (!btn) return;
  const on = _rosterFilter === 'never';
  const n = _neverPlayedCount();
  btn.textContent = `🌱 Never played${n == null ? '' : ` (${n})`}${on ? ' ✓' : ''}`;
  btn.classList.toggle('st-primary', on);
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  btn.title = on
    ? 'Filter is ON — showing only characters with no season history. Click to show everyone.'
    : 'Show only characters with no season history — the ones safe to clean up.';
}

/** Show/hide the retired list. Retired characters are hidden from casting but
 *  still in the database with their season history intact. */
async function _toggleRetiredPanel() {
  const box = document.getElementById('st-retired-panel');
  if (!box) return;
  if (!box.hidden) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = '<div class="st-retired-note">Loading…</div>';

  let retired = [];
  try {
    const r = await fetch(_apiUrl('/api/roster?includeRetired=1'), { cache: 'no-store' });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'load failed');
    retired = (j.players || []).filter(p => p.retired);
  } catch (e) {
    box.innerHTML = `<div class="st-retired-note err">Couldn't load retired characters: ${e.message}</div>`;
    return;
  }

  if (!retired.length) {
    box.innerHTML = '<div class="st-retired-note">Nobody is retired. Deleting a character who has played a season retires them instead, and they show up here.</div>';
    return;
  }

  box.innerHTML =
    `<div class="st-retired-note">${retired.length} retired — hidden from casting, history kept.</div>` +
    retired.map(p => `
      <div class="st-retired-row">
        <img src="${_avatarSrc(p.slug)}" alt="" onerror="this.style.visibility='hidden'">
        <span class="st-retired-name">${p.name}</span>
        <span class="st-retired-arch">${p.archetype || ''}</span>
        <button type="button" class="st-btn st-unretire" data-slug="${p.slug}">↩ Bring back</button>
      </div>`).join('');

  box.querySelectorAll('.st-unretire').forEach(btn => {
    btn.addEventListener('click', () => _unretire(btn.dataset.slug, btn));
  });
}

async function _unretire(slug, btn) {
  if (btn) { btn.disabled = true; btn.textContent = '…'; }
  try {
    const r = await fetch(_apiUrl('/api/roster/unretire'), {
      method: 'POST', headers: _apiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ slug }),
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'un-retire failed');
    _d1Dirty = true;
    await _rosterPull();               // they rejoin the casting pool
    _gridRefresh();
    _updatePublishBtn();
    _toast(`${slug} is back in the roster — press Publish to update the site`, 'ok');
    document.getElementById('st-retired-panel').hidden = true;
    _toggleRetiredPanel();             // repaint the list
  } catch (e) {
    _toast('Un-retire failed: ' + e.message, 'err');
    if (btn) { btn.disabled = false; btn.textContent = '↩ Bring back'; }
  }
}

/** Rebuild the derived tables (players/appearances/bonds/seasons/rankings)
 *  from the JSON the season export committed. The roster is not involved. */
async function _syncSeasonData() {
  const btn = document.getElementById('st-sync');
  if (!_apiBase()) return _toast('No backend configured — nothing to sync', 'err');
  if (!confirm('Rebuild the season and ranking tables from the repo?\n\nReads players_database.json, seasons_database.json and rankings_database.json and replaces those tables. Your roster is not touched.\n\nRun this after exporting and committing a finished season.')) return;

  if (btn) { btn.disabled = true; btn.textContent = '⏳ Syncing…'; }
  try {
    const r = await fetch(_apiUrl('/api/sync-seasons'), {
      method: 'POST', headers: _apiHeaders({ 'Content-Type': 'application/json' }), body: '{}',
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'sync failed');
    const c = j.synced || {};
    _toast(`Synced — ${c.players} players, ${c.appearances} appearances, ${c.seasons} seasons, ${c.rankings} rankings`, 'ok');
    // season counts feed the "never played" filter
    await _rosterPull();
    _gridRefresh();
  } catch (e) {
    _toast('Sync failed: ' + e.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔄 Sync season data'; }
  }
}

function _updatePublishBtn() {
  const btn = document.getElementById('st-publish');
  if (!btn) return;
  btn.textContent = _d1Dirty ? '⬆ Publish to site •' : '⬆ Publish to site';
  btn.classList.toggle('st-primary', _d1Dirty);
  btn.title = _d1Dirty
    ? 'You have unpublished roster changes. Click to write them to the site.'
    : 'Regenerate franchise_roster.json + voice-profiles.json from the database.';
}

// ═══════════════════════════════════════════════════════════════════════
// RENDER: pool (left) + editor (right)
// ═══════════════════════════════════════════════════════════════════════
export function renderStudio() {
  const panel = document.getElementById('studio-panel');
  if (!panel) return;
  if (!_draft) _draft = _blankChar();

  const tabs =
    `<nav class="st-views">
       <button type="button" class="st-view${_studioView === 'roster' ? ' on' : ''}" data-view="roster">👥 Roster</button>
       <button type="button" class="st-view${_studioView === 'avatars' ? ' on' : ''}" data-view="avatars">🖼 Avatars</button>
     </nav>`;

  if (_studioView === 'avatars') {
    panel.innerHTML = tabs + '<section class="st-avatars" id="st-avatars"></section>';
    panel.querySelectorAll('.st-view').forEach(b =>
      b.addEventListener('click', () => { _studioView = b.dataset.view; _saveStudioView(); renderStudio(); }));
    _renderAvatarsView();
    return;
  }

  panel.innerHTML = tabs +
    `<div class="st-wrap">
       <section class="st-pool">
         <div class="st-pool-head">
           <button type="button" id="st-new" class="st-btn st-primary">＋ New character</button>
           <input type="search" id="st-search" class="st-input" placeholder="Filter roster…" value="${_esc(_rosterQuery)}">
           <button type="button" id="st-never" class="st-btn" aria-pressed="false">🌱 Never played</button>
           <button type="button" id="st-retired" class="st-btn" title="Show characters that were retired instead of deleted, and bring them back.">👻 Retired</button>
           <button type="button" id="st-publish" class="st-btn" title="Regenerate franchise_roster.json + voice-profiles.json from the database.">⬆ Publish to site</button>
           <button type="button" id="st-sync" class="st-btn" title="Rebuild the season/ranking tables in the database from the repo JSON. Run this after exporting a finished season.">🔄 Sync season data</button>
           <button type="button" id="st-export" class="st-btn" title="Download merged franchise_roster.json + voice-profiles.json + new avatar PNGs to commit">⬇ Export for repo</button>
         </div>
         <div id="st-retired-panel" hidden></div>
         <div id="st-casts" class="st-casts"></div>
         <div id="st-balance" class="st-balance"></div>
         <div id="st-archbar" class="st-archbar"></div>
         <div id="st-grid" class="st-grid"></div>
       </section>
       <section class="st-editor" id="st-editor"></section>
     </div>`;
  panel.querySelectorAll('.st-view').forEach(b =>
    b.addEventListener('click', () => { _studioView = b.dataset.view; _saveStudioView(); renderStudio(); }));
  panel.querySelector('#st-new').addEventListener('click', () => { _draft = _blankChar(); renderStudio(); });
  panel.querySelector('#st-search').addEventListener('input', e => {
    _rosterQuery = e.target.value;
    _renderGrid(_rosterQuery);
  });
  panel.querySelector('#st-export').addEventListener('click', _exportRepo);
  panel.querySelector('#st-sync').addEventListener('click', _syncSeasonData);
  panel.querySelector('#st-publish').addEventListener('click', _rosterPublish);
  panel.querySelector('#st-retired').addEventListener('click', _toggleRetiredPanel);
  panel.querySelector('#st-never').addEventListener('click', () => {
    _rosterFilter = _rosterFilter === 'never' ? 'all' : 'never';
    _updateNeverBtn();
    _renderGrid(_rosterQuery);
  });
  _updatePublishBtn();
  _updateNeverBtn();
  _renderCasts();
  _renderGrid(_rosterQuery);
  _renderBalance();
  _renderEditor();

  // Pull the authoritative pool from D1 once, then repaint the surfaces that
  // depend on it. Cheap enough to run on every render; guarded by _rosterOnce.
  if (!_rosterOnce) {
    _rosterOnce = true;
    _rosterPull().then(ok => {
      if (!ok) return;
      _renderGrid(_rosterQuery);
      _renderBalance();
      _renderCasts();
      _updateNeverBtn();          // the count is only known once D1 answers
    });
  }
}
let _rosterOnce = false;

// ═══════════════════════════════════════════════════════════════════════
// AVATAR MANAGEMENT VIEW
//
// An avatar is "used" when a roster character has that slug. Unused files are
// safe to bin — nothing points at them — so they delete with one confirm.
// Used ones name the character and take a second confirm, because deleting
// leaves a real portrait broken on the site.
// ═══════════════════════════════════════════════════════════════════════
let _studioView = (() => {
  try { return localStorage.getItem('studio_view') === 'avatars' ? 'avatars' : 'roster'; } catch { return 'roster'; }
})();
function _saveStudioView() { try { localStorage.setItem('studio_view', _studioView); } catch {} }
let _avFilter = 'all';        // all | unused | used
let _avQuery = '';

// Avatars that nothing in the roster points at, but that the CODE loads by
// name. Deleting these silently breaks challenges, so they count as in use.
// chef.png/chris.png used to be byte-identical copies of these two, kept only
// because challenge code loaded the short names. The code points here now, so
// they are protected on their own account: deleting the roster character would
// otherwise make these look unused while three challenge VPs still load them.
const RESERVED_AVATARS = new Map([
  ['chef-hatchet', 'Chef — loaded by challenge code'],
  ['chris-mclean', 'Host — loaded by challenge code'],
  ['slasher', 'Slasher Night challenge'],
]);

/** slug -> who/what uses it. Absent means genuinely orphaned. */
const _avUsedBy = () => {
  const m = new Map();
  const roster = _roster();
  const slugs = new Set(roster.map(p => p.slug).filter(Boolean));
  for (const p of roster) if (p.slug) m.set(p.slug, p.name || p.slug);

  for (const s of _avatarList) {
    if (m.has(s)) continue;
    // "<slug>-returnee.png" is the alternate portrait the returnee system uses
    const base = s.replace(/-returnee$/, '');
    if (base !== s && slugs.has(base)) {
      const owner = roster.find(p => p.slug === base);
      m.set(s, `${owner ? owner.name : base} — returnee art`);
      continue;
    }
    const reserved = RESERVED_AVATARS.get(s.toLowerCase());
    if (reserved) m.set(s, reserved);
  }
  return m;
};

async function _renderAvatarsView() {
  const box = document.getElementById('st-avatars');
  if (!box) return;
  box.innerHTML = '<p class="st-empty">Loading avatars…</p>';

  if (!_avatarList.length) {
    try {
      const r = await fetch(_apiUrl('/api/avatars'), { cache: 'no-store', headers: _apiHeaders() });
      _avatarList = (await r.json()).avatars || [];
    } catch {}
  }
  if (!_avatarList.length) _avatarList = _roster().map(p => p.slug).filter(Boolean);

  box.innerHTML =
    `<div class="st-av-bar">
       <button type="button" class="st-btn st-primary" id="st-av-add">＋ Add avatar</button>
       <input type="file" id="st-av-file" accept="image/*" multiple hidden>
       <input type="search" class="st-input st-av-search" id="st-av-q" placeholder="Search avatars…" autocomplete="off">
       <div class="st-av-filters">
         ${[['all', 'All'], ['unused', 'Unused'], ['used', 'In use']].map(([k, label]) =>
           `<button type="button" class="st-av-f${_avFilter === k ? ' on' : ''}" data-f="${k}">${label}</button>`).join('')}
       </div>
     </div>
     <p class="st-av-count" id="st-av-count"></p>
     <div class="st-av-grid" id="st-av-grid"></div>`;

  const file = box.querySelector('#st-av-file');
  box.querySelector('#st-av-add').addEventListener('click', () => file.click());
  file.addEventListener('change', () => _libAddFile(file));
  box.querySelector('#st-av-q').addEventListener('input', e => { _avQuery = e.target.value; _renderAvatarGrid(); });
  box.querySelectorAll('.st-av-f').forEach(b =>
    b.addEventListener('click', () => { _avFilter = b.dataset.f; _renderAvatarsView(); }));

  box.addEventListener('click', e => {
    const del = e.target.closest('.st-av-del');
    if (del) { e.stopPropagation(); _libDeleteFile(del.dataset.s); }
  });

  _renderAvatarGrid();
}

function _renderAvatarGrid() {
  const grid = document.getElementById('st-av-grid');
  const count = document.getElementById('st-av-count');
  if (!grid) return;

  const used = _avUsedBy();
  const q = _avQuery.trim().toLowerCase();
  const shown = _avatarList
    .filter(s => !q || s.toLowerCase().includes(q))
    .filter(s => _avFilter === 'all' || (_avFilter === 'used' ? used.has(s) : !used.has(s)))
    .sort((a, b) => a.localeCompare(b));

  const total = _avatarList.length;
  const unusedTotal = _avatarList.filter(s => !used.has(s)).length;
  if (count) {
    count.textContent = `${shown.length} shown · ${total} avatar${total === 1 ? '' : 's'} total · ` +
      `${unusedTotal} unused${unusedTotal ? ' (safe to delete)' : ''}`;
  }

  grid.innerHTML = shown.length ? shown.map(s => {
    const owner = used.get(s);
    return `<div class="st-av-item${owner ? ' in-use' : ''}">
      <span class="st-av-thumb"><img src="assets/avatars/${encodeURIComponent(s)}.png" alt="" loading="lazy"
        onerror="this.closest('.st-av-thumb').classList.add('miss')"></span>
      <span class="st-av-slug">${_esc(s)}</span>
      <span class="st-av-owner">${owner ? '🔒 ' + _esc(owner) : 'unused'}</span>
      <button type="button" class="st-btn st-av-del" data-s="${_esc(s)}"
        title="${owner ? `${_esc(owner)} uses this — deleting needs a second confirm` : 'Delete this unused avatar'}">🗑</button>
    </div>`;
  }).join('') : '<p class="st-empty">No avatars match that filter.</p>';
}

/** Re-render whichever avatar surface is currently open. */
function _afterAvatarChange() {
  if (_studioView === 'avatars') _renderAvatarsView();
  else _renderLibrary();
}

async function _studioSlugSet() {
  try { return new Set((await _idbAll('characters')).map(c => c.slug)); } catch { return new Set(); }
}

async function _renderGrid(q) {
  const grid = document.getElementById('st-grid');
  if (!grid) return;
  const studioSlugs = await _studioSlugSet();
  const active = _casts.find(c => c.id === _activeCast);
  const ql = (q || '').toLowerCase();
  let list = _roster().filter(p => !ql || p.name.toLowerCase().includes(ql) || (p.archetype || '').includes(ql));

  // "Never played" = no rows in appearances. Hosts are excluded because they
  // never compete by design, so they would always match.
  //
  // Season counts come from D1. If that pull failed the map is empty, and
  // filtering on it would mark EVERY character as never-played — a confidently
  // wrong list you might then delete from. Show nothing and say why instead.
  if (_rosterFilter === 'never') {
    list = _seasonCounts.size
      ? list.filter(p => !RESERVED_CHARACTERS.has(p.slug) && (_seasonCounts.get(p.slug) || 0) === 0)
      : [];
  }

  // Counts are taken here — after search and never-played, before the archetype
  // filter — so each chip says how many you would get by clicking it.
  _renderArchBar(list);
  if (_archFilter) list = list.filter(p => (p.archetype || '') === _archFilter);

  // With a cast selected, its starred members float to the top so you can see
  // and tweak the cast without hunting through 166 cards. Order within each
  // group is left alone.
  if (active) {
    const inCast = new Set(active.slugs);
    list.sort((a, b) => (inCast.has(b.slug) ? 1 : 0) - (inCast.has(a.slug) ? 1 : 0));
  }
  grid.innerHTML = list.map(p => {
    const col = ARCH_COLOR[p.archetype] || '#64748b';
    const mine = studioSlugs.has(p.slug);
    const member = active && active.slugs.includes(p.slug);
    return `<button type="button" class="st-card${_draft && _draft.slug === p.slug ? ' sel' : ''}${member ? ' member' : ''}" data-slug="${_esc(p.slug)}">
      ${active ? `<span class="st-star${member ? ' on' : ''}" data-slug="${_esc(p.slug)}" role="button" title="Toggle in ${_esc(active.name)}">${member ? '★' : '☆'}</span>` : ''}
      <img src="${_esc(_avatarSrc(p.slug))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
      <span class="st-card-name">${_esc(p.name)}</span>
      <span class="st-card-arch" style="--c:${col}">${_esc(p.archetype || '—')}</span>
      ${mine ? '<span class="st-card-mine" title="Created in Studio">✎</span>' : ''}
    </button>`;
  }).join('') || `<p class="st-empty">${
    _rosterFilter === 'never'
      ? (_seasonCounts.size
          ? 'No characters match — everyone here has played a season. <b>“Never played” is on</b>; click it again to show all.'
          : 'Season history hasn\'t loaded, so “never played” can\'t be worked out. Click the button again to show everyone.')
      : 'No matches.'}</p>`;
  grid.querySelectorAll('.st-card').forEach(b => b.addEventListener('click', () => _editBySlug(b.dataset.slug)));
  grid.querySelectorAll('.st-star').forEach(s => s.addEventListener('click', ev => { ev.stopPropagation(); _toggleMember(s.dataset.slug); }));
}

const VILLAIN_ARCH = ['villain', 'mastermind', 'schemer'];
const NICE_ARCH = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];

function _renderBalance() {
  const el = document.getElementById('st-balance');
  if (!el) return;
  const active = _casts.find(c => c.id === _activeCast);
  if (active && active.slugs.length) {
    const members = active.slugs.map(s => _roster().find(p => p.slug === s)).filter(Boolean);
    el.innerHTML = _castAnalysisHTML(members, active.name);
    return;
  }
  // pool-level snapshot when no cast is being composed
  const r = _roster();
  const g = { m: 0, f: 0, nb: 0 }; const arch = {};
  r.forEach(p => { g[p.gender] = (g[p.gender] || 0) + 1; arch[p.archetype] = (arch[p.archetype] || 0) + 1; });
  const villains = VILLAIN_ARCH.reduce((n, a) => n + (arch[a] || 0), 0);
  el.innerHTML =
    `<span class="st-chip">${r.length} in pool</span>
     <span class="st-chip">♂ ${g.m || 0}</span><span class="st-chip">♀ ${g.f || 0}</span><span class="st-chip">⚧ ${g.nb || 0}</span>
     <span class="st-hint">Open or create a cast to analyze a lineup.</span>`;
}

/**
 * Archetype filter, as a dropdown to keep it to one line.
 *
 * Counts and shares come from the list AFTER the search box and the
 * never-played filter but BEFORE this filter, so each option says how many you
 * would get by choosing it — and the percentage is of what is currently in
 * front of you, not of the library in the abstract.
 */
function _renderArchBar(list) {
  const bar = document.getElementById('st-archbar');
  if (!bar) return;

  const counts = {};
  list.forEach(p => { const a = p.archetype; if (a) counts[a] = (counts[a] || 0) + 1; });
  const total = list.length || 1;
  const title = a => a.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Biggest first. This runs on every grid render, so the order re-shuffles by
  // itself the moment a count changes — save a character as a mastermind and
  // they climb past social-butterfly without anything else having to happen.
  // Ties fall back to alphabetical so equal counts don't swap places at random.
  const chips = ARCHETYPES
    .filter(a => counts[a] || _archFilter === a)
    .sort((x, y) => (counts[y] || 0) - (counts[x] || 0) || x.localeCompare(y))
    .map(a => {
      const n = counts[a] || 0;
      const on = _archFilter === a;
      return `<button type="button" class="st-arch${on ? ' on' : ''}${n ? '' : ' empty'}" data-arch="${a}"
        style="--c:${ARCH_COLOR[a] || '#64748b'}" title="${title(a)} — ${n} of ${list.length} shown">` +
        `${a.replace(/-/g, ' ')} <b>${n}</b><i>${Math.round(n / total * 100)}%</i></button>`;
    }).join('');

  bar.innerHTML =
    `<button type="button" class="st-arch st-arch-all${_archFilter ? '' : ' on'}" data-arch=""
      title="Show every archetype">all <b>${list.length}</b></button>` + chips;

  bar.querySelectorAll('.st-arch').forEach(b => b.addEventListener('click', () => {
    _archFilter = b.dataset.arch === _archFilter ? '' : b.dataset.arch;
    try { localStorage.setItem('studio_arch_filter', _archFilter); } catch {}
    _renderGrid(_rosterQuery);
  }));
}

function _castAnalysisHTML(members, castName) {
  const N = members.length;
  const g = { m: 0, f: 0, nb: 0 }, arch = {};
  let statSum = 0, phys = 0;
  members.forEach(p => {
    g[p.gender] = (g[p.gender] || 0) + 1;
    arch[p.archetype] = (arch[p.archetype] || 0) + 1;
    const s = p.stats || {};
    statSum += STAT_KEYS.reduce((t, k) => t + (s[k] || 0), 0);
    if ((s.physical || 0) >= 8 || p.archetype === 'challenge-beast') phys++;
  });
  const villains = VILLAIN_ARCH.reduce((n, a) => n + (arch[a] || 0), 0);
  const nice = NICE_ARCH.reduce((n, a) => n + (arch[a] || 0), 0);
  const heroes = arch.hero || 0;
  const avg = N ? (statSum / (N * STAT_KEYS.length)).toFixed(1) : '0';

  // archetype distribution bars
  const archEntries = Object.entries(arch).sort((a, b) => b[1] - a[1]);
  const maxA = Math.max(1, ...archEntries.map(e => e[1]));
  const bars = archEntries.map(([a, n]) =>
    `<div class="st-an-bar"><span class="st-an-bar-lab" style="--c:${ARCH_COLOR[a] || '#64748b'}">${a}</span>
       <span class="st-an-bar-track"><span class="st-an-bar-fill" style="width:${(n / maxA) * 100}%;background:${ARCH_COLOR[a] || '#64748b'}"></span></span>
       <span class="st-an-bar-n">${n}</span></div>`).join('');

  // warnings
  const warns = [];
  if (villains >= Math.ceil(N * 0.4) && heroes === 0) warns.push(['crit', `${villains} schemers/villains and no hero — nobody to root for`]);
  else if (villains >= Math.ceil(N * 0.5)) warns.push(['warn', `villain-heavy (${villains}/${N})`]);
  if (heroes === 0) warns.push(['warn', 'no hero archetype — thin emotional center']);
  if (phys === 0) warns.push(['warn', 'no challenge threat (no challenge-beast / high physical)']);
  archEntries.forEach(([a, n]) => { if (n >= Math.max(3, Math.ceil(N / 3)) && n > 1) warns.push(['warn', `${n}× ${a} — archetype clumping`]); });
  if (N >= 4 && (g.m === N || g.f === N)) warns.push(['warn', 'single-gender cast']);
  if (!warns.length) warns.push(['ok', 'balanced lineup — no red flags']);

  return `<div class="st-analysis">
    <div class="st-an-head">${_esc(castName)} — cast analysis · ${N} member${N === 1 ? '' : 's'}</div>
    <div class="st-an-cols">
      <div class="st-an-bars">${bars}</div>
      <div class="st-an-side">
        <div class="st-an-stat"><b>${avg}</b><span>avg stat</span></div>
        <div class="st-an-gender">♂ ${g.m || 0} · ♀ ${g.f || 0} · ⚧ ${g.nb || 0}</div>
        <div class="st-an-mix"><span class="st-an-mix-v">${villains} scheme</span><span class="st-an-mix-h">${nice} nice</span><span class="st-an-mix-c">${phys} threat</span></div>
      </div>
    </div>
    <div class="st-an-warns">${warns.map(([k, t]) => `<span class="st-an-warn st-an-${k}">${_esc(t)}</span>`).join('')}</div>
    ${_chemistryHTML(members)}
  </div>`;
}

function _chemistryHTML(members) {
  if (typeof window.careerFor !== 'function') return '';
  const names = new Set(members.map(m => m.name));
  const key = (a, b) => [a, b].sort().join('||');
  const chem = new Map(), conflict = new Map();
  let hasHistory = false;
  members.forEach(m => {
    let c = null; try { c = window.careerFor(m.name); } catch {}
    if (!c) return;
    hasHistory = true;
    const P = c.people || {};
    (P.allies || []).forEach(a => { if (a.name !== m.name && names.has(a.name)) { const k = key(m.name, a.name); if (!chem.has(k)) chem.set(k, `${m.name} &amp; ${a.name} allied`); } });
    (P.showmances || []).forEach(s => { if (names.has(s.partner)) chem.set(key(m.name, s.partner), `${m.name} &amp; ${s.partner} — showmance${s.ended ? ' (ended)' : ''}`); });
    (P.betrayed || []).forEach(b => { if (names.has(b.name)) conflict.set(key(m.name, b.name), `${m.name} burned ${b.name}`); });
    (P.betrayedBy || []).forEach(b => { if (names.has(b.name) && !conflict.has(key(m.name, b.name))) conflict.set(key(m.name, b.name), `${b.name} burned ${m.name}`); });
    (P.rivals || []).forEach(r => { if (names.has(r.name) && !conflict.has(key(m.name, r.name))) conflict.set(key(m.name, r.name), `${m.name} &amp; ${r.name} — rivals`); });
  });
  if (!hasHistory) return `<div class="st-chem-note">✦ No prior-season history among these members — a clean slate.</div>`;
  const chemA = [...chem.values()], confA = [...conflict.values()];
  if (!chemA.length && !confA.length) return `<div class="st-chem-note">History on file, but no shared past among these members yet.</div>`;
  return `<div class="st-chem">
    ${chemA.length ? `<div class="st-chem-col st-chem-good"><span class="st-chem-h">✦ Chemistry</span>${chemA.map(t => `<span class="st-chem-pair">${t}</span>`).join('')}</div>` : ''}
    ${confA.length ? `<div class="st-chem-col st-chem-bad"><span class="st-chem-h">⚔ Conflict</span>${confA.map(t => `<span class="st-chem-pair">${t}</span>`).join('')}</div>` : ''}
  </div>`;
}

// existing voice-profiles.json, fetched once and cached
let _voiceCache = null;
async function _existingVoice(name) {
  if (!_voiceCache) {
    try { _voiceCache = (await (await fetch('voice-profiles.json', { cache: 'no-store' })).json()).profiles || {}; }
    catch { _voiceCache = {}; }
  }
  return _voiceCache[name] || '';
}

// The voice profile is the ONLY field the episode writer reads, so fold the
// structured bio (age, origin/nationality, orientation) into a lead-in in front
// of the personality prose. The raw prose is what's kept in the editor and the
// Studio DB; this composed string is what gets written to voice-profiles.json.
function _composeVoice(d) {
  const bits = [];
  if (d.age) bits.push(String(d.age).trim());
  if (d.origin) bits.push(String(d.origin).trim());
  if (d.sexuality && d.sexuality !== 'straight') bits.push(d.sexuality);
  const lead = bits.length ? bits.join(', ') + '.' : '';
  const prose = (d.voice || '').trim();
  return (lead && prose) ? `${lead} ${prose}` : (lead || prose);
}

async function _editBySlug(slug) {
  const base = _roster().find(p => p.slug === slug);
  if (!base) return;
  const rich = await _idbGet('characters', slug);
  // Studio record wins; otherwise fall back to the existing voice-profiles.json
  // entry so editing a canon/hand-added character shows their real voice.
  const voice = (rich && rich.voice) || await _existingVoice(base.name);
  _draft = {
    name: base.name, slug: base.slug, gender: base.gender || 'nb',
    sexuality: base.sexuality || (rich && rich.sexuality) || 'straight',
    archetype: base.archetype || '', stats: { ...Object.fromEntries(STAT_KEYS.map(k => [k, 5])), ...(base.stats || {}) },
    age: (rich && rich.age) || '', origin: (rich && rich.origin) || '',
    voice, avatarDataUri: (rich && rich.avatarDataUri) || '',
  };
  renderStudio();
  document.getElementById('st-editor')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── the character sheet ─────────────────────────────────────────────────
function _renderEditor() {
  const ed = document.getElementById('st-editor');
  if (!ed) return;
  const d = _draft;
  const avatar = d.avatarDataUri || (d.slug ? _avatarSrc(d.slug) : '');
  ed.innerHTML =
    `<div class="st-sheet">
      <div class="st-sheet-head">
        <div class="st-portrait" id="st-portrait">
          ${avatar ? `<img src="${_esc(avatar)}" alt="" onerror="this.remove()">` : '<span class="st-portrait-ph">no avatar</span>'}
        </div>
        <div class="st-idfields">
          <label class="st-l">Name<input class="st-input" id="st-f-name" value="${_esc(d.name)}" placeholder="Character name"></label>
          <div class="st-row2">
            <label class="st-l">Slug<input class="st-input" id="st-f-slug" value="${_esc(d.slug)}" placeholder="auto"></label>
            <label class="st-l">Age<input class="st-input" id="st-f-age" value="${_esc(d.age)}" placeholder="—" inputmode="numeric"></label>
          </div>
        </div>
      </div>

      <div class="st-avatar-ctrls">
        <label class="st-btn st-file">Upload image<input type="file" id="st-f-file" accept="image/*" hidden></label>
        <button type="button" class="st-btn" id="st-f-lib">Pick from library</button>
      </div>
      <div id="st-lib" class="st-lib" hidden></div>

      <div class="st-row2">
        <label class="st-l">Gender
          <div class="st-seg st-genders" id="st-f-gender">
            ${GENDERS.map(([v,lab]) => `<button type="button" data-g="${v}" class="${d.gender===v?'active':''}">${lab}</button>`).join('')}
          </div>
        </label>
        <label class="st-l">Orientation
          <select class="st-input" id="st-f-sex">${SEXES.map(s => `<option value="${s}"${d.sexuality===s?' selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}</select>
        </label>
      </div>

      <label class="st-l">Archetype
        <select class="st-input" id="st-f-arch">
          <option value="">— choose —</option>
          ${ARCHETYPES.map(a => `<option value="${a}"${d.archetype===a?' selected':''}>${a}</option>`).join('')}
        </select>
      </label>

      <div class="st-stats-head">
        <span class="st-l-txt">Stats</span>
        <div class="st-stat-btns">
          <button type="button" class="st-btn st-sm" id="st-seed">Seed from archetype</button>
          <button type="button" class="st-btn st-sm" id="st-balance-btn">Balance</button>
          <button type="button" class="st-btn st-sm" id="st-rand">Randomize</button>
        </div>
      </div>
      <div class="st-stats">
        <div class="st-sliders" id="st-sliders">${STAT_KEYS.map(_sliderHTML).join('')}</div>
        <div class="st-radar-wrap"><canvas id="st-radar" width="220" height="220"></canvas></div>
      </div>

      <label class="st-l">Voice profile <span class="st-hint">how they TALK + personality — age & origin get added automatically</span>
        <textarea class="st-input st-area" id="st-f-voice" rows="3" placeholder="e.g. Minimal, calm and dry; lets people underestimate the pretty one…">${_esc(d.voice)}</textarea>
      </label>
      <label class="st-l">Origin / nationality <span class="st-hint">folded into the voice profile the writer reads</span>
        <input class="st-input" id="st-f-origin" value="${_esc(d.origin)}" placeholder="e.g. Nigerian international model">
      </label>

      <div class="st-actions">
        <button type="button" class="st-btn st-primary st-lg" id="st-save">Save character</button>
        ${(() => {
          const active = _casts.find(c => c.id === _activeCast);
          const inPool = d.slug && _roster().some(p => p.slug === d.slug);
          if (!active || !inPool) return '';
          const member = active.slugs.includes(d.slug);
          return `<button type="button" class="st-btn st-lg${member ? ' st-primary' : ''}" id="st-add-cast" title="Toggle ${_esc(d.name)} in ${_esc(active.name)}">${member ? '★ In ' + _esc(active.name) : '☆ Add to ' + _esc(active.name)}</button>`;
        })()}
        ${d.slug ? `<button type="button" class="st-btn st-danger" id="st-del">Delete</button>` : ''}
        <span class="st-save-note" id="st-save-note"></span>
      </div>
    </div>`;

  // wire fields
  const nameEl = ed.querySelector('#st-f-name');
  nameEl.addEventListener('input', e => {
    d.name = e.target.value;
    const slugEl = ed.querySelector('#st-f-slug');
    if (!slugEl.value || slugEl.dataset.auto === '1') { slugEl.value = _slugify(d.name); slugEl.dataset.auto = '1'; d.slug = slugEl.value; }
  });
  ed.querySelector('#st-f-slug').addEventListener('input', e => { e.target.dataset.auto = '0'; d.slug = _slugify(e.target.value); e.target.value = d.slug; });
  ed.querySelector('#st-f-age').addEventListener('input', e => d.age = e.target.value.replace(/[^0-9]/g, ''));
  ed.querySelector('#st-f-sex').addEventListener('change', e => d.sexuality = e.target.value);
  ed.querySelector('#st-f-arch').addEventListener('change', e => d.archetype = e.target.value);
  ed.querySelector('#st-f-voice').addEventListener('input', e => d.voice = e.target.value);
  ed.querySelector('#st-f-origin').addEventListener('input', e => d.origin = e.target.value);
  ed.querySelectorAll('#st-f-gender button').forEach(b => b.addEventListener('click', () => {
    d.gender = b.dataset.g; ed.querySelectorAll('#st-f-gender button').forEach(x => x.classList.toggle('active', x === b));
  }));

  // stats
  ed.querySelectorAll('.st-slider').forEach(sl => sl.addEventListener('input', e => {
    const k = e.target.dataset.k; d.stats[k] = +e.target.value; _updateStatUI(k); _drawRadar();
  }));
  ed.querySelector('#st-seed').addEventListener('click', () => {
    if (!d.archetype) { _toast('Pick an archetype first', 'warn'); return; }
    d.stats = { ...ARCH_PRESET[d.archetype] }; _syncSliders(); _drawRadar();
  });
  ed.querySelector('#st-balance-btn').addEventListener('click', () => { _balance(); _syncSliders(); _drawRadar(); });
  ed.querySelector('#st-rand').addEventListener('click', () => { _randomize(); _syncSliders(); _drawRadar(); });

  // avatar
  ed.querySelector('#st-f-file').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try { d.avatarDataUri = await _imgToAvatar(URL.createObjectURL(f)); _refreshPortrait(); }
    catch { _toast('Could not read that image', 'err'); }
  });
  ed.querySelector('#st-f-lib').addEventListener('click', _toggleLibrary);

  // save / delete
  ed.querySelector('#st-save').addEventListener('click', _save);
  ed.querySelector('#st-del')?.addEventListener('click', _delete);
  // add/remove the selected character from the active cast, right from the editor
  ed.querySelector('#st-add-cast')?.addEventListener('click', async () => { await _toggleMember(d.slug); _renderEditor(); });

  _drawRadar();
}

function _sliderHTML(k) {
  const v = _statOf(k);
  return `<div class="st-stat" data-k="${k}">
    <span class="st-stat-lab">${STAT_ABBR[k]}</span>
    <input type="range" class="st-slider" data-k="${k}" min="1" max="10" step="1" value="${v}">
    <span class="st-stat-val" style="color:${_statHue(v)}">${v}</span>
  </div>`;
}
function _updateStatUI(k) {
  const row = document.querySelector(`.st-stat[data-k="${k}"]`);
  if (!row) return;
  const v = _draft.stats[k];
  const val = row.querySelector('.st-stat-val');
  val.textContent = v; val.style.color = _statHue(v);
}
function _syncSliders() { STAT_KEYS.forEach(k => { const sl = document.querySelector(`.st-slider[data-k="${k}"]`); if (sl) sl.value = _draft.stats[k]; _updateStatUI(k); }); }

function _balance() {
  // pull extremes toward the middle a touch so nobody is all-10s / all-2s
  STAT_KEYS.forEach(k => { const v = _draft.stats[k]; _draft.stats[k] = Math.round(v + (5.5 - v) * 0.22); _draft.stats[k] = Math.max(1, Math.min(10, _draft.stats[k])); });
}
function _randomize() {
  const base = _draft.archetype ? ARCH_PRESET[_draft.archetype] : null;
  STAT_KEYS.forEach(k => {
    const center = base ? base[k] : 5;
    const v = Math.round(center + (Math.random() * 5 - 2.5));   // ±2–3 jitter around the archetype
    _draft.stats[k] = Math.max(1, Math.min(10, v));
  });
}

function _drawRadar() {
  const cv = document.getElementById('st-radar'); if (!cv) return;
  const ctx = cv.getContext('2d');
  const cs = getComputedStyle(document.body);
  const border = (cs.getPropertyValue('--border') || '#334').trim();
  const muted = (cs.getPropertyValue('--muted') || '#889').trim();
  const accent = (cs.getPropertyValue('--accent') || '#f4b23e').trim();
  const W = cv.width, H = cv.height, cx = W / 2, cy = H / 2, R = 78, n = 9;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = border; ctx.lineWidth = 1;
  for (let r = 1; r <= 5; r++) { ctx.beginPath(); for (let i = 0; i < n; i++) { const a = -Math.PI/2 + i*2*Math.PI/n; const x = cx+Math.cos(a)*R*r/5, y = cy+Math.sin(a)*R*r/5; i?ctx.lineTo(x,y):ctx.moveTo(x,y); } ctx.closePath(); ctx.stroke(); }
  ctx.fillStyle = muted; ctx.font = '9px ui-monospace,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) { const a = -Math.PI/2 + i*2*Math.PI/n; ctx.strokeStyle = border; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R); ctx.stroke(); ctx.fillText(STAT_ABBR[STAT_KEYS[i]], cx+Math.cos(a)*(R+13), cy+Math.sin(a)*(R+13)); }
  ctx.beginPath();
  for (let i = 0; i < n; i++) { const a = -Math.PI/2 + i*2*Math.PI/n; const v = _draft.stats[STAT_KEYS[i]]/10; const x = cx+Math.cos(a)*R*v, y = cy+Math.sin(a)*R*v; i?ctx.lineTo(x,y):ctx.moveTo(x,y); }
  ctx.closePath(); ctx.fillStyle = accent + '55'; ctx.fill(); ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.stroke();
  for (let i = 0; i < n; i++) { const a = -Math.PI/2 + i*2*Math.PI/n; const v = _draft.stats[STAT_KEYS[i]]/10; ctx.beginPath(); ctx.arc(cx+Math.cos(a)*R*v, cy+Math.sin(a)*R*v, 2.5, 0, 7); ctx.fillStyle = _statHue(_draft.stats[STAT_KEYS[i]]); ctx.fill(); }
}

function _refreshPortrait() {
  const p = document.getElementById('st-portrait'); if (!p) return;
  const src = _draft.avatarDataUri || (_draft.slug ? _avatarSrc(_draft.slug) : '');
  p.innerHTML = src ? `<img src="${_esc(src)}" alt="" onerror="this.remove()">` : '<span class="st-portrait-ph">no avatar</span>';
}

// ── avatar library picker ───────────────────────────────────────────────
// 190+ avatars is far too many for one flat grid, so the picker shows one
// alphabetical section at a time (‹ › steps between letters) plus a search
// that spans every letter.
let _libLetter = '';
let _libQuery = '';

const _libLetterOf = s => { const c = String(s).charAt(0).toUpperCase(); return c >= 'A' && c <= 'Z' ? c : '#'; };
const _libSorted = () => _avatarList.slice().sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
const _libLetters = () => [...new Set(_libSorted().map(_libLetterOf))];

async function _toggleLibrary() {
  const box = document.getElementById('st-lib'); if (!box) return;
  if (!box.hidden) { box.hidden = true; return; }
  if (!_avatarList.length) {
    try { _avatarList = (await (await fetch(_apiUrl('/api/avatars'), { cache: 'no-store', headers: _apiHeaders() })).json()).avatars || []; } catch {}
  }
  // fallback: the roster slugs all have avatars — works on static hosting too
  if (!_avatarList.length) _avatarList = _roster().map(p => p.slug).filter(Boolean);
  _libQuery = '';
  _libDeleteMode = false;                 // never open the picker armed to delete
  const letters = _libLetters();
  if (!letters.includes(_libLetter)) _libLetter = letters[0] || '';
  box.hidden = false;
  _renderLibrary();
}

// full shell — built once per open so the search box keeps focus while typing
function _renderLibrary() {
  const box = document.getElementById('st-lib'); if (!box) return;
  if (!_avatarList.length) { box.innerHTML = '<p class="st-empty">No avatars available yet.</p>'; return; }

  box.innerHTML =
    `<div class="st-lib-bar">
      <button type="button" class="st-lib-nav" data-nav="-1" aria-label="Previous letter">‹</button>
      <div class="st-lib-letters">
        ${_libLetters().map(L => `<button type="button" class="st-lib-letter" data-l="${_esc(L)}">${_esc(L)}</button>`).join('')}
      </div>
      <button type="button" class="st-lib-nav" data-nav="1" aria-label="Next letter">›</button>
      <input type="search" class="st-input st-lib-search" id="st-lib-q" placeholder="Search all…" autocomplete="off">
      <button type="button" class="st-btn st-lib-add" id="st-lib-add" title="Upload an image to the avatar library without creating a character">＋ Add</button>
      <button type="button" class="st-btn st-lib-del" id="st-lib-del" title="Delete mode: click an avatar to remove its file from the repo">🗑</button>
      <input type="file" id="st-lib-file" accept="image/*" hidden>
    </div>
    <div class="st-lib-grid" id="st-lib-grid"></div>
    <p class="st-lib-count" id="st-lib-count"></p>`;

  box.querySelector('#st-lib-q').addEventListener('input', e => { _libQuery = e.target.value; _renderLibGrid(); });
  box.querySelectorAll('.st-lib-letter').forEach(b => b.addEventListener('click', () => {
    _libLetter = b.dataset.l; _libQuery = ''; box.querySelector('#st-lib-q').value = ''; _renderLibGrid();
  }));
  box.querySelectorAll('.st-lib-nav').forEach(b => b.addEventListener('click', () => {
    const letters = _libLetters(), i = letters.indexOf(_libLetter) + Number(b.dataset.nav);
    if (i < 0 || i >= letters.length) return;
    _libLetter = letters[i]; _libQuery = ''; box.querySelector('#st-lib-q').value = ''; _renderLibGrid();
  }));
  // ── library management: add / delete files without touching a character ──
  const fileInput = box.querySelector('#st-lib-file');
  box.querySelector('#st-lib-add').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => _libAddFile(fileInput));
  box.querySelector('#st-lib-del').addEventListener('click', () => {
    _libDeleteMode = !_libDeleteMode;
    _renderLibGrid();
    _toast(_libDeleteMode
      ? 'Delete mode on — click an avatar to remove its file'
      : 'Delete mode off', _libDeleteMode ? 'warn' : 'ok');
  });

  // delegated so it survives every grid re-render
  box.addEventListener('click', async e => {
    const b = e.target.closest('.st-lib-item'); if (!b) return;
    if (_libDeleteMode) return _libDeleteFile(b.dataset.s);
    try { _draft.avatarDataUri = await _imgToAvatar(`assets/avatars/${b.dataset.s}.png`); _refreshPortrait(); box.hidden = true; }
    catch { _toast('Could not load that avatar', 'err'); }
  });

  _renderLibGrid();
}

let _libDeleteMode = false;

/** Upload one or many images to assets/avatars/<slug>.png — no character needed.
 *  Slugs come from the filenames, so a bulk drop needs no prompting; only a
 *  single file asks, since that's when you're most likely to want a rename. */
async function _libAddFile(input) {
  const files = [...(input.files || [])];
  input.value = '';                                   // allow re-picking the same file
  if (!files.length) return;
  if (!_apiBase()) return _toast('No backend configured — cannot upload', 'err');

  const jobs = [];
  if (files.length === 1) {
    const suggested = _slugify(files[0].name.replace(/\.[a-z0-9]+$/i, ''));
    const slug = (prompt('Save this avatar under which slug?\n(lowercase letters, digits and dashes — this is the filename)', suggested) || '').trim().toLowerCase();
    if (!slug) return;
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return _toast('Slug must be lowercase letters/digits/dashes', 'err');
    if (_avatarList.includes(slug) && !confirm(`"${slug}" already exists in the library. Replace it?`)) return;
    jobs.push({ file: files[0], slug });
  } else {
    const bad = [];
    for (const f of files) {
      const slug = _slugify(f.name.replace(/\.[a-z0-9]+$/i, ''));
      if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) { bad.push(f.name); continue; }
      jobs.push({ file: f, slug });
    }
    if (!jobs.length) return _toast('None of those filenames make a valid slug', 'err');
    const dupes = jobs.filter(j => _avatarList.includes(j.slug)).map(j => j.slug);
    const lines = [
      `Upload ${jobs.length} avatar${jobs.length === 1 ? '' : 's'}? Slugs come from the filenames:`,
      jobs.slice(0, 12).map(j => `  ${j.slug}`).join('\n') + (jobs.length > 12 ? `\n  …and ${jobs.length - 12} more` : ''),
    ];
    if (dupes.length) lines.push(`\n${dupes.length} already exist and will be REPLACED: ${dupes.slice(0, 8).join(', ')}${dupes.length > 8 ? '…' : ''}`);
    if (bad.length) lines.push(`\nSkipping ${bad.length} file(s) with unusable names: ${bad.slice(0, 5).join(', ')}`);
    if (!confirm(lines.join('\n'))) return;
  }

  let ok = 0;
  const failed = [];
  for (let i = 0; i < jobs.length; i++) {
    const { file, slug } = jobs[i];
    if (jobs.length > 1) _toast(`Uploading ${i + 1}/${jobs.length}: ${slug}…`, 'ok');
    else _toast('Uploading avatar…', 'ok');
    try {
      // reuse the same square-crop pipeline the character portrait uses
      const dataUri = await _imgToAvatar(URL.createObjectURL(file));
      const r = await fetch(_apiUrl('/api/avatar'), {
        method: 'POST', headers: _apiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ slug, dataUri }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'upload failed');
      if (!_avatarList.includes(slug)) _avatarList.push(slug);
      _libLetter = _libLetterOf(slug);
      ok++;
    } catch (e) {
      failed.push(`${slug} (${e.message})`);
    }
  }

  _libQuery = '';
  _afterAvatarChange();
  if (failed.length) {
    _toast(`${ok} uploaded, ${failed.length} failed: ${failed.slice(0, 3).join('; ')}`, failed.length === jobs.length ? 'err' : 'warn');
  } else {
    _toast(`${ok} avatar${ok === 1 ? '' : 's'} uploaded — live after the site rebuilds (~1 min)`, 'ok');
  }
}

/** Delete an avatar file from the repo. The Worker refuses if a character uses
 *  it, and we re-ask with force so you always see whose portrait breaks. */
async function _libDeleteFile(slug) {
  if (!_apiBase()) return _toast('No backend configured — cannot delete', 'err');

  // Unused avatars are low-stakes: nothing points at them. Used ones get the
  // owner's name up front, and the Worker still makes you confirm again.
  const owner = _avUsedBy().get(slug);
  const first = owner
    ? `"${slug}" is used by ${owner}.\n\nDeleting it removes assets/avatars/${slug}.png from your repo and leaves ${owner} with no portrait. Continue?`
    : `Delete the unused avatar "${slug}"?\n\nRemoves assets/avatars/${slug}.png from your repo. It stays in git history.`;
  if (!confirm(first)) return;

  const send = force => fetch(_apiUrl('/api/avatar/delete'), {
    method: 'POST', headers: _apiHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ slug, force }),
  }).then(r => r.json());

  try {
    let j = await send(false);
    if (!j.ok) throw new Error(j.error || 'delete failed');

    if (j.action === 'blocked') {
      if (!confirm(`${j.message}\n\nDelete it anyway?`)) return;
      j = await send(true);
      if (!j.ok) throw new Error(j.error || 'delete failed');
    }

    _avatarList = _avatarList.filter(s => s !== slug);
    const letters = _libLetters();
    if (!letters.includes(_libLetter)) _libLetter = letters[0] || '';
    _afterAvatarChange();
    _toast(`Avatar "${slug}" deleted — gone from the site after the rebuild`, 'ok');
  } catch (e) {
    _toast('Avatar delete failed: ' + e.message, 'err');
  }
}

// section contents + the bits of chrome that depend on them
function _renderLibGrid() {
  const box = document.getElementById('st-lib'); if (!box) return;
  const all = _libSorted();
  const letters = _libLetters();
  const q = _libQuery.trim().toLowerCase();
  const shown = q ? all.filter(s => s.toLowerCase().includes(q)) : all.filter(s => _libLetterOf(s) === _libLetter);

  box.querySelectorAll('.st-lib-letter').forEach(b => b.classList.toggle('on', !q && b.dataset.l === _libLetter));
  // keep the active letter in view without scrolling the page (the strip
  // scrolls horizontally, so scrollIntoView would be too blunt here)
  const on = box.querySelector('.st-lib-letter.on');
  if (on) {
    const strip = on.parentElement, l = on.offsetLeft, r = l + on.offsetWidth;
    if (l < strip.scrollLeft) strip.scrollLeft = l - 4;
    else if (r > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = r - strip.clientWidth + 4;
  }
  const i = letters.indexOf(_libLetter);
  box.querySelectorAll('.st-lib-nav').forEach(b => {
    const step = Number(b.dataset.nav);
    b.disabled = !!q || i + step < 0 || i + step >= letters.length;
  });

  box.querySelector('#st-lib-count').textContent = q
    ? `${shown.length} match${shown.length === 1 ? '' : 'es'} for “${_libQuery.trim()}”`
    : `${shown.length} in ${_libLetter} · ${all.length} total`;

  // delete mode is a visible, deliberate state — the grid turns red and the
  // toggle stays lit, so a stray click can't quietly remove a file
  const grid = box.querySelector('#st-lib-grid');
  grid.classList.toggle('del-mode', _libDeleteMode);
  box.querySelector('#st-lib-del')?.classList.toggle('on', _libDeleteMode);

  grid.innerHTML = shown.length
    ? shown.map(s => `<button type="button" class="st-lib-item" data-s="${_esc(s)}" title="${_esc(s)}">
        <span class="st-lib-thumb"><img src="assets/avatars/${encodeURIComponent(s)}.png" alt="" loading="lazy" onerror="this.closest('.st-lib-thumb').classList.add('miss')"></span>
        <span class="st-lib-name">${_esc(s)}</span>
      </button>`).join('')
    : '<p class="st-empty">No avatars match.</p>';
  grid.scrollTop = 0;
}

// ═══════════════════════════════════════════════════════════════════════
// SAVE / DELETE
// ═══════════════════════════════════════════════════════════════════════
async function _save() {
  const d = _draft;
  const note = document.getElementById('st-save-note');
  d.name = (d.name || '').trim();
  if (!d.slug) d.slug = _slugify(d.name);
  if (!d.name) return _fail(note, 'Name is required');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(d.slug)) return _fail(note, 'Slug must be lowercase letters/digits/dashes');
  if (!d.archetype) return _fail(note, 'Pick an archetype');
  // slug collision with a DIFFERENT existing character
  const clash = _roster().find(p => p.slug === d.slug && p.name !== d.name);
  if (clash) return _fail(note, `Slug "${d.slug}" already used by ${clash.name}`);

  const entry = { name: d.name, slug: d.slug, gender: d.gender, sexuality: d.sexuality, archetype: d.archetype, stats: { ...d.stats } };

  // 1) live projection into the roster the Cast Builder reads
  const arr = _roster().slice();
  const i = arr.findIndex(p => p.slug === d.slug || p.name === d.name);
  if (i >= 0) arr[i] = { ...arr[i], ...entry }; else arr.push(entry);
  _persistRoster(arr);

  // 2) rich record (raw prose kept for editing) + avatar override
  const rich = { slug: d.slug, name: d.name, age: d.age, gender: d.gender, sexuality: d.sexuality, archetype: d.archetype, origin: d.origin, voice: d.voice, avatarDataUri: d.avatarDataUri || '' };
  try { await _idbPut('characters', rich); } catch {}
  if (d.avatarDataUri) { window.__studioAvatars = window.__studioAvatars || {}; window.__studioAvatars[d.slug] = d.avatarDataUri; }

  // composed voice = bio lead-in (age/origin/orientation) + prose — this is what
  // the episode writer actually reads. Keep the fetched cache in sync too.
  const composedVoice = _composeVoice(d);
  if (_voiceCache) _voiceCache[d.name] = composedVoice;

  // 3) write to the database (fast, no commit, visible everywhere). An avatar
  //    is a PNG, which can only live in the repo — so a NEW avatar still goes
  //    through /api/character. Saves without a new avatar no longer touch git,
  //    which is why editing is instant now; press Publish when you're ready.
  let wrote = null;
  let savedToDb = false;
  if (_serverUp) {
    try {
      await _rosterPush(entry, composedVoice);
      savedToDb = true;
    } catch (e) { _toast('Saved locally, but the database write failed: ' + e.message, 'warn'); }

    if (d.avatarDataUri) {
      try {
        const r = await fetch(_apiUrl('/api/character'), {
          method: 'POST', headers: _apiHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ roster: entry, voice: { name: d.name, text: composedVoice }, avatar: { slug: d.slug, dataUri: d.avatarDataUri } }),
        });
        const j = await r.json();
        if (!j.ok) throw new Error(j.error || 'write failed');
        wrote = j.wrote;
      } catch (e) { _toast('Avatar upload failed: ' + e.message, 'warn'); }
    }
  }

  // 4) refresh surfaces
  _renderGrid(document.getElementById('st-search')?.value || '');
  _renderBalance();
  try { if (document.getElementById('tab-cast')?.classList.contains('cast-room-active')) window.renderCastRoom && window.renderCastRoom(); } catch {}

  const bits = [];
  if (savedToDb) bits.push('in the database');
  if (wrote) bits.push(`${wrote.length} repo file${wrote.length === 1 ? '' : 's'}`);
  if (!bits.length) bits.push(_serverUp ? 'saved' : 'browser-only — run serve.py or deploy the Worker');
  _toast(`${d.name} saved — ${bits.join(' + ')}`, 'ok');
  if (note) {
    note.textContent = savedToDb ? '✓ saved — press Publish to push it to the site' : '✓ live in the cast pool';
    note.className = 'st-save-note ok';
  }
}

function _fail(note, msg) { if (note) { note.textContent = msg; note.className = 'st-save-note err'; } _toast(msg, 'err'); }

async function _delete() {
  const d = _draft;
  if (!d.slug) return;

  // The database decides delete-vs-retire: a character who has never played is
  // removed outright; one with season history is retired so their appearances
  // and bonds are never orphaned. Ask before either.
  if (!confirm(`Remove ${d.name} from the roster?\n\nIf they've played a season they'll be retired (hidden from casting, history kept) rather than deleted.`)) return;

  let msg = `${d.name} removed from the local pool`;
  if (_serverUp && _apiBase()) {
    try {
      const r = await fetch(_apiUrl('/api/roster/delete'), {
        method: 'POST', headers: _apiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ slug: d.slug }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'delete failed');
      _d1Dirty = true;
      msg = j.action === 'retired'
        ? `${j.name} retired — ${j.seasons} season(s) of history kept`
        : `${j.name} deleted from the roster`;
    } catch (e) {
      _toast('Database delete failed: ' + e.message + ' (removed locally only)', 'warn');
    }
  }

  // Retired characters are hidden from casting too, so either way they leave
  // the in-memory pool.
  _persistRoster(_roster().filter(p => p.slug !== d.slug));
  try { await _idbDel('characters', d.slug); } catch {}
  if (window.__studioAvatars) delete window.__studioAvatars[d.slug];
  _draft = _blankChar();
  renderStudio();
  _toast(msg + ' — press Publish to update the site', 'ok');
}

// ═══════════════════════════════════════════════════════════════════════
// CASTS — named collections you compose, then load into a season
// ═══════════════════════════════════════════════════════════════════════
function _gridRefresh() { _renderGrid(_rosterQuery); _renderBalance(); _updateNeverBtn(); }

function _renderCasts() {
  const el = document.getElementById('st-casts');
  if (!el) return;
  const active = _casts.find(c => c.id === _activeCast);
  el.innerHTML =
    `<div class="st-casts-row">
       <span class="st-casts-lab">Casts</span>
       ${_casts.map(c => `<button type="button" class="st-cast-chip${c.id === _activeCast ? ' active' : ''}" data-id="${c.id}">${_esc(c.name)}<span class="st-cast-n">${c.slugs.length}</span></button>`).join('')}
       <button type="button" class="st-cast-chip st-cast-new" id="st-cast-new">＋ New cast</button>
     </div>
     ${active ? `<div class="st-cast-actions">
        <span class="st-cast-title">${_esc(active.name)} · ${active.slugs.length} member${active.slugs.length === 1 ? '' : 's'} <span class="st-hint">— star characters below to add them</span></span>
        <span class="st-cast-btns">
          <button type="button" class="st-btn st-sm st-primary" id="st-cast-load">Load into season</button>
          <button type="button" class="st-btn st-sm" id="st-cast-rename">Rename</button>
          <button type="button" class="st-btn st-sm st-danger" id="st-cast-del">Delete</button>
        </span>
      </div>` : ''}`;
  el.querySelectorAll('.st-cast-chip[data-id]').forEach(b => b.addEventListener('click', () => {
    _activeCast = (_activeCast === b.dataset.id) ? null : b.dataset.id;
    _renderCasts(); _gridRefresh();
  }));
  el.querySelector('#st-cast-new')?.addEventListener('click', _newCast);
  el.querySelector('#st-cast-load')?.addEventListener('click', () => _loadCastIntoSeason(active));
  el.querySelector('#st-cast-rename')?.addEventListener('click', () => _renameCast(active));
  el.querySelector('#st-cast-del')?.addEventListener('click', () => _deleteCast(active));
}

async function _newCast() {
  const name = (prompt('Name this cast:', '') || '').trim();
  if (!name) return;
  const cast = { id: 'c' + Math.random().toString(36).slice(2, 9), name, slugs: [] };
  _casts.push(cast); _activeCast = cast.id;
  try { await _idbPut('casts', cast); } catch {}
  _renderCasts(); _gridRefresh();
}
async function _renameCast(c) {
  if (!c) return;
  const n = (prompt('Rename cast:', c.name) || '').trim();
  if (!n) return;
  c.name = n; try { await _idbPut('casts', c); } catch {}
  _renderCasts();
}
async function _deleteCast(c) {
  if (!c || !confirm(`Delete cast "${c.name}"? (Characters themselves are not deleted.)`)) return;
  _casts = _casts.filter(x => x.id !== c.id);
  if (_activeCast === c.id) _activeCast = null;
  try { await _idbDel('casts', c.id); } catch {}
  _renderCasts(); _gridRefresh();
}
async function _toggleMember(slug) {
  const c = _casts.find(x => x.id === _activeCast);
  if (!c) return;
  const i = c.slugs.indexOf(slug);
  if (i >= 0) c.slugs.splice(i, 1); else c.slugs.push(slug);
  try { await _idbPut('casts', c); } catch {}
  _renderCasts(); _gridRefresh();
}
function _memberToPlayer(r) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name: r.name, baseSlug: r.slug, slug: r.slug, tribe: '',
    gender: r.gender || 'nb',
    sexuality: (r.sexuality && r.sexuality !== 'straight') ? r.sexuality : undefined,
    archetype: r.archetype || '', stats: { ...r.stats },
    isReturnee: false,
  };
}
function _loadCastIntoSeason(cast) {
  if (!cast) return;
  const members = cast.slugs.map(s => _roster().find(p => p.slug === s)).filter(Boolean);
  if (!members.length) { _toast('This cast has no members yet — star some characters first', 'warn'); return; }
  const cur = (window.players || []);
  if (cur.length && !confirm(`Replace the current season cast (${cur.length} player${cur.length === 1 ? '' : 's'}) with "${cast.name}" (${members.length})?`)) return;
  const arr = members.map(_memberToPlayer);
  try { window.players = arr; } catch {}
  try { window.saveCast && window.saveCast(); } catch {}
  try { window.refreshReturneeAvatars && window.refreshReturneeAvatars(arr); } catch {}
  try { window.renderCast && window.renderCast(); } catch {}
  _toast(`Loaded "${cast.name}" — ${arr.length} into the season cast`, 'ok');
  studioExit(); // drop to Build Cast so they see the loaded lineup
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORT FOR REPO — merged files, works with or without the server
// ═══════════════════════════════════════════════════════════════════════
function _dl(name, text) {
  const b = new Blob([text], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
function _dlDataUri(name, uri) { const a = document.createElement('a'); a.href = uri; a.download = name; a.click(); }

async function _exportRepo() {
  // 1) franchise_roster.json — full current pool
  _dl('franchise_roster.json', JSON.stringify({ players: _roster() }, null, 2) + '\n');
  // 2) voice-profiles.json — base file merged with studio voices
  let base = { profiles: {} };
  try { base = await (await fetch('voice-profiles.json', { cache: 'no-store' })).json(); } catch {}
  if (!base.profiles) base.profiles = {};
  const chars = await _idbAll('characters');
  chars.forEach(c => { const v = _composeVoice(c); if (v) base.profiles[c.name] = v; });
  _dl('voice-profiles.json', JSON.stringify(base, null, 2) + '\n');
  // 3) avatar PNGs for studio-created characters
  let n = 0;
  chars.forEach(c => { if (c.avatarDataUri) { _dlDataUri(c.slug + '.png', c.avatarDataUri); n++; } });
  _toast(`Exported roster + voices${n ? ` + ${n} avatar${n === 1 ? '' : 's'}` : ''}. Drop into the repo and commit.`, 'ok');
}

// ═══════════════════════════════════════════════════════════════════════
// global avatar fallback: any assets/avatars/<slug>.png that 404s and has a
// studio data URI swaps to it — one handler instead of editing 6 call sites.
// ═══════════════════════════════════════════════════════════════════════
function _installAvatarFallback() {
  if (window.__studioAvatarFallback) return;
  window.__studioAvatarFallback = true;
  window.addEventListener('error', e => {
    const el = e.target;
    if (!el || el.tagName !== 'IMG' || el.dataset.stFallback) return;
    const m = /assets\/avatars\/([a-z0-9-]+)\.png/i.exec(el.src || '');
    if (m && window.__studioAvatars && window.__studioAvatars[m[1]]) {
      el.dataset.stFallback = '1';
      el.src = window.__studioAvatars[m[1]];
    }
  }, true); // capture: image error events don't bubble
}

// ═══════════════════════════════════════════════════════════════════════
// CSS — uses the simulator's own theme tokens so it matches the app
// ═══════════════════════════════════════════════════════════════════════
function _injectCSS() {
  if (document.getElementById('studio-css')) return;
  const s = document.createElement('style');
  s.id = 'studio-css';
  s.textContent = `
  #studio-bar{display:flex;align-items:center;gap:12px;padding:10px 4px;flex-wrap:wrap}
  .st-seg{display:inline-flex;background:var(--surface,#1c1c22);border:1px solid var(--border,#333);border-radius:999px;padding:3px}
  .st-seg button{border:0;background:transparent;color:var(--muted,#9a9);font:inherit;font-size:13px;padding:6px 14px;border-radius:999px;cursor:pointer}
  .st-seg button.active{background:var(--accent,#f4b23e);color:#151119;font-weight:700}
  .st-server{font-size:11px;font-family:ui-monospace,monospace;letter-spacing:.02em}
  .st-server.up{color:#46b17b}.st-server.down{color:var(--muted,#889)}
  #studio-panel{display:none}
  #tab-cast.studio-active>.form-panel,#tab-cast.studio-active>.cast-panel,#tab-cast.studio-active>#cast-room{display:none !important}
  #tab-cast.studio-active #studio-panel{display:block}
  #tab-cast.tab-content.active.studio-active{display:block;overflow-y:auto}
  .st-wrap{display:grid;grid-template-columns:minmax(280px,1fr) minmax(340px,1.1fr);gap:18px;align-items:start;padding:4px 2px 60px}
  @media(max-width:860px){.st-wrap{grid-template-columns:1fr}}
  .st-pool-head{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap}
  /* retired characters: kept in the DB with their history, hidden from casting */
  #st-retired-panel{background:var(--surface,#1c1c22);border:1px solid var(--border,#333);border-radius:10px;padding:10px;margin-bottom:12px}
  .st-retired-note{font-size:12px;color:var(--muted,#9a9);margin-bottom:8px}
  .st-retired-note.err{color:#e5843e}
  .st-retired-row{display:flex;align-items:center;gap:9px;padding:6px 4px;border-top:1px solid var(--border,#2a2a30)}
  .st-retired-row:first-of-type{border-top:none}
  .st-retired-row img{width:30px;height:30px;border-radius:50%;object-fit:cover;background:#0003}
  .st-retired-name{font-weight:700;font-size:13px}
  .st-retired-arch{font-size:11px;color:var(--muted,#9a9);flex:1}
  .st-unretire{font-size:11px!important;padding:5px 10px!important}
  /* archetype filter — colour-coded chips, kept tight so they cost few rows */
  .st-archbar{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 11px}
  .st-arch{background:var(--surface,#1c1c22);border:1px solid var(--border,#333);border-left:3px solid var(--c,#64748b);
    border-radius:6px;color:var(--muted,#9a9);cursor:pointer;font:inherit;font-size:10.5px;line-height:1.35;
    padding:3px 7px;text-transform:capitalize;transition:color .12s,background .12s;white-space:nowrap}
  .st-arch:hover{color:inherit;background:#ffffff0d}
  .st-arch b{color:inherit;font-variant-numeric:tabular-nums;margin-left:3px;opacity:.85}
  .st-arch i{font-style:normal;font-size:9.5px;margin-left:3px;opacity:.5;font-variant-numeric:tabular-nums}
  .st-arch.on{background:color-mix(in srgb, var(--c,#64748b) 22%, transparent);
    border-color:var(--c,#64748b);color:inherit;font-weight:700}
  .st-arch.on b,.st-arch.on i{opacity:1}
  .st-arch.empty{opacity:.3}
  .st-arch-all{border-left-color:var(--muted,#9a9)}
  /* studio view tabs */
  .st-views{display:flex;gap:6px;margin:0 0 14px;border-bottom:1px solid var(--border,#333)}
  .st-view{background:none;border:1px solid transparent;border-bottom:none;border-radius:8px 8px 0 0;color:var(--muted,#9a9);cursor:pointer;font:inherit;font-size:13px;font-weight:700;margin-bottom:-1px;padding:9px 16px}
  .st-view:hover{color:inherit;background:#ffffff0a}
  .st-view.on{color:inherit;background:var(--surface,#1c1c22);border-color:var(--border,#333)}
  /* avatar management view */
  .st-av-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px}
  .st-av-search{max-width:240px}
  .st-av-filters{display:flex;gap:4px;margin-left:auto}
  .st-av-f{background:var(--surface,#1c1c22);border:1px solid var(--border,#333);border-radius:999px;color:var(--muted,#9a9);cursor:pointer;font:inherit;font-size:11px;padding:5px 12px}
  .st-av-f.on{background:var(--accent,#f4b23e);border-color:var(--accent,#f4b23e);color:#1a1a1a;font-weight:700}
  .st-av-count{color:var(--muted,#9a9);font-size:11.5px;margin:0 0 10px}
  .st-av-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px}
  .st-av-item{background:var(--surface,#1c1c22);border:1px solid var(--border,#333);border-radius:10px;padding:9px;position:relative;text-align:center}
  .st-av-item.in-use{border-color:#3f4a5a}
  .st-av-thumb{display:block;margin:0 auto 6px;width:64px;height:64px;border-radius:50%;overflow:hidden;background:#0003}
  .st-av-thumb img{width:100%;height:100%;object-fit:cover}
  .st-av-thumb.miss{outline:1px dashed #e5484d55}
  .st-av-slug{display:block;font-size:11.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .st-av-owner{display:block;color:var(--muted,#9a9);font-size:10.5px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .st-av-item.in-use .st-av-owner{color:#8fa6c4}
  .st-av-del{position:absolute;top:5px;right:5px;font-size:11px!important;padding:3px 7px!important;opacity:0;transition:opacity .12s}
  .st-av-item:hover .st-av-del,.st-av-del:focus-visible{opacity:1}
  .st-av-item:not(.in-use) .st-av-del:hover{background:#e5484d22;border-color:#e5484d;color:#ff8a8f}
  /* avatar library management */
  .st-lib-add,.st-lib-del{font-size:11px!important;padding:6px 10px!important}
  .st-lib-del.on{background:#e5484d22;border-color:#e5484d;color:#ff8a8f}
  .st-lib-grid.del-mode{outline:1px dashed #e5484d;outline-offset:3px;border-radius:8px}
  .st-lib-grid.del-mode .st-lib-item{cursor:not-allowed}
  .st-lib-grid.del-mode .st-lib-item:hover{background:#e5484d22;outline:1px solid #e5484d}
  .st-lib-grid.del-mode .st-lib-item:hover .st-lib-name::after{content:' 🗑'}
  .st-input{width:100%;background:var(--surface,#1c1c22);border:1px solid var(--border,#333);border-radius:8px;color:inherit;font:inherit;font-size:13px;padding:8px 10px}
  .st-input:focus{outline:2px solid var(--accent,#f4b23e);outline-offset:0}
  .st-balance{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
  .st-chip{font-family:ui-monospace,monospace;font-size:11px;color:var(--muted,#9a9);background:var(--surface,#1c1c22);border:1px solid var(--border,#333);border-radius:999px;padding:3px 9px}
  .st-chip-warn{color:#e5843e}
  .st-casts{display:flex;flex-direction:column;gap:8px;margin-bottom:10px}
  .st-casts-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
  .st-casts-lab{font-size:11px;font-weight:700;color:var(--muted,#9a9);text-transform:uppercase;letter-spacing:.05em;margin-right:2px}
  .st-cast-chip{display:inline-flex;align-items:center;gap:5px;background:var(--surface,#1c1c22);border:1px solid var(--border,#333);border-radius:999px;color:inherit;font:inherit;font-size:12px;padding:5px 11px;cursor:pointer}
  .st-cast-chip:hover{border-color:var(--accent,#f4b23e)}
  .st-cast-chip.active{background:var(--accent,#f4b23e);color:#151119;font-weight:700;border-color:transparent}
  .st-cast-n{font-family:ui-monospace,monospace;font-size:10px;opacity:.7}
  .st-cast-new{border-style:dashed;color:var(--muted,#9a9)}
  .st-cast-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;background:var(--surface,#1c1c22);border:1px solid var(--border,#333);border-radius:10px;padding:8px 10px}
  .st-cast-title{font-size:12px;font-weight:600}
  .st-cast-btns{display:flex;gap:6px;flex-wrap:wrap}
  .st-star{position:absolute;top:4px;left:4px;z-index:2;font-size:15px;line-height:1;color:var(--muted,#889);text-shadow:0 1px 3px rgba(0,0,0,.7);cursor:pointer}
  .st-star.on{color:var(--accent,#f4b23e)}
  .st-card.member{border-color:var(--accent,#f4b23e)}
  .st-analysis{flex:1 1 100%;display:flex;flex-direction:column;gap:9px;background:var(--surface,#1c1c22);border:1px solid var(--border,#333);border-radius:10px;padding:11px 12px}
  .st-an-head{font-size:12px;font-weight:700;letter-spacing:.02em}
  .st-an-cols{display:grid;grid-template-columns:1fr 132px;gap:14px}
  @media(max-width:560px){.st-an-cols{grid-template-columns:1fr}}
  .st-an-bars{display:flex;flex-direction:column;gap:4px}
  .st-an-bar{display:grid;grid-template-columns:96px 1fr 16px;align-items:center;gap:6px}
  .st-an-bar-lab{font-family:ui-monospace,monospace;font-size:9.5px;color:var(--c);text-transform:uppercase;letter-spacing:.02em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .st-an-bar-track{height:6px;background:var(--track,#2a2a33);border-radius:99px;overflow:hidden}
  .st-an-bar-fill{display:block;height:100%;border-radius:99px}
  .st-an-bar-n{font-family:ui-monospace,monospace;font-size:10px;color:var(--muted,#9a9);text-align:right}
  .st-an-side{display:flex;flex-direction:column;gap:7px}
  .st-an-stat{display:flex;flex-direction:column;line-height:1}
  .st-an-stat b{font-size:22px}
  .st-an-stat span{font-size:9px;color:var(--muted,#9a9);text-transform:uppercase;letter-spacing:.08em}
  .st-an-gender{font-size:11px;color:var(--muted,#9a9)}
  .st-an-mix{display:flex;flex-direction:column;gap:2px;font-family:ui-monospace,monospace;font-size:10px}
  .st-an-mix-v{color:#e5484d}.st-an-mix-h{color:#46b17b}.st-an-mix-c{color:#f5a623}
  .st-an-warns{display:flex;flex-wrap:wrap;gap:5px}
  .st-an-warn{font-size:10.5px;padding:2px 8px;border-radius:999px;border:1px solid var(--border,#333);color:#e5843e}
  .st-an-crit{color:#fff;background:#e5484d;border-color:transparent}
  .st-an-ok{color:#46b17b;border-color:#46b17b55}
  .st-chem{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  @media(max-width:560px){.st-chem{grid-template-columns:1fr}}
  .st-chem-col{display:flex;flex-direction:column;gap:3px;border-radius:8px;padding:7px 9px;border:1px solid var(--border,#333)}
  .st-chem-good{border-left:3px solid #46b17b}
  .st-chem-bad{border-left:3px solid #e5484d}
  .st-chem-h{font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted,#9a9)}
  .st-chem-pair{font-size:11px}
  .st-chem-note{font-size:11px;color:var(--muted,#9a9);font-style:italic}
  .st-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:10px}
  .st-card{position:relative;background:var(--surface,#1c1c22);border:1px solid var(--border,#333);border-radius:12px;padding:8px 6px 10px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;color:inherit}
  .st-card:hover{border-color:var(--accent,#f4b23e)}
  .st-card.sel{border-color:var(--accent,#f4b23e);box-shadow:0 0 0 2px var(--accent,#f4b23e) inset}
  .st-card img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;background:var(--border,#333)}
  .st-card-name{font-size:12px;font-weight:600;text-align:center;line-height:1.1}
  .st-card-arch{font-family:ui-monospace,monospace;font-size:8.5px;letter-spacing:.03em;color:#fff;background:var(--c,#64748b);padding:1px 6px;border-radius:999px}
  .st-card-mine{position:absolute;top:5px;right:5px;font-size:10px;background:var(--accent,#f4b23e);color:#151119;border-radius:50%;width:16px;height:16px;display:grid;place-items:center}
  .st-empty{color:var(--muted,#889);font-size:13px;padding:8px}
  .st-sheet{background:var(--surface,#1c1c22);border:1px solid var(--border,#333);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:13px}
  .st-sheet-head{display:flex;gap:14px;align-items:flex-start}
  .st-portrait{width:96px;height:96px;flex:0 0 auto;border-radius:12px;overflow:hidden;background:var(--border,#333);border:1px solid var(--border,#333);display:grid;place-items:center}
  .st-portrait img{width:100%;height:100%;object-fit:cover}
  .st-portrait-ph{font-size:10px;color:var(--muted,#889)}
  .st-idfields{flex:1;display:flex;flex-direction:column;gap:8px;min-width:0}
  .st-l{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--muted,#9a9);font-weight:600}
  .st-l-txt{font-size:12px;color:var(--muted,#9a9);font-weight:600}
  .st-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .st-hint{font-weight:400;font-style:italic;opacity:.8}
  .st-avatar-ctrls{display:flex;gap:8px;flex-wrap:wrap}
  .st-btn{white-space:nowrap}
  .st-file{cursor:pointer}
  .st-lib{display:flex;flex-direction:column;gap:9px;padding:10px;background:var(--surface,#1c1c22);border:1px solid var(--border,#333);border-radius:10px}
  /* grid, not flex-wrap: the letters wrap inside their own cell instead of
     pushing the ‹ › arrows onto a second line */
  .st-lib-bar{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:8px}
  @media(max-width:620px){
    .st-lib-bar{grid-template-columns:auto minmax(0,1fr) auto}
    .st-lib-search{grid-column:1/-1;flex:1 1 auto}
  }
  /* one row that scrolls rather than wrapping — a wrapped strip orphans the
     last letter onto its own line at most panel widths */
  .st-lib-letters{display:flex;gap:2px;flex-wrap:nowrap;min-width:0;overflow-x:auto;scrollbar-width:none}
  .st-lib-letters::-webkit-scrollbar{display:none}
  .st-lib-letter{font:inherit;font-size:11px;font-weight:700;flex:0 0 auto;min-width:22px;height:24px;padding:0 3px;border-radius:6px;border:1px solid transparent;background:none;color:var(--muted,#9a9);cursor:pointer;line-height:1}
  .st-lib-letter:hover{color:inherit;border-color:var(--border,#333)}
  .st-lib-letter.on{background:var(--accent,#f4b23e);color:#151119}
  .st-lib-nav{font:inherit;font-size:16px;line-height:1;width:26px;height:26px;flex:0 0 auto;border-radius:50%;border:1px solid var(--border,#333);background:none;color:inherit;cursor:pointer;display:grid;place-items:center}
  .st-lib-nav:hover:not([disabled]){border-color:var(--accent,#f4b23e);color:var(--accent,#f4b23e)}
  .st-lib-nav[disabled]{opacity:.28;cursor:default}
  .st-lib-search{flex:0 1 150px;min-width:110px;font-size:12px;padding:5px 8px}
  .st-lib-count{font-size:10px;font-family:ui-monospace,monospace;color:var(--muted,#889);margin:0}
  /* fixed tile width + square thumb: the row height can never collapse */
  .st-lib-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:11px 9px;max-height:296px;overflow-y:auto;overflow-x:hidden;padding:2px 4px 2px 2px;align-content:start}
  .st-lib-item{display:flex;flex-direction:column;gap:4px;padding:0;border:0;background:none;color:inherit;cursor:pointer;min-width:0}
  .st-lib-thumb{display:block;width:100%;aspect-ratio:1;border-radius:9px;overflow:hidden;border:1px solid var(--border,#333);background:var(--border,#333)}
  .st-lib-thumb img{width:100%;height:100%;object-fit:cover;object-position:center;display:block}
  .st-lib-thumb.miss{display:grid;place-items:center}
  .st-lib-thumb.miss img{display:none}
  .st-lib-thumb.miss::after{content:'?';font-size:18px;color:var(--muted,#889)}
  .st-lib-item:hover .st-lib-thumb{border-color:var(--accent,#f4b23e)}
  .st-lib-item:focus-visible .st-lib-thumb{outline:2px solid var(--accent,#f4b23e);outline-offset:1px}
  .st-lib-name{font-size:9.5px;line-height:1.15;color:var(--muted,#9a9);text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .st-lib-item:hover .st-lib-name{color:inherit}
  .st-genders{border-radius:8px}
  .st-genders button{font-size:11px;padding:6px 8px}
  .st-stats-head{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
  .st-stat-btns{display:flex;gap:6px;flex-wrap:wrap}
  .st-stats{display:grid;grid-template-columns:1fr 220px;gap:14px;align-items:center}
  @media(max-width:560px){.st-stats{grid-template-columns:1fr}}
  .st-sliders{display:flex;flex-direction:column;gap:7px}
  .st-stat{display:grid;grid-template-columns:34px 1fr 22px;align-items:center;gap:8px}
  .st-stat-lab{font-family:ui-monospace,monospace;font-size:10px;color:var(--muted,#9a9)}
  .st-slider{width:100%;accent-color:var(--accent,#f4b23e)}
  .st-stat-val{font-family:ui-monospace,monospace;font-size:13px;font-weight:700;text-align:right;font-variant-numeric:tabular-nums}
  .st-radar-wrap{display:grid;place-items:center}
  .st-area{resize:vertical;min-height:56px;font-family:inherit}
  .st-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:2px}
  .st-btn{background:var(--surface,#26262e);border:1px solid var(--border,#333);border-radius:8px;color:inherit;font:inherit;font-size:12px;padding:8px 12px;cursor:pointer}
  .st-btn:hover{border-color:var(--accent,#f4b23e)}
  .st-btn.st-sm{font-size:11px;padding:5px 9px}
  .st-primary{background:var(--accent,#f4b23e);color:#151119;border-color:transparent;font-weight:700}
  .st-lg{padding:10px 18px;font-size:14px}
  .st-danger{color:#e5484d;border-color:#e5484d55}
  .st-save-note{font-size:12px;font-family:ui-monospace,monospace}
  .st-save-note.ok{color:#46b17b}.st-save-note.err{color:#e5484d}
  .st-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(20px);background:var(--surface,#26262e);border:1px solid var(--border,#333);border-radius:10px;padding:11px 16px;font-size:13px;box-shadow:0 12px 40px rgba(0,0,0,.5);opacity:0;pointer-events:none;transition:.22s;z-index:9999;max-width:80vw}
  .st-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
  .st-toast.st-ok{border-left:3px solid #46b17b}.st-toast.st-err{border-left:3px solid #e5484d}.st-toast.st-warn{border-left:3px solid #e5843e}
  @media(prefers-reduced-motion:reduce){.st-toast{transition:none}}
  `;
  document.head.appendChild(s);
}

// self-init when imported (main.js pulls this module in)
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', studioInit);
  else studioInit();
}
