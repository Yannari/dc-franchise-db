// ══════════════════════════════════════════════════════════════════════
// franchise-ui.js — the 🏆 Franchise tab: multi-franchise switcher, season
// timeline, details flyouts, import dropzone, and franchise-pulse footer.
// All DOM code for the ledger lives HERE (franchise-meta.js stays DOM-free).
// ══════════════════════════════════════════════════════════════════════
import { players } from './core.js';
import {
  activeFranchise, activeSeasons, listFranchises, createFranchise, renameFranchise,
  deleteFranchise, setActiveFranchise, setSeasonIncluded, backfillFromSeasonsDb,
  backfillFromSeasonData, recordSeasonFromSavestate, wipeLedger, franchiseLedger,
  exportActiveFranchise, importFranchiseExport,
  careerFor, franchiseRecords, returneePools, setFranchiseLocked, isFranchiseLocked
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
  _ensureLegacyCss();
  activeFranchise(); // normalise
  // .fr-wrap is the scrolling container — preserve its position across rebuilds
  // so actions mid-page (toggles, locks, deletes) don't fling the user to the top.
  const prevScroll = host.querySelector('.fr-wrap')?.scrollTop || 0;
  host.innerHTML = `<div class="fr-wrap"><div class="fr-shell">
    ${_renderHeader()}
    ${_renderTimeline()}
    ${_renderHallOfFame()}
    ${_renderCareers()}
    ${_renderScout()}
    ${_renderDropzone()}
    ${_renderPulse()}
  </div></div>`;
  if (prevScroll) { const w = host.querySelector('.fr-wrap'); if (w) w.scrollTop = prevScroll; }
}

// Shared entry point: any player name/portrait in the tab is clickable and opens
// their legacy page. Escaped for a JS single-quoted string inside an HTML attr.
function _careerClick(name) {
  const arg = _esc(String(name == null ? '' : name).replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
  return `onclick="frOpenCareer('${arg}')" role="button" tabindex="0"`;
}

function _renderHeader() {
  const list = listFranchises();
  const pills = list.map(f => {
    const locked = isFranchiseLocked(f.id);
    return `<button class="fr-pill ${f.active ? 'active' : ''} ${locked ? 'fr-pill-locked' : ''}"
    onclick="frSwitchFranchise('${_esc(f.id)}')" title="${_esc(f.name)} — ${f.seasonCount} season${f.seasonCount === 1 ? '' : 's'}${locked ? ' · locked' : ''}">
    ${locked ? '<span class="fr-pill-lock">🔒</span>' : ''}<span class="fr-pill-name">${_esc(f.name)}</span><span class="fr-pill-count">${f.seasonCount}</span></button>`;
  }).join('');
  const locked = isFranchiseLocked(franchiseLedger.active);
  return `<div class="fr-header">
    <div class="fr-header-top">
      <h1 class="fr-title">${_svgCrown()} Franchise</h1>
      <div class="fr-franchise-actions">
        <button class="fr-btn" onclick="frNewFranchise()" title="Create a new franchise">+ New Franchise</button>
        <button class="fr-btn fr-btn-icon ${locked ? 'fr-btn-locked' : ''}" onclick="frToggleLock()" title="${locked ? 'Unlock this franchise' : 'Lock this franchise as sealed canon'}">${locked ? '🔒' : '🔓'}</button>
        <button class="fr-btn fr-btn-icon" onclick="frRenameFranchise()" title="Rename active franchise">✏️</button>
        <button class="fr-btn fr-btn-icon fr-btn-danger" onclick="frDeleteFranchise()" title="Delete active franchise">🗑</button>
      </div>
    </div>
    <div class="fr-pills">${pills}</div>
    <div class="fr-subtext">${locked ? '🔒 This franchise is locked — sealed canon. Unlock to record, import, or wipe.' : 'Active franchise feeds returnee history.'}</div>
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
      <span class="fr-winner-portrait ${winner ? 'fr-clickable' : ''}" ${winner ? _careerClick(winner) : ''}>${_svgCrown()}${_winnerPortrait(winner, true, season.players?.[winner]?.slug)}</span>
      <div class="fr-winner-meta">
        <span class="fr-winner-label">Winner</span>
        <span class="fr-winner-name ${winner ? 'fr-clickable' : ''}" ${winner ? _careerClick(winner) : ''}>${_esc(winner || '—')}</span>
        ${runnerUp ? `<span class="fr-runnerup">runner-up: <span class="fr-clickable" ${_careerClick(runnerUp)}>${_esc(runnerUp)}</span></span>` : ''}
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
    if ((r.blindsidesAuthored || 0) > 0) facts.push(`<span class="fr-fact">⚡ ${r.blindsidesAuthored} blindside${r.blindsidesAuthored > 1 ? 's' : ''}</span>`);
    if ((r.betrayed || []).length) facts.push(`<span class="fr-fact">🗡 ${r.betrayed.map(_esc).join(', ')}</span>`);
    if ((r.idolsPlayed || 0) > 0) facts.push(`<span class="fr-fact">🗿 ${r.idolsPlayed}</span>`);
    if ((r.chalWins || 0) > 0) facts.push(`<span class="fr-fact">🏅 ${r.chalWins}W</span>`);
    return `<div class="fr-det-row fr-clickable" ${_careerClick(name)}>
      <span class="fr-det-place">${r.placement || '—'}</span>
      ${_winnerPortrait(name, false, r.slug)}
      <div class="fr-det-body">
        <span class="fr-det-name">${_esc(name)}${r.winner ? ' 👑' : ''}</span>
        ${facts.length ? `<div class="fr-det-facts">${facts.join('')}</div>` : ''}
      </div>
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
      <div class="fr-drop-sub">savestate exports (season-*-ep*.json), season data files (seasonN-data.json), seasons_database.json, or franchise exports (franchise-*.json) — or click to browse</div>
    </div>
    <input type="file" id="fr-file-input" accept=".json" multiple style="display:none" onchange="frHandleFileInput(event)">
    <div class="fr-drop-actions">
      <button class="fr-btn" onclick="frRecordLoaded()" title="Record the currently-loaded finished season into the ledger">📖 Record loaded season</button>
      <button class="fr-btn" onclick="frApplyToCurrent()" title="Rebuild returnee reputation/instincts for the in-progress season from this franchise's history">⚡ Apply to current season</button>
      <button class="fr-btn" onclick="frExportFranchise()" title="Download this franchise (all its seasons) as a JSON backup">⬆ Export franchise</button>
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
// LEGACY LAYER — Hall of Fame · Careers · All-Stars Scout
// ══════════════════════════════════════════════════════════════════════

// ── 1. HALL OF FAME + Record Book ─────────────────────────────────────
function _renderHallOfFame() {
  const seasons = activeSeasons();
  const nums = Object.keys(seasons).map(Number).sort((a, b) => a - b)
    .filter(n => _isIncluded(seasons[String(n)]));
  const champs = [];
  for (const num of nums) {
    const s = seasons[String(num)];
    const w = _winnerOf(s);
    if (w) champs.push({ num, name: w, slug: s.players?.[w]?.slug });
  }
  const records = franchiseRecords();
  if (!champs.length && !records.length) return '';

  const gallery = champs.length
    ? `<div class="fr-hof-gallery">${champs.map(c => `<div class="fr-hof-chip fr-clickable" ${_careerClick(c.name)} title="${_esc(c.name)} — winner of Season ${c.num}">
        <span class="fr-hof-portrait">${_svgCrown()}${_winnerPortrait(c.name, false, c.slug)}</span>
        <span class="fr-hof-caption"><span class="fr-hof-snum">S${c.num}</span> · ${_esc(c.name)}</span>
      </div>`).join('')}</div>`
    : `<div class="fr-legacy-empty">No champions recorded yet.</div>`;

  const book = records.length
    ? `<div class="fr-recbook">${records.map(r => `<div class="fr-rec-row fr-clickable" ${_careerClick(r.holder)}>
        <span class="fr-rec-title">🏅 ${_esc(r.title)}</span>
        <span class="fr-rec-holder">${_esc(r.holder)} <span class="fr-rec-val">(${_esc(r.value)})</span></span>
      </div>`).join('')}</div>`
    : '';

  return `<div class="vp-section-header gold">Hall of Fame</div>
    ${gallery}
    ${records.length ? `<div class="fr-recbook-label">Record Book</div>${book}` : ''}`;
}

// ── 2. CAREERS — roster index + inline legacy panel ───────────────────
function _renderCareers() {
  // Every player with history, ranked by titles then best placement — the index.
  const roster = _allCareerNames().map(n => careerFor(n)).filter(Boolean)
    .sort((a, b) => b.totals.wins - a.totals.wins
      || (a.totals.bestPlacement || 999) - (b.totals.bestPlacement || 999)
      || a.name.localeCompare(b.name));
  if (!roster.length) return '';
  const chips = roster.map(c => `<div class="fr-roster-chip fr-clickable" ${_careerClick(c.name)} title="${_esc(c.name)} — ${c.totals.seasons} season${c.totals.seasons === 1 ? '' : 's'}">
    ${_winnerPortrait(c.name, false, c.slug)}
    <span class="fr-roster-name">${_esc(c.name)}${c.totals.wins ? ' 👑' : ''}</span>
  </div>`).join('');
  return `<div class="vp-section-header gold">Careers</div>
    <div class="fr-careers-hint">Every campaign, every scar — click a player to open their legacy page.</div>
    <div id="fr-career-panel" class="fr-career-panel" style="display:none"></div>
    <div class="fr-roster">${chips}</div>`;
}

function _allCareerNames() {
  const set = new Set();
  for (const s of Object.values(activeSeasons())) {
    if (s.included === false) continue;
    for (const nm of Object.keys(s.players || {})) set.add(nm);
  }
  return [...set];
}

function _careerPanelHtml(c) {
  const badges = c.badges.map(b => `<span class="fr-badge">${_esc(b)}</span>`).join('');
  const timeline = c.seasons.map(s => {
    const cls = s.placement === 1 ? 'gold' : s.placement === 2 ? 'silver' : 'muted';
    const marks = `${s.blindsided ? '🔻' : ''}${s.backfilled ? ' <span class="fr-place-light">(light)</span>' : ''}`;
    return `<span class="fr-place-chip ${cls}" title="${_esc(s.seasonName)}">
      <span class="fr-place-snum">S${s.seasonNum}</span>
      <span class="fr-place-rank">${s.placement || '—'}</span>${marks}</span>`;
  }).join('');

  const t = c.totals;
  const stat = (val, label) => `<div class="fr-stat"><div class="fr-stat-val">${val}</div><div class="fr-stat-label">${_esc(label)}</div></div>`;
  const tiles = [
    stat(t.seasons, 'Seasons'),
    stat(t.wins, t.wins === 1 ? 'Title' : 'Titles'),
    stat(t.finals, 'Finals'),
    stat(t.bestPlacement || '—', 'Best finish'),
    stat(t.avgPlacement || '—', 'Avg finish'),
    stat(t.chalWins, 'Immunity wins'),
    stat(t.blindsidesAuthored, 'Blindsides'),
    stat(t.idolsPlayed, 'Idols played')
  ].join('');

  const peopleCol = (label, arr, kind) => {
    if (!arr.length) return '';
    const rows = arr.slice(0, 5).map(p => `<div class="fr-person-row fr-clickable" ${_careerClick(p.name)}>
      ${_winnerPortrait(p.name, false)}
      <span class="fr-person-name">${_esc(p.name)}</span>
      <span class="fr-person-count fr-person-${kind}">×${p.count}</span>
    </div>`).join('');
    return `<div class="fr-people-col"><div class="fr-people-label">${_esc(label)}</div>${rows}</div>`;
  };
  const showLine = c.people.showmances.length
    ? `<div class="fr-showmance-line">💞 ${c.people.showmances.map(sh => `${_esc(sh.partner)} <span class="fr-show-tag ${sh.ended === 'intact' ? 'ok' : 'bad'}">${sh.ended === 'intact' ? 'lasted' : 'ended'}</span> <span class="fr-show-season">S${sh.seasonNum}</span>`).join(' · ')}</div>`
    : '';

  return `<div class="fr-career-inner">
    <button class="fr-career-close" onclick="frCloseCareer()" title="Close">✕</button>
    <div class="fr-career-head">
      <span class="fr-career-portrait">${_winnerPortrait(c.name, true, c.slug)}</span>
      <div class="fr-career-headmeta">
        <div class="fr-career-name">${_esc(c.name)}</div>
        <div class="fr-career-badges">${badges || '<span class="fr-badge fr-badge-none">ROOKIE</span>'}</div>
      </div>
    </div>
    <div class="fr-career-section-label">Career timeline</div>
    <div class="fr-seasonline">${timeline}</div>
    <div class="fr-career-section-label">By the numbers</div>
    <div class="fr-totals-grid">${tiles}</div>
    ${(c.people.allies.length || c.people.rivals.length || c.people.betrayedBy.length || showLine) ? `<div class="fr-career-section-label">The people</div>
    <div class="fr-people">${peopleCol('Closest allies', c.people.allies, 'ally')}${peopleCol('Fiercest rivals', c.people.rivals, 'rival')}${peopleCol('Betrayed by', c.people.betrayedBy, 'betray')}</div>
    ${showLine}` : ''}
  </div>`;
}

// ── 3. ALL-STARS SCOUT ────────────────────────────────────────────────
const _POOL_META = {
  legends: { label: 'Legends', icon: '👑', blurb: 'Champions & multi-finalists' },
  unfinishedBusiness: { label: 'Unfinished Business', icon: '🗡', blurb: 'Robbed mid-run — blindsided deep' },
  fallenAngels: { label: 'Fallen Angels', icon: '🪽', blurb: 'Rode high, then crashed back down' },
  redemption: { label: 'Redemption Arc', icon: '🌱', blurb: 'Never made the merge — hungry for more' },
  villains: { label: 'Villains & Masterminds', icon: '😈', blurb: 'Career blindsiders and betrayers' },
  challengeTitans: { label: 'Challenge Titans', icon: '🏅', blurb: 'The immunity-run machines' },
  showmanceStars: { label: 'Showmance Stars', icon: '💘', blurb: 'Hearts on their sleeves, cameras on them' },
  firstBootClub: { label: 'First Boot Club', icon: '🥾', blurb: 'Out first — owed a real chance' },
  marathoners: { label: 'Marathoners', icon: '⏳', blurb: 'The most days survived on the books' },
  feuds: { label: 'Unfinished Feuds', icon: '⚡', blurb: 'Pairs with scores to settle — cast both' }
};
const _POOL_ORDER = ['legends', 'unfinishedBusiness', 'fallenAngels', 'redemption',
  'villains', 'challengeTitans', 'showmanceStars', 'firstBootClub', 'marathoners', 'feuds'];

// Collapsed-state memory: survives tab re-renders within the session.
function _openPools() {
  if (typeof window === 'undefined') return new Set();
  if (!window._frOpenPools) window._frOpenPools = new Set(['legends']); // first pool open by default
  return window._frOpenPools;
}

function _renderScout() {
  const pools = returneePools();
  const anyData = _POOL_ORDER.some(k => (pools[k] || []).length);
  if (!anyData) return '';
  const open = _openPools();
  const rows = _POOL_ORDER.map(key => {
    const meta = _POOL_META[key];
    const list = pools[key] || [];
    if (!list.length) return ''; // empty pools disappear entirely — no space wasted
    const isOpen = open.has(key);
    const chips = key === 'feuds'
      ? list.map(f => `<div class="fr-scout-chip fr-feud-chip" title="${_esc(f.why)}">
          <span class="fr-feud-pair"><span class="fr-clickable" ${_careerClick(f.a)}>${_winnerPortrait(f.a, false, f.slugA)}</span><span class="fr-feud-bolt">⚡</span><span class="fr-clickable" ${_careerClick(f.b)}>${_winnerPortrait(f.b, false, f.slugB)}</span></span>
          <span class="fr-scout-body"><span class="fr-scout-name">${_esc(f.a)} vs ${_esc(f.b)}</span><span class="fr-scout-why">${_esc(f.why)}</span></span>
        </div>`).join('')
      : list.map(x => `<div class="fr-scout-chip fr-clickable" ${_careerClick(x.name)} title="${_esc(x.why)}">
          ${_winnerPortrait(x.name, false, x.slug)}
          <span class="fr-scout-body"><span class="fr-scout-name">${_esc(x.name)}</span><span class="fr-scout-why">${_esc(x.why)}</span></span>
        </div>`).join('');
    return `<div class="fr-pool fr-pool-${key} ${isOpen ? 'open' : ''}" id="fr-pool-${key}">
      <button class="fr-pool-head fr-pool-toggle" onclick="frTogglePool('${key}')" aria-expanded="${isOpen}">
        <span class="fr-pool-chev">${isOpen ? '▾' : '▸'}</span>
        <div class="fr-pool-titles"><span class="fr-pool-label">${meta.icon} ${_esc(meta.label)}</span><span class="fr-pool-blurb">${_esc(meta.blurb)}</span></div>
        <span class="fr-pool-count">${list.length}</span>
        ${key !== 'feuds' ? `<span class="fr-btn fr-btn-sm fr-copy-btn" onclick="event.stopPropagation();frCopyPool('${key}')" title="Copy this pool as a cast list">📋</span>` : `<span class="fr-btn fr-btn-sm fr-copy-btn" onclick="event.stopPropagation();frCopyPool('feuds')" title="Copy both sides of every feud">📋</span>`}
      </button>
      <div class="fr-pool-chips" style="display:${isOpen ? '' : 'none'}">${chips}</div>
    </div>`;
  }).join('');
  return `<div class="vp-section-header gold">All-Stars Scout</div>
    <div class="fr-scout-topbar">
      <div class="fr-careers-hint">Ready-made returnee shortlists drawn from this franchise's canon — click a pool to expand.</div>
      <button class="fr-btn fr-btn-sm fr-copy-btn" onclick="frCopyAllStars()" title="Copy a balanced all-stars cast (top picks from every pool)">📋 Copy All-Stars pool</button>
    </div>
    <div class="fr-scout">${rows}</div>`;
}

// DOM-only toggle — never re-render the tab (a rebuild resets .fr-wrap's scroll).
export function frTogglePool(key) {
  const open = _openPools();
  const isOpen = !open.has(key);
  if (isOpen) open.add(key); else open.delete(key);
  const pool = document.getElementById('fr-pool-' + key);
  if (!pool) return;
  pool.classList.toggle('open', isOpen);
  const chips = pool.querySelector('.fr-pool-chips'); if (chips) chips.style.display = isOpen ? '' : 'none';
  const chev = pool.querySelector('.fr-pool-chev'); if (chev) chev.textContent = isOpen ? '▾' : '▸';
  const btn = pool.querySelector('.fr-pool-toggle'); if (btn) btn.setAttribute('aria-expanded', String(isOpen));
}

// ── CSS injection (one-time; simulator.html stays untouched) ───────────
function _ensureLegacyCss() {
  if (typeof document === 'undefined' || document.getElementById('fr-legacy-css')) return;
  const style = document.createElement('style');
  style.id = 'fr-legacy-css';
  style.textContent = _LEGACY_CSS;
  (document.head || document.documentElement).appendChild(style);
}
const _LEGACY_CSS = `
.fr-clickable { cursor: pointer; transition: color .18s, filter .18s; }
.fr-clickable:hover { color: var(--accent-gold); }
.fr-clickable:focus-visible { outline: 2px solid var(--accent-gold); outline-offset: 2px; border-radius: 6px; }
.fr-legacy-empty { font-size: 12px; color: var(--muted); font-style: italic; padding: 8px 2px; }
.fr-pill-lock { font-size: 11px; margin-right: -2px; }
.fr-pill-locked.active { box-shadow: 0 0 0 1px var(--accent-gold), 0 0 16px -4px var(--accent-gold); border-color: var(--accent-gold); color: var(--accent-gold); }
.fr-btn-locked { border-color: var(--accent-gold); color: var(--accent-gold); }

/* Hall of Fame */
.fr-hof-gallery { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 4px; }
.fr-hof-chip { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 92px; padding: 12px 8px 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; transition: transform .2s var(--ease-broadcast), border-color .2s, box-shadow .2s; }
.fr-hof-chip:hover { transform: translateY(-3px); border-color: var(--accent-gold); box-shadow: 0 10px 24px -12px rgba(240,192,64,.5); }
.fr-hof-portrait { position: relative; display: inline-block; }
.fr-hof-portrait .fr-crown { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); width: 24px; height: 16px; z-index: 2; }
.fr-hof-portrait .fr-portrait img, .fr-hof-portrait .fr-portrait-fb { width: 48px; height: 48px; border: 2px solid var(--accent-gold); box-shadow: 0 0 12px -4px var(--accent-gold); border-radius: 50%; }
.fr-hof-caption { font-size: 11px; font-weight: 600; color: var(--text); text-align: center; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.fr-hof-snum { color: var(--accent-gold); font-family: var(--font-display); font-size: 12px; }
.fr-recbook-label, .fr-people-label, .fr-career-section-label { font-size: 10px; font-weight: 800; letter-spacing: 1.6px; text-transform: uppercase; color: var(--muted); margin: 16px 0 8px; }
.fr-recbook { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 6px; }
.fr-rec-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 9px; transition: border-color .18s, background .18s; }
.fr-rec-row:hover { border-color: var(--accent-gold); background: var(--surface2); }
.fr-rec-title { font-size: 12px; font-weight: 600; color: var(--text); }
.fr-rec-holder { font-size: 12px; font-weight: 700; color: var(--accent-gold); white-space: nowrap; }
.fr-rec-val { color: var(--muted); font-weight: 600; }

/* Careers roster + panel */
.fr-careers-hint { font-size: 12px; color: var(--muted); margin: 2px 0 12px; }
.fr-roster { display: flex; flex-wrap: wrap; gap: 8px; }
.fr-roster-chip { display: inline-flex; align-items: center; gap: 8px; padding: 5px 12px 5px 6px; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; transition: border-color .18s, background .18s, transform .18s; }
.fr-roster-chip:hover { border-color: var(--accent-gold); background: var(--surface2); transform: translateY(-2px); }
.fr-roster-chip .fr-portrait img, .fr-roster-chip .fr-portrait-fb { width: 26px; height: 26px; }
.fr-roster-name { font-size: 12px; font-weight: 600; color: var(--text); }

.fr-career-panel { margin-bottom: 14px; }
.fr-career-inner { position: relative; background: linear-gradient(160deg, var(--surface2), var(--surface)); border: 1px solid var(--accent-gold); border-radius: 16px; padding: 22px 24px 20px; box-shadow: 0 18px 48px -22px rgba(240,192,64,.5), inset 0 1px 0 rgba(240,192,64,.15); }
.fr-career-close { position: absolute; top: 12px; right: 14px; background: transparent; border: 1px solid var(--border); color: var(--muted); border-radius: 8px; width: 28px; height: 28px; cursor: pointer; font-size: 13px; transition: color .18s, border-color .18s; }
.fr-career-close:hover { color: var(--accent-fire); border-color: var(--accent-fire); }
.fr-career-head { display: flex; align-items: center; gap: 16px; }
.fr-career-portrait .fr-portrait img, .fr-career-portrait .fr-portrait-fb { width: 66px; height: 66px; border: 2px solid var(--accent-gold); box-shadow: 0 0 18px -4px var(--accent-gold); border-radius: 50%; }
.fr-career-name { font-family: var(--font-display); font-size: 30px; letter-spacing: .5px; color: var(--text); line-height: 1; }
.fr-career-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.fr-badge { font-size: 9px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 3px 9px; border-radius: 999px; color: #1a1405; background: var(--accent-gold); border: 1px solid #c99a1e; }
.fr-badge-none { color: var(--muted); background: var(--surface); border-color: var(--border); }
.fr-seasonline { display: flex; flex-wrap: wrap; gap: 8px; }
.fr-place-chip { display: inline-flex; flex-direction: column; align-items: center; gap: 2px; min-width: 52px; padding: 8px 10px; border-radius: 10px; background: var(--surface); border: 1px solid var(--border); }
.fr-place-chip .fr-place-snum { font-size: 9px; font-weight: 700; letter-spacing: .6px; color: var(--muted); text-transform: uppercase; }
.fr-place-chip .fr-place-rank { font-family: var(--font-display); font-size: 20px; line-height: 1; color: var(--text); }
.fr-place-chip.gold { border-color: var(--accent-gold); box-shadow: 0 0 12px -5px var(--accent-gold); }
.fr-place-chip.gold .fr-place-rank { color: var(--accent-gold); }
.fr-place-chip.silver { border-color: #b9c2cc; }
.fr-place-chip.silver .fr-place-rank { color: #cfd6de; }
.fr-place-chip.muted { opacity: .82; }
.fr-place-light { font-size: 8px; color: var(--muted); font-style: italic; }
.fr-totals-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 10px; }
.fr-stat { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px 8px; text-align: center; }
.fr-stat-val { font-family: var(--font-display); font-size: 24px; line-height: 1; color: var(--accent-gold); }
.fr-stat-label { font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); margin-top: 6px; }
.fr-people { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
.fr-people-col { display: flex; flex-direction: column; gap: 6px; }
.fr-person-row { display: flex; align-items: center; gap: 8px; padding: 4px 6px; border-radius: 8px; transition: background .18s; }
.fr-person-row:hover { background: var(--surface2); }
.fr-person-row .fr-portrait img, .fr-person-row .fr-portrait-fb { width: 24px; height: 24px; }
.fr-person-name { flex: 1; font-size: 12px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fr-person-count { font-size: 10px; font-weight: 800; padding: 1px 7px; border-radius: 999px; }
.fr-person-ally { color: #06110b; background: var(--accent); }
.fr-person-rival { color: #fff; background: var(--accent-fire); }
.fr-person-betray { color: var(--muted); background: var(--surface2); border: 1px solid var(--border); }
.fr-showmance-line { font-size: 12px; color: var(--muted); margin-top: 10px; }
.fr-show-tag { font-size: 9px; font-weight: 800; letter-spacing: .5px; text-transform: uppercase; padding: 1px 6px; border-radius: 5px; }
.fr-show-tag.ok { color: #06110b; background: var(--accent); }
.fr-show-tag.bad { color: #fff; background: var(--accent-fire); }
.fr-show-season { color: var(--accent-gold); font-weight: 700; }

/* All-Stars Scout */
.fr-scout-topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
/* Season Overview pattern: the wrap scrolls at FULL tab width (scrollbar at the
   screen edge), while the centered .fr-shell holds the content column — so text
   never crowds the scrollbar. Overrides the base .fr-wrap in simulator.html. */
.fr-wrap { max-width: none !important; padding: 26px 14px 60px !important; }
.fr-shell { max-width: 1180px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 8px; }
/* 3-column pool grid; align-items:start keeps collapsed rows compact when a
   neighbor in the same row is expanded */
.fr-scout { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; align-items: start; }
@media (max-width: 1000px) { .fr-scout { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); } }
.fr-pool { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 0; border-top: 3px solid var(--accent-gold); overflow: hidden; }
.fr-pool-unfinishedBusiness { border-top-color: var(--accent-fire); }
.fr-pool-fallenAngels { border-top-color: #b9c2cc; }
.fr-pool-redemption { border-top-color: var(--accent); }
.fr-pool-villains { border-top-color: #c05ce0; }
.fr-pool-challengeTitans { border-top-color: var(--accent-ice); }
.fr-pool-showmanceStars { border-top-color: #e0668f; }
.fr-pool-firstBootClub { border-top-color: #8a93a0; }
.fr-pool-marathoners { border-top-color: #b98a4a; }
.fr-pool-feuds { border-top-color: var(--accent-fire); }
.fr-pool-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.fr-pool-toggle { width: 100%; background: transparent; border: 0; padding: 12px 15px; cursor: pointer; text-align: left; color: inherit; font: inherit; transition: background .15s; }
.fr-pool-toggle:hover { background: var(--accent-dim); }
.fr-pool-toggle:focus-visible { outline: 2px solid var(--accent-gold); outline-offset: -2px; }
.fr-pool-chev { font-size: 12px; color: var(--muted); flex-shrink: 0; width: 14px; }
.fr-pool-titles { flex: 1; min-width: 0; }
.fr-pool-count { font-family: var(--font-mono, monospace); font-size: 11px; font-weight: 700; color: var(--accent-gold); background: rgba(240,192,64,.1); border: 1px solid rgba(240,192,64,.3); border-radius: 10px; padding: 1px 8px; flex-shrink: 0; }
.fr-pool.open .fr-pool-chips { padding: 0 15px 14px; }
.fr-feud-pair { display: inline-flex; align-items: center; gap: 2px; flex-shrink: 0; }
.fr-feud-bolt { color: var(--accent-fire); font-size: 13px; }
.fr-feud-chip:hover { border-color: var(--accent-fire); }
@media (prefers-reduced-motion: reduce) { .fr-pool-toggle, .fr-scout-chip { transition: none; } }
.fr-pool-titles { display: flex; flex-direction: column; gap: 2px; }
.fr-pool-label { font-family: var(--font-display); font-size: 17px; letter-spacing: .6px; color: var(--text); }
.fr-pool-blurb { font-size: 10px; color: var(--muted); letter-spacing: .3px; }
.fr-pool-chips { display: flex; flex-direction: column; gap: 7px; }
.fr-scout-chip { display: flex; align-items: center; gap: 10px; padding: 6px 8px; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; transition: border-color .18s, transform .18s; }
.fr-scout-chip:hover { border-color: var(--accent-gold); transform: translateX(2px); }
.fr-scout-chip .fr-portrait img, .fr-scout-chip .fr-portrait-fb { width: 30px; height: 30px; }
.fr-scout-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.fr-scout-name { font-size: 12px; font-weight: 700; color: var(--text); }
.fr-scout-why { font-size: 10px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fr-copy-btn { white-space: nowrap; }
@media (prefers-reduced-motion: reduce) {
  .fr-hof-chip, .fr-roster-chip, .fr-scout-chip, .fr-clickable { transition: none; }
}
`;

// ══════════════════════════════════════════════════════════════════════
// HANDLERS
// ══════════════════════════════════════════════════════════════════════
function _persistAndRerender() { try { persistFranchiseLedger(); } catch (e) { console.warn(e); } renderFranchiseTab(); }

// ── Legacy: career panel + scout copy + lock ──────────────────────────
export function frOpenCareer(name) {
  const panel = document.getElementById('fr-career-panel');
  if (!panel) return;
  const c = careerFor(name);
  if (!c) { panel.style.display = 'none'; panel.innerHTML = ''; return; }
  panel.innerHTML = _careerPanelHtml(c);
  panel.style.display = 'block';
  try { panel.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { void e; }
}
export function frCloseCareer() {
  const panel = document.getElementById('fr-career-panel');
  if (panel) { panel.style.display = 'none'; panel.innerHTML = ''; }
}
function _copyText(text, label) {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => _flashCopy(label, true),
      () => { try { window.prompt(`${label} — copy the list below:`, text); } catch (e) { void e; } }
    );
  } else {
    try { window.prompt(`${label} — copy the list below:`, text); } catch (e) { void e; }
  }
}
function _flashCopy(label, ok) {
  const log = document.getElementById('fr-import-log');
  if (!log) return;
  const row = document.createElement('div');
  row.className = 'fr-log-row ' + (ok ? 'fr-log-ok' : 'fr-log-err');
  row.innerHTML = (ok ? '✓ ' : '✗ ') + _esc(label) + ' copied to clipboard';
  log.appendChild(row);
}
export function frCopyPool(key) {
  const pool = returneePools()[key] || [];
  if (!pool.length) return;
  const meta = _POOL_META[key];
  const names = key === 'feuds'
    ? [...new Set(pool.flatMap(f => [f.a, f.b]))]
    : pool.map(x => x.name);
  _copyText(names.join('\n'), `${meta ? meta.label : key} cast list`);
}
export function frCopyAllStars() {
  const pools = returneePools();
  const seen = new Set(); const names = [];
  for (const key of ['legends', 'unfinishedBusiness', 'fallenAngels', 'redemption']) {
    for (const x of (pools[key] || []).slice(0, 5)) {
      if (!seen.has(x.name)) { seen.add(x.name); names.push(x.name); }
    }
  }
  if (!names.length) return;
  _copyText(names.join('\n'), 'All-Stars pool');
}
export function frToggleLock() {
  const id = franchiseLedger.active;
  const f = franchiseLedger.franchises[id];
  const nm = f?.name || id;
  if (isFranchiseLocked(id)) {
    if (!confirm(`Unlock "${nm}"? Recording, importing, and wiping will be re-enabled.`)) return;
    setFranchiseLocked(id, false);
  } else {
    if (!confirm(`Lock "${nm}"? No season can be recorded, imported, or wiped until unlocked.`)) return;
    setFranchiseLocked(id, true);
  }
  _persistAndRerender();
}

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
  if (isFranchiseLocked(franchiseLedger.active)) { alert(`"${cur?.name || 'This franchise'}" is locked (sealed canon). Unlock it before deleting.`); return; }
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
export function frApplyToCurrent() {
  if (typeof window !== 'undefined' && typeof window.applyFranchiseMetaMidSeason === 'function') {
    window.applyFranchiseMetaMidSeason();
  }
}
export function frExportFranchise() {
  const data = exportActiveFranchise();
  if (!data.exportedSeasons) { alert('This franchise has no recorded seasons to export.'); return; }
  const fname = `franchise-${String(data.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'export'}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = fname; a.click();
  URL.revokeObjectURL(a.href);
}
export function frWipeActive() {
  const cur = franchiseLedger.franchises[franchiseLedger.active];
  if (isFranchiseLocked(franchiseLedger.active)) { alert(`"${cur?.name || 'This franchise'}" is locked. Unlock it before wiping.`); return; }
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
  // Locked franchise rejects every import EXCEPT a franchise export (which makes
  // a brand-new franchise and never touches the locked one).
  if (isFranchiseLocked(franchiseLedger.active) && !(raw && raw.type === 'dc-franchise-export')) {
    _logLine(`${_esc(fileName)} — Franchise is locked`, false);
    return;
  }
  // franchise export → new franchise (never merges — zero overwrite risk)
  if (raw && raw.type === 'dc-franchise-export') {
    const res = importFranchiseExport(raw);
    _logLine(res.ok
      ? `Franchise "${_esc(res.name)}" imported (${res.seasonCount} season${res.seasonCount === 1 ? '' : 's'}) and set active`
      : `${_esc(fileName)} — ${_esc(res.error)}`, !!res.ok);
    return;
  }
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
