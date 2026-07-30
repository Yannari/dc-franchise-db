// ══════════════════════════════════════════════════════════════════════
// bb-events/deals.js — promises, vote counts and the breaking of both
// ══════════════════════════════════════════════════════════════════════
//
// Where Big Brother is actually played. The ceremonies are the visible week and
// the social events are the texture; this is the file where somebody decides
// who is going home and then finds out whether the house agrees.
//
// Almost everything here writes a promise, reads one, or breaks one. That is
// the point: a deal only means something if it is on the record long enough to
// be honoured or betrayed later, so these lean hard on shared memory and
// intentions rather than on the moment.
//
// Conventions match the rest of the library: casting shared between weight()
// and fire() so they cannot disagree, proportional weights, act-aware, state
// changed only through `api`, text chosen deterministically.

import { pronouns } from '../players.js';
import {
  pStats, bond, perceived, hidden, band, bondFactor, closestTo, furthestFrom,
  trusts, dislikes, sharesAlliance, alliancesOf, grudge, remembers, wasPromised,
  suspicionOf, targetOf, isHunting, huntedBy, threat, biggestThreat, willScheme, deFactoAllies,
  isNice, isVillainous, archetype, trustOf, obligationOf, respectOf, dangerOf,
  resentmentOf, beatsInvolving, actFacts,
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

/** Deal-making happens in the gaps, and hardest while the vote is live. */
function _actFit(ctx) {
  switch (ctx?.act) {
    case 'campaign': return 1.25;         // the whole act is deal-making
    case 'nominations':
    case 'veto-ceremony': return 0.3;     // the ceremony owns its own act
    default: return 1;
  }
}
const _w = (value, ctx) => band(value * _actFit(ctx));

/** Voters who are not nominated and not the HOH — the people worth working. */
const _voters = (house, ctx) =>
  house.filter(n => n !== ctx?.hoh && !_nominees(ctx).includes(n));

// ── casting ───────────────────────────────────────────────────────────

function _pactPair(house, ctx) {
  const pool = _leastSeen(house);
  for (const a of pool) {
    const b = _others(house, a).find(n =>
      bond(a, n) >= 3 && !remembers(a, n, 'final-two') && trustOf(a, n) >= 0);
    if (b) return { a, b };
  }
  return null;
}

function _pitchPair(house, ctx) {
  const noms = _nominees(ctx);
  const voters = _voters(house, ctx);
  if (!noms.length || !voters.length) return null;
  const pitcher = _leastSeen(noms)[0];
  // Work the voter who is closest to persuadable: some warmth, not certainty.
  const mark = voters.sort((x, y) =>
    Math.abs(bond(pitcher, x) - 1) - Math.abs(bond(pitcher, y) - 1))[0];
  return mark ? { pitcher, mark } : null;
}

function _brokenPromise(house, ctx) {
  for (const victim of _leastSeen(house)) {
    const liar = _others(house, victim).find(n =>
      wasPromised(victim, n, ctx?.week?.num || 0) && (dislikes(victim, n) || isHunting(n, victim)));
    if (liar) return { victim, liar };
  }
  return null;
}

function _safetyPair(house, ctx) {
  if (!ctx?.hoh) return null;
  const other = _others(house, ctx.hoh).filter(n => !_nominees(ctx).includes(n))
    .sort((a, b) => threat(b) - threat(a))[0];
  return other ? { hoh: ctx.hoh, other } : null;
}

function _defector(house, ctx) {
  for (const mark of _leastSeen(house)) {
    // A formal alliance if one exists, otherwise the people this houseguest is
    // aligned with in practice — Big Brother creates no named alliances yet.
    const allies = deFactoAllies(mark, house);
    if (allies.length < 2) continue;
    const outsider = _others(house, mark, ...allies).find(n =>
      willScheme(n) && bond(n, mark) > -2);
    if (outsider) return { mark, outsider, alliance: alliancesOf(mark)[0] || null, allies };
  }
  return null;
}

function _juryPair(house, ctx) {
  // Only worth doing once the house is small enough for a jury to exist.
  if (house.length > 9) return null;
  const player = _leastSeen(house).find(n => pStats(n).strategic >= 5);
  if (!player) return null;
  const juror = _others(house, player).sort((a, b) => bond(player, a) - bond(player, b))[0];
  return juror ? { player, juror } : null;
}

// ── the events ────────────────────────────────────────────────────────

const finalTwo = {
  id: 'deals-final-two',
  category: 'deals',
  weight(house, ctx) {
    const pair = _pactPair(house, ctx);
    if (!pair) return 0;
    // A final two is worth making once the field is small enough to imagine.
    const late = house.length <= 10 ? 1.5 : house.length <= 13 ? 1 : 0.5;
    return _w(bondFactor(bond(pair.a, pair.b)) * late * 13, ctx);
  },
  fire(house, ctx, api) {
    const { a, b } = _pactPair(house, ctx);
    const p = pronouns(a);
    const text = _variant([
      `${a} says the words out loud — "final two, whatever happens" — and ${b} says them back. Neither of them writes anything down and both of them will remember the exact wording.`,
      `It is not a conversation so much as a confirmation of something that has been true for two weeks. ${a} and ${b} shake on it, which in this house is either sacred or nothing at all.`,
      `"If it's us at the end I'm not going to feel bad about beating you." ${b} laughs. "You won't beat me." That is the deal, made.`,
      `${a} has been circling this all week and finally asks. ${b} agrees so quickly that ${p.sub} wonders, briefly, how many other people have been asked the same thing.`,
    ], ctx, a, b);

    api.addBond(a, b, 1.6);
    api.remember(a, b, 'final-two', 3, { week: ctx.week?.num || 0 });
    api.remember(b, a, 'final-two', 3, { week: ctx.week?.num || 0 });
    api.setTarget(a, biggestThreat(_others(house, a, b)) || furthestFrom(a, house), 'the deal needs a road');
    return { text, players: [a, b], badgeText: 'FINAL TWO', badgeClass: 'gold' };
  },
};

const votePitch = {
  id: 'deals-vote-pitch',
  category: 'deals',
  weight(house, ctx) {
    const pair = _pitchPair(house, ctx);
    if (!pair) return 0;
    const s = pStats(pair.pitcher);
    return _w((s.social / 10) * (0.5 + s.strategic / 20) * 14, ctx);
  },
  fire(house, ctx, api) {
    const { pitcher, mark } = _pitchPair(house, ctx);
    const p = pronouns(pitcher);
    const other = _nominees(ctx).find(n => n !== pitcher);
    // Persuasion against judgement — proportional, and the relationship counts.
    const force = pStats(pitcher).social / 10 + bondFactor(bond(pitcher, mark)) * 0.6;
    const guard = pStats(mark).intuition / 10 + (trustOf(mark, other) > 2 ? 0.4 : 0);
    const lands = force > guard;

    const text = lands ? _variant([
      `${pitcher} does not beg, which is the only reason it works. ${p.Sub} lays out what the house looks like next week with ${p.obj} in it and lets ${mark} do the arithmetic ${p.ref}.`,
      `"You don't owe me anything. I'm asking anyway." ${mark} says ${pronouns(mark).sub}'ll think about it, and means it, which is more than ${pitcher} got from anyone else today.`,
      `${pitcher} finds the one thing ${mark} is actually worried about and talks about that instead of about the vote. By the end ${mark} is the one making the argument.`,
      `It takes ${pitcher} four minutes and one very well-chosen name${other ? ` — ${other}'s` : ''} — and ${mark} stops nodding politely and starts nodding.`,
    ], ctx, pitcher, mark) : _variant([
      `${pitcher} makes the pitch and ${mark} listens to all of it with the patience people reserve for something they decided about days ago.`,
      `"I hear you." ${mark} does not say anything else, and ${pitcher} has been in this house long enough to know what that means.`,
      `${pitcher} pushes slightly too hard at the end, and watches ${mark}'s face close.`,
      `The pitch is good. ${mark} is simply not available to be pitched to, and both of them know it before ${pitcher} finishes.`,
    ], ctx, pitcher, mark);

    if (lands) {
      api.addBond(pitcher, mark, 1.1);
      api.remember(mark, pitcher, 'promise', 2, { promise: 'my vote, this week' });
    } else {
      api.addBond(pitcher, mark, -0.4);
      api.suspicion(mark, pitcher, 0.6);
    }
    return {
      text, players: [pitcher, mark],
      badgeText: lands ? 'PITCH LANDS' : 'PITCH REFUSED',
      badgeClass: lands ? 'green' : 'grey',
    };
  },
};

const brokenPromise = {
  id: 'deals-broken-promise',
  category: 'deals',
  weight(house, ctx) {
    const pair = _brokenPromise(house, ctx);
    if (!pair) return 0;
    return _w(band(6 + grudge(pair.victim, pair.liar) * 2), ctx);
  },
  fire(house, ctx, api) {
    const { victim, liar } = _brokenPromise(house, ctx);
    const p = pronouns(victim);
    const text = _variant([
      `${victim} finally says it to ${liar}'s face: "You gave me your word." ${liar} has an answer ready, which is somehow the worst part.`,
      `The promise was made three weeks ago and ${victim} has been carrying it around since. Today ${p.sub} puts it down, publicly, in front of two other people.`,
      `"I'm not angry," ${victim} tells ${liar}, and is plainly furious. Nobody in the room corrects ${p.obj}.`,
      `${liar} tries to explain what the promise had actually meant. ${victim} listens to the whole explanation and comes out of it certain of exactly one thing.`,
    ], ctx, victim, liar);

    api.addBond(victim, liar, -1.8);
    api.remember(victim, liar, 'broken-promise', 3, {});
    api.setTarget(victim, liar, 'gave me their word and did not keep it');
    // Watching a promise break teaches everyone something about the promiser.
    _others(house, victim, liar).forEach(w => {
      if (pStats(w).intuition >= 5) api.suspicion(w, liar, 0.9);
    });
    api.popDelta(liar, -1);
    return { text, players: [victim, liar], badgeText: 'PROMISE BROKEN', badgeClass: 'red' };
  },
};

const safetyDeal = {
  id: 'deals-safety',
  category: 'deals',
  weight(house, ctx) {
    const pair = _safetyPair(house, ctx);
    if (!pair || ctx.act === 'eviction') return 0;
    // You buy safety from the person most able to take it from you.
    return _w(band(4 + threat(pair.other) * 0.5), ctx);
  },
  fire(house, ctx, api) {
    const { hoh, other } = _safetyPair(house, ctx);
    const p = pronouns(other);
    const honest = !willScheme(hoh);
    const text = _variant([
      `"One week. You don't come after me, I don't come after you." ${other} takes the deal because the alternative is finding out what happens without it.`,
      `${other} goes to ${hoh} before ${hoh} can come to ${p.obj}, which is the correct order and both of them know it.`,
      `They agree not to nominate each other next week, an agreement that has never once survived contact with a veto ceremony, and shake on it anyway.`,
      `It takes about ninety seconds and neither of them says the word "deal" at any point.`,
    ], ctx, hoh, other);

    api.addBond(hoh, other, 0.9);
    api.remember(other, hoh, 'promise', honest ? 2 : 3, { promise: 'one week of safety' });
    api.remember(hoh, other, 'promise', 2, { promise: 'one week of safety' });
    if (!honest) api.suspicion(other, hoh, 0.5);
    return { text, players: [hoh, other], badgeText: 'SAFETY DEAL', badgeClass: 'green' };
  },
};

const defectionOffer = {
  id: 'deals-defection',
  category: 'deals',
  weight(house, ctx) {
    const cast = _defector(house, ctx);
    if (!cast) return 0;
    // Recruiting from another alliance is worth more when yours is losing.
    const desperate = deFactoAllies(cast.outsider, house).length ? 1 : 1.5;
    return _w(band(7 * desperate), ctx);
  },
  fire(house, ctx, api) {
    const { mark, outsider, alliance, allies } = _defector(house, ctx);
    const p = pronouns(mark);
    const loyal = pStats(mark).loyalty >= 6 || isNice(mark);
    const text = loyal ? _variant([
      `${outsider} makes the offer and ${mark} turns it down without needing to think, then spends the rest of the night thinking about it.`,
      `"You're fourth in that group and you know it." ${mark} knows it. ${p.Sub} says no anyway, which tells ${outsider} something useful.`,
      `${mark} listens to the whole pitch out of politeness and reports most of it to ${alliance?.name || 'the others'} within the hour. Most of it.`,
      `${outsider} is offering a better position in a worse alliance and ${mark} can see the shape of it too clearly to take it.`,
    ], ctx, mark, outsider) : _variant([
      `${outsider} lays out where ${mark} actually stands in that alliance, with numbers, and ${mark} does not enjoy how accurate it is.`,
      `"They'll take you to fourth and no further." It is true. ${mark} has known it for a while and has been waiting for somebody to say it out loud.`,
      `${mark} does not agree to anything. ${p.Sub} also does not say no, and ${outsider} leaves knowing which of those matters.`,
      `The offer is better than the position ${mark} has, and the only thing holding ${p.obj} in place was a habit ${p.sub} has just noticed.`,
    ], ctx, mark, outsider);

    if (loyal) {
      api.addBond(mark, outsider, -0.5);
      api.suspicion(mark, outsider, 1.2);
      api.remember(mark, outsider, 'recruitment-attempt', 2, {});
    } else {
      api.addBond(mark, outsider, 1.3);
      api.remember(mark, outsider, 'offer', 2, { offer: 'a better seat' });
      api.suspicion(mark, closestTo(mark, house) || outsider, 0.8);
    }
    return {
      text, players: [mark, outsider],
      badgeText: loyal ? 'OFFER REFUSED' : 'TEMPTED',
      badgeClass: loyal ? 'blue' : 'red',
    };
  },
};

const numbersCheck = {
  id: 'deals-numbers-check',
  category: 'deals',
  weight(house, ctx) {
    if (!_nominees(ctx).length) return 0;
    const counters = house.filter(n => pStats(n).strategic >= 5 && !_nominees(ctx).includes(n));
    return counters.length ? _w(band(counters.length * 1.6), ctx) : 0;
  },
  fire(house, ctx, api) {
    const counters = _leastSeen(house.filter(n => pStats(n).strategic >= 5 && !_nominees(ctx).includes(n)));
    const a = counters[0];
    const b = closestTo(a, _others(house, a)) || counters[1] || _others(house, a)[0];
    const p = pronouns(a);
    const short = pStats(a).strategic < 7;
    const text = _variant([
      `${a} and ${b} count the vote twice on their fingers and get the same answer both times, which neither of them entirely believes.`,
      `"Say the names." ${b} says the names. ${a} makes ${pronouns(b).obj} say them again, slower, because one of them sounded wrong the first time.`,
      `They have the votes. They have had the votes since Tuesday. ${a} keeps counting anyway, because counting is the only thing there is to do.`,
      `${a} works out that the whole week comes down to one person, tells ${b} who it is, and watches ${pronouns(b).posAdj} face do something complicated.`,
    ], ctx, a, b);

    api.addBond(a, b, 0.7);
    api.remember(a, b, 'confidence', 1, { about: 'the vote count' });
    // A miscount is how blindsides happen, and the less strategic miscount more.
    if (short) api.suspicion(a, furthestFrom(a, _voters(house, ctx)) || b, 0.8);
    return { text, players: [a, b], badgeText: 'COUNTING VOTES', badgeClass: 'blue' };
  },
};

const juryManagement = {
  id: 'deals-jury-management',
  category: 'deals',
  weight(house, ctx) {
    const pair = _juryPair(house, ctx);
    if (!pair) return 0;
    return _w(band(pStats(pair.player).strategic * 1.1), ctx);
  },
  fire(house, ctx, api) {
    const { player, juror } = _juryPair(house, ctx);
    const p = pronouns(player);
    const clumsy = pStats(player).social <= 4;
    const text = clumsy ? _variant([
      `${player} tries to explain to ${juror} why the vote against ${pronouns(juror).obj} was not personal, and manages to make it sound considerably more personal.`,
      `The apology arrives about a week too early and lands as exactly what it is.`,
      `${player} says "no hard feelings" to somebody who has nothing but hard feelings.`,
      `${juror} listens to ${player} explain ${p.posAdj} game and comes away with a much clearer sense of who to vote against.`,
    ], ctx, player, juror) : _variant([
      `${player} does not apologise, which is the smart play. ${p.Sub} explains the move instead, and ${juror} hates that it was a good one.`,
      `"I'd do it again." ${juror} respects that more than ${pronouns(juror).sub} expected to, and ${player} knew ${pronouns(juror).sub} would.`,
      `${player} starts building the case for the end of the game weeks before anyone else remembers there is an end.`,
      `It is not a conversation about tonight. ${juror} works out about halfway through that it is a conversation about the last night, and answers accordingly.`,
    ], ctx, player, juror);

    api.addBond(player, juror, clumsy ? -0.7 : 0.8);
    api.remember(juror, player, clumsy ? 'insult' : 'respect', 2, { about: 'jury management' });
    api.popDelta(player, clumsy ? -1 : 1);
    return {
      text, players: [player, juror],
      badgeText: clumsy ? 'BOTCHED IT' : 'PLAYING THE END',
      badgeClass: clumsy ? 'red' : 'gold',
    };
  },
};

const competingDeals = {
  id: 'deals-competing',
  category: 'deals',
  weight(house, ctx) {
    // Somebody in two final twos at once is a collision waiting to happen.
    const doubled = house.find(n => _others(house, n).filter(m => remembers(n, m, 'final-two')).length >= 2);
    return doubled ? _w(12, ctx) : 0;
  },
  fire(house, ctx, api) {
    const player = house.find(n => _others(house, n).filter(m => remembers(n, m, 'final-two')).length >= 2);
    const partners = _others(house, player).filter(m => remembers(player, m, 'final-two')).slice(0, 2);
    const [x, y] = partners;
    const p = pronouns(player);
    const text = _variant([
      `${player} has promised the end of the game to two different people and both of them mentioned it today, four hours apart, in almost identical words.`,
      `${x} and ${y} are each certain they are sitting beside ${player} at the end. ${player} has done the arithmetic on this and it does not come out.`,
      `Two final twos. One ${player}. ${p.Sub} has been managing it beautifully for a fortnight and can feel the exact week it stops being manageable.`,
      `${player} realises, mid-conversation with ${x}, that ${p.sub} cannot remember which version of the plan ${p.sub} told ${y}.`,
    ], ctx, player, x, y);

    // The collision does not resolve yet — it becomes pressure, and a target.
    api.suspicion(x, player, 0.8);
    api.suspicion(y, player, 0.8);
    api.remember(player, x, 'overcommitted', 2, {});
    api.remember(player, y, 'overcommitted', 2, {});
    return { text, players: [player, x, y].filter(Boolean), badgeText: 'TWO FINAL TWOS', badgeClass: 'red' };
  },
};

const voteFlip = {
  id: 'deals-vote-flip',
  category: 'deals',
  weight(house, ctx) {
    if (ctx.act !== 'campaign') return 0;
    const noms = _nominees(ctx);
    const flippers = _voters(house, ctx).filter(n =>
      noms.some(nom => wasPromised(nom, n) || remembers(n, nom, 'promise')));
    return flippers.length ? _w(band(flippers.length * 3), ctx) : 0;
  },
  fire(house, ctx, api) {
    const noms = _nominees(ctx);
    const voter = _leastSeen(_voters(house, ctx).filter(n =>
      noms.some(nom => remembers(n, nom, 'promise'))))[0] || _voters(house, ctx)[0];
    const promised = noms.find(n => remembers(voter, n, 'promise')) || noms[0];
    const other = noms.find(n => n !== promised) || noms[1];
    const p = pronouns(voter);
    const keeps = pStats(voter).loyalty >= 6 || trustOf(voter, promised) >= 3;

    const text = keeps ? _variant([
      `${voter} told ${promised} ${p.sub} would vote to keep ${pronouns(promised).obj}, and ${p.sub} is going to, even though the room has moved.`,
      `Everyone else has quietly changed their mind. ${voter} has not, and does not intend to explain ${p.ref} about it.`,
      `"I said what I said." It costs ${voter} something to keep it and ${p.sub} keeps it anyway.`,
      `${voter} has one vote and one promise and considers those the same object.`,
    ], ctx, voter, promised) : _variant([
      `${voter} promised ${promised} a vote and is not going to give it. ${p.Sub} works out a way to not be alone with ${pronouns(promised).obj} for the rest of the day.`,
      `The house moved and ${voter} moved with it, which ${p.sub} would call being realistic and ${promised} will call something else.`,
      `${voter} decides, somewhere between the kitchen and the bedroom, that the promise was made under different conditions.`,
      `It is not a betrayal in ${voter}'s head. ${p.Sub} has a whole explanation ready that ${p.sub} will never be asked for.`,
    ], ctx, voter, promised);

    if (keeps) {
      api.addBond(voter, promised, 1.2);
      api.remember(promised, voter, 'loyalty', 3, { kept: true });
      api.popDelta(voter, 1);
    } else {
      api.addBond(voter, promised, -1.5);
      api.remember(promised, voter, 'betrayal', 2, { about: 'a promised vote' });
      api.addBond(voter, other, 0.6);
    }
    return {
      text, players: [voter, promised],
      badgeText: keeps ? 'KEPT THEIR WORD' : 'QUIET FLIP',
      badgeClass: keeps ? 'green' : 'red',
    };
  },
};

export const DEALS_EVENTS = [
  finalTwo,
  votePitch,
  brokenPromise,
  safetyDeal,
  defectionOffer,
  numbersCheck,
  juryManagement,
  competingDeals,
  voteFlip,
];

export default DEALS_EVENTS;
