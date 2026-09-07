// ══════════════════════════════════════════════════════════════════════
// js/dr/aftermath.js — the season, read back after it aired
// ══════════════════════════════════════════════════════════════════════
//
// Everything here is DERIVED. The season is already finished and written down
// by the time this runs; nothing in this file simulates, decides, or mutates
// anything. That is the whole contract: an aftermath that computed something
// would be a second source of truth for a season that already has one, and
// the two would drift the first time either side changed.
//
// It answers the four questions a reunion asks. Who did we actually watch
// (screen time). What did we watch her do (moments). What was the season
// ABOUT (arcs). And who takes something home for it (awards).

import { showWords, DRAG_FORMAT } from '../shows.js';

/** Judging calls that read as a good night, a fine one, and a bad one. */
const TOP = new Set(['WIN', 'WINNER']);
const GOOD = new Set(['WIN', 'WINNER', 'HIGH']);
const BAD = new Set(['BTM', 'BTM2', 'LOW']);

/**
 * Every cast name mentioned anywhere inside a scene.
 *
 * WALKED RATHER THAN LOOKED UP, because scenes do not agree on where they put
 * people: some carry `players`, some `queens`, some a bare `name`, a lip sync
 * carries `a` and `b`, a cold open carries `gone`. A reader that checked only
 * `data.players` comes back with a suspiciously tidy table in which every
 * queen has roughly the same screen time — the flat count that means the
 * extractor found nothing, not that the edit was fair.
 */
function namesIn(value, castSet, found = new Set(), depth = 0) {
  if (depth > 4 || value == null) return found;
  if (typeof value === 'string') {
    if (castSet.has(value)) found.add(value);
    return found;
  }
  if (Array.isArray(value)) {
    for (const v of value) namesIn(v, castSet, found, depth + 1);
    return found;
  }
  if (typeof value === 'object') {
    for (const v of Object.values(value)) namesIn(v, castSet, found, depth + 1);
  }
  return found;
}

/**
 * Everyone a single scene is about — the extractor, shared.
 *
 * Exported because `js/edit-layer.js` needs exactly this and briefly had its
 * own version: a flat list of the keys scenes were known to use. It missed the
 * finale, whose names sit one level down at `data.finalists` and
 * `data.duel.a`, so the crowning — the biggest episode of the season — billed
 * all four finalists zero screen time while every earlier week read correctly.
 * Two extractors that disagree is worse than either one alone, because the
 * season total stops equalling the sum of its episodes and neither number
 * announces which is wrong.
 */
export function dragSceneCast(scene, castSet) {
  return namesIn(scene?.data, castSet);
}

/**
 * A matcher for one name inside prose, on WORD BOUNDARIES.
 *
 * `text.includes(name)` is wrong and quietly so. On a test cast it made Q1
 * the most-seen queen of the season — 257 scenes across the seven episodes
 * she survived, ahead of a winner who lasted nine — because every line
 * mentioning Q10, Q11 or Q12 also contains "Q1". Real casts hide the same bug
 * better and no less completely: Kim inside Kimmy, Ali inside Alicia. The
 * name is escaped because a queen may legitimately have a "." or "+" in hers.
 */
function mentions(name) {
  const safe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}_])${safe}([^\\p{L}\\p{N}_]|$)`, 'u');
}

/** The full cast, in the order the season introduced them. */
function castOf(rows) {
  const seen = [];
  for (const row of rows) {
    for (const n of row.dr?.living || []) if (!seen.includes(n)) seen.push(n);
    for (const n of Object.keys(row.dr?.record || {})) if (!seen.includes(n)) seen.push(n);
  }
  return seen;
}

/**
 * How many scenes each queen was in, per episode and across the season.
 *
 * This is the edit, counted. It is deliberately not weighted by scene type — a
 * confessional and a runway walk both count one — because the question it
 * answers is "how much of her did we see", and the moment a weighting goes in
 * the number stops being a count and becomes an opinion.
 */
export function dragScreenTime(rows, cast = null) {
  const names = cast && cast.length ? cast : castOf(rows);
  const castSet = new Set(names);
  const out = Object.fromEntries(names.map(n => [n, { total: 0, byEpisode: {} }]));
  // Compiled once for the whole season rather than per scene: a twelve-queen
  // season walks a few thousand scenes and this is the inner loop.
  const patterns = names.map(n => [n, mentions(n)]);

  for (const row of rows) {
    const ep = row.num || row.dr?.ep || 0;
    for (const scene of row.dr?.scenes || []) {
      const present = namesIn(scene.data, castSet);
      // The prose carries names the data sometimes does not — a scene whose
      // whole content is a line of dialogue about somebody.
      if (typeof scene.text === 'string' && scene.text) {
        for (const [n, re] of patterns) if (re.test(scene.text)) present.add(n);
      }
      for (const n of present) {
        if (!out[n]) continue;
        out[n].total++;
        out[n].byEpisode[ep] = (out[n].byEpisode[ep] || 0) + 1;
      }
    }
  }
  return out;
}

/** Event types that are a MOMENT rather than a beat. */
const MOMENT_EVENTS = new Set([
  'assassin', 'roasted-the-panel', 'showstopper', 'stunt-landed',
]);

/**
 * The season's highlight reel.
 *
 * Three sources, because a moment is not one kind of thing: a performance the
 * challenge itself flagged, an event written to be a highlight, and a lip sync
 * neither queen lost.
 */
export function dragMoments(rows) {
  const out = [];
  for (const row of rows) {
    const ep = row.num || row.dr?.ep || 0;
    const dr = row.dr || {};

    for (const [name, perf] of Object.entries(dr.performances || {})) {
      if (!perf?.moment) continue;
      out.push({
        episode: ep,
        name,
        kind: 'performance',
        score: perf.perf ?? null,
        challenge: dr.challenge?.name || null,
        detail: perf.detail?.character || perf.role || null,
      });
    }

    for (const e of dr.events || []) {
      const type = e.type || e.kind || '';
      if (!MOMENT_EVENTS.has(type)) continue;
      for (const name of e.players || []) {
        out.push({
          episode: ep, name, kind: type, detail: null,
          challenge: dr.challenge?.name || null,
        });
      }
    }

    const ls = dr.lipsync;
    if (ls?.call === 'double-shantay') {
      for (const name of ls.queens || []) {
        out.push({
          episode: ep, name, kind: 'double-shantay', detail: null,
          song: ls.song?.title || null,
        });
      }
    }
  }
  return out;
}

/** The single hardest the host went against his own panel all season. */
function biggestBend(rows) {
  let best = null;
  for (const row of rows) {
    for (const b of row.dr?.bend || []) {
      const moved = (Number(b.panelRank) || 0) - (Number(b.finalRank) || 0);
      if (moved > 0 && (!best || moved > best.places)) {
        best = {
          name: b.name, episode: row.num || 0, places: moved,
          from: b.panelRank, to: b.finalRank, label: 'Saved by the host',
        };
      }
    }
  }
  return best;
}

/**
 * Who the season turned around.
 *
 * MAY BE NOBODY, AND OFTEN SHOULD BE. Sorting every queen by swing and taking
 * the top one always produces a name: on a season where everybody declined it
 * hands the sash to whoever declined least and calls her most improved. So the
 * award is withheld unless somebody genuinely rose — which is also why the
 * returned object carries `swing`, so a reader can see the size of the thing
 * being celebrated rather than taking the label's word for it.
 */
function mostImproved(record) {
  let best = null;
  for (const [name, rec] of Object.entries(record || {})) {
    // Half a short record is one or two nights, and a queen who went home in
    // week three did not have a season to improve across.
    if (!Array.isArray(rec) || rec.length < 6) continue;
    const half = Math.ceil(rec.length / 2);
    const good = arr => arr.filter(r => GOOD.has(r)).length;
    const bad = arr => arr.filter(r => BAD.has(r)).length;
    const early = rec.slice(0, half);
    const late = rec.slice(half);
    /* The primary term is the one a reader would check for themselves: good
       nights in the back half against good nights in the front. Bottoms
       avoided only break ties, so the award can never land on somebody whose
       top-call count actually fell while she merely stopped bombing. */
    const swing = good(late) - good(early);
    if (swing <= 0) continue;
    const tie = bad(early) - bad(late);
    if (!best || swing > best.swing || (swing === best.swing && tie > best.tie)) {
      best = {
        name, swing, tie, early: good(early), late: good(late),
        label: 'Most improved',
      };
    }
  }
  return best;
}

/**
 * The queen who should have gone further.
 *
 * Track record against where she actually finished — three wins and out in
 * ninth. Restricted to those who did NOT reach the finale, because a finalist
 * got as far as the format allows and cannot be robbed of it.
 */
function robbed(record) {
  let best = null;
  for (const [name, rec] of Object.entries(record || {})) {
    if (!Array.isArray(rec) || !rec.length) continue;
    if (rec.some(r => r === 'WINNER' || r === 'FINALIST')) continue;
    const score = rec.filter(r => TOP.has(r)).length * 2
      + rec.filter(r => r === 'HIGH').length;
    if (score <= 0) continue;
    // Divided by how long she lasted: three wins in six weeks is a robbery,
    // three wins in twelve is a career.
    const rate = score / rec.length;
    if (!best || rate > best.rate) {
      best = {
        name, rate: Math.round(rate * 100) / 100, out: rec.length,
        wins: rec.filter(r => TOP.has(r)).length, label: 'Should have gone further',
      };
    }
  }
  return best;
}

/** Whoever tops a per-queen tally, or null when nobody scored at all. */
function topOf(tally, label) {
  const entries = Object.entries(tally).filter(([, v]) => v > 0);
  if (!entries.length) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return { name: entries[0][0], count: entries[0][1], label };
}

/**
 * The whole aftermath.
 *
 * `players` is accepted and unused for scoring on purpose: it is the hook the
 * screens need to draw a portrait beside a name, and threading it here means a
 * caller does not carry a second lookup alongside this object.
 */
export function buildDragAftermath(rows, { players = {} } = {}) {
  const all = Array.isArray(rows) ? rows : [];
  const last = all[all.length - 1] || {};
  const cast = castOf(all);
  const record = last.dr?.record || {};
  const w = showWords(DRAG_FORMAT);

  const maxiWins = {};
  const lipsyncWins = {};
  for (const row of all) {
    for (const n of row.dr?.call?.win || []) maxiWins[n] = (maxiWins[n] || 0) + 1;
    const ls = row.dr?.lipsync;
    if (ls?.winner) lipsyncWins[ls.winner] = (lipsyncWins[ls.winner] || 0) + 1;
    // A double shantay has no winner and both survived, which is still having
    // won a lip sync for your life.
    if (ls?.call === 'double-shantay') {
      for (const n of ls.queens || []) lipsyncWins[n] = (lipsyncWins[n] || 0) + 1;
    }
  }

  const cong = last.dr?.congeniality || null;

  return {
    format: DRAG_FORMAT,
    cast,
    players,
    screenTime: dragScreenTime(all, cast),
    // The arcs as they stood at the crowning: the last row carries the whole
    // season's storylines, the dead ones alongside the living.
    arcs: last.dr?.storylines || [],
    moments: dragMoments(all),
    awards: {
      congeniality: cong ? { name: cong, label: w.audienceAward } : null,
      mostWins: topOf(maxiWins, 'Most challenge wins'),
      mostLipSyncs: topOf(lipsyncWins, 'Most lip syncs survived'),
      robbed: robbed(record),
      biggestBend: biggestBend(all),
      mostImproved: mostImproved(record),
    },
  };
}
