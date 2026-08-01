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
    const text = _variant([
      `${picked.join(', ')} carry their bags into the have-not room. ${first} tests one of the beds, hears it creak and decides standing is better for now.`,
      `The slop containers come out for ${picked.join(', ')}. ${first} laughs with everybody else, then goes quiet while measuring out dinner.`,
      `${picked.join(', ')} finish at the bottom and inherit cold showers, bad beds and a week of watching everybody else eat.`,
      repeat >= 2
        ? `${first} counts it up: this is ${pronouns(first).posAdj} ${repeat === 2 ? 'second' : repeat === 3 ? 'third' : `${repeat}th`} week on slop. ${second} stops joking when ${first} says the number aloud.`
        : `${first} insists the slop is fine, swallows one spoonful and quietly pushes the bowl away. ${second} slides over a glass of water.`,
    ], ctx, ...picked);

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
      `${joker} has been setting this up whenever ${victim} leaves the room. It works perfectly. ${victim} demands to know how and then demands to help with the next one.`,
    ], ctx, joker, victim) : _variant([
      `Everyone laughs at the prank except ${victim}. When ${joker} tries to explain it was harmless, ${victim} walks away.`,
      `${victim} does not laugh. The room laughs, then notices ${p.sub} is not laughing, then stops.`,
      `${joker} misjudges it badly. What was meant as a joke lands as a message about where ${victim} sits in this house.`,
      `${joker} hides ${victim}'s suitcase and keeps the joke going after ${victim} asks for it back. When it finally reappears, ${victim} says, “Very funny,” without smiling and takes it straight to the bedroom.`,
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
      `It is about the dishes and it is absolutely not about the dishes. ${tidy} has been counting every mess and tonight ${p.sub} says the number out loud.`,
      `${tidy} cleans up after ${slob} for the last time, announces that it was the last time, and is cleaning up after ${pronouns(slob).obj} again by Thursday.`,
      `"I'm not your mother." ${slob} points out, not unreasonably, that nobody asked ${tidy} to do it. This does not help.`,
      `The same pan is in the sink again. ${tidy} puts it, still dirty, on ${slob}'s bed.`,
    ], ctx, tidy, slob) : _variant([
      `${tidy} does the dishes again and says nothing again, and files it with everything else ${p.sub} is not saying.`,
      `Somebody has to do it. It is ${tidy}. It is always ${tidy}, and ${p.sub} has decided that being the person who does it is worth something.`,
      `${tidy} cleans the kitchen at one in the morning because it is the only time it is quiet and the only thing ${p.sub} can control.`,
      `${slob} thanks ${tidy} for cleaning, then leaves another plate on the counter. ${tidy} stares at it until ${slob} finally notices.`,
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
      `"${subject} trusts me completely," ${speaker} says, "which is going to become a problem for ${pronouns(subject).obj} when the numbers get smaller."`,
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
      `${a} starts counting how many days ${p.sub} has been in the house, gets halfway through and decides ${p.sub} does not want the answer.`,
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
      `${group.join(', ')} spend two hours at the kitchen table telling stories and making each other laugh. Nobody talks game, and nobody leaves early.`,
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
      `Being seen as a pair was fun until the house started treating it as a target on two backs. ${a} says so, badly.`,
      `${b} wants to talk about the vote. ${a} wants to not be in the house. Neither gets what they want.`,
      `They are still together and they have both started thinking about the week where one of them has to write the other's name down.`,
    ], ctx, a, b) : _variant([
      `${a} and ${b} take up a whole afternoon doing nothing in particular, and the rest of the house watches two people forget there are cameras.`,
      `It is not subtle. It has not been subtle for a while. ${a} has stopped trying to make it subtle.`,
      `Somebody jokes that ${a} and ${b} are attached at the hip. ${b} usually denies it. This time, ${b} just smiles.`,
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
    const p = pronouns(caller);
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

    const text = outcome === 'nobody talks' ? _variant([
      `${caller} calls everybody into the living room. ${about} takes a seat with the rest of them, and every person who encouraged ${caller} in private suddenly has nothing to add.`,
      `${caller} asks who else heard what ${about} said. A few people look down; one starts picking at a cushion. ${about} waits for an answer that never comes.`,
      `${caller} repeats the question with ${about} sitting a few feet away. Nobody backs ${caller} up, though several people were willing to do it behind a closed door.`,
      `${caller} asks for a show of hands. The room checks ${about}'s face first, and every hand stays down.`,
    ], ctx, caller, about) : outcome === 'lands' ? _variant([
      `${caller} asks ${about} the same question twice. ${about} gives two different answers, and somebody at the end of the couch says, “Wait, that's not what you told me.”`,
      `${caller} names the conversations, the rooms and the people who were there. Before ${about} can answer, two witnesses start filling in the missing parts.`,
      `${caller} keeps ${p.posAdj} voice level and lets ${about} talk. The longer ${about} explains, the more people in the room begin interrupting with corrections.`,
    ], ctx, caller, about) : outcome === 'fizzles' ? _variant([
      `${caller} calls a house meeting about dirty dishes. Everybody agrees the kitchen is disgusting; nobody admits leaving anything in the sink.`,
      `${caller} asks everyone to communicate more directly. The room nods, breaks up and immediately separates into smaller groups to discuss what ${caller} really meant.`,
      `${caller} says ${p.posAdj} piece, several people apologize in general terms, and the meeting ends without either ${caller} or ${about} speaking directly to each other.`,
    ], ctx, caller, about) : _variant([
      `${caller} opens with, “Everybody has a problem with this.” Nobody confirms it. ${about} barely has to defend ${pronouns(about).ref}; the room is already backing away from ${caller}'s version of events.`,
      `${caller} tries to put ${about} on trial, but keeps interrupting every answer. By the time somebody asks ${caller} to let ${about} finish, the room has chosen a side.`,
      `${caller} delivers a speech that sounded better alone in the bedroom. In the living room it feels rehearsed, and ${about}'s quiet “Can I answer now?” gets the strongest reaction.`,
      `${caller} says, “I'm not attacking anybody,” then lists everything ${about} has done wrong. Somebody near the door winces, and the rest of the room follows.`,
    ], ctx, caller, about);

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

    return {
      text, players: [caller, about].filter(Boolean),
      // The whole room, so the screen can draw what a house meeting actually is
      // — everybody in one place — instead of two portraits like any other
      // conversation. This is the loudest thing that happens in a week and it
      // was rendering identically to an argument about the washing up.
      meeting: { caller, about, outcome, cause, room: [...room],
        beats: _meetingBeats({ caller, about, outcome, cause, room, house, ctx }) },
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
 * The meeting, moment by moment.
 *
 * A house meeting is not a paragraph, it is a sequence: somebody shouts, the
 * room fills, a case gets made, the person it is about answers or does not, and
 * then everybody finds out where they stand. Rendering it as one card
 * compressed the only scene of the week where all fourteen people are in shot
 * into the same shape as an argument about the washing up.
 *
 * Four to five beats, each attributed, so the screen can play them one at a
 * time and the room can visibly change between them.
 */
function _meetingBeats({ caller, about, outcome, cause, room, house, ctx }) {
  const p = pronouns(caller);
  const q = about ? pronouns(about) : p;
  const witness = room.find(n => n !== about) || null;

  const called = _variant([
    `“HOUSE MEETING.” ${caller} calls it from the kitchen, then walks to the living room and waits while bedroom doors begin opening.`,
    `${caller} shouts for everybody to come to the living room. Conversations stop mid-sentence, and the house starts filing in.`,
    `${caller} calls a house meeting. Chairs scrape, blankets arrive from the bedrooms, and ${room.length + 1} houseguests gather without knowing who has been named.`,
  ], ctx, caller, 'call');

  const assembled = _variant([
    `${about || 'The last houseguest'} enters after most of the seats are taken. The space beside ${caller} remains conspicuously empty.`,
    `Some people sit; others stay behind the couch. Nobody asks what this is about because everybody expects to find out soon enough.`,
    `${about ? `${about} arrives, sees ${caller} standing in the middle of the room and chooses the seat nearest the door.` : 'The room fills, but nobody seems certain who should speak first.'}`,
  ], ctx, caller, 'assemble');

  const theCase = cause === 'lie' ? _variant([
    `${caller} does not raise ${p.posAdj} voice. ${p.Sub} repeats, exactly, what ${about} has been telling people about ${p.obj}, and asks ${about} to say it again now.`,
    `"Somebody in this room has been saying I made deals I never made." ${caller} looks at nobody in particular, which fools nobody in particular.`,
  ], ctx, caller, 'case') : cause === 'nothing-to-lose' ? _variant([
    `${caller} is on the block and done protecting conversations that have not protected ${p.obj}. ${p.Sub} starts naming the promises people made before the ceremony.`,
    `“If I'm leaving, you should know what people have been saying.” ${caller} starts with one name, then follows the story through every room it reached.`,
  ], ctx, caller, 'case') : _variant([
    `${caller} has been repeating this argument alone for long enough to know every word. Once ${p.sub} starts, ${p.sub} does not pause until ${about}'s name is out.`,
    `${caller} begins with a complaint about respect, then turns toward ${about} and finally says what the complaint is really about.`,
  ], ctx, caller, 'case');

  const answer = outcome === 'nobody talks' ? _variant([
    `${about} says nothing. ${q.Sub} ${q.sub === 'they' ? 'do' : 'does'} not need to — ${q.sub} ${q.sub === 'they' ? 'look' : 'looks'} around the room once, slowly, and three people who were nodding stop nodding.`,
    `The silence goes on long enough to stop being a pause. ${witness || 'Somebody'} studies the carpet. ${about} waits, entirely comfortable, for somebody braver.`,
  ], ctx, caller, 'answer') : outcome === 'lands' ? _variant([
    `${about} answers, and then answers again slightly differently, and the second version is the one everybody remembers.`,
    `${about} asks who else has a problem. It is meant as a challenge. Two hands go up and it stops being one.`,
  ], ctx, caller, 'answer') : outcome === 'backfires' ? _variant([
    `${about} does not interrupt. ${q.Sub} ${q.sub === 'they' ? 'let' : 'lets'} ${caller} keep talking until somebody else asks when ${about} will get a turn.`,
    `“Are you finished?” ${about} asks without raising ${q.posAdj} voice. Someone on the couch mutters, “Let ${about} answer,” and the mood turns.`,
  ], ctx, caller, 'answer') : _variant([
    `${witness || 'Somebody'} breaks the silence with a joke about the dirty kitchen. Enough people laugh that ${caller} cannot pull the room back.`,
    `${witness || 'Somebody'} asks why ${caller} did not speak to ${about} privately. Several people nod, and the meeting begins ending around them.`,
  ], ctx, caller, 'answer');

  const verdict = outcome === 'lands'
    ? `It breaks up without anybody announcing an end. Before ${about} can leave the room, two people stop ${q.obj} to ask why ${q.posAdj} answers changed.`
    : outcome === 'backfires'
      ? `People drift out in twos, and every pair is talking about ${caller}. Not one of them is talking about ${about}.`
      : outcome === 'nobody talks'
        ? `Nothing was decided and everybody learned the same thing: this house does not say ${about}'s name out loud yet.`
        : `Everybody promises to handle things differently. The meeting breaks up, and ${caller} and ${about} leave through separate doors.`;

  return [
    { kind: 'call', who: caller, text: called },
    { kind: 'assemble', who: null, text: assembled },
    { kind: 'case', who: caller, text: theCase },
    { kind: 'answer', who: about, text: answer },
    { kind: 'verdict', who: null, text: verdict },
  ];
}

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
