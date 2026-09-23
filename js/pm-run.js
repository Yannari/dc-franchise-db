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
import { gs, setGs, players, seasonConfig, seasonFormat, twistsForFormat } from './core.js';
import { PERFECT_MATCH_FORMAT } from './shows.js';
import { playPerfectMatchSeason, perfectMatchScheduleFor } from './pm/season.js';
import { assignRoles, buildSchedule, withPicks, withBookings } from './pm/schedule.js';
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
 * Every islander's role, in cast order: the ones set on the Cast tab stand,
 * and VILLA OPTIONS' counts (or the automatic split) place the rest.
 */
export function perfectMatchRoles(cast, setup = perfectMatchSetup(), counts = seasonConfig.pmRoleCounts || {}) {
  return assignRoles(cast.map(n => setup[n]?.role || null), counts);
}

/**
 * The first reason this cast cannot start a villa, or null. The engine needs
 * starters to couple up on night one, and an even split of them.
 */
export function perfectMatchCastProblem(cast = (players || []).map(p => p.name).filter(Boolean),
  setup = perfectMatchSetup()) {
  const roles = perfectMatchRoles(cast, setup);
  const c = seasonConfig.pmRoleCounts || {};
  const set = ['starters', 'bombshells', 'casa'].map(k => (Number.isInteger(c[k]) ? c[k] : null));
  if (set.every(v => v != null) && set.reduce((a, b) => a + b, 0) !== cast.length) {
    return `the starters, bombshells and Casa Amor arrivals add up to ${set.reduce((a, b) => a + b, 0)}, but the cast has ${cast.length}`;
  }
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
 * The episodes this cast and these options make: every episode's moment, and
 * each drawn slot's format (with the author's picks). Before the season has a
 * seed the formats are not drawn yet — only the shape is known. The run tab's
 * timeline, the cast panel and the pick menus all read this one answer.
 */
export function perfectMatchSeasonShape() {
  const saved = Array.isArray(gs?.pm?.castOrder) && gs.pm.castOrder.length ? gs.pm.castOrder : null;
  const cast = saved || (players || []).map(p => p.name).filter(Boolean);
  const setup = perfectMatchSetup();
  const roles = perfectMatchRoles(cast, setup);
  const count = r => roles.filter(x => x === r).length;
  const episodes = Number(seasonConfig.pmEpisodes) > 0 ? Number(seasonConfig.pmEpisodes) : null;
  const shape = { bombshells: count('bombshell'), casa: count('casa'), episodes };
  const seed = gs?.pm?.seed;
  const schedule = seed ? perfectMatchScheduleFor(seed, shape) : buildSchedule(shape);
  return { ...shape, starters: count('starter'), auto: buildSchedule({ ...shape, episodes: null }).length,
    schedule: withBookings(withPicks(schedule, perfectMatchPicks()), perfectMatchBookings()) };
}

/**
 * The author's pinned formats, by slot ({ vote1: 'save-one' }), read off the
 * Season Timeline: a villa dumping twist booked on an episode pins the vote
 * slot that episode is. The same array every show books into
 * (`seasonConfig.twistSchedule`), translated here in the engine's own words —
 * the Drag Race pattern (js/dr-run.js _twistsToSchedule). A booking on an
 * episode that is not a vote night, or not one that format can play, is
 * ignored rather than moved.
 */
export function perfectMatchPicks() {
  const mine = new Map(twistsForFormat({ format: PERFECT_MATCH_FORMAT }).filter(t => t.pmFormat).map(t => [t.id, t]));
  const booked = (seasonConfig.twistSchedule || []).filter(b => b && (mine.has(b.type) || mine.has(b.id)));
  if (!booked.length) return {};
  const slotAt = new Map(perfectMatchSlots().map(e => [e.ep, e.slot]));
  const picks = {};
  for (const b of booked) {
    const tw = mine.get(b.type) || mine.get(b.id);
    const slot = slotAt.get(Number(b.episode));
    if (slot && tw.pmSlots.includes(slot)) picks[slot] = tw.pmFormat;
  }
  return picks;
}

/**
 * What each night does to the villa, for the Season Timeline (user: "I see 11
 * left, then 11 again and again … I don't know when the dumpings are"). The
 * count alone sat still because a bombshell walked in the night after
 * somebody was dumped. From the same season the badge reads: who was there,
 * who walked in, who left and how. null when no season can be built yet.
 */
export function perfectMatchNights() {
  const real = _seasonRows();
  if (!real) return null;
  const out = new Map();
  // Night one starts from the starters: a bombshell who walks in that night is an arrival too.
  let prev = perfectMatchSeasonShape().starters || null;
  for (const r of real) {
    const end = (r.pm?.villa || []).length, left = r.exits || [];
    const peak = end + left.length;
    out.set(r.num, { start: prev ?? peak, peak, end, arrived: prev == null ? 0 : Math.max(0, peak - prev), moment: r.moment,
      left: left.map(x => ({ verb: x.verb, channel: x.channel || null })) });
    prev = end;
  }
  return out;
}

/**
 * How many islanders are in the villa going into each episode, for the Season
 * Timeline. Aired episodes use the villa they actually had; the rest are
 * projected on the season's own pace (pm/season.js): arrivals come in, each
 * dumping night takes its share of the islanders the villa has to lose to
 * reach four couples, stick or twist sends most of Casa Amor home, and the
 * semi-final trims to the final's four couples. The map used to carry the
 * cast size forward, so every episode read "18 left" and nobody went home.
 */
export function perfectMatchVillaCounts() {
  // THE SEASON ITSELF, not a guess at it (user: "not sure the 10 left badge
  // is actually working"). The seed is fixed once chosen, so the season a
  // headless build plays with today's inputs is the season that will air:
  // each episode's badge is everybody in the villa that night, its arrivals
  // and its departures included. Aired rows are the record; the rest come
  // from the queue if it is current, or a preview built and kept until an
  // input changes. The formula below is only for a cast that cannot start.
  const real = _seasonRows();
  if (real) return new Map(real.map(r => [r.num, (r.pm?.villa || []).length + (r.exits || []).length]));
  const shape = perfectMatchSeasonShape();
  const aired = new Map((gs?.episodeHistory || []).filter(r => r && r.format === PERFECT_MATCH_FORMAT).map(r => [r.num, r]));
  const FINAL = 8;
  let count = shape.starters;
  let bombsLeft = shape.bombshells;
  const out = new Map();
  shape.schedule.forEach((e, i) => {
    const arriving = e.moment === 'casa-open' ? shape.casa : (e.arrivals?.bombshell || 0);
    if (e.moment !== 'casa-open') bombsLeft -= arriving;
    count += arriving;
    out.set(e.ep, count);
    const row = aired.get(e.ep);
    if (row) { count = (row.pm?.villa || []).length || count; return; }
    const ahead = shape.schedule.slice(i);
    const nights = ahead.filter(x => (x.moment === 'recoupling' && !x.keepSingles) || x.moment === 'public-vote').length;
    const pace = (count + bombsLeft - FINAL) / (nights + 1);
    const before = count;
    if (e.moment === 'stick-or-twist') count -= Math.round(shape.casa * 0.8);
    else if (e.moment === 'recoupling' && !e.keepSingles && pace >= 0.5) count -= Math.max(1, Math.round(pace));
    else if (e.moment === 'public-vote' && pace >= 0.8) count -= Math.max(2, Math.round(pace));
    else if (e.moment === 'semi-final') count = Math.min(count, FINAL);
    // A night never takes the villa below the final's four couples.
    if (before >= FINAL) count = Math.max(count, FINAL);
  });
  return out;
}

/**
 * The arrival rules and night-one format booked on the Season Timeline, by
 * episode ({ 6: { arrivalRule: 'stand-up' } }). A booking on a night of the
 * wrong kind is ignored rather than moved.
 */
export function perfectMatchBookings() {
  const mine = new Map(twistsForFormat({ format: PERFECT_MATCH_FORMAT }).filter(t => t.pmOn).map(t => [t.id, t]));
  const booked = (seasonConfig.twistSchedule || []).filter(b => b && (mine.has(b.type) || mine.has(b.id)));
  if (!booked.length) return {};
  const kindAt = new Map(perfectMatchEpisodes().map(e => [e.ep, e.moment]));
  const out = {};
  for (const b of booked) {
    const tw = mine.get(b.type) || mine.get(b.id);
    const ep = Number(b.episode);
    // The Villa Challenge card carries its game in the booking ('' = random).
    const game = tw.pmApply.challenge === 'random' && b.pmGame ? { challenge: b.pmGame } : {};
    if (tw.pmOn.includes(kindAt.get(ep))) out[ep] = { ...(out[ep] || {}), ...tw.pmApply, ...game };
  }
  return out;
}

/** Every episode's kind, for this cast and length (bookings do not move them). */
export function perfectMatchEpisodes() {
  const saved = Array.isArray(gs?.pm?.castOrder) && gs.pm.castOrder.length ? gs.pm.castOrder : null;
  const cast = saved || (players || []).map(p => p.name).filter(Boolean);
  const roles = perfectMatchRoles(cast, perfectMatchSetup());
  const episodes = Number(seasonConfig.pmEpisodes) > 0 ? Number(seasonConfig.pmEpisodes) : null;
  return buildSchedule({ bombshells: roles.filter(r => r === 'bombshell').length,
    casa: roles.filter(r => r === 'casa').length, episodes });
}

/** Which episode is which vote slot, for this cast and length (picks do not move them). */
export function perfectMatchSlots() {
  const saved = Array.isArray(gs?.pm?.castOrder) && gs.pm.castOrder.length ? gs.pm.castOrder : null;
  const cast = saved || (players || []).map(p => p.name).filter(Boolean);
  const roles = perfectMatchRoles(cast, perfectMatchSetup());
  const episodes = Number(seasonConfig.pmEpisodes) > 0 ? Number(seasonConfig.pmEpisodes) : null;
  return buildSchedule({ bombshells: roles.filter(r => r === 'bombshell').length,
    casa: roles.filter(r => r === 'casa').length, episodes }).filter(e => e.slot);
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
    setup: perfectMatchSetup(), picks: perfectMatchPicks(), bookings: perfectMatchBookings(),
    splitOrStealOn: seasonConfig.pmSplitOrSteal === true,
    firstIn: seasonConfig.pmFirstIn === 'm' ? 'm' : 'f',
    dialect: Object.hasOwn(DIALECTS, seasonConfig.pmDialect || '') ? seasonConfig.pmDialect : 'uk',
    roleCounts: { ...(seasonConfig.pmRoleCounts || {}) },
    // The author's length, or null for automatic (from the cast).
    episodes: Number(seasonConfig.pmEpisodes) > 0 ? Number(seasonConfig.pmEpisodes) : null,
  };
}
const _sig = inputs => JSON.stringify(inputs);

/**
 * Play the whole season off the stored seed and cast order, WITHOUT touching
 * `gs`. `playPerfectMatchSeason` replaces `gs` (it is a headless harness), so
 * the outer one is held aside and put back.
 */
let _preview = null;
/** Every episode's row — aired, queued, or previewed — or null if the cast cannot start. */
function _seasonRows() {
  const aired = (gs?.episodeHistory || []).filter(r => r && r.format === PERFECT_MATCH_FORMAT);
  let inputs;
  try { inputs = _inputs(); } catch { return null; }
  const sig = _sig(inputs);
  if (Array.isArray(gs?._pmQueue) && gs.pm?.built === sig) return [...aired, ...gs._pmQueue];
  const rerolls = { ...(gs?.pm?.rerolls || {}) };
  const key = `${sig}|${JSON.stringify(rerolls)}|${gs?.pm?.seed || ''}|${(players || []).map(p => p?.name).join(',')}`;
  if (_preview?.key !== key) {
    let built = null;
    try { built = _build(inputs, rerolls); } catch { built = null; }
    _preview = { key, rows: built ? built.rows : null };
  }
  if (!_preview.rows) return null;
  // What aired stays what aired; the preview supplies the nights still to come.
  const airedNums = new Set(aired.map(r => r.num));
  return [...aired, ..._preview.rows.filter(r => !airedNums.has(r.num))];
}

function _build(inputs, rerolls) {
  _lastRefusal = null;
  const saved = Array.isArray(gs.pm?.castOrder) && gs.pm.castOrder.length ? gs.pm.castOrder : null;
  const cast = saved || (players || []).map(p => p.name).filter(Boolean);
  // Roles the author left blank take the default split, so the engine always
  // gets a starter, bombshell or Casa arrival for everybody.
  const roles = perfectMatchRoles(cast, inputs.setup, inputs.roleCounts);
  const resolved = Object.fromEntries(cast.map((n, i) => [n, { ...(inputs.setup[n] || {}), role: roles[i] }]));
  const problem = perfectMatchCastProblem(cast, resolved);
  if (problem) { _refuse(problem); return null; }
  const seed = _seed();
  const outer = gs;
  let result, inner;
  try {
    result = playPerfectMatchSeason({ cast, setup: resolved, seed, picks: inputs.picks, bookings: inputs.bookings || {}, rerolls,
      splitOrStealOn: inputs.splitOrStealOn, dialect: inputs.dialect, episodes: inputs.episodes, firstIn: inputs.firstIn });
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
