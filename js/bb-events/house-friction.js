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
import { gs } from '../core.js';
import {
  pStats, bond, band, closestTo, furthestFrom, dislikes, trusts,
  sharesAlliance, resentmentOf, grudge, isVillainous, isNice, spotlightOrder,
} from './_read.js';
import { makeScene } from '../bb/script/scene.js';
import { passMemo } from '../bb/pass-memo.js';

/** Which room a scene happens in: by hash, never a die. */
function _room(rooms, ctx, ...people) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${people.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return rooms[hash % rooms.length];
}

// Head-counts in prose follow the house. "Eleven other people" was written for
// a house of twelve and printed over sixteen.
const _WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen', 'twenty'];
const _countWord = n => _WORDS[n] || String(n);
const _capWord = w => w.charAt(0).toUpperCase() + w.slice(1);

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
// remembered for one scoring pass (bb/pass-memo.js): it does not read ctx
let _gratingMemo = null;
function _grating(house, ctx) {
  return (_gratingMemo ||= passMemo(_gratingRaw, h => h.filter(Boolean).join('\u0001'), v => (v ? { ...v } : v)))(house);
}
function _gratingRaw(house) {
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

/**
 * How a kitchen row ends, decided before anybody says a word (spec §4.2).
 *
 * A short fuse and a bad history blow it up; somebody kind standing nearby,
 * who likes the one who is angry, can talk it down; otherwise it stays small
 * and gets remembered. Proportional to the stats, not thresholds: a calm
 * houseguest CAN blow up, just rarely.
 */
function _kitchenEnding(house, annoyed, culprit, rng) {
  // Measured on a 2x8-week read: at 0.06/0.04/0.015 two of every three kitchen rows were
  // shouting matches. A blow-up should be the row people talk about, not the usual one.
  const fuse = (10 - (pStats(annoyed).temperament || 5)) * 0.018
    + Math.max(0, -bond(annoyed, culprit)) * 0.015
    + (pStats(annoyed).boldness || 5) * 0.006;
  const smoother = _others(house, culprit, annoyed)
    .filter(n => isNice(n) && bond(n, annoyed) > 0)
    .sort((x, y) => (pStats(y).social || 5) - (pStats(x).social || 5))[0] || null;
  // Measured over 4x8 weeks at 0.15 + social*0.035: smoothed as often as sniped. Somebody
  // stepping in is the nice surprise, not the default.
  const calm = smoother ? 0.06 + (pStats(smoother).social || 5) * 0.02 : 0;
  const r = rng();
  if (r < fuse) return { ending: 'blowup', smoother: null };
  if (smoother && r < fuse + calm) return { ending: 'smoothed', smoother };
  return { ending: 'snipe', smoother: null };
}

/**
 * Two people who already had a kitchen row this week. The pair the house
 * grates on most is the same pair all week, so without this one pair had the
 * dishes AND the food AND the dishes again by Thursday, and in dialogue that
 * reads as a loop, not a feud.
 */
function _rowedThisWeek(cast, ctx) {
  const week = ctx?.week?.num || 0;
  const hist = gs.bb?.house?.eventHistory || [];
  return hist.some(h => h.week === week && KITCHEN_ROWS.has(h.eventId)
    && (h.players || []).includes(cast.culprit) && (h.players || []).includes(cast.annoyed));
}
const KITCHEN_ROWS = new Set(['friction-dishes', 'friction-food']);

/** These two have done this before, in an earlier week: a line may say "again". */
function _rowedBefore(a, b, ctx) {
  const week = ctx?.week?.num || 0;
  return (gs.bb?.house?.eventHistory || []).some(h => h.week < week && KITCHEN_ROWS.has(h.eventId)
    && (h.players || []).includes(a) && (h.players || []).includes(b));
}

/** Who else is in the kitchen: they see it, so they know it. */
const _kitchenCrowd = (house, ...ex) => _others(house, ...ex).slice(0, 2);

/** The dishes. It is always, in the end, the dishes. */
const theDishes = {
  id: 'friction-dishes',
  category: 'house-life',
  weight(house, ctx) {
    const cast = _grating(house, ctx);
    return cast ? _w(3.2 + cast.heat * 0.5, ctx) * (_rowedThisWeek(cast, ctx) ? 0.05 : 1) : 0;
  },
  fire(house, ctx, api, rng = Math.random) {
    const { culprit, annoyed } = _grating(house, ctx);
    const { ending, smoother } = _kitchenEnding(house, annoyed, culprit, rng);
    const crowd = _kitchenCrowd(house, culprit, annoyed, smoother);
    if (ending === 'blowup') {
      api.addBond(annoyed, culprit, -1.6);
      api.remember(annoyed, culprit, 'never-cleans-up', 3, { about: 'the kitchen' });
      // A row in front of people: the room notices who started shouting.
      api.popDelta(annoyed, -0.5);
      crowd.forEach(w => api.addBond(w, annoyed, 0.15));
    } else if (ending === 'smoothed') {
      api.addBond(annoyed, culprit, -0.4);
      api.addBond(smoother, annoyed, 0.6);
      api.addBond(smoother, culprit, 0.4);
      api.popDelta(smoother, 1);
    } else {
      api.addBond(annoyed, culprit, -0.9);
      api.remember(annoyed, culprit, 'never-cleans-up', 2, { about: 'the kitchen' });
      // The room takes a side, and it is rarely the messy one.
      crowd.forEach(w => api.addBond(w, annoyed, 0.2));
    }
    const scene = makeScene('friction.dishes', { a: annoyed, b: culprit, c: smoother }, { ending, again: _rowedBefore(annoyed, culprit, ctx) }, crowd, 'kitchen');
    return {
      scene, players: scene.seenBy.slice(0, 4),
      badgeText: ending === 'blowup' ? 'THE DISHES, LOUDLY' : 'THE DISHES', badgeClass: 'grey',
    };
  },
};

/** Somebody ate it. There is never enough and everybody is counting. */
const theFood = {
  id: 'friction-food',
  category: 'house-life',
  weight(house, ctx) {
    const cast = _grating(house, ctx);
    return cast ? _w(3.4 + cast.heat * 0.4, ctx) * (_rowedThisWeek(cast, ctx) ? 0.05 : 1) : 0;
  },
  fire(house, ctx, api, rng = Math.random) {
    const { culprit, annoyed } = _grating(house, ctx);
    const { ending, smoother } = _kitchenEnding(house, annoyed, culprit, rng);
    const crowd = _kitchenCrowd(house, culprit, annoyed, smoother);
    if (ending === 'blowup') {
      api.addBond(annoyed, culprit, -1.4);
      api.remember(annoyed, culprit, 'ate-my-food', 2, { about: 'the kitchen' });
      api.popDelta(culprit, -1.5);
    } else if (ending === 'smoothed') {
      api.addBond(annoyed, culprit, -0.3);
      api.addBond(smoother, annoyed, 0.6);
      api.popDelta(smoother, 1);
    } else {
      api.addBond(annoyed, culprit, -0.8);
      api.popDelta(culprit, -1);
    }
    const scene = makeScene('friction.food', { a: annoyed, b: culprit, c: smoother }, { ending, again: _rowedBefore(annoyed, culprit, ctx) }, crowd, 'kitchen');
    return {
      scene, players: scene.seenBy.slice(0, 4),
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
    api.addBond(annoyed, culprit, -0.7);
    api.remember(annoyed, culprit, 'kept-me-awake', 1, { about: 'the bedroom' });
    const scene = makeScene('friction.noise', { a: annoyed, b: culprit }, { ending: 'scene' }, [], 'bedroom');
    return {
      scene, players: [annoyed, culprit],
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
    const witness = _others(house, culprit, annoyed)[0];
    api.addBond(annoyed, culprit, -1.1);
    api.remember(annoyed, culprit, 'talks-down-to-me', 2, { about: 'being spoken to' });
    if (witness) api.addBond(annoyed, witness, 0.3);
    const scene = makeScene('friction.condescend', { a: annoyed, b: culprit, c: witness || null }, { ending: 'scene' }, [], _room(['kitchen', 'living-room'], ctx, annoyed, culprit));
    return {
      scene, players: [annoyed, culprit, witness].filter(Boolean),
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
    api.addBond(annoyed, culprit, -0.6);
    const scene = makeScene('friction.space', { a: annoyed, b: culprit }, { ending: 'scene' }, [], _room(['bedroom', 'living-room'], ctx, annoyed, culprit));
    return {
      scene, players: [annoyed, culprit],
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
    api.popDelta(teller, -1);
    tired.forEach(n => api.addBond(n, tired.find(m => m !== n) || n, 0.3));
    const scene = makeScene('friction.story', { a: teller, b: tired[0] || null, c: tired[1] || null }, { ending: 'scene' }, [], _room(['kitchen', 'living-room'], ctx, teller));
    return {
      scene, players: [teller, ...tired].filter(Boolean),
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
    api.addBond(snapper, at, -0.4);
    // A house that watched somebody crack reads them differently afterwards.
    _others(house, snapper).slice(0, 3).forEach(w => api.suspicion(w, snapper, 0.2));
    const scene = makeScene('friction.snap', { a: snapper, b: at }, { ending: 'scene' }, [], _room(['kitchen', 'living-room', 'bedroom'], ctx, snapper));
    return {
      scene, players: [snapper, at],
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
    api.addBond(annoyed, culprit, -1.2);
    api.remember(annoyed, culprit, 'made-me-the-joke', 2, { about: 'a joke' });
    api.popDelta(culprit, isVillainous(culprit) ? 0 : -1);
    room.forEach(w => api.addBond(w, annoyed, 0.25));
    const scene = makeScene('friction.joke', { a: culprit, b: annoyed }, { ending: 'scene' }, room, _room(['kitchen', 'living-room'], ctx, culprit));
    return {
      scene, players: [culprit, annoyed, ...room].filter(Boolean),
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
    api.addBond(a, b, 1.1);
    const scene = makeScene('life.workout', { a, b }, { ending: 'scene' }, [], 'backyard');
    return {
      scene, players: [a, b],
      badgeText: 'THE BACKYARD', badgeClass: 'blue',
    };
  },
};


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
    fed.forEach(n => api.addBond(cook, n, 0.5));
    api.popDelta(cook, 1);
    const scene = makeScene('life.cook', { a: cook, b: fed[0] || null }, { ending: 'scene' }, fed, 'kitchen');
    return {
      scene, players: [cook, ...fed].filter(Boolean),
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
    for (const a of players4) {
      for (const b of players4) if (a < b) api.addBond(a, b, 0.45);
    }
    const scene = makeScene('life.game', { a: players4[0], b: players4[1], c: players4[2] || null }, { ending: 'scene' }, players4, _room(['living-room', 'backyard', 'kitchen'], ctx, ...players4));
    return {
      scene, players: players4,
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
    api.addBond(a, b, 1.6);
    api.remember(b, a, 'told-me-something-real', 3, { about: 'a late night' });
    const scene = makeScene('life.real', { a, b }, { ending: 'scene' }, [], _room(['kitchen', 'backyard', 'bedroom'], ctx, a, b));
    return {
      scene, players: [a, b],
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
    api.addBond(a, b, 0.9);
    const scene = makeScene('life.grooming', { a, b }, { ending: 'scene' }, [], _room(['living-room', 'bedroom'], ctx, a, b));
    return {
      scene, players: [a, b],
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
    api.addBond(a, b, 1);
    room.forEach(n => api.addBond(a, n, 0.3));
    const scene = makeScene('life.home-talk', { a, b }, { ending: 'scene' }, room, _room(['backyard', 'kitchen', 'living-room'], ctx, a, b));
    return {
      scene, players: [a, b, ...room].filter(Boolean),
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
    api.addBond(a, b, 0.3);
    const scene = makeScene('life.boredom', { a, b }, { ending: 'scene' }, [], _room(['backyard', 'living-room'], ctx, a, b));
    return {
      scene, players: [a, b].filter(Boolean),
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
    for (const a of inOnIt) for (const b of inOnIt) if (a < b) api.addBond(a, b, 0.6);
    // A joke you are not in is a small, real exclusion.
    if (outside) api.addBond(outside, inOnIt[0], -0.3);
    const scene = makeScene('life.inside-joke', { a: inOnIt[0], b: inOnIt[1], c: inOnIt[2] || null }, { ending: 'scene' }, inOnIt, _room(['kitchen', 'living-room'], ctx, ...inOnIt));
    return {
      scene, players: [...inOnIt, outside].filter(Boolean),
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
