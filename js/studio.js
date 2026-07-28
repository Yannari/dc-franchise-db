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
const STUDIO_API_PROD = ''; // e.g. 'https://dc-studio.<you>.workers.dev'
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

// image → square-cropped, downscaled PNG data URI
function _imgToAvatar(src, size = 512) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2, sy = (img.height - s) / 2;
      const c = document.createElement('canvas'); c.width = c.height = size;
      c.getContext('2d').drawImage(img, sx, sy, s, s, 0, 0, size, size);
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
}

function _setMode(create) {
  const tab = document.getElementById('tab-cast');
  if (!tab) return;
  tab.classList.toggle('studio-active', create);
  const bar = document.getElementById('studio-bar');
  if (bar) bar.querySelectorAll('.st-seg button').forEach(b => b.classList.toggle('active', (b.dataset.mode === 'create') === create));
}

export function studioEnter() { _setMode(true); renderStudio(); }
export function studioExit() {
  _setMode(false);
  try { window.renderCastRoom && window.renderCastRoom(); } catch {}
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
// RENDER: pool (left) + editor (right)
// ═══════════════════════════════════════════════════════════════════════
export function renderStudio() {
  const panel = document.getElementById('studio-panel');
  if (!panel) return;
  if (!_draft) _draft = _blankChar();
  panel.innerHTML =
    `<div class="st-wrap">
       <section class="st-pool">
         <div class="st-pool-head">
           <button type="button" id="st-new" class="st-btn st-primary">＋ New character</button>
           <input type="search" id="st-search" class="st-input" placeholder="Filter roster…">
           <button type="button" id="st-export" class="st-btn" title="Download merged franchise_roster.json + voice-profiles.json + new avatar PNGs to commit">⬇ Export for repo</button>
         </div>
         <div id="st-casts" class="st-casts"></div>
         <div id="st-balance" class="st-balance"></div>
         <div id="st-grid" class="st-grid"></div>
       </section>
       <section class="st-editor" id="st-editor"></section>
     </div>`;
  panel.querySelector('#st-new').addEventListener('click', () => { _draft = _blankChar(); renderStudio(); });
  panel.querySelector('#st-search').addEventListener('input', e => _renderGrid(e.target.value));
  panel.querySelector('#st-export').addEventListener('click', _exportRepo);
  _renderCasts();
  _renderGrid('');
  _renderBalance();
  _renderEditor();
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
  const list = _roster().filter(p => !ql || p.name.toLowerCase().includes(ql) || (p.archetype || '').includes(ql));
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
  }).join('') || `<p class="st-empty">No matches.</p>`;
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
     <span class="st-chip st-chip-warn">${villains} schemers/villains</span>
     <span class="st-hint">Open or create a cast to analyze a lineup.</span>`;
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

async function _toggleLibrary() {
  const box = document.getElementById('st-lib'); if (!box) return;
  if (!box.hidden) { box.hidden = true; return; }
  if (!_avatarList.length) { try { _avatarList = (await (await fetch('/api/avatars', { cache: 'no-store' })).json()).avatars || []; } catch {} }
  // fallback: the 166 roster slugs all have avatars — works on static hosting too
  if (!_avatarList.length) _avatarList = _roster().map(p => p.slug).filter(Boolean);
  box.innerHTML = _avatarList.length
    ? _avatarList.map(s => `<button type="button" class="st-lib-item" data-s="${_esc(s)}" title="${_esc(s)}"><img src="assets/avatars/${_esc(s)}.png" alt="" loading="lazy" onerror="this.parentElement.remove()"></button>`).join('')
    : '<p class="st-empty">No avatars available yet.</p>';
  box.hidden = false;
  box.querySelectorAll('.st-lib-item').forEach(b => b.addEventListener('click', async () => {
    try { _draft.avatarDataUri = await _imgToAvatar(`assets/avatars/${b.dataset.s}.png`); _refreshPortrait(); box.hidden = true; }
    catch { _toast('Could not load that avatar', 'err'); }
  }));
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

  // 3) write repo files if a backend is up (local serve.py or deployed Worker)
  let wrote = null;
  if (_serverUp) {
    try {
      const r = await fetch(_apiUrl('/api/character'), {
        method: 'POST', headers: _apiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ roster: entry, voice: { name: d.name, text: composedVoice }, avatar: { slug: d.slug, dataUri: d.avatarDataUri || '' } }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'write failed');
      wrote = j.wrote;
    } catch (e) { _toast('Saved locally, but repo write failed: ' + e.message, 'warn'); }
  }

  // 4) refresh surfaces
  _renderGrid(document.getElementById('st-search')?.value || '');
  _renderBalance();
  try { if (document.getElementById('tab-cast')?.classList.contains('cast-room-active')) window.renderCastRoom && window.renderCastRoom(); } catch {}

  const where = wrote ? `wrote ${wrote.length} repo file${wrote.length===1?'':'s'}` : (_serverUp ? 'saved' : 'saved (browser-only — run serve.py to write repo files)');
  _toast(`${d.name} saved — ${where}`, 'ok');
  if (note) { note.textContent = wrote ? '✓ ' + wrote.join(', ') : '✓ live in the cast pool'; note.className = 'st-save-note ok'; }
}

function _fail(note, msg) { if (note) { note.textContent = msg; note.className = 'st-save-note err'; } _toast(msg, 'err'); }

async function _delete() {
  const d = _draft;
  if (!d.slug || !confirm(`Remove ${d.name} from the local pool? (Repo files are not deleted — commit removal manually.)`)) return;
  const arr = _roster().filter(p => p.slug !== d.slug);
  _persistRoster(arr);
  try { await _idbDel('characters', d.slug); } catch {}
  if (window.__studioAvatars) delete window.__studioAvatars[d.slug];
  _draft = _blankChar();
  renderStudio();
  _toast(`${d.name} removed from local pool`, 'ok');
}

// ═══════════════════════════════════════════════════════════════════════
// CASTS — named collections you compose, then load into a season
// ═══════════════════════════════════════════════════════════════════════
function _gridRefresh() { _renderGrid(document.getElementById('st-search')?.value || ''); _renderBalance(); }

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
  .st-pool-head{display:flex;gap:8px;margin-bottom:10px}
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
  .st-lib{display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:8px;max-height:300px;overflow:auto;padding:8px;background:var(--surface,#1c1c22);border:1px solid var(--border,#333);border-radius:10px}
  .st-lib-item{padding:0;border:1px solid var(--border,#333);border-radius:7px;overflow:hidden;cursor:pointer;background:none;aspect-ratio:1}
  .st-lib-item:hover{border-color:var(--accent,#f4b23e)}
  .st-lib-item img{width:100%;height:100%;object-fit:cover;object-position:center;display:block}
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
