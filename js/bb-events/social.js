// ══════════════════════════════════════════════════════════════════════
// bb-events/social.js — the house between the ceremonies
// ══════════════════════════════════════════════════════════════════════
//
// Big Brother is a social game first, and this is the file that makes that true
// in the simulation rather than only in the description.
//
// It is also load-bearing for everything else. Measuring the ceremonies library
// across forty seasons showed bonds barely move in a Big Brother house — the
// engine only nudges them during campaigning, by ±0.35 — so a genuine blindside
// fired under once a season and a veto save almost never. Ceremonies READ
// relationships; almost nothing WROTE them. These events write them: alliances
// form, people trust each other at 3am, someone spirals, a rumour lands, a
// grudge hardens into a target.
//
// Conventions are the same as ceremonies.js: proportional weights, no
// thresholds; state changed only through `api`; text chosen deterministically so
// a seeded season replays identically.

import { pronouns } from '../players.js';
import {
  pStats, bond, perceived, hidden, band, bondFactor, closestTo, furthestFrom,
  trusts, dislikes, sharesAlliance, alliancesOf, grudge, remembers, memoriesOf, worstMemory,
  suspicionOf, targetOf, isHunting, threat, biggestThreat, couldRomance,
  showmanceOf, willScheme, isNice, isVillainous, archetype, beatsInvolving, spotlightOrder,
} from './_read.js';
import { makeScene } from '../bb/script/scene.js';

// ── helpers ───────────────────────────────────────────────────────────

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list.length ? list[hash % list.length] : undefined;
}

// A deterministic but well-spread pick from a pool, so the same two people are
// not the subject of every beat in a season.
function _choose(pool, ctx, ...salt) {
  if (!pool.length) return null;
  return _variant(pool, ctx, ...salt);
}

/**
 * How much room this act has for house life.
 *
 * The scheduler picks its beats from every eligible event, so without this the
 * social library simply outnumbers the ceremonies library and buries it: a first
 * measurement had nomination beats fall from 230 to 29 once social events
 * existed, which is the signature moment of the week losing to small talk.
 *
 * Ceremonies own their own acts. House life fills everything around them — which
 * is what "the house between the ceremonies" was always supposed to mean.
 */
function _actFit(ctx) {
  switch (ctx?.act) {
    case 'eviction': return 0.25;      // the exit speech owns eviction night
    case 'nominations':
    case 'veto-ceremony': return 0.22;   // the ceremony is the story here
    case 'campaign': return 0.75;        // shares the act with campaign beats
    default: return 1;                   // hoh, veto — the downtime
  }
}

/** Weight helper: proportional, act-aware, and clamped so nothing dominates. */
const _w = (value, ctx) => band(value * _actFit(ctx));

/** Everyone still in the house and not currently the centre of this act. */
const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));

/**
 * Which room a scene happens in: by hash, so it never draws a die. `people`
 * are the ones in it; the HOH room needs the HOH (house-events _roomAllows —
 * a scene's own room skips that rule, so it is applied here).
 */
function _room(rooms, ctx, ...people) {
  const ok = rooms.filter(r => r !== 'hoh-room' || (ctx?.hoh && people.includes(ctx.hoh)));
  const pool = ok.length ? ok : ['backyard'];
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${people.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

/** Prefer people who have not already carried a beat, so the spotlight moves. */
/** Least-seen first, weighted toward whoever this week is about. */
const _leastSeen = pool => spotlightOrder(pool);

// ── casting ───────────────────────────────────────────────────────────
//
// Each of these answers "who would this happen to, if it happened?" and is used
// by BOTH weight() and fire(). Keeping one answer is not tidiness: when the two
// disagreed, fire() fell through to a filler beat with an empty badgeClass, and
// the scheduler rejects that by throwing — taking the entire season with it.
// An event with nobody to happen to now simply weighs nothing.

function _alliancePair(house, ctx) {
  const pool = _leastSeen(_others(house));
  const a = _choose(pool.slice(0, Math.max(2, Math.ceil(pool.length / 2))), ctx, 'a');
  if (!a) return null;
  const b = _others(house, a).filter(n => !sharesAlliance(a, n) && bond(a, n) > -2)
    .sort((x, y) => bond(a, y) - bond(a, x))[0];
  return b ? { a, b } : null;
}

function _infoTrio(house, ctx) {
  const talkers = _leastSeen(house.filter(n => pStats(n).social >= 5));
  const a = _choose(talkers, ctx, 'info');
  if (!a) return null;
  const b = closestTo(a, _others(house, a));
  if (!b) return null;
  const subject = biggestThreat(_others(house, a, b)) || _others(house, a, b)[0];
  return subject ? { a, b, subject } : null;
}

function _rumourTrio(house, ctx) {
  const schemers = _leastSeen(house.filter(willScheme));
  const liar = _choose(schemers, ctx, 'rumour');
  if (!liar) return null;
  const mark = _others(house, liar).sort((x, y) => bond(liar, x) - bond(liar, y))[0];
  if (!mark) return null;
  const victim = closestTo(mark, _others(house, liar, mark));
  return victim ? { liar, mark, victim } : null;
}

function _romancePair(house, ctx) {
  for (const x of _leastSeen(house)) {
    const match = _others(house, x).find(y => couldRomance(x, y) && bond(x, y) >= 0);
    if (match) return { a: x, b: match };
  }
  return null;
}

// ── alliances and trust ───────────────────────────────────────────────

const allianceForms = {
  id: 'social-alliance-forms',
  category: 'social',
  weight(house, ctx) {
    if (house.length < 5 || !_alliancePair(house, ctx)) return 0;
    // Early houses form alliances; late houses have already picked sides.
    const early = house.length >= 8 ? 1.3 : 0.6;
    return _w(9 * early, ctx);
  },
  fire(house, ctx, api) {
    const { a, b } = _alliancePair(house, ctx);
    const strategic = (pStats(a).strategic + pStats(b).strategic) / 2;

    // A real alliance is worth real bond, scaled by how strategic the pair are.
    api.addBond(a, b, 1.4 + (strategic / 10));
    api.remember(a, b, 'alliance', 2, { formed: ctx.week?.num || 0 });
    api.remember(b, a, 'alliance', 2, { formed: ctx.week?.num || 0 });
    const scene = makeScene('social.alliance', { a, b }, { ending: 'formed' }, [], _room(['bedroom', 'backyard', 'hoh-room'], ctx, a, b));
    return { scene, players: [a, b], badgeText: 'DEAL STRUCK', badgeClass: 'green' };
  },
};

const lateNightTrust = {
  id: 'social-late-night-trust',
  category: 'social',
  weight(house, ctx) {
    // Needs somebody who already has someone. Deepening beats forming.
    const pairs = house.filter(n => house.some(m => m !== n && bond(n, m) >= 2));
    return pairs.length ? _w(3 + pairs.length * 1.1, ctx) : 0;
  },
  fire(house, ctx, api) {
    const pool = _leastSeen(house.filter(n => house.some(m => m !== n && bond(n, m) >= 2)));
    const a = _choose(pool, ctx, 'trust') || pool[0];
    const b = closestTo(a, _others(house, a));
    const secret = pStats(a).loyalty >= 6;
    api.addBond(a, b, secret ? 1.8 : 1.1);
    api.remember(a, b, 'confidence', secret ? 2 : 1, {});
    if (secret) api.remember(b, a, 'confidence', 2, {});
    const scene = makeScene('social.trust', { a, b }, { ending: secret ? 'deep' : 'warm' }, [], _room(['kitchen', 'backyard', 'bedroom'], ctx, a, b));
    return { scene, players: [a, b], badgeText: 'TRUST BUILT', badgeClass: 'green' };
  },
};

// ── conflict ──────────────────────────────────────────────────────────

const blowUp = {
  id: 'social-blow-up',
  category: 'social',
  weight(house, ctx) {
    // Needs real friction: someone who dislikes someone, or a hot temper.
    const friction = house.filter(n => house.some(m => m !== n && bond(n, m) <= -2));
    const tempers = house.filter(n => pStats(n).temperament <= 4);
    if (!friction.length && !tempers.length) return 0;
    return _w(friction.length * 2.2 + tempers.length * 0.9, ctx);
  },
  fire(house, ctx, api) {
    const hot = _leastSeen(house.filter(n => pStats(n).temperament <= 5)
      .concat(house.filter(n => house.some(m => bond(n, m) <= -2))));
    const a = _choose(hot, ctx, 'blow') || house[0];
    const b = furthestFrom(a, _others(house, a));
    const pub = _others(house, a, b);
    const aStats = pStats(a);
    const aType = archetype(a);
    const volatile = aStats.temperament <= 3 || ['hothead', 'chaos-agent', 'villain'].includes(aType);
    const calculated = aStats.strategic >= 7 && aStats.temperament >= 4;
    api.addBond(a, b, -2.6);
    api.setTarget(a, b, 'screamed at me in front of the whole house');
    api.setTarget(b, a, 'started it');
    api.remember(a, b, 'humiliation', 2, {});
    api.remember(b, a, 'humiliation', 2, {});
    // A blow-up is public by definition — everyone forms a view.
    api.popDelta(a, -1);
    pub.forEach(watcher => {
      api.suspicion(watcher, a, 0.5);
      api.suspicion(watcher, b, 0.3);
      // People take sides according to who they already liked.
      if (bond(watcher, a) > bond(watcher, b)) api.addBond(watcher, b, -0.4);
      else if (bond(watcher, b) > bond(watcher, a)) api.addBond(watcher, a, -0.4);
    });
    // Public by definition: the whole house is in the room for it.
    const scene = makeScene('talk.confront', { a, b }, { ending: volatile ? 'volatile' : calculated ? 'calculated' : 'general' }, pub,
      ['kitchen', 'living-room', 'backyard'][(a.length + b.length + (ctx?.week?.num || 0)) % 3]);
    return { scene, players: [a, b], badgeText: 'BLOW-UP', badgeClass: 'red' };
  },
};

const paranoiaSpiral = {
  id: 'social-paranoia',
  category: 'social',
  weight(house, ctx) {
    // The anxious and the perceptive spiral; the placid do not.
    const prone = house.filter(n => pStats(n).temperament <= 5 || suspicionOf(n, targetOf(n) || '') > 2);
    return prone.length ? _w(prone.length * 1.6, ctx) : 0;
  },
  fire(house, ctx, api) {
    const prone = _leastSeen(house.filter(n => pStats(n).temperament <= 6));
    const a = _choose(prone, ctx, 'para') || house[0];
    // Paranoia lands hardest on someone you actually trusted. That is the point.
    const victim = closestTo(a, _others(house, a));
    const wrong = bond(a, victim) >= 3;   // they were, in fact, loyal
    api.suspicion(a, victim, 2.2);
    api.addBond(a, victim, -0.9);
    api.remember(a, victim, 'suspicion', wrong ? 1 : 2, { founded: !wrong });
    const scene = makeScene('social.paranoia', { a, b: victim }, { ending: wrong ? 'wrong' : 'founded' }, [], _room(['bedroom', 'kitchen', 'backyard'], ctx, a, victim));
    return {
      scene, players: [a, victim],
      badgeText: wrong ? 'PARANOIA' : 'SUSPICION', badgeClass: wrong ? 'grey' : 'red',
    };
  },
};

// ── information ───────────────────────────────────────────────────────

const infoTrade = {
  id: 'social-info-trade',
  category: 'social',
  weight(house, ctx) {
    // The talker count is a cheap scan and rules the event out on its own;
    // _infoTrio behind it walks the house three times over doing closeness and
    // threat lookups. Asking in that order cost 5.9ms per beat — the single
    // most expensive weight() in the library.
    const talkers = house.filter(n => pStats(n).social >= 5);
    if (talkers.length < 2) return 0;
    if (!_infoTrio(house, ctx)) return 0;
    return _w(talkers.length * 1.4, ctx);
  },
  fire(house, ctx, api) {
    // The intel is about whoever is currently the biggest threat in the room.
    const { a, b, subject } = _infoTrio(house, ctx);

    api.addBond(a, b, 0.8);
    api.suspicion(b, subject, 1.4);
    api.remember(b, a, 'confidence', 1, { about: subject });
    // The subject is talked ABOUT: on the card, not in the room.
    const scene = makeScene('talk.gossip', { a, b, c: subject }, { ending: 'traded' }, [],
      ['pantry', 'bedroom', 'backyard'][(a.length + subject.length + (ctx?.week?.num || 0)) % 3]);
    scene.seenBy = [a, b];
    return { scene, players: [a, b, subject], badgeText: 'INTEL TRADED', badgeClass: 'blue' };
  },
};


const rumour = {
  id: 'social-rumour',
  category: 'social',
  weight(house, ctx) {
    // Only players the franchise rules allow to scheme may plant one.
    const schemers = house.filter(willScheme);
    if (!_rumourTrio(house, ctx)) return 0;
    return schemers.length ? _w(schemers.length * 2.4, ctx) : 0;
  },
  fire(house, ctx, api) {
    // Aim at a pair who are close — a rumour is worth most where it breaks something.
    const { liar, mark, victim } = _rumourTrio(house, ctx);

    const skilled = pStats(liar).social / 10;
    const sharp = pStats(mark).intuition / 10;
    // Does it land? Persuasion against perception — proportional, not a coin flip.
    const lands = skilled * (1 - sharp * 0.8) > 0.28;
    if (lands) {
      api.addBond(mark, victim, -1.6);
      api.suspicion(mark, victim, 2.0);
      api.addBond(liar, mark, 0.5);
      api.remember(mark, victim, 'suspicion', 2, { planted: true });
    } else {
      api.suspicion(mark, liar, 2.4);
      api.addBond(mark, liar, -1.2);
      api.remember(mark, liar, 'deceit', 2, { caught: true });
    }
    // The victim is talked ABOUT; only the two of them are in the room.
    const scene = makeScene('social.rumour', { a: liar, b: mark, c: victim }, { ending: lands ? 'lands' : 'caught' }, [],
      _room(['pantry', 'bedroom', 'backyard'], ctx, liar, mark));
    scene.seenBy = [liar, mark];
    return {
      scene, players: [liar, mark, victim],
      badgeText: lands ? 'RUMOUR LANDS' : 'RUMOUR CAUGHT',
      badgeClass: lands ? 'red' : 'gold',
    };
  },
};

// ── romance ───────────────────────────────────────────────────────────

const showmanceSpark = {
  id: 'social-showmance-spark',
  category: 'social',
  weight(house, ctx) {
    // The api refuses incompatible or capped pairings anyway; do not even try
    // unless a plausible one exists.
    return _romancePair(house, ctx) ? _w(6, ctx) : 0;
  },
  fire(house, ctx, api) {
    const { a, b } = _romancePair(house, ctx);

    const started = api.showmance(a, b, { context: 'the Big Brother house', intensity: 0.35, bondDelta: 1.2 });
    if (!started) api.addBond(a, b, 0.8);
    // A showmance is a target on two backs at once.
    _others(house, a, b).forEach(watcher => {
      if (pStats(watcher).intuition >= 5) api.suspicion(watcher, a, 0.7);
    });
    // Not a showmance. This writes a spark, and a spark still has to survive the
    // week and mature before anybody makes a move — calling it a showmance here
    // promised a couple the game had not created yet.
    const scene = makeScene('social.spark', { a, b }, { ending: started ? 'spark' : 'something' }, [], _room(['backyard', 'kitchen', 'living-room'], ctx, a, b));
    return { scene, players: [a, b], badgeText: started ? 'A SPARK' : 'SOMETHING THERE', badgeClass: 'gold' };
  },
};

// ── memory turning into intent ────────────────────────────────────────

/** A memory type, as the family of thing that was done: the grudge lines key on it. */
const _GRUDGE_KIND = {
  betrayal: 'betrayal', 'alliance-betrayal': 'betrayal', 'crossed-me': 'betrayal', abandonment: 'betrayal',
  'took-my-ally': 'betrayal', 'went-behind-my-back': 'betrayal',
  'voted-me-out': 'vote', 'voted-me-out-once': 'vote', 'renominated-me': 'vote', 'forced-me-up': 'vote', 'made-me-the-pawn': 'vote',
  'lied-to-my-face': 'lie', deceit: 'lie', 'two-faced': 'lie', 'leaked-information': 'lie',
  'blamed-me-for-a-vote-i-did-not-cast': 'lie', 'wrongly-accused': 'lie',
  humiliation: 'humiliation', humiliated: 'humiliation', 'came-at-me-in-public': 'humiliation', insult: 'humiliation',
  'threatened-me-live': 'humiliation',
  'broke-a-promise': 'promise', 'broken-promise': 'promise', 'broke-a-final-two': 'promise', 'broken-final-two': 'promise',
  'left-me-out': 'left-out', 'decided-without-me': 'left-out',
  'kept-me-awake': 'house', 'never-cleans-up': 'house', 'ate-my-food': 'house',
  'coming-for-me': 'plan', 'planning-the-cut': 'plan', 'overheard-plot': 'plan',
};

const grudgeHardens = {
  id: 'social-grudge-hardens',
  category: 'social',
  weight(house, ctx) {
    // Needs history. This is the event that turns what was done to someone into
    // what they are going to do about it.
    const carrying = house.filter(n => _others(house, n).some(m => grudge(n, m) >= 2 && !isHunting(n, m)));
    return carrying.length ? _w(carrying.length * 2.6, ctx) : 0;
  },
  fire(house, ctx, api) {
    const carrying = _leastSeen(house.filter(n =>
      _others(house, n).some(m => grudge(n, m) >= 2 && !isHunting(n, m))));
    const a = _choose(carrying, ctx, 'grudge') || carrying[0];
    const enemy = _others(house, a).sort((x, y) => grudge(a, y) - grudge(a, x))[0];
    // The thing held AGAINST them. Sorting every memory by strength picked up
    // kindnesses too, and the house heard somebody's grudge was "the told me
    // the truth".
    const worst = worstMemory(a, enemy);
    const kind = worst?.type || null;
    const grievance = ({
      'would-not-let-it-go': 'refusal to let the argument die',
      'apology-refused': 'rejected apology',
      petty: 'constant needling',
      humiliation: 'public humiliation',
      'threatened-me-live': 'threat on eviction night',
      'saw-them-fight': 'last blow-up',
      abandonment: 'disappearance when the vote got difficult',
      betrayal: 'betrayal', 'alliance-betrayal': 'betrayal',
      'lied-to-my-face': 'lie', deceit: 'lie', 'two-faced': 'double game',
      'voted-me-out': 'vote', 'voted-me-out-once': 'vote', 'renominated-me': 'nomination',
      'forced-me-up': 'nomination', 'made-me-the-pawn': 'pawn nomination',
      'broke-a-promise': 'broken promise', 'broken-promise': 'broken promise',
      'broke-a-final-two': 'broken final two', 'broken-final-two': 'broken final two',
      'went-behind-my-back': 'move behind my back', 'took-my-ally': 'move on my ally',
      'came-at-me-in-public': 'public attack', insult: 'insult', humiliated: 'public humiliation',
      'made-me-the-joke': 'joke at my expense', 'talks-down-to-me': 'condescension',
      'left-me-out': 'meeting without me', 'decided-without-me': 'meeting without me',
      'leaked-information': 'leak', 'robbed-me-of-the-veto': 'veto theft',
      'blamed-me-for-a-vote-i-did-not-cast': 'false accusation', 'wrongly-accused': 'false accusation',
      'coming-for-me': 'plan against me', 'planning-the-cut': 'plan against me',
      'overheard-plot': 'plot I overheard', 'crossed-me': 'double-cross', 'cold-war': 'cold war',
      'kept-me-awake': 'nights of noise', 'never-cleans-up': 'mess', 'ate-my-food': 'food-stealing', irritation: 'constant needling',
    })[kind] || null;

    api.setTarget(a, enemy, grievance ? `has not forgiven the ${grievance}` : 'has run out of patience');
    api.suspicion(a, enemy, 1.5);
    api.remember(a, enemy, 'resolve', 2, { about: kind });
    // What the enemy did, as a family the lines can speak to. The enemy is not in the room.
    const scene = makeScene('social.grudge', { a, b: enemy }, { ending: 'hardens', reason: _GRUDGE_KIND[kind] || null }, [],
      _room(['backyard', 'kitchen', 'bedroom'], ctx, a));
    scene.seenBy = [a];
    return { scene, players: [a, enemy], badgeText: 'GRUDGE HARDENS', badgeClass: 'red' };
  },
};

const comfortOnTheBlock = {
  id: 'social-comfort-block',
  category: 'social',
  weight(house, ctx) {
    const noms = (ctx.nominees || []).filter(Boolean);
    if (!noms.length) return 0;
    // Nice archetypes comfort. Villains do not — the franchise rule holds here.
    const kind = house.filter(n => !noms.includes(n) && (isNice(n) || pStats(n).loyalty >= 7));
    return kind.length ? _w(kind.length * 2.0, ctx) : 0;
  },
  fire(house, ctx, api) {
    const noms = (ctx.nominees || []).filter(Boolean);
    const kind = _leastSeen(house.filter(n => !noms.includes(n) && (isNice(n) || pStats(n).loyalty >= 7)));
    const helper = _choose(kind, ctx, 'comfort') || kind[0];
    const nominee = noms.sort((a, b) => bond(helper, b) - bond(helper, a))[0];
    api.addBond(helper, nominee, 1.9);
    api.remember(nominee, helper, 'kindness', 3, { when: 'on the block' });
    api.popDelta(helper, 1);
    const scene = makeScene('talk.comfort', { a: helper, b: nominee }, { ending: 'kind' }, [],
      ['backyard', 'bedroom'][(helper.length + (ctx?.week?.num || 0)) % 2]);
    return { scene, players: [helper, nominee], badgeText: 'KINDNESS', badgeClass: 'green' };
  },
};

const driftingOut = {
  id: 'social-drifting-out',
  category: 'social',
  weight(house, ctx) {
    if (house.length < 6) return 0;
    // Someone with no real bonds at all — the house's floater, noticing.
    const adrift = house.filter(n => !_others(house, n).some(m => bond(n, m) >= 2));
    return adrift.length ? _w(adrift.length * 2.3, ctx) : 0;
  },
  fire(house, ctx, api) {
    const adrift = _leastSeen(house.filter(n => !_others(house, n).some(m => bond(n, m) >= 2)));
    const a = _choose(adrift, ctx, 'drift') || adrift[0];
    const nearest = closestTo(a, _others(house, a));
    // Drifting is not neutral: it is a decision to fix it, aimed at the nearest hand.
    if (nearest) {
      api.addBond(a, nearest, 0.9);
      api.remember(a, nearest, 'reach', 1, {});
    }
    const scene = makeScene('social.adrift', { a, b: nearest || null }, { ending: 'adrift' }, [], _room(['kitchen', 'bedroom'], ctx, a, nearest));
    return { scene, players: [a, nearest].filter(Boolean), badgeText: 'ADRIFT', badgeClass: 'grey' };
  },
};

export const SOCIAL_EVENTS = [
  allianceForms,
  lateNightTrust,
  blowUp,
  paranoiaSpiral,
  infoTrade,
  rumour,
  showmanceSpark,
  grudgeHardens,
  comfortOnTheBlock,
  driftingOut,
];

export default SOCIAL_EVENTS;
