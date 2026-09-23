// ══════════════════════════════════════════════════════════════════════
// pm-cast-ui.js — each islander's cast setup, on the Setup tab
// ══════════════════════════════════════════════════════════════════════
//
// Everything here is what js/pm/profile.js `resolveIslander` reads, written to
// `seasonConfig.pmSetup[name]` and nothing else. Every field is optional: a
// blank one rolls (intent, type, icks…) or takes the season's default
// (dialect), and a blank role takes the default split by cast order — so the
// panel never has to be filled in for a season to play. It is where the
// author's choices go when there are any (user: "cast setup, not season setup").
//
// One delegated listener on the panel, and data attributes on every control,
// so an islander's name never goes into an inline handler (an apostrophe in a
// name would break the page).
import { players, seasonConfig, gs } from './core.js';
import { DUMP_DRAWS, PICK_LABELS, SLOT_NAMES, defaultRoleFor, minimumEpisodes } from './pm/schedule.js';
import { PERFECT_MATCH_FORMAT } from './shows.js';
import { perfectMatchScheduleFor } from './pm/season.js';
import { ROLES, INTENTS, PERSONAS, LOOK_TAGS, VIBES, ICKS, INTERESTS } from './pm/profile.js';
import { DIALECTS } from './pm/lines/dialect.js';
import { perfectMatchCastProblem, perfectMatchSeasonShape } from './pm-run.js';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const words = s => String(s).replace(/-/g, ' ');
const ROLE_WORDS = { starter: 'Starter (night one)', bombshell: 'Bombshell', casa: 'Casa Amor' };
// How many of each a field keeps (the same caps resolveIslander applies).
const LIMIT = { 'type.looks': 3, 'type.vibes': 2, looks: 4, icks: 2, interests: 4, eyesOn: 3 };

const setupOf = name => ((seasonConfig.pmSetup ||= {})[name] ||= {});

function getPath(obj, path) { return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj); }
function setPath(obj, path, value) {
  const keys = path.split('.'); let o = obj;
  for (const k of keys.slice(0, -1)) o = (o[k] ||= {});
  if (value == null || value === '' || (Array.isArray(value) && !value.length)) delete o[keys[keys.length - 1]];
  else o[keys[keys.length - 1]] = value;
}

function select(name, field, options, current, blankLabel) {
  return `<select class="form-input pm-cs-sel" data-name="${esc(name)}" data-field="${field}">
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
 * VILLA OPTIONS: the season's length (automatic from the cast, or set), and
 * one menu per drawn slot at THIS season's episode numbers. Random is the
 * default; a season in progress shows what each slot drew or aired as, and a
 * pick for an episode that already aired says it waits for its re-run.
 */
export function renderPerfectMatchShape() {
  const host = typeof document !== 'undefined' && document.getElementById('pm-shape');
  if (!host) return;
  const shape = perfectMatchSeasonShape();
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
  const picks = seasonConfig.pmPicks || {};
  const started = !!gs?.pm?.seed;
  const aired = new Map((gs?.episodeHistory || []).filter(r => r?.format === PERFECT_MATCH_FORMAT).map(r => [r.num, r]));
  const drawnBySlot = Object.fromEntries(started
    ? perfectMatchScheduleFor(gs.pm.seed, shape).filter(e => e.slot).map(e => [e.slot, e.dumpFormat]) : []);
  host.innerHTML = shape.schedule.filter(e => DUMP_DRAWS[e.slot]).map(e => {
    const opts = DUMP_DRAWS[e.slot];
    const row = aired.get(e.ep);
    const randomLabel = drawnBySlot[e.slot] ? `Random (this season drew: ${PICK_LABELS[drawnBySlot[e.slot]]})` : 'Random';
    const note = row
      ? (row.pm?.dumpFormat
        ? `Aired as: ${PICK_LABELS[row.pm.dumpFormat]}.${picks[e.slot] && picks[e.slot] !== row.pm.dumpFormat ? ' Re-run this episode to play your pick.' : ''}`
        : 'Aired with no vote: four couples or fewer were left.')
      : e.slot === 'semi' && picks.semi === 'ex-islanders' ? 'Needs five or more couples at the semi-final; with four, nobody is voted out.' : '';
    return `<div class="pm-cs-row"><div class="form-label">Episode ${e.ep} — ${esc(SLOT_NAMES[e.slot])}</div>
      <select class="form-input pm-cs-sel" data-pick="${esc(e.slot)}">
        <option value="">${esc(randomLabel)}</option>
        ${opts.map(([f]) => `<option value="${esc(f)}"${picks[e.slot] === f ? ' selected' : ''}>${esc(PICK_LABELS[f])}</option>`).join('')}
      </select>${note ? `<div class="hint hint-tight">${esc(note)}</div>` : ''}</div>`;
  }).join('');
  if (!host.dataset.wired) {
    host.dataset.wired = '1';
    host.addEventListener('change', ev => {
      const slot = ev.target?.dataset?.pick;
      if (!slot) return;
      const next = { ...(seasonConfig.pmPicks || {}) };
      if (ev.target.value) next[slot] = ev.target.value; else delete next[slot];
      seasonConfig.pmPicks = next;
      try { window.saveConfig?.(); } catch { /* the menu keeps its own state */ }
      renderPerfectMatchShape();
    });
  }
  if (len && !len.dataset.wired) {
    len.dataset.wired = '1';
    len.addEventListener('change', () => {
      const v = Math.round(Number(len.value));
      seasonConfig.pmEpisodes = v > 0 ? v : null;
      try { window.saveConfig?.(); } catch { /* kept on seasonConfig */ }
      renderPerfectMatchShape();
    });
  }
}

/** Draw the panel. Safe to call when the page has no panel (tests, other shows). */
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
  if (!cast.length) { host.innerHTML = '<div class="hint">Add islanders on the Cast tab first.</div>'; return; }
  const dialects = Object.entries(DIALECTS).filter(([k]) => k !== 'esl').map(([k, d]) => [k, d.label]);
  const personas = PERSONAS.map(([id]) => [id, words(id)]);
  const rows = cast.map((n, i) => {
    const s = setupOf(n);
    const others = cast.filter(o => o !== n).map(o => [o, o]);
    return `<div class="pm-cs-row">
      <div class="pm-cs-head">
        <strong class="pm-cs-name">${esc(n)}</strong>
        ${select(n, 'role', ROLES.map(r => [r, ROLE_WORDS[r]]), s.role, `Auto: ${ROLE_WORDS[defaultRoleFor(i, cast.length)]}`)}
        ${select(n, 'dialect', dialects, s.dialect, "From: season's default")}
        ${select(n, 'intent', INTENTS.map(x => [x, words(x)]), s.intent, 'Looking for: roll')}
        ${select(n, 'persona', personas, s.persona, 'Persona: from stats')}
      </div>
      <details class="pm-cs-more"><summary>Type, icks, interests, eyes on, ex</summary>
        <div class="pm-cs-grid">
          <div><div class="form-label">Their type (looks, up to 3)</div>${chips(n, 'type.looks', LOOK_TAGS.map(x => [x, words(x)]), getPath(s, 'type.looks'))}</div>
          <div><div class="form-label">Their type (vibe, up to 2)</div>${chips(n, 'type.vibes', VIBES.map(x => [x, words(x)]), getPath(s, 'type.vibes'))}</div>
          <div><div class="form-label">Their own looks</div>${chips(n, 'looks', LOOK_TAGS.map(x => [x, words(x)]), s.looks)}</div>
          <div><div class="form-label">Icks (up to 2)</div>${chips(n, 'icks', ICKS.map(x => [x, words(x)]), s.icks)}</div>
          <div><div class="form-label">Interests (2 to 4)</div>${chips(n, 'interests', INTERESTS.map(x => [x, words(x)]), s.interests)}</div>
          <div><div class="form-label">Eyes on (up to 3) — who they've come in for</div>${chips(n, 'eyesOn', others, s.eyesOn)}</div>
          <div><div class="form-label">An ex in the villa</div>${select(n, 'ex', others, s.ex, 'No ex')}</div>
        </div>
      </details>
    </div>`;
  }).join('');
  const problem = perfectMatchCastProblem(cast, Object.fromEntries(cast.map((n, i) => [n, { ...setupOf(n), role: setupOf(n).role || defaultRoleFor(i, cast.length) }])));
  const count = r => cast.filter((n, i) => (setupOf(n).role || defaultRoleFor(i, cast.length)) === r).length;
  host.innerHTML = `<div class="pm-cs-status ${problem ? 'bad' : 'ok'}">${problem
    ? `This cast can't start a villa yet: ${esc(problem)}.`
    : `Ready: ${count('starter')} starters, ${count('bombshell')} bombshells, ${count('casa')} Casa Amor arrivals — ${perfectMatchSeasonShape().schedule.length} episodes.`}</div>
    <div class="hint hint-tight">Leave anything blank and the villa decides: roles by cast order, the rest rolled from each islander's stats. Only what you set is fixed.</div>
    ${rows}`;
  if (!host.dataset.wired) {
    host.dataset.wired = '1';
    host.addEventListener('change', onChange);
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
