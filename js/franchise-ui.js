// ══════════════════════════════════════════════════════════════════════
// franchise-ui.js — the 🏆 Franchise tab: multi-franchise switcher, season
// timeline, details flyouts, import dropzone, and franchise-pulse footer.
// All DOM code for the ledger lives HERE (franchise-meta.js stays DOM-free).
// ══════════════════════════════════════════════════════════════════════
import { players } from './core.js';
import {
  activeFranchise, activeSeasons, listFranchises, createFranchise, renameFranchise,
  deleteFranchise, setActiveFranchise, setSeasonIncluded, backfillFromSeasonsDb,
  backfillFromSeasonData, recordSeasonFromSavestate, wipeLedger, franchiseLedger
} from './franchise-meta.js';
import { persistFranchiseLedger } from './savestate.js';

// ── slug / portrait helpers ───────────────────────────────────────────
function _slugForName(name, storedSlug) {
  if (storedSlug) return storedSlug; // slug captured at import time (seasonN-data.json)
  if (!name) return '';
  const live = (players || []).find(p => p.name === name);
  if (live?.slug) return live.slug;
  const roster = (typeof window !== 'undefined' && window.FRANCHISE_ROSTER) || [];
  const r = roster.find(p => p.name === name);
  if (r?.slug) return r.slug;
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
function _esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function _initial(name) { return (name || '?').trim().charAt(0).toUpperCase() || '?'; }

// ── inline SVG ────────────────────────────────────────────────────────
// The crown + medallion use a fixed dark fill with gold accents on purpose:
// they read as an award badge in BOTH light and dark themes (gold-on-dark is
// the intended winner motif everywhere), so they deliberately do NOT track --text/--bg.
function _svgCrown() {
  return `<svg class="fr-crown" viewBox="0 0 48 32" aria-hidden="true"><path d="M4 28 L2 8 L14 18 L24 4 L34 18 L46 8 L44 28 Z" fill="var(--accent-gold)" stroke="#8a6a10" stroke-width="1.2" stroke-linejoin="round"/><circle cx="2" cy="8" r="2.6" fill="var(--accent-gold)"/><circle cx="46" cy="8" r="2.6" fill="var(--accent-gold)"/><circle cx="24" cy="4" r="2.6" fill="var(--accent-gold)"/><rect x="6" y="27" width="36" height="3.4" rx="1.4" fill="#c99a1e"/></svg>`;
}
function _svgMedallion(letter) {
  return `<svg viewBox="0 0 64 64" class="fr-medallion" aria-hidden="true"><defs><linearGradient id="frmg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3546"/><stop offset="1" stop-color="#141c26"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="url(#frmg)" stroke="var(--accent-gold)" stroke-width="2.5"/><circle cx="32" cy="32" r="23" fill="none" stroke="rgba(240,192,64,.35)" stroke-width="1.5"/><text x="32" y="42" text-anchor="middle" font-family="var(--font-display)" font-size="30" fill="var(--accent-gold)">${_esc(letter)}</text></svg>`;
}
function _svgTrophy() {
  return `<svg viewBox="0 0 96 110" class="fr-empty-trophy" aria-hidden="true"><path d="M28 12 h40 v20 a20 20 0 0 1 -40 0 Z" fill="none" stroke="var(--accent-gold)" stroke-width="3"/><path d="M28 16 h-14 a10 10 0 0 0 10 18" fill="none" stroke="var(--accent-gold)" stroke-width="3"/><path d="M68 16 h14 a10 10 0 0 1 -10 18" fill="none" stroke="var(--accent-gold)" stroke-width="3"/><path d="M48 52 v18" fill="none" stroke="var(--accent-gold)" stroke-width="3"/><path d="M34 82 h28 l4 14 h-36 Z" fill="none" stroke="var(--accent-gold)" stroke-width="3" stroke-linejoin="round"/><path d="M40 70 h16 v12 h-16 Z" fill="none" stroke="var(--accent-gold)" stroke-width="3"/></svg>`;
}

function _winnerPortrait(name, big, storedSlug) {
  const slug = _slugForName(name, storedSlug);
  const cls = big ? 'fr-portrait fr-portrait-lg' : 'fr-portrait';
  return `<span class="${cls}"><img src="assets/avatars/${_esc(slug)}.png" alt="${_esc(name)}"
    onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <span class="fr-portrait-fb" style="display:none">${_svgMedallion(_initial(name))}</span></span>`;
}

// ── data helpers ──────────────────────────────────────────────────────
function _isIncluded(s) { return !s || s.included !== false; }
function _winnerOf(season) {
  const e = Object.entries(season.players || {}).find(([, r]) => r.winner);
  return e ? e[0] : null;
}
function _placeName(season, place) {
  const e = Object.entries(season.players || {}).find(([, r]) => r.placement === place);
  return e ? e[0] : null;
}
function _sourceBadge(season) {
  const src = season.source;
  const anyBackfilled = Object.values(season.players || {}).some(p => p.backfilled);
  if (src === 'live') return `<span class="fr-src fr-src-live">LIVE</span>`;
  if (src === 'manual') return `<span class="fr-src fr-src-manual">MANUAL</span>`;
  if (src === 'imported-save') return `<span class="fr-src fr-src-import">IMPORT</span>`;
  if (anyBackfilled) return `<span class="fr-src fr-src-import">IMPORT</span>`;
  return `<span class="fr-src fr-src-manual">MANUAL</span>`;
}

// ══════════════════════════════════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════════════════════════════════
export function renderFranchiseTab() {
  const host = document.getElementById('tab-franchise');
  if (!host) return;
  activeFranchise(); // normalise
  host.innerHTML = `<div class="fr-wrap">
    ${_renderHeader()}
    ${_renderTimeline()}
    ${_renderDropzone()}
    ${_renderPulse()}
  </div>`;
}

function _renderHeader() {
  const list = listFranchises();
  const pills = list.map(f => `<button class="fr-pill ${f.active ? 'active' : ''}"
    onclick="frSwitchFranchise('${_esc(f.id)}')" title="${_esc(f.name)} — ${f.seasonCount} season${f.seasonCount === 1 ? '' : 's'}">
    <span class="fr-pill-name">${_esc(f.name)}</span><span class="fr-pill-count">${f.seasonCount}</span></button>`).join('');
  return `<div class="fr-header">
    <div class="fr-header-top">
      <h1 class="fr-title">${_svgCrown()} Franchise</h1>
      <div class="fr-franchise-actions">
        <button class="fr-btn" onclick="frNewFranchise()" title="Create a new franchise">+ New Franchise</button>
        <button class="fr-btn fr-btn-icon" onclick="frRenameFranchise()" title="Rename active franchise">✏️</button>
        <button class="fr-btn fr-btn-icon fr-btn-danger" onclick="frDeleteFranchise()" title="Delete active franchise">🗑</button>
      </div>
    </div>
    <div class="fr-pills">${pills}</div>
    <div class="fr-subtext">Active franchise feeds returnee history.</div>
  </div>`;
}

function _renderTimeline() {
  const seasons = activeSeasons();
  const nums = Object.keys(seasons).map(Number).sort((a, b) => a - b);
  if (!nums.length) {
    return `<div class="fr-empty">${_svgTrophy()}
      <div class="fr-empty-text">No recorded seasons yet — drop a savestate below or finish a season with auto-record on.</div></div>`;
  }
  const cards = nums.map(num => _renderSeasonCard(num, seasons[String(num)])).join('');
  return `<div class="vp-section-header gold">Season Timeline</div>
    <div class="fr-grid">${cards}</div>`;
}

function _renderSeasonCard(num, season) {
  const included = _isIncluded(season);
  const winner = _winnerOf(season);
  const runnerUp = _placeName(season, 2);
  const castN = season.castSize || Object.keys(season.players || {}).length;
  const eps = season.episodeCount || Math.max(0, ...Object.values(season.players || {}).map(p => p.episodesLasted || 0));
  const chips = [];
  if (castN) chips.push(`cast ${castN}`);
  if (eps) chips.push(`${eps} eps`);
  return `<div class="fr-card ${included ? '' : 'fr-excluded'}" id="fr-card-${num}">
    <div class="fr-card-head">
      <span class="fr-snum">S${num}</span>
      ${_sourceBadge(season)}
    </div>
    <div class="fr-card-name">${_esc(season.seasonName || `Season ${num}`)}</div>
    <div class="fr-winner">
      <span class="fr-winner-portrait">${_svgCrown()}${_winnerPortrait(winner, true, season.players?.[winner]?.slug)}</span>
      <div class="fr-winner-meta">
        <span class="fr-winner-label">Winner</span>
        <span class="fr-winner-name">${_esc(winner || '—')}</span>
        ${runnerUp ? `<span class="fr-runnerup">runner-up: ${_esc(runnerUp)}</span>` : ''}
      </div>
    </div>
    ${chips.length ? `<div class="fr-chips">${chips.map(c => `<span class="fr-chip">${_esc(c)}</span>`).join('')}</div>` : ''}
    <div class="fr-card-controls">
      <label class="fr-incl" title="Counts toward returnee history">
        <input type="checkbox" ${included ? 'checked' : ''} onchange="frToggleSeasonIncluded(${num}, this.checked)">
        <span>counts</span></label>
      <button class="fr-btn fr-btn-sm" onclick="frToggleDetails(${num})" title="Details">👁 details</button>
      <button class="fr-btn fr-btn-sm fr-btn-danger" onclick="frDeleteSeason(${num})" title="Delete season">🗑</button>
    </div>
    <div class="fr-details" id="fr-details-${num}" style="display:none"></div>
  </div>`;
}

function _renderDetails(num, season) {
  const entries = Object.entries(season.players || {})
    .sort((a, b) => (a[1].placement || 999) - (b[1].placement || 999));
  const top = entries.slice(0, 6);
  const more = entries.length - top.length;
  const anyBackfilled = Object.values(season.players || {}).some(p => p.backfilled);
  const rows = top.map(([name, r]) => {
    const facts = [];
    if (r.blindsided) facts.push(`<span class="fr-fact fr-fact-bad">blindsided</span>`);
    if ((r.blindsidesAuthored || 0) > 0) facts.push(`<span class="fr-fact">${r.blindsidesAuthored} blindside${r.blindsidesAuthored > 1 ? 's' : ''} authored</span>`);
    if ((r.betrayed || []).length) facts.push(`<span class="fr-fact">betrayed ${r.betrayed.map(_esc).join(', ')}</span>`);
    if ((r.idolsPlayed || 0) > 0) facts.push(`<span class="fr-fact">${r.idolsPlayed} idol${r.idolsPlayed > 1 ? 's' : ''}</span>`);
    if ((r.chalWins || 0) > 0) facts.push(`<span class="fr-fact">${r.chalWins}W</span>`);
    return `<div class="fr-det-row">
      <span class="fr-det-place">${r.placement || '—'}</span>
      ${_winnerPortrait(name, false, r.slug)}
      <span class="fr-det-name">${_esc(name)}${r.winner ? ' 👑' : ''}</span>
      <span class="fr-det-facts">${facts.join('')}</span>
    </div>`;
  }).join('');
  return `${anyBackfilled ? `<div class="fr-det-note">light import — placements only</div>` : ''}
    ${rows}
    ${more > 0 ? `<div class="fr-det-more">…${more} more</div>` : ''}`;
}

function _renderDropzone() {
  return `<div class="vp-section-header gold">Import Seasons</div>
    <div class="fr-drop" id="fr-drop"
      ondragover="frDragOver(event)" ondragleave="frDragLeave(event)" ondrop="frHandleDrop(event)"
      onclick="document.getElementById('fr-file-input').click()">
      <div class="fr-drop-icon">⬇</div>
      <div class="fr-drop-title">Drop season files here</div>
      <div class="fr-drop-sub">savestate exports (season-*-ep*.json), season data files (seasonN-data.json), or seasons_database.json — or click to browse</div>
    </div>
    <input type="file" id="fr-file-input" accept=".json" multiple style="display:none" onchange="frHandleFileInput(event)">
    <div class="fr-drop-actions">
      <button class="fr-btn" onclick="frRecordLoaded()" title="Record the currently-loaded finished season into the ledger">📖 Record loaded season</button>
      <button class="fr-btn fr-btn-danger" onclick="frWipeActive()" title="Wipe this franchise's seasons">🗑 Wipe franchise</button>
    </div>
    <div class="fr-log" id="fr-import-log"></div>`;
}

function _renderPulse() {
  const seasons = activeSeasons();
  const included = Object.entries(seasons).filter(([, s]) => _isIncluded(s));
  if (!included.length) return '';
  const titles = {}, blindsides = {}, appearances = {};
  for (const [, s] of included) {
    for (const [name, r] of Object.entries(s.players || {})) {
      appearances[name] = (appearances[name] || 0) + 1;
      if (r.winner) titles[name] = (titles[name] || 0) + 1;
      if ((r.blindsidesAuthored || 0) > 0) blindsides[name] = (blindsides[name] || 0) + r.blindsidesAuthored;
    }
  }
  const topOf = obj => Object.entries(obj).sort((a, b) => b[1] - a[1])[0] || null;
  const mostTitles = topOf(titles);
  const mostBlind = topOf(blindsides);
  const multiSeason = Object.values(appearances).filter(n => n >= 2).length;

  const tiles = [];
  tiles.push(_tile('Total seasons', `${included.length}`, null));
  if (mostTitles) tiles.push(_tile('Most titles', `${_esc(mostTitles[0])} · ${mostTitles[1]}`, mostTitles[0]));
  if (mostBlind) tiles.push(_tile('Most blindsides authored', `${_esc(mostBlind[0])} · ${mostBlind[1]}`, mostBlind[0]));
  tiles.push(_tile('Multi-season players', `${multiSeason}`, null));

  return `<div class="vp-section-header gold">Franchise Pulse</div>
    <div class="fr-pulse">${tiles.join('')}</div>`;
}
function _tile(label, value, portraitName) {
  return `<div class="fr-tile">
    ${portraitName ? `<span class="fr-tile-portrait">${_winnerPortrait(portraitName)}</span>` : ''}
    <div class="fr-tile-body"><div class="fr-tile-value">${value}</div><div class="fr-tile-label">${_esc(label)}</div></div>
  </div>`;
}

// ══════════════════════════════════════════════════════════════════════
// HANDLERS
// ══════════════════════════════════════════════════════════════════════
function _persistAndRerender() { try { persistFranchiseLedger(); } catch (e) { console.warn(e); } renderFranchiseTab(); }

export function frSwitchFranchise(id) { if (setActiveFranchise(id)) _persistAndRerender(); }
export function frNewFranchise() {
  const name = prompt('New franchise name:', '');
  if (name == null || !name.trim()) return;
  const id = createFranchise(name.trim());
  setActiveFranchise(id);
  _persistAndRerender();
}
export function frRenameFranchise() {
  const cur = franchiseLedger.franchises[franchiseLedger.active];
  const name = prompt('Rename franchise:', cur?.name || '');
  if (name == null || !name.trim()) return;
  renameFranchise(franchiseLedger.active, name.trim());
  _persistAndRerender();
}
export function frDeleteFranchise() {
  if (listFranchises().length <= 1) { alert('Cannot delete the last franchise.'); return; }
  const cur = franchiseLedger.franchises[franchiseLedger.active];
  if (!confirm(`Delete franchise "${cur?.name || franchiseLedger.active}" and all its recorded seasons? This cannot be undone.`)) return;
  deleteFranchise(franchiseLedger.active);
  _persistAndRerender();
}
export function frToggleSeasonIncluded(num, checked) {
  setSeasonIncluded(num, checked);
  _persistAndRerender();
}
export function frToggleDetails(num) {
  const el = document.getElementById('fr-details-' + num);
  if (!el) return;
  if (el.style.display === 'none') {
    el.innerHTML = _renderDetails(num, activeSeasons()[String(num)]);
    el.style.display = 'block';
  } else { el.style.display = 'none'; }
}
export function frDeleteSeason(num) {
  const season = activeSeasons()[String(num)];
  const winner = _winnerOf(season);
  if (!confirm(`Delete Season ${num}${winner ? ` (winner ${winner})` : ''} from this franchise? This cannot be undone.`)) return;
  delete activeSeasons()[String(num)];
  _persistAndRerender();
}
export function frRecordLoaded() {
  if (typeof window !== 'undefined' && typeof window.recordLoadedSeasonToHistory === 'function') {
    window.recordLoadedSeasonToHistory();
  }
  renderFranchiseTab();
}
export function frWipeActive() {
  const cur = franchiseLedger.franchises[franchiseLedger.active];
  if (!confirm(`Wipe ALL recorded seasons in "${cur?.name || 'this franchise'}"? This cannot be undone.`)) return;
  wipeLedger(); // wipes the ACTIVE franchise's seasons only
  _persistAndRerender();
}

// ── drag & drop / file import ─────────────────────────────────────────
export function frDragOver(e) { e.preventDefault(); document.getElementById('fr-drop')?.classList.add('fr-drop-over'); }
export function frDragLeave(e) { e.preventDefault(); document.getElementById('fr-drop')?.classList.remove('fr-drop-over'); }
export function frHandleDrop(e) {
  e.preventDefault();
  document.getElementById('fr-drop')?.classList.remove('fr-drop-over');
  const files = Array.from(e.dataTransfer?.files || []);
  _processFiles(files);
}
export function frHandleFileInput(e) {
  const files = Array.from(e.target.files || []);
  _processFiles(files);
  e.target.value = '';
}

function _logLine(html, ok) {
  const log = document.getElementById('fr-import-log');
  if (!log) return;
  const row = document.createElement('div');
  row.className = 'fr-log-row ' + (ok ? 'fr-log-ok' : 'fr-log-err');
  row.innerHTML = (ok ? '✓ ' : '✗ ') + html;
  log.appendChild(row);
}

function _processFiles(files) {
  if (!files.length) return;
  let idx = 0;
  const next = () => {
    if (idx >= files.length) { _persistAndRerender(); return; }
    const file = files[idx++];
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const raw = JSON.parse(ev.target.result);
        _importOne(raw, file.name);
      } catch (err) {
        _logLine(`${_esc(file.name)} — invalid JSON`, false);
      }
      next();
    };
    reader.onerror = () => { _logLine(`${_esc(file.name)} — could not read file`, false); next(); };
    reader.readAsText(file);
  };
  next();
}

function _importOne(raw, fileName) {
  // seasons_database.json → backfill
  if (raw && Array.isArray(raw.seasons)) {
    const n = backfillFromSeasonsDb(raw);
    _logLine(`${_esc(fileName)} — backfilled ${n} season${n === 1 ? '' : 's'}`, n > 0);
    return;
  }
  // single-season site data file (seasonN-data.json) → rich backfill
  if (raw && raw.seasonNumber && Array.isArray(raw.placements) && !raw.gs) {
    const res = backfillFromSeasonData(raw);
    _logLine(res.ok
      ? `S${res.seasonNum} imported — winner ${_esc(res.winner || '—')} (${res.playerCount} players)`
      : `${_esc(fileName)} — ${_esc(res.error)}`, !!res.ok);
    return;
  }
  // savestate export → recordSeasonFromSavestate
  if (raw && raw.gs && typeof raw.gs === 'object') {
    let res = recordSeasonFromSavestate(raw);
    // Overwrite protection: existing LIVE/MANUAL record — confirm before clobbering.
    if (res.needsConfirm) {
      const srcLabel = String(res.existingSource || 'manual').toUpperCase();
      const ok = confirm(`Season ${res.seasonNum} already has a ${srcLabel} record`
        + (res.winner ? ` (winner ${res.winner}, ${res.playerCount} players)` : '')
        + `.\n\nReplace it with this imported savestate?`);
      if (!ok) { _logLine(`S${res.seasonNum} skipped — kept existing ${srcLabel} record`, false); return; }
      res = recordSeasonFromSavestate(raw, { force: true });
    }
    if (res.ok) {
      _logLine(`S${res.seasonNum} recorded — winner ${_esc(res.winner || '—')} (${res.playerCount} players)`, true);
    } else {
      _logLine(`${_esc(fileName)} — ${_esc(res.error)}`, false);
    }
    return;
  }
  _logLine(`${_esc(fileName)} — unrecognized file (not a savestate or seasons database)`, false);
}
