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
import { players, seasonConfig } from './core.js';
import { ROLES, INTENTS, PERSONAS, LOOK_TAGS, VIBES, ICKS, INTERESTS } from './pm/profile.js';
import { DIALECTS } from './pm/lines/dialect.js';
import { perfectMatchCastProblem } from './pm-run.js';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const words = s => String(s).replace(/-/g, ' ');
const ROLE_WORDS = { starter: 'Starter (night one)', bombshell: 'Bombshell', casa: 'Casa Amor' };
// How many of each a field keeps (the same caps resolveIslander applies).
const LIMIT = { 'type.looks': 3, 'type.vibes': 2, looks: 4, icks: 2, interests: 4, eyesOn: 3 };

const setupOf = name => ((seasonConfig.pmSetup ||= {})[name] ||= {});
const defaultRole = i => (i < 10 ? 'starter' : i < 16 ? 'bombshell' : 'casa');

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

/** Draw the panel. Safe to call when the page has no panel (tests, other shows). */
export function renderPerfectMatchCastSetup() {
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
        ${select(n, 'role', ROLES.map(r => [r, ROLE_WORDS[r]]), s.role, `Auto: ${ROLE_WORDS[defaultRole(i)]}`)}
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
  const problem = perfectMatchCastProblem(cast, Object.fromEntries(cast.map((n, i) => [n, { ...setupOf(n), role: setupOf(n).role || defaultRole(i) }])));
  const count = r => cast.filter((n, i) => (setupOf(n).role || defaultRole(i)) === r).length;
  host.innerHTML = `<div class="pm-cs-status ${problem ? 'bad' : 'ok'}">${problem
    ? `This cast can't start a villa yet: ${esc(problem)}.`
    : `Ready: ${count('starter')} starters, ${count('bombshell')} bombshells, ${count('casa')} Casa Amor arrivals.`}</div>
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
