// ══════════════════════════════════════════════════════════════════════
// bb-events/jury-bubble.js — the line, and who is on the wrong side of it
// ══════════════════════════════════════════════════════════════════════
//
// Big Brother has one milestone that is not winning and not losing, and the
// house talks about it more than either: making the jury. Getting there means a
// vote, a seat at the end, and going home having been PART of it. Missing it by
// one week means going home to nothing, and everybody in that house knows
// exactly how many evictions away it is at all times.
//
// The simulator knew the date and nothing else. `juryOpensAt()` has always been
// there, the eviction broadcast says FIRST MEMBER OF THE JURY out loud, and one
// event — deals-jury-pact — let two people promise to get there together. What
// was missing is the thing that makes the milestone worth having: the house
// TALKING about it, and the game BEHAVING differently because of it. A stake
// nobody mentions and nothing reads is a date on a calendar.
//
// ── the measure ──
//
//   toGo = house.length - juryOpensAt()
//
// Evictions left before the jury opens. Positive is pre-jury, zero or below
// means the votes are already being cast by people who will decide the winner.
// `toGo <= 3` is the bubble: close enough to count, far enough to still lose.
//
// ── the rule these are written under ──
//
// Circumstance decides Big Brother, not milestones. Everything here — the
// scenes and the three engine reads in js/bb/jury-pressure.js — INFLUENCES and
// never dominates: proportional nudges on reads that already exist, no
// thresholds, no switches. The competition library was just rebuilt for exactly
// this failure (a signal that swamped its noise made the same houseguest win
// everything), and a jury bubble that decides nominations would be the same
// mistake wearing a different hat.
//
// A fourth read was written, wired and then deleted when it was measured: it
// duplicated a term nominationScore already had. The note where it used to be,
// in jury-pressure.js, is the one to read before adding another.

import { pronouns } from '../players.js';
import { juryOpensAt } from '../bb/jury.js';
import { dangerLevel } from '../bb/strategy.js';
import {
  pStats, bond, band, closestTo, grudge, hasFired, resentmentOf, threat,
  isVillainous, isNice, archetype, spotlightOrder, beatsInvolving,
} from './_read.js';

// ── helpers ───────────────────────────────────────────────────────────

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _nominees = ctx => (ctx?.nominees || []).filter(Boolean);

/** A sentence does not open on a numeral. Small counts only — this is 1 to 5. */
const WORDS = ['zero', 'One', 'Two', 'Three', 'Four', 'Five'];
const spell = k => WORDS[k] || String(k);

/**
 * Evictions left before the jury opens, or null when the season has no jury.
 *
 * Read from the LIVE house rather than from a stored count, because the number
 * everybody in there is doing arithmetic on is how many people are standing in
 * the kitchen.
 */
export function juryToGo(house) {
  const opens = juryOpensAt();
  if (!opens) return null;
  return house.length - opens;
}

/** The stretch where the milestone is close enough to name and still in doubt. */
const _onTheBubble = house => {
  const toGo = juryToGo(house);
  return toGo != null && toGo >= 1 && toGo <= 3;
};

/**
 * How exposed somebody is this week, on the 0-1 scale the rest of the engine
 * uses. Wrapped because dangerLevel wants a context shaped like a competition's
 * and throwing here would take the beat down.
 */
function _danger(name, house, ctx) {
  try { return dangerLevel(name, { house, nominees: _nominees(ctx) }) || 0; } catch { return 0; }
}

/** Least-seen first, so the same houseguest is not the subject every week. */
const _cast = pool => spotlightOrder(pool);

/**
 * Deal-making and cruelty happen in the gaps. The ceremonies own their own act
 * and nobody workshops the jury line during an eviction.
 */
function _actFit(ctx) {
  switch (ctx?.act) {
    case 'campaign': return 1.2;
    case 'eviction': return 0.25;
    case 'nominations':
    case 'veto-ceremony': return 0.35;
    default: return 1;
  }
}
const _w = (value, ctx) => band(value * _actFit(ctx));

// ══════════════════════════════════════════════════════════════════════
// 1. The arithmetic, out loud
// ══════════════════════════════════════════════════════════════════════
//
// Before anybody is cruel about it, somebody has to say the number. This is
// the scene that puts the milestone in the room — deliberately cheap and
// deliberately early, so the cruelty later lands on a house that has already
// been counting.

const COUNT_LINES = [
  (n, p, k) => `${n} works it out on ${p.posAdj} fingers at the counter and says it to nobody in particular: "${k} more. ${k} more and we're all voting."`,
  (n, p, k) => `Somebody asks how many until jury. ${n} answers "${k}" without looking up, which tells the room ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} been counting for a while.`,
  (n, p, k) => `"${k}." ${n} does not say ${k} what. Everybody sitting there knows what ${k}.`,
  (n, p, k) => `The number comes up over dinner and gets checked three times, because ${k} sounds too close and everybody wants it to be wrong.`,
  (n, p, k) => `${n} counts the chairs, counts them again, and works out that ${k} of the people at this table are going home with nothing.`,
];

const countingDown = {
  id: 'jury-counting-down',
  category: 'social',
  weight(house, ctx) {
    const toGo = juryToGo(house);
    // Wider than the bubble: the counting starts before the panic does. Capped
    // at five because at the top of a season "jury" is small talk.
    if (toGo == null || toGo < 1 || toGo > 5) return 0;
    if (house.length < 5) return 0;
    // Louder the closer it gets, which is how a house actually behaves.
    return _w((6 - toGo) * 0.75, ctx);
  },
  fire(house, ctx, api) {
    const toGo = juryToGo(house);
    const speaker = _cast(house)[0];
    if (!speaker) return null;
    const p = pronouns(speaker);
    const text = _variant(COUNT_LINES, ctx, speaker)(speaker, p, toGo);

    // The consequence is small and real: everybody who heard it is now counting
    // too, and the two people with the most to lose hear it differently.
    const exposed = _others(house, speaker)
      .map(n => ({ n, d: _danger(n, house, ctx) }))
      .sort((a, b) => b.d - a.d).slice(0, 2).filter(e => e.d > 0.15);
    for (const { n } of exposed) {
      api.remember(n, speaker, 'jury-countdown', 1,
        { week: ctx.week?.num || 0, about: `${toGo} from jury` });
      api.suspicion(n, speaker, 0.2);
    }
    return {
      text, players: [speaker, ...exposed.map(e => e.n)].slice(0, 3),
      badgeText: `${toGo} FROM JURY`, badgeClass: 'blue',
    };
  },
};

// ══════════════════════════════════════════════════════════════════════
// 2. Written off, behind their back
// ══════════════════════════════════════════════════════════════════════
//
// The most common cruelty in the format and the least dramatic to watch: two
// people agreeing, quietly, that a third is not going to make it. It is not a
// plan and not a threat — it is a forecast, delivered with the confidence of
// somebody who has never been on the wrong side of one.
//
// It costs the speaker only if it travels, which is what makes it worth saying.

const WRITTEN_OFF = [
  (s, m, t) => `"${t} is not making jury." ${s} says it to ${m} the way you say it might rain — no malice in it, which is somehow worse than malice.`,
  (s, m, t) => `${s} and ${m} are working out the next four weeks and ${t} is not in any of them. Neither of them notices that they stopped saying "if".`,
  (s, m, t) => `"Do not get attached." ${s} nods toward ${t} across the kitchen. ${m} laughs, and then stops laughing, and then does not say anything.`,
  (s, m, t) => `${s} has already decided how ${t} goes home and in which week, and tells ${m} both, and is not wrong about either as far as ${m} can tell.`,
  (s, m, t) => `The list of who makes jury gets said out loud. ${t} is not on it. ${s} was the one holding the list and ${m} was the one who agreed with it.`,
];

/** Somebody confident, somebody to say it to, and somebody to say it about. */
function _writeOffCast(house, ctx) {
  const pool = _cast(house);
  for (const speaker of pool) {
    const targets = _others(house, speaker)
      .map(n => ({ n, d: _danger(n, house, ctx), t: threat(n) }))
      // Written off means visibly weak, not merely disliked.
      .filter(e => e.d > 0.2 || e.t < 3)
      .sort((a, b) => (b.d - a.d) || (a.t - b.t));
    const target = targets[0]?.n;
    if (!target) continue;
    const mark = closestTo(speaker, _others(house, speaker, target));
    if (mark) return { speaker, mark, target };
  }
  return null;
}

const writtenOff = {
  id: 'jury-written-off',
  category: 'social',
  weight(house, ctx) {
    const toGo = juryToGo(house);
    if (toGo == null || toGo < 1 || toGo > 4) return 0;
    if (house.length < 6) return 0;
    const cast = _writeOffCast(house, ctx);
    if (!cast) return 0;
    const s = pStats(cast.speaker);
    // Confidence talks. Strategic players do this out loud more than anybody.
    return _w((s.strategic * 0.32 + s.boldness * 0.18) * (1 + (4 - toGo) * 0.12), ctx);
  },
  fire(house, ctx, api) {
    const cast = _writeOffCast(house, ctx);
    if (!cast) return null;
    const { speaker, mark, target } = cast;
    const text = _variant(WRITTEN_OFF, ctx, speaker, target)(speaker, mark, target);

    // Saying it binds the two who said it — a shared read is a small alliance.
    api.addBond(speaker, mark, 0.3);
    api.remember(mark, speaker, 'wrote-somebody-off', 1,
      { week: ctx.week?.num || 0, about: `said ${target} misses jury` });

    // ── and it only costs if it travels ──
    //
    // Proportional to the target's own read of the house rather than a flat
    // chance: somebody perceptive hears about this, somebody oblivious does
    // not, and that is a real difference between two houseguests.
    const t = pStats(target);
    const travels = ((t.intuition + t.social) / 2) / 10;
    if (travels > 0.45) {
      api.addBond(target, speaker, -1.1 * travels);
      api.suspicion(target, speaker, 0.9 * travels);
      api.remember(target, speaker, 'wrote-me-off', 2,
        { week: ctx.week?.num || 0, about: 'said I was not making jury' });
    }
    return {
      text, players: [speaker, mark, target],
      badgeText: 'NOT MAKING JURY', badgeClass: 'grey',
    };
  },
};

// ══════════════════════════════════════════════════════════════════════
// 3. Said to their face
// ══════════════════════════════════════════════════════════════════════
//
// The rare version, and the one that changes a week. Nobody says this by
// accident: it is a villain's move, or a temper's, and the person who hears it
// does not forget it — this is the memory that turns up in a jury speech.
//
// It has a cost the behind-the-back version does not: it makes an enemy who is
// now playing for something. The resolve granted here is read by
// js/bb/jury-pressure.js and by nothing else, so it is a nudge on this week
// rather than a permanent buff.

const TO_THEIR_FACE = [
  (s, t, p) => `"You know you are not making jury." ${s} says it to ${t}'s face, in a kitchen with four other people in it, and does not lower ${pronouns(s).posAdj} voice for any of them.`,
  (s, t, p) => `${t} asks ${s} straight out where ${pronouns(t).sub} ${pronouns(t).sub === 'they' ? 'stand' : 'stands'}. ${s} tells ${pronouns(t).obj}: short. Very short. ${p.Sub} ${p.sub === 'they' ? 'do' : 'does'} not blink while hearing it.`,
  (s, t) => `"I would start writing the goodbye message." ${s} is smiling. ${t} is not, and neither is anybody else who heard it.`,
  (s, t, p) => `It comes out in an argument and it is the worst thing said in it: ${s} tells ${t} that ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} going home before the jury and nobody in this house will remember ${p.obj} for it.`,
];

function _faceCast(house, ctx) {
  const pool = _cast(house).filter(n => isVillainous(n) || archetype(n) === 'hothead');
  for (const speaker of pool) {
    const target = _others(house, speaker)
      .map(n => ({ n, d: _danger(n, house, ctx), hate: -bond(speaker, n) }))
      .filter(e => e.d > 0.25 || e.hate > 2)
      .sort((a, b) => (b.hate - a.hate) || (b.d - a.d))[0]?.n;
    if (target) return { speaker, target };
  }
  return null;
}

const toTheirFace = {
  id: 'jury-told-to-their-face',
  category: 'social',
  weight(house, ctx) {
    const toGo = juryToGo(house);
    if (toGo == null || toGo < 1 || toGo > 3) return 0;
    if (house.length < 6) return 0;
    const cast = _faceCast(house, ctx);
    if (!cast) return 0;
    const s = pStats(cast.speaker);
    // Deliberately the rarest thing in this file. Cruelty in front of witnesses
    // is a decision, and one a low-temperament player makes far more easily.
    // Rare, but not so rare that a season never contains one — this is the
    // scene the whole family was asked for. Measured at 0.55 it appeared in two
    // seasons out of six.
    return _w(((10 - s.temperament) * 0.16 + s.boldness * 0.12) * 1.15, ctx);
  },
  fire(house, ctx, api) {
    const cast = _faceCast(house, ctx);
    if (!cast) return null;
    const { speaker, target } = cast;
    const p = pronouns(target);
    const text = _variant(TO_THEIR_FACE, ctx, speaker, target)(speaker, target, p);

    api.addBond(speaker, target, -2.6);
    api.suspicion(target, speaker, 1.4);
    api.remember(target, speaker, 'told-me-to-my-face', 3,
      { week: ctx.week?.num || 0, about: 'told me I was not making jury' });
    // The room saw it, and a house does not like watching this.
    api.popDelta(speaker, -1.5);
    api.popDelta(target, 1);
    for (const witness of _others(house, speaker, target).slice(0, 3)) {
      api.addBond(witness, speaker, -0.35);
    }
    // What it buys the person who heard it: this week, they play like somebody
    // with something to prove. Read by jury-pressure.js.
    api.remember(target, speaker, 'jury-resolve', 2,
      { week: ctx.week?.num || 0, about: 'I am making jury' });
    return {
      text, players: [speaker, target],
      badgeText: 'TO THEIR FACE', badgeClass: 'red',
    };
  },
};

// ══════════════════════════════════════════════════════════════════════
// 4. Nerves on the bubble
// ══════════════════════════════════════════════════════════════════════
//
// The other side of it, from inside. A houseguest one or two evictions from a
// jury seat, and exposed, does not behave the way they did in week two — and
// which way they break is character rather than luck. The timid go quiet and
// agreeable, which is its own kind of visible; the bold do something.

const NERVES_QUIET = [
  (n, p, k) => `${n} has stopped arguing about anything at all. ${p.Sub} ${p.sub === 'they' ? 'agree' : 'agrees'} with the last person who spoke, every time, and ${k} evictions is the reason.`,
  (n, p) => `${n} does the dishes for the second time today. Nobody asked ${p.obj} to and everybody has noticed.`,
  (n, p, k) => `${spell(k)} from jury, ${n} works out that the safest thing to be right now is boring, and sets about being it.`,
  (n, p) => `${n} laughs at something that was not funny, hears ${p.ref} do it, and goes to bed early.`,
];

const NERVES_BOLD = [
  (n, p, k) => `${spell(k)} from a jury seat, ${n} decides that sitting quietly is how people go home one short of it, and starts a conversation ${p.sub} cannot take back.`,
  (n, p) => `${n} would rather go out doing something than go out being pleasant, and picks the room to announce it in.`,
  (n, p, k) => `"${k} more. I am not spending ${k} weeks being somebody's number." ${n} says it to the person most likely to repeat it, on purpose.`,
  (n, p) => `${n} stops asking and starts telling, which is either the best week ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} played or the last one.`,
];

function _nervesCast(house, ctx) {
  return _cast(house)
    .map(n => ({ n, d: _danger(n, house, ctx) }))
    .filter(e => e.d > 0.15)
    .sort((a, b) => b.d - a.d)[0] || null;
}

const bubbleNerves = {
  id: 'jury-bubble-nerves',
  category: 'social',
  weight(house, ctx) {
    if (!_onTheBubble(house) || house.length < 6) return 0;
    const cast = _nervesCast(house, ctx);
    if (!cast) return 0;
    // Somebody the screen has not been near lately, in real trouble.
    // Measured at 5.5 this appeared in two seasons of six, which is too rare
    // for the inside view of the milestone the rest of the file is about.
    return _w(cast.d * 8 + Math.max(0, 3 - beatsInvolving(cast.n)) * 0.4, ctx);
  },
  fire(house, ctx, api) {
    const cast = _nervesCast(house, ctx);
    if (!cast) return null;
    const name = cast.n;
    const p = pronouns(name);
    const toGo = juryToGo(house);
    const s = pStats(name);
    // Which way they break. Proportional, and the roll is the stat line rather
    // than a coin: a bold, disloyal houseguest gambles, a loyal timid one goes
    // quiet, and the ones in between could do either depending on the week.
    const gambles = (s.boldness * 0.6 + (10 - s.loyalty) * 0.4) > 5.5 && !isNice(name);
    const text = _variant(gambles ? NERVES_BOLD : NERVES_QUIET, ctx, name)(name, p, toGo);

    if (gambles) {
      // A gamble is seen, and seen means threat.
      api.popDelta(name, 1.2);
      for (const other of _others(house, name).slice(0, 3)) api.suspicion(other, name, 0.5);
      api.remember(name, name, 'jury-gamble', 2,
        { week: ctx.week?.num || 0, about: 'played loud on the bubble' });
    } else {
      // Compliance buys warmth and costs standing.
      const near = closestTo(name, _others(house, name));
      if (near) api.addBond(name, near, 0.6);
      api.popDelta(name, -0.6);
      api.remember(name, name, 'jury-hunkered', 2,
        { week: ctx.week?.num || 0, about: 'went quiet on the bubble' });
    }
    return {
      text, players: [name],
      badgeText: gambles ? 'NOTHING TO LOSE' : 'HEAD DOWN',
      badgeClass: gambles ? 'red' : 'grey',
    };
  },
};

// ══════════════════════════════════════════════════════════════════════
// 5. A jury seat, offered as payment
// ══════════════════════════════════════════════════════════════════════
//
// The pact in deals.js is between equals: two people who both want it promising
// each other. This is the other shape, and the more Big Brother one — somebody
// with power selling a jury seat to somebody without one, in exchange for a
// vote. It is the cheapest thing a strong player can offer, because they were
// going to keep a weak player around anyway.

const PAYMENT_LINES = [
  (a, b) => `"Vote how I need you to vote and you are sitting in that jury house. That is the whole deal." ${a} does not dress it up and ${b} does not need ${pronouns(a).obj} to.`,
  (a, b) => `${a} offers ${b} the only thing ${b} actually wants, which is four more weeks, and asks for one vote in return.`,
  (a, b) => `"You are not winning this. You know that. I can still get you paid." ${b} would like to be insulted and finds ${pronouns(b).ref} agreeing instead.`,
  (a, b) => `They shake on it in the storage room: ${b} makes jury, ${a} gets a vote whenever ${pronouns(a).sub} ${pronouns(a).sub === 'they' ? 'ask' : 'asks'} for it. Both of them think they got the better end.`,
];

function _paymentCast(house, ctx) {
  const strong = _cast(house).filter(n => threat(n) >= 4);
  for (const a of strong) {
    const b = _others(house, a)
      .filter(n => threat(n) < 3 && !_nominees(ctx).includes(n) && bond(a, n) > -3)
      .sort((x, y) => threat(x) - threat(y))[0];
    if (b) return { a, b };
  }
  return null;
}

const seatAsPayment = {
  id: 'jury-seat-as-payment',
  category: 'deals',
  weight(house, ctx) {
    const toGo = juryToGo(house);
    if (toGo == null || toGo < 1 || toGo > 4) return 0;
    if (house.length < 7) return 0;
    const cast = _paymentCast(house, ctx);
    if (!cast) return 0;
    return _w(pStats(cast.a).strategic * 0.34, ctx);
  },
  fire(house, ctx, api) {
    const cast = _paymentCast(house, ctx);
    if (!cast) return null;
    const { a, b } = cast;
    const text = _variant(PAYMENT_LINES, ctx, a, b)(a, b);

    // A real deal on the record, not a handshake in prose. The obligation is
    // what the vote logic reads later.
    api.sideDeal?.(a, b, 'make-jury', { reason: 'a seat for a vote', transactional: true });
    api.addBond(a, b, 0.5);
    api.remember(b, a, 'owes-me-jury', 2,
      { week: ctx.week?.num || 0, about: 'promised to carry me to jury' });
    api.remember(a, b, 'bought-a-vote', 2,
      { week: ctx.week?.num || 0, about: 'a seat for a vote' });
    return {
      text, players: [a, b],
      badgeText: 'A SEAT FOR A VOTE', badgeClass: 'green',
    };
  },
};

// ══════════════════════════════════════════════════════════════════════
// 6. Bury them before they can vote
// ══════════════════════════════════════════════════════════════════════
//
// The reason the milestone matters strategically, and the one real Big Brother
// argument about it: a person you have wronged is far cheaper to evict while
// they still cannot vote against you at the end. Two people work that out and
// agree on a name — which is where the target read in jury-pressure.js gets
// most of its material.

const BURY_LINES = [
  (a, b, t) => `"${t} hates me, and ${t} cannot vote yet." ${a} lays it out for ${b} like arithmetic, because it is.`,
  (a, b, t) => `${a} and ${b} arrive at the same name from opposite directions. Neither of them says the quiet part, which is that ${t} would be sitting in that jury house with a grudge and a ballot.`,
  (a, b, t) => `"Now, or ${t} is deciding this in nine weeks." ${b} was not planning on agreeing and agrees.`,
  (a, b, t) => `The whole conversation is four sentences long. Three of them are about ${t}, and the fourth is about the date the jury opens.`,
];

function _buryCast(house, ctx) {
  const pool = _cast(house);
  for (const a of pool) {
    const enemy = _others(house, a)
      .map(n => ({ n, heat: resentmentOf(n, a) + grudge(n, a) + Math.max(0, -bond(a, n)) }))
      .filter(e => e.heat > 1.5)
      .sort((x, y) => y.heat - x.heat)[0];
    if (!enemy) continue;
    const b = closestTo(a, _others(house, a, enemy.n));
    if (b) return { a, b, target: enemy.n };
  }
  return null;
}

const buryThemFirst = {
  id: 'jury-bury-them-first',
  category: 'deals',
  weight(house, ctx) {
    const toGo = juryToGo(house);
    // The argument only works while the jury is genuinely still shut.
    if (toGo == null || toGo < 1 || toGo > 3) return 0;
    if (house.length < 6) return 0;
    const cast = _buryCast(house, ctx);
    if (!cast) return 0;
    // Sharper the closer the door is to opening.
    // Carries a pressure on its own now: the nomination read that was going to
    // duplicate it was measured against `revenge`, found to be the same signal,
    // and deleted. See the note in js/bb/jury-pressure.js.
    return _w(pStats(cast.a).strategic * 0.6 * (1 + (3 - toGo) * 0.2), ctx);
  },
  fire(house, ctx, api) {
    const cast = _buryCast(house, ctx);
    if (!cast) return null;
    const { a, b, target } = cast;
    const text = _variant(BURY_LINES, ctx, a, target)(a, b, target);

    api.setTarget(a, target, 'would be a bitter juror');
    api.setTarget(b, target, `${a} made the case`);
    api.addBond(a, b, 0.45);
    api.remember(a, target, 'buried-before-jury', 2,
      { week: ctx.week?.num || 0, about: 'get them out before they can vote' });
    return {
      text, players: [a, b, target],
      badgeText: 'BEFORE THEY CAN VOTE', badgeClass: 'red',
    };
  },
};

// ══════════════════════════════════════════════════════════════════════
// 7. The line, crossed
// ══════════════════════════════════════════════════════════════════════
//
// One beat, once, on the week the jury opens. Everything said in that house
// from here is being heard by somebody who will decide the winner, and the
// people who have been loud all season work that out at different speeds.

const CROSSED_LINES = [
  n => `Somebody points out that from tonight, everybody who leaves is voting. The room takes a second with that, and ${n} is the one who visibly recalculates.`,
  n => `The jury is open. ${n} has spent six weeks saying whatever came into ${pronouns(n).posAdj} head to people who could not do anything about it, and that stops being free at exactly this moment.`,
  n => `"Careful what you say now." It is a joke and it is not, and ${n} is the one who laughs a beat too late.`,
  n => `From here every eviction hands somebody a ballot. ${n} starts being kind to people ${pronouns(n).sub} ${pronouns(n).sub === 'they' ? 'have' : 'has'} not been kind to since the door shut.`,
];

const lineCrossed = {
  id: 'jury-line-crossed',
  category: 'social',
  weight(house, ctx) {
    const toGo = juryToGo(house);
    // The week the door opens, and only that week.
    if (toGo == null || toGo > 0 || toGo < -1) return 0;
    if (house.length < 5) return 0;
    // ── once a season, and it took reading the output to see it was not ──
    //
    // This asked whether house[0] remembered the line being crossed. house[0]
    // is whoever happens to be first in the live roster, and that person gets
    // evicted — so the guard forgot every time the front of the list changed
    // and the beat ran in two consecutive weeks, twice in one of them. The
    // registry keeps a season-long event history for exactly this.
    if (hasFired('jury-line-crossed')) return 0;
    return _w(9, ctx);
  },
  fire(house, ctx, api) {
    // Whoever has the most to lose from having been loud: high popularity swing
    // and a trail of people they have wronged.
    const subject = _cast(house)
      .map(n => ({ n, owed: _others(house, n).reduce((t, o) => t + resentmentOf(o, n), 0) }))
      .sort((a, b) => b.owed - a.owed)[0]?.n || house[0];
    const text = _variant(CROSSED_LINES, ctx, subject)(subject);

    // The house registers it. Repeat suppression is NOT this — the registry's
    // own event history is what stops the beat running twice, because a memory
    // written on a houseguest leaves when that houseguest does.
    for (const n of house) {
      api.remember(n, n, 'jury-line-crossed', 1,
        { week: ctx.week?.num || 0, about: 'the jury is open' });
    }
    return {
      text, players: [subject],
      badgeText: 'THE JURY IS OPEN', badgeClass: 'gold',
    };
  },
};

// ══════════════════════════════════════════════════════════════════════

export const JURY_BUBBLE_EVENTS = [
  countingDown,
  writtenOff,
  toTheirFace,
  bubbleNerves,
  seatAsPayment,
  buryThemFirst,
  lineCrossed,
];
