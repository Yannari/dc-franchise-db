// ══════════════════════════════════════════════════════════════════════
// bb-events/house-life.js — the parts that are not the game
// ══════════════════════════════════════════════════════════════════════
//
// Slop, chores, sleep, boredom, the diary room. None of it is strategy and all
// of it is why the strategy goes wrong: people who are cold, hungry and three
// weeks from home make worse decisions than people who are not, and the house
// keeps score of who did the dishes.
//
// The rule here is the same as everywhere else — nothing is cosmetic. A prank
// lands or it does not and either way somebody remembers it. Being a have-not
// costs you the competition on Thursday. The diary room is the one place a
// houseguest says a true thing, and true things told to a camera have a way of
// becoming true in the house.

import { gs } from '../core.js';
import { pronouns } from '../players.js';
import {
  pStats, bond, band, bondFactor, closestTo, furthestFrom, trusts, dislikes,
  sharesAlliance, grudge, remembers, suspicionOf, targetOf, threat, willScheme,
  isNice, isVillainous, archetype, romanceOf, trustOf, resentmentOf,
  beatsInvolving, spotlightOrder,
} from './_read.js';
import { makeScene } from '../bb/script/scene.js';
import { writeMeeting } from '../bb/script/meeting.js';

// ── helpers ───────────────────────────────────────────────────────────

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
/** Least-seen first, weighted toward whoever this week is about. */
const _leastSeen = pool => spotlightOrder(pool);
const _nominees = ctx => (ctx?.nominees || []).filter(Boolean);

/** Which room a scene happens in: by hash, never a die. */
function _room(rooms, ctx, ...people) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${people.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return rooms[hash % rooms.length];
}

/**
 * House life happens in the downtime and almost never during a ceremony.
 *
 * Stronger early in a week, when there are days to fill, and quiet once the
 * vote is live — nobody is worrying about the dishes on eviction night.
 */
function _actFit(ctx) {
  switch (ctx?.act) {
    case 'hoh': return 1.2;
    case 'veto': return 1;
    case 'campaign': return 0.45;
    case 'eviction': return 0.2;       // nobody is worrying about chores tonight
    case 'nominations':
    case 'veto-ceremony': return 0.2;
    default: return 1;
  }
}
const _w = (value, ctx) => band(value * _actFit(ctx));

// ── casting ───────────────────────────────────────────────────────────

/**
 * The people who are ACTUALLY on slop.
 *
 * This used to rank the house by unpopularity and pick two or three, which is
 * how it worked before the have-nots were tied to the competition — and it kept
 * doing it afterwards, in parallel, ignoring the real list entirely. So the
 * event named people who were not have-nots, and named them before the
 * competition that decides it had been run. Everything downstream of it was
 * describing a punishment nobody had received.
 *
 * The real answer is set from the Head of Household competition placements and
 * lives on the week.
 */
function _haveNots(house, ctx) {
  const live = (ctx?.haveNots || gs.bb?.haveNots || [])
    .filter(name => house.includes(name));
  return live.length >= 2 ? live : null;
}

/** How many weeks this person has already spent on slop. */
function _slopWeeks(name) {
  return (gs.bb?.weeks || []).filter(w => (w.haveNots || []).includes(name)).length;
}

function _prankPair(house, ctx) {
  const jokers = _leastSeen(house.filter(n =>
    ['wildcard', 'chaos-agent', 'hothead', 'social-butterfly', 'villain'].includes(archetype(n))
    || pStats(n).boldness >= 7));
  const joker = jokers[0];
  if (!joker) return null;
  const victim = _others(house, joker)
    .sort((a, b) => (pStats(a).temperament - pStats(b).temperament))[0];
  return victim ? { joker, victim } : null;
}

function _choreConflict(house, ctx) {
  const tidy = _leastSeen(house.filter(n => pStats(n).temperament >= 5))[0];
  if (!tidy) return null;
  const slob = _others(house, tidy).sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
  return slob ? { tidy, slob } : null;
}

// ── the events ────────────────────────────────────────────────────────

const haveNots = {
  id: 'life-have-nots',
  category: 'house-life',
  weight(house, ctx) {
    return _haveNots(house, ctx) ? _w(9, ctx) : 0;
  },
  fire(house, ctx, api) {
    const picked = _haveNots(house, ctx);
    const [first, second] = picked;
    // "again" has to have happened before. Counted off the weeks, not asserted.
    const repeat = _slopWeeks(first);
    const p = pronouns(first);
    const scene = makeScene('slop.picked', { a: first, b: second || null }, { ending: 'scene', intent: repeat >= 2 ? 'repeat' : 'once',
      nth: repeat === 2 ? 'second' : repeat === 3 ? 'third' : `${repeat}th`, group: picked.join(', ') }, [], 'bedroom');

    // Being cold and hungry costs you the week. Nobody chose it out of malice —
    // they finished last — which is its own kind of humiliation.
    picked.forEach(name => {
      api.popDelta(name, 1);                       // the audience likes suffering
      api.remember(name, first === name ? second : first, 'shared-hardship', 1, {});
      _others(house, ...picked).forEach(other => {
        if (pStats(name).temperament <= 4) api.addBond(name, other, -0.3);
      });
    });
    // Suffering together builds something the game cannot easily break.
    if (second) api.addBond(first, second, 1.1);
    return { scene, players: picked, badgeText: 'HAVE-NOTS', badgeClass: 'grey' };
  },
};

const prank = {
  id: 'life-prank',
  category: 'house-life',
  weight(house, ctx) {
    const cast = _prankPair(house, ctx);
    if (!cast) return 0;
    return _w(band(pStats(cast.joker).boldness * 0.9), ctx);
  },
  fire(house, ctx, api) {
    const { joker, victim } = _prankPair(house, ctx);
    // Whether it lands is about the victim's temper, not the joke.
    const funny = pStats(victim).temperament >= 5 && !dislikes(victim, joker);
    if (funny) {
      api.addBond(joker, victim, 1.2);
      api.popDelta(joker, 1);
      _others(house, joker, victim).forEach(w => api.addBond(joker, w, 0.2));
    } else {
      api.addBond(joker, victim, -1.3);
      api.remember(victim, joker, 'humiliation', 2, { about: 'a prank' });
      api.suspicion(victim, joker, 0.7);
      api.popDelta(joker, -1);
    }
    const scene = makeScene('life.prank', { a: joker, b: victim }, { ending: funny ? 'funny' : 'misfire' }, [], _room(['bedroom', 'kitchen', 'living-room'], ctx, joker, victim));
    return {
      scene, players: [joker, victim],
      badgeText: funny ? 'PRANK' : 'PRANK MISFIRES',
      badgeClass: funny ? 'green' : 'red',
    };
  },
};

const chores = {
  id: 'life-chores',
  category: 'house-life',
  weight(house, ctx) {
    const cast = _choreConflict(house, ctx);
    if (!cast) return 0;
    const gap = pStats(cast.tidy).temperament - pStats(cast.slob).temperament;
    return _w(band(gap * 1.3 + 2), ctx);
  },
  fire(house, ctx, api) {
    const { tidy, slob } = _choreConflict(house, ctx);
    const boils = resentmentOf(tidy, slob) > 2 || pStats(tidy).temperament <= 6;
    api.addBond(tidy, slob, boils ? -1.1 : -0.4);
    api.remember(tidy, slob, 'grievance', boils ? 2 : 1, { about: 'the house' });
    if (boils) {
      _others(house, tidy, slob).forEach(w => api.suspicion(w, tidy, 0.2));
      api.popDelta(slob, -1);
    }
    const scene = makeScene('life.chores', { a: tidy, b: slob }, { ending: boils ? 'boils' : 'quiet' }, [], 'kitchen');
    return {
      scene, players: [tidy, slob],
      badgeText: boils ? 'IT IS NOT ABOUT THE DISHES' : 'DOING IT AGAIN',
      badgeClass: boils ? 'red' : 'grey',
    };
  },
};

const diaryRoom = {
  id: 'life-diary-room',
  category: 'house-life',
  weight(house, ctx) {
    return house.length ? _w(8, ctx) : 0;
  },
  fire(house, ctx, api) {
    const speaker = _leastSeen(house)[0];
    const subject = targetOf(speaker) || closestTo(speaker, _others(house, speaker)) || _others(house, speaker)[0];
    const arch = archetype(speaker);
    // What somebody says alone to a camera is the truest thing they say all week.
    if (targetOf(speaker) === subject) {
      api.remember(speaker, subject, 'resolve', 1, { said: 'in the diary room' });
    } else {
      api.remember(speaker, subject, 'confidence', 1, {});
    }
    api.popDelta(speaker, 1);
    // The subject is talked about; the Diary Room holds one person.
    const scheming = isVillainous(speaker) || willScheme(speaker);
    const scene = makeScene('life.diary', { a: speaker, b: subject }, { ending: scheming ? 'scheming' : 'honest' }, [], 'diary-room');
    scene.seenBy = [speaker];
    return { scene, players: [speaker], badgeText: 'DIARY ROOM', badgeClass: 'blue' };
  },
};

const sleepless = {
  id: 'life-sleepless',
  category: 'house-life',
  weight(house, ctx) {
    const wired = house.filter(n => pStats(n).temperament <= 5 || _nominees(ctx).includes(n));
    return wired.length ? _w(band(wired.length * 1.4), ctx) : 0;
  },
  fire(house, ctx, api) {
    const wired = _leastSeen(house.filter(n => pStats(n).temperament <= 6 || _nominees(ctx).includes(n)));
    const a = wired[0] || house[0];
    const companion = _others(house, a).find(n => bond(a, n) >= 2) || null;
    api.popDelta(a, 1);
    if (companion) {
      api.addBond(a, companion, 0.6);
      api.remember(a, companion, 'kindness', 1, { when: 'the small hours' });
    }
    const scene = makeScene('life.sleepless', { a, b: companion || null }, { ending: companion ? 'company' : 'alone' }, [], _room(['kitchen', 'bedroom'], ctx, a));
    return { scene, players: [a, companion].filter(Boolean), badgeText: 'NO SLEEP', badgeClass: 'grey' };
  },
};

const homesick = {
  id: 'life-homesick',
  category: 'house-life',
  weight(house, ctx) {
    // Bites hardest deep into a season.
    const deep = (ctx?.week?.num || 0) >= 4 ? 1.5 : 0.5;
    return _w(6 * deep, ctx);
  },
  fire(house, ctx, api) {
    const a = _leastSeen(house)[0];
    const helper = closestTo(a, _others(house, a));
    if (helper) {
      api.addBond(a, helper, 1.0);
      api.remember(a, helper, 'kindness', 2, { when: 'homesick' });
    }
    api.popDelta(a, 1);
    const scene = makeScene('life.homesick', { a, b: helper || null }, { ending: helper ? 'helped' : 'alone' }, [], _room(['backyard', 'bedroom'], ctx, a));
    return { scene, players: [a, helper].filter(Boolean), badgeText: 'HOMESICK', badgeClass: 'grey' };
  },
};

const kitchenTable = {
  id: 'life-kitchen-table',
  category: 'house-life',
  weight(house, ctx) {
    return house.length >= 5 ? _w(7, ctx) : 0;
  },
  fire(house, ctx, api) {
    const group = _leastSeen(house).slice(0, 3);
    const [a, b, c] = group;
    for (const x of group) {
      for (const y of group) if (x !== y) api.addBond(x, y, 0.5);
    }
    if (a) api.popDelta(a, 1);
    const scene = makeScene('life.table', { a, b, c: c || null }, { ending: 'talk' }, group, 'kitchen');
    return { scene, players: group, badgeText: 'KITCHEN TABLE', badgeClass: 'green' };
  },
};

const showmanceDomestic = {
  id: 'life-showmance-domestic',
  category: 'house-life',
  weight(house, ctx) {
    if (ctx?.week?._domesticShowmance) return 0;
    const paired = house.find(n => romanceOf(n) && house.includes(romanceOf(n)));
    return paired ? _w(9, ctx) : 0;
  },
  fire(house, ctx, api) {
    const a = house.find(n => romanceOf(n) && house.includes(romanceOf(n)));
    const b = romanceOf(a);
    if (ctx?.week) ctx.week._domesticShowmance = true;
    const strained = bond(a, b) < 3 || _nominees(ctx).includes(a) || _nominees(ctx).includes(b);
    api.addBond(a, b, strained ? -0.8 : 1.3);
    // A visible couple is two votes nobody else can have.
    const witnesses = _others(house, a, b).filter(w => pStats(w).intuition >= 5).slice(0, 4);
    witnesses.forEach(w => api.suspicion(w, a, 0.6));
    const scene = makeScene('life.couple', { a, b }, { ending: strained ? 'strained' : 'sweet' }, [], _room(['backyard', 'bedroom', 'living-room'], ctx, a, b));
    return {
      scene, players: [a, b, ...witnesses],
      badgeText: strained ? 'STRAIN' : 'THE PAIR',
      badgeClass: strained ? 'red' : 'gold',
    };
  },
};

/**
 * Somebody calls a house meeting, and it is nobody's week to call one.
 *
 * The Head of Household version lives in reign.js and is a specific failure of
 * power. This is the commoner one: anybody can stand up in the living room, and
 * the reason it is famous is that it almost never works. A house meeting takes
 * a problem two people had and makes it a problem eleven people have opinions
 * about, in front of the person it is about, with no way to walk any of it back.
 *
 * Grounded rather than random. There has to be an actual grievance behind it —
 * a live lie somebody is carrying, a nominee with nothing left to lose, or a
 * grudge that has stopped fitting in a bedroom — because a meeting called about
 * nothing is the one version of this that never happens.
 *
 * Three ways it goes, decided by whether the caller has a real case and the
 * composure to make it:
 *
 *   lands       — the person they named has to answer in front of everybody
 *   fizzles     — everybody agrees to be nicer and nothing whatsoever changes
 *   backfires   — the house closes ranks and the caller becomes the story
 *   nobody talks — the subject is standing right there, so the room says
 *                  nothing at all, which tells everybody who the room belongs to
 */
const houseMeeting = {
  id: 'life-house-meeting',
  category: 'house-life',
  location: 'living-room',
  weight(house, ctx) {
    if (house.length < 6) return 0;
    // Once a week at the very most. They are memorable because they are rare,
    // and a house that holds two of them is a sitcom.
    if (ctx?.week?._houseMeetingCalled) return 0;
    // The meeting IS the scene, so it needs a room with nothing else happening
    // in it — never during a ceremony or on eviction night.
    if (['nominations', 'veto-ceremony', 'eviction'].includes(ctx?.act)) return 0;
    return _meetingCaller(house, ctx) ? _w(2.6, ctx) : 0;
  },
  fire(house, ctx, api) {
    const call = _meetingCaller(house, ctx);
    if (ctx?.week) ctx.week._houseMeetingCalled = true;
    if (!call) {
      return { text: 'Somebody thinks about calling a house meeting and has the sense not to.',
        players: [], badgeText: 'THOUGHT BETTER OF IT', badgeClass: 'grey' };
    }
    const { caller, about, cause } = call;
    const room = _others(house, caller);
    const stats = pStats(caller);

    // Composure separates an accusation from a meltdown; having an actual case
    // separates it from a rant. It needs both.
    const composed = stats.temperament >= 5 && stats.social >= 5;
    const hasACase = cause === 'lie' || cause === 'grudge';

    // And before any of that: will the room actually speak?
    //
    // The Frank Eudy version, which is the one nobody expects. He called a
    // meeting to get the house on the same page, and everybody came — which was
    // the problem, because the person the meeting was about came too, and
    // nobody would say a word in front of them. A house meeting is public by
    // definition and that is exactly what makes it useless against somebody the
    // room is frightened of.
    // Both, not either. Being a threat is not enough — plenty of threats get
    // shouted at. The room goes quiet when the person is dangerous AND a good
    // part of the room is tied to them, which is when speaking up costs
    // something real. Gated on either, this swallowed seven meetings in ten.
    const tied = _others(house, caller, about).filter(n => bond(n, about) >= 3).length;
    const feared = threat(about) >= 6.5 && tied >= Math.ceil(room.length / 3);
    const outcome = feared ? 'nobody talks'
      : composed && hasACase ? 'lands'
      : composed ? 'fizzles' : 'backfires';

    if (outcome === 'lands') {
      room.filter(n => n !== about).forEach(n => {
        api.suspicion(n, about, 0.9);
        api.addBond(n, about, -0.4);
        api.addBond(n, caller, 0.3);
      });
      api.remember(about, caller, 'humiliation', 2, { at: 'a house meeting' });
      api.popDelta(caller, 2);
      api.popDelta(about, -2);
    } else if (outcome === 'backfires') {
      // The room bonds over the discomfort, which is the whole danger of it.
      room.forEach(n => {
        api.suspicion(n, caller, 0.8);
        api.addBond(n, caller, -0.7);
      });
      room.forEach((a, i) => { const b = room[i + 1]; if (b) api.addBond(a, b, 0.4); });
      if (about) api.addBond(about, caller, -1.2);
      api.remember(caller, about, 'humiliation', 2, { at: 'a house meeting' });
      api.popDelta(caller, -2);
    } else if (outcome === 'nobody talks') {
      // Nothing is said, and everybody learns something anyway: how much of
      // this room belongs to the person nobody would speak in front of.
      api.addBond(caller, about, -0.8);
      room.filter(n => n !== about).forEach(n => {
        api.suspicion(n, about, 0.5);
        api.remember(n, about, 'nobody-would-speak', 1, { at: 'a house meeting' });
      });
      api.popDelta(caller, -1);
      api.popDelta(about, 1);
    } else {
      room.forEach(n => api.addBond(n, caller, 0.15));
      api.popDelta(caller, 1);
    }

    // Written as one four-part script (bb/script/meeting.js).
    const written = writeMeeting({ caller, about, witness: room.find(n => n !== about) || null, outcome, cause }, ctx);
    return {
      text: written.text, players: [caller, about].filter(Boolean),
      lines: written.lines, lineId: written.lineId, location: 'living-room',
      // The whole room, so the screen can draw what a house meeting actually is
      // — everybody in one place — instead of two portraits like any other
      // conversation. This is the loudest thing that happens in a week and it
      // was rendering identically to an argument about the washing up.
      meeting: { caller, about, outcome, cause, room: [...room],
        beats: written.beats },
      badgeText: outcome === 'lands' ? 'THEY HAD RECEIPTS'
        : outcome === 'backfires' ? 'THE ROOM TURNS'
        : outcome === 'nobody talks' ? 'NOBODY WILL SAY IT' : 'NOTHING CHANGES',
      badgeClass: outcome === 'lands' ? 'orange'
        : outcome === 'backfires' ? 'red'
        : outcome === 'nobody talks' ? 'blue' : 'grey',
    };
  },
};

/**
 * Who would call one, and about what.
 *
 * In order of how likely each is to get somebody on their feet: a person who
 * has been lied about and knows it, a nominee with nothing left to lose, and a
 * grudge that has outgrown a private conversation.
 */
function _meetingCaller(house, ctx) {
  const noms = ((ctx?.nominees && ctx.nominees.length ? ctx.nominees
    : (ctx?.week?.finalNominees || [])) || []).filter(n => house.includes(n));

  for (const claim of (gs.bb?.falseClaims || [])) {
    if (!house.includes(claim.mark) || !house.includes(claim.liar)) continue;
    if (suspicionOf(claim.mark, claim.liar) < 1.5) continue;
    return { caller: claim.mark, about: claim.liar, cause: 'lie' };
  }

  for (const nom of _leastSeen(noms)) {
    if (pStats(nom).boldness < 6) continue;
    const enemy = furthestFrom(nom, _others(house, nom));
    if (enemy) return { caller: nom, about: enemy, cause: 'nothing-to-lose' };
  }

  for (const name of _leastSeen(house)) {
    const worst = _others(house, name)
      .filter(other => grudge(name, other) >= 3)
      .sort((a, b) => grudge(name, b) - grudge(name, a))[0];
    if (worst) return { caller: name, about: worst, cause: 'grudge' };
  }
  return null;
}

export const HOUSE_LIFE_EVENTS = [
  haveNots,
  houseMeeting,
  prank,
  chores,
  diaryRoom,
  sleepless,
  homesick,
  kitchenTable,
  showmanceDomestic,
];

export default HOUSE_LIFE_EVENTS;
