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

import { composeVoice, stripBioLead, parseBio, splitOrigin } from './bio.js';
import { PROFILE_GROUPS, validatePublishedProfile, selectProfileVoice, diffProfileCandidates, applyCandidateSelection } from './profile-import.js';
import { appearancesFor, ageAnchor, birthFromCanonAge, continuityIndex, continuitySummary, continuityTies } from './continuity.js';
import { ageNow, franchiseNow } from './franchise-calendar.js';
import { INTERVIEW_QUESTIONS, parseInterview, serializeInterview }
  from './casting-interview.js';
// The endpoint resolver, not a second hardcoded URL — it already handles the
// localStorage and globalThis overrides, and pointing at the wrong worker fails
// silently by falling through to its default branch.
import { writerEndpoint } from './social/writer.js';
// The registry itself, not window.shows — nothing sets that on the page the
// Studio runs in, and reading it there left the portrait panel's show dropdown
// with nothing in it but "All shows".
import { SHOWS } from './shows.js';

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

// ── the Drag Race craft block ──────────────────────────────────────────
//
// Authored per character and read only by that show's judging pipeline. Kept
// out of the nine stats on purpose: those are the PERSON and every show reads
// them, these are what a panel scores. See js/dr/queen.js.
const DRAG_KEYS = ['acting', 'comedy', 'dance', 'design', 'runway', 'lipsync', 'singing'];
const DRAG_STYLE_LIST = ['pageant', 'comedy', 'fashion', 'camp', 'club-kid', 'spooky',
  'broadway', 'dancer', 'glamour', 'art'];
const _emptyDrag = () => ({
  ...Object.fromEntries(DRAG_KEYS.map(k => [k, 5])), style: '', traits: [], voice: '',
});
// Whether anything was actually authored. An untouched block must NOT be sent:
// a row of default fives is indistinguishable from a considered choice, and
// storing it would claim every legacy character had been given a craft line.
const _hasDrag = d => !!d && !!d.drag && (
  DRAG_KEYS.some(k => Number(d.drag[k]) !== 5)
  || !!d.drag.style
  || (Array.isArray(d.drag.traits) && d.drag.traits.length)
  || !!(d.drag.voice || '').trim());
const _dragOf = k => (_draft && _draft.drag && _draft.drag[k]) || 5;

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
/** How many interview questions have an answer — shown on the fold. */
const _ivCount = d => INTERVIEW_QUESTIONS
  .filter(x => String(d.interview?.[x.key] ?? '').trim()).length;

const _esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
function _slugify(name) { return String(name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function _statHue(v) { v = Math.max(1, Math.min(10, v)); let h; if (v <= 5.5) h = 4 + ((v - 1) / 4.5) * 38; else h = 42 + ((v - 5.5) / 4.5) * 108; return `hsl(${h.toFixed(0)} 70% 50%)`; }
function _avatarSrc(slug) { return (window.__studioAvatars && window.__studioAvatars[slug]) || `assets/avatars/${slug}.png`; }
function _blankChar() {
  return {
    name:'', slug:'', age:'', gender:'nb', sexuality:'straight', archetype:'',
    // Three fields rather than one origin box. "Asian Canadian" is two facts,
    // and a trivia question asking for one of them cannot use a column holding
    // both. `descriptor` keeps anything that is neither — "Scouse" is worth
    // knowing and belongs to no vocabulary.
    ethnicity:'', nationality:'', descriptor:'',
    // The bio. `birthdate` is authoritative over `age` when both are present —
    // an age is a number that silently rots, a date does not.
    birthdate:'', hometown:'', occupation:'', backstory:'', personality:'',
    continuityNote:'',
    // The casting interview, held as { key: answer } while it is being edited
    // and serialised on save. See js/casting-interview.js.
    interview: {}, profileSources:{},
    _editingSlug: null,
    voice:'', avatarDataUri:'', portraits: [], removePortraits: [], stats: Object.fromEntries(STAT_KEYS.map(k => [k, 5])),
    drag: _emptyDrag(),
  };
}

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

// Cast-analysis panel: which sections are open. An all-returnee cast produces a
// pair for nearly every duo in the house — BB1's 17 members print ~90 of them —
// so chemistry stays shut until asked for, and the archetype bars remember
// whatever was chosen last. Only the warning chips are always on screen,
// because those are the part that says do something.
const _flag = (k, dflt) => { try { const v = localStorage.getItem(k); return v === null ? dflt : v === '1'; } catch { return dflt; } };
let _anOpen = _flag('studio_an_open', true);      // archetype bars + stat side panel
let _chemOpen = _flag('studio_chem_open', false); // prior-season history
const _chemPlayers = new Set();                   // names whose pairs are expanded

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
async function _rosterPush(entry) {
  let r, body;
  try {
    r = await fetch(_apiUrl('/api/roster'), {
      method: 'POST', headers: _apiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(entry),
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
    // Re-derive from the repo rather than trusting the call: this is what turns
    // a failed publish into something visible instead of a missed toast.
    _refreshPublishStatus();
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
export async function syncSeasonDataFromRepo() {
  const btn = document.getElementById('season-sync-btn');
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
    if (btn) { btn.disabled = false; btn.textContent = '🔄 Re-sync season data'; }
  }
}

/**
 * Ask the site whether it matches the database, and say so in a line that
 * stays on screen. A publish that silently failed shows up here on the next
 * look, instead of only in a toast you had to catch.
 */
async function _refreshPublishStatus() {
  const el = document.getElementById('st-pubstatus');
  if (!el) return;
  if (!_apiBase()) { el.textContent = ''; return; }
  el.textContent = 'checking the site…';
  el.className = 'st-pubstatus';
  try {
    const r = await fetch(_apiUrl('/api/roster/status'), { cache: 'no-store' });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'status failed');

    if (j.inSync) {
      el.className = 'st-pubstatus ok';
      el.textContent = `✓ site matches the database — ${j.publishedCount} characters published`;
    } else {
      const bits = [];
      if (j.added.length) bits.push(`${j.added.length} new`);
      if (j.changed.length) bits.push(`${j.changed.length} edited`);
      if (j.removed.length) bits.push(`${j.removed.length} removed`);
      el.className = 'st-pubstatus warn';
      el.textContent = `● ${j.pending} unpublished change${j.pending === 1 ? '' : 's'} (${bits.join(', ')}) — press Publish`;
      el.title = [
        j.added.length ? 'new: ' + j.added.join(', ') : '',
        j.changed.length ? 'edited: ' + j.changed.join(', ') : '',
        j.removed.length ? 'removed: ' + j.removed.join(', ') : '',
      ].filter(Boolean).join('\n');
    }
    _d1Dirty = !j.inSync;
    _updatePublishBtn();
  } catch (e) {
    el.className = 'st-pubstatus warn';
    el.textContent = `couldn't check the site (${e.message})`;
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
           <button type="button" id="st-export" class="st-btn" title="Download merged franchise_roster.json + voice-profiles.json + new avatar PNGs to commit">⬇ Export for repo</button>
         </div>
         <div id="st-pubstatus" class="st-pubstatus"></div>
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
  panel.querySelector('#st-publish').addEventListener('click', _rosterPublish);
  panel.querySelector('#st-retired').addEventListener('click', _toggleRetiredPanel);
  panel.querySelector('#st-never').addEventListener('click', () => {
    _rosterFilter = _rosterFilter === 'never' ? 'all' : 'never';
    _updateNeverBtn();
    _renderGrid(_rosterQuery);
  });
  _updatePublishBtn();
  _updateNeverBtn();
  _refreshPublishStatus();      // answers "did my last publish land?"
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
    _bindAnalysis(el);
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

/**
 * Open/close handlers for the analysis panel.
 *
 * The panel is small enough that a full re-render is cheaper than patching it,
 * and re-rendering keeps the chevrons, aria-expanded and titles in agreement
 * with the state without a second code path that has to remember to.
 */
function _bindAnalysis(el) {
  el.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => {
    const act = b.dataset.act;
    if (act === 'an-toggle') {
      _anOpen = !_anOpen;
      try { localStorage.setItem('studio_an_open', _anOpen ? '1' : '0'); } catch {}
    } else if (act === 'chem-toggle') {
      _chemOpen = !_chemOpen;
      try { localStorage.setItem('studio_chem_open', _chemOpen ? '1' : '0'); } catch {}
      if (!_chemOpen) _chemPlayers.clear();   // reopening starts rolled up again
    } else if (act === 'chem-player') {
      const n = b.dataset.name;
      if (_chemPlayers.has(n)) _chemPlayers.delete(n); else _chemPlayers.add(n);
    } else return;
    _renderBalance();
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
    <div class="st-an-head">
      <span>${_esc(castName)} — cast analysis · ${N} member${N === 1 ? '' : 's'}</span>
      <button type="button" class="st-an-toggle" data-act="an-toggle" aria-expanded="${_anOpen}"
        title="${_anOpen ? 'Hide' : 'Show'} archetype spread and stat summary">breakdown <i>${_anOpen ? '▾' : '▸'}</i></button>
    </div>
    ${_anOpen ? `<div class="st-an-cols">
      <div class="st-an-bars">${bars}</div>
      <div class="st-an-side">
        <div class="st-an-stat"><b>${avg}</b><span>avg stat</span></div>
        <div class="st-an-gender">♂ ${g.m || 0} · ♀ ${g.f || 0} · ⚧ ${g.nb || 0}</div>
        <div class="st-an-mix"><span class="st-an-mix-v">${villains} scheme</span><span class="st-an-mix-h">${nice} nice</span><span class="st-an-mix-c">${phys} threat</span></div>
      </div>
    </div>` : ''}
    <div class="st-an-warns">${warns.map(([k, t]) => `<span class="st-an-warn st-an-${k}">${_esc(t)}</span>`).join('')}</div>
    ${_chemistryHTML(members)}
  </div>`;
}

// Weakest relationship first in count, strongest first when a pair is printed.
// "Allied" is both the most numerous and the least interesting thing two
// returnees can share; a showmance or a burn is what actually moves a season,
// so those sort to the top of a player's list and set the pair's label when a
// duo has more than one thing on file.
const CHEM_KINDS = {
  showmance: { side: 'good', rank: 0, label: 'showmance' },
  ally:      { side: 'good', rank: 3, label: 'ally' },
  burn:      { side: 'bad',  rank: 1, label: 'burn' },
  rival:     { side: 'bad',  rank: 2, label: 'rivalry' },
};

/**
 * Prior-season history between the members of a cast.
 *
 * Rolled up per player rather than printed pair by pair. An all-returnee
 * lineup shares a season with itself, so the flat form is quadratic — BB1's 17
 * members produced ~90 pills of "X & Y allied" that nobody could read. The
 * rollup is one row per member, and the pairs are still there a click away.
 */
function _chemistryHTML(members) {
  if (typeof window.careerFor !== 'function') return '';
  const names = new Set(members.map(m => m.name));
  const key = (a, b) => [a, b].sort().join('||');
  const pairs = new Map();   // pair||side -> { a, b, kind, text }
  let hasHistory = false;

  // Strongest claim on a side wins: a duo who allied and then showmanced reads
  // as a showmance, not as both.
  const add = (a, b, kind, text) => {
    const { side, rank } = CHEM_KINDS[kind];
    const k = `${key(a, b)}|${side}`;
    const prev = pairs.get(k);
    if (prev && CHEM_KINDS[prev.kind].rank <= rank) return;
    pairs.set(k, { a, b, kind, text });
  };

  members.forEach(m => {
    let c = null; try { c = window.careerFor(m.name); } catch {}
    if (!c) return;
    hasHistory = true;
    const P = c.people || {};
    (P.allies || []).forEach(a => { if (a.name !== m.name && names.has(a.name)) add(m.name, a.name, 'ally', `${m.name} &amp; ${a.name} allied`); });
    (P.showmances || []).forEach(s => { if (names.has(s.partner)) add(m.name, s.partner, 'showmance', `${m.name} &amp; ${s.partner} — showmance${s.ended ? ' (ended)' : ''}`); });
    (P.betrayed || []).forEach(b => { if (names.has(b.name)) add(m.name, b.name, 'burn', `${m.name} burned ${b.name}`); });
    (P.betrayedBy || []).forEach(b => { if (names.has(b.name)) add(m.name, b.name, 'burn', `${b.name} burned ${m.name}`); });
    (P.rivals || []).forEach(r => { if (names.has(r.name)) add(m.name, r.name, 'rival', `${m.name} &amp; ${r.name} — rivals`); });
  });

  if (!hasHistory) return `<div class="st-chem-note">✦ No prior-season history among these members — a clean slate.</div>`;
  const all = [...pairs.values()];
  if (!all.length) return `<div class="st-chem-note">History on file, but no shared past among these members yet.</div>`;

  const totals = { showmance: 0, ally: 0, burn: 0, rival: 0 };
  const per = new Map();     // name -> { showmance, ally, burn, rival, pairs: [] }
  const blank = () => ({ showmance: 0, ally: 0, burn: 0, rival: 0, pairs: [] });
  all.forEach(p => {
    totals[p.kind]++;
    [p.a, p.b].forEach(n => {
      if (!per.has(n)) per.set(n, blank());
      const rec = per.get(n);
      rec[p.kind]++;
      rec.pairs.push(p);
    });
  });

  const sum = (r, side) => Object.keys(CHEM_KINDS).reduce((t, k) => t + (CHEM_KINDS[k].side === side ? r[k] : 0), 0);
  const rows = [...per.entries()]
    .sort((x, y) => (y[1].pairs.length - x[1].pairs.length) || x[0].localeCompare(y[0]))
    .map(([name, rec]) => {
      const open = _chemPlayers.has(name);
      const bits = [];
      if (rec.showmance) bits.push(`<span class="st-chem-n st-chem-love">${rec.showmance} showmance</span>`);
      if (rec.ally) bits.push(`<span class="st-chem-n st-chem-ok">${rec.ally} ally</span>`);
      if (rec.burn) bits.push(`<span class="st-chem-n st-chem-burn">${rec.burn} burn</span>`);
      if (rec.rival) bits.push(`<span class="st-chem-n st-chem-riv">${rec.rival} rival</span>`);
      // A tilt bar reads faster than the numbers do: all-green is somebody with
      // friends everywhere, all-red is somebody at war with the house.
      const good = sum(rec, 'good'), bad = sum(rec, 'bad'), tot = good + bad || 1;
      const detail = open
        ? `<div class="st-chem-pairs">${rec.pairs
            .slice().sort((p, q) => CHEM_KINDS[p.kind].rank - CHEM_KINDS[q.kind].rank)
            .map(p => `<span class="st-chem-pair st-chem-${CHEM_KINDS[p.kind].side}">${p.text}</span>`).join('')}</div>`
        : '';
      return `<div class="st-chem-row">
        <button type="button" class="st-chem-name${open ? ' on' : ''}" data-act="chem-player" data-name="${_esc(name)}"
          aria-expanded="${open}" title="${open ? 'Hide' : 'Show'} ${_esc(name)}'s shared history">
          <i class="st-chem-chev">${open ? '▾' : '▸'}</i><b>${_esc(name)}</b>
          <span class="st-chem-tilt"><span style="width:${(good / tot) * 100}%"></span></span>
          ${bits.join('')}
        </button>${detail}</div>`;
    }).join('');

  const part = (n, one, many) => n ? `${n} ${n === 1 ? one : many}` : '';
  const goodSum = [part(totals.ally, 'alliance', 'alliances'), part(totals.showmance, 'showmance', 'showmances')].filter(Boolean).join(' · ') || 'nothing';
  const badSum = [part(totals.burn, 'burn', 'burns'), part(totals.rival, 'rivalry', 'rivalries')].filter(Boolean).join(' · ') || 'nothing';

  return `<div class="st-chem-wrap">
    <button type="button" class="st-chem-toggle" data-act="chem-toggle" aria-expanded="${_chemOpen}"
      title="${_chemOpen ? 'Hide' : 'Show'} prior-season history between these members">
      <i class="st-chem-chev">${_chemOpen ? '▾' : '▸'}</i>
      <span class="st-chem-sum st-chem-ok">✦ ${goodSum}</span>
      <span class="st-chem-sum st-chem-burn">⚔ ${badSum}</span>
      <span class="st-chem-hint">${all.length} shared pair${all.length === 1 ? '' : 's'}</span>
    </button>
    ${_chemOpen ? `<div class="st-chem-rows">${rows}</div>` : ''}
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

// The voice profile is the ONLY field the episode writer reads, so the bio is
// folded into a lead-in in front of the personality prose — "21, Asian Canadian,
// lesbian." The editor and the database now hold those as FIELDS, and the
// sentence is a rendering of them rather than the only place they live.
//
// The composed string is what gets written to voice-profiles.json. An existing
// lead is always stripped before a new one is added: editing a character whose
// Studio draft was missing loaded their voice back out of voice-profiles.json,
// which already had one, so saving prepended a second and every edit added
// another ("24, Canadian. 24, Canada. Scarred, half-blind loner…").
// Composing and parsing the lead-in now lives in js/bio.js, because the same
// two operations are needed by the backfill script and by anything reading a
// published profile. A second copy here would be the third prefix map this
// project has had to reconcile.
function _composeVoice(d) {
  return composeVoice(d, stripBioLead(d.voice));
}

async function _editBySlug(slug) {
  const base = _roster().find(p => p.slug === slug);
  if (!base) return;
  const rich = await _idbGet('characters', slug);
  // Studio record wins; otherwise fall back to the existing voice-profiles.json
  // entry so editing a canon/hand-added character shows their real voice.
  const legacyVoice = await _existingVoice(base.name);
  const voice = selectProfileVoice({
    localVoice: rich?.voice || '',
    rosterVoice: base.voice || '',
    legacyVoice,
  });

  // WHERE THE BIO COMES FROM, in order of how much it can be trusted:
  //
  //   1. the roster row — real columns, once this character has been saved since
  //      the fields existed;
  //   2. the Studio draft in IndexedDB;
  //   3. the lead-in at the front of their voice profile.
  //
  // Three matters: twenty-five characters have had an age and an origin since
  // the day they were created, written into that sentence because it was the
  // only field the episode writer read. Parsing it back means nobody retypes
  // anything, and it fills in for every character published before the columns
  // existed.
  const parsed = parseBio(voice);
  const legacy = splitOrigin((rich && rich.origin) || '');
  const pick = (...xs) => xs.find(v => v !== undefined && v !== null && v !== '') ?? '';

  _draft = {
    // WHICH ROW THIS DRAFT IS, by slug — the one field a rename does not
    // touch. The save's collision check used to identify "a different
    // character" by NAME, so renaming (the one edit that changes a name) always
    // looked like a clash with yourself: correcting `aubrey` to `Aubrey` was
    // refused with 'Slug "aubrey" already used by aubrey'.
    _editingSlug: base.slug,
    name: base.name, slug: base.slug, gender: base.gender || 'nb',
    sexuality: pick(base.sexuality, rich && rich.sexuality, parsed.sexuality, 'straight'),
    archetype: base.archetype || '', stats: { ...Object.fromEntries(STAT_KEYS.map(k => [k, 5])), ...(base.stats || {}) },
    drag: { ..._emptyDrag(), ...(base.drag || {}) },
    age: pick(base.age, rich && rich.age, parsed.age),
    ethnicity: pick(base.ethnicity, rich && rich.ethnicity, parsed.ethnicity, legacy.ethnicity),
    nationality: pick(base.nationality, rich && rich.nationality, parsed.nationality, legacy.nationality),
    descriptor: pick(base.descriptor, rich && rich.descriptor, parsed.descriptor, legacy.descriptor),
    birthdate: pick(base.birthdate, rich && rich.birthdate),
    hometown: pick(base.hometown, rich && rich.hometown),
    occupation: pick(base.occupation, rich && rich.occupation),
    backstory: pick(base.backstory, rich && rich.backstory),
    personality: pick(base.personality, rich && rich.personality),
    profileSources: pick(rich && rich.profileSources, base.profileSources, {}),
    interview: Object.fromEntries(parseInterview(
      pick(base.castingInterview, rich && rich.castingInterview)).map(r => [r.key, r.a])),
    // The prose alone. The lead-in is rebuilt from the fields on save, so
    // keeping it here too would stack a second copy in front of the first.
    voice: parsed.prose,
    avatarDataUri: (rich && rich.avatarDataUri) || '',
    // The wardrobe is loaded from the catalog below, off the DRAFT's slug.
    portraits: [],
    removePortraits: [],
  };
  renderStudio();
  // ── off the DRAFT's slug, not the IndexedDB record's ──
  //
  // The old returnee check read `rich.slug`, and `rich` only exists for a
  // character saved through the Studio before. Aiden — who is in the roster,
  // has aiden-returnee.png sitting on the server, and has never been edited
  // here — produced `''`, so it looked for `-returnee.png`, found nothing, and
  // reported that a character with art had none. Same trap, so the same rule:
  // the draft's slug is the one that is always right.
  _loadDraftPortraits(_draft).then(() => {
    if (_draft) _refreshPortraitList();
  }).catch(() => { /* no catalog reachable; the panel stays empty */ });
  document.getElementById('st-editor')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── published profile import ──────────────────────────────────────────────
const _profileValue = value => value == null || value === '' ? '—' : typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
function _profileSnapshot(d) { return { ...d, castingInterview: serializeInterview(d.interview || {}) }; }
function _invalidProfileKeys(errors) {
  const keys = new Set();
  for (const error of errors) {
    const source = /^profileSources\.([^.[ ]+)/.exec(error);
    if (source) keys.add(source[1]);
    if (error.startsWith('birthdate ')) keys.add('birthdate');
    if (error.startsWith('Unknown stat:') || error.startsWith('Missing stat:') || STAT_KEYS.some(key => error.startsWith(`${key} `))) keys.add('stats');
  }
  return keys;
}
/**
 * One preview, however many sources are offering.
 *
 * There used to be two buttons — "Load published profile" and "Fetch profile
 * from wiki" — and comparing their field lists showed the wiki could offer
 * nothing the saved roster could not. So the choice was never about coverage.
 * It was about where a value came from, and that is a property of a ROW.
 *
 * Sources can arrive late. The saved roster is local and instant; the wiki
 * costs a call and a model. Rather than make the reader wait on the slow one
 * to see the fast one, the dialog opens on whatever is ready and re-renders
 * when the rest lands, keeping every tick and every choice already made.
 */
export function _openProfileFillPreview(currentDraft, options = {}) {
  if (!currentDraft) return null;
  const current = options.current ? currentDraft : _profileSnapshot(currentDraft);
  const sources = [];
  // key -> the value string the reader picked, so a re-render cannot undo a
  // choice they already made.
  const picked = new Map();
  const ticked = new Map();

  document.getElementById('st-profile-import')?.remove();
  const dialog = document.createElement('dialog');
  dialog.id = 'st-profile-import';
  dialog.className = 'st-profile-dialog';
  dialog.innerHTML = `<form method="dialog" class="st-profile-card">
    <header><div><h2>Fill in this profile</h2>
      <p>Every row says where it came from. Anything you have already written arrives unticked. Nothing is saved until you press Save character.</p></div>
      <button class="st-profile-x" value="cancel" aria-label="Close">&times;</button></header>
    <div id="st-profile-status" class="st-profile-status"></div>
    <div id="st-profile-errors" class="st-profile-errors" hidden></div>
    <div class="st-profile-groups" id="st-profile-groups"></div>
    <footer><button type="button" class="st-btn" id="st-profile-blanks">Fill blanks</button><button type="button" class="st-btn" id="st-profile-all">Select all</button><span></span><button type="button" class="st-btn" id="st-profile-cancel">Cancel</button><button type="button" class="st-btn st-primary" id="st-profile-apply">Apply selected</button></footer>
  </form>`;
  document.body.appendChild(dialog);

  const groupsEl = dialog.querySelector('#st-profile-groups');
  const statusEl = dialog.querySelector('#st-profile-status');
  const errorsEl = dialog.querySelector('#st-profile-errors');
  let rows = [];

  const remember = () => {
    for (const box of dialog.querySelectorAll('[data-profile-key]')) {
      ticked.set(box.dataset.profileKey, box.checked);
    }
    for (const radio of dialog.querySelectorAll('input[type=radio]:checked')) {
      picked.set(radio.name.replace(/^pick-/, ''), radio.value);
    }
  };

  const render = () => {
    rows = diffProfileCandidates(current, sources);

    // Validation runs per source: a bad stat block from one must not condemn
    // the other's perfectly good hometown.
    const invalidKeys = new Set();
    const errors = [];
    for (const source of sources) {
      const v = validatePublishedProfile(source.profile);
      if (!v.valid) {
        errors.push(...v.errors.map(e => `${source.label}: ${e}`));
        for (const k of _invalidProfileKeys(v.errors)) invalidKeys.add(k);
      }
    }
    errorsEl.hidden = !errors.length;
    errorsEl.innerHTML = errors.map(e => `<p>${_esc(e)}</p>`).join('');

    groupsEl.innerHTML = Object.keys(PROFILE_GROUPS).map(group => {
      const groupRows = rows.filter(r => r.group === group);
      if (!groupRows.length) return '';
      return `<section class="st-profile-group"><h3>${_esc(group)}</h3>${groupRows.map(row => {
        const unsafe = invalidKeys.has(row.key);
        const isTicked = ticked.has(row.key) ? ticked.get(row.key) : row.selected;
        const chosen = picked.get(row.key);
        const choiceIdx = Math.max(0, row.candidates.findIndex(c => _profileValue(c.value) === chosen));

        // One candidate reads as it always did. Two or more become a choice,
        // because preferring the reviewed one or the fresh one is a judgement
        // this code has no way to make for somebody else.
        const offer = row.candidates.length === 1
          ? `<span><b>${_esc(row.candidates[0].label)}</b><code>${_esc(_profileValue(row.candidates[0].value))}</code>
               ${_sourceChips(row.candidates[0].sources)}</span>`
          : row.candidates.map((c, i) => `<label class="st-profile-pick">
               <input type="radio" name="pick-${_esc(row.key)}" value="${_esc(_profileValue(c.value))}" ${i === choiceIdx ? 'checked' : ''}>
               <b>${_esc(c.label)}</b><code>${_esc(_profileValue(c.value))}</code>
               ${_sourceChips(c.sources)}</label>`).join('');

        return `<label class="st-profile-row${unsafe ? ' is-invalid' : ''}${row.candidates.length > 1 ? ' has-choice' : ''}">
          <input type="checkbox" data-profile-key="${_esc(row.key)}" ${isTicked && !unsafe ? 'checked' : ''} ${unsafe ? 'disabled' : ''}>
          <span class="st-profile-field">${_esc(row.key)}</span>
          <span class="st-profile-values"><span><b>Current</b><code>${_esc(_profileValue(row.current))}</code></span>${offer}</span>
        </label>`;
      }).join('')}</section>`;
    }).join('') || '<p class="st-empty">Nothing to add — this draft already has everything the sources offer.</p>';
  };

  const checks = () => [...dialog.querySelectorAll('[data-profile-key]:not(:disabled)')];
  dialog.querySelector('#st-profile-blanks').addEventListener('click', () => {
    const defaults = new Map(rows.map(r => [r.key, r.selected]));
    checks().forEach(box => { box.checked = !!defaults.get(box.dataset.profileKey); });
  });
  dialog.querySelector('#st-profile-all').addEventListener('click', () =>
    checks().forEach(box => { box.checked = true; }));

  const close = () => { if (typeof dialog.close === 'function') dialog.close(); dialog.remove(); };
  dialog.querySelector('#st-profile-cancel').addEventListener('click', close);
  dialog.addEventListener('cancel', e => { e.preventDefault(); close(); });
  dialog.addEventListener('close', () => dialog.remove(), { once: true });

  dialog.querySelector('#st-profile-apply').addEventListener('click', () => {
    remember();
    const picks = [];
    for (const box of checks()) {
      if (!box.checked) continue;
      const row = rows.find(r => r.key === box.dataset.profileKey);
      if (!row) continue;
      const want = picked.get(row.key);
      const candidate = row.candidates.find(c => _profileValue(c.value) === want) || row.candidates[0];
      picks.push({ key: row.key, value: candidate.value, sources: candidate.sources });
    }
    const applied = applyCandidateSelection(current, picks);
    if (options.onApply) options.onApply(applied);
    else {
      _draft = { ...currentDraft, ...applied };
      if (Object.hasOwn(applied, 'castingInterview')) {
        _draft.interview = Object.fromEntries(
          parseInterview(applied.castingInterview).map(r => [r.key, r.a]));
        delete _draft.castingInterview;
      }
      renderStudio();
    }
    close();
  });

  render();
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');

  return {
    dialog,
    /** Merge another source in, without losing anything already chosen. */
    addSource(source) {
      if (!source?.profile || !dialog.isConnected) return;
      remember();
      sources.push(source);
      render();
    },
    say(text) { if (statusEl) statusEl.textContent = text || ''; },
  };
}

function _sourceChips(sources) {
  if (!Array.isArray(sources) || !sources.length) return '';
  return `<span class="st-profile-sources">${sources.map(s =>
    `<span class="st-profile-source" data-kind="${_esc(s.kind)}" ${s.quote ? `title="${_esc(s.quote)}"` : ''}>${_esc(s.label)}</span>`).join('')}</span>`;
}

// ── Portraits ─────────────────────────────────────────────────────────────
//
// A character used to have room for exactly two images: their portrait, and a
// "returnee" one that the Cast Builder's Returning checkbox switched to. That
// was the whole wardrobe, it was hard-coded, and it belonged to one show by
// accident — Total Drama, because that was the only show when it was written.
//
// A character can now have any number of looks, each scoped to a show, and a
// season picks one. This panel is where they are registered: it writes the
// FILE and the catalog entry together, because art on disk that no season can
// choose is the failure the old returnee manifest existed to prevent.
const PORTRAIT_SHOW_ANY = 'global';

/** Show options for the dropdown, straight off the registry — never a list of
 *  our own, which is the duplication docs/ADDING-A-SHOW.md exists to stop. */
function _portraitShowOptions(selected) {
  const rows = [[PORTRAIT_SHOW_ANY, 'All shows']]
    .concat(Object.entries(SHOWS).map(([key, s]) => [key, (s && s.name) || key]));
  return rows.map(([key, label]) =>
    `<option value="${_esc(key)}"${key === selected ? ' selected' : ''}>${_esc(label)}</option>`).join('');
}

/** A show slug, from either a slug or the display name the continuity index
 *  reports. Returns null for anything the registry does not know. */
function _showKeyOf(show) {
  if (!show) return null;
  if (SHOWS[show]) return show;
  const hit = Object.entries(SHOWS).find(([, s]) => s && s.name === show);
  return hit ? hit[0] : null;
}

/** The filename a new portrait is saved under. Derived, never typed.
 *  The show part is the registry's own prefix (td / bb / tr) — the same one
 *  every filename and storage key in this project already uses — rather than a
 *  slice of the slug, which turns `big-brother` into `big`. */
function _portraitFilename(slug, show, id) {
  const prefix = (SHOWS[show] && SHOWS[show].prefix) || show;
  const stem = show === PORTRAIT_SHOW_ANY ? id : `${prefix}-${id}`;
  return `${slug}-${stem}.png`.replace(/-+/g, '-');
}

function _portraitThumb(p) {
  if (p.dataUri) return p.dataUri;
  if (!p.file) return '';
  return _avatarSrc(String(p.file).replace(/\.[a-z0-9]+$/i, ''));
}

/** Load this character's registered looks, minus the profile default. */
async function _loadDraftPortraits(d) {
  d.portraits = [];
  d.removePortraits = [];
  let cat = null;
  try { cat = await (await fetch('assets/avatars/portrait-catalog.json', { cache: 'no-cache' })).json(); } catch { /* no catalog yet */ }
  const entry = cat && cat.players && cat.players[d.slug];
  const defaults = (entry && entry.defaults) || {};
  for (const p of ((entry && entry.portraits) || [])) {
    if (!p || p.id === 'base' || p.show === PORTRAIT_SHOW_ANY) continue;
    d.portraits.push({
      id: p.id, show: p.show, label: p.label || '', file: p.file,
      registered: true, makeDefault: defaults[p.show] === p.id,
    });
  }
  // ── art on disk that nobody registered ──
  //
  // 27 characters have a `<slug>-returnee.png` from the old two-slot system.
  // The file is real and the catalog may not know about it, in which case no
  // season can pick it and nothing on any screen says why. Surface it as an
  // unregistered row so it can be filed properly in one save.
  const legacy = `${d.slug}-returnee`;
  if (d.slug && _avatarList.includes(legacy) && !d.portraits.some(p => p.file === `${legacy}.png`)) {
    // ── WHICH SHOW? THE FILENAME DOES NOT SAY ──
    //
    // `<slug>-returnee.png` predates shows existing at all, so guessing Total
    // Drama was just this project's history talking — and it put a Big
    // Brother houseguest's only alternate look on the wrong show. Their own
    // appearances are the honest evidence: somebody who has only ever played
    // one show almost certainly drew this for that show. Anyone else starts
    // on All shows, which offers it everywhere and prejudges nothing.
    let show = PORTRAIT_SHOW_ANY;
    try {
      // continuityIndex reports the show by its DISPLAY NAME ("Big Brother"),
      // and the catalog is keyed by slug. Writing the name straight through
      // produced a `show` no validator would accept.
      const played = [...new Set((await appearancesFor(d.slug)).map(a => _showKeyOf(a.show)).filter(Boolean))];
      if (played.length === 1) show = played[0];
    } catch { /* no continuity index; All shows is the safe answer */ }
    d.portraits.push({
      id: 'alt-1', show, label: 'Returning-player look',
      file: `${legacy}.png`, registered: false, unregistered: true, makeDefault: false,
    });
  }
}

function _renderPortraitRows(d) {
  if (!d.portraits || !d.portraits.length) {
    return `<p class="st-por-empty">No extra looks yet. ${_esc(d.name || 'This character')} is
      drawn with their profile portrait on every show.</p>`;
  }
  return d.portraits.map((p, i) => {
    const thumb = _portraitThumb(p);
    return `<div class="st-por-row" data-i="${i}">
      <label class="st-por-face">
        ${thumb ? `<img src="${_esc(thumb)}" alt="" onerror="this.style.display='none'">` : ''}
        <span class="st-por-face-ph">set image</span>
        <input type="file" accept="image/*" class="st-por-file" data-i="${i}" hidden>
      </label>
      <div class="st-por-fields">
        <div class="st-por-line">
          <select class="st-input st-por-show" data-i="${i}"
            title="Which seasons may pick this look. Changing it is safe: a season
that already used it recorded the FILE, so its own screens are unaffected.">
            ${_portraitShowOptions(p.show)}
          </select>
          <input class="st-input st-por-label" data-i="${i}" value="${_esc(p.label)}"
            placeholder="What this look is — &quot;Castle outfit&quot;">
        </div>
        <div class="st-por-meta">
          <code>${_esc(p.file || _portraitFilename(d.slug || 'slug', p.show, p.id || 'new'))}</code>
          ${p.unregistered ? '<b class="st-por-warn">on disk, unregistered — save to file it</b>' : ''}
          <label class="st-por-def" title="The look this show uses when a season does not pick one.">
            <input type="checkbox" class="st-por-default" data-i="${i}"${p.makeDefault ? ' checked' : ''}${
  p.show === PORTRAIT_SHOW_ANY ? ' disabled' : ''}>
            <span>Default for this show</span>
          </label>
          <button type="button" class="st-btn st-btn-quiet st-por-del" data-i="${i}">Remove</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function _refreshPortraitList() {
  const host = document.getElementById('st-por-list');
  if (host) host.innerHTML = _renderPortraitRows(_draft);
  _wirePortraitRows();
}

function _wirePortraitRows() {
  const ed = document.getElementById('st-editor');
  if (!ed) return;
  const d = _draft;
  ed.querySelectorAll('.st-por-file').forEach(el => el.addEventListener('change', async e => {
    const p = d.portraits[+e.target.dataset.i];
    const f = e.target.files[0];
    if (!p || !f) return;
    try { p.dataUri = await _imgToAvatar(URL.createObjectURL(f)); _refreshPortraitList(); }
    catch { _toast('Could not read that image', 'err'); }
  }));
  ed.querySelectorAll('.st-por-show').forEach(el => el.addEventListener('change', e => {
    const p = d.portraits[+e.target.dataset.i];
    if (!p) return;
    p.show = e.target.value;
    if (p.show === PORTRAIT_SHOW_ANY) p.makeDefault = false;
    if (!p.registered) p.file = _portraitFilename(d.slug, p.show, p.id);
    _refreshPortraitList();
  }));
  ed.querySelectorAll('.st-por-label').forEach(el => el.addEventListener('input', e => {
    const p = d.portraits[+e.target.dataset.i];
    if (p) p.label = e.target.value;
  }));
  ed.querySelectorAll('.st-por-default').forEach(el => el.addEventListener('change', e => {
    const p = d.portraits[+e.target.dataset.i];
    if (!p) return;
    // One default per show, so ticking this one unticks its rivals.
    if (e.target.checked) d.portraits.forEach(q => { if (q.show === p.show) q.makeDefault = false; });
    p.makeDefault = e.target.checked;
    _refreshPortraitList();
  }));
  ed.querySelectorAll('.st-por-del').forEach(el => el.addEventListener('click', e => {
    const i = +e.currentTarget.dataset.i;
    const p = d.portraits[i];
    if (!p) return;
    if (p.registered && !confirm('Unregister "' + (p.label || p.id) + '"?'
      + '\n\nThe image stays on disk. If a saved season already recorded this'
      + ' portrait the save will refuse, because unregistering it would change'
      + ' what that season draws.')) return;
    if (p.registered) d.removePortraits.push(p.id);
    d.portraits.splice(i, 1);
    _refreshPortraitList();
  }));
}

function _addPortraitRow() {
  const d = _draft;
  d.portraits = d.portraits || [];
  // A stable id, because it is what a season records. The label is what people
  // read; the id is what history is written in, so it never changes again.
  let n = d.portraits.length + 1;
  while (d.portraits.some(p => p.id === `look-${n}`)) n++;
  const id = `look-${n}`;
  d.portraits.push({
    id, show: PORTRAIT_SHOW_ANY, label: '',
    file: _portraitFilename(d.slug || 'slug', PORTRAIT_SHOW_ANY, id),
    registered: false, makeDefault: false,
  });
  _refreshPortraitList();
}

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
            <label class="st-l">Age <span class="st-hint" id="st-age-hint"></span><input class="st-input" id="st-f-age" value="${_esc(d.age)}" placeholder="&mdash;" inputmode="numeric"></label>
          </div>
        </div>
      </div>

      <div class="st-avatar-ctrls">
        <label class="st-btn st-file">Upload image<input type="file" id="st-f-file" accept="image/*" hidden></label>
        <button type="button" class="st-btn" id="st-f-lib">Pick from library</button>

      </div>
      <div id="st-lib" class="st-lib" hidden></div>

      <!-- The wardrobe. One row per look, each scoped to a show; a season
           picks one in the Cast Builder. Returning status does not choose art. -->
      <div class="st-por">
        <div class="st-por-head">
          <b>Portraits</b>
          <span class="st-por-hint">Extra looks, per show. The Cast Builder picks one per season &mdash;
            <em>Returning Player</em> is continuity and changes no artwork.</span>
          <button type="button" class="st-btn" id="st-por-add">Add portrait</button>
        </div>
        <div id="st-por-list">${_renderPortraitRows(d)}</div>
      </div>

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
        <div class="st-read" id="st-read" hidden></div>
        <div class="st-radar-wrap"><canvas id="st-radar" width="220" height="220"></canvas></div>
      </div>

      <details class="st-drag" id="st-drag-panel"${_hasDrag(d) ? ' open' : ''}>
        <summary>Drag Race — craft <span class="st-hint">only this show reads these</span></summary>
        <div class="st-sliders">${DRAG_KEYS.map(_dragSliderHTML).join('')}</div>
        <label class="st-l">Drag style <span class="st-hint">what she is known for; blank derives it from the strongest craft</span>
          <select class="st-input" id="st-f-drag-style">
            <option value="">— derive from her stats —</option>
            ${DRAG_STYLE_LIST.map(x => `<option value="${x}"${d.drag && d.drag.style === x ? ' selected' : ''}>${x}</option>`).join('')}
          </select>
        </label>
        <label class="st-l">Signature traits <span class="st-hint">up to three, comma separated — padded, bearded, big-wigs, seamstress, wit…</span>
          <input class="st-input" id="st-f-drag-traits" value="${_esc(((d.drag && d.drag.traits) || []).join(', '))}">
        </label>
        <label class="st-l">Persona voice <span class="st-hint">how the QUEEN talks on the main stage, if that differs from the person</span>
          <textarea class="st-input st-area" id="st-f-drag-voice" rows="2">${_esc((d.drag && d.drag.voice) || '')}</textarea>
        </label>
      </details>

      <label class="st-l">Voice profile <span class="st-hint">how they TALK + personality — the bio line below is added automatically</span>
        <textarea class="st-input st-area" id="st-f-voice" rows="3" placeholder="e.g. Minimal, calm and dry; lets people underestimate the pretty one…">${_esc(d.voice)}</textarea>
      </label>
      <div class="st-row3">
        <label class="st-l">Ethnicity <span class="st-hint">queryable</span>
          <input class="st-input" id="st-f-ethnicity" value="${_esc(d.ethnicity)}" placeholder="e.g. Asian">
        </label>
        <label class="st-l">Nationality <span class="st-hint">queryable</span>
          <input class="st-input" id="st-f-nationality" value="${_esc(d.nationality)}" placeholder="e.g. Canadian">
        </label>
        <label class="st-l">Descriptor <span class="st-hint">shown as <b>Label</b></span>
          <input class="st-input" id="st-f-descriptor" value="${_esc(d.descriptor)}" placeholder="e.g. The Lively">
        </label>
      </div>
      <div class="st-row3">
        <label class="st-l">Occupation <span class="st-hint">queryable</span>
          <input class="st-input" id="st-f-occupation" value="${_esc(d.occupation)}" placeholder="e.g. Attorney">
        </label>
        <label class="st-l">Hometown <span class="st-hint">where they are FROM</span>
          <input class="st-input" id="st-f-hometown" value="${_esc(d.hometown)}" placeholder="e.g. Chicago, IL">
        </label>
        <label class="st-l">Birthdate <span class="st-hint">beats Age above</span>
          <input class="st-input" id="st-f-birthdate" type="date" value="${_esc(d.birthdate)}">
        </label>
      </div>
      <label class="st-l">Backstory <span class="st-hint">who they were BEFORE the show — read on their page, not by the episode writer</span>
        <textarea class="st-input st-area" id="st-f-backstory" rows="3" placeholder="e.g. Youngest of three brothers, none of whom he ever lost to…">${_esc(d.backstory)}</textarea>
      </label>
      <label class="st-l">Personality <span class="st-hint">the long version of the voice above — usually generated from it, edit only if it reads wrong</span>
        <textarea class="st-input st-area" id="st-f-personality" rows="4" placeholder="Generated from the voice profile and the stat line. Leave empty and it will be written for you.">${_esc(d.personality)}</textarea>
      </label>

      <!-- THE CASTING INTERVIEW.
           Folded shut by default. It is eleven answers and it would otherwise be
           the longest thing on a form whose top half is the part you edit every
           time. Written BEFORE they play — nothing in here may reference a
           season, because the tape was recorded before the door shut. -->
      <details class="st-iv">
        <summary class="st-iv-sum">Casting interview
          <span class="st-hint">${_ivCount(d)} of ${INTERVIEW_QUESTIONS.length} answered &middot; shown on their wiki page</span>
        </summary>
        <div class="st-iv-body">
          <div class="st-iv-gen">
            <button type="button" class="st-btn" id="st-iv-write">Write it from their voice</button>
            <span class="st-hint" id="st-iv-gen-note">one call, and every answer stays editable</span>
          </div>
          ${INTERVIEW_QUESTIONS.map(x => `<label class="st-l">${_esc(x.q)}
            <textarea class="st-input st-area" id="st-f-iv-${x.key}" rows="${x.short ? 1 : 2}"
              placeholder="in their own voice">${_esc(d.interview?.[x.key] || '')}</textarea>
          </label>`).join('')}
        </div>
      </details>

      <!-- CONTINUITY — what they already did, read back out of the archive.
           The mirror image of the casting interview above it: that tape was
           recorded before the door shut and may not mention a season, this one
           is nothing but seasons. Starts hidden and reveals itself only if the
           archive has them, so a debut character never sees an empty box.
           Folded state is remembered because a three-season veteran's history
           is longer than the form it sits under. -->
      <details class="st-cont" id="st-cont" hidden>
        <summary class="st-cont-sum">Continuity
          <span class="st-hint" id="st-cont-count">reading the archive&hellip;</span>
        </summary>
        <div class="st-cont-body" id="st-cont-body"></div>
        <!-- The read. Everything above it is transcribed from the archive and
             read-only because it is already true; this is the judgement about
             it, which is authored and therefore yours to edit. -->
        <div class="st-cont-read">
          <label class="st-l">Continuity read
            <span class="st-hint">what the seasons above MEAN — drafted from them, then yours</span>
            <textarea class="st-input st-area" id="st-f-continuity" rows="6"
              placeholder="Evolution, what they want going in now, and the threads left open. Draft it from their record, then edit.">${_esc(d.continuityNote || '')}</textarea>
          </label>
          <div class="st-cont-gen">
            <button type="button" class="st-btn" id="st-cont-write">Draft from their record</button>
            <span class="st-hint" id="st-cont-note"></span>
          </div>
        </div>
      </details>

      <div class="st-actions">
        ${d.name ? '<button type="button" class="st-btn st-lg" id="st-fill-profile">Fill in this profile</button><span class="st-hint" id="st-fill-note"></span>' : ''}
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
  ed.querySelector('#st-f-arch').addEventListener('change', e => { d.archetype = e.target.value; _updateRead(); });
  ed.querySelector('#st-f-voice').addEventListener('input', e => d.voice = e.target.value);
  ed.querySelector('#st-f-ethnicity').addEventListener('input', e => d.ethnicity = e.target.value);
  ed.querySelector('#st-f-nationality').addEventListener('input', e => d.nationality = e.target.value);
  ed.querySelector('#st-f-descriptor').addEventListener('input', e => d.descriptor = e.target.value);
  ed.querySelector('#st-f-occupation').addEventListener('input', e => d.occupation = e.target.value);
  ed.querySelector('#st-f-hometown').addEventListener('input', e => d.hometown = e.target.value);
  // ── the age follows the birthdate, on the franchise's clock ──
  //
  // Not the real one. Time here advances because a season aired, so somebody
  // born in 2004 is 22 for as long as the present is fall 2026, however many
  // real months pass. Age is still editable — a value typed by hand wins and
  // is not overwritten on the next keystroke.
  const syncAge = () => {
    const ageEl = ed.querySelector('#st-f-age');
    const now = franchiseNow();
    const hint = ed.querySelector('#st-age-hint');
    if (hint) hint.textContent = (now && d.birthdate) ? `at ${now.airSlot} ${now.airYear}` : '';
    const derived = ageNow(d.birthdate);
    if (derived == null || !ageEl) return;
    ageEl.value = String(derived);
    d.age = String(derived);
  };
  // Both events: a date input fires `input` while typing and `change` when the
  // picker commits, and which one arrives first is browser-dependent.
  for (const evt of ['input', 'change']) {
    ed.querySelector('#st-f-birthdate').addEventListener(evt, e => {
      d.birthdate = e.target.value;
      syncAge();
    });
  }
  // And once more when the calendar finishes loading. The archive is fetched
  // asynchronously, so a birthdate typed in the first moment after the editor
  // opens — or one already saved on the character — was being counted against
  // a present that did not exist yet: ageNow returned null, the box stayed
  // empty, and only the hint appeared later to say it should not have.
  ed._syncAge = syncAge;
  ed.querySelector('#st-f-backstory').addEventListener('input', e => d.backstory = e.target.value);
  ed.querySelector('#st-f-personality').addEventListener('input', e => d.personality = e.target.value);
  INTERVIEW_QUESTIONS.forEach(x => {
    const el = ed.querySelector(`#st-f-iv-${x.key}`);
    if (!el) return;
    el.addEventListener('input', e => {
      d.interview = d.interview || {};
      d.interview[x.key] = e.target.value;
      const c = ed.querySelector('.st-iv-sum .st-hint');
      if (c) c.textContent = `${_ivCount(d)} of ${INTERVIEW_QUESTIONS.length} answered · shown on their wiki page`;
    });
  });

  // ── WRITE THE INTERVIEW ──
  //
  // Sends the PERSON and the question list, and gets eleven answers back. It
  // deliberately cannot send a season: the tape was recorded before the door
  // shut, and a model that has read the season writes a winner who already
  // sounds like one.
  //
  // Fills the boxes and stops. It does NOT save — these are a first draft in
  // somebody else's voice, and the voice profiles beside them are all
  // hand-tuned. Nothing is written to the database until you press Save.
  const genBtn = ed.querySelector('#st-iv-write');
  if (genBtn) genBtn.addEventListener('click', async () => {
    const note = ed.querySelector('#st-iv-gen-note');
    const say = t => { if (note) note.textContent = t; };
    if (!d.name) return say('give them a name first');
    const answered = _ivCount(d);
    if (answered && !confirm(
      `${answered} of ${INTERVIEW_QUESTIONS.length} answers are already written.\n\n`
      + 'Overwrite them?')) return;

    genBtn.disabled = true;
    say('writing…');
    try {
      const res = await fetch(writerEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'casting-interview',
          // The question list travels with the request. The worker keeps no
          // copy — one source of truth is js/casting-interview.js.
          questions: INTERVIEW_QUESTIONS.map(x => ({ key: x.key, q: x.q })),
          person: {
            // sexuality travels explicitly. The voice profile's bio lead-in
            // carries it, but `d.voice` is the prose with that lead-in STRIPPED
            // — so without this the model answers "would you be in a showmance"
            // with no idea, and a first test only passed because it was handed
            // the raw profile by hand.
            name: d.name, gender: d.gender, sexuality: d.sexuality,
            archetype: d.archetype, age: d.age,
            occupation: d.occupation, hometown: d.hometown,
            ethnicity: d.ethnicity, nationality: d.nationality,
            voice: d.voice, backstory: d.backstory, stats: { ...d.stats },
          },
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || `worker ${res.status}`);

      d.interview = d.interview || {};
      for (const [k, v] of Object.entries(json.answers || {})) {
        d.interview[k] = v;
        const el = ed.querySelector(`#st-f-iv-${k}`);
        if (el) el.value = v;
      }
      const c = ed.querySelector('.st-iv-sum .st-hint');
      if (c) c.textContent = `${_ivCount(d)} of ${INTERVIEW_QUESTIONS.length} answered · shown on their wiki page`;
      say(`${json.answered} written — edit anything that reads wrong, then Save`);
    } catch (e) {
      // Said out loud rather than swallowed: a button that appears to do
      // nothing is the worst version of this.
      say(`could not write it — ${e.message}`);
    } finally {
      genBtn.disabled = false;
    }
  });

  ed.querySelectorAll('#st-f-gender button').forEach(b => b.addEventListener('click', () => {
    d.gender = b.dataset.g; ed.querySelectorAll('#st-f-gender button').forEach(x => x.classList.toggle('active', x === b));
  }));

  // stats
  ed.querySelectorAll('.st-slider').forEach(sl => sl.addEventListener('input', e => {
    const k = e.target.dataset.k; d.stats[k] = +e.target.value; _updateStatUI(k); _drawRadar(); _updateRead();
  }));
  // craft (Drag Race). Its own attribute, so the nine-stat handler above never
  // sees these and never writes one of them into d.stats.
  ed.querySelectorAll('input[data-dk]').forEach(sl => sl.addEventListener('input', e => {
    const k = e.target.dataset.dk;
    d.drag[k] = +e.target.value;
    const row = ed.querySelector(`.st-stat[data-dk="${k}"] .st-stat-val`);
    if (row) { row.textContent = d.drag[k]; row.style.color = _statHue(d.drag[k]); }
  }));
  ed.querySelector('#st-f-drag-style')?.addEventListener('change', e => { d.drag.style = e.target.value; });
  ed.querySelector('#st-f-drag-traits')?.addEventListener('input', e => {
    d.drag.traits = e.target.value.split(',').map(x => x.trim()).filter(Boolean).slice(0, 3);
  });
  ed.querySelector('#st-f-drag-voice')?.addEventListener('input', e => { d.drag.voice = e.target.value; });
  ed.querySelector('#st-seed').addEventListener('click', () => {
    if (!d.archetype) { _toast('Pick an archetype first', 'warn'); return; }
    d.stats = { ...ARCH_PRESET[d.archetype] }; _syncSliders(); _drawRadar(); _updateRead();
  });
  ed.querySelector('#st-balance-btn').addEventListener('click', () => { _balance(); _syncSliders(); _drawRadar(); _updateRead(); });
  ed.querySelector('#st-rand').addEventListener('click', () => { _randomize(); _syncSliders(); _drawRadar(); _updateRead(); });

  // avatar
  ed.querySelector('#st-f-file').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try { d.avatarDataUri = await _imgToAvatar(URL.createObjectURL(f)); _refreshPortrait(); }
    catch { _toast('Could not read that image', 'err'); }
  });
  ed.querySelector('#st-f-lib').addEventListener('click', _toggleLibrary);

  // ── the returnee slot ──
  //
  // The convention (`<slug>-returnee.png`) and the manifest that decides
  // whether it is ever used were both repo-only knowledge: you had to know the
  // filename rule, upload through the raw avatar library, and then regenerate a
  // JSON file by hand. It is a labelled box on the character now.
  ed.querySelector('#st-por-add')?.addEventListener('click', _addPortraitRow);
  _wirePortraitRows();

  _fillContinuity(ed, d.slug);
  ed.querySelector('#st-f-continuity')?.addEventListener('input', e => { d.continuityNote = e.target.value; });
  ed.querySelector('#st-cont-write')?.addEventListener('click', () => {
    const note = ed.querySelector('#st-cont-note');
    _draftContinuityRead(ed, d, t => { if (note) note.textContent = t; });
  });

  // load / save / delete
  ed.querySelector('#st-fill-profile')?.addEventListener('click', () => {
    const note = ed.querySelector('#st-fill-note');
    _fillProfileFrom(ed, d, t => { if (note) note.textContent = t; });
  });
  ed.querySelector('#st-save').addEventListener('click', _save);
  ed.querySelector('#st-del')?.addEventListener('click', _delete);
  // add/remove the selected character from the active cast, right from the editor
  ed.querySelector('#st-add-cast')?.addEventListener('click', async () => { await _toggleMember(d.slug); _renderEditor(); });

  _drawRadar();
  _updateRead();
}

// ═══════════════════════════════════════════════════════════════════════
// FETCH FROM WIKI — canon, proposed rather than applied.
//
// Two round trips on purpose. The first is a search and costs nothing, so a
// name that is spelled differently on the wiki than on the roster (Thom is
// "Tom" there) is corrected before any generation is paid for. The second
// reads the page and writes the profile.
//
// The result lands in the SAME preview as a published profile: every field a
// checkbox, anything already written arriving unticked. Nothing here can
// overwrite prose silently, which is the entire reason the fetch is allowed to
// invent a hometown at all — an invention that must be ticked is a suggestion,
// and it is labelled as one.
// ═══════════════════════════════════════════════════════════════════════

/** Ask a small question with a text field. Resolves to a string or null. */
function _askName(message, initial) {
  // eslint-disable-next-line no-alert
  const answer = window.prompt(message, initial || '');
  const trimmed = (answer || '').trim();
  return trimmed || null;
}

/** Ask which of several wikis. Resolves to a candidate or null. */
function _askWhichWiki(name, candidates) {
  const lines = candidates.map((c, i) => `${i + 1}. ${c.label} — ${c.title}`).join('\n');
  // eslint-disable-next-line no-alert
  const answer = window.prompt(
    `"${name}" exists on more than one wiki. Which one is this character?\n\n${lines}\n\nType a number:`, '1');
  const idx = Number.parseInt(answer, 10);
  return Number.isInteger(idx) && candidates[idx - 1] ? candidates[idx - 1] : null;
}

async function _wikiCall(payload) {
  const res = await fetch(writerEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) throw new Error(json?.error || `worker ${res.status}`);
  return json;
}

/**
 * Find the page for this character, asking only when genuinely unsure.
 *
 * Exact-title matching is the confidence test, and it happens to separate the
 * three real cases: a name on one wiki is certain, a name on two is a
 * question, a name on none is a spelling the user can fix in one field.
 */
async function _resolveWikiPage(name) {
  let query = name;
  for (let attempt = 0; attempt < 3; attempt++) {
    const out = await _wikiCall({ mode: 'wiki-resolve', name: query });

    if (out.status === 'found') return out.page;

    if (out.status === 'ambiguous') {
      const picked = _askWhichWiki(query, out.candidates);
      if (!picked) return null;
      return picked;
    }

    // Not found. Near-misses become the suggestion in the retry box, because
    // the answer is usually one letter away and typing it is faster than
    // going to look the article up.
    const hint = out.suggestions?.length
      ? `\n\nClosest pages found:\n${out.suggestions.map(s => `· ${s.title} (${s.label})`).join('\n')}`
      : '';
    query = _askName(
      `No wiki page called "${query}".${hint}\n\nWhat name is this character filed under?`,
      out.suggestions?.[0]?.title || query);
    if (!query) return null;
  }
  return null;
}

/**
 * One button, two sources, one preview.
 *
 * The saved roster is local and instant. The wiki costs a call and a model and
 * can take ten seconds. Waiting on the slow one to show the fast one would
 * make a free lookup feel like an expensive one, so the dialog opens on the
 * roster immediately and the wiki merges in when it arrives — every tick and
 * every choice already made survives the re-render.
 *
 * The wiki half is allowed to fail quietly. A network error, a missing page, a
 * refusal: the reader still has the saved profile in front of them, and a
 * status line says what happened rather than an alert taking the dialog away.
 */
async function _fillProfileFrom(ed, d, say) {
  const btn = ed.querySelector('#st-fill-profile');
  const slug = d.slug || _slugify(d.name);

  const published = _roster().find(p => p.slug === slug);
  const preview = _openProfileFillPreview(d);
  if (!preview) return;
  if (published) preview.addSource({ origin: 'roster', label: 'Saved profile', profile: published });

  preview.say('searching the wiki…');
  if (btn) btn.disabled = true;
  try {
    const page = await _resolveWikiPage(d.name);
    if (!page) { preview.say(published ? 'Saved profile only — no wiki page chosen.' : 'No wiki page chosen.'); return; }

    // ── don't pay to be told what you already wrote ──
    //
    // The preview unticks a field you have written anyway, so proposing a
    // rival for it is output bought and thrown away. voice, personality and
    // backstory are 79% of a reply between them, so skipping those three when
    // they exist is most of the saving there is. The input cannot shrink —
    // the article still has to be read to answer anything at all.
    const already = ['occupation', 'hometown', 'ethnicity', 'nationality',
      'descriptor', 'sexuality', 'voice', 'personality', 'backstory']
      .filter(f => String(d[f] || '').trim());
    // The age pass is separate: it is worth asking for unless a birthdate is
    // already on the record.
    const skip = [...already, ...(String(d.birthdate || '').trim() ? ['__age'] : [])];

    // Nothing left to ask about is a reason not to spend, not a reason to send
    // an empty request. The saved profile is already in the preview behind
    // this, so the dialog is not empty either.
    if (already.length === 9 && skip.includes('__age')) {
      preview.say('Every field is already written — nothing worth asking the wiki. '
        + 'Clear a field and press again to get a proposal for it.');
      return;
    }

    preview.say(`reading ${page.title} on the ${page.label}…`);
    const [out, appearances] = await Promise.all([
      _wikiCall({ mode: 'wiki-profile', host: page.host, title: page.title, slug, skip }),
      // Their career, for the age anchor below. Cached after the first call,
      // and usually already warm because the continuity box asked for it when
      // the editor opened.
      appearancesFor(slug).catch(() => []),
    ]);

    // ── the age, translated into this franchise's time ──
    //
    // A wiki freezes a character at the age they were written: Leshawna is
    // sixteen. That is true of the moment she debuted, not of now. Anchored on
    // when her first season actually aired and carried forward to the season
    // currently airing, sixteen in spring 2020 is twenty-two in fall 2026.
    //
    // Split provenance on purpose: the AGE can be quoted from the article, the
    // BIRTHDATE cannot — it is this calendar's arithmetic on top of it — and
    // the day of the month is nobody's fact at all.
    const anchor = ageAnchor(appearances);
    const profile = { ...out.profile };
    if (out.canonicalAge && anchor) {
      const born = birthFromCanonAge(out.canonicalAge.value, anchor, out.birthday);
      if (born) {
        const dated = `${out.canonicalAge.value} at ${anchor.debut.title || anchor.debut.seasonId}`
          + ` (${anchor.debut.airSlot} ${anchor.debut.airYear})`;
        profile.profileSources = { ...(profile.profileSources || {}) };
        if (born.birthdate) {
          profile.birthdate = born.birthdate;
          profile.profileSources.birthdate = [{
            label: `${dated}, so born ${born.birthYear}`,
            kind: 'simulator-continuity',
          }, ...(out.canonicalAge.kind === 'source-canon'
            ? [{ label: `${out.source.label} — ${out.source.title}`, url: out.source.url,
              kind: 'source-canon', quote: out.canonicalAge.quote }]
            : [])];
        }
        if (born.ageNow != null) {
          profile.age = born.ageNow;
          profile.profileSources.age = [{
            label: `${dated}, and it is ${anchor.now.airSlot} ${anchor.now.airYear} now`,
            kind: 'simulator-continuity',
          }];
        }
      }
    }
    preview.addSource({ origin: 'wiki', label: page.label, profile });
    const { total, canon } = out.counts;
    const guessed = total - canon;
    // Say what was dropped. A cap that bins a field silently reads as "the
    // wiki had nothing to say about that", which is a different fact.
    const dropped = (out.overlong || []).length
      ? ` Skipped ${out.overlong.join(', ')} — came back as prose, not a value.`
      : '';
    // Said out loud for the same reason: a field missing from the preview
    // because nobody asked for it looks identical to one the wiki had nothing
    // to say about, and they are very different facts.
    const saved = already.length
      ? ` Did not ask about ${already.length} field${already.length === 1 ? '' : 's'} you have already written.`
      : '';
    preview.say(`${page.title} on the ${page.label}: ${canon} of ${total} field${total === 1 ? '' : 's'} quote the article`
      + `${guessed ? `, ${guessed} ${guessed === 1 ? 'is a reading' : 'are readings'} of it` : ''}.${dropped}${saved}`);
  } catch (e) {
    preview.say(`The wiki lookup failed: ${e.message}`);
    if (say) say('');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CONTINUITY — the seasons they already played, in that show's words.
//
// Nothing here is written or generated: every line is transcribed out of the
// season documents, which is where the hand-authored continuity bible got its
// chronology too. So it costs one read of the archive and it is never stale —
// play another season and it is in here the next time the editor opens.
//
// The show tag on every row is the point. This project's recurring bug is one
// show's vocabulary printed over the other, and a career panel that lists a
// Big Brother week next to a Total Drama episode with no marking is exactly
// how that starts. The words come from the registry, per appearance.
// ═══════════════════════════════════════════════════════════════════════

const CONT_OPEN_KEY = 'st_continuity_open';

/**
 * Fill (and reveal) the continuity box for one character.
 *
 * Exported under the same underscore convention as the profile preview: a
 * panel that renders nothing is this project's favourite way to ship broken,
 * so the test drives the real function against a real DOM rather than
 * asserting that a builder returned a string.
 */
export async function _fillContinuity(ed, slug) {
  // Loading the archive is also what tells the calendar what year it is, so
  // this runs for a debut character too — they have no seasons, but the age
  // box still needs a present to count to.
  try {
    await continuityIndex();
    ed._syncAge?.();
  } catch { /* an age box with no hint is fine; a broken editor is not */ }

  const box = ed.querySelector('#st-cont');
  const body = ed.querySelector('#st-cont-body');
  const count = ed.querySelector('#st-cont-count');
  if (!box || !body) return;

  let apps = [];
  try { apps = await appearancesFor(slug); } catch { apps = []; }
  // The editor may have moved to another character while the archive loaded.
  if (!box.isConnected) return;

  const sum = continuitySummary(apps);
  if (!sum) { box.hidden = true; return; }   // debut character — no box at all

  const showList = sum.shows.join(' &amp; ');
  // "1 win · best 1st" says the same thing twice. A winner's headline is the
  // win; only a player who never won needs their best finish spelled out.
  const tail = sum.wins
    ? ` &middot; ${sum.wins} win${sum.wins > 1 ? 's' : ''}`
    : ` &middot; best ${_ordinal(sum.best.placement)}`;
  if (count) {
    count.innerHTML = `${sum.seasons} season${sum.seasons > 1 ? 's' : ''} on ${showList}${tail}`;
  }

  const ties = continuityTies(apps);
  body.innerHTML = apps.map(a => _contSeasonHtml(a)).join('')
    + _contTiesHtml(ties);

  box.hidden = false;
  // Remembered across characters and sessions: a three-season veteran's
  // history is taller than the form above it, and re-folding it every time is
  // the thing that makes a panel like this get ignored.
  try { box.open = localStorage.getItem(CONT_OPEN_KEY) === '1'; } catch { /* private mode */ }
  box.addEventListener('toggle', () => {
    try { localStorage.setItem(CONT_OPEN_KEY, box.open ? '1' : '0'); } catch { /* ignore */ }
  });
}

function _ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Draft the read from the record the box is already showing.
 *
 * The appearances go up with the request rather than being looked up again on
 * the worker: the browser has just derived them, they carry each season's own
 * vocabulary, and a second copy of that derivation living server-side is how
 * this project ends up with two versions of the same fact. The worker holds
 * the key; it does not need to hold the archive.
 *
 * Overwriting is confirmed, never silent. A drafted note that quietly replaced
 * a paragraph somebody wrote would be the same failure as a Publish wiping a
 * profile, in miniature.
 */
async function _draftContinuityRead(ed, d, say) {
  const btn = ed.querySelector('#st-cont-write');
  const field = ed.querySelector('#st-f-continuity');
  const existing = (field?.value || '').trim();
  // eslint-disable-next-line no-alert
  if (existing && !window.confirm('There is already a continuity read here.\n\nReplace it?')) return;

  if (btn) btn.disabled = true;
  say('reading their record…');
  try {
    const appearances = await appearancesFor(d.slug);
    if (!appearances.length) { say(`${d.name} has not finished a season yet.`); return; }

    const res = await fetch(writerEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'continuity-read',
        person: {
          name: d.name, archetype: d.archetype,
          voice: d.voice, personality: d.personality,
        },
        appearances,
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) throw new Error(json?.error || `worker ${res.status}`);

    d.continuityNote = json.note;
    if (field) field.value = json.note;
    const seasons = appearances.length;
    say(`drafted from ${seasons} season${seasons > 1 ? 's' : ''} — edit it freely`);
  } catch (e) {
    say(`failed: ${e.message}`);
  } finally {
    if (btn) btn.disabled = false;
  }
}

/** One season's row. */
function _contSeasonHtml(a) {
  const place = a.placement === 1 ? 'Winner' : _ordinal(a.placement);
  const outcome = a.outcome && a.outcome !== 'Winner' ? ` <span class="st-cont-title">(${_esc(a.outcome)})</span>` : '';
  const stats = a.stats.length
    ? `<div class="st-cont-stats">${a.stats.map(s => `${_esc(String(s.value))} ${_esc(s.label)}`).join(' &middot; ')}</div>` : '';
  // Season 1's title IS "Total Drama", so the show tag beside it printed the
  // same words twice. The tag is the one that has to stay.
  const title = a.title && a.title !== a.show
    ? `<span class="st-cont-title">${_esc(a.title)}</span>` : '';
  const style = a.gameplayStyle
    ? `<div class="st-cont-style">${_esc(a.gameplayStyle)}</div>` : '';
  const moments = a.keyMoments.length
    ? `<ul class="st-cont-moments">${a.keyMoments.map(m => `<li>${_esc(m)}</li>`).join('')}</ul>`
    // Season 1 and 2 documents predate keyMoments. Saying so is better than a
    // silent gap that reads as "nothing happened to them".
    : `<div class="st-cont-thin">no episode beats recorded for this season</div>`;
  return `<div class="st-cont-season">
    <div class="st-cont-head">
      <span class="st-cont-show">${_esc(a.show)}</span>
      <span class="st-cont-place">${_esc(a.seasonId)} &middot; ${place}</span>${outcome}
      ${title}
    </div>
    ${style}${stats}${moments}
  </div>`;
}

/** Who they keep running into, across the whole career. */
function _contTiesHtml(ties) {
  const line = (label, list) => list.length
    ? `<div><strong>${label}:</strong> ${list.map(t => _esc(t.name) + (t.count > 1 ? ` &times;${t.count}` : '')).join(', ')}</div>`
    : '';
  const html = line('Alliances', ties.alliances) + line('Rivalries', ties.rivalries);
  return html ? `<div class="st-cont-ties">${html}</div>` : '';
}

// ═══════════════════════════════════════════════════════════════════════
// READ — what the simulator will actually do with this character.
//
// Every line here comes from a rule the engine really applies, not from
// invented personality flavour. It stays hidden until there is something worth
// saying, so a blank new character doesn't get a panel full of nothing.
// ═══════════════════════════════════════════════════════════════════════
const NICE_ARCH_SET = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);

/** Which archetype template do these stats sit closest to? */
function _nearestArchetype(stats) {
  let best = null, bestDist = Infinity;
  for (const [a, tpl] of Object.entries(ARCH_PRESET)) {
    let d = 0;
    for (const k of STAT_KEYS) d += Math.abs((stats[k] || 0) - (tpl[k] || 0));
    if (d < bestDist) { bestDist = d; best = a; }
  }
  return { archetype: best, distance: bestDist };
}

function _readLines(d) {
  const s = d.stats || {};
  const arch = d.archetype || '';
  const out = [];

  // 1) scheming — the exact rule from social-manipulation.js
  if (VILLAIN_ARCH.includes(arch)) {
    out.push(['scheme', `Schemes <b>every episode</b> — ${arch} is a villain archetype`]);
  } else if (NICE_ARCH_SET.has(arch)) {
    out.push(['scheme', `<b>Never schemes</b> — nice archetypes are locked out, even at strategic 10`]);
  } else if (arch) {
    const pct = Math.round((s.strategic / 10) * ((10 - s.loyalty) / 10) * 100);
    out.push(['scheme', `Schemes about <b>${pct}%</b> of episodes — strategic ${s.strategic} against loyalty ${s.loyalty}`]);
  }

  // 2) challenge lean
  const phys = ((s.physical || 0) + (s.endurance || 0)) / 2;
  const brain = s.mental || 0;
  if (phys >= 7.5 && brain >= 7.5) out.push(['chal', `Strong <b>everywhere</b> — physical ${s.physical}, endurance ${s.endurance}, mental ${brain}`]);
  else if (phys >= 7.5) out.push(['chal', `<b>Physical</b> threat (${s.physical}/${s.endurance}) — weaker on puzzles (mental ${brain})`]);
  else if (brain >= 7.5) out.push(['chal', `<b>Puzzle</b> solver (mental ${brain}) — carried in physical rounds`]);
  else if (phys <= 4 && brain <= 4) out.push(['chal', `Loses most challenges — needs a social game to survive`]);

  // 3) how the field will read them
  if ((s.social || 0) >= 8 && (s.strategic || 0) >= 8) out.push(['threat', `Reads as a <b>threat early</b> — social ${s.social} + strategic ${s.strategic}`]);
  else if ((s.social || 0) <= 3) out.push(['threat', `Poor social game (${s.social}) — easy vote when a tribe needs one`]);

  // 4) temperament and boldness are the two that surprise people
  if ((s.temperament || 0) <= 3) out.push(['fuse', `<b>Short fuse</b> (temperament ${s.temperament}) — expect blow-ups`]);
  if ((s.boldness || 0) >= 8) out.push(['bold', `Bold (${s.boldness}) — volunteers for the dangerous option`]);
  else if ((s.boldness || 0) <= 3) out.push(['bold', `Timid (${s.boldness}) — chickens out of high-risk moments`]);

  // 5) do the stats match the archetype they were given?
  const near = _nearestArchetype(s);
  if (arch && near.archetype && near.archetype !== arch) {
    out.push(['fit', `Stats read closest to <b>${near.archetype.replace(/-/g, ' ')}</b>, not ${arch.replace(/-/g, ' ')}`]);
  } else if (arch && near.archetype === arch) {
    out.push(['fit', `Stats fit the <b>${arch.replace(/-/g, ' ')}</b> template`]);
  }

  // 6) the biggest deviations from the chosen template
  if (arch && ARCH_PRESET[arch]) {
    const tpl = ARCH_PRESET[arch];
    const off = STAT_KEYS
      .map(k => ({ k, delta: (s[k] || 0) - (tpl[k] || 0) }))
      .filter(x => Math.abs(x.delta) >= 4)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 3);
    if (off.length) {
      out.push(['type', 'Against type: ' + off.map(x =>
        `${x.k} ${s[x.k]} <span class="st-read-tpl">(template ${tpl[x.k]})</span>`).join(', ')]);
    }
  }
  return out;
}

function _updateRead() {
  const box = document.getElementById('st-read');
  if (!box) return;
  const d = _draft || {};
  // Nothing worth saying about an untouched blank character.
  const touched = d.archetype || STAT_KEYS.some(k => (d.stats?.[k] ?? 5) !== 5);
  const lines = touched ? _readLines(d) : [];
  if (!lines.length) { box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  box.innerHTML =
    `<div class="st-read-h">How the simulator will play them</div>` +
    lines.map(([kind, html]) => `<div class="st-read-l" data-kind="${kind}">${html}</div>`).join('');
}

function _sliderHTML(k) {
  const v = _statOf(k);
  return `<div class="st-stat" data-k="${k}">
    <span class="st-stat-lab">${STAT_ABBR[k]}</span>
    <input type="range" class="st-slider" data-k="${k}" min="1" max="10" step="1" value="${v}">
    <span class="st-stat-val" style="color:${_statHue(v)}">${v}</span>
  </div>`;
}
// The same row as a stat slider, on its own data attribute so the two sets of
// handlers can never cross. `data-dk` is what tests/dr-studio-drag.test.js
// looks for.
function _dragSliderHTML(k) {
  const v = _dragOf(k);
  return `<div class="st-stat" data-dk="${k}">
    <span class="st-stat-lab">${k.slice(0, 3).toUpperCase()}</span>
    <input type="range" data-dk="${k}" min="1" max="10" step="1" value="${v}">
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
  // ── A SLUG COLLISION WITH A DIFFERENT CHARACTER, and only that ──────
  //
  // "Different" is a question about IDENTITY, and identity here is the slug:
  // it is what the roster is keyed on, what the save updates by, and what a
  // rename leaves alone. Asking by name meant a rename could never be saved —
  // the row still held the old name, so the character collided with itself.
  //
  // Changing the slug ONTO somebody else's is still caught, because then the
  // row found is not the row being edited. A brand-new character has no
  // editing slug and is compared against everybody, as before.
  const editing = d._editingSlug || null;
  const clash = _roster().find(p => p.slug === d.slug
    && (editing ? p.slug !== editing : p.name !== d.name));
  if (clash) return _fail(note, `Slug "${d.slug}" already used by ${clash.name}`);

  // ── the bio travels with the character, and it did not ──
  //
  // `entry` is what goes into the local pool AND what `_rosterPush` sends to
  // D1, and it carried six fields. Everything biographical was written to the
  // IndexedDB `rich` record instead, which never leaves this browser — so
  // editing somebody's age or nationality in the Studio appeared to work,
  // survived a reload, and was silently absent from the database and from
  // every published roster. The 27 characters that DO have those fields got
  // them from the original seed script parsing the voice lead-in; nothing
  // typed into the Studio since has ever reached D1.
  //
  // Empty strings are dropped rather than sent: the Worker turns '' into null
  // anyway, and a roster entry full of empty keys is noise in a file that is
  // read by hand.
  const bio = {};
  for (const k of ['age', 'birthdate', 'ethnicity', 'nationality',
    'hometown', 'occupation', 'descriptor', 'backstory', 'personality',
    // Rides with the bio because it must reach D1 for the same reason the bio
    // does: Publish rebuilds franchise_roster.json from that table, so a field
    // the database never sees is deleted the next time the button is pressed.
    'continuityNote']) {
    const v = (d[k] ?? '').toString().trim();
    if (v) bio[k] = v;
  }
  // Serialised here rather than stored as a map, so what reaches D1 and what
  // reaches the published roster are the same string. Empty when nothing was
  // answered — an untouched interview must store NULL, not an empty structure
  // that reads as "written, and blank".
  const iv = serializeInterview(d.interview || {});
  if (iv) bio.castingInterview = iv;
  const entry = { name: d.name, slug: d.slug, gender: d.gender, sexuality: d.sexuality,
    archetype: d.archetype, stats: { ...d.stats }, voice: d.voice,
    profileSources: d.profileSources, ...bio };
  // Sent only when something was authored. An untouched block of fives would
  // claim every character has a considered craft line, and the roster file is
  // read by hand.
  if (_hasDrag(d)) entry.drag = { ...d.drag, traits: [...(d.drag.traits || [])] };

  // 1) live projection into the roster the Cast Builder reads
  const arr = _roster().slice();
  // THE ROW BEING EDITED, by the slug it was loaded under. Matching on the
  // NEW slug or the NEW name finds nothing when both have changed, and the
  // save then pushes a second character instead of updating the first — the
  // rename leaving a duplicate behind. A brand-new character has no editing
  // slug and matches on its own, as before.
  const i = arr.findIndex(p => (d._editingSlug && p.slug === d._editingSlug)
    || p.slug === d.slug || p.name === d.name);
  if (i >= 0) arr[i] = { ...arr[i], ...entry }; else arr.push(entry);
  _persistRoster(arr);

  // 2) rich record (raw prose kept for editing) + avatar override
  const rich = { slug: d.slug, name: d.name, age: d.age, gender: d.gender,
    sexuality: d.sexuality, archetype: d.archetype,
    ethnicity: d.ethnicity, nationality: d.nationality, descriptor: d.descriptor,
    birthdate: d.birthdate, hometown: d.hometown,
    occupation: d.occupation, backstory: d.backstory, personality: d.personality,
    continuityNote: d.continuityNote,
    castingInterview: iv, profileSources: d.profileSources,
    voice: d.voice, avatarDataUri: d.avatarDataUri || '' };
  try { await _idbPut('characters', rich); } catch {}
  if (d.avatarDataUri) { window.__studioAvatars = window.__studioAvatars || {}; window.__studioAvatars[d.slug] = d.avatarDataUri; }
  // Every look the editor is holding, so the grid and the pickers show it
  // before the server has written anything.
  for (const q of (d.portraits || [])) {
    if (!q.dataUri || !q.file) continue;
    window.__studioAvatars = window.__studioAvatars || {};
    window.__studioAvatars[q.file.replace(/\.[a-z0-9]+$/i, '')] = q.dataUri;
  }

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
      await _rosterPush(entry);
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

    // ── the wardrobe: files AND catalog entries, in one write ──
    //
    // Sending the images without registering them puts art on disk that no
    // season can pick and nothing on any screen explains — which is exactly
    // what the old returnee manifest existed to prevent, and what came back
    // the moment uploading and registering were separate steps. The server
    // does both, and reports per-portrait problems rather than failing silent.
    const _porRows = (d.portraits || []).filter(q => q.id && q.file && (q.label || '').trim());
    if (_porRows.length || (d.removePortraits || []).length) {
      try {
        const r = await fetch(_apiUrl('/api/character'), {
          method: 'POST', headers: _apiHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            roster: entry, voice: { name: d.name, text: composedVoice },
            portraits: _porRows.map(q => ({ id: q.id, show: q.show, label: q.label.trim(),
              file: q.file, dataUri: q.dataUri || '', makeDefault: !!q.makeDefault })),
            removePortraits: d.removePortraits || [],
          }),
        });
        const j = await r.json();
        if (!j.ok) throw new Error(j.error || 'write failed');
        wrote = [...(wrote || []), ...(j.wrote || [])];
        (j.portraitProblems || []).forEach(msg => _toast('Portrait: ' + msg, 'warn'));
        for (const q of _porRows) {
          q.registered = true; q.unregistered = false; q.dataUri = '';
          const stem = q.file.replace(/\.[a-z0-9]+$/i, '');
          if (!_avatarList.includes(stem)) _avatarList.push(stem);
        }
        d.removePortraits = [];
        _refreshPortraitList();
      } catch (e) { _toast('Portrait save failed: ' + e.message, 'warn'); }
    }
    // A row with no label is not saved: the label is what the Cast Builder
    // shows, and an unlabelled thumbnail is a choice nobody can read.
    const _porUnlabelled = (d.portraits || []).length - _porRows.length - 0;
    if (_porUnlabelled > 0) _toast(`${_porUnlabelled} portrait${_porUnlabelled === 1 ? '' : 's'} skipped — each needs a label`, 'warn');
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
  _refreshPublishStatus();
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
  _refreshPublishStatus();
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
  try { window.migrateCastPortraits && window.migrateCastPortraits(arr); } catch {}
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
  const rosterVoiceNames = new Set();
  for (const p of _roster()) {
    if (p.voice && String(p.voice).trim()) {
      base.profiles[p.name] = composeVoice(p, stripBioLead(p.voice));
      rosterVoiceNames.add(p.name);
    }
  }
  chars.forEach(c => {
    if (rosterVoiceNames.has(c.name)) return;
    const v = _composeVoice(c);
    if (v) base.profiles[c.name] = v;
  });
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
  /* read panel — what the engine will do with this character */
  .st-read{background:#ffffff06;border:1px solid var(--border,#333);border-left:3px solid var(--accent,#f4b23e);
    border-radius:8px;margin:10px 0 0;padding:8px 11px}
  .st-read-h{color:var(--muted,#9a9);font-size:9.5px;font-weight:700;letter-spacing:.09em;
    margin-bottom:5px;text-transform:uppercase}
  .st-read-l{color:var(--muted,#9a9);font-size:11.5px;line-height:1.55}
  .st-read-l b{color:inherit;filter:brightness(1.5)}
  .st-read-l[data-kind="fit"]{color:#8fa6c4}
  .st-read-l[data-kind="type"]{color:#e5843e}
  .st-read-tpl{opacity:.55}
  /* publish status — derived from the site, not remembered */
  .st-pubstatus{font-size:11.5px;margin:0 0 10px;min-height:15px;color:var(--muted,#9a9)}
  .st-pubstatus.ok{color:#4ade80}
  .st-pubstatus.warn{color:#f4b23e;cursor:help}
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
  .st-an-head{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:.02em}
  .st-an-toggle{margin-left:auto;display:flex;align-items:center;gap:5px;cursor:pointer;background:none;
    border:1px solid var(--border,#333);border-radius:999px;padding:2px 9px;color:var(--muted,#9a9);
    font:inherit;font-size:9.5px;font-weight:600;text-transform:uppercase;letter-spacing:.06em}
  .st-an-toggle:hover{border-color:var(--accent,#46b17b);color:inherit}
  .st-an-toggle i{font-style:normal;font-size:9px}
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
  .st-chem-note{font-size:11px;color:var(--muted,#9a9);font-style:italic}
  .st-chem-wrap{display:flex;flex-direction:column;gap:6px}
  .st-chem-toggle{display:flex;align-items:center;flex-wrap:wrap;gap:4px 8px;width:100%;text-align:left;cursor:pointer;
    background:none;border:1px solid var(--border,#333);border-radius:8px;padding:6px 9px;color:inherit;font:inherit}
  .st-chem-toggle:hover{border-color:var(--accent,#46b17b)}
  .st-chem-sum{font-size:11px}
  .st-chem-hint{margin-left:auto;font-family:ui-monospace,monospace;font-size:9.5px;color:var(--muted,#9a9)}
  .st-chem-chev{font-style:normal;font-size:9px;color:var(--muted,#9a9)}
  .st-chem-rows{display:flex;flex-direction:column;gap:2px}
  .st-chem-row{display:flex;flex-direction:column}
  .st-chem-name{display:flex;align-items:center;gap:7px;width:100%;text-align:left;cursor:pointer;
    background:none;border:0;border-radius:6px;padding:3px 7px;color:inherit;font:inherit}
  .st-chem-name:hover,.st-chem-name.on{background:var(--track,#2a2a33)}
  .st-chem-name b{font-size:11.5px;min-width:92px}
  .st-chem-tilt{width:52px;height:4px;border-radius:99px;background:#e5484d;overflow:hidden;flex:none}
  .st-chem-tilt span{display:block;height:100%;background:#46b17b}
  .st-chem-n{font-family:ui-monospace,monospace;font-size:9.5px;color:var(--muted,#9a9)}
  .st-chem-ok{color:#46b17b}.st-chem-love{color:#e0699a}.st-chem-burn{color:#e5484d}.st-chem-riv{color:#e5843e}
  .st-chem-pairs{display:flex;flex-direction:column;gap:2px;margin:2px 0 5px 22px;
    padding-left:9px;border-left:2px solid var(--border,#333)}
  .st-chem-pair{font-size:11px}
  .st-chem-pair.st-chem-good{color:#46b17b}
  .st-chem-pair.st-chem-bad{color:#e5843e}
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
  /* The wardrobe. One row per look; the count is unbounded, so this is a
     list rather than the fixed second slot it replaced. */
  .st-por{border:1px dashed var(--border,#333);border-radius:10px;padding:10px;background:rgba(255,255,255,.02)}
  .st-por-head{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;margin-bottom:8px}
  .st-por-head b{font-size:12px;letter-spacing:.02em}
  .st-por-hint{flex:1 1 220px;min-width:0;font-size:11px;line-height:1.45;color:var(--muted,#8b949e)}
  .st-por-empty{margin:0;font-size:11px;line-height:1.45;color:var(--muted,#8b949e)}
  .st-por-row{display:flex;gap:11px;align-items:flex-start;padding:9px 0;border-top:1px solid var(--border,#2a2a30)}
  .st-por-row:first-child{border-top:none;padding-top:2px}
  .st-por-face{position:relative;width:64px;height:64px;flex:0 0 auto;border-radius:10px;overflow:hidden;
    background:var(--border,#333);border:1px solid var(--border,#333);display:grid;place-items:center;cursor:pointer}
  .st-por-face img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .st-por-face-ph{position:relative;font-size:9px;letter-spacing:.04em;color:var(--muted,#8b949e);text-align:center}
  .st-por-face img + .st-por-face-ph{opacity:0}
  .st-por-face:hover .st-por-face-ph{opacity:1;background:rgba(0,0,0,.55);width:100%;padding:3px 0}
  .st-por-fields{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:6px}
  .st-por-line{display:flex;gap:7px;flex-wrap:wrap}
  .st-por-show{flex:0 0 132px}
  .st-por-label{flex:1 1 160px;min-width:0}
  .st-por-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:10.5px;color:var(--muted,#8b949e)}
  .st-por-meta code{font-size:10.5px;color:var(--accent,#f85149)}
  .st-por-warn{color:#e5843e;font-weight:600}
  .st-por-def{display:inline-flex;align-items:center;gap:5px;cursor:pointer;user-select:none}
  .st-por-def input{accent-color:var(--accent,#f85149);cursor:pointer}
  .st-por-del{font-size:10.5px;padding:2px 8px}
  .st-btn-quiet{opacity:.75}
  .st-portrait{width:96px;height:96px;flex:0 0 auto;border-radius:12px;overflow:hidden;background:var(--border,#333);border:1px solid var(--border,#333);display:grid;place-items:center}
  .st-portrait img{width:100%;height:100%;object-fit:cover}
  .st-portrait-ph{font-size:10px;color:var(--muted,#889)}
  .st-idfields{flex:1;display:flex;flex-direction:column;gap:8px;min-width:0}
  .st-l{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--muted,#9a9);font-weight:600}
  .st-l-txt{font-size:12px;color:var(--muted,#9a9);font-weight:600}
  .st-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .st-row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
  /* The inputs line up even when one label carries a hint and its neighbour
     does not. Each .st-l is a flex column filling its grid cell, so without
     this the labelled one pushes its own input down and sits low. Both row
     widths need it — fixing only .st-row3 left Slug/Age crooked. */
  .st-row2 > .st-l > .st-input,
  .st-row3 > .st-l > .st-input{margin-top:auto}
  @media(max-width:720px){ .st-row3{grid-template-columns:1fr} }
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
  /* The casting interview fold. Eleven questions is the longest thing on this
     form and the least often edited, so it ships shut and says how full it is
     from the closed state — otherwise you have to open it to find out. */
  .st-iv{margin:14px 0;border:1px solid var(--st-stroke,rgba(255,255,255,.12));border-radius:10px;background:rgba(255,255,255,.02)}
  .st-iv-sum{cursor:pointer;padding:11px 14px;font-weight:700;list-style:none;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
  .st-iv-sum::-webkit-details-marker{display:none}
  .st-iv-sum::before{content:'\\25b8';display:inline-block;transition:transform .15s;opacity:.6}
  .st-iv[open] .st-iv-sum::before{transform:rotate(90deg)}
  .st-iv-body{padding:0 14px 12px;display:grid;gap:10px}
  .st-iv-gen{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:2px}
  .st-iv-body .st-l{font-size:12.5px;font-weight:600;line-height:1.45}
  .st-cont{margin:14px 0;border:1px solid var(--st-stroke,rgba(255,255,255,.12));border-radius:10px;background:rgba(255,255,255,.02)}
  .st-cont-sum{cursor:pointer;padding:11px 14px;font-weight:700;list-style:none;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
  .st-cont-sum::-webkit-details-marker{display:none}
  .st-cont-sum::before{content:'▸';display:inline-block;transition:transform .15s;opacity:.6}
  .st-cont[open] .st-cont-sum::before{transform:rotate(90deg)}
  .st-cont-body{padding:0 14px 12px;display:grid;gap:12px}
  .st-cont-season{border-left:2px solid var(--st-stroke,rgba(255,255,255,.14));padding:2px 0 2px 11px;display:grid;gap:5px}
  .st-cont-head{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;font-weight:700;font-size:13px}
  /* The show tag is the whole point of the box being show-aware: a Big Brother
     row and a Total Drama row must never be mistakable for one another. */
  .st-cont-show{font-size:10.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;
    padding:1px 6px;border-radius:999px;border:1px solid var(--st-stroke,rgba(255,255,255,.18));opacity:.85}
  .st-cont-place{font-variant-numeric:tabular-nums}
  .st-cont-title{font-weight:500;opacity:.7;font-size:12px}
  .st-cont-style{font-size:12px;opacity:.85;font-style:italic}
  .st-cont-stats{font-size:11.5px;opacity:.75;font-variant-numeric:tabular-nums}
  .st-cont-moments{margin:0;padding-left:16px;display:grid;gap:3px;font-size:12px;line-height:1.45;opacity:.9}
  .st-cont-ties{font-size:11.5px;opacity:.8;display:grid;gap:2px}
  .st-cont-thin{font-size:11.5px;opacity:.6;font-style:italic}
  .st-cont-sum-line{font-size:12px;opacity:.8;padding-bottom:2px}
  .st-cont-read{border-top:1px dashed var(--st-stroke,rgba(255,255,255,.14));padding-top:11px;display:grid;gap:9px}
  .st-cont-gen{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  .st-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:2px}
  .st-btn{background:var(--surface,#26262e);border:1px solid var(--border,#333);border-radius:8px;color:inherit;font:inherit;font-size:12px;padding:8px 12px;cursor:pointer}
  .st-btn:hover{border-color:var(--accent,#f4b23e)}
  .st-btn.st-sm{font-size:11px;padding:5px 9px}
  .st-primary{background:var(--accent,#f4b23e);color:#151119;border-color:transparent;font-weight:700}
  .st-lg{padding:10px 18px;font-size:14px}
  .st-danger{color:#e5484d;border-color:#e5484d55}
  .st-save-note{font-size:12px;font-family:ui-monospace,monospace}
  .st-save-note.ok{color:#46b17b}.st-save-note.err{color:#e5484d}
  .st-profile-dialog{width:min(960px,calc(100vw - 32px));max-height:calc(100vh - 32px);padding:0;border:1px solid var(--border,#333);border-radius:16px;background:var(--surface,#1c1c22);color:inherit;box-shadow:0 24px 80px rgba(0,0,0,.65)}
  .st-profile-dialog::backdrop{background:rgba(5,5,10,.72);backdrop-filter:blur(3px)}
  .st-profile-card{display:flex;flex-direction:column;max-height:calc(100vh - 32px)}
  .st-profile-card>header{display:flex;justify-content:space-between;gap:16px;padding:18px 20px;border-bottom:1px solid var(--border,#333)}
  .st-profile-card h2,.st-profile-card p{margin:0}.st-profile-card header p{margin-top:4px;color:var(--muted,#9a9);font-size:12px}
  .st-profile-x{border:0;background:none;color:inherit;font:inherit;font-size:24px;cursor:pointer;border-radius:6px}
  .st-profile-groups{padding:16px 20px;overflow:auto}.st-profile-group+ .st-profile-group{margin-top:18px}.st-profile-group h3{margin:0 0 7px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--accent,#f4b23e)}
  .st-profile-row{display:grid;grid-template-columns:22px 110px minmax(0,1fr);gap:9px 10px;align-items:start;padding:10px 0;border-top:1px solid var(--border,#333)}
  .st-profile-row>input{margin-top:4px;accent-color:var(--accent,#f4b23e)}.st-profile-field{font-weight:700;font-size:12px;padding-top:3px}
  .st-profile-values{display:grid;grid-template-columns:1fr 1fr;gap:8px}.st-profile-values>span{min-width:0;padding:8px;border-radius:8px;background:rgba(255,255,255,.035)}
  .st-profile-values b{display:block;margin-bottom:5px;font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted,#9a9)}.st-profile-values code{display:block;white-space:pre-wrap;overflow-wrap:anywhere;font:11px/1.45 ui-monospace,monospace}
  /* A row offering more than one answer stacks them: with two sources the
     side-by-side grid would put "Current" beside the first option and hide the
     second below it, which reads as one choice rather than two. */
  .st-profile-row.has-choice .st-profile-values{grid-template-columns:1fr}
  .st-profile-pick{display:grid;grid-template-columns:18px auto minmax(0,1fr);gap:6px 9px;align-items:start;
    padding:8px;border-radius:8px;background:rgba(255,255,255,.035);cursor:pointer}
  .st-profile-pick:has(input:checked){outline:1px solid var(--accent,#f4b23e);background:rgba(244,178,62,.07)}
  .st-profile-pick .st-profile-sources{grid-column:3}
  .st-profile-status{font-size:11.5px;color:var(--muted,#9a9);padding:0 0 8px;min-height:16px;line-height:1.45}
  .st-profile-sources{grid-column:3;display:flex;gap:5px;flex-wrap:wrap}.st-profile-source{font-size:9px;padding:2px 7px;border:1px solid var(--border,#333);border-radius:999px;color:var(--muted,#9a9)}
  .st-profile-row.is-invalid{opacity:.6}.st-profile-errors{margin:12px 20px 0;padding:9px 12px;border:1px solid #e5484d88;border-radius:8px;color:#ff9b9e;background:#e5484d12;font-size:11px}.st-profile-errors p+p{margin-top:4px}
  .st-profile-card>footer{display:grid;grid-template-columns:auto auto 1fr auto auto;gap:8px;padding:13px 20px;border-top:1px solid var(--border,#333);background:var(--surface,#1c1c22)}
  .st-profile-dialog :focus-visible{outline:2px solid var(--accent,#f4b23e);outline-offset:2px}
  @media(max-width:720px){.st-profile-dialog{width:calc(100vw - 16px);max-height:calc(100vh - 16px)}.st-profile-row{grid-template-columns:22px 1fr}.st-profile-field{grid-column:2}.st-profile-values,.st-profile-sources{grid-column:2}.st-profile-values{grid-template-columns:1fr}.st-profile-card>footer{grid-template-columns:1fr 1fr}.st-profile-card>footer span{display:none}}
  @media(prefers-reduced-motion:reduce){.st-profile-dialog::backdrop{backdrop-filter:none}.st-profile-dialog *{scroll-behavior:auto!important;transition:none!important}}
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
