// ══════════════════════════════════════════════════════════════════════
// vp-dr/screens.js — the seventeen screens, in the running order
// ══════════════════════════════════════════════════════════════════════
//
// ONE LIST, TWO READERS. The viewing party and the text backlog both build
// from this file, which is the whole reason it exists: the Traitors put its
// screen table in one place after the transcript quietly stopped mentioning
// a screen nobody had remembered to add to the second copy. A screen that is
// not in this list is not in either place, and a screen that is, is in both.
//
// ── HOW A SCENE FINDS ITS SCREEN ──────────────────────────────────────
//
// The engine already emits SECTION MARKERS as it plays — `cold-open`,
// `werk-morning`, `mini`, `maxi-announce`, `prep-room`, `main-stage`,
// `runway`, `critiques`, `untucked`, `results`, `lipsync`, `exit`, and the
// finale's own three. So nothing here re-derives what happened. The scene
// list is walked ONCE in order; a marker opens its section and every scene
// after it belongs to that section until the next marker opens the next.
//
// That ordering is the point. An episode carries 100-130 scenes and they are
// already in running order, so assigning them by kind-matching would need a
// rule per kind — 150-odd of them — and a kind nobody wrote a rule for would
// vanish off the end of the show without a word. `tests/dr-vp-registry`
// asserts that EVERY scene reaches a screen, which is the only version of
// this that stays true as the engine grows new scene kinds.
import { _shell, _portrait, _icon } from './style.js';
import { _controls, _state } from './reveal.js';
import { rpBuildChart } from './chart.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * The sections, in the order they happen.
 *
 * `opens` are the scene kinds that START this section. `phase` picks the
 * atmosphere. `accent` picks the panel rail's colour family, so a reader can
 * tell what KIND of thing a panel is without reading a word of it.
 */
const SECTIONS = [
  { id: 'dr-arrivals', label: 'Arrivals', suffix: 'arrivals', phase: 'werk', accent: 'dr-a-room',
    opens: ['arrivals', 'entrance-order'], badge: { text: 'ENTRANCES', color: '#FFC83D' },
    title: 'Entrances', subtitle: 'the first thirteen through the door' },
  { id: 'dr-cold-open', label: 'Cold Open', suffix: 'coldopen', phase: 'werk', accent: 'dr-a-room',
    opens: ['cold-open'], badge: null, title: 'Cold Open', subtitle: 'the room, before anything' },
  { id: 'dr-werk-morning', label: 'The Werk Room', suffix: 'morning', phase: 'werk', accent: 'dr-a-room',
    opens: ['werk-morning'], badge: null, title: 'The Werk Room', subtitle: 'morning' },
  { id: 'dr-mini', label: 'Mini', suffix: 'mini', phase: 'werk', accent: 'dr-a-score',
    opens: ['mini'], badge: { text: 'MINI', color: '#00E5FF' },
    title: 'The Mini Challenge', subtitle: 'first blood' },
  { id: 'dr-announce', label: 'The Brief', suffix: 'announce', phase: 'werk', accent: 'dr-a-room',
    opens: ['maxi-announce'], badge: null, title: 'The Maxi Challenge', subtitle: 'the brief' },
  { id: 'dr-choice', label: 'The Draft', suffix: 'choice', phase: 'werk', accent: 'dr-a-bond',
    opens: ['improv-premises', 'snatch-picks', 'ball-theme', 'group-parts', 'roast-order',
      'makeover-pairs', 'singing-order', 'walkthrough'],
    badge: { text: 'PICKS', color: '#7B2FF7' }, title: 'The Draft', subtitle: 'who takes what' },
  { id: 'dr-prep', label: 'Prep', suffix: 'prep', phase: 'werk', accent: 'dr-a-room',
    opens: ['prep-room', 'writing-room', 'band-rehearsal', 'recording-booth', 'ball-build',
      'makeover-build', 'no-rehearsal'],
    badge: null, title: 'The Work Room', subtitle: 'building it' },
  { id: 'dr-maxi', label: 'The Maxi', suffix: 'maxi', phase: 'stage', accent: 'dr-a-score',
    opens: ['improv-take', 'snatch-taping', 'group-number', 'roast-set', 'ball-walks',
      'makeover-reveal', 'singing-performance'],
    badge: { text: 'MAXI', color: '#FF3D9A' }, title: 'The Challenge', subtitle: 'tape rolls' },
  { id: 'dr-elim-day', label: 'Elimination Day', suffix: 'elimday', phase: 'werk', accent: 'dr-a-room',
    opens: ['werk-elim-day'], badge: null, title: 'Elimination Day', subtitle: 'the last hour in the room' },
  { id: 'dr-main-stage', label: 'Main Stage', suffix: 'mainstage', phase: 'stage', accent: 'dr-a-score',
    opens: ['main-stage'], badge: null, title: 'The Main Stage', subtitle: 'the panel takes its seats' },
  { id: 'dr-runway', label: 'Runway', suffix: 'runway', phase: 'stage', accent: 'dr-a-score',
    opens: ['runway'], badge: { text: 'RUNWAY', color: '#FF7BC8' },
    title: 'The Runway', subtitle: 'category is…' },
  { id: 'dr-critiques', label: 'Critiques', suffix: 'critiques', phase: 'stage', accent: 'dr-a-score',
    opens: ['critiques'], badge: null, title: 'The Critiques', subtitle: 'the panel speaks' },
  { id: 'dr-untucked', label: 'Untucked', suffix: 'untucked', phase: 'untucked', accent: 'dr-a-bond',
    opens: ['untucked'], badge: { text: 'UNTUCKED', color: '#7B2FF7' },
    title: 'Untucked', subtitle: 'Illusions Lounge' },
  { id: 'dr-results', label: 'The Call', suffix: 'results', phase: 'stage', accent: 'dr-a-score',
    opens: ['results'], badge: null, title: 'The Call', subtitle: 'who is safe' },
  { id: 'dr-lipsync', label: 'Lip Sync', suffix: 'lipsync', phase: 'lipsync', accent: 'dr-a-lip',
    opens: ['lipsync'], badge: { text: 'LIP SYNC', color: '#FF294B' },
    title: 'Lip Sync For Your Life', subtitle: 'two queens, one song' },
  { id: 'dr-exit', label: 'Sashay', suffix: 'exit', phase: 'lipsync', accent: 'dr-a-lip',
    opens: ['exit', 'finale-open', 'finale-duel', 'crowning'], badge: null,
    title: 'Sashay Away', subtitle: 'the mirror message' },
];

/** The chart is not a section of an episode; it is the season, every episode. */
const CHART = {
  id: 'dr-chart', label: 'Track Record', suffix: 'chart', phase: 'chart',
  badge: { text: 'CHART', color: '#facc15' },
};

/**
 * Every scene, filed under the section it happened in.
 *
 * Returns a Map of section id → scenes. Anything before the first marker goes
 * to the first section rather than being dropped: an episode that opens on a
 * kind nobody has listed is still an episode, and losing its opening scenes
 * silently is the failure this whole file is arranged against.
 */
export function sceneSections(row) {
  const scenes = row?.dr?.scenes || [];
  const openerOf = new Map();
  for (const s of SECTIONS) for (const k of s.opens) openerOf.set(k, s.id);

  const out = new Map(SECTIONS.map(s => [s.id, []]));
  let current = null;
  for (const sc of scenes) {
    const opened = openerOf.get(sc.kind);
    if (opened) current = opened;
    // Before any marker: the first section that this row actually has.
    if (!current) current = SECTIONS.find(s => s.id !== 'dr-arrivals')?.id || SECTIONS[0].id;
    out.get(current).push(sc);
  }
  return out;
}

/** One scene, as a revealable step. */
function step(sc, i, suffix, ep, accent) {
  const players = sc?.data?.players || [];
  const who = players.length
    ? `<span class="dr-who">${players.slice(0, 2).map(n =>
      _portrait(n, ep, { size: 46, station: true })).join('')}</span>` : '';
  const tier = sc?.data?.tier ? `<span class="dr-tier">${esc(sc.data.tier)}</span>` : '';
  /* ONLY WHEN THE LINE DOES NOT ALREADY SAY IT. Most scene prose opens with
     her name, so prefixing unconditionally produced "Q1 Q1 is the one who
     reads the mirror message out loud" — visible the moment a transcript was
     read, invisible to every assertion. */
  const first = String(players[0] || '');
  const firstSentence = String(sc.text || '').split(/(?<=[.!?])\s/)[0] || '';
  const opensWithName = first && firstSentence.includes(first);
  const name = first && !opensWithName ? `<b class="dr-disp">${esc(first)}</b> ` : '';
  return `<div class="dr-step" id="dr-step-${suffix}-${i}">
    <div class="dr-panel ${accent} dr-scene">
      ${who}<div class="dr-scene-body">${tier}${name}${esc(sc.text || '')}</div>
    </div></div>`;
}

const EXTRA_CSS = `
.dr-scene{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:start;
  padding:14px 16px 14px 20px}
.dr-scene:not(:has(.dr-who)){grid-template-columns:1fr}
.dr-who{display:flex;gap:7px}
.dr-scene-body{color:#f4e3ed}
.dr-tier{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;
  padding:2px 7px;margin-right:8px;border:1px solid rgba(255,255,255,.3);color:#ffd0e8}
.dr-duel{display:flex;align-items:center;gap:9px;flex-wrap:wrap;padding:8px 0;
  border-bottom:1px solid rgba(255,255,255,.09)}
.dr-vs{color:#FF294B;font-size:18px}
.dr-duel-song{color:#C9A6BC;margin-left:auto}
.dr-duel-win{color:#FFC83D}
.dr-places{list-style:none;counter-reset:pl;padding:0;margin:0}
.dr-places li{counter-increment:pl;display:flex;align-items:center;gap:9px;padding:5px 0}
.dr-places li::before{content:counter(pl);font-variant-numeric:tabular-nums;
  color:#C9A6BC;min-width:20px}
`;

/** The sidebar: who is still in the room, gated to the current step. */
function railFor(row, scenes, ep) {
  const living = row?.dr?.living || [];
  if (!living.length) return [];
  const rows = living.map(n => `<div class="dr-slot">
      ${_portrait(n, ep, { size: 38 })}
      <div><div>${esc(n)}</div><div class="dr-meter"><i style="width:60%"></i></div></div>
      <span></span></div>`).join('');
  const panel = `<h4 class="dr-disp">In the room · ${living.length}</h4>${rows}`;
  // One entry per step, all the same for now: the per-screen sidebars that
  // actually change as the night goes on are Tasks 5-8.
  return scenes.map(() => panel);
}

/**
 * The finale's own facts: the duels, and the order they finished in.
 *
 * NOT on a scene. `dr.finale` carries the bracket and the placements as
 * structured data, and the finale row only emits five scenes — so a screen
 * built from scenes alone loses the entire result of the season. The engine
 * readout printed them; the registry has to as well, or replacing the readout
 * silently drops the one thing a finale is for.
 */
function finaleBlock(row, ep) {
  const f = row?.dr?.finale;
  if (!f) return '';
  const rounds = (f.rounds || []).map(r => `<div class="dr-duel">
      ${_portrait(r.a, ep, { size: 40 })}<b class="dr-disp">${esc(r.a)}</b>
      <span class="dr-vs dr-disp">vs</span>
      <b class="dr-disp">${esc(r.b)}</b>${_portrait(r.b, ep, { size: 40 })}
      <span class="dr-duel-song dr-fash">${esc(r.song || '')}</span>
      <span class="dr-duel-win dr-disp">${esc(r.winner)} wins</span>
    </div>`).join('');
  const places = (f.placements || []).map((n, i) => `<li>${_portrait(n, ep, { size: 34 })}
      <b class="dr-disp">${esc(n)}</b>${i === 0 ? ` ${_icon('crown')}` : ''}</li>`).join('');
  return `<div class="dr-step dr-vis" id="dr-step-${'exit'}-finale">
    <div class="dr-panel dr-a-lip" style="padding:16px 18px 16px 22px">
      <h3 class="dr-disp" style="margin:0 0 10px">The finale — ${esc(f.type || '')}</h3>
      ${rounds}
      <h4 class="dr-disp" style="margin:14px 0 6px">Placements</h4>
      <ol class="dr-places">${places}</ol>
    </div></div>`;
}

function buildSection(sec, row) {
  const ep = { num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} };
  const scenes = sceneSections(row).get(sec.id) || [];
  const finale = sec.id === 'dr-exit' ? finaleBlock(row, ep) : '';
  if (!scenes.length && !finale) return '';
  const steps = scenes.map((sc, i) => step(sc, i, sec.suffix, ep, sec.accent)).join('') + finale;
  if (typeof window !== 'undefined') {
    if (!window._drSidebar) window._drSidebar = {};
    window._drSidebar[sec.suffix] = railFor(row, scenes, ep);
  }
  const rail = railFor(row, scenes, ep)[0] || '';
  return `<style>${EXTRA_CSS}</style>${_shell(steps, ep, {
    phase: sec.phase, title: sec.title, subtitle: sec.subtitle, sidebar: rail,
  })}${_controls(sec.suffix, scenes.length, ep.num)}`;
}

/** The registry: seventeen entries, in the running order. */
export const DRAG_SCREENS = [
  ...SECTIONS.map(sec => ({
    id: sec.id,
    label: sec.label,
    suffix: sec.suffix,
    badge: sec.badge,
    when: row => (sceneSections(row).get(sec.id) || []).length > 0
      || (sec.id === 'dr-exit' && !!row?.dr?.finale),
    build: row => buildSection(sec, row),
    revealAllName: 'drRevealAll',
  })),
  {
    id: CHART.id,
    label: CHART.label,
    suffix: CHART.suffix,
    badge: CHART.badge,
    when: row => Object.keys(row?.dr?.record || {}).length > 0,
    build: row => rpBuildChart(row),
    // Its own handlers: this screen steps by EPISODE, not by card.
    revealAllName: 'drChartRevealAll',
  },
];

/** The screens this episode actually has, built in order. */
export function dragScreens(row) {
  return DRAG_SCREENS
    .filter(s => s.when(row))
    .map(s => ({ id: s.id, label: s.label, html: s.build(row) }))
    .filter(s => s.html);
}

/**
 * The same screens, fully revealed, for the transcript.
 *
 * ON A RENUMBERED COPY. Reveal state is keyed by episode number, so building
 * the transcript against the real row would consume the viewer's own reveals
 * — they would come back to an episode already opened. The negative number
 * cannot collide with a real one. This is the Traitors' trick and it is not
 * optional.
 */
export function dragScreensRevealed(row) {
  const shadow = { ...row, num: -Math.abs(row?.num ?? row?.dr?.ep ?? 1) };
  const out = DRAG_SCREENS.filter(s => s.when(shadow)).map(s => {
    const html = s.build(shadow);
    if (!html) return null;
    const total = (sceneSections(shadow).get(s.id) || []).length;
    if (total && typeof window !== 'undefined') _state(shadow, s.suffix).idx = total - 1;
    return { id: s.id, label: s.label, html };
  }).filter(Boolean);
  return out;
}
