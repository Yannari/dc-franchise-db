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

import { pronouns } from '../players.js';
import {
  pStats, bond, band, bondFactor, closestTo, furthestFrom, trusts, dislikes,
  sharesAlliance, grudge, remembers, suspicionOf, targetOf, threat, willScheme,
  isNice, isVillainous, archetype, romanceOf, trustOf, resentmentOf,
  beatsInvolving,
} from './_read.js';

// ── helpers ───────────────────────────────────────────────────────────

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _leastSeen = pool => [...pool].sort((a, b) => beatsInvolving(a) - beatsInvolving(b));
const _nominees = ctx => (ctx?.nominees || []).filter(Boolean);

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
    case 'nominations':
    case 'veto-ceremony': return 0.2;
    default: return 1;
  }
}
const _w = (value, ctx) => band(value * _actFit(ctx));

// ── casting ───────────────────────────────────────────────────────────

/** Have-nots are picked by the house, so the least-liked tend to end up there. */
function _haveNots(house, ctx) {
  if (house.length < 6) return null;
  const ranked = [...house].sort((a, b) => {
    const pop = (n) => _others(house, n).reduce((s, m) => s + bond(m, n), 0);
    return pop(a) - pop(b);
  });
  const picked = ranked.slice(0, Math.min(3, Math.max(2, Math.floor(house.length / 5))));
  return picked.length >= 2 ? picked : null;
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
    const p = pronouns(first);
    const text = _variant([
      `The have-not room goes to ${picked.join(', ')}, which surprises exactly nobody and is noted by all three of them.`,
      `Cold showers and slop for ${picked.join(' and ')}. ${first} takes it well in public and considerably worse at two in the morning.`,
      `${picked.join(', ')} draw the short straw, and the vote that decided it was not close, and everybody knows the vote was not close.`,
      `${first} works out that being a have-not twice in three weeks is not bad luck, it is information.`,
    ], ctx, ...picked);

    // Being cold and hungry costs you the week — and the house choosing you is
    // a message you are meant to receive.
    picked.forEach(name => {
      api.popDelta(name, 1);                       // the audience likes suffering
      api.remember(name, first === name ? second : first, 'shared-hardship', 1, {});
      _others(house, ...picked).forEach(other => {
        if (pStats(name).temperament <= 4) api.addBond(name, other, -0.3);
      });
    });
    // Suffering together builds something the game cannot easily break.
    if (second) api.addBond(first, second, 1.1);
    return { text, players: picked, badgeText: 'HAVE-NOTS', badgeClass: 'grey' };
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
    const p = pronouns(victim);
    // Whether it lands is about the victim's temper, not the joke.
    const funny = pStats(victim).temperament >= 5 && !dislikes(victim, joker);
    const text = funny ? _variant([
      `${joker} rearranges every single item in ${victim}'s drawer and ${victim} takes forty minutes to notice, then laughs harder than ${joker} did.`,
      `The prank is stupid, elaborate and genuinely funny, and for about an hour the house forgets what it is.`,
      `${victim} walks into it, sees exactly what has happened, and says "${joker}" to an empty room with real affection.`,
      `${joker} has been building this for two days. It works perfectly. ${victim} demands to know how and then demands to help with the next one.`,
    ], ctx, joker, victim) : _variant([
      `The prank is funny to everybody except ${victim}, which is the only opinion that turns out to matter.`,
      `${victim} does not laugh. The room laughs, then notices ${p.sub} is not laughing, then stops.`,
      `${joker} misjudges it badly. What was meant as a joke lands as a message about where ${victim} sits in this house.`,
      `${victim} says "very funny" in the voice people use when it was not, and goes to bed early.`,
    ], ctx, joker, victim);

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
    return {
      text, players: [joker, victim],
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
    const p = pronouns(tidy);
    const boils = resentmentOf(tidy, slob) > 2 || pStats(tidy).temperament <= 6;
    const text = boils ? _variant([
      `It is about the dishes and it is absolutely not about the dishes. ${tidy} has been counting for eleven days and tonight ${p.sub} says the number out loud.`,
      `${tidy} cleans up after ${slob} for the last time, announces that it was the last time, and is cleaning up after ${pronouns(slob).obj} again by Thursday.`,
      `"I'm not your mother." ${slob} points out, not unreasonably, that nobody asked ${tidy} to do it. This does not help.`,
      `The pan has been in the sink for three days. ${tidy} puts it, still dirty, on ${slob}'s bed.`,
    ], ctx, tidy, slob) : _variant([
      `${tidy} does the dishes again and says nothing again, and files it with everything else ${p.sub} is not saying.`,
      `Somebody has to do it. It is ${tidy}. It is always ${tidy}, and ${p.sub} has decided that being the person who does it is worth something.`,
      `${tidy} cleans the kitchen at one in the morning because it is the only time it is quiet and the only thing ${p.sub} can control.`,
      `${slob} thanks ${tidy} without noticing what ${pronouns(slob).sub} is thanking ${pronouns(tidy).obj} for, which is somehow worse than not thanking ${pronouns(tidy).obj}.`,
    ], ctx, tidy, slob);

    api.addBond(tidy, slob, boils ? -1.1 : -0.4);
    api.remember(tidy, slob, 'grievance', boils ? 2 : 1, { about: 'the house' });
    if (boils) {
      _others(house, tidy, slob).forEach(w => api.suspicion(w, tidy, 0.2));
      api.popDelta(slob, -1);
    }
    return {
      text, players: [tidy, slob],
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
    const p = pronouns(speaker);
    const subject = targetOf(speaker) || closestTo(speaker, _others(house, speaker)) || _others(house, speaker)[0];
    const arch = archetype(speaker);
    // What somebody says alone to a camera is the truest thing they say all week.
    const text = isVillainous(speaker) || willScheme(speaker) ? _variant([
      `"Everyone in this house thinks they know what I'm doing." ${speaker} is enjoying this considerably more than ${p.sub} lets on out there.`,
      `${speaker} explains the plan to the camera in full, in order, with names. It is a very good plan. ${p.Sub} has told nobody in the house any of it.`,
      `"${subject} trusts me completely," ${speaker} says, "which is going to be a problem for ${pronouns(subject).obj} in about nine days."`,
      `${speaker} smiles at the lens in a way ${p.sub} has been careful not to smile at anybody.`,
    ], ctx, speaker, subject) : _variant([
      `${speaker} sits down and, for the first time in about a week, stops performing. What comes out is mostly about being tired.`,
      `"I don't know if I'm playing this right." Nobody in the house has heard ${speaker} say anything like that, and nobody will.`,
      `${speaker} talks about ${subject} for four minutes and only works out halfway through that ${p.sub} is talking about ${p.ref}.`,
      `${speaker} admits to the camera that ${p.sub} does not want to write ${subject}'s name down, and that ${p.sub} probably will.`,
    ], ctx, speaker, subject);

    // Saying it out loud is how a houseguest commits to it.
    if (targetOf(speaker) === subject) {
      api.remember(speaker, subject, 'resolve', 1, { said: 'in the diary room' });
    } else {
      api.remember(speaker, subject, 'confidence', 1, {});
    }
    api.popDelta(speaker, 1);
    return { text, players: [speaker], badgeText: 'DIARY ROOM', badgeClass: 'blue' };
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
    const p = pronouns(a);
    const text = _variant([
      `${a} does not sleep. ${p.Sub} lies there running the same four names in the same order until it gets light.`,
      `Three in the morning and ${a} is in the kitchen, not eating anything, just standing in the one room where nobody will ask ${p.obj} how ${p.sub} is doing.`,
      `${a} has been awake so long that the plan has started to look like a different plan.`,
      `Everybody else is asleep. ${a} listens to a house full of people breathing and has never felt further from any of them.`,
    ], ctx, a);

    // Exhaustion is a real handicap and a real bonding opportunity.
    api.popDelta(a, 1);
    if (companion) {
      api.addBond(a, companion, 0.6);
      api.remember(a, companion, 'kindness', 1, { when: 'the small hours' });
    }
    return { text, players: [a, companion].filter(Boolean), badgeText: 'NO SLEEP', badgeClass: 'grey' };
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
    const p = pronouns(a);
    const text = _variant([
      `${a} does the arithmetic on how long ${p.sub} has been in here and has to stop doing it.`,
      `Somebody mentions a birthday ${a} is going to miss and the whole table watches ${pronouns(a).obj} decide not to react.`,
      `${a} has stopped talking about home, which everyone who has been in here long enough recognises as the bad sign rather than the good one.`,
      `It arrives out of nothing, in the middle of an ordinary afternoon, and ${a} has to go and stand outside for a while.`,
    ], ctx, a);

    if (helper) {
      api.addBond(a, helper, 1.0);
      api.remember(a, helper, 'kindness', 2, { when: 'homesick' });
    }
    api.popDelta(a, 1);
    return { text, players: [a, helper].filter(Boolean), badgeText: 'HOMESICK', badgeClass: 'grey' };
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
    const text = _variant([
      `Nothing happens at the kitchen table for two hours, which is the most valuable two hours of the day: ${group.join(', ')} find out who laughs at what.`,
      `${a} tells a story about ${pronouns(a).posAdj} job that has nothing to do with anything and by the end ${b} and ${c} have decided how they feel about ${pronouns(a).obj}.`,
      `The conversation is about food, and then about home, and then, without anyone steering it, about who has been acting strangely this week.`,
      `${group.join(', ')} stay up long past the point of usefulness. Nobody says a single strategic word and all three leave knowing more than they came with.`,
    ], ctx, ...group);

    // The most undervalued thing in the house: being liked by default.
    for (const x of group) {
      for (const y of group) if (x !== y) api.addBond(x, y, 0.5);
    }
    if (a) api.popDelta(a, 1);
    return { text, players: group, badgeText: 'KITCHEN TABLE', badgeClass: 'green' };
  },
};

const showmanceDomestic = {
  id: 'life-showmance-domestic',
  category: 'house-life',
  weight(house, ctx) {
    const paired = house.find(n => romanceOf(n) && house.includes(romanceOf(n)));
    return paired ? _w(9, ctx) : 0;
  },
  fire(house, ctx, api) {
    const a = house.find(n => romanceOf(n) && house.includes(romanceOf(n)));
    const b = romanceOf(a);
    const p = pronouns(a);
    const strained = bond(a, b) < 3 || _nominees(ctx).includes(a) || _nominees(ctx).includes(b);
    const text = strained ? _variant([
      `${a} and ${b} have their first proper argument, in whispers, in a house with eleven other people in it and nowhere to have it.`,
      `Being a pair was fun for two weeks. This week it is a target on two backs and ${a} says so, badly.`,
      `${b} wants to talk about the vote. ${a} wants to not be in the house. Neither gets what they want.`,
      `They are still together and they have both started thinking about the week where one of them has to write the other's name down.`,
    ], ctx, a, b) : _variant([
      `${a} and ${b} take up a whole afternoon doing nothing in particular, and the rest of the house watches two people forget there are cameras.`,
      `It is not subtle. It has not been subtle for a while. ${a} has stopped trying to make it subtle.`,
      `Somebody makes a joke about the pair of them and ${b} does not deny it, which is new.`,
      `${a} and ${b} are the only two people in this house who look properly rested, and everybody has noticed.`,
    ], ctx, a, b);

    api.addBond(a, b, strained ? -0.8 : 1.3);
    // A visible couple is two votes nobody else can have.
    _others(house, a, b).forEach(w => {
      if (pStats(w).intuition >= 5) api.suspicion(w, a, 0.6);
    });
    return {
      text, players: [a, b],
      badgeText: strained ? 'STRAIN' : 'THE PAIR',
      badgeClass: strained ? 'red' : 'gold',
    };
  },
};

export const HOUSE_LIFE_EVENTS = [
  haveNots,
  prank,
  chores,
  diaryRoom,
  sleepless,
  homesick,
  kitchenTable,
  showmanceDomestic,
];

export default HOUSE_LIFE_EVENTS;
