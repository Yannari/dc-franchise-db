// ══════════════════════════════════════════════════════════════════════
// THE HOUSE AS A HOUSE — friction that has nothing to do with the game
// ══════════════════════════════════════════════════════════════════════
//
// Most of what a Big Brother house argues about is not strategy. It is dishes,
// noise, somebody eating the last of something, being talked down to, a laugh
// that has stopped being funny after five weeks. The blow-ups people remember
// are almost never about a vote — they are about a person, in a room, at the
// end of a long month with no clock and no exit.
//
// The catalogue had the strategic side well covered and about twenty house-life
// beats to carry everything else, so the ordinary texture repeated long before
// the game did. This is the ordinary texture: eight ways to fall out over
// nothing and eight ways to spend an afternoon.
//
// DELIBERATELY THE SAME WEIGHT as everything else in the house-life pool. These
// exist to widen what can happen on a given day, not to take days away from
// the events that move the game. A friction beat that outbid a scheme would
// have made the house louder and the season emptier.
//
// Everything here still changes something, per the rule that no event is
// cosmetic — but what it changes is small and personal: a bond, a grudge, how
// the room reads somebody. A row about a frying pan does not move a vote. It
// moves who somebody sits next to for the next three days, and eventually
// that moves a vote.
import { pronouns } from '../players.js';
import {
  pStats, bond, band, closestTo, furthestFrom, dislikes, trusts,
  sharesAlliance, resentmentOf, grudge, isVillainous, isNice, spotlightOrder,
} from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

/**
 * Ordinary life happens in the gaps, and barely at all on a ceremony day.
 *
 * The same shape house-life uses, so these compete on equal terms with the
 * beats already there rather than crowding them out.
 */
function _actFit(ctx) {
  switch (ctx?.act) {
    case 'hoh': return 1.15;
    case 'veto': return 1;
    case 'campaign': return 0.5;
    case 'eviction': return 0.2;
    case 'nominations':
    case 'veto-ceremony': return 0.25;
    default: return 1;
  }
}
const _w = (value, ctx) => band(value * _actFit(ctx));
const _live = house => spotlightOrder(house.filter(Boolean));

/** How much a person grates on another, with nothing strategic in it. */
function _irritation(a, b) {
  const sa = pStats(a); const sb = pStats(b);
  // Low temperament frays; a loud person and a quiet one fray faster.
  const temper = (10 - (sb.temperament || 5)) * 0.12;
  const clash = Math.abs((sa.social || 5) - (sb.social || 5)) * 0.06;
  const cold = bond(a, b) < 0 ? 0.6 : 0;
  return temper + clash + cold + resentmentOf(b, a) * 0.15;
}

/** Two people who live together and are starting to notice it. */
function _grating(house, ctx) {
  const pool = _live(house);
  if (pool.length < 4) return null;
  let best = null;
  for (const a of pool) {
    for (const b of pool) {
      if (a === b) continue;
      const heat = _irritation(a, b);
      if (heat < 1.1) continue;
      if (!best || heat > best.heat) best = { culprit: a, annoyed: b, heat };
    }
  }
  return best;
}

/** Two people with no particular reason to be in a room together. */
function _casualPair(house, ctx) {
  const pool = _live(house);
  if (pool.length < 3) return null;
  const a = pool[0];
  // Somebody they are not close to and not at war with — where the surprising
  // conversations actually happen.
  const b = pool.slice(1).find(n => Math.abs(bond(a, n)) < 4) || pool[1];
  return b ? { a, b } : null;
}

const _others = (house, ...ex) => house.filter(n => n && !ex.includes(n));

// ══════════════════════════════════════════════════════════════════════
// FALLING OUT OVER NOTHING
// ══════════════════════════════════════════════════════════════════════

/** The dishes. It is always, in the end, the dishes. */
const theDishes = {
  id: 'friction-dishes',
  category: 'house-life',
  weight(house, ctx) {
    const cast = _grating(house, ctx);
    return cast ? _w(3.2 + cast.heat * 0.5, ctx) : 0;
  },
  fire(house, ctx, api) {
    const { culprit, annoyed } = _grating(house, ctx);
    const p = pronouns(annoyed);
    const text = _variant([
      `${annoyed} has washed up after ${culprit} four days running and today decides not to. The pan sits there until dinner, and by the time somebody finally moves it the whole house knows exactly who was not going to.`,
      `"I am not your mother." ${annoyed} says it lightly and it does not land lightly. ${culprit} says it was one bowl. ${annoyed} says it is never one bowl.`,
      `There is a system for the dishes. ${culprit} has never once followed the system. ${annoyed} explains the system again, in front of people, in a voice that has stopped pretending.`,
      `${culprit} leaves a pan soaking, which in this house means leaving it for somebody else. ${annoyed} finds it at midnight and does it, loudly, while ${culprit} is trying to sleep four feet away.`,
    ], ctx, culprit, annoyed);
    api.addBond(annoyed, culprit, -0.9);
    api.remember(annoyed, culprit, 'never-cleans-up', 2, { about: 'the kitchen' });
    // The room takes a side, and it is rarely the messy one.
    _others(house, culprit, annoyed).slice(0, 2).forEach(w => api.addBond(w, annoyed, 0.2));
    return {
      text, players: [annoyed, culprit],
      badgeText: 'THE DISHES', badgeClass: 'grey',
    };
  },
};

/** Somebody ate it. There is never enough and everybody is counting. */
const theFood = {
  id: 'friction-food',
  category: 'house-life',
  weight(house, ctx) {
    const cast = _grating(house, ctx);
    return cast ? _w(3.4 + cast.heat * 0.4, ctx) : 0;
  },
  fire(house, ctx, api) {
    const { culprit, annoyed } = _grating(house, ctx);
    const p = pronouns(annoyed);
    const text = _variant([
      `${annoyed} had been saving it. Everybody in this house is saving something, because there is never enough of anything, and ${culprit} ate it without checking whether it was spoken for.`,
      `The last of the good cereal goes at eleven in the morning. ${annoyed} finds the empty box still sitting in the cupboard, which somehow is the part that stings.`,
      `${culprit} makes a portion for one that would comfortably do three. ${annoyed} watches the whole thing happen and says nothing, and saying nothing takes visible effort.`,
      `"Did you eat the rest of that?" ${culprit} says yes, easily, with no idea that ${annoyed} has been thinking about it since breakfast.`,
    ], ctx, culprit, annoyed);
    api.addBond(annoyed, culprit, -0.8);
    api.popDelta(culprit, -1);
    return {
      text, players: [annoyed, culprit],
      badgeText: 'THERE WAS NEVER ENOUGH', badgeClass: 'grey',
    };
  },
};

/** Nobody sleeps at the same time and everybody has opinions about it. */
const theNoise = {
  id: 'friction-noise',
  category: 'house-life',
  weight(house, ctx) {
    const cast = _grating(house, ctx);
    if (!cast) return 0;
    // The people who fall out about noise are the ones who need the sleep.
    return _w(2.8 + (10 - (pStats(cast.annoyed).endurance || 5)) * 0.18, ctx);
  },
  fire(house, ctx, api) {
    const { culprit, annoyed } = _grating(house, ctx);
    const p = pronouns(culprit);
    const text = _variant([
      `${culprit} and two others are still talking at three in the morning, in a room with beds in it, at a volume that is not quite a whisper. ${annoyed} lies there doing the arithmetic on how many hours are left.`,
      `Somebody is singing. Big Brother tells them to stop singing. Somebody starts singing again forty seconds later, and ${annoyed} makes a sound into the pillow that carries further than the singing did.`,
      `${annoyed} asks the room to keep it down. ${culprit} keeps it down for about four minutes. The second time ${annoyed} asks, it is not a request.`,
      `The lights go on at seven because ${culprit} is a morning person and has never once thought about what that means for eleven other people.`,
    ], ctx, culprit, annoyed);
    api.addBond(annoyed, culprit, -0.7);
    api.remember(annoyed, culprit, 'kept-me-awake', 1, { about: 'the bedroom' });
    return {
      text, players: [annoyed, culprit],
      badgeText: 'NOBODY SLEPT', badgeClass: 'grey',
    };
  },
};

/** Being talked to like you are slow, in front of people. */
const condescension = {
  id: 'friction-condescended',
  category: 'social',
  weight(house, ctx) {
    const cast = _grating(house, ctx);
    if (!cast) return 0;
    // The people who do this are confident, not cruel, which is why it lands.
    return _w(2.6 + (pStats(cast.culprit).strategic || 5) * 0.16, ctx);
  },
  fire(house, ctx, api) {
    const { culprit, annoyed } = _grating(house, ctx);
    const p = pronouns(annoyed);
    const witness = _others(house, culprit, annoyed)[0];
    const text = _variant([
      `${culprit} explains something ${annoyed} already knows, slowly, using ${p.posAdj} first name twice. ${annoyed} lets it finish and then leaves the room.`,
      `It is the way ${culprit} says "no, listen" — as though ${annoyed} had not been. ${witness || 'Somebody'} catches ${annoyed}'s face and pretends not to have.`,
      `${culprit} finishes ${annoyed}'s sentence for ${p.obj}, wrongly, and moves on before ${annoyed} can correct it. That is the third time today.`,
      `"You would not get it." ${culprit} means it kindly, which is worse than if ${p.sub} had not.`,
    ], ctx, culprit, annoyed);
    api.addBond(annoyed, culprit, -1.1);
    api.remember(annoyed, culprit, 'talks-down-to-me', 2, { about: 'being spoken to' });
    if (witness) api.addBond(annoyed, witness, 0.3);
    return {
      text, players: [annoyed, culprit, witness].filter(Boolean),
      badgeText: 'SPOKEN TO LIKE THAT', badgeClass: 'red',
    };
  },
};

/** The bathroom, the mirror, the one good chair. */
const theSpace = {
  id: 'friction-space',
  category: 'house-life',
  weight(house, ctx) {
    const cast = _grating(house, ctx);
    return cast ? _w(2.9, ctx) : 0;
  },
  fire(house, ctx, api) {
    const { culprit, annoyed } = _grating(house, ctx);
    const text = _variant([
      `${culprit} has been in the bathroom for fifty minutes. There are eleven other people in this house and exactly one mirror that anybody wants.`,
      `${annoyed} comes back to find ${culprit} in the chair. It is not ${annoyed}'s chair. It has been ${annoyed}'s chair for three weeks.`,
      `Somebody has moved ${annoyed}'s things off the good bed. Nobody admits to it. ${annoyed} knows exactly who, and says so to the wrong person first.`,
      `${culprit} borrows a jumper without asking. It comes back smelling of the backyard and ${annoyed} does not mention it, which everybody notices more than a row.`,
    ], ctx, culprit, annoyed);
    api.addBond(annoyed, culprit, -0.6);
    return {
      text, players: [annoyed, culprit],
      badgeText: 'NOT YOUR SEAT', badgeClass: 'grey',
    };
  },
};

/** Five weeks of the same story, told the same way. */
const theStory = {
  id: 'friction-same-story',
  category: 'house-life',
  weight(house, ctx) {
    const pool = _live(house);
    if (pool.length < 4) return 0;
    const week = Number(ctx?.week?.num) || 1;
    // Only funny after they have all heard it. Genuinely rises with time.
    return week < 3 ? 0 : _w(2.4 + week * 0.25, ctx);
  },
  fire(house, ctx, api) {
    const pool = _live(house);
    const teller = pool.slice().sort((a, b) => (pStats(b).social || 5) - (pStats(a).social || 5))[0];
    const tired = _others(house, teller).slice(0, 2);
    const p = pronouns(teller);
    const text = _variant([
      `${teller} tells the story again. Everybody in this room has heard the story. ${tired[0]} mouths the ending along with ${p.obj} and has to look at the floor.`,
      `There is a version of ${teller}'s story that takes four minutes and a version that takes eleven, and tonight is an eleven. ${tired[0]} and ${tired[1] || 'somebody'} have a whole conversation about it with their eyebrows.`,
      `${teller} says "did I ever tell you about—" and three people say yes at the same time, and it is not unkind, quite.`,
      `The story has grown. It was a good story in week one and now there is a helicopter in it.`,
    ], ctx, teller);
    // Being the person everybody has heard enough of costs a little standing.
    api.popDelta(teller, -1);
    tired.forEach(n => api.addBond(n, tired.find(m => m !== n) || n, 0.3));
    return {
      text, players: [teller, ...tired].filter(Boolean),
      badgeText: 'HEARD IT', badgeClass: 'grey',
    };
  },
};

/** Somebody snaps at nobody in particular, because it is week six. */
const theSnap = {
  id: 'friction-snapped',
  category: 'house-life',
  weight(house, ctx) {
    const pool = _live(house);
    if (pool.length < 3) return 0;
    const week = Number(ctx?.week?.num) || 1;
    return _w(1.8 + week * 0.3, ctx);
  },
  fire(house, ctx, api) {
    const pool = _live(house);
    // Whoever is closest to the end of their patience.
    const snapper = pool.slice().sort((a, b) =>
      (pStats(a).temperament || 5) - (pStats(b).temperament || 5))[0];
    const at = _others(house, snapper)[0];
    const p = pronouns(snapper);
    const text = _variant([
      `${snapper} snaps at ${at} over something that does not deserve it, hears it happen, and apologises before ${at} has finished being surprised.`,
      `It is not about ${at}. Everybody in the room can tell it is not about ${at}, including ${at}, which is the only reason it does not become a fight.`,
      `${snapper} has been fine for six weeks and is not fine for about ninety seconds. ${p.Sub} ${p.sub === 'they' ? 'go' : 'goes'} outside afterwards and stands there until it passes.`,
      `Somebody asks ${snapper} if ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} alright and gets a much sharper answer than the question deserved.`,
    ], ctx, snapper, at);
    api.addBond(snapper, at, -0.4);
    // A house that watched somebody crack reads them differently afterwards.
    _others(house, snapper).slice(0, 3).forEach(w => api.suspicion(w, snapper, 0.2));
    return {
      text, players: [snapper, at],
      badgeText: 'NOT ABOUT YOU', badgeClass: 'blue',
    };
  },
};

/** The joke that everybody laughed at except the person it was about. */
const theJoke = {
  id: 'friction-joke-lands-wrong',
  category: 'social',
  weight(house, ctx) {
    const cast = _grating(house, ctx);
    return cast ? _w(2.7, ctx) : 0;
  },
  fire(house, ctx, api) {
    const { culprit, annoyed } = _grating(house, ctx);
    const room = _others(house, culprit, annoyed).slice(0, 3);
    const p = pronouns(annoyed);
    const text = _variant([
      `${culprit} does an impression of ${annoyed}. It is good, which is the problem. The room laughs and then works out that ${annoyed} is not laughing, and the laugh dies in stages.`,
      `The joke is about something ${annoyed} said in confidence three weeks ago. ${culprit} does not appear to remember that it was in confidence.`,
      `"${annoyed} cannot take a joke" is said in the room ${annoyed} has just walked out of, which settles the question of whether it was a joke.`,
      `${culprit} keeps going after the first laugh, past the second, into the part where everybody is looking somewhere else.`,
    ], ctx, culprit, annoyed);
    api.addBond(annoyed, culprit, -1.2);
    api.remember(annoyed, culprit, 'made-me-the-joke', 2, { about: 'a joke' });
    api.popDelta(culprit, isVillainous(culprit) ? 0 : -1);
    room.forEach(w => api.addBond(w, annoyed, 0.25));
    return {
      text, players: [culprit, annoyed, ...room].filter(Boolean),
      badgeText: 'NOBODY ELSE LAUGHED', badgeClass: 'red',
    };
  },
};

// ══════════════════════════════════════════════════════════════════════
// AN AFTERNOON THAT COSTS NOTHING
// ══════════════════════════════════════════════════════════════════════

/** The backyard, and two people with nothing to do. */
const theWorkout = {
  id: 'life-workout',
  category: 'house-life',
  weight(house, ctx) {
    const cast = _casualPair(house, ctx);
    if (!cast) return 0;
    return _w(3 + (pStats(cast.a).physical || 5) * 0.12, ctx);
  },
  fire(house, ctx, api) {
    const { a, b } = _casualPair(house, ctx);
    const text = _variant([
      `${a} is out there at nine every morning and by now ${b} is too, mostly because there is nothing else to do and it is somewhere to be.`,
      `${a} counts ${b}'s reps out loud and ${b} does four more than ${p2(b)} meant to, which is the entire point of having somebody count.`,
      `They talk about nothing for forty minutes — training, injuries, a dog one of them used to have — and it is the least strategic conversation either of them has had all week.`,
      `${b} cannot do the thing ${a} is doing. ${a} shows ${b} how, badly, and they both end up laughing on the grass.`,
    ], ctx, a, b);
    api.addBond(a, b, 1.1);
    return {
      text, players: [a, b],
      badgeText: 'THE BACKYARD', badgeClass: 'blue',
    };
  },
};

function p2(name) { const p = pronouns(name); return p.sub; }

/** Somebody cooks for the house, and it is a position rather than a chore. */
const theCook = {
  id: 'life-cooks-for-everybody',
  category: 'house-life',
  weight(house, ctx) {
    const pool = _live(house);
    return pool.length >= 5 ? _w(3.1, ctx) : 0;
  },
  fire(house, ctx, api) {
    const pool = _live(house);
    // Somebody warm enough to feed people and patient enough to do it twice.
    const cook = pool.slice().sort((a, b) =>
      ((pStats(b).social || 5) + (pStats(b).temperament || 5))
      - ((pStats(a).social || 5) + (pStats(a).temperament || 5)))[0];
    const fed = _others(house, cook).slice(0, 4);
    const text = _variant([
      `${cook} cooks for the whole house without being asked and without making it a favour, which is a much harder thing to do than the cooking.`,
      `There is a proper dinner tonight because ${cook} decided there would be. Twelve people sit down at the same time for the first time in a week.`,
      `${cook} has quietly become the person who feeds everybody. Nobody voted on it. It is the most reliable social position in the house and ${cook} may not have noticed holding it.`,
      `${cook} makes something out of almost nothing and the house is briefly, genuinely happy about it. ${fed[0]} says so out loud, which nobody usually bothers to do.`,
    ], ctx, cook);
    fed.forEach(n => api.addBond(cook, n, 0.5));
    api.popDelta(cook, 1);
    return {
      text, players: [cook, ...fed].filter(Boolean),
      badgeText: 'FED THE HOUSE', badgeClass: 'blue',
    };
  },
};

/** Cards, pool, and a game somebody invented on day nine. */
const theGame = {
  id: 'life-invented-game',
  category: 'house-life',
  weight(house, ctx) {
    return _live(house).length >= 4 ? _w(3.3, ctx) : 0;
  },
  fire(house, ctx, api) {
    const pool = _live(house);
    const players4 = pool.slice(0, 4);
    const text = _variant([
      `Somebody invents a game. It has eleven rules, four of which were made up to settle an argument, and by evening the whole house is playing it and taking it far too seriously.`,
      `The card game has a running score now. It is on the wall. ${players4[0]} is winning and will not stop mentioning it.`,
      `Pool, badly, for two hours. ${players4[1]} is inexplicably brilliant at it and nobody can work out why that is annoying.`,
      `They are playing the game again. Nobody remembers who invented it. ${players4[0]} and ${players4[2] || players4[1]} have a genuine argument about a rule that does not exist.`,
    ], ctx, ...players4);
    for (const a of players4) {
      for (const b of players4) if (a < b) api.addBond(a, b, 0.45);
    }
    return {
      text, players: players4,
      badgeText: 'SOMETHING TO DO', badgeClass: 'blue',
    };
  },
};

/** Three in the morning, and somebody says a true thing about their life. */
const theRealConversation = {
  id: 'life-real-conversation',
  category: 'social',
  weight(house, ctx) {
    const cast = _casualPair(house, ctx);
    return cast ? _w(3.4, ctx) : 0;
  },
  fire(house, ctx, api) {
    const { a, b } = _casualPair(house, ctx);
    const text = _variant([
      `${a} and ${b} end up in the kitchen at three in the morning talking about ${a}'s father, and not one word of it is about this game.`,
      `It starts as small talk and stops being small talk. By the end of it ${b} knows something about ${a} that nobody in this house knows, and ${b} did not ask for it.`,
      `${a} says the thing out loud for the first time in years. ${b} does not do anything clever with it — just listens, and says the right small thing at the end.`,
      `Neither of them mentions the game once, which after five weeks in this house is close to a holiday.`,
    ], ctx, a, b);
    api.addBond(a, b, 1.6);
    api.remember(b, a, 'told-me-something-real', 3, { about: 'a late night' });
    return {
      text, players: [a, b],
      badgeText: 'NOTHING TO DO WITH THE GAME', badgeClass: 'blue',
    };
  },
};

/** Hair, nails, and an hour of somebody's undivided attention. */
const theGrooming = {
  id: 'life-grooming',
  category: 'house-life',
  weight(house, ctx) {
    const cast = _casualPair(house, ctx);
    return cast ? _w(2.9, ctx) : 0;
  },
  fire(house, ctx, api) {
    const { a, b } = _casualPair(house, ctx);
    const text = _variant([
      `${b} braids ${a}'s hair on the sofa for an hour and a half. It is the longest anybody has sat still all week and they talk the entire time.`,
      `${a} cuts ${b}'s hair with the house clippers. It goes about as well as that always goes, and ${b} decides to find it funny.`,
      `Nails, on the bathroom floor, with the worst light in the building. Two people who would not otherwise have spent an hour together spend one.`,
      `${b} shaves ${a}'s head on a dare and then has to sit with what ${b} has done. The house is delighted. ${a} is quieter about it.`,
    ], ctx, a, b);
    api.addBond(a, b, 0.9);
    return {
      text, players: [a, b],
      badgeText: 'AN HOUR OF ATTENTION', badgeClass: 'blue',
    };
  },
};

/** Home, and the fact that none of them can go there. */
const theHomeTalk = {
  id: 'life-talking-about-home',
  category: 'social',
  weight(house, ctx) {
    const cast = _casualPair(house, ctx);
    const week = Number(ctx?.week?.num) || 1;
    return cast ? _w(2.5 + week * 0.15, ctx) : 0;
  },
  fire(house, ctx, api) {
    const { a, b } = _casualPair(house, ctx);
    const room = _others(house, a, b).slice(0, 2);
    const text = _variant([
      `Somebody starts describing their kitchen at home. Within ten minutes four people are doing it, in detail, and the room has gone quiet and warm and slightly unbearable.`,
      `${a} works out what day it is at home and what everybody there would be doing. ${b} says please stop, and does not mean it.`,
      `They talk about food they miss for half an hour. It is the single most emotional conversation of the week and it is about a sandwich.`,
      `${a} has missed something — a birthday, a wedding, a first day. ${b} does not try to fix it, which is the correct thing to do and rarer than it sounds.`,
    ], ctx, a, b);
    api.addBond(a, b, 1);
    room.forEach(n => api.addBond(a, n, 0.3));
    return {
      text, players: [a, b, ...room].filter(Boolean),
      badgeText: 'NONE OF THEM CAN GO HOME', badgeClass: 'blue',
    };
  },
};

/** Boredom, which is the real condition of the house. */
const theBoredom = {
  id: 'life-boredom',
  category: 'house-life',
  weight(house, ctx) {
    const week = Number(ctx?.week?.num) || 1;
    return _live(house).length >= 4 ? _w(2.2 + week * 0.2, ctx) : 0;
  },
  fire(house, ctx, api) {
    const pool = _live(house);
    const [a, b] = pool;
    const text = _variant([
      `Nothing happens for an entire day. They lie in the sun and talk about absolutely nothing and it is the best day any of them have had in a fortnight.`,
      `${a} counts the tiles in the bathroom and reports the number to ${b}, who checks it, and then they argue about the method.`,
      `The house has run out of things to say to each other and has reached the stage of reading the labels on everything in the storage room out loud.`,
      `${a} sleeps for fourteen hours. Nobody wakes ${a}, because there is nothing to wake ${a} for.`,
    ], ctx, a, b);
    api.addBond(a, b, 0.3);
    return {
      text, players: [a, b].filter(Boolean),
      badgeText: 'A DAY WITH NOTHING IN IT', badgeClass: 'grey',
    };
  },
};

/** An inside joke, which is how a house decides who is in it. */
const theInsideJoke = {
  id: 'life-inside-joke',
  category: 'house-life',
  weight(house, ctx) {
    const week = Number(ctx?.week?.num) || 1;
    return week >= 2 && _live(house).length >= 5 ? _w(2.8, ctx) : 0;
  },
  fire(house, ctx, api) {
    const pool = _live(house);
    const inOnIt = pool.slice(0, 3);
    const outside = _others(house, ...inOnIt)[0];
    const text = _variant([
      `Something stupid happens at breakfast and by evening it is a whole language. ${inOnIt[0]} only has to say the word and ${inOnIt[1]} is gone.`,
      `The joke is a week old now and has stopped being explainable. ${outside || 'Somebody'} asks what is so funny and gets "you had to be there", which is true and is also a door closing.`,
      `${inOnIt[2]} says it at exactly the wrong moment, during something serious, and three people have to leave the room.`,
      `Nobody can remember what the joke originally was. It survives anyway, which is more than most alliances in this house manage.`,
    ], ctx, ...inOnIt);
    for (const a of inOnIt) for (const b of inOnIt) if (a < b) api.addBond(a, b, 0.6);
    // A joke you are not in is a small, real exclusion.
    if (outside) api.addBond(outside, inOnIt[0], -0.3);
    return {
      text, players: [...inOnIt, outside].filter(Boolean),
      badgeText: 'YOU HAD TO BE THERE', badgeClass: 'blue',
    };
  },
};

export const FRICTION_EVENTS = [
  // falling out over nothing
  theDishes, theFood, theNoise, condescension, theSpace, theStory, theSnap, theJoke,
  // an afternoon that costs nothing
  theWorkout, theCook, theGame, theRealConversation, theGrooming, theHomeTalk,
  theBoredom, theInsideJoke,
];
