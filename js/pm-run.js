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

/** The author's pinned formats (VILLA OPTIONS), by episode: { 5: 'save-one' }. */
export function perfectMatchPicks() {
  return { ...(seasonConfig.pmPicks || {}) };
}

// ── NOTHING IS DECIDED UNTIL IT AIRS ──────────────────────────────────
//
// The season is played whole, but only the rows that AIRED are fixed. A pick
// or a cast-setup change made mid-season rebuilds everything that has not
// aired; the engine's per-episode dice mean the aired episodes come back
// identical, so the new future joins the old past cleanly. A change that
// WOULD rewrite an aired episode (an islander's intent from night one) is not
// applied to the past behind the viewer's back: the run keeps playing the
// season as dealt and says which episode to re-run to use it.

const _fingerprint = r => JSON.stringify([r?.num, r?.pm?.couples, (r?.exits || []).map(x => x.name),
  (r?.pm?.events || []).map(e => e.kind + ':' + e.players.join('+'))]);

/** The first aired episode a rebuilt season would change, or null. */
function _firstChanged(aired, rows) {
  for (let i = 0; i < aired.length; i++) if (_fingerprint(aired[i]) !== _fingerprint(rows[i])) return aired[i].num;
  return null;
}

function _inputs() {
  return {
    setup: perfectMatchSetup(), picks: perfectMatchPicks(),
    splitOrStealOn: seasonConfig.pmSplitOrSteal === true,
    dialect: Object.hasOwn(DIALECTS, seasonConfig.pmDialect || '') ? seasonConfig.pmDialect : 'uk',
  };
}
const _sig = inputs => JSON.stringify(inputs);

/**
 * Play the whole season off the stored seed and cast order, WITHOUT touching
 * `gs`. `playPerfectMatchSeason` replaces `gs` (it is a headless harness), so
 * the outer one is held aside and put back.
 */
function _build(inputs, rerolls) {
  _lastRefusal = null;
  const saved = Array.isArray(gs.pm?.castOrder) && gs.pm.castOrder.length ? gs.pm.castOrder : null;
  const cast = saved || (players || []).map(p => p.name).filter(Boolean);
  // Roles the author left blank take the default split, so the engine always
  // gets a starter, bombshell or Casa arrival for everybody.
  const resolved = Object.fromEntries(cast.map((n, i) => [n, {
    ...(inputs.setup[n] || {}),
    role: inputs.setup[n]?.role || (i < 10 ? 'starter' : i < 16 ? 'bombshell' : 'casa'),
  }]));
  const problem = perfectMatchCastProblem(cast, resolved);
  if (problem) { _refuse(problem); return null; }
  const seed = _seed();
  const outer = gs;
  let result, inner;
  try {
    result = playPerfectMatchSeason({ cast, setup: resolved, seed, picks: inputs.picks, rerolls,
      splitOrStealOn: inputs.splitOrStealOn, dialect: inputs.dialect });
    inner = gs;
  } finally { setGs(outer); }
  return { cast, resolved, seed, rows: inner.episodeHistory || [], winners: result.winners || [], inner };
}

/** Make a built season the one on `gs`: the aired rows stay, the rest queue. */
function _commit(built, inputs, rerolls, airedCount) {
  const { inner } = built;
  gs.pm = { seed: built.seed, castOrder: [...built.cast], setup: built.resolved, winners: built.winners,
    picks: { ...inputs.picks }, rerolls: { ...rerolls }, built: _sig(inputs) };
  gs._pmQueue = built.rows.slice(airedCount);
  gs.popularity = { ...(gs.popularity || {}), ...(inner.popularity || {}) };
  gs.relationshipDimensions = inner.relationshipDimensions || {};
  gs.bonds = inner.bonds || {};
  gs.perceivedBonds = inner.perceivedBonds || {};
}

let _lastNotice = null;
/** A change the run could not apply to what already aired, in words — or null. */
export function perfectMatchPendingChange() { return _lastNotice; }

/**
 * Bring the queue up to date with the current picks and cast setup. Returns
 * false only when the cast cannot start a villa at all.
 */
function _refreshQueue() {
  const aired = (gs.episodeHistory || []).filter(r => r && r.format === PERFECT_MATCH_FORMAT);
  const inputs = _inputs();
  const rerolls = { ...(gs.pm?.rerolls || {}) };
  const fresh = Array.isArray(gs._pmQueue) && gs.pm?.built === _sig(inputs);
  if (fresh) return true;
  // A change already found to touch the past, and a queue still in hand:
  // keep playing the season as dealt rather than rebuild it every press.
  if (Array.isArray(gs._pmQueue) && gs.pm?.deferred === _sig(inputs)) return true;
  const built = _build(inputs, rerolls);
  if (!built) return false;
  const changed = _firstChanged(aired, built.rows);
  if (changed == null) { _lastNotice = null; _commit(built, inputs, rerolls, aired.length); return true; }
  // The change would rewrite an aired episode. With the queue in hand, keep
  // it; without it (a reload), rebuild the season as it was dealt.
  _lastNotice = `That change affects episode ${changed}, which has already aired. `
    + `Re-run episode ${changed} to play it with the change.`;
  if (!Array.isArray(gs._pmQueue)) {
    const asDealt = { ...inputs, setup: gs.pm?.setup || inputs.setup, picks: gs.pm?.picks || {} };
    const again = _build(asDealt, rerolls);
    if (!again) return false;
    _commit(again, asDealt, rerolls, aired.length);
  }
  gs.pm.deferred = _sig(inputs);
  return true;
}

/**
 * Air the next episode, or null when the season is over (or cannot start —
 * `lastPerfectMatchRefusal()` says why). Returns the row, as
 * `simulateEpisode` does, so `simulateNext` treats every show the same way.
 */
export function simulatePerfectMatchEpisode() {
  if (!gs) return null;
  if (!_refreshQueue()) return null;
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

/** A season that has a seed can re-run any episode: the dice are per episode. */
export function perfectMatchCanRerun() { return !!gs?.pm?.seed; }

/**
 * Re-deal episode N: its own dice turn once more, with the CURRENT picks and
 * cast setup, and every earlier episode stays exactly as it aired. Episodes
 * after N are cleared, to be simulated again from the new night. The caller
 * airs N itself (the Traitors pattern: re-running episode 2 must not replay
 * the whole season).
 */
export function rerunPerfectMatchEpisode(epNum) {
  _lastRefusal = null;
  if (!gs?.pm?.seed) return _refuse('this season has no stored seed, so the episodes that already aired could not be reproduced');
  const N = Math.max(1, Number(epNum) || 1);
  const aired = (gs.episodeHistory || []).filter(r => r && r.format === PERFECT_MATCH_FORMAT);
  const prefix = aired.filter(r => r.num < N);
  const inputs = _inputs();
  const rerolls = { ...(gs.pm.rerolls || {}), [N]: ((gs.pm.rerolls || {})[N] || 0) + 1 };
  const built = _build(inputs, rerolls);
  if (!built) return false;
  const changed = _firstChanged(prefix, built.rows);
  if (changed != null) {
    return _refuse(`a change to the cast setup affects episode ${changed}, which comes before episode ${N}. `
      + `Re-run episode ${changed} instead`);
  }
  if (!built.rows.some(r => r.num === N)) return _refuse(`the season has no episode ${N}`);
  // The literal aired rows, not the replay's copies: a re-run of the future
  // never touches the past, by construction.
  gs.episodeHistory = [...(gs.episodeHistory || []).filter(r => !(r && r.format === PERFECT_MATCH_FORMAT && r.num >= N))];
  _commit(built, inputs, rerolls, prefix.length);
  _lastNotice = null;
  delete gs.pmWinners;
  gs.phase = 'villa';
  const last = prefix[prefix.length - 1];
  gs.activePlayers = last ? [...(last.pm?.villa || [])] : [];
  gs.episode = last ? last.num : 0;
  return true;
}

if (typeof window !== 'undefined') window._pmRunnable = true;
