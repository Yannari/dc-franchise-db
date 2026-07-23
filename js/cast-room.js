// ══════════════════════════════════════════════════════════════════════
// cast-room.js — Visual Casting Room (UX Plan Item 5)
//
// A portrait-first casting surface rendered entirely from JS. It takes over
// the #tab-cast surface at render time and ADOPTS the existing edit form node
// into a drawer, so every legacy id / onclick handler keeps working. Nothing
// in simulator.html is modified; the legacy grid + form panels are hidden via
// a `cast-room-active` class and revealed again if the room is disabled.
//
// Deps: core.js (state + constants), players.js (threat/overall/tribe helpers),
// franchise-meta.js (seasons-played), cast-ui.js (saveCast/renderCast/edit flow).
// cast-ui.js NEVER imports this module — all cast-room handlers reach onclick
// through window (self-registered below), so there is no import cycle.
// ══════════════════════════════════════════════════════════════════════

import { STATS, ARCHETYPE_NAMES, ARCHETYPES, players, relationships, seasonConfig } from './core.js';
import { threat, threatTier, overall, tribeColor } from './players.js';
import { saveCast, renderCast, editPlayer, cancelEdit } from './cast-ui.js';
import { franchiseHistorySummary } from './franchise-meta.js';

// ══════════════════════════════════════════════════════════════════════
// PURE HELPERS
// ══════════════════════════════════════════════════════════════════════

export function statTotal(stats) { return STATS.reduce((t, s) => t + (stats?.[s.key] || 0), 0); }
const _key = p => p.id ?? p.name;

// Union-find over relationship pairs (bond >= threshold) → array of unit arrays.
function _relationshipUnits(pool, rels, threshold = 3) {
  const parent = new Map();
  pool.forEach(p => parent.set(_key(p), _key(p)));
  const find = x => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
  const byName = new Map(pool.map(p => [p.name, p]));
  (rels || []).forEach(r => {
    if ((r.bond ?? 0) < threshold) return;
    const a = byName.get(r.a), b = byName.get(r.b);
    if (a && b) union(_key(a), _key(b));
  });
  const groups = new Map();
  pool.forEach(p => { const root = find(_key(p)); (groups.get(root) || groups.set(root, []).get(root)).push(p); });
  return [...groups.values()];
}

// Snake index sequence: 0..n-1, n-1..0, repeating, `count` entries long.
function _snakeOrder(n, count) {
  const out = []; let i = 0, dir = 1;
  while (out.length < count) {
    out.push(i);
    if (dir === 1) { if (i === n - 1) dir = -1; else i++; }
    else { if (i === 0) dir = 1; else i--; }
  }
  return out;
}

// Shared distributor for balance / snake / randomize. metricFn(player) → number.
// Returns a NEW array of player clones (input order) with `.tribe` reassigned.
function _distribute(pool, tribeNames, metricFn, { preserve = false, relationships: rels = [], rng = Math.random, shuffle = false } = {}) {
  if (!tribeNames || !tribeNames.length) return pool.map(p => ({ ...p }));
  let units = (preserve && rels && rels.length) ? _relationshipUnits(pool, rels) : pool.map(p => [p]);
  units.forEach(u => { u._m = u.reduce((t, p) => t + metricFn(p), 0); });
  if (shuffle) {
    // Fisher–Yates with injectable rng (deterministic in tests)
    for (let i = units.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [units[i], units[j]] = [units[j], units[i]]; }
  } else {
    // Heaviest units first; tie-break: larger unit first, then first-member name.
    units.sort((a, b) => b._m - a._m || b.length - a.length || (a[0]?.name || '').localeCompare(b[0]?.name || ''));
  }
  const order = _snakeOrder(tribeNames.length, units.length);
  const assign = new Map();
  units.forEach((u, i) => { const t = tribeNames[order[i]]; u.forEach(p => assign.set(_key(p), t)); });
  return pool.map(p => ({ ...p, tribe: assign.get(_key(p)) ?? p.tribe }));
}

export function balanceTribes(pool, tribeNames, opts = {}) {
  return _distribute(pool, tribeNames, p => statTotal(p.stats), opts);
}
export function snakeDraft(pool, tribeNames, opts = {}) {
  return _distribute(pool, tribeNames, p => parseFloat(threat(p.stats)), opts);
}
export function randomizeTribes(pool, tribeNames, opts = {}, rng = Math.random) {
  return _distribute(pool, tribeNames, () => 0, { ...opts, shuffle: true, rng });
}

// Filters: { search, archetype, tribe ('__none__' = unassigned), returnee
// ('all'|'returning'|'new'), gender, seasons ('0'|'1'|'2+'), seasonsOf(name)->count }
export function castRoomFilter(pool, filters = {}) {
  const q = (filters.search || '').trim().toLowerCase();
  return (pool || []).filter(p => {
    if (q && !p.name.toLowerCase().includes(q)) return false;
    if (filters.archetype && p.archetype !== filters.archetype) return false;
    if (filters.tribe) {
      if (filters.tribe === '__none__') { if (p.tribe) return false; }
      else if (p.tribe !== filters.tribe) return false;
    }
    if (filters.returnee === 'returning' && !p.isReturnee) return false;
    if (filters.returnee === 'new' && p.isReturnee) return false;
    if (filters.gender && p.gender !== filters.gender) return false;
    if (filters.seasons && typeof filters.seasonsOf === 'function') {
      const n = filters.seasonsOf(p.name) || 0;
      if (filters.seasons === '0' && n !== 0) return false;
      if (filters.seasons === '1' && n !== 1) return false;
      if (filters.seasons === '2+' && n < 2) return false;
    }
    return true;
  });
}

// Casting warnings — pure. `configuredTribes` optional (names) enables the
// empty-configured-tribe check without breaking the 2-arg contract.
export function castWarnings(pool, rels, configuredTribes) {
  const out = [];
  const cast = pool || [];
  const groups = {};
  cast.filter(p => p.tribe).forEach(p => (groups[p.tribe] ??= []).push(p));
  const names = Object.keys(groups);

  // 1. Severe stat imbalance
  if (names.length >= 2) {
    const avgs = names.map(t => groups[t].reduce((s, p) => s + statTotal(p.stats), 0) / groups[t].length);
    const spread = Math.max(...avgs) - Math.min(...avgs);
    if (spread > 6) out.push({ level: 'warn', text: `Stat imbalance — tribe average totals differ by ${spread.toFixed(0)} points.` });
  }

  // 2. Missing tribes: unassigned players (while others are assigned) + empty configured tribes
  const noTribe = cast.filter(p => !p.tribe);
  if (noTribe.length && names.length) {
    out.push({ level: 'info', text: `${noTribe.length} player${noTribe.length === 1 ? '' : 's'} unassigned to a tribe.` });
  }
  if (Array.isArray(configuredTribes)) {
    configuredTribes.forEach(t => { if (t && !groups[t]) out.push({ level: 'info', text: `Tribe "${t}" has no members.` }); });
  }

  // 3. Archetype concentration
  names.forEach(t => {
    const counts = {};
    groups[t].forEach(p => (counts[p.archetype] = (counts[p.archetype] || 0) + 1));
    Object.entries(counts).forEach(([a, c]) => {
      if (c >= 3) out.push({ level: 'info', text: `${t}: ${c} ${ARCHETYPE_NAMES[a] || a || 'unset'} players stacked on one tribe.` });
    });
  });
  if (cast.length) {
    const counts = {};
    cast.forEach(p => (counts[p.archetype] = (counts[p.archetype] || 0) + 1));
    Object.entries(counts).forEach(([a, c]) => {
      if (c / cast.length >= 0.4) out.push({ level: 'info', text: `${Math.round(c / cast.length * 100)}% of the cast are ${ARCHETYPE_NAMES[a] || a || 'unset'}.` });
    });
  }

  // 4. Overloaded pre-existing relationships
  if (rels && rels.length) {
    if (rels.length > cast.length / 3) out.push({ level: 'warn', text: `${rels.length} preset relationships for ${cast.length} players — the pre-game web is heavy.` });
    const per = {};
    rels.forEach(r => { per[r.a] = (per[r.a] || 0) + 1; per[r.b] = (per[r.b] || 0) + 1; });
    Object.entries(per).forEach(([n, c]) => { if (c >= 3) out.push({ level: 'warn', text: `${n} is tangled in ${c} preset relationships.` }); });
  }

  // 5. Uneven tribes
  if (names.length >= 2) {
    const sizes = names.map(t => groups[t].length);
    const diff = Math.max(...sizes) - Math.min(...sizes);
    if (diff >= 2) out.push({ level: 'warn', text: `Uneven tribes — sizes range ${Math.min(...sizes)} to ${Math.max(...sizes)}.` });
  }

  return out;
}

// ══════════════════════════════════════════════════════════════════════
// RENDER LAYER
// ══════════════════════════════════════════════════════════════════════

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Distinct tribe names actually present in the cast.
function _castTribeNames() { return [...new Set(players.map(p => p.tribe).filter(Boolean))]; }
// Configured tribe names (from season setup), if any.
function _configuredTribeNames() { return (seasonConfig.tribes || []).map(t => t.name).filter(Boolean); }
// The tribe list the casting tools distribute across.
function _toolTribeNames() {
  const cfg = _configuredTribeNames();
  if (cfg.length) return cfg;
  return _castTribeNames();
}

// Seasons-played cache, rebuilt each full render (lazy per name).
let _seasonsCache = new Map();
function _seasonsOf(name) {
  if (_seasonsCache.has(name)) return _seasonsCache.get(name);
  let n = 0;
  try { n = (franchiseHistorySummary(name) || []).length; } catch { n = 0; }
  _seasonsCache.set(name, n);
  return n;
}

// Portrait: real avatar with an SVG gold-ring medallion fallback (initial).
function _portrait(p) {
  const tc = tribeColor(p.tribe);
  const initial = esc((p.name || '?')[0].toUpperCase());
  const medallion =
    `<svg class="cr-medallion" viewBox="0 0 72 72" aria-hidden="true">` +
    `<circle cx="36" cy="36" r="33" fill="var(--surface2)" stroke="var(--accent-gold,#f0c040)" stroke-width="2"/>` +
    `<text x="36" y="47" text-anchor="middle" font-size="30" font-family="var(--font-display,sans-serif)" fill="var(--muted)">${initial}</text></svg>`;
  const img = p.slug
    ? `<img class="cr-face" src="assets/avatars/${esc(p.slug)}.png" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none'">`
    : '';
  return `<div class="cr-portrait" style="--tc:${tc}">${medallion}${img}</div>`;
}

// Card stat block. Default: the two strongest stats as labelled bars ("faces
// before statistics"). With the ⚏ Stats toggle on, every card shows the full
// 9-stat sheet as a compact grid so casts can be compared at a glance.
function _topStats(stats) {
  if (typeof window !== 'undefined' && window._crShowAllStats) {
    // No bars here — at 3 columns × 9 stats they collapse into noise. A clean
    // "LABEL value" pair per cell reads at a glance.
    return `<span class="cr-allstats">` + STATS.map(s => {
      const val = stats?.[s.key] || 0;
      return `<span class="cr-as" title="${esc(s.name || s.label)}: ${val}">` +
        `<span class="cr-as-k" style="color:${s.color}">${s.label}</span>` +
        `<span class="cr-as-v">${val}</span></span>`;
    }).join('') + `</span>`;
  }
  const ranked = STATS.map(s => ({ label: s.label, color: s.color, val: stats?.[s.key] || 0 }))
    .sort((a, b) => b.val - a.val).slice(0, 2);
  return ranked.map(s =>
    `<span class="cr-stat"><span class="cr-stat-k" style="color:${s.color}">${s.label}</span>` +
    `<span class="cr-stat-bar"><span style="width:${s.val * 10}%;background:${s.color}"></span></span>` +
    `<span class="cr-stat-v">${s.val}</span></span>`).join('');
}

// ⚏ Stats toggle — persisted on window like _crView/_crFilters; grid-only
// re-render keeps scroll and filter state intact.
export function crToggleStats() {
  window._crShowAllStats = !window._crShowAllStats;
  const btn = document.getElementById('cr-statsbtn');
  if (btn) { btn.classList.toggle('active', window._crShowAllStats); btn.setAttribute('aria-pressed', String(!!window._crShowAllStats)); }
  crRenderGrid();
}
if (typeof window !== 'undefined') window.crToggleStats = crToggleStats;

function _card(p, opts = {}) {
  const tc = tribeColor(p.tribe);
  const arch = ARCHETYPE_NAMES[p.archetype] || 'Custom';
  const th = parseFloat(threat(p.stats)), tier = threatTier(th);
  const tribeChip = p.tribe
    ? `<span class="cr-chip" style="background:${tc}22;color:${tc};border-color:${tc}55">${esc(p.tribe)}</span>`
    : `<span class="cr-chip cr-chip-none">No tribe</span>`;
  const ret = p.isReturnee ? `<span class="cr-badge-ret" title="Returning player">RETURNING</span>` : '';
  const tribeSelect = opts.withSelect ? _tribeSelect(p) : '';
  return `<div class="cr-card" tabindex="0" role="button" aria-label="Edit ${esc(p.name)}"
      data-pid="${esc(p.id)}" ${opts.draggable ? 'draggable="true" ondragstart="crDragStart(event)"' : ''}
      onclick="crOpenDrawerFor(this.dataset.pid)" onkeydown="crCardKey(event)">
    ${_portrait(p)}
    <div class="cr-name" title="${esc(p.name)}">${esc(p.name)}${ret}</div>
    <div class="cr-meta">
      <span class="cr-arch">${esc(arch)}</span>
      ${tribeChip}
    </div>
    <div class="cr-stats">${_topStats(p.stats)}</div>
    <div class="cr-threat"><span class="cr-dot" style="background:${tier.color}"></span>${tier.label} · ${th.toFixed(1)}</div>
    ${tribeSelect}
  </div>`;
}

function _tribeSelect(p) {
  const names = _toolTribeNames();
  const opts = [`<option value=""${!p.tribe ? ' selected' : ''}>Unassigned</option>`]
    .concat(names.map(n => `<option value="${esc(n)}"${p.tribe === n ? ' selected' : ''}>${esc(n)}</option>`)).join('');
  return `<select class="cr-tribe-sel" data-pid="${esc(p.id)}" aria-label="Set tribe for ${esc(p.name)}"
    onclick="event.stopPropagation()" onchange="crChangeTribe(event)">${opts}</select>`;
}

// Persistent filter state — the SINGLE source of truth (mirrors how _crPreserve is
// kept on window). Survives every re-render so search/dropdowns are not wiped when
// the filter bar is rebuilt after a drag-drop, tool run, or save.
function _getFilters() {
  if (!window._crFilters) window._crFilters = { search: '', archetype: '', tribe: '', returnee: 'all', gender: '', seasons: '' };
  return window._crFilters;
}
// Pull the live DOM values into the persistent state (called from input handlers).
function _syncFiltersFromDOM() {
  const g = id => document.getElementById(id);
  const f = _getFilters();
  if (g('cr-f-search')) f.search = g('cr-f-search').value;
  if (g('cr-f-arch')) f.archetype = g('cr-f-arch').value;
  if (g('cr-f-tribe')) f.tribe = g('cr-f-tribe').value;
  if (g('cr-f-ret')) f.returnee = g('cr-f-ret').value;
  if (g('cr-f-gender')) f.gender = g('cr-f-gender').value;
  if (g('cr-f-seasons')) f.seasons = g('cr-f-seasons').value;
  return f;
}
// Read filters for the grid — always from persistent state, never the DOM.
function _readFilters() { return { ..._getFilters(), seasonsOf: _seasonsOf }; }

function _activeFilterCount(f) {
  let n = 0;
  if (f.search) n++;
  if (f.archetype) n++;
  if (f.tribe) n++;
  if (f.returnee && f.returnee !== 'all') n++;
  if (f.gender) n++;
  if (f.seasons) n++;
  return n;
}

// ── Filter bar — rendered FROM persistent state so a rebuild reflects the user's
//    current search text + dropdown selections (values/selected attributes). ──
function _filterBarHTML() {
  const f = _getFilters();
  const opt = (v, label, sel) => `<option value="${esc(v)}"${sel === v ? ' selected' : ''}>${label}</option>`;
  const archOpts = [opt('', 'All archetypes', f.archetype)]
    .concat(Object.keys(ARCHETYPES).map(k => opt(k, esc(ARCHETYPE_NAMES[k] || k), f.archetype))).join('');
  const tribeOpts = [opt('', 'All tribes', f.tribe), opt('__none__', 'No tribe', f.tribe)]
    .concat(_castTribeNames().map(n => opt(n, esc(n), f.tribe))).join('');
  const retOpts = [opt('all', 'All players', f.returnee), opt('returning', 'Returning', f.returnee), opt('new', 'New', f.returnee)].join('');
  const genderOpts = [opt('', 'Any gender', f.gender), opt('m', 'He/Him', f.gender), opt('f', 'She/Her', f.gender), opt('nb', 'They/Them', f.gender)].join('');
  const seasonsOpts = [opt('', 'Any experience', f.seasons), opt('0', 'Rookies (0)', f.seasons), opt('1', '1 season', f.seasons), opt('2+', 'Veterans (2+)', f.seasons)].join('');
  return `<div class="cr-filters" id="cr-filters">
    <input id="cr-f-search" class="cr-input" type="text" placeholder="Search name…" aria-label="Search cast by name" value="${esc(f.search)}" oninput="crOnFilterInput()">
    <select id="cr-f-arch" class="cr-select" aria-label="Filter by archetype" onchange="crOnFilterInput()">${archOpts}</select>
    <select id="cr-f-tribe" class="cr-select" aria-label="Filter by tribe" onchange="crOnFilterInput()">${tribeOpts}</select>
    <select id="cr-f-ret" class="cr-select" aria-label="Filter by returnee status" onchange="crOnFilterInput()">${retOpts}</select>
    <select id="cr-f-gender" class="cr-select" aria-label="Filter by gender" onchange="crOnFilterInput()">${genderOpts}</select>
    <select id="cr-f-seasons" class="cr-select" aria-label="Filter by seasons played" onchange="crOnFilterInput()">${seasonsOpts}</select>
    <span class="cr-filter-count" id="cr-filter-count" hidden></span>
    <button class="cr-clear" id="cr-clear" onclick="crClearFilters()" hidden>Clear</button>
  </div>`;
}

function _warningsHTML() {
  const w = castWarnings(players, relationships, _configuredTribeNames());
  if (!w.length) return '';
  const rows = w.map(x => `<span class="cr-warn-row cr-warn-${x.level}">${esc(x.text)}</span>`).join('');
  return `<div class="cr-warnings" id="cr-warnings">
    <div class="cr-warn-rows">${rows}</div>
    <button class="cr-warn-x" onclick="document.getElementById('cr-warnings')?.remove()" aria-label="Dismiss warnings">✕</button>
  </div>`;
}

// ── Grid / Tribes body (re-rendered on filter + data changes) ──
export function crRenderGrid() {
  const host = document.getElementById('cr-body');
  if (!host) return;
  const filters = _readFilters();
  const view = window._crView || 'grid';
  const shown = castRoomFilter(players, filters);
  // header count — keep it live on EVERY grid render (it previously only
  // updated on the re-render branch, so first paint showed "0 players")
  const hc = document.getElementById('cr-header-count');
  if (hc) hc.textContent = `${players.length} player${players.length === 1 ? '' : 's'}`;
  // counter + clear chip
  const fc = document.getElementById('cr-filter-count');
  const clr = document.getElementById('cr-clear');
  const active = _activeFilterCount(filters);
  if (fc) { fc.textContent = `${active} filter${active === 1 ? '' : 's'} · ${shown.length}/${players.length}`; fc.hidden = active === 0; }
  if (clr) clr.hidden = active === 0;

  if (view === 'tribes') { host.innerHTML = _tribesBodyHTML(shown); return; }

  if (!players.length) {
    host.innerHTML = `<div class="cr-empty"><div class="cr-empty-icon">🎬</div><p>No cast yet — add players or load a preset.</p></div>`;
    return;
  }
  if (!shown.length) {
    host.innerHTML = `<div class="cr-empty"><p>No players match these filters.</p><button class="cr-clear" onclick="crClearFilters()">Clear filters</button></div>`;
    return;
  }
  const sorted = [...shown].sort((a, b) => (a.tribe || '~').localeCompare(b.tribe || '~') || a.name.localeCompare(b.name));
  host.innerHTML = `<div class="cr-grid">${sorted.map(p => _card(p)).join('')}</div>`;
}

function _tribesBodyHTML(shown) {
  const laneNames = [...new Set([..._configuredTribeNames(), ..._castTribeNames()])];
  const shownIds = new Set(shown.map(_key));
  const lanes = laneNames.map(name => {
    const members = players.filter(p => p.tribe === name && shownIds.has(_key(p)));
    const all = players.filter(p => p.tribe === name);
    const avg = all.length ? (all.reduce((t, p) => t + statTotal(p.stats), 0) / all.length).toFixed(0) : '0';
    const tc = tribeColor(name);
    const body = members.length
      ? members.map(p => _card(p, { draggable: true, withSelect: true })).join('')
      : `<div class="cr-lane-hint">drop players here</div>`;
    return `<div class="cr-lane" data-tribe="${esc(name)}" ondragover="crDragOver(event)" ondragleave="crDragLeave(event)" ondrop="crDrop(event)">
      <div class="cr-lane-head"><span class="cr-lane-dot" style="background:${tc}"></span>
        <span class="cr-lane-name">${esc(name)}</span>
        <span class="cr-lane-meta">${all.length} · avg ${avg}</span></div>
      <div class="cr-lane-body">${body}</div>
    </div>`;
  });
  // Unassigned lane
  const un = players.filter(p => !p.tribe && shownIds.has(_key(p)));
  const unAll = players.filter(p => !p.tribe);
  const unBody = un.length ? un.map(p => _card(p, { draggable: true, withSelect: true })).join('') : `<div class="cr-lane-hint">drop players here</div>`;
  lanes.push(`<div class="cr-lane cr-lane-un" data-tribe="" ondragover="crDragOver(event)" ondragleave="crDragLeave(event)" ondrop="crDrop(event)">
    <div class="cr-lane-head"><span class="cr-lane-dot" style="background:var(--muted)"></span>
      <span class="cr-lane-name">Unassigned</span><span class="cr-lane-meta">${unAll.length}</span></div>
    <div class="cr-lane-body">${unBody}</div>
  </div>`);

  const toolbar = `<div class="cr-toolbar">
    <span class="cr-toolbar-label">Casting tools</span>
    <button class="cr-tool" onclick="crBalance()" title="Snake-distribute by total stats">Balance</button>
    <button class="cr-tool" onclick="crSnake()" title="Snake draft by threat">Snake Draft</button>
    <button class="cr-tool" onclick="crRandomize()" title="Shuffle evenly">Randomize</button>
    <label class="cr-preserve"><input type="checkbox" id="cr-preserve" ${window._crPreserve ? 'checked' : ''} onchange="crTogglePreserve()"> Preserve relationships</label>
  </div>`;
  return toolbar + `<div class="cr-lanes">${lanes.join('')}</div>`;
}

// ══════════════════════════════════════════════════════════════════════
// FULL RENDER + ADOPTION
// ══════════════════════════════════════════════════════════════════════

export function renderCastRoom() {
  if (typeof document === 'undefined') return;
  if (window._castRoomDisabled) {
    // Clean legacy-only fallback at ANY time. The edit form was physically ADOPTED
    // (moved) into the drawer, so we must first restore it to the legacy panel, then
    // drop the takeover class (reveals legacy UI) and remove the room shell entirely
    // so it can never stack on top. Re-enabling rebuilds + re-adopts from scratch.
    _setDrawerOpen(false);
    _restoreForm();
    document.getElementById('tab-cast')?.classList.remove('cast-room-active');
    document.getElementById('cast-room')?.remove();
    return;
  }
  const tab = document.getElementById('tab-cast');
  if (!tab) return; // legacy DOM absent — nothing to take over

  _injectCSS();
  _seasonsCache = new Map(); // rebuild seasons cache each full render

  // Build the room shell once; reuse across renders.
  let room = document.getElementById('cast-room');
  if (!room) {
    room = document.createElement('div');
    room.id = 'cast-room';
    room.innerHTML = _shellHTML();
    tab.appendChild(room);
    _buildDrawer(room);
  } else {
    // refresh header count + filter bar + warnings (grid handled below)
    const header = room.querySelector('#cr-header-count');
    if (header) header.textContent = `${players.length} player${players.length === 1 ? '' : 's'}`;
    const fb = room.querySelector('#cr-filterwrap');
    if (fb) fb.innerHTML = _warningsHTML() + _filterBarHTML();
  }
  tab.classList.add('cast-room-active');

  // Adopt the legacy form node into the drawer (once).
  _adoptForm(room);

  // View toggle active state
  const view = window._crView || 'grid';
  room.querySelectorAll('.cr-viewbtn').forEach(b => b.classList.toggle('active', b.dataset.view === view));

  // Drawer visual state — close on data-render unless a keep flag is set.
  if (!window._crKeepDrawerOpen) _setDrawerOpen(false);

  crRenderGrid();
}

function _shellHTML() {
  return `
    <div class="cr-topbar">
      <div class="cr-title-wrap">
        <h2 class="cr-title">Casting Room</h2>
        <span class="cr-header-count" id="cr-header-count">0 players</span>
      </div>
      <div class="cr-topbar-actions">
        <div class="cr-viewtoggle" role="tablist" aria-label="Cast view">
          <button class="cr-viewbtn active" data-view="grid" onclick="crSetView('grid')">Grid</button>
          <button class="cr-viewbtn" data-view="tribes" onclick="crSetView('tribes')">Tribes</button>
        </div>
        <button class="cr-viewbtn cr-statsbtn${typeof window !== 'undefined' && window._crShowAllStats ? ' active' : ''}" id="cr-statsbtn"
          onclick="crToggleStats()" title="Show all 9 stats on every card" aria-pressed="${typeof window !== 'undefined' && !!window._crShowAllStats}">⚏ Stats</button>
        <div class="cr-manage-wrap">
          <button class="cr-manage-btn" onclick="crToggleManage(event)" aria-haspopup="true">⚙ Manage</button>
          <div class="cr-manage-menu" id="cr-manage-menu" hidden>${_manageMenuHTML()}</div>
        </div>
        <button class="cr-add" onclick="crAddPlayer()">＋ Add player</button>
      </div>
    </div>
    <div id="cr-filterwrap">${_warningsHTML()}${_filterBarHTML()}</div>
    <div id="cr-body"></div>
    <input type="file" id="cr-import-cast-file" accept=".json" style="display:none" onchange="importCast(event)">`;
}

function _manageMenuHTML() {
  // Every action calls an EXISTING window function (or clicks a hidden legacy input).
  const item = (label, call) => `<button class="cr-menu-item" onclick="crCloseManage();${call}">${label}</button>`;
  return [
    `<div class="cr-menu-group">Roster</div>`,
    item('Sync cast → roster', 'syncCastToRoster()'),
    item('Export roster', 'exportRoster()'),
    item('Import roster', `document.getElementById('import-roster-file')?.click()`),
    `<div class="cr-menu-group">Cast</div>`,
    item('Export cast', 'exportCast()'),
    item('Import cast', `document.getElementById('cr-import-cast-file')?.click()`),
    `<div class="cr-menu-group">Presets</div>`,
    item('Save preset', 'savePreset()'),
    item('Export full preset', 'exportPreset()'),
    item('Import full preset', `document.getElementById('import-preset-file')?.click()`),
    `<div class="cr-menu-group">Quick load</div>`,
    item('S9 cast', 'loadS9Preset()'),
    item('S10 cast', 'loadS10Preset()'),
    item('Clear all', 'clearCast()'),
  ].join('');
}

// Move the legacy form nodes (title → #edit-actions) into the drawer form host.
function _adoptForm(room) {
  try {
    const host = room.querySelector('#cr-drawer-form');
    if (!host || host.dataset.adopted) return;
    const aside = document.querySelector('#tab-cast .form-panel');
    if (!aside) return;
    const kids = [...aside.children];
    for (const k of kids) {
      const isBoundary = k.id === 'edit-actions' || k.querySelector?.('#edit-actions');
      host.appendChild(k); // physical adoption — keeps every id + handler
      if (isBoundary) break;
    }
    host.dataset.adopted = '1';
  } catch (e) { /* leave legacy form in place if adoption fails */ }
}

// Reverse of _adoptForm: move the adopted nodes back to the front of the legacy
// form panel (before the management buttons), restoring a whole legacy UI.
function _restoreForm() {
  try {
    const host = document.getElementById('cr-drawer-form');
    const aside = document.querySelector('#tab-cast .form-panel');
    if (!host || !aside || !host.dataset.adopted) return;
    const anchor = aside.firstChild;
    [...host.children].forEach(n => aside.insertBefore(n, anchor)); // preserves original order
    delete host.dataset.adopted;
  } catch (e) { /* best-effort restore */ }
}

function _buildDrawer(room) {
  const backdrop = document.createElement('div');
  backdrop.id = 'cr-backdrop';
  backdrop.className = 'cr-backdrop';
  backdrop.onclick = () => crCloseDrawer();
  const drawer = document.createElement('aside');
  drawer.id = 'cr-drawer';
  drawer.className = 'cr-drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-label', 'Edit player');
  drawer.innerHTML = `
    <div class="cr-drawer-head">
      <span class="cr-drawer-title">Player</span>
      <button class="cr-drawer-x" onclick="crCloseDrawer()" aria-label="Close">✕</button>
    </div>
    <div class="cr-drawer-scroll"><div id="cr-drawer-form"></div></div>`;
  room.appendChild(backdrop);
  room.appendChild(drawer);
}

// ══════════════════════════════════════════════════════════════════════
// DRAWER + INTERACTION HANDLERS (window-exposed)
// ══════════════════════════════════════════════════════════════════════

function _setDrawerOpen(open) {
  const d = document.getElementById('cr-drawer'), b = document.getElementById('cr-backdrop');
  if (d) d.classList.toggle('open', open);
  if (b) b.classList.toggle('open', open);
}

// Simple focus trap: while the drawer is open, Tab cycles within it.
function _focusable(root) {
  return [...root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(el => el.offsetParent !== null || el === document.activeElement);
}
export function crDrawerTrap(e) {
  const d = document.getElementById('cr-drawer');
  if (!d || !d.classList.contains('open') || e.key !== 'Tab') return;
  const items = _focusable(d);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  else if (!d.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
}

export function crOpenDrawerFor(pid) {
  window._crKeepDrawerOpen = true;
  try { editPlayer(pid); } finally { window._crKeepDrawerOpen = false; }
  _setDrawerOpen(true);
  const el = document.querySelector('#cr-drawer #f-name');
  if (el) setTimeout(() => { try { el.focus(); } catch {} }, 30);
}

export function crAddPlayer() {
  window._crKeepDrawerOpen = true;
  try { cancelEdit(); } finally { window._crKeepDrawerOpen = false; } // clears form + re-renders
  _setDrawerOpen(true);
  const el = document.querySelector('#cr-drawer #f-name');
  if (el) setTimeout(() => { try { el.focus(); } catch {} }, 30);
}

export function crCloseDrawer() {
  _setDrawerOpen(false);
  if (window.editingId) { try { cancelEdit(); } catch {} }
}

export function crCardKey(e) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); crOpenDrawerFor(e.currentTarget.dataset.pid); }
}

export function crSetView(view) {
  window._crView = view;
  const room = document.getElementById('cast-room');
  if (room) room.querySelectorAll('.cr-viewbtn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  crRenderGrid();
}

// Filter input handler: persist DOM values into state, then re-render the grid only
// (leaves the filter bar DOM intact, so the search input keeps focus + caret).
export function crOnFilterInput() { _syncFiltersFromDOM(); crRenderGrid(); }

export function crClearFilters() {
  window._crFilters = { search: '', archetype: '', tribe: '', returnee: 'all', gender: '', seasons: '' };
  // Reflect the reset in the live inputs (bar is not rebuilt here).
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  set('cr-f-search', ''); set('cr-f-arch', ''); set('cr-f-tribe', ''); set('cr-f-gender', ''); set('cr-f-seasons', '');
  set('cr-f-ret', 'all');
  crRenderGrid();
}

// ── Drag & drop ──
export function crDragStart(e) {
  const pid = e.currentTarget.dataset.pid;
  window._crDragId = pid;
  try { e.dataTransfer.setData('text/plain', pid); e.dataTransfer.effectAllowed = 'move'; } catch {}
  e.currentTarget.classList.add('cr-dragging');
}
export function crDragOver(e) { e.preventDefault(); try { e.dataTransfer.dropEffect = 'move'; } catch {} e.currentTarget.classList.add('cr-lane-over'); }
export function crDragLeave(e) { e.currentTarget.classList.remove('cr-lane-over'); }
export function crDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('cr-lane-over');
  let pid = window._crDragId;
  try { pid = e.dataTransfer.getData('text/plain') || pid; } catch {}
  window._crDragId = null;
  const tribe = e.currentTarget.dataset.tribe || '';
  _assignTribe(pid, tribe);
}

export function crChangeTribe(e) {
  _assignTribe(e.target.dataset.pid, e.target.value || '');
}

function _assignTribe(pid, tribe) {
  const p = players.find(x => String(_key(x)) === String(pid));
  if (!p) return;
  if (p.tribe === tribe) return;
  p.tribe = tribe;
  saveCast();
  renderCast(); // → renderCastRoom via hook
}

// ── Casting tools ──
function _applyDistribution(fn) {
  const tribeNames = _toolTribeNames();
  if (tribeNames.length < 2) { alert('Set up at least two tribes in Season Setup first.'); return; }
  const opts = { preserve: !!window._crPreserve, relationships };
  const result = fn(players, tribeNames, opts);
  const byKey = new Map(result.map(p => [String(_key(p)), p.tribe]));
  players.forEach(p => { const t = byKey.get(String(_key(p))); if (t !== undefined) p.tribe = t; });
  saveCast();
  renderCast();
}
export function crBalance() { _applyDistribution(balanceTribes); }
export function crSnake() { _applyDistribution(snakeDraft); }
export function crRandomize() { _applyDistribution((pl, tn, o) => randomizeTribes(pl, tn, o)); }
export function crTogglePreserve() { window._crPreserve = !!document.getElementById('cr-preserve')?.checked; }

// ── Manage menu ──
export function crToggleManage(e) {
  if (e) e.stopPropagation();
  const m = document.getElementById('cr-manage-menu');
  if (!m) return;
  m.hidden = !m.hidden;
  if (!m.hidden) setTimeout(() => document.addEventListener('click', crCloseManage, { once: true }), 0);
}
export function crCloseManage() { const m = document.getElementById('cr-manage-menu'); if (m) m.hidden = true; }

// ── Escape closes the drawer; Tab is trapped inside it while open ──
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const menu = document.getElementById('cr-manage-menu');
      if (menu && !menu.hidden) { crCloseManage(); return; }
      if (document.getElementById('cr-drawer')?.classList.contains('open')) { crCloseDrawer(); return; }
    }
    if (e.key === 'Tab') crDrawerTrap(e);
  });
}

// ══════════════════════════════════════════════════════════════════════
// CSS (injected once)
// ══════════════════════════════════════════════════════════════════════

function _injectCSS() {
  if (typeof document === 'undefined' || document.getElementById('cast-room-css')) return;
  const style = document.createElement('style');
  style.id = 'cast-room-css';
  style.textContent = CR_CSS;
  document.head.appendChild(style);
}

const CR_CSS = `
#tab-cast.cast-room-active > .form-panel,
#tab-cast.cast-room-active > .cast-panel { display: none !important; }
/* Block layout for the room — but ONLY while the cast tab is the ACTIVE tab.
   Without the .active guard this rule's ID specificity beat the global
   .tab-content { display:none }, keeping the cast tab (room, Manage menu,
   drawer) visible on top of every other tab. */
#tab-cast.tab-content.active.cast-room-active { display: block; }
/* When the room is NOT active (disabled / not yet taken over), the room shell must
   never stack on top of the legacy UI. */
#tab-cast:not(.cast-room-active) #cast-room { display: none !important; }

#cast-room { color: var(--text); }
.cr-topbar { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:14px; }
.cr-title-wrap { display:flex; align-items:baseline; gap:12px; }
.cr-title { font-family:var(--font-display,sans-serif); font-size:26px; letter-spacing:.5px; margin:0; text-transform:uppercase; }
.cr-header-count { font-size:12px; color:var(--muted); font-family:var(--font-mono,monospace); }
.cr-topbar-actions { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }

.cr-viewtoggle { display:inline-flex; border:1px solid var(--border); border-radius:8px; overflow:hidden; }
.cr-viewbtn { background:transparent; color:var(--muted); border:0; padding:7px 14px; font-size:13px; cursor:pointer; font-family:inherit; }
.cr-viewbtn.active { background:var(--surface2); color:var(--text); }
.cr-viewbtn:hover { color:var(--text); }

.cr-add { background:var(--accent,#10b981); color:#04120b; border:0; border-radius:8px; padding:8px 16px; font-weight:600; font-size:13px; cursor:pointer; font-family:inherit; }
.cr-add:hover { filter:brightness(1.08); }
.cr-manage-wrap { position:relative; }
.cr-manage-btn { background:var(--surface2); color:var(--text); border:1px solid var(--border); border-radius:8px; padding:8px 14px; font-size:13px; cursor:pointer; font-family:inherit; }
.cr-manage-btn:hover { border-color:var(--muted); }
.cr-manage-menu { position:absolute; right:0; top:calc(100% + 6px); z-index:60; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:6px; min-width:190px; max-height:70vh; overflow-y:auto; box-shadow:0 12px 32px rgba(0,0,0,.4); display:flex; flex-direction:column; gap:1px; }
/* An author display rule overrides [hidden]'s UA display:none — without this
   the menu was permanently visible from page load. */
.cr-manage-menu[hidden] { display:none !important; }
.cr-menu-group { font-size:10px; text-transform:uppercase; letter-spacing:.6px; color:var(--muted); padding:8px 10px 3px; }
.cr-menu-item { text-align:left; background:transparent; color:var(--text); border:0; border-radius:6px; padding:7px 10px; font-size:13px; cursor:pointer; font-family:inherit; }
.cr-menu-item:hover { background:var(--surface2); }

.cr-warnings { display:flex; align-items:flex-start; gap:8px; background:rgba(240,192,64,.08); border:1px solid rgba(240,192,64,.28); border-radius:8px; padding:8px 10px; margin-bottom:10px; }
.cr-warn-rows { display:flex; flex-direction:column; gap:3px; flex:1; }
.cr-warn-row { font-size:12px; color:var(--text); }
.cr-warn-row::before { content:''; display:inline-block; width:6px; height:6px; border-radius:50%; margin-right:7px; vertical-align:middle; }
.cr-warn-warn::before { background:var(--accent-gold,#f0c040); }
.cr-warn-info::before { background:var(--muted); }
.cr-warn-x { background:transparent; border:0; color:var(--muted); cursor:pointer; font-size:13px; padding:0 4px; }
.cr-warn-x:hover { color:var(--text); }

.cr-filters { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:14px; position:sticky; top:0; z-index:20; background:var(--bg); padding:6px 0; }
.cr-input, .cr-select { background:var(--surface2); color:var(--text); border:1px solid var(--border); border-radius:7px; padding:7px 10px; font-size:13px; font-family:inherit; }
.cr-input { min-width:150px; }
.cr-input:focus, .cr-select:focus { outline:none; border-color:var(--accent,#10b981); }
.cr-filter-count { font-size:11px; color:var(--muted); font-family:var(--font-mono,monospace); }
.cr-clear { background:transparent; border:1px solid var(--border); color:var(--muted); border-radius:7px; padding:6px 11px; font-size:12px; cursor:pointer; font-family:inherit; }
.cr-clear:hover { color:var(--text); border-color:var(--muted); }

.cr-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:12px; }
.cr-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:14px 12px 12px; display:flex; flex-direction:column; align-items:center; gap:7px; cursor:pointer; transition:transform .12s var(--ease-broadcast,ease), border-color .12s ease, box-shadow .12s ease; }
.cr-card:hover { transform:translateY(-3px); border-color:var(--muted); box-shadow:0 8px 22px rgba(0,0,0,.28); }
.cr-card:focus-visible { outline:2px solid var(--accent,#10b981); outline-offset:2px; }
.cr-card.cr-dragging { opacity:.4; }

.cr-portrait { position:relative; width:72px; height:72px; border-radius:50%; padding:3px; background:var(--tc,#6366f1); }
.cr-portrait .cr-medallion, .cr-portrait .cr-face { position:absolute; inset:3px; width:66px; height:66px; border-radius:50%; }
.cr-face { object-fit:cover; background:var(--surface2); z-index:1; }

.cr-name { font-weight:600; font-size:14px; text-align:center; line-height:1.2; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cr-badge-ret { display:inline-block; margin-left:5px; font-size:8px; font-weight:700; letter-spacing:.5px; color:var(--accent-gold,#f0c040); border:1px solid rgba(240,192,64,.4); border-radius:4px; padding:1px 4px; vertical-align:middle; }
.cr-meta { display:flex; flex-wrap:wrap; gap:4px; justify-content:center; align-items:center; }
.cr-arch { font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:.4px; }
.cr-chip { font-size:10px; padding:1px 7px; border-radius:20px; border:1px solid transparent; }
.cr-chip-none { color:var(--muted); border-color:var(--border); }
.cr-stats { display:flex; flex-direction:column; gap:3px; width:100%; margin-top:2px; }
.cr-stat { display:flex; align-items:center; gap:5px; font-size:10px; }
.cr-stat-k { font-family:var(--font-mono,monospace); width:26px; }
.cr-stat-bar { flex:1; height:4px; background:var(--surface2); border-radius:3px; overflow:hidden; }
.cr-stat-bar > span { display:block; height:100%; border-radius:3px; }
.cr-stat-v { width:14px; text-align:right; color:var(--muted); }
/* full 9-stat sheet (⚏ Stats toggle) — barless label/value pairs with real
   breathing room; bars at this density collapsed into unreadable noise */
.cr-allstats { display:grid; grid-template-columns:repeat(3, 1fr); gap:4px 12px; width:100%; margin-top:4px; padding-top:6px; border-top:1px solid var(--border); }
.cr-as { display:flex; align-items:baseline; justify-content:space-between; gap:4px; min-width:0; }
.cr-as-k { font-family:var(--font-mono,monospace); font-size:9px; letter-spacing:.4px; opacity:.85; }
.cr-as-v { font-size:12px; font-weight:700; color:var(--text); font-variant-numeric:tabular-nums; }
.cr-statsbtn { margin-left:2px; }
.cr-threat { font-size:10px; color:var(--muted); display:flex; align-items:center; gap:5px; }
.cr-dot { width:7px; height:7px; border-radius:50%; }
.cr-tribe-sel { width:100%; margin-top:4px; background:var(--surface2); color:var(--text); border:1px solid var(--border); border-radius:6px; padding:4px 6px; font-size:11px; font-family:inherit; }

.cr-empty { text-align:center; color:var(--muted); padding:60px 20px; }
.cr-empty-icon { font-size:40px; margin-bottom:10px; }

.cr-toolbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:14px; padding:10px; background:var(--surface); border:1px solid var(--border); border-radius:10px; }
.cr-toolbar-label { font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:var(--muted); margin-right:4px; }
.cr-tool { background:var(--surface2); color:var(--text); border:1px solid var(--border); border-radius:7px; padding:6px 13px; font-size:12px; cursor:pointer; font-family:inherit; }
.cr-tool:hover { border-color:var(--accent,#10b981); }
.cr-preserve { font-size:12px; color:var(--muted); display:flex; align-items:center; gap:5px; cursor:pointer; margin-left:auto; }

.cr-lanes { display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:14px; align-items:start; }
.cr-lane { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:10px; min-height:120px; transition:border-color .12s ease, background .12s ease; }
.cr-lane.cr-lane-over { border-color:var(--accent,#10b981); background:var(--accent-dim,rgba(16,185,129,.1)); }
.cr-lane-head { display:flex; align-items:center; gap:7px; padding:2px 4px 10px; border-bottom:1px solid var(--border); margin-bottom:10px; }
.cr-lane-dot { width:12px; height:12px; border-radius:50%; }
.cr-lane-name { font-weight:600; font-size:14px; }
.cr-lane-meta { margin-left:auto; font-size:11px; color:var(--muted); font-family:var(--font-mono,monospace); }
.cr-lane-body { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:10px; }
.cr-lane-hint { grid-column:1/-1; text-align:center; color:var(--muted); font-size:12px; padding:22px 8px; border:1px dashed var(--border); border-radius:8px; }

.cr-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.55); opacity:0; pointer-events:none; transition:opacity .2s ease; z-index:900; }
.cr-backdrop.open { opacity:1; pointer-events:auto; }
.cr-drawer { position:fixed; top:0; right:0; height:100vh; width:380px; max-width:92vw; background:var(--surface); border-left:1px solid var(--border); box-shadow:-12px 0 40px rgba(0,0,0,.4); transform:translateX(100%); transition:transform .24s var(--ease-broadcast,ease); z-index:901; display:flex; flex-direction:column; }
.cr-drawer.open { transform:translateX(0); }
.cr-drawer-head { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid var(--border); }
.cr-drawer-title { font-family:var(--font-display,sans-serif); font-size:16px; text-transform:uppercase; letter-spacing:.5px; }
.cr-drawer-x { background:transparent; border:0; color:var(--muted); font-size:16px; cursor:pointer; }
.cr-drawer-x:hover { color:var(--text); }
.cr-drawer-scroll { overflow-y:auto; overflow-x:visible; padding:16px; flex:1; }
#cr-drawer-form .panel-title { font-family:var(--font-display,sans-serif); font-size:15px; margin-bottom:10px; }
/* Roster autocomplete lives inside the scrollable drawer — raise it above sibling
   form fields (its .form-group parent is the positioning context) so it never hides
   behind later inputs; it scrolls internally via its own max-height. */
#cr-drawer #roster-dropdown { z-index:950; box-shadow:0 8px 24px rgba(0,0,0,.45); }

@media (max-width:640px) { .cr-drawer { width:100%; } }
@media (prefers-reduced-motion:reduce) {
  .cr-card, .cr-backdrop, .cr-drawer, .cr-lane { transition:none !important; }
  .cr-card:hover { transform:none; }
}
`;

// ══════════════════════════════════════════════════════════════════════
// SELF-REGISTER ON WINDOW
// (Primary adoption is main.js's module spread; this is a belt-and-suspenders
//  fallback so onclick handlers resolve even if the spread import is absent.)
// ══════════════════════════════════════════════════════════════════════
if (typeof window !== 'undefined') {
  Object.assign(window, {
    renderCastRoom, crRenderGrid, crOpenDrawerFor, crAddPlayer, crCloseDrawer, crCardKey,
    crSetView, crOnFilterInput, crClearFilters, crDragStart, crDragOver, crDragLeave, crDrop, crChangeTribe,
    crBalance, crSnake, crRandomize, crTogglePreserve, crToggleManage, crCloseManage, crDrawerTrap,
  });
}
