// ══════════════════════════════════════════════════════════════════════
// quick-setup.js — Quick Setup / Advanced split (UX Plan Item 6)
//
// The new default face of the Setup tab: a season-creation screen with five
// preset cards, a live blueprint line, a pre-flight ready check, and ONE
// emerald Start Season button. Rendered entirely from JS — it takes over the
// #tab-setup surface (same pattern as cast-room.js on #tab-cast) and hides the
// legacy "Advanced Production" panels behind a Quick | Advanced toggle. The
// FULL legacy setup UI stays intact and reachable — Quick mode is a subset.
//
// Every config write goes through the LEGACY DOM inputs (#cfg-*) + the existing
// saveConfig(), so there is exactly one source of truth. This module never
// writes seasonConfig fields itself except twistSchedule (which saveConfig
// preserves verbatim from the live object).
//
// Nothing in simulator.html is modified. UI-mutation functions are reached via
// window (window.saveConfig?.(), window.showTab?.(), …) so the pure logic and
// jsdom smoke tests never depend on the full app being wired up.
// ══════════════════════════════════════════════════════════════════════

import { TWIST_CATALOG, twistModeClashes, seasonConfig, players, seasonFormat, formatIsRunnable, formatName } from './core.js';
import { SEASON_SETTINGS, settingsForFormat, defaultSettingFor } from './settings.js';
import { SHOWS as SHOW_REGISTRY, showName, showIcon } from './shows.js';
import { houseStructure } from './bb-run.js';
import { SEASON_OBJECTIVES } from './franchise-meta.js';

// ══════════════════════════════════════════════════════════════════════
// PURE HELPERS (exported + TDD-covered)
// ══════════════════════════════════════════════════════════════════════

export function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, Number(n))); }

const _catById = id => TWIST_CATALOG.find(t => t.id === id);

// Finale formats that resolve without a jury/council — the jury math is moot.
const NO_JURY_FORMATS = new Set([
  'final-challenge', 'olympic-relay', 'hawaiian-punch', 'rescue-mission', 'fan-vote',
]);
function _hasJury(fmt) { return !NO_JURY_FORMATS.has(fmt || 'traditional'); }

// Live one-line season diagram. Pure: (config, castSize) → [{label, ok, why?}].
// Each segment is a validity-highlighted chip:
//   18 players → 2 tribes → merge at 12 → jury of 9 → Final 3 (traditional)
export function blueprintFor(config = {}, castSize = 0) {
  const teams = Number(config.teams) || 1;
  const mergeAt = Number(config.mergeAt) || 0;
  const jurySize = Number(config.jurySize) || 0;
  const finaleSize = Number(config.finaleSize) || 0;
  const fmt = config.finaleFormat || 'traditional';
  const N = Number(castSize) || 0;
  const house = seasonFormat(config) === 'big-brother';
  const castle = seasonFormat(config) === 'traitors';
  const segs = [];

  segs.push({
    label: `${N} ${house ? 'houseguest' : 'player'}${N === 1 ? '' : 's'}`,
    ok: N >= 4,
    why: N >= 4 ? undefined : `Cast at least 4 ${house ? 'houseguests' : 'players'}`,
  });

  // A castle has no tribes, no merge and no jury. What it does have is a
  // ratio: too few Traitors and one lucky banishment ends the season in
  // episode four, too many and the Faithfuls cannot help but find one.
  if (castle) {
    const asked = Number(config.traitorCount) || 0;
    const max = Math.max(2, Math.min(5, Math.round(N * 0.25)));
    const countOk = asked >= 2 && asked <= max;
    segs.push({ label: 'one castle', ok: true });
    segs.push({
      label: `${asked} traitor${asked === 1 ? '' : 's'}`,
      ok: countOk,
      why: countOk ? undefined : `A cast of ${N} supports 2 to ${max} traitors`,
    });
    const endOk = finaleSize >= 2 && finaleSize < N;
    segs.push({
      label: `endgame at ${finaleSize}`,
      ok: endOk,
      why: endOk ? undefined : `The endgame must start at 2+ and below ${N}`,
    });
    return segs;
  }

  // A house has no tribes and no merge: everybody is in from day one.
  if (house) {
    segs.push({ label: 'one house', ok: true });
    const juryOk = jurySize >= 1 && jurySize + finaleSize <= N;
    segs.push({
      label: `jury of ${jurySize}`,
      ok: juryOk,
      why: juryOk ? undefined : `Jury ${jurySize} + Final ${finaleSize} exceeds ${N} houseguests`,
    });
    const finOk = finaleSize >= 2 && finaleSize < N;
    segs.push({
      label: `Final ${finaleSize}`,
      ok: finOk,
      why: finOk ? undefined : `Final ${finaleSize} must be 2+ and below the cast size`,
    });
    return segs;
  }

  if (teams >= 2) {
    const enough = N >= teams * 2;
    segs.push({
      label: `${teams} tribes`,
      ok: enough,
      why: enough ? undefined : `Only ${N} players for ${teams} tribes`,
    });
  } else {
    segs.push({ label: 'solo start', ok: true });
  }

  const swap = (config.twistSchedule || []).filter(Boolean)
    .filter(t => ['tribe-swap', 'tribe-dissolve', 'tribe-expansion'].includes(t.type))
    .sort((a, b) => Number(a.episode) - Number(b.episode))[0];
  if (swap) segs.push({ label: `swap at ep ${swap.episode}`, ok: true });

  const mergeOk = mergeAt > finaleSize + 1 && mergeAt < N;
  segs.push({
    label: `merge at ${mergeAt}`,
    ok: mergeOk,
    why: mergeOk ? undefined
      : mergeAt >= N ? `Merge (${mergeAt}) must sit below the cast size (${N})`
      : `Merge (${mergeAt}) must be above the Final ${finaleSize}`,
  });

  if (_hasJury(fmt)) {
    const juryOk = jurySize >= 1 && jurySize + finaleSize <= N;
    segs.push({
      label: `jury of ${jurySize}`,
      ok: juryOk,
      why: juryOk ? undefined : `Jury ${jurySize} + Final ${finaleSize} exceeds ${N} players`,
    });
  } else {
    segs.push({ label: 'no jury', ok: true });
  }

  const finOk = finaleSize >= 2 && finaleSize < mergeAt;
  segs.push({
    label: `Final ${finaleSize} (${fmt})`,
    ok: finOk,
    why: finOk ? undefined : `Final ${finaleSize} must be 2+ and below the merge`,
  });

  return segs;
}

// Pre-flight validation. Pure: (config, players) → [{key, ok, msg, warn?}].
// Every failed row's msg names the concrete fix.
export function validateQuickSetup(config = {}, playerList = []) {
  const rows = [];
  const N = playerList.length;
  const teams = Number(config.teams) || 1;
  const mergeAt = Number(config.mergeAt) || 0;
  const jurySize = Number(config.jurySize) || 0;
  const finaleSize = Number(config.finaleSize) || 0;
  const fmt = config.finaleFormat || 'traditional';
  const sched = (config.twistSchedule || []).filter(Boolean);

  // ── cast ──
  {
    const ok = N >= 4 && N >= finaleSize + 2;
    const msg = ok ? `${N} players cast.`
      : N < 4 ? `Only ${N} players — cast at least 4.`
      : `Cast is too small for a Final ${finaleSize} — add players (need ${finaleSize + 2}+).`;
    rows.push({ key: 'cast', ok, msg });
  }

  const house = seasonFormat(config) === 'big-brother';

  // ── tribes ──
  // Skipped entirely for a house: there is nothing to assign and nothing to
  // balance, so a "players unassigned to a tribe" warning is pure noise.
  if (!house) {
    if (teams < 2) {
      rows.push({ key: 'tribes', ok: true, msg: 'Single starting tribe — no tribe assignment needed.' });
    } else {
      const assigned = playerList.filter(p => p.tribe);
      const groups = {};
      assigned.forEach(p => (groups[p.tribe] ??= []).push(p));
      const tribeNames = Object.keys(groups);
      const unassigned = N - assigned.length;
      // ok:false is reserved for a genuinely broken tribe layout (unassigned
      // players, wrong tribe count, or an empty tribe). A mere size imbalance is
      // WARN-level — it flags but never blocks ▶ Start Season.
      let ok = true, warn = false, msg = `${teams} tribes, evenly split.`;
      if (unassigned > 0) {
        ok = false;
        msg = `${unassigned} player${unassigned === 1 ? '' : 's'} not assigned to a tribe — set tribes in the Cast room.`;
      } else if (tribeNames.length !== teams) {
        ok = false;
        msg = `Cast uses ${tribeNames.length} tribe${tribeNames.length === 1 ? '' : 's'} but setup expects ${teams} — align them.`;
      } else {
        const sizes = tribeNames.map(t => groups[t].length);
        if (Math.min(...sizes) === 0) { ok = false; msg = 'A tribe has no members.'; }
        else if (Math.max(...sizes) - Math.min(...sizes) > 1) {
          warn = true;
          msg = `Tribe sizes differ by more than 1 (${Math.min(...sizes)}–${Math.max(...sizes)}) — rebalance in the Cast room if you like.`;
        }
      }
      rows.push({ key: 'tribes', ok, warn, msg });
    }
  }

  // ── merge ──
  if (!house) {
    let ok = true, msg = `Merge at ${mergeAt} with ${N} players.`;
    if (!(mergeAt < N)) {
      ok = false; msg = `Merge at ${mergeAt} but only ${N} players — lower it below ${N} or add players.`;
    } else if (!(mergeAt > finaleSize + 1)) {
      ok = false; msg = `Merge at ${mergeAt} is too late for a Final ${finaleSize} — set merge above ${finaleSize + 1}.`;
    }
    rows.push({ key: 'merge', ok, msg });
  }

  // ── jury ──
  {
    if (!_hasJury(fmt)) {
      rows.push({ key: 'jury', ok: true, msg: `No jury for ${fmt}.` });
    } else {
      const ok = jurySize >= 1 && jurySize + finaleSize <= N;
      const msg = ok ? `Jury of ${jurySize} fits.`
        : `Jury of ${jurySize} + Final ${finaleSize} needs ${jurySize + finaleSize} players but only ${N} cast — lower the jury.`;
      rows.push({ key: 'jury', ok, msg });
    }
  }

  // ── twists ──
  {
    const problems = [];
    const maxEp = N - finaleSize + 3;
    const preMergeEps = Math.max(1, N - mergeAt);
    const byEp = {};
    sched.forEach(t => (byEp[t.episode] ??= []).push(t));
    for (const ep of Object.keys(byEp)) {
      const entries = byEp[ep];
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const a = _catById(entries[i].type), b = _catById(entries[j].type);
          if (!a || !b) continue;
          if ((a.incompatible || []).includes(b.id) || (b.incompatible || []).includes(a.id)) {
            problems.push(`${a.name} and ${b.name} can't both run on episode ${ep} — move one.`);
          }
        }
      }
    }
    // A twist can clash with a season MODE as well as with another twist, and
    // that clash is not per-episode: no week of the season is a legal home.
    sched.forEach(t => {
      const c = _catById(t.type); if (!c) return;
      const modeClash = twistModeClashes(c, _cfg());
      if (modeClash.length) {
        problems.push(`${c.name} cannot run in a season with ${modeClash.join(' and ')} — they need the same block.`);
      }
    });
    sched.forEach(t => {
      const c = _catById(t.type); if (!c) return;
      const ep = Number(t.episode);
      if (ep > maxEp) problems.push(`${c.name} is scheduled at episode ${ep}, past the likely finale (~${maxEp}).`);
      if (c.phase === 'pre-merge' && ep > preMergeEps) problems.push(`${c.name} is pre-merge only but scheduled at episode ${ep} (after the merge).`);
      if (c.phase === 'post-merge' && ep <= preMergeEps) problems.push(`${c.name} is post-merge only but scheduled at episode ${ep} (before the merge).`);
    });
    const ok = problems.length === 0;
    rows.push({
      key: 'twists', ok,
      msg: ok ? (sched.length ? `${sched.length} twist${sched.length === 1 ? '' : 's'} scheduled, no conflicts.` : 'No twists scheduled.')
        : problems[0],
    });
  }

  // ── returning players (WARN only, never blocks) ──
  {
    const returners = sched.filter(t => t.type === 'returning-player' || _catById(t.type)?.category === 'returns');
    if (returners.length) {
      rows.push({
        key: 'returning', ok: true, warn: true,
        msg: 'Return twist scheduled — make sure the franchise has past players to draw from.',
      });
    }
  }

  return rows;
}

// Broadly-compatible, low-risk "chaos" twists. Ordered pool; the seeder shuffles
// + places one per episode so incompatible pairs can never collide (they never
// share an episode) and phase boundaries are honoured.
const CHAOS_POOL = [
  'tribe-swap', 'mutiny', 'abduction', 'double-elim', 'double-boot',
  'hero-duel', 'fire-making', 'penalty-vote', 'guardian-angel', 'second-chance',
];

// seedChaosTwists(N, mergeAt, rng?) → 3-4 schedule entries {id, episode, type}
// spread across the season. rng injectable for deterministic tests.
export function seedChaosTwists(N, mergeAt, rng = Math.random) {
  N = Number(N) || 12;
  mergeAt = Number(mergeAt) || Math.ceil(N * 0.55);
  const preMergeEps = Math.max(1, N - mergeAt);
  const totalEps = Math.max(preMergeEps + 3, N - 3);

  const pool = CHAOS_POOL.map(id => _catById(id)).filter(Boolean);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }

  const count = 3 + Math.floor(rng() * 2); // 3 or 4
  const chosen = [];
  const usedEps = new Set();

  for (const entry of pool) {
    if (chosen.length >= count) break;
    let lo, hi;
    if (entry.phase === 'pre-merge') { lo = 2; hi = preMergeEps; }
    else if (entry.phase === 'post-merge') { lo = preMergeEps + 1; hi = totalEps; }
    else { lo = 2; hi = totalEps; }
    if (hi < lo) continue;
    const span = hi - lo + 1;
    let ep = null;
    const start = Math.floor(rng() * span);
    for (let k = 0; k < span; k++) {
      const cand = lo + ((start + k) % span);
      if (!usedEps.has(cand)) { ep = cand; break; }
    }
    if (ep == null) continue;
    chosen.push({ entry, episode: ep });
    usedEps.add(ep);
  }

  return chosen
    .sort((a, b) => a.episode - b.episode)
    .map(c => ({ id: `tw-chaos-${c.episode}-${c.entry.id}`, episode: c.episode, type: c.entry.id }));
}

// presetConfigFor(name, N, rng?) → { preset, config:{partial seasonConfig}, twists }
// PURE — no DOM. applyQuickPreset() writes `config` through the legacy inputs.
// Values adapt to the current cast size N.
export function presetConfigFor(name, N, rng = Math.random) {
  N = Number(N) || 12;
  const mergeMid = clamp(Math.ceil(N * 0.55), 4, 22);
  const out = { preset: name, config: {}, twists: null };

  switch (name) {
    case 'total-drama':
      out.config = {
        teams: 2,
        mergeAt: mergeMid,
        jurySize: clamp(N - mergeMid + 2, 5, 9),
        finaleFormat: 'traditional',
        finaleSize: 2,
        aftermath: 'enabled',
        fanVoteFrequency: '6',
        setting: 'hosted-camp',
        romance: 'enabled',
        days: 39,
      };
      break;

    case 'survivor': {
      // Fire-Making finale locks the entering field to Final 4 (F4 → duel → F3
      // FTC) in the live UI — real code governs, so finaleSize follows the lock.
      // A Final 4 needs merge > 5 and cast >= 6, so a tiny cast (N < 9) has no
      // room: fall back to a traditional Final 3 (documented) rather than emit an
      // unstartable preset. mergeAt is clamped up to finaleSize + 2 either way so
      // the merge rule (mergeAt > finaleSize + 1) always holds.
      const smallCast = N < 9;
      const finaleSize = smallCast ? 3 : 4;
      const finaleFormat = smallCast ? 'traditional' : 'fire-making';
      out.config = {
        teams: N >= 18 ? 3 : 2,
        mergeAt: clamp(Math.max(mergeMid, finaleSize + 2), 4, 22),
        jurySize: clamp(9, 3, Math.max(3, N - finaleSize)),
        finaleSize,
        finaleFormat,
        shotInDark: true,
        idolRehide: true,
        setting: 'survival-island',
        romance: 'enabled',
        aftermath: 'disabled',
      };
      break;
    }

    case 'disventure':
      out.config = {
        teams: 2,
        mergeAt: mergeMid,
        ri: true,
        riReentryAt: mergeMid,
        finaleSize: 3,
        setting: 'carnival',
        aftermath: 'enabled',
        journey: true,
      };
      break;

    case 'chaos':
      out.config = {
        journey: true,
        qem: true,
        mole: '1-random',
        idolRehide: true,
        fanVoteFrequency: '3', // most frequent interval available
        mergeAt: mergeMid,
      };
      out.twists = seedChaosTwists(N, mergeMid, rng);
      break;

    case 'custom':
    default:
      out.config = {};
      break;
  }
  return out;
}

// ══════════════════════════════════════════════════════════════════════
// RENDER LAYER
// ══════════════════════════════════════════════════════════════════════

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const _g = id => (typeof document !== 'undefined' ? document.getElementById(id) : null);
function _cfg() { return (typeof window !== 'undefined' && window.seasonConfig) || seasonConfig; }
function _players() { return (typeof window !== 'undefined' && window.players) || players || []; }
function _gs() { return (typeof window !== 'undefined' ? window.gs : null); }

function _mode() {
  if (typeof window === 'undefined') return 'quick';
  if (window._qsMode) return window._qsMode;
  let m = 'quick';
  try { m = localStorage.getItem('simulator_qsMode') || 'quick'; } catch {}
  window._qsMode = m;
  return m;
}
function _preset() {
  if (typeof window === 'undefined') return null;
  if (window._qsPreset !== undefined) return window._qsPreset;
  let p = null;
  try { p = localStorage.getItem('simulator_qsPreset'); } catch {}
  window._qsPreset = p;
  return p;
}

// The SHOW is a different axis from the preset row below it: a preset picks a
// flavour of rules *within* Total Drama, while this picks which game is being
// played at all. Keeping them apart is what lets the franchise add Traitors,
// Drag Race and the rest without the preset row becoming nonsense.
// Derived from js/shows.js rather than listed here. This array WAS a ninth
// hardcoded show list -- the eight the collapse removed, plus this one it
// missed -- and it had already drifted: Big Brother's icon was a house here and
// a camera in the registry, so the same show wore two faces on two screens and
// nothing errored. Name and icon are identity and belong to the registry; `tag`
// stays local because it is this picker's own sales copy, not a fact about the
// show, and a fourth show added to the registry appears here without an edit.
const SHOW_TAGS = {
  'total-drama': 'Tribes, challenges, tribal council',
  'big-brother': 'One house, HOH, veto, live eviction',
  'traitors':    'A castle, a round table, a murder every night',
  'drag-race':   'Werk room, runway, lip sync for your life',
};
export const SHOWS = Object.keys(SHOW_REGISTRY).map(id => ({
  id, name: showName(id), icon: showIcon(id), tag: SHOW_TAGS[id] || '',
}));

function _format() {
  const el = _g('cfg-format');
  if (el && el.value) return seasonFormat(el.value);
  return seasonFormat(_cfg());
}

const PRESETS = [
  { id: 'total-drama', name: 'Total Drama', tag: 'Camp chaos, drama, romance', icon: '🎬' },
  { id: 'survivor', name: 'Survivor', tag: 'Idols, fire-making, the merge', icon: '🔥' },
  { id: 'disventure', name: 'Disventure Camp', tag: 'Rescue Island, carnival, journeys', icon: '🎪' },
  { id: 'chaos', name: 'Chaos', tag: 'Twists on twists, no mercy', icon: '🌀' },
  { id: 'custom', name: 'Custom', tag: 'Hand-set every dial', icon: '⚙️' },
];

// Clone a legacy <select>'s options so the Quick control mirrors it exactly
// without hardcoding the option list.
function _cloneOptions(legacyId) {
  const el = _g(legacyId);
  if (!el) return '';
  return [...el.options].map(o => `<option value="${esc(o.value)}">${esc(o.textContent)}</option>`).join('');
}

function _identityCardHTML() {
  const cfg = _cfg();
  return `<section class="qs-card">
    <div class="qs-card-head"><span class="qs-card-icon">✦</span><h3>Identity</h3></div>
    <div class="qs-grid2">
      <label class="qs-field qs-field-wide">
        <span class="qs-label">Season title</span>
        <input id="qs-name" class="qs-input" type="text" placeholder="e.g. Champions vs Contenders"
          value="${esc(cfg.name || '')}" oninput="qsSetIdentity('cfg-name','qs-name')">
      </label>
      <label class="qs-field">
        <span class="qs-label">Season #</span>
        <input id="qs-season-number" class="qs-input" type="number" min="1" max="99" placeholder="10"
          value="${esc(cfg.seasonNumber || '')}" oninput="qsSetIdentity('cfg-season-number','qs-season-number')">
      </label>
      <label class="qs-field">
        <span class="qs-label">Host</span>
        <select id="qs-host" class="qs-input" onchange="qsSetIdentity('cfg-host','qs-host')">${_cloneOptions('cfg-host')}</select>
      </label>
      <label class="qs-field qs-field-wide">
        <span class="qs-label">Setting</span>
        <select id="qs-setting" class="qs-input" onchange="qsSetIdentity('cfg-setting','qs-setting')">${_cloneOptions('cfg-setting')}</select>
      </label>
    </div>
  </section>`;
}

function _showCardHTML() {
  const fmt = _format();
  const wired = formatIsRunnable(fmt);
  const opts = SHOWS.map(sh => `
    <button class="qs-preset qs-show${fmt === sh.id ? ' active' : ''}" id="qs-show-${sh.id}"
      onclick="qsSetFormat('${sh.id}')" aria-pressed="${fmt === sh.id}">
      <span class="qs-preset-icon">${sh.icon}</span>
      <span class="qs-preset-name">${esc(sh.name)}</span>
      <span class="qs-preset-tag">${esc(sh.tag)}</span>
    </button>`).join('');
  // A switch that silently ran the wrong engine would be worse than no switch,
  // so an unfinished show says so here rather than at the end of a season.
  const warn = wired ? '' : `<div class="qs-show-warn" id="qs-show-warn">
      <strong>Not runnable yet.</strong> The ${esc(formatName(fmt))} engine is still being
      built. You can set the season up now — Run will still simulate Total Drama
      until the engine is connected.
    </div>`;
  return `<section class="qs-card">
    <div class="qs-card-head"><span class="qs-card-icon">◉</span><h3>Show</h3>
      <span class="qs-card-hint">Which game this season plays.</span></div>
    <div class="qs-presets qs-shows">${opts}</div>
    ${warn}
  </section>`;
}

function _presetCardsHTML() {
  const active = _preset();
  const cards = PRESETS.map(p => `
    <button class="qs-preset${active === p.id ? ' active' : ''}" id="qs-preset-${p.id}"
      onclick="qsApplyPreset('${p.id}')" aria-pressed="${active === p.id}">
      <span class="qs-preset-icon">${p.icon}</span>
      <span class="qs-preset-name">${esc(p.name)}</span>
      <span class="qs-preset-tag">${esc(p.tag)}</span>
    </button>`).join('');
  // Every preset is a flavour of Total Drama rules — tribes, merges, idols.
  // Offering Survivor or Chaos under a Big Brother season would be offering
  // dials that do not exist in that house.
  if (_format() !== 'total-drama') {
    return `<section class="qs-card">
      <div class="qs-card-head"><span class="qs-card-icon">◆</span><h3>Format preset</h3></div>
      <div class="qs-preset-na">Presets are Total Drama rule sets — tribes, merges, idols.
        ${esc(formatName(_format()))} has its own structure, so there is nothing to preset here.</div>
    </section>`;
  }
  return `<section class="qs-card">
    <div class="qs-card-head"><span class="qs-card-icon">◆</span><h3>Format preset</h3>
      <span class="qs-card-hint">A starting point — tweak anything below.</span></div>
    <div class="qs-presets">${cards}</div>
  </section>`;
}

function _stepperHTML(kind, legacyId, label) {
  const el = _g(legacyId);
  const val = el ? el.value : '';
  const min = el ? el.min : 0, max = el ? el.max : 99;
  const disabled = el ? el.disabled : false;
  return `<div class="qs-stepper${disabled ? ' disabled' : ''}">
    <span class="qs-step-label">${esc(label)}</span>
    <div class="qs-step-ctrl">
      <button class="qs-step-btn" onclick="qsStep('${kind}',-1)" aria-label="Decrease ${esc(label)}" ${disabled ? 'disabled' : ''}>−</button>
      <input id="qs-${kind}-range" class="qs-range" type="range" min="${min}" max="${max}" value="${esc(val)}"
        ${disabled ? 'disabled' : ''} oninput="qsRange('${kind}')">
      <button class="qs-step-btn" onclick="qsStep('${kind}',1)" aria-label="Increase ${esc(label)}" ${disabled ? 'disabled' : ''}>+</button>
      <span class="qs-step-val" id="qs-${kind}-val">${esc(val)}</span>
    </div>
  </div>`;
}

/**
 * What the jury number actually buys, under the control that sets it.
 *
 * Redrawn by _updateDynamic on every step, because the whole value of the line
 * is watching the date move while you choose. Reads the legacy input rather
 * than seasonConfig: qsStep writes the input and calls saveConfig after, so
 * during a step the config is one behind and the card would lag by a click.
 */
function _houseNoteHTML() {
  const N = _players().length;
  const jury = Number(_g('cfg-jury')?.value ?? _cfg().jurySize) || 0;
  const opens = jury > 0 ? jury + 2 : 0;
  const fits = !N || !opens || opens <= N;
  const body = opens
    ? (fits
      ? `The jury opens with <strong>${opens}</strong> houseguests left — everybody evicted from that night on votes for the winner.`
      : `A jury of ${jury} needs ${opens} houseguests and only ${N} are cast.`)
    : 'No jury — the season is played out without a panel.';
  return `<div id="qs-housenote" class="qs-housenote${fits ? '' : ' bad'}">${body}</div>`;
}

function _structureCardHTML() {
  const cfg = _cfg();
  const N = _players().length;
  const isHouse = _format() === 'big-brother';

  const caststrip = `<div class="qs-caststrip">
      <span class="qs-cast-count">${N}</span>
      <span class="qs-cast-word">${isHouse ? 'houseguest' : 'player'}${N === 1 ? '' : 's'} cast</span>
      <button class="qs-link" onclick="qsGoCast()">Edit cast →</button>
    </div>`;

  // The house gets its own card rather than Total Drama's with bits hidden.
  //
  // Quick Setup is the DEFAULT view, and it was offering a Big Brother season
  // starting tribes, a merge point and a "Council" — three things a house does
  // not have, on the first screen anybody sees. The one structural number it
  // does own is the jury, and the size of it decides the only date in the
  // season: the night the person evicted stops going home and starts picking
  // the winner. Everything else is fixed by the format — one house, one
  // eviction a week, a final three — so there is nothing else to ask.
  if (isHouse) {
    return `<section class="qs-card">
      <div class="qs-card-head"><span class="qs-card-icon">▚</span><h3>Structure</h3>
        <span class="qs-card-hint">One house, one eviction a week, a final three.</span></div>
      ${caststrip}
      <div class="qs-steppers">
        ${_stepperHTML('jury', 'cfg-jury', 'Jury size')}
      </div>
      ${_houseNoteHTML()}
    </section>`;
  }

  return `<section class="qs-card">
    <div class="qs-card-head"><span class="qs-card-icon">▚</span><h3>Structure</h3></div>
    ${caststrip}
    <div class="qs-steppers">
      ${_stepperHTML('teams', 'cfg-teams', 'Starting tribes')}
      ${_stepperHTML('merge', 'cfg-merge', 'Merge at (players left)')}
      ${_stepperHTML('jury', 'cfg-jury', 'Council / jury size')}
      ${_stepperHTML('finale', 'cfg-finale', 'Finale size (Final N)')}
    </div>
    <div class="qs-grid2">
      <label class="qs-field qs-field-wide">
        <span class="qs-label">Finale format</span>
        <select id="qs-finale-format" class="qs-input" onchange="qsFinaleFormat()">${_cloneOptions('cfg-finale-format')}</select>
      </label>
      <label class="qs-field">
        <span class="qs-label">Length (days)</span>
        <input id="qs-days" class="qs-input" type="number" min="1" max="120" placeholder="39"
          value="${esc(cfg.days || 39)}" oninput="qsSetIdentity('cfg-days','qs-days')">
      </label>
    </div>
  </section>`;
}

function _blueprintInnerHTML() {
  const segs = blueprintFor(_cfg(), _players().length);
  return segs.map((s, i) => {
    const arrow = i < segs.length - 1 ? '<span class="qs-bp-arrow">→</span>' : '';
    const cls = s.ok ? 'qs-bp-seg' : 'qs-bp-seg qs-bp-bad';
    const title = s.why ? ` title="${esc(s.why)}"` : '';
    return `<span class="${cls}"${title}>${esc(s.label)}${s.ok ? '' : ' <span class="qs-bp-x">!</span>'}</span>${arrow}`;
  }).join('');
}

function _blueprintCardHTML() {
  return `<section class="qs-card qs-blueprint-card">
    <div class="qs-card-head"><span class="qs-card-icon">⌁</span><h3>Season blueprint</h3></div>
    <div class="qs-blueprint" id="qs-blueprint">${_blueprintInnerHTML()}</div>
  </section>`;
}

// ── Season objectives (optional goals) ─────────────────────────────────
// Source of truth for the picker is window._qsObjectives (loaded once from
// seasonConfig.seasonObjectives). saveConfig() REBUILDS seasonConfig from the DOM
// and drops unknown keys, so after any save we re-apply objectives onto the live
// config + localStorage (core.js's load merge {...defaults, ...saved} keeps the
// unknown `seasonObjectives` key across reloads). See _reapplyObjectives().
function _qsObjectives() {
  if (typeof window === 'undefined') return [];
  if (Array.isArray(window._qsObjectives)) return window._qsObjectives;
  const cfg = _cfg();
  window._qsObjectives = Array.isArray(cfg?.seasonObjectives) ? cfg.seasonObjectives.map(o => ({ ...o })) : [];
  return window._qsObjectives;
}
function _reapplyObjectives() {
  const cfg = _cfg(); if (!cfg) return;
  cfg.seasonObjectives = _qsObjectives().map(o => ({ ...o }));
  try { localStorage.setItem('simulator_config', JSON.stringify(cfg)); } catch {}
}

function _objectivesCardHTML() {
  const objs = _qsObjectives();
  const selected = new Set(objs.map(o => o.id));
  const chips = SEASON_OBJECTIVES.map(o => {
    const active = selected.has(o.id);
    return `<button class="qs-obj-chip${active ? ' active' : ''}" onclick="qsToggleObjective('${o.id}')"
      aria-pressed="${active}" title="${esc(o.blurb)}">${esc(o.label)}</button>`;
  }).join('');
  const pf = objs.find(o => o.id === 'protect-favorite');
  const names = _players().map(p => p.name).filter(Boolean);
  const targetPicker = pf ? `<label class="qs-field qs-field-wide qs-obj-target">
      <span class="qs-label">Favorite to protect</span>
      <select id="qs-obj-target" class="qs-input" onchange="qsSetObjectiveTarget()">
        <option value="">— pick a player —</option>
        ${names.map(n => `<option value="${esc(n)}"${n === pf.target ? ' selected' : ''}>${esc(n)}</option>`).join('')}
      </select>
    </label>` : '';
  return `<section class="qs-card">
    <div class="qs-card-head"><span class="qs-card-icon">🎯</span><h3>Objectives</h3>
      <span class="qs-card-hint">Optional — pick season goals to grade at the finale.</span></div>
    <div class="qs-obj-chips">${chips}</div>
    ${targetPicker}
  </section>`;
}

function _readyRowsHTML() {
  const rows = validateQuickSetup(_cfg(), _players());
  return rows.map(r => {
    const state = r.ok ? (r.warn ? 'warn' : 'ok') : 'bad';
    const mark = r.ok ? (r.warn ? '⚠' : '✓') : '✗';
    return `<div class="qs-ready-row qs-ready-${state}">
      <span class="qs-ready-mark">${mark}</span>
      <span class="qs-ready-msg">${esc(r.msg)}</span>
    </div>`;
  }).join('');
}

function _startBtnHTML() {
  const gs = _gs();
  if (gs && gs.initialized) {
    return `<button class="qs-start qs-start-hub" onclick="qsStartSeason()">Open Season Hub →</button>
      <p class="qs-start-hint">A season is already in progress. Reset lives in Advanced Production / the Season Hub.</p>`;
  }
  const rows = validateQuickSetup(_cfg(), _players());
  const blocked = rows.some(r => !r.ok);
  return `<button class="qs-start${blocked ? ' disabled' : ''}" id="qs-start-btn"
    ${blocked ? 'disabled aria-disabled="true"' : ''} onclick="qsStartSeason()">▶ Start Season</button>`;
}

function _readyCardHTML() {
  return `<section class="qs-card qs-ready-card">
    <div class="qs-card-head"><span class="qs-card-icon">✈</span><h3>Ready check</h3></div>
    <div class="qs-ready" id="qs-readycheck">${_readyRowsHTML()}</div>
    <div class="qs-start-wrap" id="qs-start-wrap">${_startBtnHTML()}</div>
  </section>`;
}

function _bodyHTML() {
  return `<div class="qs-body" id="qs-body">
    ${_identityCardHTML()}
    ${_showCardHTML()}
    ${_presetCardsHTML()}
    ${_structureCardHTML()}
    ${_objectivesCardHTML()}
    ${_blueprintCardHTML()}
    ${_readyCardHTML()}
  </div>`;
}

function _shellHTML() {
  const mode = _mode();
  return `
    <div class="qs-header">
      <div class="qs-title-wrap">
        <h2 class="qs-title">Season Setup</h2>
        <span class="qs-sub">Build the season, then hit start.</span>
      </div>
      <div class="qs-modetoggle" role="tablist" aria-label="Setup mode">
        <button class="qs-modebtn${mode === 'quick' ? ' active' : ''}" role="tab" aria-selected="${mode === 'quick'}"
          onclick="qsSetMode('quick')">Quick</button>
        <button class="qs-modebtn${mode === 'advanced' ? ' active' : ''}" role="tab" aria-selected="${mode === 'advanced'}"
          onclick="qsSetMode('advanced')">Advanced</button>
      </div>
    </div>
    ${_bodyHTML()}`;
}

// ── Full render + takeover ──
export function renderQuickSetup() {
  if (typeof document === 'undefined') return;
  const tab = document.getElementById('tab-setup');
  if (!tab) return;

  // Escape hatch — restore the legacy Advanced Production UI entirely.
  if (typeof window !== 'undefined' && window._quickSetupDisabled) {
    tab.classList.remove('quick-setup-active', 'qs-hide-legacy');
    document.getElementById('quick-setup')?.remove();
    return;
  }

  _injectCSS();

  let root = document.getElementById('quick-setup');
  if (!root) {
    root = document.createElement('div');
    root.id = 'quick-setup';
    // Prepend so the always-visible Quick|Advanced header sits ABOVE the legacy
    // panels when Advanced mode reveals them.
    tab.insertBefore(root, tab.firstChild);
  }
  root.innerHTML = _shellHTML();

  const mode = _mode();
  tab.classList.add('quick-setup-active');
  tab.classList.toggle('qs-hide-legacy', mode === 'quick');
  const body = document.getElementById('qs-body');
  if (body) body.hidden = (mode !== 'quick');

  // Mirror the legacy selects' current values into the Quick controls (options
  // were cloned generically; the value comes from live config via renderConfig).
  _syncFromLegacy();
  _reapplyObjectives(); // keep objectives on the live config after any rebuild
}

function _syncFromLegacy() {
  const pair = (quickId, legacyId) => {
    const q = _g(quickId), l = _g(legacyId);
    if (q && l && 'value' in q) q.value = l.value;
  };
  pair('qs-host', 'cfg-host');
  pair('qs-setting', 'cfg-setting');
  pair('qs-finale-format', 'cfg-finale-format');
}

// ── Live (DOM-only) updates — never rebuilds identity/structure inputs, so the
//    focused field keeps its caret. Reads the single source of truth. ──
function _updateDynamic() {
  _reapplyObjectives(); // survive saveConfig's DOM rebuild (drops unknown keys)
  const bp = _g('qs-blueprint'); if (bp) bp.innerHTML = _blueprintInnerHTML();
  const rc = _g('qs-readycheck'); if (rc) rc.innerHTML = _readyRowsHTML();
  const sw = _g('qs-start-wrap'); if (sw) sw.innerHTML = _startBtnHTML();
  // The house's structure card carries a derived line — the week the jury
  // opens — and the point of it is watching that date move as you choose.
  const hn = _g('qs-housenote'); if (hn) hn.outerHTML = _houseNoteHTML();
}

function _updatePresetCards() {
  const active = _preset();
  PRESETS.forEach(p => {
    const el = _g(`qs-preset-${p.id}`);
    if (el) { el.classList.toggle('active', active === p.id); el.setAttribute('aria-pressed', String(active === p.id)); }
  });
}

function _syncStepDisplays() {
  ['teams', 'merge', 'jury', 'finale'].forEach(kind => {
    const legacyId = _STEP[kind];
    const l = _g(legacyId);
    if (!l) return;
    const val = _g(`qs-${kind}-val`); if (val) val.textContent = l.value;
    const rng = _g(`qs-${kind}-range`); if (rng) { rng.value = l.value; rng.disabled = l.disabled; }
  });
}

function _markCustom() {
  if (typeof window !== 'undefined' && window._qsApplyingPreset) return;
  if (typeof window === 'undefined') return;
  window._qsPreset = 'custom';
  try { localStorage.setItem('simulator_qsPreset', 'custom'); } catch {}
  _updatePresetCards();
}

// ══════════════════════════════════════════════════════════════════════
// HANDLERS (window-exposed)
// ══════════════════════════════════════════════════════════════════════

const _STEP = { teams: 'cfg-teams', merge: 'cfg-merge', jury: 'cfg-jury', finale: 'cfg-finale' };

// Identity + free-form fields: copy Quick → legacy input → saveConfig.
export function qsSetIdentity(legacyId, quickId) {
  const q = _g(quickId), l = _g(legacyId);
  if (!q || !l) return;
  l.value = q.value;
  window.saveConfig?.();
  _markCustom();
  _updateDynamic();
}

export function qsStep(kind, delta) {
  const el = _g(_STEP[kind]);
  if (!el || el.disabled) return;
  const min = Number(el.min) || 0, max = Number(el.max) || 99;
  el.value = clamp((Number(el.value) || 0) + delta, min, max);
  window.updateSlider?.(kind);
  window.saveConfig?.();
  _markCustom();
  _syncStepDisplays();
  _updateDynamic();
}

export function qsRange(kind) {
  const rng = _g(`qs-${kind}-range`), el = _g(_STEP[kind]);
  if (!rng || !el || el.disabled) return;
  el.value = rng.value;
  window.updateSlider?.(kind);
  window.saveConfig?.();
  _markCustom();
  _syncStepDisplays();
  _updateDynamic();
}

export function qsFinaleFormat() {
  const q = _g('qs-finale-format'), l = _g('cfg-finale-format');
  if (!q || !l) return;
  l.value = q.value;
  // onFinaleFormatChange applies the F4/F3 lock AND calls saveConfig.
  window.onFinaleFormatChange?.();
  _markCustom();
  // Finale size may have been locked (fire-making → F4); rebuild to reflect it.
  renderQuickSetup();
}

// ── Show (which game this season plays) ────────────────────────────────
// Writes through the legacy <select> so saveConfig stays the single source of
// truth, exactly as the preset buttons do.
export function qsSetFormat(fmt) {
  const next = seasonFormat(fmt);
  const el = _g('cfg-format');
  if (el) el.value = next;
  window.saveConfig?.();
  qsOnFormatChange();
  renderQuickSetup?.();
}

// Called from the legacy <select>'s onchange too, so the note stays right
// whichever control was used.
export function qsOnFormatChange() {
  window.updateFormatNote?.();
  // Switching show changes what can be designed, not just the note under the
  // dropdown: the twist catalogue and the venue list both belong to a format.
  renderHostOptions();
  renderSettingOptions();
  applyFormatScope();
  // Quick Setup's own cards are built per show — the Structure card asks a
  // house for a jury and a camp for tribes, a merge and a finale format — and
  // it was only ever rebuilt when the tab was opened. Switching show while
  // sitting on the panel left the previous show's card on screen, so a season
  // switched to Total Drama was still being asked for a jury and nothing else.
  renderQuickSetup();
  window.renderTwistCatalog?.();
  window.renderFormatToggle?.();
}

// The Season Basics host is the single host control. Its choices belong to the
// selected show, just like venues do: Big Brother should not silently inherit
// Chris, and Total Drama should not silently inherit Don after switching back.
export const HOSTS_BY_FORMAT = {
  'total-drama': [
    { value: 'Chris', label: 'Chris McLean' },
    { value: 'Chef', label: 'Chef Hatchet' },
    { value: 'Jeff', label: 'Jeff Probst' },
  ],
  'big-brother': [
    { value: 'Don', label: 'Don McGurrin' },
    { value: 'Julie Chen Moonves', label: 'Julie Chen Moonves' },
    { value: 'Arisa Cox', label: 'Arisa Cox' },
  ],
  'traitors': [
    // Valeria is the default host and the show's voice: Julie Chen's studio
    // authority with Blaineley's arch self-regard. The portrait is
    // assets/avatars/valeria.png, resolved the same way a player's is, so a
    // screen never hardcodes a host name -- swapping the host must swap every
    // line the host speaks. See ADDING-A-SHOW.md §14.10 for the bug class.
    //
    // AND EVERY LINE A TRAITORS HOST SPEAKS IS GENDER-NEUTRAL. This list holds
    // two women and a man, they are swapped at runtime by renderHostOptions(),
    // and nothing generating host prose may assume which one is on. The
    // phrasing of this comment is where the assumption started -- it said
    // "every line she speaks" -- and eleven feminine staging lines were written
    // against it in js/tr/headless.js while js/vp-tr/selection.js was already
    // narrating the same host as "he" one screen later. Neutrality is a RULE
    // and not an interim: a guard cannot go stale when a fourth host is added,
    // whereas per-host pronoun metadata has to be maintained. Enforced over
    // every file that writes host prose by tests/tr-vp.test.js.
    { value: 'Valeria',  label: 'Valeria Sandoval' },
    { value: 'Alistair', label: 'Alistair Crane' },
    { value: 'Claudia',  label: 'Claudia Winterbourne' },
  ],
  // One host, and unlike the castle's three this one is not a variable: the
  // host of this show is also a permanent judge and the person who decides who
  // goes home, so swapping the name would swap the panel too. The portrait
  // pair is assets/avatars/rupaul.png (werk room) and rupaul-drag.png (main
  // stage) — see js/dr/data/judges.js, which owns both.
  'drag-race': [
    { value: 'RuPaul', label: 'RuPaul' },
  ],
};

export function hostOptionsForFormat(fmt) {
  return HOSTS_BY_FORMAT[seasonFormat(fmt)] || HOSTS_BY_FORMAT['total-drama'];
}

export function renderHostOptions() {
  const el = _g('cfg-host');
  if (!el) return;
  const fmt = seasonFormat(_g('cfg-format')?.value || seasonConfig);
  const options = hostOptionsForFormat(fmt);
  const previousRaw = seasonConfig?.host || el.value;
  const previous = previousRaw === 'Don McGurrin' ? 'Don' : previousRaw;
  const values = options.map(h => h.value);
  const next = values.includes(previous) ? previous : options[0].value;
  el.innerHTML = options.map(h => `<option value="${h.value}">${h.label}</option>`).join('');
  el.value = next;

  // Quick Setup mirrors this select, so update its choices immediately too.
  const quick = _g('qs-host');
  if (quick) {
    quick.innerHTML = el.innerHTML;
    quick.value = next;
  }

  if (seasonConfig && seasonConfig.host !== next) {
    seasonConfig.host = next;
    window.saveConfig?.();
  }
}

/**
 * The show switch, at the top of the designer.
 *
 * The only control for this lived in Season Basics, several panels away from
 * the screen whose entire contents depend on it — so designing a house season
 * meant staring at a catalogue of tribe swaps with no visible way to change it.
 * Writes through the same <select>, so there is still one source of truth.
 */
export function renderFormatToggle() {
  const host = _g('fd-format-toggle');
  if (!host) return;
  const fmt = seasonFormat(seasonConfig);
  const shows = [
    { id: 'total-drama', label: 'Total Drama', sub: 'tribes · challenges · tribal council' },
    { id: 'big-brother', label: 'Big Brother', sub: 'one house · HOH · veto · live eviction' },
  ];
  host.innerHTML = shows.map(s => `<button class="fd-show-btn ${s.id === fmt ? 'active' : ''}"
      onclick="qsSetFormat('${s.id}')">
      <span class="fd-show-name">${s.label}</span>
      <span class="fd-show-sub">${s.sub}</span>
      ${formatIsRunnable(s.id) ? '' : '<span class="fd-show-warn">not wired</span>'}
    </button>`).join('');
}

/**
 * Which controls belong to which show.
 *
 * The rule is evidence, not taste: a control is shown only if that format's
 * engine reads the value. The Big Brother week reads exactly six keys —
 * host, setting, romance, finaleSize, jurySize, twistSchedule — plus the two
 * house options below. Everything else on the setup page is Total Drama
 * machinery that a house silently ignores: there are no tribes to swap, no
 * idols to hide, no merge to reach, no Shot in the Dark to play, and the tie
 * is broken by the Head of Household because that is what the format is.
 *
 * Keys are accordion names, element ids or section-label ids; the value is the
 * list of formats that use them. Anything not listed is shown to everybody.
 */
const CONFIG_SCOPE = {
  accordions: {
    tiebreaker: ['total-drama'],   // a house tie is broken by the HOH, always
    ri:         ['total-drama'],   // the house's version is Battle Back (backlog)
    sid:        ['total-drama'],
    blackvote:  ['total-drama'],
    aftermathshow: ['total-drama'], // the house has the eviction interview
    journey:    ['total-drama'],
    exile:      ['total-drama'],
    fan:        ['total-drama'],
    idol:       ['total-drama'],
    advantages: ['total-drama'],
    qem:        ['total-drama'],
    popularity: ['total-drama', 'big-brother', 'traitors'],  // a castle has an audience too
    survival:   ['total-drama'],
    mole:       ['total-drama'],
    // Sideline coaches train a TRIBE — a house and a castle have neither, so
    // the panel meant nothing on either and, being absent from this map, was
    // the one TD mechanic that stayed drawn over both.
    coaches:    ['total-drama'],
  },
  fields: {
    'cfg-days':              ['total-drama'],  // a house runs to a final three, not a day count
    'cfg-teams':             ['total-drama'],
    'cfg-merge':             ['total-drama'],
    'cfg-finale-format':     ['total-drama'],  // the house finale is the three-part HOH
    'cfg-finale-assistants': ['total-drama'],
    // A theme is a house premise; there is nothing for one to author on a beach.
    // Scoped here as well as in applySeasonConfig so that switching show on the
    // panel hides it immediately, the way the venue list is rebuilt immediately.
    'cfg-theme':             ['big-brother'],
    'cfg-bb-interview':      ['big-brother'],
    'cfg-bb-host-style':     ['big-brother'],
    'cfg-bb-havenots':       ['big-brother'],
    'cfg-bb-safety':         ['big-brother'],
    'cfg-bb-safety-stops':   ['big-brother'],
    'cfg-bb-havenot-count':  ['big-brother'],
    'cfg-bb-departures':     ['big-brother'],
    'f-tribe':               ['total-drama'],  // a house has no tribes to join
    'cfg-finale':            ['total-drama'],  // a house always ends at three
    // The castle's own controls: how many traitors, and the pot they are
    // playing for. No other format's engine reads either.
    //
    // A THIRD ONE WAS SCOPED HERE AND HAS BEEN REMOVED. `cfg-tr-selection`
    // ('random' | 'chosen') was named in this map before the control existed,
    // and when Task 7 came to build it there was nothing on the engine side to
    // wire it to: `selectTraitors` (js/tr/roles.js) picks NEAR-UNIFORMLY on
    // purpose, and says why — weighting toward masterminds makes every season
    // the same season, and the format's best outcomes include a terrible
    // Traitor. A control that cannot change the answer is worse than no
    // control, so the scope entry went rather than a dead select being drawn
    // to satisfy it.
    'cfg-tr-traitor-count':  ['traitors'],
    'cfg-tr-pot':            ['traitors'],
    // The rest of the castle's options. `sec-tr-options` is only a label, not a
    // wrapper, so each control in the block scopes itself — without this the
    // traitor mode, the double/recruit/reveal toggles and the endgame size all
    // drew under a Total Drama or Big Brother season too.
    'cfg-tr-traitor-mode':   ['traitors'],
    'cfg-tr-auto-double':    ['traitors'],
    'cfg-tr-auto-recruit':   ['traitors'],
    'cfg-tr-endgame-reveal': ['traitors'],
    // The castle's endgame size (final 2-5). Only js/tr/ reads it.
    'cfg-tr-endgame-size':   ['traitors'],
    // COUNCIL SIZE IS NOT A CASTLE CONTROL. The `cfg-jury` slider is shared —
    // the house reads a jury size off it and Total Drama a panel — but the
    // castle ends on the fire round, not a jury vote, so nothing in js/tr/ ever
    // reads it. Left unscoped it drew "Council Size: 9 Members" over a castle
    // that has no council; scoped away from traitors it stops appearing there.
    'cfg-jury':              ['total-drama', 'big-brother'],
    // A castle has one venue and nothing in js/tr/ reads a setting -- the
    // castle layer writes its own events and never asks where it is. Left
    // visible, the picker offered a summer camp and a world tour for a
    // castle and wrote 'hosted-camp' onto the season, which the Season Hub
    // then printed across the top of it.
    'cfg-setting':           ['total-drama', 'big-brother'],
  },
  sections: {
    'sec-season-options':     ['total-drama'],
    'sec-settings-mechanics': ['total-drama', 'big-brother', 'traitors'],  // popularity lives here
    'sec-bb-options':         ['big-brother'],
    'sec-bb-divider':         ['big-brother'],
    // The container, not just its heading. The fixed-rule lines inside it are
    // not form-groups, so scoping only the individual controls left "Ties" and
    // "Endgame" sitting in the middle of a Total Drama season.
    'bb-options-body':        ['big-brother'],
    'sec-tribes':             ['total-drama'],
    'sec-formats-twists':          ['total-drama'],
    'sec-formats-twists-divider':  ['total-drama'],
    // The castle's traitor-count/selection/pot controls and their heading.
    'sec-tr-options':        ['traitors'],
    'sec-tr-divider':        ['traitors'],
    // The END GAME heading holds Total Drama's finale block AND the castle's
    // endgame controls (each control scoped within). Shown for both; a house
    // finale is fixed (final three, stated in HOUSE OPTIONS), so it stays hidden
    // there rather than drawing an empty heading.
    'sec-end-game':          ['total-drama', 'traitors'],
  },
};

/** The container a control lives in, so hiding it hides its label too. */
function _scopeHost(el) {
  return el.closest('.form-group, .slider-control, .accordion') || el;
}

/**
 * Show only the controls the current show uses.
 *
 * Hiding rather than disabling: a disabled Shot in the Dark still tells the
 * reader a house might have one. saveConfig() reads the DOM, so hidden inputs
 * keep their values and switching back restores the season unchanged.
 */
export function applyFormatScope() {
  if (typeof document === 'undefined') return;
  const fmt = seasonFormat(seasonConfig);
  const show = (el, on) => { if (el) el.style.display = on ? '' : 'none'; };

  for (const [key, formats] of Object.entries(CONFIG_SCOPE.accordions)) {
    const body = _g(`acc-body-${key}`);
    show(body?.closest('.accordion'), formats.includes(fmt));
  }
  for (const [id, formats] of Object.entries(CONFIG_SCOPE.fields)) {
    const el = _g(id);
    show(el && _scopeHost(el), formats.includes(fmt));
  }
  for (const [id, formats] of Object.entries(CONFIG_SCOPE.sections)) {
    show(_g(id), formats.includes(fmt));
  }
  if (fmt === 'big-brother') qsOnHouseOptionChange();

  // The jury slider is shared by both shows but not NAMED by both — a house
  // does not send you to a Council — and in a house it also reports the week
  // the jury opens. Neither is a visibility question, so scoping does not cover
  // it; the label has to be redrawn whenever the show changes.
  window.updateSlider?.('jury');

  _placeRomance(fmt);
  renderHouseStructure();
}

/**
 * House options that only matter once another one is on.
 *
 * "Stops with this many left" is meaningless while the three-nominee mode is
 * off, and a dead number field invites the reader to work out whether it does
 * something. Called on change and on render.
 */
export function qsOnHouseOptionChange() {
  if (typeof document === 'undefined') return;
  const mode = _g('cfg-bb-safety')?.value || 'off';
  const stops = _g('cfg-bb-safety-stops');
  const host = stops && stops.closest('.form-group');
  if (host) host.style.display = mode === 'off' ? 'none' : '';
  // The Block Buster traditionally runs to six; follow that unless the reader
  // has already moved the number themselves.
  if (stops && mode !== 'off' && !stops.dataset.touched) stops.value = 6;
  // Likewise: how many go on slop is meaningless with slop switched off.
  const hnCount = _g('cfg-bb-havenot-count')?.closest('.form-group');
  if (hnCount) hnCount.style.display = (_g('cfg-bb-havenots')?.value || 'twist') === 'off' ? 'none' : '';

  if (stops && !stops._wired) {
    stops._wired = true;
    stops.addEventListener('input', () => { stops.dataset.touched = '1'; });
  }
}

/**
 * Romance belongs to both shows, so it moves rather than duplicating.
 *
 * It was the only thing keeping FORMATS & TWISTS alive in a house — one
 * accordion under a heading advertising tribe swaps and idols. Rather than
 * keep a second copy of the control (and a second source of truth), the single
 * accordion is moved into House Options for Big Brother and put back exactly
 * where it came from for Total Drama.
 */
let _romanceHome = null;
function _placeRomance(fmt) {
  const acc = _g('acc-body-romance')?.closest('.accordion');
  if (!acc) return;
  if (!_romanceHome) _romanceHome = { parent: acc.parentNode, next: acc.nextSibling };
  const houseBody = _g('bb-options-body');
  if (fmt === 'big-brother' && houseBody) {
    if (acc.parentNode !== houseBody) houseBody.appendChild(acc);
  } else if (_romanceHome.parent && acc.parentNode !== _romanceHome.parent) {
    _romanceHome.parent.insertBefore(acc, _romanceHome.next);
  }
}

/**
 * The house season, drawn as a chain.
 *
 * Same visual language as the Total Drama blueprint line, because it answers
 * the same question — what is this season going to be — and a house should not
 * get a worse answer for having less to configure.
 */
export function renderHouseStructure() {
  const host = _g('bb-structure');
  if (!host) return;
  if (seasonFormat(seasonConfig) !== 'big-brother') { host.innerHTML = ''; host.style.display = 'none'; return; }
  host.style.display = '';
  const segs = houseStructure(seasonConfig, _players().length);
  host.innerHTML = `<div class="bbst">
    <div class="bbst-title">This season</div>
    <div class="bbst-chain">${segs.map(s => `<span class="bbst-seg ${s.ok ? '' : 'bad'}"${
      s.why ? ` title="${String(s.why).replace(/"/g, '&quot;')}"` : ''}>${s.label}</span>`).join('')}</div>
    ${segs.filter(s => !s.ok && s.why).map(s => `<div class="bbst-why">${s.why}</div>`).join('')}
  </div>`;
}

/** The controls a given show uses — exported so the scoping can be tested. */
export function configScopeFor(fmt) {
  const inFormat = ([, formats]) => formats.includes(fmt);
  return {
    accordions: Object.entries(CONFIG_SCOPE.accordions).filter(inFormat).map(([k]) => k),
    fields: Object.entries(CONFIG_SCOPE.fields).filter(inFormat).map(([k]) => k),
    sections: Object.entries(CONFIG_SCOPE.sections).filter(inFormat).map(([k]) => k),
  };
}

/**
 * Rebuild the venue dropdown for the show being designed.
 *
 * These used to be five hard-coded Total Drama options in the HTML, so a house
 * season was asked to choose between a summer camp and a film lot. The list is
 * owned by settings.js and scoped by format; the current value is kept if the
 * new show has it and reset to that show's default if it does not.
 */
export function renderSettingOptions() {
  const el = _g('cfg-setting');
  if (!el) return;
  const fmt = seasonFormat(seasonConfig);
  const ids = settingsForFormat(fmt);
  // Read the saved setting, not the <select>'s current value: this runs during
  // boot too, and at that point the dropdown is still on its HTML default.
  const prev = seasonConfig?.setting || el.value;
  el.innerHTML = ids.map(id => {
    const s = SEASON_SETTINGS[id] || {};
    return `<option value="${id}">${s.emoji || ''} ${s.label || id}${s.blurb ? ` — ${s.blurb.split(/[.—]/)[0].trim()}` : ''}</option>`;
  }).join('');
  el.value = ids.includes(prev) ? prev : defaultSettingFor(fmt);
  if (el.value !== prev) window.saveConfig?.();
}

export function qsApplyPreset(name) { applyQuickPreset(name); }

// Writes the preset through the legacy DOM inputs + saveConfig (one source of
// truth), seeds twistSchedule for Chaos, then re-renders.
export function applyQuickPreset(name) {
  const N = _players().length;
  const { config, twists, preset } = presetConfigFor(name, N);
  if (typeof window !== 'undefined') window._qsApplyingPreset = true;
  try {
    const setVal = (id, v) => { const el = _g(id); if (el && v != null) el.value = v; };
    const setChk = (id, v) => { const el = _g(id); if (el && v != null) el.checked = !!v; };

    if ('teams' in config) { setVal('cfg-teams', config.teams); window.updateSlider?.('teams'); }
    if ('mergeAt' in config) { setVal('cfg-merge', config.mergeAt); window.updateSlider?.('merge'); }
    if ('jurySize' in config) { setVal('cfg-jury', config.jurySize); window.updateSlider?.('jury'); }
    if ('finaleSize' in config) { setVal('cfg-finale', config.finaleSize); window.updateSlider?.('finale'); }
    if ('days' in config) setVal('cfg-days', config.days);
    if ('setting' in config) setVal('cfg-setting', config.setting);
    if ('romance' in config) setVal('cfg-romance', config.romance);
    if ('aftermath' in config) setVal('cfg-aftermath', config.aftermath);
    if ('fanVoteFrequency' in config) setVal('cfg-fan-vote-frequency', config.fanVoteFrequency);
    if ('mole' in config) setVal('cfg-mole', config.mole);
    if ('riReentryAt' in config) setVal('cfg-ri-reentry', config.riReentryAt);
    if ('ri' in config) setChk('cfg-ri', config.ri);
    if ('journey' in config) setChk('cfg-journey', config.journey);
    if ('qem' in config) setChk('cfg-qem', config.qem);
    if ('shotInDark' in config) setChk('cfg-sid', config.shotInDark);
    if ('idolRehide' in config) setChk('cfg-idol-rehide', config.idolRehide);

    // Chaos twist seeding — set on the live config object; saveConfig preserves
    // twistSchedule verbatim from it.
    if (twists) { const cfg = _cfg(); if (cfg) cfg.twistSchedule = twists; }

    // Finale format last: applies the size lock + saves.
    if ('finaleFormat' in config) {
      setVal('cfg-finale-format', config.finaleFormat);
      window.onFinaleFormatChange?.();
    }
    window.saveConfig?.();
    window.renderConfig?.(); // re-sync every legacy display (sliders, RI panel, timeline)
  } finally {
    if (typeof window !== 'undefined') window._qsApplyingPreset = false;
  }

  if (typeof window !== 'undefined') {
    window._qsPreset = preset;
    try { localStorage.setItem('simulator_qsPreset', preset); } catch {}
  }
  renderQuickSetup();
}

export function qsSetMode(mode) {
  if (typeof window !== 'undefined') {
    window._qsMode = mode;
    try { localStorage.setItem('simulator_qsMode', mode); } catch {}
  }
  renderQuickSetup();
}

export function qsGoCast() { window.showTab?.('cast'); }

// Toggle a season objective on/off. protect-favorite carries a target player.
export function qsToggleObjective(id) {
  const objs = _qsObjectives();
  const idx = objs.findIndex(o => o.id === id);
  if (idx >= 0) objs.splice(idx, 1);
  else objs.push(id === 'protect-favorite' ? { id, target: '' } : { id });
  _reapplyObjectives();
  renderQuickSetup(); // rebuild to show/hide the favorite dropdown
}
export function qsSetObjectiveTarget() {
  const sel = _g('qs-obj-target'); if (!sel) return;
  const pf = _qsObjectives().find(o => o.id === 'protect-favorite');
  if (pf) pf.target = sel.value;
  _reapplyObjectives();
}

export function qsStartSeason() {
  _reapplyObjectives(); // defensive: ensure objectives are on the config before launch
  const gs = _gs();
  if (gs && gs.initialized) { window.showTab?.('run'); return; }
  const rows = validateQuickSetup(_cfg(), _players());
  if (rows.some(r => !r.ok)) { _updateDynamic(); return; }
  window.showTab?.('run');
}

// ══════════════════════════════════════════════════════════════════════
// CSS (injected once)
// ══════════════════════════════════════════════════════════════════════

function _injectCSS() {
  if (typeof document === 'undefined' || document.getElementById('quick-setup-css')) return;
  const style = document.createElement('style');
  style.id = 'quick-setup-css';
  style.textContent = QS_CSS;
  document.head.appendChild(style);
}

const QS_CSS = `
/* Block layout for the surface — ONLY while the setup tab is the ACTIVE tab.
   Without the .active guard this ID rule outranks the global
   .tab-content { display:none } and bleeds the setup surface onto every tab
   (Hub, Franchise, …). */
#tab-setup.tab-content.active.quick-setup-active { display:block; overflow-y:auto; scrollbar-gutter:stable; }
/* When Quick mode owns the surface, the legacy Advanced Production panels hide. */
#tab-setup.qs-hide-legacy > .setup-subnav,
#tab-setup.qs-hide-legacy > .setup-panel { display:none !important; }
/* The quick panel must never stack on top of legacy content when the takeover
   class is absent (escape hatch / not yet rendered). */
#tab-setup:not(.quick-setup-active) #quick-setup { display:none !important; }
/* An author display rule on .qs-body would override [hidden]'s UA display:none —
   this keeps the quick body hidden in Advanced mode. */
.qs-body[hidden] { display:none !important; }

#quick-setup { color:var(--text); max-width:1100px; margin:0 auto; padding:6px 14px 80px; }
/* In Advanced mode the quick body is hidden, so #quick-setup is only its
   header — and the 80px of bottom padding meant for the body became a large
   empty band above the legacy sub-nav. Collapse it when the body isn't shown. */
#tab-setup:not(.qs-hide-legacy) #quick-setup { padding-bottom:0; }
#tab-setup:not(.qs-hide-legacy) .qs-header { margin-bottom:14px; }
.qs-header { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap;
  padding:14px 0 16px; border-bottom:1px solid var(--border); margin-bottom:20px; }
.qs-title-wrap { display:flex; flex-direction:column; gap:3px; }
.qs-title { font-family:var(--font-display,sans-serif); font-size:28px; letter-spacing:.5px; margin:0; text-transform:uppercase; }
.qs-sub { font-size:12px; color:var(--muted); }
.qs-modetoggle { display:inline-flex; border:1px solid var(--border); border-radius:9px; overflow:hidden; background:var(--surface); }
.qs-modebtn { background:transparent; color:var(--muted); border:0; padding:8px 20px; font-size:13px; cursor:pointer;
  font-family:inherit; font-weight:600; letter-spacing:.3px; }
.qs-modebtn.active { background:var(--surface2); color:var(--text); }
.qs-modebtn:hover { color:var(--text); }

.qs-body { display:flex; flex-direction:column; gap:16px; }
.qs-card { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:18px 18px 20px; }
.qs-card-head { display:flex; align-items:center; gap:9px; margin-bottom:15px; flex-wrap:wrap; }
.qs-card-head h3 { font-family:var(--font-display,sans-serif); font-size:15px; margin:0; text-transform:uppercase; letter-spacing:.6px; }
.qs-card-icon { color:var(--accent-gold,#f0c040); font-size:14px; }
.qs-card-hint { font-size:11px; color:var(--muted); margin-left:auto; }

.qs-grid2 { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
.qs-field { display:flex; flex-direction:column; gap:5px; }
.qs-field-wide { grid-column:span 2; }
.qs-label { font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:var(--muted); }
.qs-input { background:var(--surface2); color:var(--text); border:1px solid var(--border); border-radius:8px;
  padding:9px 11px; font-size:14px; font-family:inherit; width:100%; }
.qs-input:focus { outline:none; border-color:var(--accent,#10b981); }

/* Preset picker */
.qs-presets { display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:11px; }
.qs-preset { display:flex; flex-direction:column; align-items:flex-start; gap:5px; text-align:left; cursor:pointer;
  background:var(--surface2); border:1px solid var(--border); border-radius:12px; padding:15px 14px; font-family:inherit;
  transition:transform .12s var(--ease-broadcast,ease), border-color .12s ease, box-shadow .12s ease; }
.qs-preset:hover { transform:translateY(-2px); border-color:var(--muted); }
.qs-preset.active { border-color:var(--accent-gold,#f0c040); box-shadow:0 0 0 1px var(--accent-gold,#f0c040) inset, 0 8px 22px rgba(0,0,0,.28); }
.qs-preset-icon { font-size:22px; }
.qs-preset-name { font-weight:700; font-size:15px; color:var(--text); }
.qs-preset-tag { font-size:11px; color:var(--muted); line-height:1.3; }
/* The Show row sits above the preset row and picks the game itself, so it reads
   a step louder than the flavour presets underneath it. */
.qs-shows { grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); }
.qs-show.active { border-color:var(--accent,#4db6ac); box-shadow:0 0 0 1px var(--accent,#4db6ac) inset, 0 8px 22px rgba(0,0,0,.28); }
.qs-show-warn { margin-top:11px; padding:9px 12px; border-radius:8px; font-size:12px; line-height:1.45;
  color:var(--text); background:rgba(240,192,64,.10); border:1px solid rgba(240,192,64,.42); }
.qs-show-warn strong { color:var(--accent-gold,#f0c040); }
.qs-preset-na { font-size:12px; color:var(--muted); line-height:1.5; }

/* Structure */
/* What the jury size actually buys you, said under the control that sets it. */
.qs-housenote { margin-top:12px; padding:9px 12px; border-radius:8px; font-size:12px; line-height:1.5;
  color:var(--muted); background:var(--surface2); border:1px solid var(--border); }
.qs-housenote strong { color:var(--text); }
.qs-housenote.bad { color:var(--text); background:rgba(248,81,73,.10); border-color:rgba(248,81,73,.42); }
.qs-caststrip { display:flex; align-items:baseline; gap:8px; padding:10px 12px; background:var(--surface2);
  border:1px solid var(--border); border-radius:10px; margin-bottom:14px; }
.qs-cast-count { font-family:var(--font-display,sans-serif); font-size:24px; color:var(--text); }
.qs-cast-word { font-size:12px; color:var(--muted); }
.qs-link { margin-left:auto; background:transparent; border:0; color:var(--accent,#10b981); font-size:12px; cursor:pointer;
  font-family:inherit; font-weight:600; }
.qs-link:hover { text-decoration:underline; }
.qs-steppers { display:flex; flex-direction:column; gap:11px; margin-bottom:15px; }
.qs-stepper { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.qs-stepper.disabled { opacity:.5; }
.qs-step-label { font-size:13px; color:var(--text); flex:1; min-width:140px; }
.qs-step-ctrl { display:flex; align-items:center; gap:9px; }
.qs-step-btn { width:28px; height:28px; border-radius:7px; border:1px solid var(--border); background:var(--surface2);
  color:var(--text); font-size:16px; cursor:pointer; line-height:1; font-family:inherit; }
.qs-step-btn:hover:not(:disabled) { border-color:var(--accent,#10b981); }
.qs-step-btn:disabled { cursor:not-allowed; }
.qs-range { width:140px; accent-color:var(--accent,#10b981); }
.qs-step-val { font-family:var(--font-mono,monospace); font-size:15px; min-width:26px; text-align:right; color:var(--text); }

/* Objectives */
.qs-obj-chips { display:flex; flex-wrap:wrap; gap:9px; }
.qs-obj-chip { background:var(--surface2); color:var(--muted); border:1px solid var(--border); border-radius:999px;
  padding:8px 15px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit;
  transition:border-color .12s ease, color .12s ease, background .12s ease; }
.qs-obj-chip:hover { border-color:var(--muted); color:var(--text); }
.qs-obj-chip.active { border-color:var(--accent-gold,#f0c040); color:var(--text);
  background:rgba(240,192,64,.12); box-shadow:0 0 0 1px var(--accent-gold,#f0c040) inset; }
.qs-obj-target { margin-top:13px; }

/* Blueprint */
.qs-blueprint { display:flex; align-items:center; gap:7px; flex-wrap:wrap; font-family:var(--font-mono,monospace); }
.qs-bp-seg { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; border-radius:20px;
  background:var(--surface2); border:1px solid var(--border); font-size:13px; color:var(--text); }
.qs-bp-bad { border-color:#e0555f; color:#f2949a; background:rgba(224,85,95,.1); }
.qs-bp-x { font-weight:700; color:#e0555f; }
.qs-bp-arrow { color:var(--muted); font-size:14px; }

/* Ready check */
.qs-ready { display:flex; flex-direction:column; gap:7px; margin-bottom:18px; }
.qs-ready-row { display:flex; align-items:flex-start; gap:10px; padding:9px 12px; border-radius:9px;
  background:var(--surface2); border:1px solid var(--border); }
.qs-ready-mark { font-weight:700; font-size:14px; width:16px; text-align:center; flex-shrink:0; }
.qs-ready-msg { font-size:13px; color:var(--text); line-height:1.35; }
.qs-ready-ok .qs-ready-mark { color:var(--accent,#10b981); }
.qs-ready-warn { border-color:rgba(240,192,64,.4); }
.qs-ready-warn .qs-ready-mark { color:var(--accent-gold,#f0c040); }
.qs-ready-bad { border-color:#e0555f; background:rgba(224,85,95,.08); }
.qs-ready-bad .qs-ready-mark { color:#e0555f; }

.qs-start-wrap { display:flex; flex-direction:column; align-items:center; gap:8px; }
.qs-start { background:var(--accent,#10b981); color:#04120b; border:0; border-radius:11px; padding:15px 42px;
  font-size:17px; font-weight:800; letter-spacing:.4px; cursor:pointer; font-family:inherit; width:100%; max-width:420px;
  transition:filter .12s ease, transform .12s ease; }
.qs-start:hover:not(:disabled) { filter:brightness(1.08); transform:translateY(-1px); }
.qs-start.disabled, .qs-start:disabled { background:var(--surface2); color:var(--muted); cursor:not-allowed; }
.qs-start-hub { background:var(--accent-gold,#f0c040); color:#1a1200; }
.qs-start-hint { font-size:11px; color:var(--muted); text-align:center; margin:0; }

@media (max-width:640px) {
  .qs-grid2 { grid-template-columns:1fr; }
  .qs-field-wide { grid-column:span 1; }
}
@media (prefers-reduced-motion:reduce) {
  .qs-preset, .qs-start { transition:none !important; }
  .qs-preset:hover, .qs-start:hover { transform:none; }
}
/* Light-theme legibility for the invalid states (they use fixed reds). */
@media (prefers-color-scheme:light) {
  .qs-bp-bad { color:#b3323b; }
  .qs-ready-bad .qs-ready-mark { color:#c13540; }
}
`;

// ══════════════════════════════════════════════════════════════════════
// SELF-REGISTER ON WINDOW
// (Belt-and-suspenders — main.js's module spread is the primary adoption.)
// ══════════════════════════════════════════════════════════════════════
if (typeof window !== 'undefined') {
  Object.assign(window, {
    renderQuickSetup, qsSetIdentity, qsStep, qsRange, qsFinaleFormat,
    qsApplyPreset, applyQuickPreset, qsSetMode, qsGoCast, qsStartSeason,
    qsToggleObjective, qsSetObjectiveTarget,
  });
}
