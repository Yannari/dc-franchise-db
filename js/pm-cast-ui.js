// ══════════════════════════════════════════════════════════════════════
// pm-cast-ui.js — the Villa view: the season, its options, every islander
// ══════════════════════════════════════════════════════════════════════
//
// Everything here is what js/pm/profile.js `resolveIslander` reads, written to
// `seasonConfig.pmSetup[name]` and nothing else. Every field is optional: a
// blank one rolls (intent, type, icks…) or takes the season's default
// (dialect), and a blank role takes the default split by cast order — so the
// panel never has to be filled in for a season to play. It is where the
// author's choices go when there are any (user: "cast setup, not season setup").
//
// It is one page, switched to from the Casting Room (Grid | Villa — user:
// "in another tab switchable, not at the bottom of the page"): a summary, the
// season as a strip of episodes, four option cards, and a card per islander.
//
// One delegated listener on the panel, and data attributes on every control,
// so an islander's name never goes into an inline handler (an apostrophe in a
// name would break the page).
import { players, seasonConfig, kinshipPairs } from './core.js';
import { minimumEpisodes } from './pm/schedule.js';
import { ROLES, INTENTS, PERSONAS, LOOK_TAGS, VIBES, ICKS, INTERESTS } from './pm/profile.js';
import { DIALECTS } from './pm/lines/dialect.js';
import { perfectMatchCastProblem, perfectMatchSeasonShape, perfectMatchRoles } from './pm-run.js';
import { playerAvatarUrl } from './players.js';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const words = s => String(s).replace(/-/g, ' ');
const ROLE_WORDS = { starter: 'Starter (night one)', bombshell: 'Bombshell', casa: 'Casa Amor' };
const ROLE_SHORT = { starter: 'Starter', bombshell: 'Bombshell', casa: 'Casa Amor' };

// How many of each a field keeps (the same caps resolveIslander applies).
const LIMIT = { 'type.looks': 3, 'type.vibes': 2, looks: 4, icks: 2, interests: 4, eyesOn: 3 };

// The die on each chip section (user: "a mini button to randomize it … when
// I'm lazy"): the same counts resolveIslander rolls for a blank field, written
// in as the author's pick so it shows and stays. Eyes-on is left to the hand:
// a crush drawn at random ignores who the islander is into.
const ROLL = {
  'type.looks': [LOOK_TAGS, 1, 3], 'type.vibes': [VIBES, 1, 2], looks: [LOOK_TAGS, 2, 3],
  icks: [ICKS, 1, 2], interests: [INTERESTS, 2, 4],
};
function rollField(field, current = []) {
  const [pool, lo, hi] = ROLL[field];
  let pick = [];
  // A reroll that lands on the same set is no reroll: try a few times.
  for (let t = 0; t < 6; t++) {
    const n = lo + Math.floor(Math.random() * (hi - lo + 1));
    pick = [...pool].sort(() => Math.random() - 0.5).slice(0, n);
    if (pick.slice().sort().join() !== [...current].sort().join()) break;
  }
  return pick;
}
const DIE = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><rect x="1.5" y="1.5" width="13" height="13" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>'
  + '<circle cx="5" cy="5" r="1.3" fill="currentColor"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/><circle cx="11" cy="11" r="1.3" fill="currentColor"/></svg>';
function sectionHead(name, field, label, current) {
  const has = Array.isArray(current) && current.length;
  return `<div class="pm-sec-head"><span class="pm-field-k">${esc(label)}</span>`
    + (ROLL[field] ? `<button type="button" class="pm-roll" data-name="${esc(name)}" data-roll="${field}" title="Randomize">${DIE}</button>` : '')
    + (has ? `<button type="button" class="pm-roll pm-clear" data-name="${esc(name)}" data-clear="${field}" title="Clear — leave it to the season">×</button>` : '')
    + '</div>';
}

const setupOf = name => ((seasonConfig.pmSetup ||= {})[name] ||= {});

function getPath(obj, path) { return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj); }
function setPath(obj, path, value) {
  const keys = path.split('.'); let o = obj;
  for (const k of keys.slice(0, -1)) o = (o[k] ||= {});
  if (value == null || value === '' || (Array.isArray(value) && !value.length)) delete o[keys[keys.length - 1]];
  else o[keys[keys.length - 1]] = value;
}

function select(name, field, options, current, blankLabel) {
  return `<select class="pm-select" data-name="${esc(name)}" data-field="${field}">
    <option value="">${esc(blankLabel)}</option>
    ${options.map(([v, label]) => `<option value="${esc(v)}"${v === current ? ' selected' : ''}>${esc(label)}</option>`).join('')}
  </select>`;
}

function chips(name, field, options, current = []) {
  const on = new Set(current);
  return `<div class="pm-cs-chips">${options.map(([v, label]) =>
    `<label class="pm-cs-chip${on.has(v) ? ' on' : ''}"><input type="checkbox" data-name="${esc(name)}" data-field="${field}" data-val="${esc(v)}"${
      on.has(v) ? ' checked' : ''}>${esc(label)}</label>`).join('')}</div>`;
}

/**
 * The counts (Cast → Villa) and the length (Setup → Villa options). How each
 * dumping plays is booked on the Season Timeline like every show's twists.
 */
export function renderPerfectMatchShape() {
  if (typeof document === 'undefined') return;
  const shape = perfectMatchSeasonShape();
  // Starters / Bombshells / Casa Amor: blank is automatic, and the
  // placeholder says what automatic comes to with the cast as it stands.
  const COUNTS = [['cfg-pm-starters', 'starters'], ['cfg-pm-bombshells', 'bombshells'], ['cfg-pm-casa', 'casa']];
  const counts = seasonConfig.pmRoleCounts || {};
  for (const [id, key] of COUNTS) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.placeholder = String(shape[key]);
    const note = el.parentElement?.querySelector('.pm-count-note');
    if (note) {
      note.dataset.base ||= note.textContent;
      note.innerHTML = `${esc(note.dataset.base)} · ${Number.isInteger(counts[key]) ? 'set' : '<span class="pm-auto">automatic</span>'}`;
    }
    if (document.activeElement !== el) el.value = Number.isInteger(counts[key]) ? String(counts[key]) : '';
    if (!el.dataset.wired) {
      el.dataset.wired = '1';
      el.addEventListener('change', () => {
        const v = el.value === '' ? null : Math.max(0, Math.round(Number(el.value)));
        const next = { ...(seasonConfig.pmRoleCounts || {}) };
        if (v == null || Number.isNaN(v)) delete next[key]; else next[key] = v;
        seasonConfig.pmRoleCounts = next;
        try { window.saveConfig?.(); } catch { /* kept on seasonConfig */ }
        renderPerfectMatchCastSetup();
        try { window.renderTimeline?.(); } catch { /* the timeline is on another tab */ }
      });
    }
  }
  const len = document.getElementById('cfg-pm-episodes');
  if (len) {
    len.placeholder = `Automatic (${shape.auto})`;
    len.min = String(minimumEpisodes(shape.casa));
    if (document.activeElement !== len) len.value = Number(seasonConfig.pmEpisodes) > 0 ? String(seasonConfig.pmEpisodes) : '';
    const hint = document.getElementById('pm-episodes-hint');
    if (hint) hint.textContent = `This cast makes ${shape.auto} episodes (${shape.starters} starters, ${shape.bombshells} bombshells, `
      + `${shape.casa} Casa Amor arrivals). Set a number to change it: shorter packs the arrivals into fewer nights, `
      + `longer adds quiet recoupling weeks. The shortest a season can be is ${minimumEpisodes(shape.casa)}.`
      + (shape.episodes && shape.episodes < shape.auto
        ? ` At ${shape.episodes}, there are fewer dumping nights than this cast needs: whoever is left over goes at the semi-final, several at once.` : '');
  }
  if (len && !len.dataset.wired) {
    len.dataset.wired = '1';
    len.addEventListener('change', () => {
      const v = Math.round(Number(len.value));
      seasonConfig.pmEpisodes = v > 0 ? v : null;
      try { window.saveConfig?.(); } catch { /* kept on seasonConfig */ }
      renderPerfectMatchCastSetup();
      // The Season Timeline is this season's episodes: a new length redraws it.
      try { window.renderTimeline?.(); } catch { /* the timeline is on another tab */ }
    });
  }
}

/** The summary chips, from the same answer the season plays. */
function renderStudioHead(shape, problem, total) {
  const sum = document.getElementById('pm-studio-summary');
  if (sum) {
    const chip = (n, k, cls = '') => `<span class="pm-chip ${cls}"><b>${n}</b> ${esc(k)}</span>`;
    sum.innerHTML = [
      chip(total, total === 1 ? 'islander' : 'islanders'),
      chip(shape.starters, 'starters', 'r-starter'), chip(shape.bombshells, 'bombshells', 'r-bombshell'),
      chip(shape.casa, 'Casa Amor', 'r-casa'), chip(shape.schedule.length, 'episodes'),
    ].join('') + `<div class="pm-status ${problem ? 'bad' : 'ok'}">${problem
      ? `Can't start yet: ${esc(problem)}.` : 'Ready to play'}</div>`;
  }
}


/**
 * Who this islander already knows: read from Setup → Relationships, which is
 * where twins, siblings, best friends and exes are set (pm/kin.js reads the
 * same rows). The card used to have its own "An ex in the villa"; an ex set
 * there still counts, and shows here.
 */
function knownHtml(n, cast, s) {
  const inCast = new Set(cast);
  const rows = kinshipPairs().filter(r => (r.a === n || r.b === n) && inCast.has(r.a) && inCast.has(r.b))
    .map(r => [r.a === n ? r.b : r.a, r.label]);
  if (s.ex && inCast.has(s.ex) && !rows.some(([o]) => o === s.ex)) rows.push([s.ex, 'Exes']);
  const list = rows.length ? rows.map(([o, l]) => `<span class="pm-known"><b>${esc(o)}</b> · ${esc(l)}</span>`).join('')
    : '<span class="pm-known pm-known-none">Nobody in the villa</span>';
  return `<div class="pm-field pm-field-known"><span class="pm-field-k">Knows before the villa</span><div class="pm-known-list">${list}</div>
    <button type="button" class="pm-known-go" onclick="showSetupPanel('rels')">Twins, siblings, best friends, exes: set in Setup → Relationships</button></div>`;
}

function roleSwitch(name, set, auto) {
  const opt = (v, label) => `<button type="button" class="pm-seg${(set || '') === v ? ' on' : ''}" data-name="${esc(name)}" data-field="role" data-val="${v}">${esc(label)}</button>`;
  // Auto is pressed; the role it comes to is marked underneath, not pressed.
  const btns = ['starter', 'bombshell', 'casa'].map(r => opt(r, ROLE_SHORT[r])
    .replace('class="pm-seg"', `class="pm-seg${!set && r === auto ? ' auto' : ''}"`)).join('');
  return `<div class="pm-segs" role="group" aria-label="Role" title="${set ? '' : `Auto: ${esc(ROLE_WORDS[auto])}`}">${opt('', 'Auto')}${btns}</div>`;
}

/** Draw the Villa view. Safe to call when the page has no panel (tests, other shows). */
export function renderPerfectMatchCastSetup() {
  renderPerfectMatchShape();
  const host = typeof document !== 'undefined' && document.getElementById('pm-cast-setup');
  if (!host) return;
  // The season default's options come from the registry of dialects, once.
  const def = document.getElementById('cfg-pm-dialect');
  if (def && !def.options.length) {
    def.innerHTML = Object.entries(DIALECTS).filter(([k]) => k !== 'esl')
      .map(([k, d]) => `<option value="${esc(k)}">${esc(d.label)}</option>`).join('');
    def.value = seasonConfig.pmDialect || 'uk';
  }
  const cast = (players || []).map(p => p.name).filter(Boolean);
  const shape = perfectMatchSeasonShape();
  const problem = cast.length ? perfectMatchCastProblem(cast, Object.fromEntries(cast.map(n => [n, { ...setupOf(n) }]))) : 'there are no islanders yet';
  renderStudioHead(shape, problem, cast.length);
  if (!cast.length) { host.innerHTML = '<div class="pm-empty">Add islanders in the Grid view first.</div>'; return; }
  const dialects = Object.entries(DIALECTS).filter(([k]) => k !== 'esl').map(([k, d]) => [k, d.label]);
  const personas = PERSONAS.map(([id]) => [id, words(id)]);
  // What Auto means for each card: the counts above, or the automatic split.
  const autoRoles = perfectMatchRoles(cast, Object.fromEntries(cast.map(n => [n, setupOf(n)])));
  const cards = cast.map((n, i) => {
    const s = setupOf(n);
    const p = players.find(x => x.name === n) || {};
    const others = cast.filter(o => o !== n).map(o => [o, o]);
    const role = s.role || autoRoles[i];
    const set = ['dialect', 'intent', 'persona'].filter(k => s[k]).length
      + ['type', 'looks', 'icks', 'interests', 'eyesOn'].filter(k => s[k] && (!Array.isArray(s[k]) || s[k].length)).length;
    let avatar = '';
    try { avatar = playerAvatarUrl(p.name ? p : n); } catch { avatar = ''; }
    return `<article class="pm-isl r-${role}">
      <div class="pm-isl-top">
        <div class="pm-isl-face">${avatar ? `<img src="${esc(avatar)}" alt="" loading="lazy" onerror="this.remove()">` : ''}<span>${esc(n.slice(0, 1))}</span></div>
        <div class="pm-isl-id"><div class="pm-isl-name">${esc(n)}</div>
          <div class="pm-isl-meta">${esc(words(p.archetype || ''))}${p.gender ? ` · ${p.gender === 'f' ? 'woman' : p.gender === 'm' ? 'man' : ''}` : ''}${set ? ` · <span class="pm-isl-set">${set} set</span>` : ''}</div></div>
      </div>
      ${roleSwitch(n, s.role, autoRoles[i])}
      <div class="pm-isl-fields">
        <label class="pm-field"><span class="pm-field-k">From</span>${select(n, 'dialect', dialects, s.dialect, 'Default')}</label>
        <label class="pm-field"><span class="pm-field-k">Looking for</span>${select(n, 'intent', INTENTS.map(x => [x, words(x)]), s.intent, 'Rolled')}</label>
        <label class="pm-field"><span class="pm-field-k">Persona</span>${select(n, 'persona', personas, s.persona, 'Auto')}</label>
      </div>
      <details class="pm-isl-more"><summary>Type, icks, interests, eyes on, who they know</summary>
        <div class="pm-isl-grid">
          <div class="pm-sec-head pm-roll-all-row"><button type="button" class="pm-roll pm-roll-all" data-name="${esc(n)}" data-roll="*">${DIE} Roll all</button></div>
          <div>${sectionHead(n, 'type.looks', 'Their type — looks, up to 3', getPath(s, 'type.looks'))}${chips(n, 'type.looks', LOOK_TAGS.map(x => [x, words(x)]), getPath(s, 'type.looks'))}</div>
          <div>${sectionHead(n, 'type.vibes', 'Their type — vibe, up to 2', getPath(s, 'type.vibes'))}${chips(n, 'type.vibes', VIBES.map(x => [x, words(x)]), getPath(s, 'type.vibes'))}</div>
          <div>${sectionHead(n, 'looks', 'Their own looks', s.looks)}${chips(n, 'looks', LOOK_TAGS.map(x => [x, words(x)]), s.looks)}</div>
          <div>${sectionHead(n, 'icks', 'Icks — up to 2', s.icks)}${chips(n, 'icks', ICKS.map(x => [x, words(x)]), s.icks)}</div>
          <div>${sectionHead(n, 'interests', 'Interests — 2 to 4', s.interests)}${chips(n, 'interests', INTERESTS.map(x => [x, words(x)]), s.interests)}</div>
          <div>${sectionHead(n, 'eyesOn', "Eyes on — who they've come in for, up to 3", s.eyesOn)}${chips(n, 'eyesOn', others, s.eyesOn)}</div>
          ${knownHtml(n, cast, s)}
        </div>
      </details>
    </article>`;
  }).join('');
  // Keep open "more" drawers open across the re-render a change triggers.
  const open = new Set([...host.querySelectorAll('details.pm-isl-more[open]')].map(d => d.closest('.pm-isl')?.querySelector('.pm-isl-name')?.textContent));
  host.innerHTML = `<div class="pm-isls">${cards}</div>`;
  if (open.size) host.querySelectorAll('.pm-isl').forEach(c => { if (open.has(c.querySelector('.pm-isl-name')?.textContent)) c.querySelector('details')?.setAttribute('open', ''); });
  if (!host.dataset.wired) {
    host.dataset.wired = '1';
    host.addEventListener('change', onChange);
    host.addEventListener('click', ev => {
      const r = ev.target?.closest?.('.pm-roll');
      if (r) {
        ev.preventDefault();
        const s = setupOf(r.dataset.name);
        if (r.dataset.clear) setPath(s, r.dataset.clear, null);
        else for (const f of r.dataset.roll === '*' ? Object.keys(ROLL) : [r.dataset.roll]) setPath(s, f, rollField(f, getPath(s, f)));
        if (!Object.keys(s.type || {}).length) delete s.type;
        try { window.saveConfig?.(); } catch { /* the panel keeps its own state */ }
        renderPerfectMatchCastSetup();
        return;
      }
      const b = ev.target?.closest?.('.pm-seg');
      if (!b) return;
      const s = setupOf(b.dataset.name);
      setPath(s, 'role', b.dataset.val || null);
      try { window.saveConfig?.(); } catch { /* the panel keeps its own state */ }
      renderPerfectMatchCastSetup();
    });
  }
}

function onChange(ev) {
  const el = ev.target;
  const name = el?.dataset?.name, field = el?.dataset?.field;
  if (!name || !field) return;
  const s = setupOf(name);
  if (el.type === 'checkbox') {
    const cur = new Set(getPath(s, field) || []);
    if (el.checked) cur.add(el.dataset.val); else cur.delete(el.dataset.val);
    const list = [...cur].slice(0, LIMIT[field] || 99);
    setPath(s, field, list);
  } else {
    setPath(s, field, el.value || null);
  }
  if (!Object.keys(s.type || {}).length) delete s.type;
  try { window.saveConfig?.(); } catch { /* the panel keeps its own state */ }
  renderPerfectMatchCastSetup();
}
