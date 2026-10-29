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
import { gs, setGs, players, seasonConfig, seasonFormat, twistsForFormat, relationships, TWIST_CATALOG } from './core.js';
import { PERFECT_MATCH_FORMAT } from './shows.js';
import { dealUnseen, noteShown, rerollKey } from './seen-episodes.js';
import { playPerfectMatchSeason, perfectMatchScheduleFor, PM_ENGINE } from './pm/season.js';
import { assignRoles, buildSchedule, withPicks, withBookings } from './pm/schedule.js';
import { DIALECTS } from './pm/lines/dialect.js';
import { pmLedgerRecord } from './pm/ledger-record.js';
import { recordBuiltSeason } from './franchise-meta.js';
import { carriedFor } from './franchise-carry.js';

import { airedEpisode } from './exit-interview/aired.js';
import { airedAdapter } from './exit-interview/shows.js';
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
/** How many walk in on each bombshell night, by its place among them ({ 2: 3 }), from the Season Timeline. */
export function perfectMatchArrivalCounts() {
  const c = seasonConfig.pmArrivalCounts;
  if (!c || typeof c !== 'object') return null;
  const out = Object.fromEntries(Object.entries(c).filter(([k, v]) => Number(k) >= 1 && Number(v) >= 1).map(([k, v]) => [k, Number(v)]));
  return Object.keys(out).length ? out : null;
}

export function perfectMatchSeasonShape() {
  const saved = Array.isArray(gs?.pm?.castOrder) && gs.pm.castOrder.length ? gs.pm.castOrder : null;
  const cast = saved || (players || []).map(p => p.name).filter(Boolean);
  // A change parked behind a re-run (_refreshQueue) is not the season on air,
  // and the timeline draws the one that is (user, season 1 at episode 19: "it
  // keeps telling me the elimination should happen ep21 but it happens ep23"
  // — the tiles were the parked 3-couple season, the run the 4-couple one).
  const was = _parkedOver();
  const setup = was?.setup || perfectMatchSetup();
  const roles = perfectMatchRoles(cast, setup, was ? was.roleCounts : (seasonConfig.pmRoleCounts || {}));
  const count = r => roles.filter(x => x === r).length;
  const episodes = was ? was.episodes : Number(seasonConfig.pmEpisodes) > 0 ? Number(seasonConfig.pmEpisodes) : null;
  const shape = { bombshells: count('bombshell'), casa: count('casa'), episodes, counts: was ? was.arrivalCounts : perfectMatchArrivalCounts(), starters: count('starter'),
    finalCouples: was ? was.finalCouples : seasonConfig.pmFinalCouples === 3 ? 3 : 4 };
  const seed = gs?.pm?.seed;
  const schedule = seed ? perfectMatchScheduleFor(seed, shape) : buildSchedule(shape);
  return { ...shape, starters: count('starter'), auto: buildSchedule({ ...shape, episodes: null }).length,
    // What the nights would be with nobody's counts: the timeline's "as scheduled".
    plain: buildSchedule({ ...shape, counts: null }),
    schedule: _asAired(withBookings(withPicks(schedule, was ? was.picks : perfectMatchPicks(), was ? was.forcedSlots : perfectMatchForcedSlots()),
      was ? was.bookings : perfectMatchBookings())) };
}

/**
 * An aired episode is the night that aired. A season continued from an aired
 * episode (a new engine, or a new final or length: _refreshQueue) plays on a
 * schedule whose earlier nights can be different ones — at 27 episodes and
 * three couples, episode 5 is a vote; season 1 aired a villa day there.
 */
function _asAired(schedule) {
  const aired = new Map((gs?.episodeHistory || []).filter(r => r && r.format === PERFECT_MATCH_FORMAT).map(r => [r.num, r]));
  return schedule.map(e => {
    const r = aired.get(e.ep);
    if (!r || r.moment === e.moment) return e;
    return { ep: e.ep, moment: r.moment, days: r.days, calendar: r.calendar || r.days,
      ...(r.pm?.finalRecoupling ? { finalRecoupling: true } : {}), ...(r.pm?.coupled ? { coupled: true } : {}) };
  });
}

/** The cast and options every schedule reader builds from, as the run reads them. */
function _castShape() {
  const saved = Array.isArray(gs?.pm?.castOrder) && gs.pm.castOrder.length ? gs.pm.castOrder : null;
  const cast = saved || (players || []).map(p => p.name).filter(Boolean);
  const roles = perfectMatchRoles(cast, perfectMatchSetup());
  const count = r => roles.filter(x => x === r).length;
  return { bombshells: count('bombshell'), casa: count('casa'), starters: count('starter'),
    episodes: Number(seasonConfig.pmEpisodes) > 0 ? Number(seasonConfig.pmEpisodes) : null,
    counts: perfectMatchArrivalCounts(), finalCouples: seasonConfig.pmFinalCouples === 3 ? 3 : 4 };
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
 * The slots whose format the author booked by hand: those play in full, pace
 * or no pace (moments.js). A Randomize booking (`random: true`) is the draw
 * written down, and keeps the draw's manners — it dumps only when the season
 * can spare somebody.
 */
export function perfectMatchForcedSlots() {
  const mine = new Map(twistsForFormat({ format: PERFECT_MATCH_FORMAT }).filter(t => t.pmFormat).map(t => [t.id, t]));
  const slotAt = new Map(perfectMatchSlots().map(e => [e.ep, e.slot]));
  return (seasonConfig.twistSchedule || []).filter(b => b && !b.random && (mine.has(b.type) || mine.has(b.id)))
    .map(b => slotAt.get(Number(b.episode))).filter(Boolean);
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
  const FINAL = 2 * (seasonConfig.pmFinalCouples === 3 ? 3 : 4);
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
    const coupledAhead = ahead.filter(x => x !== e && x.coupled).length;
    const nights = ahead.filter(x => !x.coupled && (x.moment === 'recoupling' || x.moment === 'public-vote')).length;
    const pace = (count + bombsLeft - FINAL - 2 * coupledAhead) / Math.max(1, nights);
    const before = count;
    if (e.moment === 'stick-or-twist') count -= Math.round(shape.casa * 0.8);
    // The final recoupling takes every single; each night after it, one couple.
    else if (e.finalRecoupling) count = Math.min(count, FINAL + 2 * coupledAhead);
    else if (e.coupled) count = Math.min(count, Math.max(FINAL + 2 * coupledAhead, count - 2));
    else if (e.moment === 'recoupling' && pace >= 0.5) count -= Math.max(1, Math.round(pace));
    else if (e.moment === 'public-vote' && pace >= 0.8) count -= Math.max(2, Math.round(pace));
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
/**
 * The challenge each night DRAWS, before any booking: what "As drawn" means on
 * the Season Timeline's picker. Empty before the season has a seed.
 */
export function perfectMatchDrawnChallenges() {
  const seed = gs?.pm?.seed;
  if (!seed) return new Map();
  // The whole shape, final and arrival counts included: a three-couple season
  // read its draws off the four-couple one, two nights out from episode 19 on.
  return new Map(perfectMatchScheduleFor(seed, _castShape()).filter(e => e.challenge).map(e => [e.ep, e.challenge]));
}

/**
 * What each night drew (how the dumping plays, how the arrivals play, a
 * one-off), for the Season Timeline's pickers to say "As drawn: …" (user:
 * "nothing tells me this" — the formats were bookable, and nothing on a
 * tile said so). Only once the season has its seed; empty before.
 */
export function perfectMatchDrawnNights() {
  const seed = gs?.pm?.seed;
  if (!seed) return new Map();
  return new Map(perfectMatchScheduleFor(seed, _castShape()).map(e => [e.ep, e]));
}

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
    // An arrival rule the author booked by hand plays in full; a Randomize one keeps the draw's manners.
    const byHand = tw.pmApply.arrivalRule ? { ruleBooked: !b.random } : {};
    if (tw.pmOn.includes(kindAt.get(ep))) out[ep] = { ...(out[ep] || {}), ...tw.pmApply, ...game, ...byHand };
  }
  return out;
}

/** Every episode's kind, for this cast and length (bookings do not move them). */
export function perfectMatchEpisodes() {
  return buildSchedule(_castShape());
}

/** Which episode is which vote slot, for this cast and length (picks do not move them). */
export function perfectMatchSlots() {
  return buildSchedule(_castShape()).filter(e => e.slot);
}

/**
 * Where every villa booking lands after the season's shape changes (user: "I
 * want the season timeline to always adapt with every twist and modification
 * I do"). A booking is on a night, not a number: the same night in the new
 * schedule is the same kind of week at the same place — counted from the end
 * through the stretch both schedules end with (the last vote, the final
 * recoupling, the couples' week, the final), and from the start before it.
 * A night that no longer exists takes its bookings with it. A booking on an
 * episode that has aired (`keepThrough`) stays where it aired.
 */
export function remapPerfectMatchBookings(before, after, keepThrough = 0) {
  let tail = 0;
  while (tail < before.length && tail < after.length
    && before[before.length - 1 - tail].moment === after[after.length - 1 - tail].moment) tail++;
  const keys = list => {
    const seen = {};
    return list.map((e, i) => {
      if (i >= list.length - tail) return `end#${list.length - i}`;
      seen[e.moment] = (seen[e.moment] || 0) + 1;
      return `${e.moment}#${seen[e.moment]}`;
    });
  };
  const oldKey = new Map(before.map((e, i) => [e.ep, keys(before)[i]]));
  const newEp = new Map(after.map((e, i) => [keys(after)[i], e.ep]));
  const mine = new Set(TWIST_CATALOG.filter(t => t.format === PERFECT_MATCH_FORMAT).map(t => t.id));
  seasonConfig.twistSchedule = (seasonConfig.twistSchedule || []).flatMap(b => {
    if (!b || !mine.has(b.type) || Number(b.episode) <= keepThrough) return [b];
    const to = newEp.get(oldKey.get(Number(b.episode)));
    return to ? [{ ...b, episode: to }] : [];
  });
}

/**
 * Change the season's length or its final (Villa options), with every villa
 * booking still to air following its night. Without the move, a booking made
 * for the last vote sat on whatever episode now had that number — season 1's
 * safe pick and public vote were on a villa day and the final.
 */
export function setPerfectMatchShape(patch) {
  const aired = (gs?.episodeHistory || []).filter(r => r && r.format === PERFECT_MATCH_FORMAT);
  const before = perfectMatchEpisodes();
  Object.assign(seasonConfig, patch);
  remapPerfectMatchBookings(before, perfectMatchEpisodes(), aired.length ? aired[aired.length - 1].num : 0);
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
    setup: perfectMatchSetup(), picks: perfectMatchPicks(), forcedSlots: perfectMatchForcedSlots(), bookings: perfectMatchBookings(),
    splitOrStealOn: seasonConfig.pmSplitOrSteal === true,
    firstIn: seasonConfig.pmFirstIn === 'm' ? 'm' : 'f',
    // How many couples reach the final (Villa options).
    finalCouples: seasonConfig.pmFinalCouples === 3 ? 3 : 4,
    dialect: Object.hasOwn(DIALECTS, seasonConfig.pmDialect || '') ? seasonConfig.pmDialect : 'uk',
    roleCounts: { ...(seasonConfig.pmRoleCounts || {}) },
    // The author's length, or null for automatic (from the cast).
    episodes: Number(seasonConfig.pmEpisodes) > 0 ? Number(seasonConfig.pmEpisodes) : null,
    // How many walk in on each bombshell night (the Season Timeline).
    arrivalCounts: perfectMatchArrivalCounts(),
    // Who knew whom before the villa (Setup → Relationships): an edit there
    // rebuilds the season like any other input.
    relationships: (relationships || []).filter(Boolean).map(({ a, b, kin, bond }) => [a, b, kin || '', Number(bond) || 0]),
  };
}
const _sig = inputs => JSON.stringify(inputs);

// THE INPUTS THAT CAN CHANGE FROM HERE ON. How many couples reach the final
// and how long the season runs set the dumping pace from night one, so a
// change to either always reads as rewriting an aired episode — and was parked
// behind a re-run of it, while the timeline drew the parked season (user's
// season 1: three couples asked for at episode 15, four in the final). The
// bookings move with them (their slots are other episodes on a new shape),
// and a booking on a night still to come changes the pace of the ones before
// it too. None of these is a fact about an aired night, so the season goes on
// from the last aired episode with them, as a new engine does
// (resumePerfectMatchSeason). An islander's setup, the counts and the
// relationships are about night one, and still wait for the re-run.
const _FROM_HERE = new Set(['finalCouples', 'episodes', 'picks', 'forcedSlots', 'bookings']);
function _onlyFromHere(was, now) {
  if (!was || !now) return false;
  const keys = new Set([...Object.keys(was), ...Object.keys(now)]);
  return [...keys].every(k => _FROM_HERE.has(k) || JSON.stringify(was[k]) === JSON.stringify(now[k]));
}
function _builtInputs() {
  try { return gs?.pm?.built ? JSON.parse(gs.pm.built) : null; } catch { return null; }
}
/** The inputs the season on air was built from, while a change waits behind a re-run; else null. */
function _parkedOver() {
  if (!Array.isArray(gs?._pmQueue) || !gs.pm?.deferred || !gs.pm.built) return null;
  let now;
  try { now = _inputs(); } catch { return null; }
  if (gs.pm.deferred !== _sig(now)) return null;
  const was = _builtInputs();
  // A change that goes on from here is the season the next press airs.
  return was && !_onlyFromHere(was, now) ? was : null;
}
const _lastAired = aired => (aired.length ? aired[aired.length - 1].num : 0);
const _deferNotice = ep => `That change affects episode ${ep}, which has already aired. `
  + `Re-run episode ${ep} to play it with the change.`;
/**
 * A dumping booked on a night that already aired, with something else played
 * there: going on from here cannot reach it, so the author is told to re-run it.
 */
function _airedBookingNotice(aired) {
  const mine = new Map(twistsForFormat({ format: PERFECT_MATCH_FORMAT }).filter(t => t.pmFormat).map(t => [t.id, t]));
  const rows = new Map(aired.map(r => [r.num, r]));
  const off = (seasonConfig.twistSchedule || []).filter(b => b && (mine.has(b.type) || mine.has(b.id)))
    .filter(b => {
      const r = rows.get(Number(b.episode));
      return r?.pm?.dumpFormat && r.pm.dumpFormat !== (mine.get(b.type) || mine.get(b.id)).pmFormat;
    }).map(b => Number(b.episode)).sort((x, y) => x - y);
  return off.length ? `The dumping booked on episode ${off[0]} is on a night that has already aired. `
    + `Re-run episode ${off[0]} to play it with the change.` : null;
}

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
  // A change parked behind a re-run: the queue is what airs.
  if (_parkedOver()) return [...aired, ...gs._pmQueue];
  const rerolls = { ...(gs?.pm?.rerolls || {}) };
  // …and one that goes on from here is previewed the way it will play.
  const from = aired.length && _onlyFromHere(_builtInputs(), inputs) ? _lastAired(aired) : null;
  const key = `${sig}|${JSON.stringify(rerolls)}|${gs?.pm?.seed || ''}|${(players || []).map(p => p?.name).join(',')}|${from}|${aired.length}`;
  if (_preview?.key !== key) {
    let built = null;
    try {
      built = _build(inputs, rerolls);
      if (built && from && _firstChanged(aired, built.rows) != null) built = _build(inputs, rerolls, from);
    } catch { built = null; }
    _preview = { key, rows: built ? built.rows : null };
  }
  if (!_preview.rows) return null;
  // What aired stays what aired; the preview supplies the nights still to come.
  const airedNums = new Set(aired.map(r => r.num));
  return [...aired, ..._preview.rows.filter(r => !airedNums.has(r.num))];
}

// What the cast bring with them — their pasts with each other on a show and
// since (js/franchise-carry.js). Relations become pm/kin.js rows, grudges a
// cold bond and resentment. Empty on a franchise with no history.
function _carried(cast) {
  return carriedFor((players || []).filter(p => p && cast.includes(p.name)), seasonConfig || {});
}

/**
 * `resumeFrom`: a season continued on a newer engine (resumePerfectMatchSeason)
 * keeps its aired episodes up to that one exactly as they aired, and the engine
 * plays on from the villa they left (pm/season.js restoreFromAired). Every
 * rebuild after that resumes from the same episode, so what the new engine
 * played replays exactly.
 */
function _build(inputs, rerolls, resumeFrom = gs?.pm?.resumeFrom ?? null) {
  _lastRefusal = null;
  const resumeRows = resumeFrom ? (gs.episodeHistory || []).filter(r => r && r.format === PERFECT_MATCH_FORMAT && r.num <= resumeFrom) : [];
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
  const carried = _carried(cast);
  let result, inner, record = null;
  try {
    result = playPerfectMatchSeason({ cast, setup: resolved, seed, picks: inputs.picks, forcedSlots: inputs.forcedSlots || null, bookings: inputs.bookings || {}, rerolls,
      splitOrStealOn: inputs.splitOrStealOn, dialect: inputs.dialect, episodes: inputs.episodes, firstIn: inputs.firstIn,
      arrivalCounts: inputs.arrivalCounts, finalCouples: inputs.finalCouples, carried,
      resume: resumeRows.length ? { rows: resumeRows } : null });
    inner = gs;
    // What this season leaves the franchise, read while its own relationship
    // layer is still the live one (pm/ledger-record.js). Recorded when the
    // last episode airs (simulatePerfectMatchEpisode).
    try {
      record = pmLedgerRecord(result.rows || [], result.state, { cast, winners: result.winners || [],
        seasonName: seasonConfig?.name || null, archetypeOf: n => (players || []).find(p => p?.name === n)?.archetype || null });
    } catch { record = null; }
  } finally { setGs(outer); }
  return { cast, resolved, seed, rows: inner.episodeHistory || [], winners: result.winners || [], inner, record,
    resumeFrom: resumeRows.length ? resumeFrom : null };
}

/** Make a built season the one on `gs`: the aired rows stay, the rest queue. */
function _commit(built, inputs, rerolls, airedCount) {
  const { inner } = built;
  gs.pm = { seed: built.seed, castOrder: [...built.cast], setup: built.resolved, winners: built.winners,
    picks: { ...inputs.picks }, rerolls: { ...rerolls }, built: _sig(inputs), record: built.record || null,
    engine: PM_ENGINE, ...(built.resumeFrom ? { resumeFrom: built.resumeFrom } : {}) };
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
  const fromHere = aired.length && _onlyFromHere(_builtInputs(), inputs);
  // A change already found to touch the past, and a queue still in hand:
  // keep playing the season as dealt rather than rebuild it every press —
  // and say so again after a reload, which forgets the notice.
  if (Array.isArray(gs._pmQueue) && gs.pm?.deferred === _sig(inputs) && !fromHere && gs.pm.deferredEp != null) {
    _lastNotice = _deferNotice(gs.pm.deferredEp);
    return true;
  }
  const built = _build(inputs, rerolls);
  if (!built) return false;
  const changed = _firstChanged(aired, built.rows);
  if (changed == null) { _lastNotice = null; _commit(built, inputs, rerolls, aired.length); return true; }
  // The final, the length or a booking: every aired episode stays as it aired
  // and the season goes on from the last of them with the change.
  if (fromHere) {
    const at = _lastAired(aired);
    const on = _build(inputs, rerolls, at);
    if (on && on.rows.some(r => r.num > at)) {
      _commit(on, inputs, rerolls, aired.length);
      _lastNotice = _airedBookingNotice(aired);
      return true;
    }
  }
  // The change would rewrite an aired episode. With the queue in hand, keep
  // it; without it (a reload), rebuild the season as it was dealt.
  _lastNotice = _deferNotice(changed);
  if (!Array.isArray(gs._pmQueue)) {
    const asDealt = { ...inputs, setup: gs.pm?.setup || inputs.setup, picks: gs.pm?.picks || {} };
    const again = _build(asDealt, rerolls);
    if (!again) return false;
    _commit(again, asDealt, rerolls, aired.length);
  }
  gs.pm.deferred = _sig(inputs);
  gs.pm.deferredEp = changed;
  return true;
}

/**
 * Air the next episode, or null when the season is over (or cannot start —
 * `lastPerfectMatchRefusal()` says why). Returns the row, as
 * `simulateEpisode` does, so `simulateNext` treats every show the same way.
 */
// Kristal-talKs: whoever this row put out records an exit interview as it
// airs (js/exit-interview/aired.js). Outside the game — nothing is drawn.
export const simulatePerfectMatchEpisode = airedEpisode('perfect-match', function simulatePerfectMatchEpisodeBody() {
  if (!gs) return null;
  if (!_refreshQueue()) return null;
  // An episode this browser already aired (a save loaded from before it) is dealt again (seen-episodes.js).
  const key = n => rerollKey(gs.pm.seed, n, gs.pm.rerolls);
  dealUnseen(PERFECT_MATCH_FORMAT, { next: () => gs._pmQueue?.[0]?.num ?? null, keyOf: key, redeal: rerunPerfectMatchEpisode });
  const row = gs._pmQueue.shift();
  if (!row) { gs.phase = 'complete'; return null; }
  noteShown(PERFECT_MATCH_FORMAT, key(row.num));
  (gs.episodeHistory ||= []).push(row);
  gs.activePlayers = [...(row.pm?.villa || [])];
  gs.episode = row.num;
  gs.phase = gs._pmQueue.length ? 'villa' : 'complete';
  if (!gs._pmQueue.length) {
    gs.pmWinners = [...(gs.pm?.winners || [])];
    // The season is over: what it leaves the franchise goes on the ledger,
    // where the next season of any show reads it (franchise-meta.js).
    try {
      const num = Number(gs.seasonNumber || seasonConfig?.seasonNumber);
      if (gs.pm?.record && num && recordBuiltSeason(gs.pm.record, num)) {
        if (typeof window !== 'undefined') window.persistFranchiseLedger?.();
      }
    } catch (e) { console.warn('Franchise ledger record failed:', e); }
  }
  return row;
}, airedAdapter);

/**
 * A season written by an older engine, with episodes still to air: the run tab
 * offers to continue it on this one (resumePerfectMatchSeason). Null when not.
 */
export function perfectMatchResumeOffer() {
  if (!gs?.pm?.seed || gs.pm.engine === PM_ENGINE || !Array.isArray(gs._pmQueue) || !gs._pmQueue.length) return null;
  const aired = (gs.episodeHistory || []).filter(r => r && r.format === PERFECT_MATCH_FORMAT);
  if (!aired.length) return null;
  return { from: aired[aired.length - 1].num, next: gs._pmQueue[0]?.num ?? null };
}

/**
 * CONTINUE ON THE NEW ENGINE (user, 2026-10-25: "with our new system I don't
 * wanna start a new season"). Every aired episode stays exactly as it aired;
 * the villa is rebuilt from the last one (who is in, the couples, every pair's
 * feelings, the public) and the episodes still to come are played by this
 * engine from there. False, with lastPerfectMatchRefusal(), when it cannot.
 */
export function resumePerfectMatchSeason() {
  _lastRefusal = null;
  if (!gs?.pm?.seed) return _refuse('this season has no stored seed');
  const aired = (gs.episodeHistory || []).filter(r => r && r.format === PERFECT_MATCH_FORMAT);
  if (!aired.length) return _refuse('nothing has aired yet, so the season is simply built on the new engine');
  const at = aired[aired.length - 1].num;
  let inputs;
  try { inputs = _inputs(); } catch { return _refuse('the cast setup could not be read'); }
  const rerolls = { ...(gs.pm.rerolls || {}) };
  const built = _build(inputs, rerolls, at);
  if (!built) return false;
  if (!built.rows.some(r => r.num > at)) return _refuse('the season has no episodes left after this one');
  _commit(built, inputs, rerolls, aired.length);
  _lastNotice = null;
  if (gs.phase === 'complete') gs.phase = 'villa';
  return true;
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
  // A season continued from an aired episode: re-running one at or before
  // that point continues from the episode before it instead.
  const rf = gs.pm.resumeFrom != null && N <= gs.pm.resumeFrom ? (N - 1 || null) : (gs.pm.resumeFrom ?? null);
  const built = _build(inputs, rerolls, rf);
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
