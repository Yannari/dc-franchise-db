// ══════════════════════════════════════════════════════════════════════
// pm/transcript.js — an episode, written out to read
// ══════════════════════════════════════════════════════════════════════
//
// The ORDER of an episode (`phasesOf`) for every reader — the viewing party's
// designed screens (js/vp-pm/steps.js cuts these parts into beats), the text
// backlog and `npm run pm:transcript` — and the words of the last two. A
// second copy of the order is how a reader quietly stops mentioning a scene
// (§11.5 Q).
//
// Every scene is shown, aired or not — the reader sees what the public didn't
// — with its beach-hut cutaway, the narrator, and what the public made of it.
import { SCENE_GAIN } from './ledger.js';
import { CHALLENGE_NAMES } from './schedule.js';
import { roundExits, PERFECT_MATCH_FORMAT } from '../shows.js';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const PM_PHASE_LABEL = { arrival: 'The arrivals', 'arrival-2': 'The arrivals', coupling: 'The first coupling', debrief: 'The debrief', cinema: 'Movie Night', blowup: 'It kicks off', breakdown: 'It all gets too much', triangle: 'The love triangle',
  morning: 'Morning', day: 'The day', event: 'The challenge', evening: 'Evening',
  firepit: 'The fire pit', dumping: 'The dumping', reunion: 'The reunion' };
export const PM_MOMENT_TITLE = { 'first-coupling': 'The first coupling', bombshell: 'A bombshell arrives',
  recoupling: 'Recoupling', 'public-vote': 'Public vote', 'casa-open': 'Casa Amor opens', 'casa-nights': 'Casa Amor',
  'stick-or-twist': 'Stick or twist', photos: 'The photos', 'semi-final': 'Semi-final', final: 'The final',
  reunion: 'Reunion' };

/** The episode's title from what PLAYED: a couples' vote has no public in it. */
export function momentTitle(row, fallback = 'A day in the villa') {
  if (row?.pm?.finalRecoupling) return 'The final recoupling';
  if (row?.pm?.double) return 'A double dumping';
  if (row?.pm?.dumpFormat === 'couples-vote') return 'The villa votes';
  if (row?.pm?.dumpFormat === 'singles') return 'The singles face the public';
  // A vote night the villa could not spare anyone on plays as a villa day.
  if (row?.moment === 'public-vote' && row?.pm && !row.pm.dumpFormat) return fallback === 'The night' ? 'The night' : 'A day in the villa';
  return PM_MOMENT_TITLE[row?.moment] || fallback;
}

/** Scoped styles for the screens, both themes. */
export const PM_TRANSCRIPT_CSS = `
.pm-tx{--pm-ink:#2b1d24;--pm-soft:#7a6470;--pm-line:#f0dde4;--pm-pink:#e0467c;--pm-hut:#fff1d6;--pm-hut2:#ffe0e0;
  color:var(--pm-ink);font:15px/1.55 Georgia,serif;max-width:760px;margin:0 auto;padding:4px 16px 40px}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .pm-tx{--pm-ink:#f6e9ee;--pm-soft:#b39aa6;--pm-line:#3a2a31;--pm-pink:#ff6f9f;--pm-hut:#3a3020;--pm-hut2:#3d2226}}
:root[data-theme="dark"] .pm-tx{--pm-ink:#f6e9ee;--pm-soft:#b39aa6;--pm-line:#3a2a31;--pm-pink:#ff6f9f;--pm-hut:#3a3020;--pm-hut2:#3d2226}
.pm-tx h2{font:600 22px system-ui,sans-serif;color:var(--pm-pink);margin:8px 0 4px}
.pm-tx .pm-sub{font:13px system-ui,sans-serif;color:var(--pm-soft);margin:0 0 12px}
.pm-tx .pm-scene{border-top:1px solid var(--pm-line);padding:10px 0}.pm-tx .pm-scene.pm-hidden{opacity:.6}
.pm-tx .pm-meta{font:12px system-ui,sans-serif;color:var(--pm-soft);margin-bottom:4px}
.pm-tx .pm-stage,.pm-tx .pm-beat{font-style:italic;color:var(--pm-soft);margin:4px 0}.pm-tx .pm-line{margin:3px 0}
.pm-tx .pm-hut{background:var(--pm-hut);border-radius:8px;padding:6px 10px;margin:8px 0 2px 18px;font-size:14px}
.pm-tx .pm-hut.two-faced{background:var(--pm-hut2)}.pm-tx .pm-hut p{margin:2px 0}
.pm-tx .pm-tag{font:11px system-ui,sans-serif;color:var(--pm-soft);display:block}
.pm-tx .pm-unaired{display:inline;color:var(--pm-pink);margin-left:6px}
.pm-tx .pm-narr{font-style:italic;color:var(--pm-pink);margin:6px 0}
.pm-tx .pm-pop{font:12px system-ui,sans-serif;color:var(--pm-soft);margin-top:6px}
.pm-tx .up{color:#1f9d55}.pm-tx .down{color:#d64545}
.pm-tx .pm-major{background:var(--pm-pink);color:#fff;border-radius:4px;padding:0 5px;margin-left:4px}`;

function sceneHtml(e) {
  const s = e.script || { lines: [] };
  const lines = [
    s.stage ? `<p class="pm-stage">${esc(s.stage)}</p>` : '',
    ...s.lines.map(l => l.action ? `<p class="pm-stage">${esc(l.text)}</p>` : `<p class="pm-line"><b>${esc(l.who)}:</b> “${esc(l.text)}”</p>`),
    s.beat ? `<p class="pm-beat">${esc(s.beat)}</p>` : '',
  ].join('');
  const narr = e.narrator ? `<p class="pm-narr">${e.narrator.lines.map(l => `<b>${esc(l.who)}:</b> “${esc(l.text)}”`).join(' ')}</p>` : '';
  const hut = e.hut ? `<div class="pm-hut ${esc(e.hut.stance)}"><span class="pm-tag">beach hut · ${esc(e.hut.stance)}</span>${
    e.hut.script.lines.map(l => `<p><b>${esc(l.who)}:</b> “${esc(l.text)}”</p>`).join('')}</div>` : '';
  // What the public made of it: only an aired scene counts. Before the
  // episode's caps (spec §8), which the header shows after.
  const moves = Object.entries(e.pop || {}).map(([who, p]) => {
    const ap = Math.round((p.approval || 0) * SCENE_GAIN * 10) / 10;
    return `<span class="${ap > 0 ? 'up' : ap < 0 ? 'down' : ''}">${esc(who)} ${ap > 0 ? '▲ +' + ap : ap < 0 ? '▼ ' + ap : '±0'}</span>`;
  }).join(' · ');
  const pop = e.aired
    ? (moves ? `<div class="pm-pop">public: ${moves}${e.major?.length ? ' <span class="pm-major">major moment</span>' : ''}</div>` : '')
    : '<div class="pm-pop">not seen by the public: no effect</div>';
  return `<div class="pm-scene${e.aired ? '' : ' pm-hidden'}"><div class="pm-meta">${esc(e.kind)}${
    e.aired ? '' : '<span class="pm-unaired">didn\'t air</span>'}</div>${lines}${narr}${hut}${pop}</div>`;
}

// The parts of the night a moment has of its own. A moment's other scenes
// borrow a villa-day phase (the first coupling's steal is an `event`, Casa's
// advice a `day`) and are shown with the part of the night beside them.
const MOMENT_PHASES = new Set(['firepit', 'dumping', 'reunion']);

function groupByPhase(events, label) {
  const out = [];
  for (const e of events) {
    if (!out.length || out[out.length - 1][0] !== e.phase) out.push([e.phase, [], label(e.phase)]);
    out[out.length - 1][1].push(e);
  }
  return out;
}

/** The episode's scenes, grouped by part of the day, in order, as
 *  [phase, events, label]: the villa day by its parts, then the moment — by
 *  its own parts of the night, or as one screen named after the moment when it
 *  has none (a bombshell's dates, Casa Amor). Two screens both called "The
 *  day" read as the same part twice. */
export function phasesOf(row) {
  const events = row?.pm?.events || [];
  const from = row?.pm?.momentFrom ?? events.length;
  // The villa day in the order of the day. Its reactions (a sulk, advice, a
  // head turned) are built after the whole day, from how it left everyone,
  // and carry the part of the day they happen in — listed as they were built
  // they would open a second "The day" after the evening.
  const ORDER = { arrival: -2, 'arrival-2': -1.5, coupling: -1, debrief: -0.5, morning: 0, day: 1, challenge: 1.5, event: 2, evening: 3, cinema: 3.5, triangle: 3.7, blowup: 3.8, breakdown: 3.9 };
  const villa = events.slice(0, from).map((e, i) => [e, i])
    .sort((x, y) => ((ORDER[x[0].phase] ?? 4) - (ORDER[y[0].phase] ?? 4)) || x[1] - y[1]).map(([e]) => e);
  // The named challenge's screen carries its name (Couple Goals, the talent show).
  // Night one names its sides: "The girls arrive", then "The boys arrive"
  // (or the other way round, when the season sends the boys in first).
  const firstBoys = row?.pm?.firstIn === 'm';
  const sideLabel = ph => ph === 'arrival' ? (firstBoys ? 'The boys arrive' : 'The girls arrive')
    : ph === 'arrival-2' ? (firstBoys ? 'The girls arrive' : 'The boys arrive') : null;
  // The villa's own two games play in the afternoon slot, under their names.
  const game = villa.find(e => e.phase === 'event' && (e.kind === 'heart-rate' || e.kind === 'snog-marry-pie'))?.kind;
  const GAME = { 'heart-rate': 'The Heart Rate Challenge', 'snog-marry-pie': 'Snog Marry Pie' };
  const out = groupByPhase(villa, ph => sideLabel(ph) || (ph === 'challenge' && CHALLENGE_NAMES[row.pm?.challenge])
    || (ph === 'event' && GAME[game]) || PM_PHASE_LABEL[ph] || ph);
  const all = events.slice(from);
  // The night's debrief is its own screen, after everything else the night did.
  const debrief = all.filter(e => e.phase === 'debrief');
  const moment = all.filter(e => e.phase !== 'debrief');
  const tail = debrief.length ? [['debrief', debrief, PM_PHASE_LABEL.debrief]] : [];
  if (!moment.length) return [...out, ...tail];
  // Night one's coupling opened the episode; its night is the bombshell's.
  const title = row.moment === 'first-coupling' && villa.some(e => e.phase === 'coupling') ? 'The first night' : momentTitle(row, 'The night');
  if (!moment.some(e => MOMENT_PHASES.has(e.phase))) return [...out, ['moment', moment, title], ...tail];
  const groups = [];
  let pending = [];
  for (const e of moment) {
    if (!MOMENT_PHASES.has(e.phase)) { (groups.length ? groups[groups.length - 1][1] : pending).push(e); continue; }
    if (!groups.length || groups[groups.length - 1][0] !== e.phase) {
      groups.push([e.phase, [...pending], PM_PHASE_LABEL[e.phase]]);
      pending = [];
    }
    groups[groups.length - 1][1].push(e);
  }
  // The first part of the night carries the moment's name: "The first
  // coupling", not a bare "The fire pit".
  groups[0][2] = title;
  return [...out, ...groups, ...tail];
}

/** Couples, exits and who rose and fell with the public, after the caps. */
export function episodeHeaderHtml(row, prev = null) {
  const couples = (row.pm?.couples || []).map(c => c.map(esc).join(' &amp; ')).join(' · ') || '—';
  const exits = roundExits(row, PERFECT_MATCH_FORMAT).map(x => `${esc(x.name)} (${esc(x.verb)})`).join(', ');
  const before = prev?.pm?.approval || {}, after = row.pm?.approval || {};
  const shifts = Object.keys(after).map(n => [n, Math.round((after[n] - (before[n] || 0)) * 10) / 10])
    .filter(([, d]) => d).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 8);
  const labelsBefore = prev?.pm?.labels || {};
  const moved = Object.entries(row.pm?.labels || {}).filter(([n, l]) => labelsBefore[n] && labelsBefore[n] !== l)
    .map(([n, l]) => `${esc(n)}: ${esc(labelsBefore[n])} → <b>${esc(l)}</b>`);
  return `<h2>Episode ${row.num} — ${esc(momentTitle(row))}</h2>
    <p class="pm-sub"><b>Couples:</b> ${couples}${exits ? `<br><b>Left:</b> ${exits}` : ''}${
      shifts.length ? `<br><b>With the public:</b> ${shifts.map(([n, d]) => `<span class="${d > 0 ? 'up' : 'down'}">${esc(n)} ${d > 0 ? '+' : ''}${d}</span>`).join(' · ')}` : ''}${
      moved.length ? `<br><b>Now seen as:</b> ${moved.join(' · ')}` : ''}</p>`;
}

// The viewing party's screens are js/vp-pm/screens.js (Plan 5); this file
// still writes the text backlog and `npm run pm:transcript`.

/** The same content as plain text, for the text backlog. */
export function episodeText(row) {
  const out = [`EPISODE ${row.num} — ${momentTitle(row).toUpperCase()}`];
  for (const [, evs, label] of phasesOf(row)) {
    out.push('', `— ${label} —`);
    for (const e of evs) {
      const s = e.script || { lines: [] };
      if (s.stage) out.push(`(${s.stage})`);
      for (const l of s.lines) out.push(l.action ? l.text : `${l.who}: "${l.text}"`);
      if (s.beat) out.push(`(${s.beat})`);
      if (e.narrator) for (const l of e.narrator.lines) out.push(`${l.who}: "${l.text}"`);
      if (e.hut) for (const l of e.hut.script.lines) out.push(`  [beach hut] ${l.who}: "${l.text}"`);
      if (!e.aired) out.push('  (not aired)');
      out.push('');
    }
  }
  const exits = roundExits(row, PERFECT_MATCH_FORMAT);
  if (exits.length) out.push(`Left the villa: ${exits.map(x => `${x.name} (${x.verb})`).join(', ')}`);
  return out.join('\n');
}

export { sceneHtml as _sceneHtml };
