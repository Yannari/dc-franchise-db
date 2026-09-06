// ══════════════════════════════════════════════════════════════════════
// cast-ui.js — Cast builder, roster, presets, config, relationships, alliances UI
// ══════════════════════════════════════════════════════════════════════

import { DEFAULT_ROSTER } from './roster-data.js';
import { audio } from './audio.js';
// Only the helper — `seasonConfig` is a live global here (it is reassigned
// wholesale in saveConfig, which an import binding would not allow).
import { seasonFormat, formatIsRunnable, formatName, TWIST_CATALOG } from './core.js';
import { ensurePortraitSelection, migrateCastPortraits, baseAvatarSlug,
  playerAvatarUrl, portraitOptions, hasShowPortraits, loadPortraitCatalog } from './players.js';
import { SHOWS } from './shows.js';
import { activeSeasons, franchiseHistorySummary,
  clearPlayerHistory, recordSeasonToLedger, buildFranchiseMeta, healLedgerRecord } from './franchise-meta.js';
import { persistFranchiseLedger, applyPreAlliances } from './savestate.js';
// The career record, and the resolver that reads it. `js/tr/state.js` owns the
// Alumni/Celebrity/Civilian decision; this file only draws it.
import { alumniDatabase, setAlumniDatabase } from './alumni.js';
import { TR_BACKGROUND_TYPES, resolveTraitorsBackground, snapshotTraitorsBackgrounds,
  traitorsBackgroundBlockers } from './tr/state.js';
import { TR_DENSITY_LEVELS, TR_DENSITY_DEFAULT, densityLevel,
  traitorsDensitySummary } from './tr-density.js';

export function showTab(name) {
  audio.sfx('tab-swoosh');
  activeTab = name;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  const tabs = ['cast', 'setup', 'run', 'results', 'franchise'];
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    if (i < tabs.length) btn.classList.toggle('active', tabs[i] === name);
  });
  if (name === 'cast')    renderTribeSelect();
  if (name === 'setup')   { populateRelDropdowns(); updateCastSizeDisplay(); renderTimeline(); renderTwistCatalog(); try { window.renderQuickSetup?.(); } catch {} }
  if (name === 'run')     initRunTab();
  if (name === 'results') renderResultsTab();
  if (name === 'franchise' && typeof renderFranchiseTab === 'function') renderFranchiseTab();
  if (typeof updateBroadcastBar === 'function') updateBroadcastBar();   // refresh ON-AIR / season / episode
  // Remember active tab across reloads
  try { localStorage.setItem('simulator_activeTab', name); } catch(e) {}
}

// ══════════════════════════════════════════════════════════════════════
// STAT SLIDERS
// ══════════════════════════════════════════════════════════════════════

export function buildStatSliders() {
  const container = document.getElementById('stat-sliders');
  container.innerHTML = STATS.map(s => `
    <div class="slider-row">
      <span class="slider-name" style="color:${s.color}" title="${s.desc}">${s.name}</span>
      <input type="range" min="1" max="10" value="5" class="stat-slider" id="slider-${s.key}"
        oninput="setSlider('${s.key}', this.value, true)">
      <span class="slider-val" id="val-${s.key}" style="color:${s.color}">5</span>
    </div>`).join('');
  STATS.forEach(s => setSlider(s.key, 5, false));
}

export function setSlider(key, val, resetArchetype) {
  const n = parseInt(val), stat = STATS.find(s => s.key === key);
  const pct = ((n-1)/9*100).toFixed(1) + '%';
  const el = document.getElementById('slider-' + key);
  if (el) { el.value = n; el.style.background = `linear-gradient(to right,${stat.color} 0%,${stat.color} ${pct},var(--slider-track) ${pct})`; }
  const vEl = document.getElementById('val-' + key);
  if (vEl) vEl.textContent = n;
  // archetype stays locked — slider edits don't clear it
}
export function applyArchetype(key) {
  const a = ARCHETYPES[key]; if (!a) return;
  // Only overwrite stats when adding a NEW player — editing an existing player just changes the label
  if (!editingId) STATS.forEach(s => setSlider(s.key, a[s.key], false));
  document.getElementById('archetype-desc').textContent = a.desc || '';
}
export function getStats() { const s = {}; STATS.forEach(st => { s[st.key] = parseInt(document.getElementById('slider-'+st.key).value); }); return s; }
export function putStats(stats) { STATS.forEach(s => setSlider(s.key, stats[s.key] || 5, false)); }

// ══════════════════════════════════════════════════════════════════════
// DERIVED
// ══════════════════════════════════════════════════════════════════════


// ── Tribe Builder ─────────────────────────────────────────────────────
export const TRIBE_PALETTE = ['#f59e0b','#ef4444','#3b82f6','#10b981','#8b5cf6','#f97316','#ec4899','#0ea5e9','#64748b','#fb7185'];

export function renderTribeBuilder() {
  const list = document.getElementById('tribe-builder-list');
  if (!list) return;
  const tribes = seasonConfig.tribes || [];
  if (!tribes.length) {
    list.innerHTML = '<div style="font-size:12px;color:var(--muted);margin-bottom:4px">No tribes yet. Add one to get started.</div>';
    return;
  }
  list.innerHTML = tribes.map((t, i) => `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
      <div style="width:22px;height:22px;border-radius:50%;background:${t.color};border:2px solid rgba(255,255,255,0.15);cursor:pointer;flex-shrink:0;position:relative" onclick="cycleTribeColor(${i})" title="Click to change color"></div>
      <input type="text" value="${t.name}" placeholder="Tribe name"
        oninput="updateTribeName(${i},this.value)"
        style="flex:1;background:var(--surface2,var(--surface));border:1px solid var(--border);border-radius:4px;color:var(--text);padding:4px 8px;font-size:13px">
      <button onclick="removeTribe(${i})" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);color:#ef4444;border-radius:4px;width:24px;height:24px;cursor:pointer;font-size:14px;flex-shrink:0">✕</button>
    </div>`).join('');
}

export function renderTribeSelect() {
  const sel = document.getElementById('f-tribe');
  if (!sel) return;
  const current = sel.value;
  // Configured tribes + any tribes already used by cast players (in case cast was built before tribe builder)
  const configuredNames = (seasonConfig.tribes || []).map(t => t.name);
  const castNames = [...new Set(players.map(p => p.tribe).filter(Boolean))];
  const extraNames = castNames.filter(n => !configuredNames.some(c => c.toLowerCase() === n.toLowerCase()));
  const allTribes = [
    ...(seasonConfig.tribes || []),
    ...extraNames.map(n => ({ name: n, color: tribeColor(n) }))
  ];
  if (!allTribes.length) {
    sel.innerHTML = '<option value="">— set up tribes in Season Setup —</option>';
  } else {
    sel.innerHTML = '<option value="">— pick tribe —</option>' +
      allTribes.map(t => `<option value="${t.name}"${t.name === current ? ' selected' : ''}>${t.name}</option>`).join('');
  }
}

export function addTribe() {
  if (!seasonConfig.tribes) seasonConfig.tribes = [];
  const usedColors = seasonConfig.tribes.map(t => t.color);
  const color = TRIBE_PALETTE.find(c => !usedColors.includes(c)) || TRIBE_PALETTE[seasonConfig.tribes.length % TRIBE_PALETTE.length];
  seasonConfig.tribes.push({ name: 'Tribe ' + (seasonConfig.tribes.length + 1), color });
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTribeBuilder(); renderTribeSelect();
}

export function removeTribe(i) {
  seasonConfig.tribes.splice(i, 1);
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTribeBuilder(); renderTribeSelect();
}

export function updateTribeName(i, val) {
  if (seasonConfig.tribes[i]) seasonConfig.tribes[i].name = val;
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTribeSelect();
}

export function cycleTribeColor(i) {
  const t = seasonConfig.tribes[i]; if (!t) return;
  const idx = TRIBE_PALETTE.indexOf(t.color);
  t.color = TRIBE_PALETTE[(idx + 1) % TRIBE_PALETTE.length];
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTribeBuilder(); renderTribeSelect();
}

// ── Romance Compatibility ─────────────────────────────────────────────

// Pronoun helper — returns {sub, obj, pos, posAdj, ref, Sub, Obj, PosAdj} for a player
// Capitalised versions

// ══════════════════════════════════════════════════════════════════════
// CAST CRUD
// ══════════════════════════════════════════════════════════════════════

export function submitPlayer() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) { alert('Enter a player name.'); return; }
  const sexuality = document.getElementById('f-sexuality')?.value || 'straight';
  const baseSlug = document.getElementById('f-slug').value.trim() || name.toLowerCase().replace(/\s+/g,'-');
  const player = {
    id: editingId || Date.now().toString(36)+Math.random().toString(36).slice(2,5),
    name, slug: baseSlug,
    // The portrait this season chose. Identity (slug) and appearance
    // (avatarId/avatarFile) are separate fields now, so a returning player can
    // wear the same clothes and a first-timer can wear new ones.
    avatarId: getFormPortrait().avatarId,
    avatarFile: getFormPortrait().avatarFile,
    tribe: document.getElementById('f-tribe').value,
    gender: getGender(),
    sexuality: sexuality !== 'straight' ? sexuality : undefined,
    archetype: document.getElementById('f-archetype').value, stats: getStats(),
    isReturnee: document.getElementById('f-returnee')?.checked || false,
    isCoach: document.getElementById('f-coach')?.checked || false,
    // Alumni / Celebrity / Civilian — stored ONLY when the user overrode the
    // default. An empty select means "whatever the record says", and writing
    // the resolved answer here instead would freeze today's record into the
    // cast list where a later correction could never reach it.
    backgroundType: TR_BACKGROUND_TYPES.includes(document.getElementById('f-background')?.value)
      ? document.getElementById('f-background').value : undefined,
  };
  ensurePortraitSelection(player); // fill in the portrait if the picker was never touched
  if (editingId) { const i = players.findIndex(p=>p.id===editingId); if(i!==-1) players[i]=player; cancelEdit(); }
  else { players.push(player); resetForm(); }
  saveCast(); renderCast();
}
export function editPlayer(id) {
  const p = players.find(p=>p.id===id); if (!p) return;
  editingId = id;
  document.getElementById('f-name').value = p.name;
  document.getElementById('f-slug').value = baseAvatarSlug(p);
  const tribeEl = document.getElementById('f-tribe'); if (tribeEl) tribeEl.value = p.tribe||'';
  setGender(p.gender || 'nb');
  const sexEl = document.getElementById('f-sexuality'); if (sexEl) sexEl.value = p.sexuality||'straight';
  document.getElementById('f-archetype').value = p.archetype||'';
  document.getElementById('archetype-desc').textContent = ARCHETYPES[p.archetype]?.desc||'';
  const retEl = document.getElementById('f-returnee'); if (retEl) retEl.checked = p.isReturnee || false;
  const coachEl = document.getElementById('f-coach'); if (coachEl) coachEl.checked = p.isCoach || false;
  const bgEl = document.getElementById('f-background'); if (bgEl) bgEl.value = p.backgroundType || '';
  setFormPortrait(p.avatarId, p.avatarFile);
  renderPortraitPickerInto();
  updateBackgroundPreview();
  putStats(p.stats);
  document.getElementById('form-title').textContent = 'Edit \u2014 '+p.name;
  document.getElementById('submit-btn').textContent = 'Update Player';
  document.getElementById('edit-actions').style.display = 'flex';
  renderCast(); document.querySelector('.form-panel').scrollTop = 0;
}
export function cancelEdit() {
  editingId = null; resetForm();
  document.getElementById('form-title').textContent = 'Add Player';
  document.getElementById('submit-btn').textContent = 'Add Player';
  document.getElementById('edit-actions').style.display = 'none';
  document.getElementById('archetype-desc').textContent = '';
  renderCast();
}
export function deleteCurrentEdit() {
  if (!editingId) return;
  const p = players.find(p=>p.id===editingId);
  if (!confirm('Remove '+(p?.name||'this player')+'?')) return;
  players = players.filter(p=>p.id!==editingId); saveCast(); cancelEdit();
}
export function resetForm() {
  ['f-name','f-slug'].forEach(id => document.getElementById(id).value='');
  const tEl = document.getElementById('f-tribe'); if (tEl) tEl.value='';
  const sEl = document.getElementById('f-sexuality'); if (sEl) sEl.value='straight';
  setGender('nb');
  document.getElementById('f-archetype').value='';
  const retEl = document.getElementById('f-returnee'); if (retEl) retEl.checked = false;
  const coachEl = document.getElementById('f-coach'); if (coachEl) coachEl.checked = false;
  const bgEl = document.getElementById('f-background'); if (bgEl) bgEl.value = '';
  const bgPrev = document.getElementById('f-background-preview'); if (bgPrev) bgPrev.innerHTML = '';
  setFormPortrait(null, '');
  renderPortraitPickerInto();
  document.getElementById('archetype-desc').textContent='';
  STATS.forEach(s => setSlider(s.key, 5, false));
}
// ── Franchise Roster: fetched from JSON on load, embedded copy as fallback ──
export let FRANCHISE_ROSTER = DEFAULT_ROSTER;

export function setFRANCHISE_ROSTER(v) { FRANCHISE_ROSTER = v; }

// ── Franchise Roster Search ───────────────────────────────────────────
export let rosterHighlight = -1;

export function filterRoster(query) {
  const dd = document.getElementById('roster-dropdown');
  if (!query.trim()) { dd.style.display = 'none'; return; }
  const roster = FRANCHISE_ROSTER;
  const q = query.toLowerCase();
  const matches = roster.filter(p => p.name.toLowerCase().includes(q)).slice(0, 12);
  rosterHighlight = -1;
  if (!matches.length) { dd.style.display = 'none'; return; }
  dd.innerHTML = matches.map((p, i) =>
    `<div class="roster-item" data-i="${i}" onmousedown="fillFromRoster(${JSON.stringify(p).replace(/"/g,'&quot;')})"
      style="padding:7px 10px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
      <span>${p.name}${_extraPortraitCount(p)
    ? ` <span title="${_extraPortraitCount(p)} portrait${_extraPortraitCount(p) === 1 ? '' : 's'} for this show besides the default" style="font-size:9px;letter-spacing:.5px;color:#a78bfa">+${_extraPortraitCount(p)}</span>` : ''}</span>
      <span style="font-size:10px;color:var(--muted)">${p.archetype||''}</span>
    </div>`
  ).join('');
  dd.style.display = 'block';
}

export function rosterKeyNav(e) {
  const dd = document.getElementById('roster-dropdown');
  const items = dd.querySelectorAll('.roster-item');
  if (!items.length) return;
  if (e.key === 'ArrowDown') { rosterHighlight = Math.min(rosterHighlight + 1, items.length - 1); highlightRosterItem(items); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { rosterHighlight = Math.max(rosterHighlight - 1, 0); highlightRosterItem(items); e.preventDefault(); }
  else if (e.key === 'Enter' && rosterHighlight >= 0) { items[rosterHighlight].dispatchEvent(new Event('mousedown')); e.preventDefault(); }
  else if (e.key === 'Escape') { dd.style.display = 'none'; }
}

export function highlightRosterItem(items) {
  items.forEach((el, i) => el.style.background = i === rosterHighlight ? 'var(--accent-dim, rgba(99,102,241,.15))' : '');
}

export function fillFromRoster(p) {
  document.getElementById('roster-search').value = '';
  document.getElementById('roster-dropdown').style.display = 'none';
  document.getElementById('f-name').value = p.name;
  document.getElementById('f-slug').value = baseAvatarSlug(p) || p.name.toLowerCase().replace(/\s+/g, '-');
  setGender(p.gender || 'nb');
  const sexEl = document.getElementById('f-sexuality'); if (sexEl) sexEl.value = p.sexuality || 'straight';
  document.getElementById('f-archetype').value = p.archetype || '';
  document.getElementById('archetype-desc').textContent = ARCHETYPES[p.archetype]?.desc || '';
  if (p.stats) putStats(p.stats);
  // Always default to non-returnee when adding from roster — set per-season in cast builder
  const retEl = document.getElementById('f-returnee'); if (retEl) retEl.checked = false;
  const coachEl = document.getElementById('f-coach'); if (coachEl) coachEl.checked = false;
  setFormPortrait(null, '');
  renderPortraitPickerInto();
}

// Close dropdown when clicking outside
document.addEventListener('click', e => {
  if (!e.target.closest('#roster-search') && !e.target.closest('#roster-dropdown'))
    document.getElementById('roster-dropdown').style.display = 'none';
});

export function saveCast() { localStorage.setItem('simulator_cast', JSON.stringify(players)); }
export function clearCast() { if(!confirm('Clear all players?')) return; players=[]; saveCast(); cancelEdit(); renderCast(); }
/**
 * Wipe everything that points at cast members by name.
 *
 * Relationships and pre-game alliances are stored as player names, so they
 * only mean anything for the cast they were written for. Swapping the cast
 * used to leave them behind, pointing at people who are no longer playing.
 * Loading a preset that carries its own relationships is different — that
 * path replaces them wholesale in _applyPreset().
 */
function _clearCastScopedLinks() {
  relationships = [];
  saveRels();
  preGameAlliances = [];
  savePreAlliances();
  if (typeof renderRelList === 'function') renderRelList();
  if (typeof renderAllianceList === 'function') renderAllianceList();
}

export function loadS10Preset() {
  if (players.length>0 && !confirm('Replace cast with S10 Champions vs Contenders?\n\nExisting relationships and pre-game alliances are cleared too — they name players from the old cast.')) return;
  const rosterMap = Object.fromEntries(FRANCHISE_ROSTER.map(p => [p.name, p]));
  players = S10_TRIBES.map((t,i) => {
    const r = rosterMap[t.name];
    if (!r) { console.warn('S10 preset: missing roster entry for', t.name); return null; }
    return { ...r, tribe: t.tribe, id: 's10-'+i, isReturnee: true };
  }).filter(Boolean);
  _clearCastScopedLinks();
  seasonConfig.tribes = [{ name:'Champions', color:'#f59e0b' }, { name:'Contenders', color:'#ef4444' }];
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  saveCast(); cancelEdit(); renderCast(); renderTribeBuilder(); renderTribeSelect(); renderConfig();
}
export function loadS9Preset() {
  if (players.length>0 && !confirm('Replace cast with S9 Land of Powers (18 newbies)?\n\nExisting relationships and pre-game alliances are cleared too — they name players from the old cast.')) return;
  const rosterMap = Object.fromEntries(FRANCHISE_ROSTER.map(p => [p.name, p]));
  players = S9_TRIBES.map((t,i) => {
    const r = rosterMap[t.name];
    if (!r) { console.warn('S9 preset: missing roster entry for', t.name); return null; }
    return { ...r, tribe: t.tribe, id: 's9-'+i, isReturnee: false };
  }).filter(Boolean);
  _clearCastScopedLinks();
  seasonConfig.tribes = [{ name:'Yellow', color:'#f59e0b' }, { name:'Red', color:'#ef4444' }, { name:'Blue', color:'#3b82f6' }];
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  saveCast(); cancelEdit(); renderCast(); renderTribeBuilder(); renderTribeSelect(); renderConfig();
}
export function exportCast() {
  const blob = new Blob([JSON.stringify(players,null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='simulator-cast.json'; a.click();
}
export function importCast(event) {
  const file = event.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = e => { try { const raw=JSON.parse(e.target.result); const data=Array.isArray(raw) ? raw : (raw.players && Array.isArray(raw.players)) ? raw.players : null; if(!data) throw new Error(); players=data; _clearCastScopedLinks(); saveCast(); renderCast(); renderTribeBuilder(); renderTribeSelect(); } catch { alert('Invalid JSON file.'); } };
  reader.readAsText(file); event.target.value='';
}

// ── Franchise History (cross-season ledger) UI ──
export function renderFranchiseHistoryPanel() {
  const el = document.getElementById('franchise-history-panel'); if (!el) return;
  const rows = players.filter(p => p.isReturnee).map(p => {
    const hist = franchiseHistorySummary(p.name);
    if (!hist.length) return `<div class="fh-row"><b>${p.name}</b> — no recorded history</div>`;
    return `<div class="fh-row"><b>${p.name}</b> — ${hist.map(h => `S${h.seasonNum}: ${h.line}`).join(' | ')}
      <button onclick="clearFranchisePlayerHistory('${p.name.replace(/'/g, "\\'")}')" style="margin-left:6px;">clear</button></div>`;
  });
  const total = Object.keys(activeSeasons()).length;
  el.innerHTML = `<div style="font-size:12px;opacity:.8;">Franchise ledger: ${total} season${total === 1 ? '' : 's'} recorded</div>` + rows.join('');
}

export function clearFranchisePlayerHistory(name) {
  clearPlayerHistory(name); persistFranchiseLedger(); renderFranchiseHistoryPanel();
}

// Record whatever finished season is currently loaded into the franchise
// ledger. Officialness = the user's choice of which save to load and record.
export function recordLoadedSeasonToHistory() {
  if (!gs || gs.phase !== 'complete') { alert('Load a FINISHED season savestate first (the finale must be complete).'); return; }
  const seasonNum = gs.seasonNumber || seasonConfig?.seasonNumber || 0;
  if (!seasonNum) { alert('This save has no season number. Set "Season Number" in the config to identify it, then click again.'); return; }
  if (!gs.seasonNumber && !confirm(`This save predates season stamping. Record it as Season ${seasonNum} (from your config)?`)) return;
  if (activeSeasons()[String(seasonNum)] && !confirm(`Season ${seasonNum} already has a recorded history. Overwrite it with this savestate?`)) return;
  if (recordSeasonToLedger(null, 'manual')) {
    persistFranchiseLedger();
    renderFranchiseHistoryPanel();
    alert(`Season ${seasonNum} recorded into franchise history (${Object.keys(activeSeasons()[String(seasonNum)].players).length} players).`);
  } else {
    alert('Could not derive a season record from this save.');
  }
}

export function applyFranchiseMetaMidSeason() {
  if (!gs || gs.phase === 'complete') { alert('No season in progress — load or start one first.'); return; }
  let meta = null;
  try { meta = buildFranchiseMeta(players, seasonConfig); } catch (e) { console.warn(e); }
  if (!meta) { alert('No returnee history found. Backfill or record past seasons first, and make sure returnees are marked as returnees.'); return; }
  gs.franchiseMeta = { profiles: meta.profiles, seededPairs: [] }; // no retroactive bond seeding
  saveGameState();
  alert(`Franchise history applied to ${Object.keys(meta.profiles).length} returnee(s) for the rest of this season (reputation, instincts, callbacks — starting bonds unchanged).`);
}

// ── Franchise Roster Management ──
export function exportRoster() {
  const blob = new Blob([JSON.stringify({ players: FRANCHISE_ROSTER }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'franchise_roster.json'; a.click();
}
export function importRoster(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const raw = JSON.parse(e.target.result);
      const data = Array.isArray(raw) ? raw : (raw.players && Array.isArray(raw.players)) ? raw.players : null;
      if (!data || !data.length) throw new Error();
      FRANCHISE_ROSTER = data;
      try { localStorage.setItem('simulator_franchise_roster', JSON.stringify(data)); } catch(err) {}
      alert(`Roster imported: ${data.length} players.`);
    } catch { alert('Invalid JSON file. Expected { "players": [...] } or a bare array.'); }
  };
  reader.readAsText(file); event.target.value = '';
}
export function syncCastToRoster() {
  if (!players.length) { alert('No cast to sync.'); return; }
  let updated = 0;
  players.forEach(p => {
    const ri = FRANCHISE_ROSTER.findIndex(r => r.name === p.name || r.slug === baseAvatarSlug(p));
    if (ri !== -1) {
      FRANCHISE_ROSTER[ri] = { ...FRANCHISE_ROSTER[ri], archetype: p.archetype, stats: { ...p.stats }, gender: p.gender };
      if (p.sexuality) FRANCHISE_ROSTER[ri].sexuality = p.sexuality;
      // NOT isReturnee. Returning is a fact about an APPEARANCE, not about a
      // person: Jules being a returnee in season 12 does not make Jules a
      // returnee in season 15. Persisting it here wrote a season's casting
      // decision onto the permanent character record, where every later season
      // could inherit it — and the shipped roster already carried one, which is
      // how it was found.
      delete FRANCHISE_ROSTER[ri].isReturnee;
      updated++;
    } else {
      FRANCHISE_ROSTER.push({ name: p.name, slug: baseAvatarSlug(p), gender: p.gender, archetype: p.archetype, stats: { ...p.stats } });
      updated++;
    }
  });
  try { localStorage.setItem('simulator_franchise_roster', JSON.stringify(FRANCHISE_ROSTER)); } catch(err) {}
  alert(`Roster updated: ${updated} player${updated !== 1 ? 's' : ''} synced.`);
}

// ── Preset System: save/load full season setups ──
export function _buildPresetData() {
  return {
    version: 1,
    name: seasonConfig.name || 'Untitled',
    date: new Date().toISOString().slice(0, 10),
    config: { ...seasonConfig },
    players: players.map(p => ({ ...p })),
    relationships: relationships.map(r => ({ ...r })),
    preGameAlliances: (preGameAlliances || []).map(a => ({ ...a })),
  };
}
export function _applyPreset(data) {
  if (!data?.config || !data?.players) { alert('Invalid preset data.'); return; }
  seasonConfig = data.config;
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  players = data.players;
  migrateCastPortraits(players);     // repair pre-portrait saves, once
  saveCast();
  relationships = data.relationships || [];
  localStorage.setItem('simulator_rels', JSON.stringify(relationships));
  preGameAlliances = data.preGameAlliances || [];
  localStorage.setItem('simulator_prealliances', JSON.stringify(preGameAlliances));
  renderConfig(); renderCast(); renderTribeBuilder(); renderTribeSelect();
  if (typeof renderRelList === 'function') renderRelList();
  if (typeof renderAllianceList === 'function') renderAllianceList();
}

// A) Export full preset as JSON file
export function exportPreset() {
  const data = _buildPresetData();
  const name = (seasonConfig.name || 'preset').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-').toLowerCase();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `preset-${name}.json`; a.click();
}
export function importPreset(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!confirm(`Load preset "${data.name || 'Untitled'}"? This will replace your current setup.`)) return;
      _applyPreset(data);
    } catch { alert('Invalid preset file.'); }
  };
  reader.readAsText(file); event.target.value = '';
}

// B) Save/load presets to localStorage
export function _getPresets() {
  try { return JSON.parse(localStorage.getItem('simulator_presets') || '[]'); } catch { return []; }
}
export function _savePresets(list) {
  localStorage.setItem('simulator_presets', JSON.stringify(list));
  renderPresetList();
}
export function savePreset() {
  const name = prompt('Preset name:', seasonConfig.name || 'My Season');
  if (!name) return;
  const presets = _getPresets();
  const existing = presets.findIndex(p => p.name === name);
  const data = _buildPresetData();
  data.name = name;
  if (existing >= 0) {
    if (!confirm(`Overwrite existing preset "${name}"?`)) return;
    presets[existing] = data;
  } else {
    presets.push(data);
  }
  _savePresets(presets);
  alert(`Preset "${name}" saved.`);
}
export function loadPreset(name) {
  if (!name) { document.getElementById('preset-delete-row').style.display = 'none'; return; }
  const presets = _getPresets();
  const data = presets.find(p => p.name === name);
  if (!data) { alert('Preset not found.'); return; }
  if (!confirm(`Load preset "${name}"? This will replace your current setup.`)) {
    document.getElementById('preset-list').value = '';
    return;
  }
  _applyPreset(data);
  document.getElementById('preset-list').value = '';
  document.getElementById('preset-delete-row').style.display = 'none';
}
export function deletePreset() {
  const sel = document.getElementById('preset-list');
  const name = sel.value;
  if (!name) return;
  if (!confirm(`Delete preset "${name}"?`)) return;
  const presets = _getPresets().filter(p => p.name !== name);
  _savePresets(presets);
  sel.value = '';
  document.getElementById('preset-delete-row').style.display = 'none';
}
export function renderPresetList() {
  const sel = document.getElementById('preset-list');
  if (!sel) return;
  const presets = _getPresets();
  sel.innerHTML = '<option value="">— Load saved preset —</option>' +
    presets.map(p => `<option value="${p.name}">${p.name} (${p.date || '?'})</option>`).join('');
  // Show load/delete buttons when a preset is selected — don't auto-load
  sel.onchange = function() {
    document.getElementById('preset-delete-row').style.display = this.value ? 'block' : 'none';
  };
}

// ── Season Save/Load: saves completed seasons (full gs + config + cast) ──
export function _buildSeasonSaveData() {
  prepGsForSave(gs);
  const data = {
    version: 1,
    type: 'season-save',
    name: seasonConfig.name || 'Untitled Season',
    date: new Date().toISOString().slice(0, 10),
    episode: gs.episode || 0,
    config: { ...seasonConfig },
    players: players.map(p => ({ ...p })),
    relationships: relationships.map(r => ({ ...r })),
    preGameAlliances: (preGameAlliances || []).map(a => ({ ...a })),
    gs: JSON.parse(JSON.stringify(gs)), // deep clone
  };
  repairGsSets(gs);
  return data;
}
export function _applySeasonSave(data) {
  if (!data?.gs || !data?.config) { alert('Invalid season save.'); return; }
  seasonConfig = data.config;
  // Fire-making override on season load
  if (seasonConfig.firemaking && seasonConfig.finaleSize < 4) seasonConfig.finaleSize = 4;
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  players = data.players || [];
  saveCast();
  relationships = data.relationships || [];
  localStorage.setItem('simulator_rels', JSON.stringify(relationships));
  preGameAlliances = data.preGameAlliances || [];
  localStorage.setItem('simulator_prealliances', JSON.stringify(preGameAlliances));
  gs = data.gs;
  repairGsSets(gs);
  saveGameState();
  // A finished season whose ledger record predates the current deriver is
  // re-recorded from the save just loaded — see healLedgerRecord.
  try { healLedgerRecord(); } catch { /* the load is the point; the heal is a bonus */ }
  renderConfig(); renderCast(); renderTribeBuilder(); renderTribeSelect();
  if (typeof renderRelList === 'function') renderRelList();
  if (typeof renderAllianceList === 'function') renderAllianceList();
  // Fully refresh the Run tab — show content, render episode history, show last episode
  if (typeof renderRunTab === 'function') renderRunTab();
  if (typeof renderEpisodeHistory === 'function') renderEpisodeHistory();
  if (typeof renderTimeline === 'function') renderTimeline();
  // Show the last episode's result
  if (gs.episodeHistory?.length) {
    const lastEp = gs.episodeHistory[gs.episodeHistory.length - 1];
    if (typeof renderEpisodeView === 'function') renderEpisodeView(lastEp);
  }
}

// Export season as JSON file
export function exportSeason() {
  if (!gs?.initialized) { alert('No season to export. Initialize first.'); return; }
  const data = _buildSeasonSaveData();
  const name = (seasonConfig.name || 'season').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-').toLowerCase();
  const ep = gs.episode || 0;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `season-${name}-ep${ep}.json`; a.click();
}
export function importSeason(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.type !== 'season-save') { alert('This is not a season save file.'); return; }
      if (!confirm(`Load season "${data.name}" (Episode ${data.episode || 0})? This replaces everything.`)) return;
      _applySeasonSave(data);
    } catch { alert('Invalid season file.'); }
  };
  reader.readAsText(file); event.target.value = '';
}

// Save/load seasons to IndexedDB (migrated from localStorage for unlimited space)
function _seasonKey(name) { return 'season_' + name; }

async function _getSeasonIndex() {
  try {
    return (await _idbGet('season_index')) || [];
  } catch { return []; }
}

async function _saveSeasonIndex(index) {
  await _idbPut('season_index', index);
}

export async function _migrateSeasonSavesFromLS() {
  try {
    const raw = localStorage.getItem('simulator_season_saves');
    if (!raw) return;
    const old = JSON.parse(raw);
    if (!Array.isArray(old) || !old.length) return;
    const index = await _getSeasonIndex();
    for (const save of old) {
      if (!save.name) continue;
      if (index.some(e => e.name === save.name)) continue;
      await _idbPut(_seasonKey(save.name), save);
      index.push({ name: save.name, date: save.date || '', episode: save.episode || 0 });
    }
    await _saveSeasonIndex(index);
    localStorage.removeItem('simulator_season_saves');
  } catch (e) { console.warn('Season save migration failed:', e); }
}

export async function saveSeasonToStorage() {
  if (!gs?.initialized) { alert('No season to save. Initialize first.'); return; }
  const defaultName = (seasonConfig.name || 'Season') + ' (Ep ' + (gs.episode || 0) + ')';
  const name = prompt('Save name:', defaultName);
  if (!name) return;
  const index = await _getSeasonIndex();
  const existing = index.findIndex(e => e.name === name);
  const data = _buildSeasonSaveData();
  data.name = name;
  if (existing >= 0) {
    if (!confirm(`Overwrite "${name}"?`)) return;
    index[existing] = { name, date: data.date, episode: data.episode };
  } else {
    index.push({ name, date: data.date, episode: data.episode });
  }
  await _idbPut(_seasonKey(name), data);
  await _saveSeasonIndex(index);
  renderSeasonSaveList();
  try { audio.sfx('save-chime'); } catch (e) {}
  alert(`Season "${name}" saved.`);
}
export async function loadSeasonFromStorage(name) {
  if (!name) { document.getElementById('season-delete-row').style.display = 'none'; return; }
  const data = await _idbGet(_seasonKey(name));
  if (!data) { alert('Save not found.'); return; }
  if (!confirm(`Load "${name}"? This replaces your current season.`)) {
    document.getElementById('season-save-list').value = '';
    return;
  }
  _applySeasonSave(data);
  document.getElementById('season-save-list').value = '';
  document.getElementById('season-delete-row').style.display = 'none';
}
export async function deleteSeasonSave() {
  const sel = document.getElementById('season-save-list');
  const name = sel.value;
  if (!name) return;
  if (!confirm(`Delete "${name}"?`)) return;
  const index = (await _getSeasonIndex()).filter(e => e.name !== name);
  await _idbDelete(_seasonKey(name));
  await _saveSeasonIndex(index);
  renderSeasonSaveList();
  sel.value = '';
  document.getElementById('season-delete-row').style.display = 'none';
}
export async function renderSeasonSaveList() {
  const sel = document.getElementById('season-save-list');
  if (!sel) return;
  const index = await _getSeasonIndex();
  sel.innerHTML = '<option value="">— Load saved season —</option>' +
    index.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
  sel.onchange = function() {
    document.getElementById('season-delete-row').style.display = this.value ? 'block' : 'none';
  };
}

// ══════════════════════════════════════════════════════════════════════
// CAST RENDER
// ══════════════════════════════════════════════════════════════════════

// ── Portrait picker ───────────────────────────────────────────────────
// The old control was a checkbox and a hint line: tick Returning and you MIGHT
// get a second face, if one happened to exist under a filename nobody could
// see. There was no way to ask what art a character had, no way to choose
// between three looks, and the answer changed shows without asking. This shows
// every portrait registered for THIS show, plus the profile default, and lets
// the season pick one.

/** How many show-specific looks this character has, for the roster dropdown. */
function _extraPortraitCount(p) {
  try { return portraitOptions(baseAvatarSlug(p), seasonFormat(seasonConfig)).filter(o => !o.isGlobal).length; }
  catch { return 0; }
}

let _formPortrait = { avatarId: null, avatarFile: '' };
let _catalogRepainted = false;

function _repaintWhenCatalogKnown() {
  if (_catalogRepainted) return;
  _catalogRepainted = true;
  // The catalog arrives over the network, so the first paint has nothing to
  // show. Repaint once rather than rendering an empty picker forever.
  try { loadPortraitCatalog().then(() => { try { renderCast(); renderPortraitPickerInto(); } catch {} }); } catch {}
}

const _pesc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function _formSlug() {
  return (document.getElementById('f-slug')?.value || '').trim()
    || (document.getElementById('f-name')?.value || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/** Reset the form's portrait state — used when clearing or loading a member. */
export function setFormPortrait(avatarId, avatarFile) {
  _formPortrait = { avatarId: avatarId || null, avatarFile: avatarFile || '' };
}
export function getFormPortrait() { return { ..._formPortrait }; }

/**
 * Portrait choices for the cast form: everything this player has for THIS
 * show, then their global portrait. Never another show's art, and no cap on
 * how many looks somebody may have.
 */
export function renderPortraitPicker(playerSlug, selectedId, show = seasonFormat(seasonConfig), playerName = '') {
  // The held choice is passed in so it is offered even when it belongs to
  // another show — otherwise it is invisible and stuck.
  const opts = portraitOptions(playerSlug, show, selectedId || _formPortrait.avatarFile);
  const showName = SHOWS[show]?.name || 'this show';
  const who = playerName || playerSlug;
  if (!opts.length) {
    return `<div class="portrait-picker-empty" role="note">No registered portrait for ${_pesc(who) || 'this character'}. The base file is used.</div>`;
  }

  const usable = opts.filter(o => !o.missing);
  const chosen = opts.some(o => o.id === selectedId && !o.missing)
    ? selectedId
    : (usable[0] || opts[0]).id;

  const note = hasShowPortraits(playerSlug, show)
    ? ''
    : `<div class="portrait-picker-note" role="note">No ${_pesc(showName)} portrait yet — the profile default is used.</div>`;

  const items = opts.map(o => {
    const where = o.isGlobal ? 'All shows' : (SHOWS[o.show]?.name || o.show);
    const label = `${who} — ${where} — ${o.label}${o.offShow ? ' (from another show)' : ''}`;
    const sel = o.id === chosen;
    return `<label class="portrait-opt${sel ? ' is-selected' : ''}${o.missing ? ' is-missing' : ''}" aria-checked="${sel}">
      <input type="radio" name="f-portrait" value="${_pesc(o.id)}" aria-label="${_pesc(label)}"${sel ? ' checked' : ''}${o.missing ? ' disabled' : ''} onchange="selectPortrait(this.value)">
      <span class="portrait-opt-thumb">
        <img src="${_pesc(o.url)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
        ${sel ? '<span class="portrait-opt-check" aria-hidden="true">&#10003;</span>' : ''}
      </span>
      <span class="portrait-opt-label">${_pesc(o.label)}${o.missing ? ' <em>Missing file</em>' : ''}</span>
    </label>`;
  }).join('');

  return `${note}<div class="portrait-picker" role="radiogroup" aria-label="Portrait for ${_pesc(who)} in ${_pesc(showName)}">${items}</div>`;
}

/** Paint the picker into the cast form for whoever is in it right now. */
export function renderPortraitPickerInto() {
  const host = document.getElementById('f-portrait-picker');
  if (!host) return;
  const name = (document.getElementById('f-name')?.value || '').trim();
  host.innerHTML = renderPortraitPicker(_formSlug(), _formPortrait.avatarId, seasonFormat(seasonConfig), name);
}

export function selectPortrait(id) {
  const opt = portraitOptions(_formSlug(), seasonFormat(seasonConfig)).find(o => o.id === id);
  if (!opt || opt.missing) return;
  _formPortrait = { avatarId: opt.id, avatarFile: opt.file };
  renderPortraitPickerInto();
  const live = document.getElementById('f-portrait-status');
  if (live) live.textContent = `Portrait set to ${opt.label}.`;
}


export function renderCast() {
  _repaintWhenCatalogKnown();
  const grid = document.getElementById('cast-grid');
  if (!players.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">&#128101;</div><p>No players yet. Add one or click <strong>S9 Cast</strong> / <strong>S10 Cast</strong>.</p></div>`;
    document.getElementById('cast-count').textContent='0';
    document.getElementById('cast-tribe-summary').textContent='';
    renderFranchiseHistoryPanel();
    try { window.renderCastRoom?.(); } catch {}   // Visual Casting Room (additive; legacy UI is the fallback)
    return;
  }
  const sorted = [...players].sort((a,b) => (a.tribe||'').localeCompare(b.tribe||'')||a.name.localeCompare(b.name));
  grid.innerHTML = sorted.map(renderCard).join('');
  document.getElementById('cast-count').textContent = players.length;
  const tribes={};
  players.forEach(p => { const t=p.tribe||'No Tribe'; tribes[t]=(tribes[t]||0)+1; });
  document.getElementById('cast-tribe-summary').textContent = '\u2014 '+Object.entries(tribes).map(([t,c])=>`${t} (${c})`).join(' \u00b7 ');
  renderFranchiseHistoryPanel();
  renderBackgroundPanel();
  window.renderHouseStructure?.();
  try { window.renderCastRoom?.(); } catch {}   // Visual Casting Room (additive; legacy UI is the fallback)
}
export function renderCard(p) {
  const ov=overall(p.stats), th=parseFloat(threat(p.stats)), tier=threatTier(th), tc=tribeColor(p.tribe);
  const ovPct=((ov-1)/9*100).toFixed(0), isEd=editingId===p.id;
  // The card shows the portrait this season CHOSE, not one derived from the
  // Returning checkbox. Which look is on screen is now a stated fact, so the
  // card can name it instead of leaving the viewer to compare two faces.
  const avatar=`<img src="${playerAvatarUrl(p)}" alt="${p.name}" onerror="this.remove()">`;
  const _show = seasonFormat(seasonConfig);
  const _chosen = portraitOptions(baseAvatarSlug(p), _show).find(o => o.id === p.avatarId);
  const portraitTag = _chosen && !_chosen.isGlobal ? _chosen.label : '';
  const statBars=STATS.map(s=>`<div class="sbar-row"><span class="sbar-key" style="color:${s.color}">${s.label}</span><div class="bar-bg"><div class="bar-fill" style="width:${p.stats[s.key]/10*100}%;background:${s.color}"></div></div><span class="sbar-val">${p.stats[s.key]}</span></div>`).join('');
  return `<div class="player-card ${isEd?'editing':''}" id="card-${p.id}">
    <div class="card-tribe-bar" style="background:${tc}"></div>
    <div class="card-top">
      <div class="card-avatar">${p.name[0].toUpperCase()}${avatar}</div>
      <div class="card-info">
        <div class="card-name" title="${p.name}">${p.name}</div>
        <div class="card-badges">
          ${p.tribe && seasonFormat(seasonConfig) !== 'big-brother'
            ? `<span class="tribe-badge" style="background:${tc}22;color:${tc}">${p.tribe}</span>` : ''}
          <span class="archetype-tag">${ARCHETYPE_NAMES[p.archetype]||'Custom'}</span>
          ${p.isReturnee ? '<span class="archetype-tag" style="background:rgba(245,158,11,0.15);color:#f59e0b">Returning</span>' : ''}
          ${p.isCoach ? '<span class="archetype-tag" title="Trains this tribe — never competes, never votes" style="background:rgba(59,130,246,0.15);color:#3b82f6">Coach</span>' : ''}
          ${p.backgroundType ? `<span class="archetype-tag" title="Background type — how the castle recognises this contestant" style="background:rgba(148,163,184,0.15);color:#94a3b8">${p.backgroundType[0].toUpperCase()}${p.backgroundType.slice(1)}</span>` : ''}
          ${portraitTag
    ? `<span class="archetype-tag" title="The portrait this season uses for ${p.name}" style="background:rgba(139,92,246,0.16);color:#a78bfa">${portraitTag}</span>`
    : ''}
        </div>
      </div>
    </div>
    <div class="overall-row"><span class="overall-label-sm">Overall</span><div class="bar-bg"><div class="bar-fill" style="width:${ovPct}%;background:linear-gradient(to right,#10b981,#3b82f6)"></div></div><span class="overall-val">${ov}</span></div>
    <div class="stat-bars">${statBars}</div>
    <div class="threat-row"><div class="threat-dot" style="background:${tier.color}"></div><span class="threat-text">Threat: ${tier.label} (${th})</span></div>
    <div class="card-actions"><button class="btn btn-secondary" onclick="editPlayer('${p.id}')">Edit</button></div>
  </div>`;
}

// ══════════════════════════════════════════════════════════════════════
// SEASON CONFIG
// ══════════════════════════════════════════════════════════════════════

export function buildAdvantageList() {
  // idol is handled by the Hidden Immunity Idol accordion above — only render other advantages here
  const advToList = ADVANTAGES.filter(a => a.key !== 'idol');
  document.getElementById('adv-list').innerHTML = advToList.map(a => {
    const hasSources = a.defaultSources && a.defaultSources.length > 0;
    const srcHtml = hasSources ? `<div id="adv-sources-${a.key}" class="adv-sources" style="display:${a.default>0?'flex':'none'};gap:4px;margin:2px 0 4px 24px;flex-wrap:wrap">
      ${Object.entries(ADV_SOURCE_LABELS).map(([src, lbl]) => `<label style="font-size:10px;color:var(--muted);display:flex;align-items:center;gap:2px;cursor:pointer;padding:1px 5px;border-radius:3px;border:1px solid var(--border);background:var(--surface2)">
        <input type="checkbox" id="adv-src-${a.key}-${src}" style="width:11px;height:11px" ${(a.defaultSources||[]).includes(src)?'checked':''} onchange="saveConfig()">
        <span>${lbl}</span>
      </label>`).join('')}
    </div>` : '';
    return `<div class="adv-row">
      <input type="checkbox" id="adv-${a.key}" class="adv-check" ${a.default>0?'checked':''} onchange="toggleAdv('${a.key}')">
      <span style="flex:1;font-size:13px;color:#e2e8f0;cursor:pointer" onclick="document.getElementById('adv-${a.key}').click()">${a.label}</span>
      <select id="adv-onceper-${a.key}" class="adv-onceper" style="font-size:10px;padding:1px 4px;background:var(--surface2);color:var(--muted);border:1px solid var(--border);border-radius:3px;margin-right:4px" ${a.default===0?'disabled':''} onchange="saveConfig()">
        <option value="">respawn</option>
        <option value="season">per season</option>
        <option value="phase">per phase</option>
      </select>
      <input type="number" id="adv-count-${a.key}" class="adv-count" min="0" max="9" value="${a.default}" ${a.default===0?'disabled':''} oninput="saveConfig()">
    </div>
    ${srcHtml}
    ${a.key === 'legacy' ? `<div id="legacy-settings" style="display:none;margin:4px 0 8px 24px">
      <label style="font-size:11px;color:#8b949e">Activates at</label>
      <select id="cfg-legacy-activates" class="form-select" style="font-size:11px;padding:2px 6px;width:auto;margin-left:6px" onchange="saveConfig()">
        <option value="6">Final 6</option>
        <option value="5" selected>Final 5</option>
        <option value="7">Final 7</option>
        <option value="13,6">Final 13 + Final 6</option>
      </select>
    </div>` : ''}`;
  }).join('');
}
export function toggleAdv(key) {
  const checked = document.getElementById('adv-'+key).checked;
  const countEl = document.getElementById('adv-count-'+key);
  countEl.disabled = !checked;
  if (!checked) countEl.value=0; else if (!parseInt(countEl.value)) countEl.value=1;
  const oncePerEl = document.getElementById('adv-onceper-'+key);
  if (oncePerEl) oncePerEl.disabled = !checked;
  // Show/hide source toggles
  const srcEl = document.getElementById('adv-sources-'+key);
  if (srcEl) srcEl.style.display = checked ? 'flex' : 'none';
  // Show/hide legacy-specific settings
  if (key === 'legacy') {
    const legSet = document.getElementById('legacy-settings');
    if (legSet) legSet.style.display = checked ? 'block' : 'none';
  }
  saveConfig();
}
export function onFinaleFormatChange() {
  const format = document.getElementById('cfg-finale-format')?.value;
  const slider = document.getElementById('cfg-finale');
  const display = document.getElementById('finale-display');
  const needsF4 = format === 'fire-making' || format === 'koh-lanta';
  const capsF3 = format === 'hawaiian-punch';
  if (needsF4) {
    if (slider) { slider.max = 4; slider.value = 4; slider.disabled = true; slider.style.opacity = '0.4'; }
    const label = format === 'koh-lanta' ? 'koh-lanta' : 'fire-making';
    if (display) display.textContent = `4 (locked — ${label})`;
  } else if (capsF3) {
    if (slider) { slider.max = 3; if (parseInt(slider.value) > 3) slider.value = 3; slider.disabled = false; slider.style.opacity = '1'; }
    if (display) display.textContent = `${slider?.value || '3'} (max 3 — hawaiian-punch)`;
  } else {
    if (slider) { slider.max = 4; slider.disabled = false; slider.style.opacity = '1'; }
    if (display) display.textContent = slider?.value || '3';
  }
  saveConfig();
}

export function toggleRI() {
  const on = document.getElementById('cfg-ri').checked;
  const _riEl = document.getElementById('ri-settings');
  _riEl.style.display = on ? 'flex' : 'none';
  _riEl.style.flexDirection = 'column';
  saveConfig();
}
export function toggleSID() { saveConfig(); }
// The "not connected yet" warning under the Show select. Called on load as well
// as on change: someone who picked Big Brother, reloaded, and saw a blank note
// would have no warning that Run is still going to simulate Total Drama.
export function updateFormatNote() {
  const note = document.getElementById('cfg-format-note');
  if (!note) return;
  const el = document.getElementById('cfg-format');
  const fmt = seasonFormat(el?.value);
  note.textContent = formatIsRunnable(fmt)
    ? ''
    : `The ${formatName(fmt)} engine is not connected to Run yet — the season will still simulate Total Drama.`;
}

/**
 * Every season twist's settings, read off the page in one pass.
 *
 * The twists describe their own controls (see `season` in
 * js/bb/twist-contract.js), so this walks that schema rather than naming keys.
 * Houseguest pickers write straight to `seasonConfig` when clicked and have no
 * input to read back, which is why they come from there rather than the DOM.
 */
function readSeasonTwistConfig(g) {
  const out = {};
  const list = typeof BB_SEASON_TWISTS !== 'undefined' ? BB_SEASON_TWISTS : [];
  for (const c of list) {
    const s = c.season;
    out[s.key] = g(`cfg-${s.key}`)?.value || 'off';
    for (const opt of s.options || []) {
      if (opt.type === 'number') {
        out[opt.key] = Number(g(`cfg-${opt.key}`)?.value) || (opt.default ?? 1);
      } else if (opt.type === 'select') {
        out[opt.key] = g(`cfg-${opt.key}`)?.value || opt.default || '';
      } else {
        out[opt.key] = seasonConfig[opt.key] || '';
      }
    }
  }
  return out;
}

/** Put a loaded config back on the page, and repaint the pickers. */
function applySeasonTwistConfig(set) {
  const list = typeof BB_SEASON_TWISTS !== 'undefined' ? BB_SEASON_TWISTS : [];
  // The panel is built from the contracts, so it has to exist before anything
  // can be set on it.
  if (typeof renderSeasonTwists === 'function') renderSeasonTwists();
  for (const c of list) {
    const s = c.season;
    set(`cfg-${s.key}`, seasonConfig[s.key] || 'off');
    for (const opt of s.options || []) {
      if (opt.type === 'number') set(`cfg-${opt.key}`, seasonConfig[opt.key] || opt.default || 1);
      if (opt.type === 'select') set(`cfg-${opt.key}`, seasonConfig[opt.key] || opt.default || '');
    }
    if (typeof updateSeasonTwistUI === 'function') updateSeasonTwistUI(c.id);
  }
}


/**
 * The Airs dropdown: every quarter from two years back to three ahead of the
 * newest season on the calendar, plus what Auto would pick — said in the
 * option itself, because a default nobody can see is a default nobody trusts.
 *
 * Fetched rather than hardcoded so the range follows the franchise instead of
 * the real-world date, and cached: renderConfig runs on every keystroke of the
 * setup form and the calendar does not change under it.
 */
let _airOptionsFilled = null;
async function _fillAirWindowOptions() {
  if (_airOptionsFilled) return _airOptionsFilled;
  _airOptionsFilled = (async () => {
    const el = document.getElementById('cfg-air-window');
    if (!el) return;
    let seasons = [];
    try {
      seasons = (await fetch('seasons_database.json').then(r => r.json())).seasons || [];
    } catch { /* no calendar, plain Auto */ }
    const { nextWindowFor, SLOTS, airKey } = await import('./franchise-calendar.js');
    const fmt = (typeof seasonFormat === 'function' && seasonFormat(seasonConfig)) || seasonConfig.format || 'total-drama';
    const auto = nextWindowFor(seasons, fmt);
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const latest = Math.max(2026, ...seasons.map(s => Number(s.airYear) || 0));
    const opts = [`<option value="auto">Auto — ${auto ? `${cap(auto.airSlot)} ${auto.airYear}` : 'continues the schedule'}</option>`];
    const taken = new Map(seasons.filter(s => airKey(s) != null)
      .map(s => [`${s.airYear}|${s.airSlot}`, s.title || s.seasonId]));
    for (let y = latest - 2; y <= latest + 3; y++) {
      for (const slot of SLOTS) {
        const v = `${y}|${slot}`;
        // A shared quarter is legal — two shows in one summer is the whole
        // reason the calendar is quarters — but it is worth saying out loud.
        opts.push(`<option value="${v}">${cap(slot)} ${y}${taken.has(v) ? ` — with ${taken.get(v)}` : ''}</option>`);
      }
    }
    const keep = el.value;
    el.innerHTML = opts.join('');
    if (keep && [...el.options].some(o => o.value === keep)) el.value = keep;
  })();
  return _airOptionsFilled;
}

/**
 * The murder shapes the castle is allowed to spring unasked, as checkboxes.
 *
 * Reported as "forbid them from randomly activating unless I checked them to
 * do it" — a Traitor being murdered by their own pact twice read as a bug,
 * and it was a twist that had simply come up in the weighted draw. Nothing is
 * ticked by default, so an unscheduled night is an ordinary murder.
 *
 * BUILT FROM TWIST_CATALOG, never from a list retyped here. This repo's
 * standing failure is the same show data written down in two places and
 * drifting (docs/ADDING-A-SHOW.md §13 exists for it), and a hard-coded six
 * would silently omit the seventh shape the day one is added.
 */
export function renderRandomMurderTwists() {
  const host = document.getElementById('cfg-tr-random-mv');
  if (!host) return;
  const on = new Set(seasonConfig.trRandomMurderTwists || []);
  const shapes = TWIST_CATALOG.filter(c => c.category === 'murder' && c.variant
    // A Recruitment is not a murder shape the pact chooses — it is the night
    // the pact spends making an offer instead, and it has its own rules about
    // when it may open. It stays schedulable and out of this list.
    && c.variant !== 'recruit');
  host.innerHTML = shapes.map(c =>
    '<label class="acc-check-row"><input type="checkbox" value="' + c.variant + '"'
    + (on.has(c.variant) ? ' checked' : '') + ' onchange="saveConfig()">'
    + '<span>' + (c.emoji || '') + ' ' + c.name + '</span></label>').join('');
}

export function saveConfig() {
  const g = id => document.getElementById(id);
  seasonConfig = {
    name:        g('cfg-name')?.value.trim() || '',
    seasonNumber: parseInt(g('cfg-season-number')?.value) || 0,
    days:        parseInt(g('cfg-days')?.value) || 39,
    // 'auto' (place chronologically at export, as always) or 'YYYY|slot'.
    airWindow:   g('cfg-air-window')?.value || 'auto',
    gameMode:    seasonConfig.gameMode || 'spectator',
    teams:       parseInt(g('cfg-teams')?.value) || 2,
    mergeAt:     parseInt(g('cfg-merge')?.value) || 12,
    finaleSize:  parseInt(g('cfg-finale')?.value) || 3,
    finaleFormat: g('cfg-finale-format')?.value || 'traditional',
    finaleAssistants: g('cfg-finale-assistants')?.checked || false,
    franchiseMeta: g('cfg-franchise-meta')?.checked !== false,
    franchiseMetaAutoRecord: g('cfg-franchise-meta-autorecord')?.checked !== false,
    jurySize:    parseInt(g('cfg-jury')?.value) || 9,
    // The castle's two, and the only two the engine reads. Clamped where
    // the engine clamps: `selectTraitors` refuses to make the whole cast a
    // Traitor, and a pot of nothing is a season with no reason to play it.
    traitorCount: Math.max(2, Math.min(5, parseInt(g('cfg-tr-traitor-count')?.value) || 3)),
    // 'random' or 'choose'; the chosen pact rides on seasonConfig and is read
    // back in populateConfig rather than off a DOM control, because it is a
    // portrait grid, not a field.
    trTraitorMode: g('cfg-tr-traitor-mode')?.value || 'random',
    trChosenTraitors: seasonConfig.trChosenTraitors || [],
    trAutoDouble: g('cfg-tr-auto-double') ? g('cfg-tr-auto-double').checked : true,
    trEndgameReveal: g('cfg-tr-endgame-reveal') ? g('cfg-tr-endgame-reveal').checked : false,
    trEndgameSize: parseInt(g('cfg-tr-endgame-size')?.value) || 3,
    trAutoRecruit: g('cfg-tr-auto-recruit') ? g('cfg-tr-auto-recruit').checked : true,
    trDensity: g('cfg-tr-density')?.value || TR_DENSITY_DEFAULT,
    trShieldSource: g('cfg-tr-shield-source')?.value || 'mission',
    // The murder shapes ticked as allowed to come up on their own. Read off
    // the boxes rather than off a list kept here, so a shape added to
    // TWIST_CATALOG appears in the UI and in the season with no second edit.
    trRandomMurderTwists: [...document.querySelectorAll('#cfg-tr-random-mv input:checked')]
      .map(b => b.value),
    trShieldEpisodes: Array.isArray(seasonConfig.trShieldEpisodes) ? seasonConfig.trShieldEpisodes : [],
    trArmourySize: parseInt(g('cfg-tr-armoury-size')?.value) || 4,
    trShieldCount: parseInt(g('cfg-tr-shield-count')?.value) || 1,
    trPotCeiling: Math.max(1000, parseInt(g('cfg-tr-pot')?.value) || 120000),
    // ── the main stage ──
    // The schedule and the judge weights are NOT read off the DOM: they are
    // written by the timeline and the judges panel, so they are carried
    // forward from the live config rather than reset to empty on every save.
    drPremiere:  g('cfg-dr-premiere')?.value || 'standard',
    drFinale:    g('cfg-dr-finale')?.value || 'top4',
    drDoubleShantay: g('cfg-dr-double-shantay') ? g('cfg-dr-double-shantay').checked : true,
    drDoubleSashay:  g('cfg-dr-double-sashay')?.checked || false,
    drImmunity:      g('cfg-dr-immunity')?.checked || false,
    drTripleLipsync: g('cfg-dr-triple')?.checked || false,
    drSchedule: Array.isArray(seasonConfig.drSchedule) ? seasonConfig.drSchedule : [],
    drJudgeWeights: seasonConfig.drJudgeWeights && typeof seasonConfig.drJudgeWeights === 'object'
      ? seasonConfig.drJudgeWeights : {},
    ri:          g('cfg-ri')?.checked || false,
    riReentryAt: parseInt(g('cfg-ri-reentry')?.value) || 12,
    riFormat:    g('cfg-ri-format')?.value || 'redemption',
    riReturnPoints: parseInt(g('cfg-ri-return-points')?.value) || 1,
    riReturnPerEvent: parseInt(g('cfg-ri-per-event')?.value) || 1,
    riSecondReturnAt: parseInt(g('cfg-ri-second-return')?.value) || 5,
    journey:     g('cfg-journey')?.checked || false,
    exile:       g('cfg-exile')?.checked || false,
    exilePhase:  g('cfg-exile-phase')?.value || 'both',
    shotInDark:  g('cfg-sid')?.checked || false,
    blackVote:   g('cfg-black-vote')?.value || 'off',
    firemaking:  (g('cfg-finale-format')?.value === 'fire-making') || false,
    tiebreakerMode: g('cfg-tiebreaker-mode')?.value || 'survivor',
    qem:         g('cfg-qem')?.checked || false,
    idolRehide:  g('cfg-idol-rehide')?.checked || false,
    idolsPerTribe: parseInt(g('cfg-idols-per-tribe')?.value) || 1,
    idolsAtMerge: parseInt(g('cfg-idols-at-merge')?.value) ?? 1,
    advExpire:   parseInt(g('cfg-adv-expire')?.value) || 4,
    foodWater:   g('cfg-food-water')?.value || 'disabled',
    survivalDifficulty: g('cfg-survival-difficulty')?.value || 'casual',
    aftermath:   g('cfg-aftermath')?.value || 'disabled',
    fanVoteFrequency: g('cfg-fan-vote-frequency')?.value || 'disabled',
    aftermayhemReturn: g('cfg-aftermayhem-return')?.value || 'disabled',
    mole:        g('cfg-mole')?.value || 'disabled',
    molePlayers: seasonConfig.molePlayers || [],
    moleCoordination: g('cfg-mole-coordination')?.value || 'independent',
    coaches:     g('cfg-coaches')?.value || 'disabled',
    coachesPerTribe: parseInt(g('cfg-coaches-per-tribe')?.value) || 1,
    // What a coach may find, and from where. Separate from `advantages` above:
    // that governs contestants, and a coach is not one.
    coachAdvantages: Object.fromEntries(ADVANTAGES.map(a => {
      const enabled = !!g('coach-adv-' + a.key)?.checked;
      const sources = Object.keys(ADV_SOURCE_LABELS).filter(src => g('coach-adv-src-' + a.key + '-' + src)?.checked);
      return [a.key, { enabled, sources: sources.length ? sources : ['camp'] }];
    })),
    romance:     g('cfg-romance')?.value || 'enabled',
    autoRewardChallenges: g('cfg-auto-reward')?.checked ?? false,
    replacementOnMedevac: g('cfg-replacement')?.checked ?? false,
    rewardSharing: g('cfg-reward-sharing')?.checked ?? false,
    // Which show this season is. seasonConfig is rebuilt from the DOM here, so
    // a format with no control on the page would be silently dropped on save.
    format:      seasonFormat(g('cfg-format')?.value),
    host:        g('cfg-host')?.value || 'Chris',
    setting:     g('cfg-setting')?.value || 'hosted-camp',
    theme:       g('cfg-theme')?.value || 'none',
    // House options. Read only by the Big Brother engine; harmless defaults on
    // a Total Drama season, which never looks at them.
    bbEvictionInterview: g('cfg-bb-interview')?.value || 'enabled',
    bbHostStyle: g('cfg-bb-host-style')?.value || 'balanced',
    bbHaveNots:  g('cfg-bb-havenots')?.value || 'twist',
    bbSafetyMode: g('cfg-bb-safety')?.value || 'off',
    // Which stats this season's competitions should ask for. See BB_COMP_MIXES.
    // Set from the timeline's Competition Randomizer rather than from a control
    // here, so the value already on the season has to SURVIVE a save — reading
    // a missing element and defaulting would quietly reset the mix to balanced
    // every time anything else on this panel changed.
    bbCompMix:   g('cfg-bb-comp-mix')?.value || seasonConfig.bbCompMix || 'balanced',
    // Off unless explicitly switched on: the one setting here that costs
    // money every time a season is played.
    socialWriter: !!document.getElementById('cfg-social-writer')?.checked,
    // Season twists own their own keys — see `season` in
    // js/bb/twist-contract.js. Read generically so a new one is a contract
    // entry and not three more lines here, three in the load path and a slab
    // of hand-written HTML.
    ...readSeasonTwistConfig(g),
    bbSafetyStopsAt: parseInt(g('cfg-bb-safety-stops')?.value) || 9,
    bbHaveNotCount: g('cfg-bb-havenot-count')?.value || 'auto',
    bbDepartures: g('cfg-bb-departures')?.value || 'off',
    qemRate:     g('cfg-qem-rate')?.value || 'rare',
    advantages: Object.fromEntries(ADVANTAGES.map(a => {
      if (a.key === 'idol') {
        const en = g('adv-idol-enabled');
        const _ipt = parseInt(g('cfg-idols-per-tribe')?.value) || 1;
        const _numTribes = parseInt(g('cfg-teams')?.value) || 2;
        const _iam = parseInt(g('cfg-idols-at-merge')?.value) ?? 1;
        return [a.key, { enabled: en ? en.checked : false, count: _ipt * _numTribes + _iam }];
      }
      const en = g('adv-' + a.key), ct = g('adv-count-' + a.key), op = g('adv-onceper-' + a.key);
      const sources = Object.keys(ADV_SOURCE_LABELS).filter(src => g('adv-src-' + a.key + '-' + src)?.checked);
      return [a.key, { enabled: en ? en.checked : false, count: ct ? parseInt(ct.value)||0 : 0, oncePer: op?.value || '', sources }];
    })),
    legacyActivatesAt: (g('cfg-legacy-activates')?.value || '5').split(',').map(Number),
    twistSchedule: seasonConfig.twistSchedule || [],
    tribes: seasonConfig.tribes || [],
    popularityEnabled: g('cfg-popularity')?.checked ?? true,
    hidePopularity: g('cfg-hide-popularity')?.checked ?? false,
  };
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  // Disable fan-vote finale option when popularity is off
  const _fvOpt = document.querySelector('#cfg-finale-format option[value="fan-vote"]');
  if (_fvOpt) {
    const _popOn = g('cfg-popularity')?.checked;
    _fvOpt.disabled = !_popOn;
    _fvOpt.textContent = _popOn ? 'Fan Vote Finale' : 'Fan Vote Finale (requires popularity)';
    // If fan-vote was selected but popularity just got disabled, reset to traditional
    if (!_popOn && seasonConfig.finaleFormat === 'fan-vote') {
      seasonConfig.finaleFormat = 'traditional';
      const _fmSel = g('cfg-finale-format');
      if (_fmSel) _fmSel.value = 'traditional';
    }
  }
  const _riSecGrp = g('ri-second-return-group');
  if (_riSecGrp) _riSecGrp.style.display = (seasonConfig.ri && seasonConfig.riReturnPoints >= 2) ? 'block' : 'none';
  // "Returnees per return" only applies to Rescue Island (top-N rejoin). Redemption
  // duels always return exactly 1 winner, so hide the choice for that format.
  const _riPerGrp = g('ri-per-event-group');
  if (_riPerGrp) _riPerGrp.style.display = (seasonConfig.ri && seasonConfig.riFormat === 'rescue') ? 'block' : 'none';
  // The house season shape is derived from jury size, cast size and the twist
  // schedule, so it is redrawn whenever any of them is written.
  window.renderHouseStructure?.();
}
export function renderConfig() {
  const g = id => document.getElementById(id);
  const set = (id, val) => { const el = g(id); if (el) el.value = val; };
  const chk = (id, val) => { const el = g(id); if (el) el.checked = val; };
  set('cfg-name',    seasonConfig.name || '');
  set('cfg-season-number', seasonConfig.seasonNumber || '');
  set('cfg-days',    seasonConfig.days || 39);
  _fillAirWindowOptions().then(() => set('cfg-air-window', seasonConfig.airWindow || 'auto'));
  set('cfg-teams',   seasonConfig.teams || 2);
  set('cfg-merge',   seasonConfig.mergeAt);
  set('cfg-finale',  seasonConfig.finaleSize);
  set('cfg-finale-format', seasonConfig.finaleFormat || 'traditional');
  if (g('cfg-finale-assistants')) g('cfg-finale-assistants').checked = !!seasonConfig.finaleAssistants;
  if (g('cfg-franchise-meta')) g('cfg-franchise-meta').checked = seasonConfig.franchiseMeta !== false;
  if (g('cfg-franchise-meta-autorecord')) g('cfg-franchise-meta-autorecord').checked = seasonConfig.franchiseMetaAutoRecord !== false;
  set('cfg-jury',    seasonConfig.jurySize || 9);
  set('cfg-tr-traitor-count', seasonConfig.traitorCount || 3);
  set('cfg-tr-traitor-mode', seasonConfig.trTraitorMode || 'random');
  if (g('cfg-tr-auto-double')) g('cfg-tr-auto-double').checked = seasonConfig.trAutoDouble !== false;
  if (g('cfg-tr-endgame-reveal')) g('cfg-tr-endgame-reveal').checked = seasonConfig.trEndgameReveal === true;
  set('cfg-tr-endgame-size', seasonConfig.trEndgameSize || 3);
  if (g('cfg-tr-auto-recruit')) g('cfg-tr-auto-recruit').checked = seasonConfig.trAutoRecruit !== false;
  try { updateDensityUI(); } catch (e) {}
  set('cfg-tr-density', seasonConfig.trDensity || TR_DENSITY_DEFAULT);
  try { updateDensityUI(); } catch (e) {}
  set('cfg-tr-shield-source', seasonConfig.trShieldSource || 'mission');
  renderRandomMurderTwists();
  set('cfg-tr-armoury-size', seasonConfig.trArmourySize || 4);
  set('cfg-tr-shield-count', seasonConfig.trShieldCount || 1);
  try { updateShieldUI(); } catch (e) {}
  set('cfg-tr-pot', seasonConfig.trPotCeiling || 120000);
  if (typeof window.updateTraitorPickerUI === 'function') window.updateTraitorPickerUI();
  set('cfg-dr-premiere', seasonConfig.drPremiere || 'standard');
  set('cfg-dr-finale', seasonConfig.drFinale || 'top4');
  // Defaults ON, so the read has to be an explicit !== false rather than a
  // truthiness test: an unset value here means "allowed", not "off".
  if (g('cfg-dr-double-shantay')) g('cfg-dr-double-shantay').checked = seasonConfig.drDoubleShantay !== false;
  chk('cfg-dr-double-sashay', seasonConfig.drDoubleSashay || false);
  chk('cfg-dr-immunity', seasonConfig.drImmunity || false);
  chk('cfg-dr-triple', seasonConfig.drTripleLipsync || false);
  chk('cfg-ri',        seasonConfig.ri);
  set('cfg-ri-reentry', seasonConfig.riReentryAt);
  set('cfg-ri-format', seasonConfig.riFormat || 'redemption');
  set('cfg-ri-return-points', seasonConfig.riReturnPoints || 1);
  set('cfg-ri-per-event', seasonConfig.riReturnPerEvent || 1);
  set('cfg-ri-second-return', seasonConfig.riSecondReturnAt || 5);
  if (g('ri-settings')) g('ri-settings').style.display = seasonConfig.ri ? 'flex' : 'none';
  const _riSecGrp = g('ri-second-return-group');
  if (_riSecGrp) _riSecGrp.style.display = (seasonConfig.ri && seasonConfig.riReturnPoints >= 2) ? 'block' : 'none';
  const _riPerGrp = g('ri-per-event-group');
  if (_riPerGrp) _riPerGrp.style.display = (seasonConfig.ri && seasonConfig.riFormat === 'rescue') ? 'block' : 'none';
  chk('cfg-journey',   seasonConfig.journey || false);
  chk('cfg-exile', seasonConfig.exile || false);
  set('cfg-exile-phase', seasonConfig.exilePhase || 'both');
  const _exilePhaseRow = g('exile-phase-row');
  if (_exilePhaseRow) _exilePhaseRow.style.display = seasonConfig.exile ? '' : 'none';
  chk('cfg-sid',       seasonConfig.shotInDark || false);
  set('cfg-black-vote', seasonConfig.blackVote || 'off');
  // Apply finaleFormat lock on render (fire-making and koh-lanta force F4; hawaiian-punch caps at F3)
  const _fmFormat = seasonConfig.finaleFormat;
  const _needsF4 = _fmFormat === 'fire-making' || _fmFormat === 'koh-lanta';
  const _capsF3 = _fmFormat === 'hawaiian-punch';
  const _fmSlider = g('cfg-finale');
  const _fmDisplay = document.getElementById('finale-display');
  if (_needsF4) {
    if (_fmSlider) { _fmSlider.max = 4; _fmSlider.value = 4; _fmSlider.disabled = true; _fmSlider.style.opacity = '0.4'; }
    if (_fmDisplay) _fmDisplay.textContent = `4 (locked — ${_fmFormat})`;
  } else if (_capsF3) {
    if (_fmSlider) { _fmSlider.max = 3; if (parseInt(_fmSlider.value) > 3) _fmSlider.value = 3; _fmSlider.disabled = false; _fmSlider.style.opacity = '1'; }
    if (_fmDisplay) _fmDisplay.textContent = `${_fmSlider?.value || '3'} (max 3 — hawaiian-punch)`;
  } else {
    if (_fmSlider) { _fmSlider.max = 4; _fmSlider.disabled = false; _fmSlider.style.opacity = '1'; }
  }
  set('cfg-tiebreaker-mode', seasonConfig.tiebreakerMode || 'survivor');
  chk('cfg-qem',        seasonConfig.qem || false);
  set('cfg-qem-rate',   seasonConfig.qemRate || 'rare');
  chk('cfg-popularity', seasonConfig.popularityEnabled ?? true);
  chk('cfg-hide-popularity', seasonConfig.hidePopularity ?? false);
  // Show/hide the hide-popularity row based on popularity being enabled
  const _hpRow = g('hide-pop-row');
  if (_hpRow) _hpRow.style.display = (seasonConfig.popularityEnabled ?? true) ? '' : 'none';
  chk('cfg-idol-rehide', seasonConfig.idolRehide || false);
  set('cfg-idols-per-tribe', seasonConfig.idolsPerTribe || 1);
  set('cfg-idols-at-merge', seasonConfig.idolsAtMerge ?? 1);
  set('cfg-adv-expire',  seasonConfig.advExpire ?? 4);
  set('cfg-food-water',  seasonConfig.foodWater || 'disabled');
  set('cfg-survival-difficulty', seasonConfig.survivalDifficulty || 'casual');
  // Show/hide survival sub-options based on food/water being enabled
  const _fwOn = (seasonConfig.foodWater || 'disabled') === 'enabled';
  chk('cfg-auto-reward', seasonConfig.autoRewardChallenges ?? false);
  const _arRow = g('auto-reward-row');
  const _arDesc = g('auto-reward-desc');
  if (_arRow) _arRow.style.display = _fwOn ? '' : 'none';
  if (_arDesc) _arDesc.style.display = _fwOn ? '' : 'none';
  chk('cfg-replacement', seasonConfig.replacementOnMedevac ?? false);
  const _repRow = g('replacement-row');
  const _repDesc = g('replacement-desc');
  if (_repRow) _repRow.style.display = _fwOn ? '' : 'none';
  if (_repDesc) _repDesc.style.display = _fwOn ? '' : 'none';
  chk('cfg-reward-sharing', seasonConfig.rewardSharing ?? false);
  const _rsRow = g('reward-sharing-row');
  const _rsDesc = g('reward-sharing-desc');
  if (_rsRow) _rsRow.style.display = _fwOn ? '' : 'none';
  if (_rsDesc) _rsDesc.style.display = _fwOn ? '' : 'none';
  set('cfg-format', seasonFormat(seasonConfig));
  updateFormatNote();
  window.renderHostOptions?.();
  set('cfg-host', seasonConfig.host || (seasonFormat(seasonConfig) === 'big-brother' ? 'Don' : 'Chris'));
  // The venue list belongs to the show, so it is rebuilt before the value is
  // written back — otherwise a house season is handed a camp.
  window.renderSettingOptions?.();
  set('cfg-setting', seasonConfig.setting || 'hosted-camp');
  set('cfg-theme', seasonConfig.theme || 'none');
  // Themes belong to the house. A beach season offering "Summer of Temptation"
  // is a question with no correct answer, the same reason the venue list is
  // scoped by format. (applyFormatScope() below scopes `cfg-theme` too, which is
  // what catches a format switched live rather than restored; this covers the
  // restore path on its own terms.)
  const _themeGroup = g('theme-group');
  if (_themeGroup) _themeGroup.style.display = seasonConfig.format === 'big-brother' ? '' : 'none';
  set('cfg-bb-interview', seasonConfig.bbEvictionInterview || 'enabled');
  set('cfg-bb-host-style', seasonConfig.bbHostStyle || 'balanced');
  set('cfg-bb-havenots', seasonConfig.bbHaveNots || 'twist');
  set('cfg-bb-safety', seasonConfig.bbSafetyMode || 'off');
  { const w = document.getElementById('cfg-social-writer');
    if (w) w.checked = seasonConfig.socialWriter === true; }
  applySeasonTwistConfig(set);
  set('cfg-bb-safety-stops', seasonConfig.bbSafetyStopsAt || 9);
  set('cfg-bb-havenot-count', seasonConfig.bbHaveNotCount || 'auto');
  set('cfg-bb-departures', seasonConfig.bbDepartures || 'off');
  // Show only the controls this show's engine actually reads.
  window.applyFormatScope?.();
  // Aftermath
  set('cfg-aftermath', seasonConfig.aftermath || 'disabled');
  set('cfg-fan-vote-frequency', seasonConfig.fanVoteFrequency || 'disabled');
  set('cfg-aftermayhem-return', seasonConfig.aftermayhemReturn || 'disabled');
  // The Mole
  set('cfg-mole', seasonConfig.mole || 'disabled');
  set('cfg-mole-coordination', seasonConfig.moleCoordination || 'independent');
  updateMoleUI();
  // Coaches — season-long system, configured like the Mole (see
  // docs/superpowers/specs/2026-08-26-coaches-twist-design.md)
  set('cfg-coaches', seasonConfig.coaches || 'disabled');
  set('cfg-coaches-per-tribe', seasonConfig.coachesPerTribe || 1);
  // Drawn after the mode is set, so the list reflects the saved season.
  if (typeof buildCoachAdvantageList === 'function') buildCoachAdvantageList();
  updateCoachesUI();
  // Romance
  set('cfg-romance', seasonConfig.romance || 'enabled');
  // Sync slider displays
  ['teams','merge','finale','jury','adv-expire'].forEach(name => updateSlider(name));
  renderTribeBuilder(); renderTribeSelect();
  // Hidden Immunity Idol
  const idolAdv = seasonConfig.advantages?.idol;
  if (idolAdv) {
    chk('adv-idol-enabled', idolAdv.enabled);
  }
  // Other advantages in adv-list
  ADVANTAGES.filter(a => a.key !== 'idol').forEach(a => {
    const adv = seasonConfig.advantages?.[a.key]; if (!adv) return;
    const en = g('adv-'+a.key), ct = g('adv-count-'+a.key);
    if (en) en.checked = adv.enabled;
    if (ct) { ct.value = adv.count; ct.disabled = !adv.enabled; }
    const op = g('adv-onceper-'+a.key);
    if (op) { op.value = adv.oncePer || ''; op.disabled = !adv.enabled; }
    // Source toggles
    const srcEl = g('adv-sources-'+a.key);
    if (srcEl) srcEl.style.display = adv.enabled ? 'flex' : 'none';
    const sources = adv.sources || a.defaultSources || [];
    Object.keys(ADV_SOURCE_LABELS).forEach(src => {
      const cb = g('adv-src-' + a.key + '-' + src);
      if (cb) cb.checked = sources.includes(src);
    });
  });
  // Legacy settings
  const legSet = g('legacy-settings');
  const legSel = g('cfg-legacy-activates');
  if (legSet && legSel) {
    legSet.style.display = seasonConfig.advantages?.legacy?.enabled ? 'block' : 'none';
    legSel.value = (seasonConfig.legacyActivatesAt || [5]).join(',');
  }
  renderTimeline();
  updateSurvivalDesc();
}
export function loadS10Config() {
  seasonConfig = {
    name:'Champions vs Contenders', year:'', days:39, gameMode:'spectator',
    teams:2, mergeAt:12, finaleSize:3, finaleFormat:'fire-making', jurySize:9,
    ri:true, riReentryAt:14, riFormat:'redemption', riReturnPoints:1, riSecondReturnAt:5, journey:true, shotInDark:false,
    firemaking:true, qem:false, idolRehide:false,
    advExpire:4, foodWater:'disabled', survivalDifficulty:'casual',
    advantages: { idol:{enabled:true,count:2}, voteSteal:{enabled:true,count:1}, extraVote:{enabled:true,count:1}, kip:{enabled:false,count:0}, legacy:{enabled:false,count:0}, amulet:{enabled:false,count:0} },
    twistSchedule: [{ id:'s10-swap', episode:5, type:'tribe-swap' }],
    tribes: [{ name:'Champions', color:'#f59e0b' }, { name:'Contenders', color:'#ef4444' }],
  };
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig)); renderConfig();
}
export function loadDC4Config() {
  seasonConfig = {
    name:'Disventure Camp 4: Carnival of Chaos', year:'', days:52, gameMode:'spectator',
    teams:2, mergeAt:12, finaleSize:2, finaleFormat:'jury-cut', jurySize:9,
    ri:true, riReentryAt:10, riFormat:'redemption', riReturnPoints:1, riSecondReturnAt:5, journey:false, shotInDark:false,
    firemaking:false, qem:false, idolRehide:false,
    tiebreakerMode:'challenge',
    advExpire:4, foodWater:'disabled', survivalDifficulty:'casual',
    advantages: { idol:{enabled:true,count:2}, voteSteal:{enabled:true,count:1}, extraVote:{enabled:true,count:1}, kip:{enabled:false,count:0}, legacy:{enabled:false,count:0}, amulet:{enabled:false,count:0}, beware:{enabled:false,count:0} },
    twistSchedule: [
      { id:'dc4-gifts',  episode:1,  type:'three-gifts'      },
      { id:'dc4-swap',   episode:6,  type:'elimination-swap' },
      { id:'dc4-exile',  episode:9,  type:'exile-duel'       },
      { id:'dc4-auction',episode:17, type:'auction'          },
    ],
  };
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig)); renderConfig();
}
export function loadS9Config() {
  seasonConfig = {
    name:'Total Drama: Land of Powers', year:'', days:39, gameMode:'spectator',
    teams:3, mergeAt:11, finaleSize:3, finaleFormat:'fire-making', jurySize:9,
    ri:false, riReentryAt:11, riFormat:'redemption', riReturnPoints:1, riSecondReturnAt:5, journey:true, shotInDark:true,
    firemaking:true, qem:false, idolRehide:false,
    advExpire:4, foodWater:'disabled', survivalDifficulty:'casual',
    advantages: { idol:{enabled:true,count:2}, voteSteal:{enabled:false,count:0}, extraVote:{enabled:true,count:1}, kip:{enabled:true,count:1}, legacy:{enabled:false,count:0}, amulet:{enabled:false,count:0} },
    twistSchedule: [
      { id:'s9-swap', episode:5,  type:'tribe-swap'  },
      { id:'s9-fire', episode:15, type:'fire-making' },
    ],
    tribes: [{ name:'Yellow', color:'#f59e0b' }, { name:'Red', color:'#ef4444' }, { name:'Blue', color:'#3b82f6' }],
  };
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig)); renderConfig();
}

// ══════════════════════════════════════════════════════════════════════
// RELATIONSHIPS
// ══════════════════════════════════════════════════════════════════════


export function saveRels() { localStorage.setItem('simulator_rels', JSON.stringify(relationships)); }
export function populateRelDropdowns() {
  const names = players.map(p=>p.name).sort();
  const opts  = names.map(n=>`<option value="${n}">${n}</option>`).join('');
  document.getElementById('rel-a').innerHTML = opts;
  document.getElementById('rel-b').innerHTML = opts;
  buildKinshipSelect();
  updateRelAvatars();
}

/**
 * The kinship picker, built from REL_KINSHIP rather than typed twice.
 *
 * It was a hand-written <select> in simulator.html, which is fine until the
 * constant grows — and the moment it did, the twists that CAST off this axis
 * (Dynamic Duos needs declared pairs, Rivals needs history, the Twin Twist
 * needs a declared twin) could read relations the page gave nobody a way to
 * set. Grouped, because "Family" and "History" are the two halves that decide
 * which twists a cast can run.
 */
export function buildKinshipSelect() {
  const sel = document.getElementById('rel-kin');
  if (!sel || typeof REL_KINSHIP === 'undefined') return;
  const keep = sel.value;
  const groups = new Map();
  let none = '';
  for (const [key, def] of Object.entries(REL_KINSHIP)) {
    const opt = `<option value="${key}">${def.label}</option>`;
    if (!def.group) { none += opt; continue; }
    if (!groups.has(def.group)) groups.set(def.group, []);
    groups.get(def.group).push(opt);
  }
  sel.innerHTML = none + [...groups.entries()]
    .map(([g, list]) => `<optgroup label="${g}">${list.join('')}</optgroup>`).join('');
  if (keep && REL_KINSHIP[keep]) sel.value = keep;
}
export function updateRelAvatars() {
  const a = document.getElementById('rel-a')?.value;
  const b = document.getElementById('rel-b')?.value;
  const aEl = document.getElementById('rel-a-avatar');
  const bEl = document.getElementById('rel-b-avatar');
  if (aEl && a) aEl.innerHTML = miniAvatar(a, 32);
  if (bEl && b) bEl.innerHTML = miniAvatar(b, 32);
  updateRelLeanLabels();
}

/**
 * The two private-feeling sliders, said in words.
 *
 * A number between -10 and 10 is not a thing anybody can author with. What the
 * user is actually deciding is "is this person warmer or colder about this than
 * the relationship is", so the label says that, with their name on it.
 */
export function updateRelLeanLabels() {
  const a = document.getElementById('rel-a')?.value || 'A';
  const b = document.getElementById('rel-b')?.value || 'B';
  const word = v => (v >= 7 ? 'far warmer about it' : v >= 3 ? 'warmer about it'
    : v > 0 ? 'a little warmer' : v === 0 ? 'feels what it says'
      : v > -3 ? 'a little colder' : v > -7 ? 'colder about it' : 'far colder about it');
  for (const [id, name] of [['a', a], ['b', b]]) {
    const slider = document.getElementById(`rel-lean-${id}`);
    const label = document.getElementById(`rel-lean-${id}-label`);
    if (!slider || !label) continue;
    const v = Number(slider.value) || 0;
    label.textContent = `${name} — ${word(v)}`;
  }
}
export function openRelForm(id) {
  editingRelId = id; const form = document.getElementById('rel-form'); form.style.display='flex';
  populateRelDropdowns();
  if (id) {
    const r = relationships.find(r=>r.id===id); if(!r) return;
    document.getElementById('rel-a').value = r.a; document.getElementById('rel-b').value = r.b;
    document.getElementById('rel-note').value = r.note||'';
    { const k=document.getElementById('rel-kin'); if(k) k.value = r.kin || 'none'; }
    { const la=document.getElementById('rel-lean-a'); if(la) la.value = Number(r.leanA)||0; }
    { const lb=document.getElementById('rel-lean-b'); if(lb) lb.value = Number(r.leanB)||0; }
    if (typeof updateRelLeanLabels === 'function') updateRelLeanLabels();
    setRelType(r.type);
    document.getElementById('rel-form-title').textContent = 'Edit Relationship';
    document.getElementById('rel-submit-btn').textContent = 'Update';
  } else {
    document.getElementById('rel-note').value='';
    { const k=document.getElementById('rel-kin'); if(k) k.value='none'; }
    { const la=document.getElementById('rel-lean-a'); if(la) la.value=0; }
    { const lb=document.getElementById('rel-lean-b'); if(lb) lb.value=0; }
    if (typeof updateRelLeanLabels === 'function') updateRelLeanLabels();
    setRelType('neutral');
    document.getElementById('rel-form-title').textContent = 'Add Relationship';
    document.getElementById('rel-submit-btn').textContent = 'Add';
  }
  form.scrollIntoView({behavior:'smooth',block:'nearest'});
}
export function closeRelForm() { editingRelId=null; document.getElementById('rel-form').style.display='none'; }
export function setRelType(type) {
  activeRelType = type;
  document.querySelectorAll('#type-seg .type-btn').forEach(btn => {
    const t=btn.dataset.type, rt=REL_TYPES[t];
    if (!rt) return;
    btn.classList.toggle('active', t===type);
    btn.style.background = t===type ? rt.color : '';
    btn.style.borderColor = t===type ? rt.color : '';
  });
}
export function submitRel() {
  const a=document.getElementById('rel-a').value, b=document.getElementById('rel-b').value;
  if (!a||!b) { alert('Select two players.'); return; }
  if (a===b) { alert('Select two different players.'); return; }
  const key=[a,b].sort().join('|');
  const dup = relationships.find(r => { if(editingRelId&&r.id===editingRelId) return false; return [r.a,r.b].sort().join('|')===key; });
  if (dup) { alert(`A relationship between ${a} and ${b} already exists.`); return; }
  // `type` is how they feel about each other; `kin` is how they know each
  // other. Two axes, because a pair can be siblings and nemeses at once.
  const rel = { id: editingRelId||Date.now().toString(36)+Math.random().toString(36).slice(2,4), a, b,
    type: activeRelType, bond: REL_TYPES[activeRelType]?.bond??0,
    kin: document.getElementById('rel-kin')?.value || 'none',
    // What each of them privately makes of it, on top of the shared bond.
    leanA: Number(document.getElementById('rel-lean-a')?.value) || 0,
    leanB: Number(document.getElementById('rel-lean-b')?.value) || 0,
    note: document.getElementById('rel-note').value.trim() };
  if (editingRelId) { const i=relationships.findIndex(r=>r.id===editingRelId); if(i!==-1) relationships[i]=rel; }
  else relationships.push(rel);
  saveRels(); closeRelForm(); renderRelList();
}
export function deleteRel(id) { relationships=relationships.filter(r=>r.id!==id); saveRels(); renderRelList(); }
export function clearRelationships() { if(!confirm('Clear all relationships?')) return; relationships=[]; saveRels(); closeRelForm(); renderRelList(); }
export function loadS10Bonds() {
  if (relationships.length>0&&!confirm('Replace current relationships with S10 pre-game bonds?')) return;
  relationships = S10_BONDS_PRESET.map((b,i) => ({...b, id:'s10-bond-'+i, bond:REL_TYPES[b.type]?.bond??0}));
  saveRels(); renderRelList();
}
export function loadS9Bonds() {
  if (!confirm('S9 is an all-newbie cast — no pre-game bonds. Clear existing relationships?')) return;
  relationships = [];
  saveRels(); renderRelList();
}
export function renderRelList() {
  const list = document.getElementById('rel-list');
  if (!relationships.length) { list.innerHTML=`<div class="rel-empty">No relationships defined.<br>Click <strong>+ Add</strong> or load <strong>S9/S10 Bonds</strong> preset.</div>`; return; }
  const sorted = [...relationships].sort((a,b) => { if(a.type==='unbreakable'&&b.type!=='unbreakable') return -1; if(b.type==='unbreakable'&&a.type!=='unbreakable') return 1; return Math.abs(b.bond)-Math.abs(a.bond); });
  list.innerHTML = sorted.map(r => { const rt=REL_TYPES[r.type]||REL_TYPES.neutral; return `<div class="rel-card"><div class="rel-players"><div style="display:flex;align-items:center;gap:6px">${miniAvatar(r.a)}<span style="font-size:12px;font-weight:600">${r.a}</span><span class="rel-arrow">\u2194</span>${miniAvatar(r.b)}<span style="font-size:12px;font-weight:600">${r.b}</span></div>${r.note?`<div class="rel-note" title="${r.note}">${r.note}</div>`:''}</div>${
    r.kin && r.kin!=='none' && REL_KINSHIP[r.kin]
      ? `<span class="rel-badge" style="background:rgba(163,113,247,0.14);color:#a371f7">${REL_KINSHIP[r.kin].label}</span>`
      : ''}<span class="rel-badge" style="background:${rt.bg};color:${rt.color}">${rt.label}</span><div class="rel-actions"><button class="btn btn-secondary btn-sm" onclick="openRelForm('${r.id}')">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteRel('${r.id}')">\u2715</button></div></div>`; }).join('');
}

// ══════════════════════════════════════════════════════════════════════
// PRE-GAME ALLIANCES
// ══════════════════════════════════════════════════════════════════════

// preGameAlliances, editingAllianceId, alliancePerm — now in js/core.js (accessed via window)
export const _alliancePermDesc = { permanent:'Permanent — cannot dissolve. Members stay loyal no matter what.', normal:'Normal — can dissolve through betrayals or low bonds.', fragile:'Fragile — dissolves easily. Low tolerance for betrayal or bond decay.' };

export function savePreAlliances() { localStorage.setItem('simulator_prealliances', JSON.stringify(preGameAlliances)); }

export function openAllianceForm(id) {
  // No limit on number of alliances — useful for Blood vs Water seasons
  editingAllianceId = id;
  const form = document.getElementById('alliance-form'); form.style.display = 'flex';
  // Build member toggle grid
  const grid = document.getElementById('alliance-member-grid');
  const names = players.map(p => p.name).sort();
  const existing = id ? preGameAlliances.find(a => a.id === id) : null;
  const selected = new Set(existing?.members || []);
  grid.innerHTML = names.map(n => {
    const src = playerAvatarUrl(n);
    const init = (n||'?')[0].toUpperCase();
    const sel = selected.has(n);
    return `<div data-member="${n}" data-selected="${sel}" onclick="toggleAllianceMember(this)" style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;width:48px">
      <div style="width:36px;height:36px;border-radius:50%;border:3px solid ${sel ? '#10b981' : 'transparent'};overflow:hidden;position:relative;background:var(--surface2);transition:border-color 0.15s">
        <img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;${sel ? '' : 'filter:grayscale(0.5);opacity:0.6;'}transition:filter 0.15s,opacity 0.15s" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
        <span style="display:none;font-size:14px;font-weight:700;color:var(--muted);align-items:center;justify-content:center;width:100%;height:100%;position:absolute;top:0;left:0">${init}</span>
      </div>
      <span style="font-size:9px;color:${sel ? '#10b981' : 'var(--muted)'};text-align:center;line-height:1.1;max-width:48px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color 0.15s">${n}</span>
    </div>`;
  }).join('');
  if (existing) {
    document.getElementById('alliance-name').value = existing.name || '';
    setAlliancePerm(existing.permanence || 'normal');
    document.getElementById('alliance-form-title').textContent = 'Edit Alliance';
    document.getElementById('alliance-submit-btn').textContent = 'Update';
  } else {
    document.getElementById('alliance-name').value = '';
    setAlliancePerm('normal');
    document.getElementById('alliance-form-title').textContent = 'Add Pre-Game Alliance';
    document.getElementById('alliance-submit-btn').textContent = 'Add Alliance';
  }
  form.scrollIntoView({behavior:'smooth',block:'nearest'});
}
export function closeAllianceForm() { editingAllianceId = null; document.getElementById('alliance-form').style.display = 'none'; }
export function setAlliancePerm(p) {
  alliancePerm = p;
  document.querySelectorAll('#alliance-perm-seg .type-btn').forEach(btn => {
    const t = btn.dataset.perm;
    btn.classList.toggle('active', t === p);
    btn.style.background = t === p ? (p === 'permanent' ? '#10b981' : p === 'fragile' ? '#f85149' : 'var(--accent-dim)') : '';
    btn.style.borderColor = t === p ? (p === 'permanent' ? '#10b981' : p === 'fragile' ? '#f85149' : 'var(--accent)') : '';
  });
  document.getElementById('alliance-perm-desc').textContent = _alliancePermDesc[p] || '';
}
export function toggleAllianceMember(el) {
  const isSel = el.dataset.selected === 'true';
  el.dataset.selected = isSel ? 'false' : 'true';
  const ring = el.querySelector('div');
  const img = el.querySelector('img');
  const label = el.querySelector('span:last-child');
  if (ring) ring.style.borderColor = isSel ? 'transparent' : '#10b981';
  if (img) { img.style.filter = isSel ? 'grayscale(0.5)' : ''; img.style.opacity = isSel ? '0.6' : '1'; }
  if (label) label.style.color = isSel ? 'var(--muted)' : '#10b981';
}
export function submitAlliance() {
  const name = document.getElementById('alliance-name').value.trim();
  if (!name) { alert('Enter an alliance name.'); return; }
  const members = [...document.querySelectorAll('#alliance-member-grid [data-selected="true"]')].map(b => b.dataset.member);
  if (members.length < 2) { alert('Select at least 2 members.'); return; }
  if (members.length > 6) { alert('Maximum 6 members per alliance.'); return; }
  const alliance = {
    id: editingAllianceId || Date.now().toString(36) + Math.random().toString(36).slice(2,4),
    name, members, permanence: alliancePerm,
  };
  if (editingAllianceId) {
    const i = preGameAlliances.findIndex(a => a.id === editingAllianceId);
    if (i !== -1) preGameAlliances[i] = alliance;
  } else {
    preGameAlliances.push(alliance);
  }
  savePreAlliances(); closeAllianceForm(); renderAllianceList(); _pushPreAlliances();
}

/**
 * Get the change into the season, or say why it could not.
 *
 * A pre-game alliance used to be written to local storage and stop there.
 * `initGameState` copies them into the game, and it runs once, only when there
 * is no game state — which by the time anybody opens the Relationships tab
 * there usually is. So the alliance existed in the Cast Builder, did not exist
 * in the season, never appeared in the viewing party, and nothing said so.
 */
function _pushPreAlliances() {
  let res;
  try { res = applyPreAlliances(); } catch { return; }
  if (res.dropped?.length) {
    alert(['These pre-game alliances name somebody who is not in the cast, so they',
      'were not applied:', '',
      ...res.dropped.map(d => `${d.name} — ${d.missing.join(', ')}`), '',
      'Check the spelling, or remove them from the alliance.'].join('\n'));
  }
  if (res.deferred?.length) {
    alert(['Applied to the season in progress: ' + res.deferred.join(', '), '',
      'These name people who have never been in the house at the same time —',
      'a twin who has only just walked in, for instance — so there is no',
      'history to rewrite. The alliance is dated to this week rather than to',
      'night one.'].join('\n'));
  }
  if (res.started) {
    alert(['The season has already started, so this is saved for the NEXT season',
      'rather than applied to this one.', '',
      'These members have already shared the house for a week or more. Writing',
      'a group in behind them would rewrite weeks the transcript has told.',
      'Reset the season to apply it from night one.'].join('\n'));
  }
}
export function deletePreAlliance(id) { preGameAlliances = preGameAlliances.filter(a => a.id !== id); savePreAlliances(); renderAllianceList(); _pushPreAlliances(); }
export function clearPreAlliances() { if (!confirm('Clear all pre-game alliances?')) return; preGameAlliances = []; savePreAlliances(); closeAllianceForm(); renderAllianceList(); _pushPreAlliances(); }
export function renderAllianceList() {
  const list = document.getElementById('alliance-list');
  const addBtn = document.getElementById('add-alliance-btn');
  if (!preGameAlliances.length) { list.innerHTML = '<div class="rel-empty">No pre-game alliances defined.<br>Click <strong>+ Add</strong> to create one.</div>'; return; }
  list.innerHTML = preGameAlliances.map(a => {
    const permColor = a.permanence === 'permanent' ? '#10b981' : a.permanence === 'fragile' ? '#f85149' : 'var(--muted)';
    const permLabel = a.permanence === 'permanent' ? 'PERMANENT' : a.permanence === 'fragile' ? 'FRAGILE' : 'NORMAL';
    return `<div class="rel-card">
      <div class="rel-players">
        <div class="rel-names" style="flex-wrap:wrap;gap:4px"><strong style="color:var(--accent)">${a.name}</strong></div>
        <div style="display:flex;align-items:center;gap:4px;margin-top:4px;flex-wrap:wrap">${a.members.map(m => `<div style="display:flex;align-items:center;gap:3px">${miniAvatar(m, 24)}<span style="font-size:11px;color:var(--muted)">${m}</span></div>`).join('<span style="color:var(--border);font-size:10px">\u00b7</span>')}</div>
      </div>
      <span class="rel-badge" style="color:${permColor};border:1px solid ${permColor};background:transparent;font-size:9px">${permLabel}</span>
      <div class="rel-actions">
        <button class="btn btn-secondary btn-sm" onclick="openAllianceForm('${a.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deletePreAlliance('${a.id}')">\u2715</button>
      </div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════════════════════
// BACKGROUND TYPES — WHO THE ROOM RECOGNISES, AND WHY
// ══════════════════════════════════════════════════════════════════════
//
// The Traitors is cast by hand and its contestants are not all the same kind
// of person: an ALUMNUS carries a recorded franchise past the room can quote at
// them, a CELEBRITY is known for something that is not a reality competition,
// and a CIVILIAN is not known at all. The resolver lives in js/tr/state.js —
// this is only the screen that shows what it decided and refuses to start a
// season the screen knows would print a lie.
//
// The select is deliberately three options plus AUTO, and Auto is the default:
// the record already answers this question for almost everybody, and a
// required dropdown on a twenty-person cast is twenty chances to mis-set it.

const BACKGROUND_LABELS = { alumni: 'Alumni', celebrity: 'Celebrity', civilian: 'Civilian' };
const BACKGROUND_COLORS = { alumni: '#f59e0b', celebrity: '#a78bfa', civilian: '#38bdf8' };

// ── THE RECORD EITHER ARRIVED OR IT DID NOT, AND THAT IS NOT A DETAIL ──
//
// `alumniAppearances` returns an empty list for two completely different
// facts: this person never played, and the file that would have said so never
// loaded. `resolveTraitorsBackground` cannot tell them apart — nothing can,
// from inside — so a failed fetch quietly recasts a room of four-time
// finalists as civilians, and the only symptom is a badge that is not there.
// That is precisely the failure this whole feature exists to prevent, one
// layer down: history silently missing and nobody notices.
//
// So the load carries a STATE; a failure is printed where the background
// warnings are already printed; and it is attached to every resolved
// background as a BLOCKING warning, because a cast resolved against a record
// that never arrived is not a cast anybody should start a season on. It is
// deliberately not a retry: one honest "this did not load, reload the page"
// beats a spinner that hides the same hole.
//
// The record is also fetched by run-ui on page load. This second ask exists
// because the cast tab can be looked at before that one resolves.
let _bgDbState = 'idle';       // 'idle' | 'loading' | 'ready' | 'failed'
let _bgDbError = '';

/** Where the franchise record stands: 'idle' | 'loading' | 'ready' | 'failed'. */
export function alumniRecordLoadState() {
  return alumniDatabase() ? 'ready' : _bgDbState;
}

/**
 * The warning a missing record deserves, or null when it is fine.
 *
 * Shaped exactly like the resolver's own warnings — same `code`/`blocking`/
 * `player`/`message` — so one renderer and one blocker check draw both, and
 * nothing has to learn about a second kind of problem.
 */
export function alumniRecordWarning() {
  if (alumniRecordLoadState() !== 'failed') return null;
  return {
    code: 'alumni-record-unavailable',
    blocking: true,
    player: null,
    message: 'The franchise record (players_database.json) could not be loaded'
      + (_bgDbError ? ` — ${_bgDbError}` : '')
      + '. Every contestant is resolving as if they had never played, so an Alumni '
      + 'past cannot be told from a Civilian one. Reload the page before casting.',
  };
}

/** Test seam: forget a previous load attempt. Nothing in the app calls this. */
export function _resetAlumniRecordLoad() {
  _bgDbState = 'idle';
  _bgDbError = '';
}

function _bgDbFailed(why) {
  _bgDbState = 'failed';
  _bgDbError = String(why || '').slice(0, 120);
  try { updateBackgroundPreview(); renderBackgroundPanel(); } catch {}
}

function _ensureAlumniDatabase() {
  if (alumniDatabase() || _bgDbState !== 'idle') return;
  if (typeof fetch !== 'function') { _bgDbFailed('this page has no fetch'); return; }
  _bgDbState = 'loading';
  return fetch('players_database.json')
    .then(r => (r && r.ok === false) ? Promise.reject(new Error(`HTTP ${r.status}`)) : r.json())
    .then(data => {
      if (!setAlumniDatabase(data)) return Promise.reject(new Error('the file held no player list'));
      _bgDbState = 'ready';
      try { updateBackgroundPreview(); renderBackgroundPanel(); } catch {}
    })
    .catch(e => _bgDbFailed(e?.message || e));
}

/** The roster row for a name, for the profile fields the cast form has no box for. */
function _rosterProfile(name) {
  const want = String(name || '').trim().toLowerCase();
  if (!want) return null;
  return FRANCHISE_ROSTER.find(r => String(r?.name || '').trim().toLowerCase() === want) || null;
}

/** One cast member, with the profile fields the roster holds folded in. */
function _backgroundSubject(p) {
  const row = _rosterProfile(p?.name);
  return { ...(row || {}), ...(p || {}) };
}

/**
 * The whole cast's backgrounds, resolved and ready to be frozen onto a season.
 *
 * THE SEASON TAKES THIS ONCE. Everything downstream reads `gs.tr.backgrounds`,
 * never this function, because the database behind it is edited between seasons
 * and a replay that re-resolved would rewrite its own premiere.
 */
export function castBackgrounds() {
  _ensureAlumniDatabase();
  const map = snapshotTraitorsBackgrounds((players || []).map(_backgroundSubject));
  // A record that never arrived rides on EVERY background rather than sitting
  // beside them, so that no reader can hold one of these and mistake a resolved
  // 'civilian' for a person whose past was checked and found empty.
  const missing = alumniRecordWarning();
  if (missing) for (const bg of Object.values(map)) bg.warnings = [...bg.warnings, missing];
  return map;
}

/** Every reason this cast cannot start a castle yet. Empty means go. */
export function castBackgroundBlockers() {
  return traitorsBackgroundBlockers(castBackgrounds());
}

/**
 * The preview under the selector: what this contestant's introduction will say.
 *
 * Drawn from the SAME resolver the season uses, so the sentence on this screen
 * is the sentence the castle gets. A preview written separately is a preview
 * that drifts, and the drift is invisible until somebody reads an episode.
 */
export function updateBackgroundPreview() {
  const el = document.getElementById('f-background-preview');
  if (!el) return;
  _ensureAlumniDatabase();
  const name = (document.getElementById('f-name')?.value || '').trim();
  if (!name) { el.innerHTML = ''; return; }
  const chosen = document.getElementById('f-background')?.value || '';
  const subject = _backgroundSubject({
    name,
    archetype: document.getElementById('f-archetype')?.value || '',
    backgroundType: chosen || undefined,
  });
  const bg = resolveTraitorsBackground(subject);
  const colour = BACKGROUND_COLORS[bg.type] || 'var(--muted)';
  // The asterisk in the plan's writing examples marks a background that came
  // from a CHOICE rather than from the record — worth seeing at a glance,
  // because that is the one a mis-click can get wrong.
  const star = chosen ? '*' : '';
  const missing = alumniRecordWarning();
  const blocked = [...bg.warnings.filter(w => w.blocking), ...(missing ? [missing] : [])];
  el.innerHTML =
    `<div style="margin-top:6px;font-size:11px;line-height:1.5;color:var(--muted)">
      <b style="color:${colour};letter-spacing:.6px">${(BACKGROUND_LABELS[bg.type] || bg.type).toUpperCase()}${star}</b>
      <span style="opacity:.7"> — ${_esc(name)}</span>
      <div style="margin-top:3px">${_esc(bg.summary)}</div>
      ${blocked.map(w => `<div style="margin-top:4px;color:#f87171">⚠ ${_esc(w.message)}</div>`).join('')}
    </div>`;
}

/** The cast-wide banner: the split, and anything that will stop a season. */
export function renderBackgroundPanel() {
  const el = document.getElementById('background-panel');
  if (!el) return;
  const map = castBackgrounds();
  const entries = Object.values(map);
  // NOT an early return on an empty cast any more: a record that failed to load
  // is a fact about the page and not about the cast, and the moment it is most
  // worth saying is before anybody has typed a name in.
  const counts = entries.length ? TR_BACKGROUND_TYPES.map(t => {
    const n = entries.filter(b => b.type === t).length;
    return n ? `<span style="color:${BACKGROUND_COLORS[t]}">${BACKGROUND_LABELS[t]} ${n}</span>` : '';
  }).filter(Boolean).join(' · ') : '';
  // One line per PROBLEM, not per player: the missing-record warning is carried
  // by every background and would otherwise print twenty identical times.
  const seen = new Set();
  const missing = alumniRecordWarning();
  const blockers = [...traitorsBackgroundBlockers(map), ...(missing ? [missing] : [])]
    .filter(w => { const k = `${w.code}|${w.player || ''}`; if (seen.has(k)) return false; seen.add(k); return true; });
  if (!counts && !blockers.length) { el.innerHTML = ''; return; }
  el.innerHTML =
    (counts ? `<div style="font-size:11px;opacity:.85">${counts}</div>` : '') +
    blockers.map(w =>
      `<div style="font-size:11px;color:#f87171;margin-top:3px">⚠ ${_esc(w.message)}</div>`).join('');
}

function _esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/**
 * The Armoury's own options only mean anything when the Armoury is the source,
 * so they are hidden otherwise rather than sitting there inert — the same
 * treatment the traitor picker gets when the mode is random.
 */
/**
 * The episode-length readout under the density picker.
 *
 * Prints the level's own blurb and the ESTIMATED card count for the cast size
 * currently in the builder — the estimate is calibrated against played seasons
 * (js/tr-density.js), so an author moving this control is told the length they
 * will actually get rather than the one the label implies.
 */
export function updateDensityUI() {
  const sel = document.getElementById('cfg-tr-density');
  // THE OPTION LIST IS BUILT FROM THE REGISTRY, NOT TYPED INTO THE HTML.
  // This project's recurring bug is a second copy of a list drifting from the
  // first (docs/ADDING-A-SHOW.md counts eight of them). js/tr-density.js owns
  // the levels; the markup owns an empty <select>.
  if (sel && !sel.options.length) {
    for (const d of TR_DENSITY_LEVELS) {
      const o = document.createElement('option');
      o.value = d.id; o.textContent = d.label;
      sel.appendChild(o);
    }
    sel.value = seasonConfig.trDensity || TR_DENSITY_DEFAULT;
  }
  const id = sel?.value || TR_DENSITY_DEFAULT;
  const out = document.getElementById('tr-density-readout');
  if (!out) return;
  // The cast the season will actually be played with, when the builder knows
  // it; the estimator's own default otherwise.
  const n = (Array.isArray(window.players) && window.players.length)
    ? window.players.length : 18;
  out.innerHTML = '<div style="margin-bottom:4px">'
    + String(densityLevel(id).blurb).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    + '</div><b>' + String(traitorsDensitySummary(n, id))
      .replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</b>';
}

export function updateShieldUI() {
  const src = document.getElementById('cfg-tr-shield-source')?.value || 'mission';
  const box = document.getElementById('tr-armoury-opts');
  if (box) box.style.display = src === 'armoury' ? '' : 'none';
}
