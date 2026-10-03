// ══════════════════════════════════════════════════════════════════════
// bb-events/havenot-life.js — a week of being cold, hungry and awake
// ══════════════════════════════════════════════════════════════════════
//
// house-life.js announces the have-nots and then the house forgets about them
// for seven days. That is backwards: the announcement is the least interesting
// part. What matters is the fourth night, when two people who have eaten
// nothing but slop since Friday are arguing about a jar, and the fact that one
// of them will be voting on Thursday.
//
// Everything here comes off the real list — the one set from the Head of
// Household competition placements and written onto the week — and nothing
// invents a punishment nobody received. Where house-life.js reads it with its
// own private helper, this file re-derives the same answer from the same
// sources rather than importing across event files, because these libraries
// must not be able to break each other.
//
// The five scenes are the five things slop actually does to a house:
//
//   it makes people petty        — over a jar of something edible
//   it makes people short        — and the person they snap at ate dinner
//   it makes people close        — misery is the fastest alliance glue there is
//   it makes people resentful    — somebody chose this, and it was not random
//   and it makes people kind     — quietly, at midnight, at no cost to anybody
//
// Nobody breaks a rule in this file. The house is watched twenty-four hours a
// day and the nice archetypes know it; comfort is what they have to give.

import { gs } from '../core.js';
import {
  pStats, bond, band, spotlightOrder, isNice, closestTo, furthestFrom,
} from './_read.js';
import { punishedHaveNots } from '../bb/punishments.js';
import { makeScene } from '../bb/script/scene.js';

// ── helpers ───────────────────────────────────────────────────────────


const _quiet = pool => spotlightOrder(pool);

/**
 * Who is ACTUALLY on slop this week.
 *
 * Three sources because the list arrives by three routes depending on where in
 * the week the beat is scheduled: the act context carries it during the
 * have-nots act, the week object carries it for the rest of the week, and
 * gs.bb.haveNots is the live copy the competitions read. Same answer from all
 * three; reading only one of them makes the events go silent for whole acts.
 */
function _haveNots(house, ctx) {
  const raw = ctx?.week?.haveNots || ctx?.haveNots || gs.bb?.haveNots || [];
  return (Array.isArray(raw) ? raw : []).filter(n => house.includes(n));
}

/** Everybody who is eating. */
const _haves = (house, ctx) => {
  const slop = _haveNots(house, ctx);
  return house.filter(n => !slop.includes(n));
};

/** How many weeks this person has already done this. Counted, never asserted. */
const _slopWeeks = name =>
  (gs.bb?.weeks || []).filter(w => (w.haveNots || []).includes(name)).length;

const _ordinal = n => (n === 1 ? 'first' : n === 2 ? 'second' : n === 3 ? 'third'
  : n === 4 ? 'fourth' : `${n}th`);

/**
 * Slop is a week-long condition, so it belongs in the downtime.
 *
 * Loudest during the have-nots act itself and the days after it, quiet by
 * eviction night — nobody is arguing about a jar of pickles while the votes are
 * being read.
 */
const _fit = ctx => {
  switch (ctx?.act) {
    // Ceremony acts draw one to three beats and belong to the ceremony.
    // Slop texture has the whole rest of the week.
    case 'nominations':
    case 'veto-ceremony': return 0;
    case 'eviction': return 0.2;
    case 'campaign': return 0.5;
    case 'have-nots': return 1.4;
    case 'hoh': return 1.15;
    default: return 1;
  }
};
const _w = (value, ctx) => band(value * _fit(ctx));

/** Shortest fuse first, with a stable tie-break. */
const _shortest = names =>
  [...names].sort((a, b) => pStats(a).temperament - pStats(b).temperament || (a < b ? -1 : 1))[0] || null;

// ── the last edible thing in the house ────────────────────────────────

function _argumentCast(house, ctx) {
  const slop = _haveNots(house, ctx);
  if (slop.length < 2) return null;
  const first = _shortest(slop);
  const second = _quiet(slop.filter(n => n !== first))[0];
  return second ? { slop, first, second } : null;
}

const slopArgument = {
  id: 'havenot-slop-argument',
  category: 'house-life',
  location: 'kitchen',
  weight(house, ctx) {
    const cast = _argumentCast(house, ctx);
    if (!cast) return 0;
    // Four days in, everything is a fight. Temper does the rest.
    const fuse = (10 - pStats(cast.first).temperament) / 10;
    return _w(3.5 + fuse * 5, ctx);
  },
  fire(house, ctx, api) {
    const { slop, first, second } = _argumentCast(house, ctx);
    const weeks = _slopWeeks(first);

    const scene = makeScene('slop.argument', { a: first, b: second }, { ending: 'scene', intent: weeks >= 2 ? 'repeat' : 'once', nth: _ordinal(weeks) }, [], 'kitchen');

    api.addBond(first, second, -0.9);
    api.popDelta(first, -1);
    api.popDelta(second, 1);
    api.remember(second, first, 'grievance', 1, { about: 'the have-not room' });
    return { scene, players: [first, second], badgeText: 'OVER A JAR', badgeClass: 'red' };
  },
};

// ── snapping at somebody who ate ──────────────────────────────────────

function _snapCast(house, ctx) {
  const slop = _haveNots(house, ctx);
  const haves = _haves(house, ctx);
  if (!slop.length || !haves.length) return null;
  const snapper = _shortest(slop);
  // Whoever they were already least fond of. Nobody snaps at random; they snap
  // at the person the week has already made unbearable.
  const target = furthestFrom(snapper, haves) || haves[0];
  return target ? { slop, haves, snapper, target } : null;
}

const sleepDeprivedSnap = {
  id: 'havenot-sleep-deprived-snap',
  category: 'house-life',
  location: 'kitchen',
  weight(house, ctx) {
    const cast = _snapCast(house, ctx);
    if (!cast) return 0;
    const fuse = (10 - pStats(cast.snapper).temperament) / 10;
    const worn = Math.min(3, _slopWeeks(cast.snapper));
    return _w(3 + fuse * 5.5 + worn * 0.8, ctx);
  },
  fire(house, ctx, api) {
    const { snapper, target } = _snapCast(house, ctx);

    const scene = makeScene('slop.snap', { a: snapper, b: target }, { ending: 'scene' }, [], 'kitchen');

    api.addBond(snapper, target, -1.0);
    api.suspicion(target, snapper, 0.7);
    api.remember(target, snapper, 'cracks-under-it', 2, { about: 'slop week' });
    api.popDelta(snapper, -1);
    return { scene, players: [snapper, target], badgeText: 'NO SLEEP, NO PATIENCE', badgeClass: 'red' };
  },
};

// ── the cold showers ──────────────────────────────────────────────────

const solidarity = {
  id: 'havenot-cold-shower-solidarity',
  category: 'house-life',
  location: 'bathroom',
  weight(house, ctx) {
    const slop = _haveNots(house, ctx);
    if (slop.length < 2) return 0;
    return _w(6.5, ctx);
  },
  fire(house, ctx, api, rng) {
    const slop = _haveNots(house, ctx);
    const first = _quiet(slop)[0];
    const second = _quiet(slop.filter(n => n !== first))[0];
    const together = Math.min(_slopWeeks(first), _slopWeeks(second));

    const scene = makeScene('slop.solidarity', { a: first, b: second }, { ending: 'scene', intent: together >= 2 ? 'repeat' : 'once' }, [], 'washroom');

    api.addBond(first, second, 1.3);
    api.remember(first, second, 'shared-hardship', 2, { about: 'the have-not room' });
    api.remember(second, first, 'shared-hardship', 2, { about: 'the have-not room' });
    api.popDelta(first, 1);
    // Sometimes misery is where a working relationship actually starts. Rare —
    // most of the time it is just two cold people being nice to each other.
    if ((rng ? rng() : 1) < 0.22) {
      api.sideDeal(first, second, 'working', { genuine: true, about: 'we look after each other' });
    }
    return { scene, players: [first, second], badgeText: 'THE SAME ROOM', badgeClass: 'green' };
  },
};

// ── somebody chose this ───────────────────────────────────────────────

function _resentCast(house, ctx) {
  const punished = new Set(punishedHaveNots(ctx?.week?.num || 0));
  // Only the competition-selected Have-Nots can reasonably blame the HOH.
  // Slop added later by a package, box or prize has a different public source.
  const slop = _haveNots(house, ctx).filter(n => !punished.has(n));
  if (!slop.length) return null;
  const hoh = ctx?.hoh && house.includes(ctx.hoh) && !slop.includes(ctx.hoh) ? ctx.hoh : null;
  if (!hoh) return null;
  const stewing = _quiet(slop)[0];
  // The other name in the story: whoever was spared and everybody noticed.
  const spared = _haves(house, ctx).filter(n => n !== hoh);
  const lucky = spared.length
    ? [...spared].sort((a, b) => bond(hoh, b) - bond(hoh, a) || (a < b ? -1 : 1))[0] : null;
  return { slop, hoh, stewing, lucky };
}

const selectionResentment = {
  id: 'havenot-selection-resentment',
  category: 'house-life',
  location: 'bedroom',
  weight(house, ctx) {
    const cast = _resentCast(house, ctx);
    if (!cast) return 0;
    const worn = Math.min(3, _slopWeeks(cast.stewing));
    return _w(4 + worn * 1.4, ctx);
  },
  fire(house, ctx, api) {
    const { slop, hoh, stewing, lucky } = _resentCast(house, ctx);
    const weeks = _slopWeeks(stewing);

    const scene = makeScene('slop.resent', { a: stewing, b: hoh }, { ending: 'scene', intent: lucky ? 'lucky' : 'plain', partner: lucky || null, again: weeks >= 2, nth: _ordinal(weeks) }, [], 'bedroom');

    api.suspicion(stewing, hoh, 1.0);
    api.addBond(stewing, hoh, -0.6);
    api.remember(stewing, hoh, 'put-me-on-slop', 2, { week: ctx?.week?.num || 0 });
    if (lucky) api.suspicion(stewing, lucky, 0.3);
    return { scene, players: [stewing, hoh, lucky].filter(Boolean),
      badgeText: 'SOMEBODY WROTE THE NAMES', badgeClass: 'blue' };
  },
};

// ── midnight, and somebody is kind ────────────────────────────────────

function _kindCast(house, ctx) {
  const slop = _haveNots(house, ctx);
  const haves = _haves(house, ctx);
  if (!slop.length || !haves.length) return null;
  const watcher = _quiet(slop)[0];
  // Nice archetypes first — they are the ones who sit down rather than look
  // away — then whoever is actually closest.
  const kindly = haves.filter(n => isNice(n));
  const kind = (kindly.length ? closestTo(watcher, kindly) || kindly[0] : null)
    || closestTo(watcher, haves) || haves[0];
  return kind ? { slop, haves, watcher, kind } : null;
}

const midnightKitchen = {
  id: 'havenot-midnight-kitchen-watch',
  category: 'house-life',
  location: 'kitchen',
  weight(house, ctx) {
    const cast = _kindCast(house, ctx);
    if (!cast) return 0;
    return _w(5.5, ctx);
  },
  fire(house, ctx, api) {
    const { watcher, kind } = _kindCast(house, ctx);

    // Nobody breaks a rule. The house is on camera and everybody knows it —
    // what is on offer is company, which is the only thing that is free.
    const scene = makeScene('slop.kitchen', { a: watcher, b: kind }, { ending: 'scene' }, [], 'kitchen');

    api.addBond(watcher, kind, 1.2);
    api.remember(watcher, kind, 'kindness', 2, { when: 'slop week' });
    api.popDelta(kind, 1);
    return { scene, players: [watcher, kind], badgeText: 'SAT WITH ME', badgeClass: 'green' };
  },
};

export const HAVENOT_LIFE_EVENTS = [
  slopArgument, sleepDeprivedSnap, solidarity, selectionResentment, midnightKitchen,
];

export default HAVENOT_LIFE_EVENTS;
