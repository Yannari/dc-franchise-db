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
  trusts, dislikes, sharesAlliance, alliancesOf, grudge, remembers, memoriesOf,
  suspicionOf, targetOf, isHunting, threat, biggestThreat, couldRomance,
  showmanceOf, willScheme, isNice, isVillainous, archetype, beatsInvolving,
} from './_read.js';

// ── helpers ───────────────────────────────────────────────────────────

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
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

/** Prefer people who have not already carried a beat, so the spotlight moves. */
const _leastSeen = (pool) => [...pool].sort((a, b) => beatsInvolving(a) - beatsInvolving(b));

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

    const p = pronouns(a);
    const strategic = (pStats(a).strategic + pStats(b).strategic) / 2;
    const text = _variant([
      `${a} and ${b} end up in the same room at the wrong hour and the conversation turns, the way it always does. Nothing is written down. By the time they separate there is an agreement, and neither of them said the word.`,
      `"I'm not asking you to pick a side," ${a} says, which is exactly what ${p.sub} is asking. ${b} takes long enough to answer that the answer is obvious before it arrives.`,
      `They test each other for twenty minutes — a name floated, a reaction watched, a second name floated — and somewhere in there it stops being a test. ${a} and ${b} have a deal, of the kind this house breaks weekly.`,
      `${b} says "so who do you actually trust in here?" and ${a} gives an honest answer, which in this house is either the smartest or the most expensive thing ${p.sub} could have done.`,
    ], ctx, a, b);

    // A real alliance is worth real bond, scaled by how strategic the pair are.
    api.addBond(a, b, 1.4 + (strategic / 10));
    api.remember(a, b, 'alliance', 2, { formed: ctx.week?.num || 0 });
    api.remember(b, a, 'alliance', 2, { formed: ctx.week?.num || 0 });
    return { text, players: [a, b], badgeText: 'DEAL STRUCK', badgeClass: 'green' };
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
    const p = pronouns(a);
    const secret = pStats(a).loyalty >= 6;
    const text = _variant([
      `The house goes to bed and ${a} and ${b} do not. What gets said at that hour is not strategy exactly — it is the thing underneath strategy, and it is why neither of them will be able to write the other's name down without it costing something.`,
      `${a} tells ${b} something true about ${p.ref}. Not game. True. ${b} understands what has been handed over and puts it somewhere safe.`,
      `Two in the morning, one lamp, and ${a} finally says the name ${p.sub} has been carrying around all week. ${b} does not flinch, and that is the whole conversation.`,
      `They talk about home, which in this house is the most dangerous subject there is, because afterwards you cannot pretend the other person is only a number.`,
    ], ctx, a, b);

    api.addBond(a, b, secret ? 1.8 : 1.1);
    api.remember(a, b, 'confidence', secret ? 2 : 1, {});
    if (secret) api.remember(b, a, 'confidence', 2, {});
    return { text, players: [a, b], badgeText: 'TRUST BUILT', badgeClass: 'green' };
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
    const p = pronouns(a);
    const pub = _others(house, a, b);
    const text = _variant([
      `It starts over dishes and it is not about dishes. ${a} and ${b} say things in front of everyone that neither can walk back, and the house rearranges itself around the wreckage before either of them stops talking.`,
      `"Say it again." ${b} says it again. ${a} is across the room before ${p.sub} decides to be, and three people are already standing up.`,
      `The argument is loud, public and short, which is the worst combination — long enough for everyone to hear, short enough that nobody gets to explain. ${a} and ${b} are finished as anything but enemies.`,
      `${a} has been holding this in for a week and it comes out badly, all at once, at ${b}, in the kitchen, at volume. Afterwards ${p.sub} knows it was a mistake. That does not make it untrue.`,
    ], ctx, a, b);

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
    return { text, players: [a, b], badgeText: 'BLOW-UP', badgeClass: 'red' };
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
    const p = pronouns(a);
    const wrong = bond(a, victim) >= 3;   // they were, in fact, loyal
    const text = _variant([
      `${a} replays a conversation from Tuesday and hears it differently. By morning ${p.sub} has built an entire case against ${victim} out of a pause and a change of subject.`,
      `Nobody has said anything to ${a}. That is exactly what is wrong. ${p.Sub} decides the silence is about ${p.obj}, and decides ${victim} is at the centre of it.`,
      `${a} counts the votes four times and gets a different answer each time. Somewhere in the fourth count ${victim} becomes the problem, on evidence that would not survive daylight.`,
      `"They're being weird with me." They are not being weird with ${a}. But ${p.sub} has said it out loud now, and saying it out loud is how it becomes true.`,
    ], ctx, a, victim);

    api.suspicion(a, victim, 2.2);
    api.addBond(a, victim, -0.9);
    api.remember(a, victim, 'suspicion', wrong ? 1 : 2, { founded: !wrong });
    return {
      text, players: [a, victim],
      badgeText: wrong ? 'PARANOIA' : 'SUSPICION', badgeClass: wrong ? 'grey' : 'red',
    };
  },
};

// ── information ───────────────────────────────────────────────────────

const infoTrade = {
  id: 'social-info-trade',
  category: 'social',
  weight(house, ctx) {
    const talkers = house.filter(n => pStats(n).social >= 5);
    if (!_infoTrio(house, ctx)) return 0;
    return talkers.length >= 2 ? _w(talkers.length * 1.4, ctx) : 0;
  },
  fire(house, ctx, api) {
    // The intel is about whoever is currently the biggest threat in the room.
    const { a, b, subject } = _infoTrio(house, ctx);

    const text = _variant([
      `${a} tells ${b} what ${subject} said, and who ${subject} said it about. It is a gift and an investment at the same time, which is the only kind of gift this house gives.`,
      `"You didn't hear this from me." ${b} nods. ${b} will absolutely tell someone it came from ${a}, but not this week.`,
      `Information moves from ${a} to ${b} in about nine seconds, and by dinner ${subject} is a topic in two conversations ${subject} is not in.`,
      `${a} trades what ${p_of(a)} knows about ${subject} for what ${b} knows about the vote. Both sides overpay, and both sides walk away feeling clever.`,
    ], ctx, a, b, subject);

    api.addBond(a, b, 0.8);
    api.suspicion(b, subject, 1.4);
    api.remember(b, a, 'confidence', 1, { about: subject });
    return { text, players: [a, b, subject], badgeText: 'INTEL TRADED', badgeClass: 'blue' };
  },
};

// Small helper used inside a template above.
function p_of(name) { return pronouns(name).sub; }

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

    const p = pronouns(liar);
    const skilled = pStats(liar).social / 10;
    const sharp = pStats(mark).intuition / 10;
    // Does it land? Persuasion against perception — proportional, not a coin flip.
    const lands = skilled * (1 - sharp * 0.8) > 0.28;
    const text = lands ? _variant([
      `${liar} does not lie, exactly. ${p.Sub} repeats something ${victim} said, with one word moved, to ${mark}. The word matters. By evening ${mark} cannot look at ${victim} the same way.`,
      `"I'm only telling you because I'd want to know." ${mark} believes it, because it arrives in the voice people use for favours.`,
      `The story ${liar} tells ${mark} about ${victim} is ninety percent true, which is what makes the other ten percent impossible to find.`,
      `${liar} plants it and walks away, which is the trick — stay to watch and it looks like what it is. ${mark} carries it around all evening, getting heavier.`,
    ], ctx, liar, mark, victim) : _variant([
      `${liar} tries it on ${mark} and watches it fail in real time. ${mark} asks one question too many and ${liar} has to retreat into "I might have misheard."`,
      `${mark} listens to the whole thing about ${victim}, says "huh," and does not believe a word of it. Worse — now ${mark} is wondering why ${liar} wanted ${p.obj} to.`,
      `The lie is a shade too neat. ${mark} has been watching this house closely enough to know that ${victim} does not talk like that, and ${liar} has just told ${mark} something true about ${liar}.`,
      `It does not take. ${mark} nods along and files it under things people say when they want something, which is where most of what ${liar} says now lives.`,
    ], ctx, liar, mark, victim);

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
    return {
      text, players: [liar, mark, victim],
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

    const p = pronouns(a);
    const text = _variant([
      `${a} and ${b} have been finding reasons to be in the same room for three days, and today neither of them bothers with the reason.`,
      `It is nothing anyone could point to — a hand on a shoulder that stays a beat too long, a joke that is only funny to two people. The rest of the house notices before they do.`,
      `${a} says something quiet to ${b} and whatever it was, ${b} laughs properly, and ${p.sub} looks pleased with ${p.ref} for the rest of the evening.`,
      `They stay up talking after everyone else folds. Nothing happens. Something has clearly happened.`,
    ], ctx, a, b);

    const started = api.showmance(a, b, { context: 'the Big Brother house', intensity: 0.35, bondDelta: 1.2 });
    if (!started) api.addBond(a, b, 0.8);
    // A showmance is a target on two backs at once.
    _others(house, a, b).forEach(watcher => {
      if (pStats(watcher).intuition >= 5) api.suspicion(watcher, a, 0.7);
    });
    return { text, players: [a, b], badgeText: started ? 'SHOWMANCE' : 'SOMETHING THERE', badgeClass: 'gold' };
  },
};

// ── memory turning into intent ────────────────────────────────────────

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
    const p = pronouns(a);
    const worst = memoriesOf(a).filter(m => m.subject === enemy)
      .sort((x, y) => (y.strength || 1) - (x.strength || 1))[0];
    const kind = worst?.type || 'betrayal';

    const text = _variant([
      `${a} has stopped being upset about ${enemy}, which is much worse for ${enemy}. Upset is loud. This is quiet, and it has a date on it.`,
      `Somewhere between the ${kind} and tonight, ${a} finished deciding. ${p.Sub} is perfectly pleasant to ${enemy} at dinner. That is how you can tell.`,
      `"I'm over it," ${a} tells someone, about ${enemy}, unprompted, which is not a thing people say when they are over it.`,
      `${a} does the arithmetic on ${enemy} one last time — what was done, what it cost, who else knows — and puts the answer away somewhere ${p.sub} can reach it in a hurry.`,
    ], ctx, a, enemy);

    api.setTarget(a, enemy, `has not forgiven the ${kind}`);
    api.suspicion(a, enemy, 1.5);
    api.remember(a, enemy, 'resolve', 2, { about: kind });
    return { text, players: [a, enemy], badgeText: 'GRUDGE HARDENS', badgeClass: 'red' };
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
    const p = pronouns(nominee);
    const text = _variant([
      `${helper} does not offer ${nominee} a plan or a vote count. ${pronouns(helper).Sub} sits down next to ${p.obj} and stays there, and it turns out that is the thing that was needed.`,
      `"You don't have to be fine," ${helper} says, and ${nominee} stops being fine for about four minutes, and then is fine again, and is not going to forget who was there for those four minutes.`,
      `Everybody else has been very busy and very elsewhere since the ceremony. ${helper} makes ${nominee} a cup of tea, which in this house is practically a declaration.`,
      `${helper} finds ${nominee} sitting where people sit when they do not want to be found, and does not leave. Nothing strategic is discussed. Something strategic happens anyway.`,
    ], ctx, helper, nominee);

    api.addBond(helper, nominee, 1.9);
    api.remember(nominee, helper, 'kindness', 3, { when: 'on the block' });
    api.popDelta(helper, 1);
    return { text, players: [helper, nominee], badgeText: 'KINDNESS', badgeClass: 'green' };
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
    const p = pronouns(a);
    const nearest = closestTo(a, _others(house, a));
    const text = _variant([
      `${a} walks into a room and the conversation does not stop, which sounds like acceptance and is the opposite. Nobody bothers to hide anything from ${p.obj}, because nobody counts ${p.obj}.`,
      `There is a version of this game where being nobody's enemy is the same as being safe. ${a} is beginning to suspect this is not that version.`,
      `${a} realises, doing the washing up, that ${p.sub} has not had a real conversation in two days and nobody has noticed. Including, until now, ${p.obj}.`,
      `Everyone likes ${a}. Nobody needs ${a}. ${p.Sub} works out tonight which of those two things keeps you in this house.`,
    ], ctx, a);

    // Drifting is not neutral: it is a decision to fix it, aimed at the nearest hand.
    if (nearest) {
      api.addBond(a, nearest, 0.9);
      api.remember(a, nearest, 'reach', 1, {});
    }
    api.popDelta(a, -1);
    return { text, players: [a, nearest].filter(Boolean), badgeText: 'ADRIFT', badgeClass: 'grey' };
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
