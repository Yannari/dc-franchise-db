// ══════════════════════════════════════════════════════════════════════
// ratings.js — how the season is going down with the country
// ══════════════════════════════════════════════════════════════════════
//
// Every week the show airs, four demographics form an opinion about what they
// just watched. Those opinions move a number, and the number lands a finished
// season somewhere between Dogwater and Iconic.
//
// THIS FILE SIMULATES NOTHING. Every signal it uses was already written into
// the episode record by the engine that produced it — the flipped ballots, the
// tone of the week's events, who is still standing and how much the audience
// likes them. That is the whole design: a reader can be run backwards over
// fifteen seasons already played, and a simulator cannot.
//
// It is also why there is exactly one signal reader. `readSignals` is pure and
// both entry points call it, so a season derived from history and a season
// lived week by week cannot disagree about what happened in it.
//
// ── WHAT IT IS NOT ──
//
// Not a second opinion engine. `gs.popularity` and the edit layer remain the
// only things that decide what the audience thinks of a PERSON; ratings read
// that and never write it. This file has an opinion about the SEASON.
import { gs, players, seasonConfig } from './core.js';
import { classifyEventTone } from './tone.js';
import { SHOWS, DEFAULT_FORMAT, showWords } from './shows.js';

export const RATINGS_V = 1;

// ── The tiers ────────────────────────────────────────────────────────
//
// Ordered worst to best; `tierFor` walks from the top so the bands never need
// an upper bound written twice.
export const TIERS = [
  { key: 'dogwater', label: 'Dogwater', min: 0 },
  { key: 'bad', label: 'Bad', min: 25 },
  { key: 'okay', label: 'Okay', min: 38 },
  { key: 'average', label: 'Average', min: 50 },
  { key: 'good', label: 'Good', min: 60 },
  { key: 'great', label: 'Great', min: 72 },
  { key: 'iconic', label: 'Iconic', min: 85 },
];

export function tierFor(n) {
  const v = Number(n) || 0;
  for (let i = TIERS.length - 1; i >= 0; i--) if (v >= TIERS[i].min) return TIERS[i];
  return TIERS[0];
}

export const DEMOS = ['teens', 'youngAdults', 'middleAged', 'older'];
export const DEMO_LABELS = {
  teens: 'Teens', youngAdults: 'Young Adults',
  middleAged: 'Middle Aged', older: 'Older',
};

// ── What the four groups want ────────────────────────────────────────
//
// BASE_TASTE is what these groups want from ANY reality show. What a given
// show is FOR is a separate layer that lives in the registry (see `overlay`
// below), because "the same six people ran the house all summer" is the
// defining complaint about Big Brother specifically, not about television.
//
// One line per signal explaining the taste, so this table can be tuned later
// by somebody who did not write it.
export const BASE_TASTE = Object.freeze({
  teens: Object.freeze({
    showmance: 3.0,    // the reason a lot of them are watching at all
    twist: 2.6,        // format chaos reads as the show trying to entertain them
    powerShift: 1.8,   // the throne changing hands is the fun part
    blindside: 1.2,
    returns: 1.4,      // a familiar face coming back is an event
    mess: 0.8,
    likability: 0.9,
    villainy: 0.6,     // a good villain is a draw, not a turn-off
    strategy: 0.1,     // vote arithmetic is not what they are here for
    predictable: -1.0,
    steamroll: -1.8,
  }),
  youngAdults: Object.freeze({
    blindside: 3.0,    // the single biggest thing that makes them talk about it
    mess: 1.9,         // a scrappy cast beats a polished one every time
    powerShift: 1.8,
    strategy: 1.0,
    showmance: 0.7,
    twist: 0.8,
    villainy: 0.7,
    returns: 0.6,
    likability: 0.2,
    predictable: -1.9,
    steamroll: -3.0,   // burns out fastest on one bloc deciding everything
  }),
  middleAged: Object.freeze({
    strategy: 3.0,     // they are watching a GAME and want to see it played
    blindside: 1.3,    // good, but only when it was earned by the play
    powerShift: 1.1,
    likability: 0.4,
    steamroll: 0.0,    // indifferent: a dominant alliance is at least competent
    twist: -1.0,       // the format interfering with the game
    showmance: -1.6,   // a distraction from the real game
    returns: -1.1,     // so is somebody walking back in
    mess: -1.8,
    predictable: -2.8, // the worst sin: nothing worth tuning in for
    villainy: 0.0,
  }),
  older: Object.freeze({
    likability: 3.0,   // do I want these people in my house every night
    strategy: 1.9,
    steamroll: 1.0,    // a competent alliance running things is good television
    blindside: 0.2,
    powerShift: 0.3,
    predictable: 0.0,  // they are not watching for surprises
    mess: -1.2,
    returns: -0.7,
    showmance: -0.4,
    twist: -2.0,       // leave the format alone
    villainy: -3.0,    // a villain-heavy cast turns them off harder than anything
  }),
});

/**
 * The show's own layer, multiplied onto every demographic's weight for that
 * signal. Declared in the registry beside `words` and `careerStats` — a show
 * states its own audience the same way it states its own vocabulary.
 *
 * A format with no entry rates on the BASE TABLE UNCHANGED — a neutral
 * multiplier of one across the board, not the default show's overlay. Falling
 * back to Total Drama's would have quietly rated a brand new show as though it
 * were Total Drama: a plausible number, wrong for reasons nobody would ever
 * think to check, which is the same trap `words` already documents.
 *
 * A show that never declares one is rated as generic reality television. That
 * is the honest answer, and `tests/ratings.test.js` fails the moment a
 * registered show is missing its entry, so nothing ships on the fallback by
 * accident.
 */
function overlay(format) {
  return SHOWS[format]?.audience || {};
}

const clamp01 = n => Math.max(0, Math.min(1, Number(n) || 0));
const norm = (n, span) => clamp01((Number(n) || 0) / span);

// ── Reading one week ─────────────────────────────────────────────────

/**
 * Every aired moment of the week, flattened to the shape `classifyEventTone`
 * wants, from BOTH shows' records.
 *
 * Total Drama files its week as camp events; Big Brother files it as acts each
 * holding beats. One taxonomy, two shapes — so the flattening happens here and
 * the tone rules stay a leaf.
 */
function airedEvents(ep) {
  const out = [];
  // Total Drama files camp events per camp and then per slot inside it —
  // `{ Ravu: { pre: [...], post: [...] } }` before the merge, one key after
  // it, and an exile or one-tribe episode can leave a bare array. Reading only
  // the top level found nothing at all: every tone signal came back zero for
  // fourteen straight episodes, which is how this was caught.
  const push = node => {
    if (Array.isArray(node)) node.forEach(push);
    else if (node && typeof node === 'object') {
      if (node.type || node.eventId || node.badgeText) out.push(node);
      else Object.values(node).forEach(push);
    }
  };
  push(ep?.campEvents);
  push(ep?.twistScenes);
  (ep?.acts || []).forEach(a => {
    out.push({ type: a.type, badgeText: a.badgeText, badgeClass: a.badgeClass });
    (a.beats || []).forEach(b => out.push({
      type: a.type, eventId: b.eventId, badgeText: b.badgeText, badgeClass: b.badgeClass,
    }));
    (a.socialBeats || []).forEach(b => out.push({
      type: a.type, eventId: b.eventId, badgeText: b.badgeText, badgeClass: b.badgeClass,
    }));
  });
  return out;
}

function toneShare(events) {
  const counts = {};
  events.forEach(e => { const t = classifyEventTone(e); counts[t] = (counts[t] || 0) + 1; });
  const total = events.length || 1;
  return {
    of: t => (counts[t] || 0) / total,
    total: events.length,
  };
}

/** The bloc that decided this week: everybody who voted for the person who left. */
function majorityBloc(ep) {
  const gone = ep?.eliminated;
  if (!gone) return [];
  return (ep.votingLog || []).filter(v => v.voted === gone).map(v => v.voter).filter(Boolean);
}

/**
 * Who the week SAID it was going after, before the ballots moved.
 *
 * Big Brother writes the plan down (`plan.target`, `voteOperation.plans`).
 * Total Drama does not — it records, per voter, the name they held to and the
 * name they rejected, so the plan has to be recovered as the name the most
 * people were holding.
 */
function statedTarget(ep) {
  if (ep?.plan?.target) return ep.plan.target;
  const plans = ep?.voteOperation?.plans || [];
  if (plans.length) {
    return [...plans].sort((a, b) => (b.bloc?.length || 0) - (a.bloc?.length || 0))[0]?.target || null;
  }
  const votePlans = ep?.votePlans || [];
  if (votePlans.length) return votePlans[0]?.target || null;
  const held = {};
  (ep?.votingLog || []).forEach(v => {
    const t = v.transitionPrevented?.heldTarget;
    if (t) held[t] = (held[t] || 0) + 1;
  });
  const top = Object.entries(held).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : null;
}

/**
 * How many ballots genuinely moved.
 *
 * The two shows record a flip in three different places and none of them is
 * shared: Big Brother sets `changed` on the ballot, Total Drama files
 * `defections` on some episode types and, on the rest, marks the voter's
 * `planBreak` with `pactBroken`. Reading only `changed` reported every Total
 * Drama season as having had no blindsides at all.
 */
function flippedVotes(ep) {
  const log = ep?.votingLog || [];
  const changed = log.filter(v => v.changed).length;
  const broken = log.filter(v => v.planBreak?.pactBroken).length;
  // The real article on Total Drama: somebody voting against their own
  // alliance's consensus. Without it, six straight measured seasons reported
  // no blindside in them at any point — a p90 of zero on the single signal
  // the Young Adult column is built around.
  const flips = (ep?._flipDetectionLog || []).length;
  const cascades = ep?.cascadeSwitches?.length || 0;
  return Math.max(changed + broken, flips) + cascades + (ep?.defections?.length || 0);
}

function archetypeOf(name) {
  return players.find(p => p.name === name)?.archetype || 'floater';
}

const DIRTY = new Set(['villain', 'mastermind', 'schemer']);

/**
 * One week in, eleven numbers out, each a plain 0..1.
 *
 * `prev` is the previous week's signal record (not the previous rating), which
 * is how the two signals with memory — steamroll and powerShift — see far
 * enough back to mean anything. Passing null makes this the first week.
 */
export function readSignals(ep, prev, opts = {}) {
  if (!ep) return null;
  const format = opts.format || ep.format || seasonConfig?.format || DEFAULT_FORMAT;
  const pop = opts.popularity || ep.popularitySnapshot || gs?.popularity || {};
  const house = opts.house || ep.houseAtStart || gs?.activePlayers || [];
  const events = airedEvents(ep);
  const tones = toneShare(events);

  const log = ep.votingLog || [];
  const voters = log.length || 1;
  const bloc = majorityBloc(ep);

  // ── blindside: how little the boot saw it coming ──
  // A vote where a third of the room moved off the plan is a blindside.
  const blindside = ep.eliminated ? norm(flippedVotes(ep), Math.max(2, voters * 0.4)) : 0;

  // ── predictable: the boot was the boot everybody named on Monday ──
  const target = statedTarget(ep);
  const hitTarget = target && ep.eliminated && target === ep.eliminated ? 1 : 0;
  const unanimity = ep.eliminated && voters > 1 ? clamp01(bloc.length / voters) : 0;
  const predictable = ep.eliminated ? clamp01(hitTarget * 0.5 + unanimity * 0.5) : 0.3;

  // ── steamroll: the same bloc deciding, week after week ──
  // Overlap with last week's deciders, smoothed, so one repeat is not a
  // steamroll and four in a row very much is.
  let blocOverlap = 0;
  if (prev?.bloc?.length && bloc.length) {
    const prevSet = new Set(prev.bloc);
    blocOverlap = bloc.filter(n => prevSet.has(n)).length / Math.max(bloc.length, prev.bloc.length);
  }
  const steamroll = clamp01((prev?.steamroll || 0) * 0.55 + blocOverlap * 0.55);

  // ── powerShift: the throne crossed a line ──
  // The new power holder was on the wrong side of last week's vote, or was the
  // person last week wanted gone. Holding power twice running is no shift.
  const holder = ep.immunityWinner || ep.hoh || null;
  let powerShift = 0;
  if (holder && prev) {
    const wasSafe = prev.holder === holder;
    const wasMinority = prev.bloc?.length ? !prev.bloc.includes(holder) : false;
    const wasHunted = prev.target === holder || (prev.nominees || []).includes(holder);
    powerShift = wasSafe ? 0 : clamp01((wasMinority ? 0.65 : 0.25) + (wasHunted ? 0.45 : 0));
  } else if (holder) {
    powerShift = 0.35;
  }

  // ── showmance ──
  const active = (gs?.showmances || []).filter(sh => !sh.broken).length;
  const sparks = (ep.romanceScenes?.length || 0) + (ep.showmanceMoments?.length || 0);
  const showmance = clamp01(norm(active, 3) * 0.7 + norm(sparks, 2) * 0.3);

  // ── twist ──
  const twistCount = Array.isArray(ep.twists) ? ep.twists.length : 0;
  const twist = norm(twistCount, 2);

  // ── returns ──
  const returns = (ep.returnees?.length || ep.rejoined?.length
    || (ep.battleBack ? 1 : 0) || (ep.intruders?.length || 0)) ? 1 : 0;

  // ── likability: how much the country likes who is left ──
  //
  // Popularity is an UNBOUNDED ACCUMULATOR and the two shows fill it at
  // different rates: measured over a Big Brother season it runs to a mean of
  // 7 and a maximum near 50, where Total Drama sits around 2. A straight
  // divide saturated — every Big Brother week read a flat 1.00 likability,
  // which is a signal that has stopped being a signal.
  //
  // So it is squashed rather than divided. tanh cannot saturate, keeps the
  // ordering intact, and degrades gracefully whatever scale a future show
  // emits, which matters because nothing bounds this number.
  //
  // And it is a COMPARISON, not an absolute: the people still in against the
  // whole cast that started. Reading the absolute made every Big Brother
  // season rate a full tier above every Total Drama season — not because they
  // were better, but because that engine hands out more popularity. Comparing
  // within the season cancels the units out, and it measures the thing that
  // actually matters to an audience: is the show keeping the people they like,
  // or booting them one by one.
  //
  // NOTE ON TIMING: `updatePopularity` is called by run-ui.js after the
  // episode simulates, so the score read here is the one the audience had at
  // the END OF LAST WEEK. That lag is left in deliberately — the ratings for
  // an episode are formed by an audience that has only seen the ones before
  // it. In a headless run (the audit harness) popularity is never updated at
  // all and this sits near neutral for the whole season.
  const left = house.filter(n => !(n === ep.eliminated || n === ep.eliminated2));
  const meanOf = list => (list.length
    ? list.reduce((s, n) => s + (Number(pop[n]) || 0), 0) / list.length : 0);
  // Divided by the season's OWN largest score, so the answer is a fraction of
  // this show's scale rather than a fraction of a number picked by hand. A
  // straight difference from the cast average did not work either: survivors
  // accumulate popularity simply by lasting longer, so on Big Brother — where
  // the score runs to fifty — every week read the remaining cast as beloved.
  const biggest = Math.max(1, ...Object.values(pop).map(v => Math.abs(Number(v) || 0)));
  const likability = clamp01(0.5 + 0.5 * (meanOf(left) / biggest));

  // ── villainy ──
  const dirtyShare = left.length
    ? left.filter(n => DIRTY.has(archetypeOf(n))).length / left.length : 0;
  const villainy = clamp01(dirtyShare * 0.6 + tones.of('villainous') * 0.8);

  // ── mess: scrappy, chaotic, unpolished ──
  const mess = clamp01((tones.of('comic') + tones.of('emotional')) * 1.4);

  // ── strategy: an actual game being played on screen ──
  const planDepth = norm((ep.voteOperation?.plans?.length || 0)
    + (ep.voteOperation?.moves?.length || 0), 5);
  const strategy = clamp01(tones.of('strategic') * 1.2 * 0.6 + planDepth * 0.4);

  return {
    ep: ep.num ?? 0,
    format,
    blindside, predictable, steamroll, powerShift, showmance,
    twist, returns, likability, villainy, mess, strategy,
    // Carried for next week's memory, not scored themselves.
    bloc, holder, target,
    nominees: [...(ep.nominees || [])],
  };
}

// ── Turning signals into four opinions ───────────────────────────────

const SIGNAL_KEYS = ['blindside', 'predictable', 'steamroll', 'powerShift',
  'showmance', 'twist', 'returns', 'likability', 'villainy', 'mess', 'strategy'];

/**
 * The range each signal ACTUALLY occupies, measured rather than assumed.
 *
 * ── WHY THIS EXISTS ──
 *
 * Scoring a raw 0..1 signal against a 0..1 scale assumes a week can max it
 * out. Almost none can. Measured across nine played seasons (six Total Drama,
 * three Big Brother), `mess` never once passed 0.25 and `villainy` never
 * passed 0.40 — so the two signals that are supposed to separate a scrappy
 * season from a polished one were each contributing a quarter of their weight
 * at full tilt. Every season came out between 40 and 44: one tier for the
 * entire franchise, which is not a rating system.
 *
 * So each signal is stretched onto the range it really lives in. `[lo, hi]`
 * are roughly the 5th and 95th percentile of that measurement, rounded to
 * something a human can reason about.
 *
 * ── KEEPING IT HONEST ──
 *
 * This is a snapshot of one measurement and it will rot as the engine changes.
 * `tests/ratings-distribution.test.js` re-measures and fails when a signal
 * drifts far enough outside its band that the table is lying. Deliberately ONE
 * table for both shows: Big Brother genuinely produces more strategy than
 * Total Drama does, and calibrating per show would erase exactly the
 * difference the show overlay exists to express.
 */
export const CALIBRATION = Object.freeze({
  blindside: [0, 0.70],
  predictable: [0.15, 0.95],
  steamroll: [0, 0.85],
  powerShift: [0, 1],
  showmance: [0, 0.70],
  twist: [0, 1],
  returns: [0, 1],
  likability: [0.45, 1],   // a cast the audience actively dislikes is rare
  villainy: [0, 0.40],
  mess: [0, 0.25],
  strategy: [0, 0.55],
});

/** One raw observation, stretched onto the range that signal really occupies. */
export function calibrate(key, raw) {
  const [lo, hi] = CALIBRATION[key] || [0, 1];
  const span = hi - lo || 1;
  return clamp01(((Number(raw) || 0) - lo) / span);
}

/**
 * A demographic's raw verdict on one week, 0..100.
 *
 * Normalised against the weight table's own range rather than a magic
 * constant, so retuning a weight cannot silently push every season into one
 * corner of the scale.
 *
 * THE SPAN COMES FROM THE BASE TABLE, NOT THE OVERLAID ONE. Normalising
 * against the overlaid weights cancels the show layer out — amplifying
 * strategy on Big Brother grew the numerator and the divisor together and the
 * same week rated identically on both shows, which is the one thing the layer
 * exists to prevent. The base span is the universal scale; the overlay moves a
 * week along it.
 */
export function rawScore(signals, demo, format) {
  const base = BASE_TASTE[demo] || {};
  const mult = overlay(format);
  let score = 0, best = 0, worst = 0;
  for (const key of SIGNAL_KEYS) {
    const w = base[key] || 0;
    if (!w) continue;
    score += w * (mult[key] ?? 1) * calibrate(key, signals[key]);
    if (w > 0) best += w; else worst += w;
  }
  const span = best - worst || 1;
  return Math.max(0, Math.min(100, ((score - worst) / span) * 100));
}

/**
 * Where the number actually lands, which is not where the week says it should.
 *
 * A good week is converted in proportion to the season's momentum: a show on
 * the way up banks nearly all of it, a show in trouble banks a fraction. A bad
 * week lands at full weight whatever the momentum. Audiences leave faster than
 * they arrive, and this is the same lesson as the race-challenge momentum rule
 * — compounding advantage, asymmetric penalty.
 */
export function applyMomentum(current, raw, momentum) {
  const delta = raw - current;
  if (delta >= 0) return current + delta * Math.max(0.12, 0.35 + momentum * 0.08);
  return current + delta * 0.45;
}

/**
 * The headline number, from the four opinions underneath it.
 *
 * NOT the plain mean, and the reason is worth writing down. The four groups
 * are built to disagree — a villain-heavy cast lifts the young half and sinks
 * the old one — so their mean cancels out. Measured across eight seasons cast
 * to be as different from each other as this engine can make them (all
 * villains, all sweethearts, romance-heavy, romance-free), every single one
 * came out between 40 and 49 while the demographics underneath ranged from 16
 * to 69. Four honest opinions, averaged into one useless one.
 *
 * So the show is credited for the audience it actually has. A season one group
 * genuinely loves outdraws a season all four are lukewarm about, which is both
 * how television works and the only version of this number that can tell those
 * two seasons apart.
 */
export function overallOf(demos) {
  const vals = DEMOS.map(d => Number(demos[d]) || 0);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const best = Math.max(...vals);
  return mean * 0.55 + best * 0.45;
}

function blankState() {
  return {
    v: RATINGS_V,
    weeks: [],
    demos: Object.fromEntries(DEMOS.map(d => [d, 50])),
    momentum: 0,
    prevSignals: null,
  };
}

/**
 * One week of ratings, folded into a state object.
 *
 * Pure: takes a state, returns a new one. The live pass and the retroactive
 * pass both go through here, which is the guarantee that a replayed season
 * rates identically to the season that was played.
 */
export function foldWeek(state, ep, opts = {}) {
  const st = state || blankState();
  const signals = readSignals(ep, st.prevSignals, opts);
  if (!signals) return st;
  const format = signals.format;
  const first = !st.weeks.length;

  const demos = {};
  for (const d of DEMOS) {
    const raw = rawScore(signals, d, format);
    // Week one has no previous week to drift from, so it sets the baseline
    // outright rather than crawling away from a fictional 50.
    demos[d] = first ? raw : applyMomentum(st.demos[d], raw, st.momentum);
  }
  const overall = overallOf(demos);
  const prevOverall = st.weeks.length
    ? st.weeks[st.weeks.length - 1].overall : overall;
  const dir = Math.sign(Math.round((overall - prevOverall) * 10) / 10);

  // Momentum only builds while the direction holds; the first week the show
  // turns, it resets rather than decaying, because the trend is simply over.
  let momentum = st.momentum;
  if (first) momentum = 0;
  else if (dir === 0) momentum = st.momentum;
  else if (Math.sign(st.momentum) === dir) momentum = Math.max(-2, Math.min(2, st.momentum + dir));
  else momentum = dir;

  const week = {
    ep: signals.ep,
    overall: Math.round(overall * 10) / 10,
    demos: Object.fromEntries(DEMOS.map(d => [d, Math.round(demos[d] * 10) / 10])),
    signals: Object.fromEntries(SIGNAL_KEYS.map(k => [k, Math.round(signals[k] * 100) / 100])),
    momentum,
    twist: signals.twist > 0,
  };
  return {
    v: RATINGS_V,
    weeks: [...st.weeks, week],
    demos,
    momentum,
    prevSignals: signals,
    format,
  };
}

/**
 * The season's verdict, back-weighted.
 *
 * Not the final week: a season that fell apart in the middle and recovered on
 * finale night is not Iconic, and eight weeks of must-watch television is not
 * Bad because the finale was a coronation. Late weeks count about double early
 * ones, which is roughly how anybody remembers a season.
 */
export function seasonScore(weeks) {
  const list = (weeks || []).filter(w => w && typeof w.overall === 'number');
  if (!list.length) return 0;
  let sum = 0, wsum = 0;
  list.forEach((w, i) => {
    const weight = 1 + (i / Math.max(1, list.length - 1));
    sum += w.overall * weight;
    wsum += weight;
  });
  return Math.round((sum / wsum) * 10) / 10;
}

// ── The two entry points ─────────────────────────────────────────────

/**
 * Live: called from the episode-complete sites, immediately after
 * `updateEditLayer(ep)`. One clock, not two.
 */
export function updateRatings(ep) {
  if (seasonConfig?.ratings === false) return null;
  if (!ep) return null;
  const next = foldWeek(gs.ratings, ep, {
    format: ep.format || seasonConfig?.format || DEFAULT_FORMAT,
  });
  gs.ratings = next;
  const week = next.weeks[next.weeks.length - 1] || null;
  if (week) ep.ratingsSnapshot = JSON.parse(JSON.stringify(week));
  return week;
}

/**
 * Retroactive: the same fold over a finished season's history, for the
 * fifteen seasons that were played before this file existed.
 */
export function ratingsForSeason(history, opts = {}) {
  let st = null;
  (history || []).forEach(ep => { st = foldWeek(st, ep, opts); });
  if (!st) return null;
  const score = seasonScore(st.weeks);
  return {
    v: RATINGS_V,
    weeks: st.weeks,
    demos: st.demos,
    score,
    tier: tierFor(score).key,
    format: st.format || opts.format || DEFAULT_FORMAT,
  };
}

// ── What moved them ──────────────────────────────────────────────────
//
// A number with no reason attached is a scoreboard. These are the sentences
// that make the four columns read as four audiences with opinions, so every
// signal carries a line for the week it rose and a line for the week it fell,
// four ways each.
//
// `{round}` and `{exit}` are filled from the show's own registry entry. This
// feature writes prose about a season, which is precisely the surface the
// wrong-show-vocabulary bug keeps reappearing on.
const NOTES = {
  blindside: {
    up: ['a vote that genuinely went sideways',
      'somebody was moved on without ever seeing it coming',
      'the {round} stopped being a formality',
      'ballots moved late, after the count looked settled'],
    down: ['nobody moved. the count on Monday was the count on Thursday',
      'the {round} went exactly the way it was announced',
      'a vote with no surprise in it anywhere',
      'the plan held from the first day to the last'],
  },
  predictable: {
    up: ['the named target went, on schedule, again',
      'the whole {round} was legible by Tuesday',
      'nothing happened that had not been said out loud first',
      'a week you could have written in advance'],
    down: ['the obvious name survived and something else happened instead',
      'the {round} refused to do the expected thing',
      'the plan on Monday had nothing to do with the result',
      'for once you could not call it'],
  },
  steamroll: {
    up: ['the same bloc decided it again',
      'one group has now run every vote for a month',
      'the majority is not being tested by anybody',
      'the same names deciding the same way, week after week'],
    down: ['the majority cracked',
      'whoever was running this is not running it any more',
      'the bloc that decided everything did not decide this',
      'the power finally moved off one table'],
  },
  powerShift: {
    up: ['power crossed the room to somebody who was in trouble last week',
      'the throne changed hands outright',
      'last week\'s target is this week\'s authority',
      'the room reorganised around a new name'],
    down: ['the same person is in charge as last week',
      'nothing moved at the top',
      'power stayed exactly where it already was',
      'the same table is still the table'],
  },
  showmance: {
    up: ['there is a romance running, and it is on screen',
      'two of them cannot stop finding each other',
      'the season found its couple',
      'the romance is now half the footage'],
    down: ['the romance went quiet',
      'nobody is falling for anybody this week',
      'the couple stopped being the story',
      'no romance in it at all'],
  },
  twist: {
    up: ['the format did something to them this week',
      'a twist landed and the house had to deal with it',
      'the rules changed mid-{round}',
      'the show intervened, loudly'],
    down: ['a straight {round} with no interference',
      'the format left them alone',
      'no twist and no gimmick, just the game',
      'nothing arrived from outside the house'],
  },
  returns: {
    up: ['somebody walked back in',
      'a returning face the room had not planned around',
      'the show put somebody back in play',
      'an arrival nobody had planned around'],
    down: ['nobody came back and nobody new arrived',
      'the cast is the cast',
      'no arrivals this week',
      'the door stayed shut'],
  },
  likability: {
    up: ['the people still in are the people they like',
      'the cast left is good company',
      'the show is keeping the ones they came for',
      'a room that is easy to spend an hour with'],
    down: ['the ones they liked keep getting {exit}',
      'the room left is harder to root for',
      'the favourites are going out one at a time',
      'nobody obvious left to get behind'],
  },
  villainy: {
    up: ['the dirty players are running the season',
      'schemers everywhere, and none of them hiding it',
      'this is being played by people they do not trust',
      'the villains have the numbers'],
    down: ['the nastier players have gone quiet',
      'less scheming than there has been',
      'the season stopped being about the villains',
      'a cleaner week than the ones before it'],
  },
  mess: {
    up: ['the week was chaotic and unpolished',
      'the house came apart a bit this week',
      'scrappy, loud and largely unmanaged',
      'a mess, start to finish'],
    down: ['everybody behaved themselves',
      'a tidy, controlled, quiet week',
      'no chaos in it anywhere',
      'controlled, polished, and very quiet'],
  },
  strategy: {
    up: ['an actual game being played, out loud',
      'real strategy on screen for once',
      'plans, counts and consequences, all on screen',
      'the {round} turned on somebody thinking'],
    down: ['very little actual game this week',
      'nobody appears to be playing',
      'no strategy visible anywhere in it',
      'drifting rather than playing'],
  },
};

/**
 * Why this demographic's number moved: the single signal that did the most to
 * them this week, said in their terms.
 *
 * "The most" is the signal with the largest weighted CHANGE, so a group is
 * never told about something that has been sitting at the same value all
 * season — a steamroll that started three weeks ago is not this week's news.
 */
export function demoNote(demo, weekRec, prevRec, format) {
  if (!weekRec?.signals) return null;
  const base = BASE_TASTE[demo] || {};
  const mult = overlay(format);
  const prev = prevRec?.signals || null;
  let bestKey = null, bestPush = 0, bestRose = false;
  for (const key of SIGNAL_KEYS) {
    const w = (base[key] || 0) * (mult[key] ?? 1);
    if (!w) continue;
    const now = calibrate(key, weekRec.signals[key]);
    // With no previous week, the week itself is the news: score against the
    // midpoint so an opening week still has something to say.
    const then = prev ? calibrate(key, prev[key]) : 0.5;
    const push = w * (now - then);
    if (Math.abs(push) > Math.abs(bestPush)) {
      bestPush = push; bestKey = key; bestRose = now > then;
    }
  }
  if (!bestKey || Math.abs(bestPush) < 0.05) return null;
  // Which pool is chosen by whether the SIGNAL rose, never by whether this
  // group enjoyed it. A steamroll tightening is "the same bloc again" whether
  // that delights the older audience or drives the young one away; `good`
  // carries the verdict separately.
  const pool = NOTES[bestKey]?.[bestRose ? 'up' : 'down'] || [];
  if (!pool.length) return null;
  // Rotated by the column's position as well as hashed, because two groups
  // reacting to the same signal in the same week drew the identical sentence
  // and sat next to each other saying it.
  const key = `${weekRec.ep}|${bestKey}`;
  let h = DEMOS.indexOf(demo);
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  h += DEMOS.indexOf(demo);
  const words = showWords(format);
  return {
    signal: bestKey,
    good: bestPush > 0,
    text: pool[h % pool.length]
      .replace(/\{round\}/g, String(words.round || 'episode').toLowerCase())
      .replace(/\{exit\}/g, String(words.exit || 'eliminated')),
  };
}

// ── Read API ─────────────────────────────────────────────────────────

export function ratingsSummary() {
  const st = gs?.ratings;
  if (!st?.weeks?.length) return null;
  const score = seasonScore(st.weeks);
  const latest = st.weeks[st.weeks.length - 1];
  const prev = st.weeks.length > 1 ? st.weeks[st.weeks.length - 2] : null;
  return {
    score, tier: tierFor(score), latest, prev,
    momentum: st.momentum,
    weeks: st.weeks,
    demos: st.demos,
    format: st.format || seasonConfig?.format || DEFAULT_FORMAT,
    words: showWords(st.format || seasonConfig?.format || DEFAULT_FORMAT),
  };
}

/**
 * How attentive the electorate is, for anything the public votes on.
 *
 * A high-rated season has a big, engaged audience and its vote follows
 * popularity sharply. A Dogwater season is being voted on by a handful of
 * people and comes out closer to random — the favourite can simply lose. That
 * is sampling error, which is the honest reason a bad season's audience twists
 * should be less predictable rather than merely labelled worse.
 *
 * Returns 1 when there are no ratings yet, so a season with the feature off
 * votes exactly as it always did.
 */
export function engagement() {
  const st = gs?.ratings;
  if (!st?.weeks?.length) return 1;
  const latest = st.weeks[st.weeks.length - 1].overall;
  return Math.max(0.45, Math.min(1.6, latest / 55));
}
