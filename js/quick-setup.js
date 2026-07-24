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

import { TWIST_CATALOG, seasonConfig, players } from './core.js';

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
  const segs = [];

  segs.push({
    label: `${N} player${N === 1 ? '' : 's'}`,
    ok: N >= 4,
    why: N >= 4 ? undefined : 'Cast at least 4 players',
  });

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

  // ── tribes ──
  {
    if (teams < 2) {
      rows.push({ key: 'tribes', ok: true, msg: 'Single starting tribe — no tribe assignment needed.' });
    } else {
      const assigned = playerList.filter(p => p.tribe);
      const groups = {};
      assigned.forEach(p => (groups[p.tribe] ??= []).push(p));
      const tribeNames = Object.keys(groups);
      const unassigned = N - assigned.length;
      let ok = true, msg = `${teams} tribes, evenly split.`;
      if (unassigned > 0) {
        ok = false;
        msg = `${unassigned} player${unassigned === 1 ? '' : 's'} not assigned to a tribe — set tribes in the Cast room.`;
      } else if (tribeNames.length !== teams) {
        ok = false;
        msg = `Cast uses ${tribeNames.length} tribe${tribeNames.length === 1 ? '' : 's'} but setup expects ${teams} — align them.`;
      } else {
        const sizes = tribeNames.map(t => groups[t].length);
        if (Math.min(...sizes) === 0) { ok = false; msg = 'A tribe has no members.'; }
        else if (Math.max(...sizes) - Math.min(...sizes) > 1) { ok = false; msg = 'Tribe sizes differ by more than 1 — rebalance in the Cast room.'; }
      }
      rows.push({ key: 'tribes', ok, msg });
    }
  }

  // ── merge ──
  {
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
      const finaleSize = 4;
      out.config = {
        teams: N >= 18 ? 3 : 2,
        mergeAt: mergeMid,
        jurySize: clamp(9, 3, Math.max(3, N - finaleSize)),
        finaleSize,
        finaleFormat: 'fire-making',
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

function _presetCardsHTML() {
  const active = _preset();
  const cards = PRESETS.map(p => `
    <button class="qs-preset${active === p.id ? ' active' : ''}" id="qs-preset-${p.id}"
      onclick="qsApplyPreset('${p.id}')" aria-pressed="${active === p.id}">
      <span class="qs-preset-icon">${p.icon}</span>
      <span class="qs-preset-name">${esc(p.name)}</span>
      <span class="qs-preset-tag">${esc(p.tag)}</span>
    </button>`).join('');
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

function _structureCardHTML() {
  const cfg = _cfg();
  const N = _players().length;
  return `<section class="qs-card">
    <div class="qs-card-head"><span class="qs-card-icon">▚</span><h3>Structure</h3></div>
    <div class="qs-caststrip">
      <span class="qs-cast-count">${N}</span>
      <span class="qs-cast-word">player${N === 1 ? '' : 's'} cast</span>
      <button class="qs-link" onclick="qsGoCast()">Edit cast →</button>
    </div>
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

function _readyRowsHTML() {
  const rows = validateQuickSetup(_cfg(), _players());
  return rows.map(r => {
    const state = r.ok ? (r.warn ? 'warn' : 'ok') : 'bad';
    const mark = r.ok ? (r.warn ? '!' : '✓') : '✗';
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
    ${_presetCardsHTML()}
    ${_structureCardHTML()}
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
  const bp = _g('qs-blueprint'); if (bp) bp.innerHTML = _blueprintInnerHTML();
  const rc = _g('qs-readycheck'); if (rc) rc.innerHTML = _readyRowsHTML();
  const sw = _g('qs-start-wrap'); if (sw) sw.innerHTML = _startBtnHTML();
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

export function qsStartSeason() {
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

/* Structure */
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
  });
}
