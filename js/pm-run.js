// ══════════════════════════════════════════════════════════════════════
// pm-run.js — the run loop's villa branch, and the runnable flag
// ══════════════════════════════════════════════════════════════════════
//
// Same shape as js/tr-run.js and js/dr-run.js. The engine plays the WHOLE
// season in one call (js/pm/season.js) — the public's final vote depends on
// everything that aired — and the rows are queued on `gs._pmQueue`; each press
// of "Simulate Episode N" shifts one onto `gs.episodeHistory`.
//
// The seed and the cast ORDER live on `gs.pm`, so a queue lost to a reload
// rebuilds the SAME season and drops the rows that already aired, rather than
// regenerating a different season and stacking it onto the history (§11.5 O).
//
// WHAT CROSSES BACK FROM THE ENGINE, AND WHAT DOES NOT. The engine's `state`
// holds the whole season a second time (`state.history` is every scene again)
// plus every working table; saving it is how Big Brother reached 19MB. The rows
// carry everything a screen reads, so only they, the public's ledger and the
// relationships (the wiki and the feed read those) come back — never `state`.
//
// IMPORTING THIS MODULE IS THE WIRING: it sets `window._pmRunnable`, which
// `formatIsRunnable()` reads. Drop the import from js/main.js and the show
// silently un-ships with every test still green.
import { gs, setGs, players, seasonConfig, seasonFormat } from './core.js';
import { PERFECT_MATCH_FORMAT } from './shows.js';
import { playPerfectMatchSeason } from './pm/season.js';
import { DIALECTS } from './pm/lines/dialect.js';

export const isPerfectMatchSeason = () => seasonFormat(seasonConfig) === PERFECT_MATCH_FORMAT;

let _lastRefusal = null;
const _refuse = why => { _lastRefusal = why; return false; };
/** Why the last attempt to play or re-run did not happen, in words for a toast. */
export function lastPerfectMatchRefusal() { return _lastRefusal; }

function _seed() {
  gs.pm ||= {};
  if (!gs.pm.seed) {
    gs.pm.seed = (Number(seasonConfig.seasonNumber) || 0) * 1000 + Math.floor(Math.random() * 1000) + 1;
  }
  return gs.pm.seed;
}

/**
 * Each islander's cast setup, as the engine reads it (js/pm/profile.js
 * resolveIslander). Anything the author left blank rolls or defaults there.
 */
export function perfectMatchSetup() {
  return { ...(seasonConfig.pmSetup || {}) };
}

/**
 * The first reason this cast cannot start a villa, or null. The engine needs
 * starters to couple up on night one, and an even split of them.
 */
export function perfectMatchCastProblem(cast = (players || []).map(p => p.name).filter(Boolean),
  setup = perfectMatchSetup()) {
  const roleOf = n => setup[n]?.role || null;
  // Unassigned islanders take the default split, by position: 10 / 6 / rest.
  const roles = cast.map((n, i) => roleOf(n) || (i < 10 ? 'starter' : i < 16 ? 'bombshell' : 'casa'));
  const starters = cast.filter((_, i) => roles[i] === 'starter');
  if (starters.length < 6) return `a villa needs at least six starters to couple up on night one, and this cast has ${starters.length}`;
  const g = n => players.find(p => p.name === n)?.gender;
  const f = starters.filter(n => g(n) === 'f').length, m = starters.filter(n => g(n) === 'm').length;
  if (f !== m) return `the starters have to pair up on night one: ${f} women and ${m} men won't all couple`;
  for (const n of cast) {
    const d = setup[n]?.dialect;
    if (d && !Object.hasOwn(DIALECTS, d)) return `${n}'s "where they're from" is not one this simulator knows (${d})`;
  }
  return null;
}

/**
 * Play the whole season into the queue. `playPerfectMatchSeason` replaces `gs`
 * (it is a headless harness), so the setup's `gs` is held aside and put back,
 * with the rows, the ledger and the relationships carried across.
 */
function _playWholeSeason() {
  _lastRefusal = null;
  const outer = gs;
  const saved = Array.isArray(gs.pm?.castOrder) && gs.pm.castOrder.length ? gs.pm.castOrder : null;
  const cast = saved || (players || []).map(p => p.name).filter(Boolean);
  const setup = gs.pm?.setup || perfectMatchSetup();
  // Roles the author left blank take the default split, so the engine always
  // gets a starter, bombshell or Casa arrival for everybody.
  const resolved = Object.fromEntries(cast.map((n, i) => [n, {
    ...(setup[n] || {}),
    role: setup[n]?.role || (i < 10 ? 'starter' : i < 16 ? 'bombshell' : 'casa'),
  }]));
  const problem = perfectMatchCastProblem(cast, resolved);
  if (problem) return _refuse(problem);
  const seed = _seed();
  const result = playPerfectMatchSeason({
    cast, setup: resolved, seed,
    splitOrStealOn: seasonConfig.pmSplitOrSteal === true,
    dialect: Object.hasOwn(DIALECTS, seasonConfig.pmDialect || '') ? seasonConfig.pmDialect : 'uk',
  });
  const inner = gs;
  setGs(outer);
  gs.pm = { seed, castOrder: [...cast], setup: resolved, winners: result.winners || [] };
  gs._pmQueue = [...(inner.episodeHistory || [])];
  gs.popularity = { ...(gs.popularity || {}), ...(inner.popularity || {}) };
  gs.relationshipDimensions = inner.relationshipDimensions || {};
  gs.bonds = inner.bonds || {};
  gs.perceivedBonds = inner.perceivedBonds || {};
  return true;
}

/**
 * Air the next episode, or null when the season is over (or cannot start —
 * `lastPerfectMatchRefusal()` says why). Returns the row, as
 * `simulateEpisode` does, so `simulateNext` treats every show the same way.
 */
export function simulatePerfectMatchEpisode() {
  if (!gs) return null;
  if (!Array.isArray(gs._pmQueue)) {
    const aired = (gs.episodeHistory || []).filter(r => r && r.format === PERFECT_MATCH_FORMAT).length;
    if (!_playWholeSeason()) return null;
    if (aired > 0) gs._pmQueue = gs._pmQueue.slice(aired);
  }
  const row = gs._pmQueue.shift();
  if (!row) { gs.phase = 'complete'; return null; }
  (gs.episodeHistory ||= []).push(row);
  gs.activePlayers = [...(row.pm?.villa || [])];
  gs.episode = row.num;
  gs.phase = gs._pmQueue.length ? 'villa' : 'complete';
  if (!gs._pmQueue.length) gs.pmWinners = [...(gs.pm?.winners || [])];
  return row;
}

export function perfectMatchEpisodesLeft() {
  return Array.isArray(gs?._pmQueue) ? gs._pmQueue.length : null;
}

/**
 * A re-run would have to re-roll one episode and keep every earlier one
 * exactly as it aired. The engine has no re-roll yet, and a replay that
 * re-airs instead of re-running is §11.5 N — so it refuses, and says so.
 */
export function perfectMatchCanRerun() { return false; }
export function rerunPerfectMatchEpisode() {
  return _refuse("re-running a villa episode isn't built yet — the season plays as it was dealt");
}

if (typeof window !== 'undefined') window._pmRunnable = true;
