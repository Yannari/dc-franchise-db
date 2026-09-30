// ══════════════════════════════════════════════════════════════════════
// ci-run.js — the run loop's Circle branch, and the runnable flag (Plan 4)
// ══════════════════════════════════════════════════════════════════════
//
// Same shape as js/pm-run.js. The engine plays the WHOLE season in one call
// (js/ci/season.js) — the final ratings depend on everything that aired —
// and the rows are queued on `gs._ciQueue`; each press of "Simulate Episode
// N" shifts one onto `gs.episodeHistory`.
//
// The seed and the cast ORDER live on `gs.ci`, so a queue lost to a reload
// rebuilds the SAME season and drops the rows that already aired, rather
// than regenerating a different season and stacking it onto the history.
//
// WHAT CROSSES BACK: the rows (each carries its aired scenes, written, and a
// name map) and the relationships (the wiki and the feed read them) — never
// the engine's `state`, which holds the whole season a second time.
//
// IMPORTING THIS MODULE IS THE WIRING: it sets `window._ciRunnable`, which
// `formatIsRunnable()` reads. Drop the import from js/main.js and the show
// silently un-ships with every test still green.
import { gs, setGs, players, seasonConfig, seasonFormat, TWIST_CATALOG } from './core.js';
import { CIRCLE_FORMAT } from './shows.js';
import { playCircleSeason } from './ci/season.js';
import { buildSchedule, rhythmOf } from './ci/schedule.js';
import { carriedFor } from './franchise-carry.js';
import { buildFranchiseMeta } from './franchise-meta.js';
import { fameStarsFor } from './alumni.js';
import { DEFAULT_POOL } from './ci/default-pool.js';

export const isCircleSeason = () => seasonFormat(seasonConfig) === CIRCLE_FORMAT;

let _lastRefusal = null;
const _refuse = why => { _lastRefusal = why; return false; };
/** Why the last attempt to play or re-run did not happen, in words for a toast. */
export function lastCircleRefusal() { return _lastRefusal; }

function _seed() {
  gs.ci ||= {};
  if (!gs.ci.seed) gs.ci.seed = (Number(seasonConfig.seasonNumber) || 0) * 1000 + Math.floor(Math.random() * 1000) + 1;
  return gs.ci.seed;
}

const _cast = () => {
  const saved = Array.isArray(gs?.ci?.castOrder) && gs.ci.castOrder.length ? gs.ci.castOrder : null;
  return saved || (players || []).map(p => p.name).filter(Boolean);
};

/** Create Character's facts for a cast member. A cast entry carries only the
 *  game fields (name, stats, archetype, portrait); the age, birthdate,
 *  occupation and hometown stay on the roster, found by slug, then name. */
export function rosterFactsOf(p = {}) {
  const roster = typeof window !== 'undefined' && Array.isArray(window.FRANCHISE_ROSTER) ? window.FRANCHISE_ROSTER : [];
  const r = (p.slug && roster.find(x => x.slug === p.slug)) || roster.find(x => x.name === p.name);
  if (!r) return {};
  const out = {};
  for (const k of ['age', 'birthdate', 'occupation', 'hometown']) if (r[k] != null && r[k] !== '') out[k] = r[k];
  return out;
}

/** "Already famous?" left on Auto: what the room might know of each player,
 *  from the franchise's celebrity system (js/fame.js stars, by slug), the cast
 *  form's background, and the franchise record. In order:
 *    a known schemer in the record                     -> a villain
 *    4.5+ stars (Icon, Celebrity), or background Celebrity -> a celebrity
 *    aired before, and played a villain or a schemer   -> a villain
 *    2.5+ stars (Household Name, Star), a past winner/finalist,
 *      or aired before as a mastermind                 -> a big threat
 *    any recorded past or fame, or a returnee          -> known
 *    otherwise                                         -> nobody
 *  Returns { name: { rep, stars } }; `starsOf` is for tests. */
export function circleKnownAs(cast = players || [], { starsOf = p => fameStarsFor(p.slug || String(p.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')) } = {}) {
  let meta = null;
  try { meta = buildFranchiseMeta(cast, seasonConfig); } catch { meta = null; }
  return Object.fromEntries((cast || []).filter(p => p && p.name).map(p => {
    const m = meta?.profiles?.[p.name];
    let stars = null;
    try { stars = starsOf(p); } catch { stars = null; }
    const s = Number(stars) || 0;
    // Seen on TV before: a record, any fame, or a returnee.
    const aired = !!m || s > 0 || p.isReturnee || p.backgroundType === 'alumni';
    // How they played on screen is how the audience knows them (user,
    // 2026-09-30): the backfilled seasons hold no betrayals, so the record's
    // schemer score alone found nobody. A first-timer is never auto-marked.
    const rep = m?.knownSchemer >= 0.5 ? 'villain'
      : s >= 4.5 || p.backgroundType === 'celebrity' ? 'celebrity'
        : aired && ['villain', 'schemer'].includes(p.archetype) ? 'villain'
          : s >= 2.5 || m?.repScore >= 0.5 || (aired && p.archetype === 'mastermind') ? 'threat'
            : aired ? 'known' : 'none';
    return [p.name, { rep, stars: stars == null ? null : s }];
  }));
}

/** Each player's Profile Plan (Cast tab), as the engine reads it. */
export function circleSetup() { return { ...(seasonConfig.ciSetup || {}) }; }

/** Who starts on Day 1 and who arrives later: the author's roles stand; the
 *  rest split as the US seasons did (about eight of thirteen start). */
export function circleRoles(cast = _cast(), setup = circleSetup()) {
  const starters = Math.max(3, Math.round(cast.length * 0.62));
  let open = starters - cast.filter(n => setup[n]?.role === 'starter').length;
  return cast.map(n => {
    const set = setup[n]?.role;
    if (set === 'starter' || set === 'newcomer') return set;
    if (open > 0) { open--; return 'starter'; }
    return 'newcomer';
  });
}

const _finalists = (config = seasonConfig) => (config?.ciFinalists === 4 ? 4 : 5);

/** The first reason this cast cannot start a season, or null. Quick Setup's
 *  ready check says the same words (js/quick-setup.js). */
export function circleCastProblem(cast = _cast(), setup = circleSetup(), finalists = _finalists()) {
  if (cast.length < finalists + 1) return `a season needs more players than finalists: ${cast.length} players, ${finalists} finalists`;
  const roles = circleRoles(cast, setup);
  if (roles.filter(r => r === 'starter').length < 3) return 'a season needs at least three players on Day 1';
  return null;
}

function _options() {
  return {
    finalists: _finalists(),
    days: Number(seasonConfig.ciDays) > 0 ? Number(seasonConfig.ciDays) : null,
    newcomerRule: seasonConfig.ciNewcomerRule || 'rate-not-rated',
    pickBy: seasonConfig.ciPickBy === 'random' ? 'random' : 'stats',
    ai: seasonConfig.ciAI === true,
    bookings: circleBookings(),
  };
}

/** The days this cast and these options make, with slot names (the Season
 *  Timeline reads this). Bookings do not change the days, only what they are. */
export function circleSeasonShape() { return circleSeasonShapeRaw(); }

/** The Season Timeline's tiles: one episode a day, and how many are still in
 *  (from the season the engine actually played, aired or queued). */
export function circleEpisodeMap() {
  const days = circleTimelineDays();
  return circleSeasonShape().map(d => ({ ep: d.day, active: days.get(d.day)?.end ?? 0,
    phase: d.final || d.finale ? 'finale' : 'main', engineType: null, tribes: 1 }));
}

/** Each day for the Season Timeline's tile: what it holds, in the show's
 *  words, and how many profiles are in at its start and its end. Projected
 *  from the schedule until the season is played (a blocking takes one, a
 *  newcomer adds one), then the counts that happened. A card booked on a day
 *  that cannot use it is dropped by the engine, so the label is what tells
 *  the author where a blocking or an arrival can go. */
export function circleTimelineDays() {
  const rows = new Map([...(gs?.episodeHistory || []).filter(r => r?.format === CIRCLE_FORMAT), ...(gs?._ciQueue || [])]
    .map(r => [r.num, r]));
  const cast = _cast();
  const ai = seasonConfig.ciAI === true;
  let n = circleRoles(cast).filter(r => r === 'starter').length + (ai ? 1 : 0);
  const out = new Map();
  const shape = circleSeasonShape();
  for (const d of shape) {
    const start = n;
    const row = rows.get(d.day);
    // The ratings end a day; that night's blocking opens the next (season.js).
    const blocksHere = !!shape[d.day - 2]?.block;
    if (row?.ci?.people) n = row.ci.people.length;
    else n += (d.arrivals || 0) - (blocksHere ? 1 : 0);
    const parts = d.finale ? ['Finale'] : d.final ? [blocksHere ? 'Blocking' : null, 'Final ratings']
      : [blocksHere ? 'Blocking' : null, d.block ? 'Ratings' : null, !blocksHere && !d.block ? 'A quiet day' : null,
        d.arrivals ? (d.arrivals === 1 ? 'Newcomer' : `${d.arrivals} newcomers`) : null,
        d.game ? 'Game' : null, d.party ? 'Party' : null, d.homeVideos ? 'Videos from home' : null];
    out.set(d.day, { label: parts.filter(Boolean).join(' · '), start, end: n, slot: d.slot, block: blocksHere, ratings: !!d.block, arrivals: d.arrivals || 0 });
  }
  return out;
}

/** The author's bookings, by slot, read off the Season Timeline (the same
 *  array every show books into, `seasonConfig.twistSchedule`): a Circle card
 *  booked on episode N books the slot day N is. */
export function circleBookings() {
  const slotAt = new Map(circleSeasonShapeRaw().map(d => [d.day, d.slot]));
  const out = {};
  const mine = new Set(TWIST_CATALOG.filter(t => t.format === CIRCLE_FORMAT).map(t => t.id));
  for (const b of seasonConfig.twistSchedule || []) {
    const id = b?.type || b?.id;
    if (!mine.has(id)) continue;
    const slot = slotAt.get(Number(b.episode));
    if (slot) (out[slot] ||= []).push(id);
  }
  return out;
}
// The shape without bookings (bookings are read off it: no loop).
function circleSeasonShapeRaw() { return circleShapeOf({ cast: _cast(), setup: circleSetup(), config: seasonConfig }); }

/** The days a cast and a config make, without touching the live season: the
 *  run loop and Quick Setup's blueprint read the same answer. [] if none. */
export function circleShapeOf({ cast = [], setup = {}, config = {} } = {}) {
  const roles = circleRoles(cast, setup);
  const ai = config.ciAI === true;
  try {
    return buildSchedule({ total: cast.length + (ai ? 1 : 0), starters: roles.filter(r => r === 'starter').length + (ai ? 1 : 0),
      finalists: _finalists(config), days: Number(config.ciDays) > 0 ? Number(config.ciDays) : null,
      // the same rhythm the engine will play (schedule.js rhythmOf)
      rhythm: rhythmOf(cast.map(p => p.name)) });
  } catch { return []; }
}

function _inputs() {
  // No pool written: the default one (ci/default-pool.js). An empty list is
  // the author's choice of a season with no catfish, and stands.
  const pool = Array.isArray(seasonConfig.ciPool) ? seasonConfig.ciPool : DEFAULT_POOL;
  return { setup: circleSetup(), pool: [...pool], options: _options() };
}
const _sig = inputs => JSON.stringify(inputs);
const _fingerprint = r => JSON.stringify([r?.num, r?.ci?.blocked, r?.ci?.active]);
function _firstChanged(aired, rows) {
  for (let i = 0; i < aired.length; i++) if (_fingerprint(aired[i]) !== _fingerprint(rows[i])) return aired[i].num;
  return null;
}

function _build(inputs, rerolls) {
  _lastRefusal = null;
  const cast = _cast();
  const problem = circleCastProblem(cast, inputs.setup);
  if (problem) { _refuse(problem); return null; }
  const roles = circleRoles(cast, inputs.setup);
  const known = circleKnownAs((players || []).filter(p => p && cast.includes(p.name)));
  const setup = Object.fromEntries(cast.map((n, i) => [n, { ...(inputs.setup[n] || {}), role: roles[i],
    from: rosterFactsOf((players || []).find(p => p && p.name === n) || { name: n }), autoRep: known[n]?.rep || 'none', autoStars: known[n]?.stars ?? null }]));
  const seed = _seed();
  const outer = gs;
  let result, inner;
  try {
    const carried = carriedFor((players || []).filter(p => p && cast.includes(p.name)), seasonConfig || {});
    result = playCircleSeason({ cast, setup, pool: inputs.pool, seed, carried, options: { ...inputs.options, rerolls } });
    inner = gs;
  } finally { setGs(outer); }
  const winner = result.result?.winner?.profile ?? result.result?.winner ?? null;
  const winnerPeople = winner ? (result.state.profiles[winner]?.players || []) : [];
  return { cast, setup, seed, rows: result.rows, inner, winnerPeople, fanFavorite: result.result?.fanFavorite || null,
    dealt: result.state.dealt || {}, unused: result.state.dealtUnused || [] };
}

function _commit(built, inputs, rerolls, airedCount) {
  gs.ci = { seed: built.seed, castOrder: [...built.cast], setup: built.setup, winners: built.winnerPeople,
    fanFavorite: built.fanFavorite, rerolls: { ...rerolls }, built: _sig(inputs),
    // What each player was dealt, for the cast cards; and the personas nobody took.
    dealt: built.dealt, unused: built.unused };
  gs._ciQueue = built.rows.slice(airedCount);
  gs.relationshipDimensions = built.inner.relationshipDimensions || {};
  gs.bonds = built.inner.bonds || {};
  gs.perceivedBonds = built.inner.perceivedBonds || {};
}

let _lastNotice = null;
/** A change the run could not apply to what already aired, in words — or null. */
export function circlePendingChange() { return _lastNotice; }

function _refreshQueue() {
  const aired = (gs.episodeHistory || []).filter(r => r && r.format === CIRCLE_FORMAT);
  const inputs = _inputs();
  const rerolls = { ...(gs.ci?.rerolls || {}) };
  if (Array.isArray(gs._ciQueue) && gs.ci?.built === _sig(inputs)) return true;
  if (Array.isArray(gs._ciQueue) && gs.ci?.deferred === _sig(inputs)) return true;
  const built = _build(inputs, rerolls);
  if (!built) return false;
  const changed = _firstChanged(aired, built.rows);
  if (changed == null) { _lastNotice = null; _commit(built, inputs, rerolls, aired.length); return true; }
  _lastNotice = `That change affects episode ${changed}, which has already aired. Re-run episode ${changed} to play it with the change.`;
  if (!Array.isArray(gs._ciQueue)) {
    const asDealt = { ...inputs, setup: gs.ci?.setup || inputs.setup };
    const again = _build(asDealt, rerolls);
    if (!again) return false;
    _commit(again, asDealt, rerolls, aired.length);
  }
  gs.ci.deferred = _sig(inputs);
  return true;
}

/** Air the next episode, or null when the season is over (or cannot start). */
export function simulateCircleEpisode() {
  if (!gs) return null;
  if (!_refreshQueue()) return null;
  const row = gs._ciQueue.shift();
  if (!row) { gs.phase = 'complete'; return null; }
  (gs.episodeHistory ||= []).push(row);
  gs.activePlayers = [...(row.ci?.people || [])];
  gs.episode = row.num;
  gs.phase = gs._ciQueue.length ? 'circle' : 'complete';
  if (!gs._ciQueue.length) gs.ciWinners = [...(gs.ci?.winners || [])];
  // What the run tab shows when this episode is reviewed later: who was in
  // after it, not who is in now. The site's own whitelist snapshot (the run
  // tab's side panel reads it whole); the bare fields where it is not loaded.
  row.gsSnapshot = typeof window !== 'undefined' && window.snapshotGameState
    ? window.snapshotGameState()
    : { initialized: true, activePlayers: [...gs.activePlayers], episode: gs.episode, phase: gs.phase };
  return row;
}

// How a night's blocking was decided, for the hub's corner (the place a
// voting show prints its tally). By channel (js/ci/blocking.js, formats.js).
const CHANNEL_WORDS = {
  instant: 'Lowest rated, blocked on the spot', egg: 'The room chose which egg stayed',
  clone: 'The room found the fake clone', mission: 'A secret task decided it',
  antivirus: 'Never got the antivirus', unsaved: 'Nobody saved them', statement: 'Named by the room',
  vote: 'The players chose', sacrifice: "Took their Ride or Die's place",
};
export function circleBlockShape(exits = []) {
  if (!exits.length) return 'No blocking';
  const x = exits[0];
  if (x.secret) return 'Secret Influencers';
  if (CHANNEL_WORDS[x.channel]) return CHANNEL_WORDS[x.channel];
  const by = [...new Set(exits.flatMap(e => e.by || []))];
  return by.length ? `${by.length > 1 || x.channel === 'influencers' ? 'Influencers' : 'Decided by'}: ${by.join(' & ')}` : 'Blocked';
}

export function circleEpisodesLeft() { return Array.isArray(gs?._ciQueue) ? gs._ciQueue.length : null; }

/** A season with a seed can re-run any episode: the dice are per day. */
export function circleCanRerun() { return !!gs?.ci?.seed; }

/** Re-deal episode N: its own dice turn once more; every earlier episode
 *  stays exactly as it aired; later ones are cleared, to be simulated again. */
export function rerunCircleEpisode(epNum) {
  _lastRefusal = null;
  if (!gs?.ci?.seed) return _refuse('this season has no stored seed, so the episodes that already aired could not be reproduced');
  const N = Math.max(1, Number(epNum) || 1);
  const aired = (gs.episodeHistory || []).filter(r => r && r.format === CIRCLE_FORMAT);
  const prefix = aired.filter(r => r.num < N);
  const inputs = _inputs();
  const rerolls = { ...(gs.ci.rerolls || {}), [N]: ((gs.ci.rerolls || {})[N] || 0) + 1 };
  const built = _build(inputs, rerolls);
  if (!built) return false;
  const changed = _firstChanged(prefix, built.rows);
  if (changed != null) return _refuse(`a change to the setup affects episode ${changed}, which comes before episode ${N}. Re-run episode ${changed} instead`);
  if (!built.rows.some(r => r.num === N)) return _refuse(`the season has no episode ${N}`);
  gs.episodeHistory = [...(gs.episodeHistory || []).filter(r => !(r && r.format === CIRCLE_FORMAT && r.num >= N))];
  _commit(built, inputs, rerolls, prefix.length);
  _lastNotice = null;
  delete gs.ciWinners;
  gs.phase = 'circle';
  const last = prefix[prefix.length - 1];
  gs.activePlayers = last ? [...(last.ci?.people || [])] : [];
  gs.episode = last ? last.num : 0;
  return true;
}

if (typeof window !== 'undefined') window._ciRunnable = true;
