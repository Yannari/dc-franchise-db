// ══════════════════════════════════════════════════════════════════════
// bb/duo-week.js — You Go, They Go
// ══════════════════════════════════════════════════════════════════════
//
// One week. Four nominees. Two people leave.
//
//   The house is paired. The Head of Household nominates two DUOS, so there
//   are four keys on the wall instead of two. The house votes the way it
//   always votes — one name each — and whoever takes the most votes is
//   evicted AND TAKES THEIR PARTNER WITH THEM.
//
// The partner can have zero votes against them. That is the twist: you can be
// evicted from this game for nothing whatsoever except who you walked in with,
// and every ballot cast in the room is really a ballot against two people.
//
// ── why this is not the Duos season twist ──
//
// bb/duos.js is the BB13 shape: pairs installed night one, a Golden Key for
// whoever survives their partner, and a season that is still being shaped by
// it in week nine. That is a SEASON. This is a WEEK — schedulable anywhere,
// self-contained, and gone by Friday. The two share nothing but the idea of a
// pair, and this module deliberately reuses a Duos season's pairs when one is
// running rather than inventing a second set on top of it.
//
// ── the pairing, and who is left out of it ──
//
// The Head of Household is excluded. They cannot be nominated, so pairing them
// would hand their partner a free week for no reason anybody chose. Whoever is
// left over when the pairing runs out is SOLO, and a solo houseguest cannot be
// nominated at all this week — there is no pair to put up with them. Being the
// odd one out is a shield, exactly once, and the house knows it.
import { gs, players, seasonConfig } from '../core.js';
import { pStats } from '../players.js';
import { addBond, getBond, getPerceivedBond } from '../bonds.js';
import { duoOf } from './duos.js';

/** Four nominees, a Head of Household and a room left to vote with. */
export const DUO_WEEK_MIN_HOUSE = 8;

const beat = (text, players, badgeText, badgeClass = 'gold', part = null, extra = {}) =>
  ({ text, players: [...players].filter(Boolean), badgeText, badgeClass, ...(part ? { part } : {}), ...extra });


const archetypeOf = name => players.find(p => p.name === name)?.archetype || '';

const VILLAINOUS = ['villain', 'mastermind', 'schemer'];
const NEUTRAL = ['hothead', 'challenge-beast', 'wildcard', 'chaos-agent', 'floater', 'perceptive-player'];

/**
 * Would this houseguest sell out the person they are chained to?
 *
 * The archetype rules, applied literally: villains always might, nice
 * archetypes never do, and the neutrals need the strategy to see it and the
 * loyalty not to care. A hero on that block campaigns for both of them.
 */
function wouldSellOut(name) {
  const arch = archetypeOf(name);
  if (VILLAINOUS.includes(arch)) return true;
  if (!NEUTRAL.includes(arch)) return false;
  const st = pStats(name) || {};
  return (st.strategic || 0) >= 6 && (st.loyalty || 0) <= 4;
}

function bumpPop(name, delta) {
  if (!name) return;
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}

// ══ state ══════════════════════════════════════════════════════════════

export function duoWeekState(week) { return week?.duoWeek || null; }

export function duoWeekActive(week) { return !!week?.duoWeek; }

export function duoWeekPairs(week) { return duoWeekState(week)?.pairs || []; }

/** The pair somebody is chained to this week, or null if they are the solo. */
export function duoWeekPairOf(week, name) {
  return duoWeekPairs(week).find(p => p.includes(name)) || null;
}

/** Their partner for the week, if that partner is still in the house. */
export function duoWeekPartner(week, name, house = gs.activePlayers || []) {
  const pair = duoWeekPairOf(week, name);
  if (!pair) return null;
  const other = pair.find(n => n !== name);
  return other && house.includes(other) ? other : null;
}

/** Nobody can put up a houseguest with nobody to put up beside them. */
export function duoWeekSafe(week) {
  const st = duoWeekState(week);
  return st?.solo ? [st.solo] : [];
}

// ══ pairing ════════════════════════════════════════════════════════════

/** How a pair takes being chained together, from their bond (the words are lines/duoact.js). */
function pairMood(a, b) {
  const bond = getBond(a, b);
  return bond >= 6 ? 'close' : bond >= 3 ? 'easy' : bond >= 0 ? 'unsure' : bond >= -3 ? 'tense' : 'enemies';
}

/**
 * Pair the house for the week.
 *
 * A Duos season's pairs are honoured wherever both halves are still playing —
 * the house should not be re-shuffled out of a structure it has been living in
 * since night one. Everybody else, including the orphans of a broken duo, is
 * paired here by who they are actually closest to, with a nudge of noise so a
 * replayed season is not a fixed diagram.
 */
export function openDuoWeek(week, { house = gs.activePlayers || [], hoh = null, rng = Math.random } = {}) {
  if (!week || week.duoWeek) return null;
  const pool = house.filter(n => n && n !== hoh);
  if (house.length < DUO_WEEK_MIN_HOUSE || pool.length < 4) return null;

  const pairs = [];
  const taken = new Set();
  let source = 'week';

  // Inherited pairs first, and only where both halves are still in the house.
  for (const name of pool) {
    if (taken.has(name)) continue;
    let seasonPair = null;
    try { seasonPair = duoOf(name); } catch { seasonPair = null; }
    if (!seasonPair) continue;
    const other = seasonPair.find(n => n !== name);
    if (!other || taken.has(other) || !pool.includes(other)) continue;
    pairs.push([name, other]);
    taken.add(name); taken.add(other);
    source = 'season';
  }

  // Everybody else — including anybody whose season partner has already gone.
  const rest = pool.filter(n => !taken.has(n));
  while (rest.length >= 2) {
    const a = rest.shift();
    let best = null, bestScore = -Infinity;
    for (const b of rest) {
      const score = getPerceivedBond(a, b) + (rng() * 2 - 1);
      if (score > bestScore) { bestScore = score; best = b; }
    }
    rest.splice(rest.indexOf(best), 1);
    pairs.push([a, best]);
  }
  const solo = rest[0] || null;
  if (pairs.length < 2) return null;

  week.duoWeek = {
    pairs, solo, hoh,
    source: pairs.length && source === 'season' ? 'mixed' : 'week',
    nominatedPairs: [],
    events: [],
  };
  // A pairing that came entirely from the season reads as the season's, not a
  // mixture of it and this morning's draw.
  if (source === 'season' && !rest.length && pairs.every(p => {
    try { const d = duoOf(p[0]); return d && d.includes(p[1]); } catch { return false; }
  })) week.duoWeek.source = 'season';

  return {
    type: 'duo-week-open', week: week.num, secret: false,
    name: 'You Go, They Go',
    pairs: pairs.map(p => [...p]),
    solo, hoh, source: week.duoWeek.source,
    rules: [
      'For this week only, this house is playing in pairs.',
      'The Head of Household will nominate TWO DUOS. Four of you will sit on that block, '
        + 'and naming one of you names the person you are chained to.',
      'You will vote the way you always vote: one name each. Whoever takes the most votes '
        + 'is evicted — AND SO IS THEIR PARTNER. It does not matter how many votes the partner got. '
        + 'It does not matter if it was none.',
      'Two of you are leaving on Thursday, and only one of you is going to have been chosen.',
    ],
    // Plain facts; the words are written by bb/script/ceremony.js (lines/duoact.js).
    beats: [
      beat('This week the house plays in pairs.', [], 'YOU GO, THEY GO', 'gold', 'open'),
      ...pairs.map(([a, b]) => beat(`${a} and ${b} are a pair.`, [a, b], 'CHAINED', 'blue', 'pair', { mood: pairMood(a, b) })),
      ...(hoh ? [beat(`${hoh} is Head of Household and is not in a pair.`, [hoh], 'HOH', 'gold', 'hoh')] : []),
      ...(solo ? [beat(`${solo} has no partner and cannot be nominated this week.`, [solo], 'UNNOMINATABLE', 'green', 'solo')] : []),
    ],
  };
}

// ══ nominations ════════════════════════════════════════════════════════

/**
 * Two duos, four keys.
 *
 * The Head of Household still decides who they want gone — the nomination plan
 * is read exactly as it would be on any other week. What changes is that each
 * name they land on drags a second one up with it, and they have to find two
 * of those instead of two people.
 */
export function duoWeekNominees(week, { plan = {}, house = gs.activePlayers || [], untouchable = [], hoh = null, rng = Math.random } = {}) {
  const st = duoWeekState(week);
  if (!st) return null;

  const block = new Set([...untouchable, ...duoWeekSafe(week)].filter(Boolean));
  const eligible = st.pairs.filter(p =>
    p.every(n => house.includes(n) && !block.has(n)));
  if (eligible.length < 2) return null;

  const wanted = [plan.target, ...(plan.nominees || []), plan.backdoorTarget].filter(Boolean);
  const chosen = [];
  for (const name of wanted) {
    const pair = eligible.find(p => p.includes(name));
    if (pair && !chosen.includes(pair)) chosen.push(pair);
    if (chosen.length === 2) break;
  }
  // Whatever the plan did not fill, the Head of Household fills the way they
  // fill any chair: the people they are least close to, first.
  if (chosen.length < 2) {
    const rest = eligible.filter(p => !chosen.includes(p))
      .map(p => ({ p, score: p.reduce((s, n) => s + getPerceivedBond(hoh, n), 0) + (rng() * 2 - 1) }))
      .sort((a, b) => a.score - b.score);
    for (const { p } of rest) {
      chosen.push(p);
      if (chosen.length === 2) break;
    }
  }
  if (chosen.length < 2) return null;

  st.nominatedPairs = chosen.map(p => [...p]);
  return chosen.flat();
}

/**
 * The veto pulls down a PAIR.
 *
 * You cannot half-save a duo — taking one of them off the block takes the
 * other, because the block this week is made of pairs and a lone nominee would
 * be playing a different game from the three beside them. So both come down,
 * and the chair's owner has to find a whole new duo to fill the gap.
 *
 * Returns null when there is no eligible pair left, which the ceremony reads
 * the same way it reads any other empty chair.
 */
export function duoWeekAfterVeto(week, { nominees = [], saved = null, replacement = null, house = gs.activePlayers || [], protectedNames = [], rng = Math.random } = {}) {
  const st = duoWeekState(week);
  if (!st || !saved) return null;
  const down = duoWeekPairOf(week, saved);
  if (!down) return null;

  // The ordinary ceremony has already seated one replacement. They are not
  // kept on their own (that left five on the block); their pair goes up whole
  // when it can, and otherwise the HOH picks a pair.
  const others = nominees.filter(n => n !== replacement);
  const block = new Set([...protectedNames, ...down, ...others, ...duoWeekSafe(week)].filter(n => n && n !== replacement));
  const eligible = p => p.every(n => house.includes(n) && !block.has(n));
  const theirs = replacement ? st.pairs.find(p => p.includes(replacement) && eligible(p)) : null;
  const candidates = theirs ? [theirs] : st.pairs.filter(p => eligible(p) && !p.includes(replacement));
  if (!candidates.length) return null;

  const up = candidates
    .map(p => ({ p, score: p.reduce((s, n) => s + getPerceivedBond(st.hoh, n), 0) + (rng() * 2 - 1) }))
    .sort((a, b) => a.score - b.score)[0].p;

  const kept = others.filter(n => !down.includes(n));
  st.nominatedPairs = [kept.length === 2 ? [...kept] : kept, [...up]].filter(p => p.length);
  return { nominees: [...kept, ...up], down: [...down], up: [...up] };
}

// ══ the vote, and what it actually costs ═══════════════════════════════

/**
 * Who the vote took that the vote never named.
 *
 * Called once the eviction is settled. The partner had a ballot cast against
 * them the moment the house decided about somebody else.
 */
export function duoWeekSecondEvictee(week, evicted, house = gs.activePlayers || []) {
  if (!duoWeekActive(week) || !evicted) return null;
  const partner = duoWeekPartner(week, evicted, house);
  if (!partner || partner === evicted) return null;
  return partner;
}


/**
 * The double walk-out.
 *
 * Records what the twist did rather than what the vote did — the vote is an
 * ordinary vote and reads as one on the eviction screen. This is the part
 * after it, where the second name is read and nobody voted for it.
 */
export function duoWeekEviction(week, { evicted, taken, votes = {} } = {}) {
  if (!evicted || !taken) return null;
  const v = votes[taken] || 0;
  const gotNothing = v === 0;
  Math.random();   // the draw that used to pick this beat's wording

  // Being taken out for somebody else's week is the single most sympathetic
  // thing that can happen to a houseguest, and the audience reacts accordingly.
  bumpPop(taken, gotNothing ? 3 : 1);

  return {
    type: 'duo-week-eviction', week: week.num, secret: false,
    evicted, taken, votesAgainstTaken: v, gotNothing,
    beats: [
      beat(`${evicted} is evicted, and ${taken} goes too.`, [taken, evicted], 'YOU GO, THEY GO', 'red', 'taken',
        { votes: v, gotNothing }),
    ],
  };
}

// ══ strategy for two ═══════════════════════════════════════════════════
//
// Every one of these moves a bond, a popularity number, or both. A duo week
// that produced only nominations would be a rule rather than a story — the
// point is that being chained to somebody changes what people are willing to
// say to each other, and all of it survives the week.

function ev(kind, text, playersIn, badgeText, badgeClass) {
  const ps = [...playersIn].filter(Boolean);
  // A plain fact; the words are lines/duoact.js `duoact.event.<kind>`.
  return { kind, text: text || `${ps.join(' and ')}: ${kind.replace('-', ' ')}.`, players: ps, badgeText, badgeClass };
}

/** A nominated duo campaigns as one thing, because they have no other option. */
function packageDeal(pair, rng, free = false) {
  const [a, b] = pair;
  addBond(a, b, 2);
  bumpPop(a, 1); bumpPop(b, 1);
  rng();   // the draw that used to pick this event's wording
  return { ...ev('package', '', pair, 'A PACKAGE', 'blue'), ...(free ? { free: true } : {}) };
}

/** Somebody tries the one pitch the rules have already ruled out. */
function sellOut(pair, rng) {
  const [a, b] = wouldSellOut(pair[0]) ? pair : [pair[1], pair[0]];
  addBond(a, b, -4);
  bumpPop(a, -3);
  bumpPop(b, 1);
  rng();   // the draw that used to pick this event's wording
  return ev('sell-out', '', [a, b], 'SOLD OUT', 'red');
}

/** The vote you cannot cast, because of who you came in with. */
function theDrag(pair, other, rng) {
  const [a, b] = pair;
  addBond(a, b, -1);
  rng();   // the draw that used to pick this event's wording
  return ev('drag', '', [a, b, other], 'THE DRAG', 'red');
}

/** Standing next to a bigger problem is the cheapest safety in this house. */
function theShield(pair, rng) {
  const [big, small] = [...pair].sort((x, y) =>
    ((pStats(y)?.strategic || 0) + (pStats(y)?.physical || 0)) - ((pStats(x)?.strategic || 0) + (pStats(x)?.physical || 0)));
  addBond(small, big, 1);
  rng();   // the draw that used to pick this event's wording
  return ev('shield', '', [small, big], 'THE SHIELD', 'green');
}

/** Two people who cannot stand each other, handcuffed for a week. */
function stuckWith(pair, rng) {
  const [a, b] = pair;
  const thaw = rng() < 0.45;
  addBond(a, b, thaw ? 3 : -2);
  bumpPop(a, thaw ? 1 : 0); bumpPop(b, thaw ? 1 : 0);
  rng();   // the draw that used to pick this event's wording
  return thaw ? ev('thaw', '', pair, 'THE THAW', 'green') : ev('blowup', '', pair, 'IT BLOWS UP', 'red');
}

/** Four people deciding to be eight votes. */
function thePact(p1, p2, rng) {
  for (const a of p1) for (const b of p2) addBond(a, b, 1);
  rng();   // the draw that used to pick this event's wording
  return ev('pact', '', [...p1, ...p2], 'FOUR AS ONE', 'blue');
}

/** The one person nobody can touch, and what that does to them. */
function soloWeek(solo, rng) {
  bumpPop(solo, 1);
  rng();   // the draw that used to pick this event's wording
  return ev('solo', '', [solo], 'UNTOUCHABLE', 'green');
}

/**
 * The week's duo events.
 *
 * At least one always fires — a guaranteed base event, with the rest on
 * probability, so no duo week is ever silent. Ordered so the block's own pairs
 * go first: what happens to the people actually in danger is the story, and the
 * house around them is the texture.
 */
export function duoWeekEvents(week, { house = gs.activePlayers || [], nominees = [], rng = Math.random } = {}) {
  const st = duoWeekState(week);
  if (!st) return null;

  const events = [];
  const nominated = (st.nominatedPairs || []).filter(p => p.length === 2);
  const free = st.pairs.filter(p =>
    p.every(n => house.includes(n)) && !p.some(n => nominees.includes(n)));

  // ── the block ──
  for (const pair of nominated) {
    if (!pair.every(n => house.includes(n))) continue;
    if (wouldSellOut(pair[0]) || wouldSellOut(pair[1])) {
      // Not automatic even for a villain: it has to be worth the risk of the
      // room finding out, and in this house the room always finds out.
      if (rng() < 0.65) { events.push(sellOut(pair, rng)); continue; }
    }
    events.push(packageDeal(pair, rng));
  }

  // ── everybody else ──
  for (const pair of free) {
    const bond = getBond(pair[0], pair[1]);
    if (bond <= -2 && rng() < 0.7) { events.push(stuckWith(pair, rng)); continue; }
    const gap = Math.abs(((pStats(pair[0])?.strategic || 0) + (pStats(pair[0])?.physical || 0))
      - ((pStats(pair[1])?.strategic || 0) + (pStats(pair[1])?.physical || 0)));
    if (gap >= 4 && rng() < 0.6) { events.push(theShield(pair, rng)); continue; }
    const target = nominees.find(n => house.includes(n)
      && getBond(pair[1], n) >= 3 && getBond(pair[0], n) <= 0);
    if (target && rng() < 0.7) { events.push(theDrag(pair, target, rng)); continue; }
    if (rng() < 0.3) events.push(packageDeal(pair, rng, true));
  }

  // ── the deal that needs four people in a room ──
  if (free.length >= 2 && rng() < 0.5) events.push(thePact(free[0], free[1], rng));

  // ── and the one who is not in any of this ──
  if (st.solo && house.includes(st.solo)) events.push(soloWeek(st.solo, rng));

  if (!events.length) return null;
  st.events = events.map(e => ({ ...e }));

  return {
    type: 'duo-week-events', week: week.num, secret: false,
    events: st.events,
    beats: events.map(e => beat(e.text, e.players, e.badgeText, e.badgeClass, 'event', { kind: e.kind, ...(e.free ? { free: true } : {}) })),
  };
}
