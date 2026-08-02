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
import { pronouns } from '../players.js';
import {
  pStats, bond, band, spotlightOrder, isNice, closestTo, furthestFrom,
} from './_read.js';

// ── helpers ───────────────────────────────────────────────────────────

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

const _quiet = pool => spotlightOrder(pool);
const _list = names => (names.length <= 1 ? (names[0] || '')
  : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

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
    const p = pronouns(first);
    const q = pronouns(second);
    const weeks = _slopWeeks(first);

    const text = _variant([
      `There is one packet of the flavouring left and two people entitled to it. ${first} and ${second} manage about ninety seconds of being reasonable about that.`,
      `“You had the last of it yesterday.” ${second} did not have the last of it yesterday. ${first} is certain, loudly, and wrong, and does not find out ${p.sub} ${p.sub === 'they' ? 'were' : 'was'} wrong until after the apology.`,
      `${first} portions the slop into ${slop.length} bowls with a precision nobody asked for. ${second} points out that one bowl is bigger and neither of them is prepared to let it go.`,
      `It is about a jar of pickles. Genuinely, literally, a jar of pickles — ${first} was saving it and ${second} did not know that, and by the end of it ${_list(slop)} are not speaking.`,
      `${second} eats standing at the counter to avoid the conversation. ${first} follows ${q.obj} to the counter to have it anyway.`,
      `${weeks >= 2 ? `${first} is on ${p.posAdj} ${_ordinal(weeks)} week of this and has stopped being able to be funny about it.` : `${first} has not eaten properly since Friday and has stopped being able to be funny about it.`} ${second} makes a joke about the slop and gets a look that ends the meal.`,
    ], ctx, this.id, first, second);

    api.addBond(first, second, -0.9);
    api.popDelta(first, -1);
    api.popDelta(second, 1);
    api.remember(second, first, 'grievance', 1, { about: 'the have-not room' });
    return { text, players: [first, second], badgeText: 'OVER A JAR', badgeClass: 'red' };
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
    const p = pronouns(snapper);
    const q = pronouns(target);

    const text = _variant([
      `${target} asks ${snapper} a completely ordinary question about the laundry and gets an answer with about four days of no sleep behind it. The kitchen goes quiet.`,
      `${target} is cooking something that smells extremely good and has committed no other crime. ${snapper} tells ${q.obj} exactly what ${p.sub} ${p.sub === 'they' ? 'think' : 'thinks'} of the timing.`,
      `“Could you not do that in here?” ${snapper} does not raise ${p.posAdj} voice, which somehow makes it worse. ${target} takes the plate to the backyard and tells two people about it before ${p.sub === 'they' ? 'they get' : 'getting'} there.`,
      `${snapper} has been awake since half past four on a bed with a metal frame. ${target} says good morning. It goes badly out of all proportion to the greeting.`,
      `It is not really about the sandwich. ${target} knows it is not really about the sandwich, and still spends the afternoon deciding ${snapper} is somebody who cracks under pressure.`,
      `${snapper} apologises within ten minutes and means it. ${target} accepts it, and adds the original ten minutes to a list that has ${snapper}'s name at the top of it.`,
    ], ctx, this.id, snapper, target);

    api.addBond(snapper, target, -1.0);
    api.suspicion(target, snapper, 0.7);
    api.remember(target, snapper, 'cracks-under-it', 2, { about: 'slop week' });
    api.popDelta(snapper, -1);
    return { text, players: [snapper, target], badgeText: 'NO SLEEP, NO PATIENCE', badgeClass: 'red' };
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
    const p = pronouns(first);
    const together = Math.min(_slopWeeks(first), _slopWeeks(second));

    const text = _variant([
      `${first} comes out of the cold shower unable to speak for about eight seconds. ${second} is waiting with a towel and the specific laugh of somebody who has to go next.`,
      `They work out a system — thirty seconds in, thirty seconds out — and it does not help at all, and by the third night they are doing it anyway and timing each other.`,
      `${second} says the worst part is not the cold, it is knowing it is coming all day. ${first} agrees, and for the first time this season the two of them are agreeing about something that is not the game.`,
      `Nobody else in this house understands and ${first} and ${second} both know it. That is most of what an alliance is, and neither of them has said the word.`,
      `${first} and ${second} sit on the have-not beds at two in the morning listing every meal they are going to eat when they get out. It takes an hour and neither of them wants it to end.`,
      `${together >= 1 ? `Second week in the same room for both of them. ` : ''}${first} says, “At least it's you,” and ${second} does not have anything clever to say back, which is unusual.`,
    ], ctx, this.id, first, second);

    api.addBond(first, second, 1.3);
    api.remember(first, second, 'shared-hardship', 2, { about: 'the have-not room' });
    api.remember(second, first, 'shared-hardship', 2, { about: 'the have-not room' });
    api.popDelta(first, 1);
    // Sometimes misery is where a working relationship actually starts. Rare —
    // most of the time it is just two cold people being nice to each other.
    if ((rng ? rng() : 1) < 0.22) {
      api.sideDeal(first, second, 'working', { genuine: true, about: 'we look after each other' });
    }
    return { text, players: [first, second], badgeText: 'THE SAME ROOM', badgeClass: 'green' };
  },
};

// ── somebody chose this ───────────────────────────────────────────────

function _resentCast(house, ctx) {
  const slop = _haveNots(house, ctx);
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
    const p = pronouns(stewing);
    const weeks = _slopWeeks(stewing);

    const text = _variant([
      `${stewing} keeps coming back to the same thing: the competition decided the bottom, but somebody still had to write the names down, and ${hoh} wrote them.`,
      `“It's not personal.” ${hoh} says it in passing on the way upstairs. ${stewing} has been lying on a metal bed frame for three nights working out precisely how personal it is.`,
      `${lucky ? `${lucky} finished one place above ${stewing} and is currently eating a full dinner. ` : ''}${stewing} has done the arithmetic on that gap approximately forty times today.`,
      `${stewing} is not going to say anything, because saying it makes ${p.obj} the person who complained about slop. ${p.Sub} ${p.sub === 'they' ? 'just add' : 'just adds'} ${hoh} to a list instead.`,
      `${weeks >= 2 ? `This is the ${_ordinal(weeks)} week ${stewing} has been on slop and ${hoh} has been Head of Household for one of them. ` : `${stewing} watches ${hoh} carry a plate up to the Head of Household room. `}Nothing is said. Something is definitely decided.`,
      `${_list(slop)} are on slop and none of them chose it. ${stewing} is the only one who has noticed that ${hoh} has not once come into the have-not room this week.`,
    ], ctx, this.id, stewing, hoh);

    api.suspicion(stewing, hoh, 1.0);
    api.addBond(stewing, hoh, -0.6);
    api.remember(stewing, hoh, 'put-me-on-slop', 2, { week: ctx?.week?.num || 0 });
    if (lucky) api.suspicion(stewing, lucky, 0.3);
    return { text, players: [stewing, hoh, lucky].filter(Boolean),
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
    const p = pronouns(watcher);
    const q = pronouns(kind);

    // Nobody breaks a rule. The house is on camera and everybody knows it —
    // what is on offer is company, which is the only thing that is free.
    const text = _variant([
      `Midnight in the kitchen and four people are eating properly. ${watcher} sits at the end of the table with a glass of water, watching, not saying anything. ${kind} moves down and sits next to ${p.obj} without a plate.`,
      `${kind} finishes eating, then makes a cup of tea ${q.sub} ${q.sub === 'they' ? 'do' : 'does'} not want so that ${watcher} has somebody to sit with while everybody else clears up.`,
      `${watcher} says ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} fine and ${p.sub} ${p.sub === 'they' ? 'do' : 'does'} not mind watching. ${kind} takes ${q.posAdj} plate into the other room and eats it out of sight instead.`,
      `Nobody hands ${watcher} anything — there are cameras in every corner and both of them know exactly what that would cost. ${kind} just stays up until ${watcher} goes to bed, which takes until nearly two.`,
      `${kind} describes what ${q.sub} ${q.sub === 'they' ? 'are' : 'is'} eating, in detail, as a joke. Then ${q.sub} ${q.sub === 'they' ? 'stop' : 'stops'}, because ${watcher}'s face has gone, and ${q.sub} ${q.sub === 'they' ? 'spend' : 'spends'} the next twenty minutes talking about anything else.`,
      `${watcher} will remember two things about this week: the cold, and ${kind} sitting on the counter at midnight keeping ${p.obj} company for no strategic reason whatsoever.`,
    ], ctx, this.id, watcher, kind);

    api.addBond(watcher, kind, 1.2);
    api.remember(watcher, kind, 'kindness', 2, { when: 'slop week' });
    api.popDelta(kind, 1);
    return { text, players: [watcher, kind], badgeText: 'SAT WITH ME', badgeClass: 'green' };
  },
};

export const HAVENOT_LIFE_EVENTS = [
  slopArgument, sleepDeprivedSnap, solidarity, selectionResentment, midnightKitchen,
];

export default HAVENOT_LIFE_EVENTS;
